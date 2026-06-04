#!/usr/bin/env bash
# ============================================================================
# SassyGurl Store — Database Restore Script
#
# Restores a pg_dump backup file into a PostgreSQL database.
#
# Safety features:
#   1. Validates the backup file before restoring
#   2. Requires explicit confirmation (or --force flag)
#   3. Can target a separate test database (--target-db)
#   4. Logs all operations
#
# Usage:
#   ./restore.sh <backup_file>                           # Interactive restore
#   ./restore.sh <backup_file> --target-db sassygurl_test  # Restore to test DB
#   ./restore.sh <backup_file> --force                   # Skip confirmation
#   ./restore.sh --list                                  # List available backups
#
# Environment Variables (required):
#   PGHOST, PGPORT, PGUSER, PGPASSWORD
# ============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
LOG_FILE="${BACKUP_DIR}/restore.log"

# ── Helpers ───────────────────────────────────────────────────────────────
log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE" 2>/dev/null || true
}

die() {
  log "FATAL: $1"
  exit 1
}

# ── Argument parsing ─────────────────────────────────────────────────────
BACKUP_FILE=""
TARGET_DB="${PGDATABASE:-sassygurl}"
FORCE=false
LIST_MODE=false

for arg in "$@"; do
  case $arg in
    --force)         FORCE=true ;;
    --list)          LIST_MODE=true ;;
    --target-db)     shift; TARGET_DB="${1:-}" ;;
    --target-db=*)   TARGET_DB="${arg#*=}" ;;
    *)
      if [[ -z "$BACKUP_FILE" && "$arg" != --* ]]; then
        BACKUP_FILE="$arg"
      fi
      ;;
  esac
done

# ── List mode ─────────────────────────────────────────────────────────────
if [[ "$LIST_MODE" == true ]]; then
  echo "=== Available Backups ==="
  echo ""
  echo "--- Daily ---"
  if [[ -d "${BACKUP_DIR}/daily" ]]; then
    ls -lhS "${BACKUP_DIR}/daily/sassygurl_"*.dump 2>/dev/null || echo "  (none)"
  fi
  echo ""
  echo "--- Weekly ---"
  if [[ -d "${BACKUP_DIR}/weekly" ]]; then
    ls -lhS "${BACKUP_DIR}/weekly/sassygurl_weekly_"*.dump 2>/dev/null || echo "  (none)"
  fi
  exit 0
fi

# ── Validation ────────────────────────────────────────────────────────────
if [[ -z "$BACKUP_FILE" ]]; then
  echo "Usage: $0 <backup_file> [--target-db <db_name>] [--force]"
  echo "       $0 --list"
  exit 1
fi

# Resolve relative paths against backup dir
if [[ ! -f "$BACKUP_FILE" ]]; then
  # Try in daily and weekly subdirs
  for subdir in daily weekly; do
    if [[ -f "${BACKUP_DIR}/${subdir}/${BACKUP_FILE}" ]]; then
      BACKUP_FILE="${BACKUP_DIR}/${subdir}/${BACKUP_FILE}"
      break
    fi
  done
fi

[[ -f "$BACKUP_FILE" ]] || die "Backup file not found: ${BACKUP_FILE}"

for var in PGHOST PGPORT PGUSER PGPASSWORD; do
  if [[ -z "${!var:-}" ]]; then
    die "Missing required environment variable: ${var}"
  fi
done

log "═══════════════════════════════════════════════"
log "Starting restore"
log "  Source: ${BACKUP_FILE}"
log "  Target: ${TARGET_DB} @ ${PGHOST}:${PGPORT}"
log "═══════════════════════════════════════════════"

# ── Step 1: Validate backup file ──────────────────────────────────────────
log "Step 1/3: Validating backup integrity..."

if ! pg_restore --list "$BACKUP_FILE" > /dev/null 2>> "$LOG_FILE"; then
  die "Backup file is corrupted or invalid — pg_restore --list failed"
fi

TABLE_COUNT=$(pg_restore --list "$BACKUP_FILE" 2>/dev/null | grep -c "TABLE" || echo "0")
TOTAL_ENTRIES=$(pg_restore --list "$BACKUP_FILE" 2>/dev/null | wc -l || echo "0")
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

log "  Integrity OK"
log "  Size: ${BACKUP_SIZE}"
log "  Tables: ${TABLE_COUNT}"
log "  Total entries: ${TOTAL_ENTRIES}"

# ── Step 2: Confirmation ─────────────────────────────────────────────────
if [[ "$FORCE" != true ]]; then
  echo ""
  echo "╔══════════════════════════════════════════════╗"
  echo "║           ⚠️  RESTORE CONFIRMATION            ║"
  echo "╠══════════════════════════════════════════════╣"
  echo "║  Source:  ${BACKUP_FILE}"
  echo "║  Target:  ${TARGET_DB} @ ${PGHOST}:${PGPORT}"
  echo "║  Size:    ${BACKUP_SIZE}"
  echo "║  Tables:  ${TABLE_COUNT}"
  echo "╠══════════════════════════════════════════════╣"
  echo "║  This will OVERWRITE the target database!   ║"
  echo "╚══════════════════════════════════════════════╝"
  echo ""
  read -rp "Type 'RESTORE' to confirm: " CONFIRM

  if [[ "$CONFIRM" != "RESTORE" ]]; then
    log "Restore cancelled by user"
    exit 0
  fi
fi

# ── Step 3: Restore ──────────────────────────────────────────────────────
log "Step 2/3: Creating target database if needed..."

# Create target database if it doesn't exist
PGPASSWORD="$PGPASSWORD" psql \
  -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "postgres" \
  -c "SELECT 1 FROM pg_database WHERE datname = '${TARGET_DB}'" 2>/dev/null | grep -q 1 || \
  PGPASSWORD="$PGPASSWORD" createdb \
    -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" "${TARGET_DB}" 2>> "$LOG_FILE"

log "Step 3/3: Restoring database..."

if pg_restore \
  -h "$PGHOST" \
  -p "$PGPORT" \
  -U "$PGUSER" \
  -d "$TARGET_DB" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --single-transaction \
  "$BACKUP_FILE" 2>> "$LOG_FILE"; then
  RESTORE_STATUS="SUCCESS"
else
  # pg_restore may return non-zero for warnings (like "table does not exist" for --clean)
  # Check if the database is actually accessible
  if PGPASSWORD="$PGPASSWORD" psql \
    -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$TARGET_DB" \
    -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" > /dev/null 2>&1; then
    RESTORE_STATUS="SUCCESS_WITH_WARNINGS"
  else
    RESTORE_STATUS="FAILED"
  fi
fi

# ── Post-restore verification ────────────────────────────────────────────
if [[ "$RESTORE_STATUS" != "FAILED" ]]; then
  RESTORED_TABLES=$(PGPASSWORD="$PGPASSWORD" psql \
    -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$TARGET_DB" \
    -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" \
    2>/dev/null | tr -d ' ')

  RESTORED_TRANSACTIONS=$(PGPASSWORD="$PGPASSWORD" psql \
    -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$TARGET_DB" \
    -t -c "SELECT COUNT(*) FROM \"Transactions\";" \
    2>/dev/null | tr -d ' ' || echo "N/A")

  RESTORED_USERS=$(PGPASSWORD="$PGPASSWORD" psql \
    -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$TARGET_DB" \
    -t -c "SELECT COUNT(*) FROM \"Users\";" \
    2>/dev/null | tr -d ' ' || echo "N/A")

  log ""
  log "═══════════════════════════════════════════════"
  log "Restore ${RESTORE_STATUS}"
  log "  Target DB:    ${TARGET_DB}"
  log "  Tables:       ${RESTORED_TABLES}"
  log "  Transactions: ${RESTORED_TRANSACTIONS}"
  log "  Users:        ${RESTORED_USERS}"
  log "═══════════════════════════════════════════════"
else
  die "Restore FAILED — check ${LOG_FILE} for details"
fi

exit 0
