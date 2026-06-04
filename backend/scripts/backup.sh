#!/usr/bin/env bash
# ============================================================================
# SassyGurl Store — Automated Database Backup
#
# Creates compressed pg_dump backups with:
#   1. Local storage with 7-daily + 4-weekly rotation
#   2. Cloud upload (S3-compatible via AWS CLI or rclone)
#   3. Integrity verification via pg_restore --list
#   4. Telegram alert on failure
#   5. Log retention cleanup (only after successful backup)
#
# Usage:
#   ./backup.sh                  # Full backup with cloud sync
#   ./backup.sh --local-only     # Skip cloud upload
#   ./backup.sh --no-cleanup     # Skip log retention cleanup
#
# Environment Variables (required):
#   PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
#
# Environment Variables (optional):
#   BACKUP_DIR          — Local backup path (default: /backups)
#   BACKUP_RETENTION_DAYS — Daily retention (default: 7)
#   BACKUP_RETENTION_WEEKS — Weekly retention (default: 4)
#   BACKUP_CLOUD_BUCKET — S3 bucket URI (e.g., s3://sassygurl-backups)
#   BACKUP_CLOUD_PROVIDER — "s3" or "rclone" (default: s3)
#   TELEGRAM_BOT_TOKEN  — For failure alerts
#   TELEGRAM_CHAT_ID    — For failure alerts
#   LOG_RETENTION_DAYS  — SystemLogs cleanup threshold (default: 30)
# ============================================================================

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
RETENTION_WEEKS="${BACKUP_RETENTION_WEEKS:-4}"
CLOUD_BUCKET="${BACKUP_CLOUD_BUCKET:-}"
CLOUD_PROVIDER="${BACKUP_CLOUD_PROVIDER:-s3}"
LOG_RETENTION="${LOG_RETENTION_DAYS:-30}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DAY_OF_WEEK=$(date +%u)  # 1=Monday, 7=Sunday
BACKUP_FILE="sassygurl_${TIMESTAMP}.dump"
BACKUP_PATH="${BACKUP_DIR}/daily/${BACKUP_FILE}"
WEEKLY_DIR="${BACKUP_DIR}/weekly"
LOG_FILE="${BACKUP_DIR}/backup.log"

LOCAL_ONLY=false
NO_CLEANUP=false

for arg in "$@"; do
  case $arg in
    --local-only)  LOCAL_ONLY=true ;;
    --no-cleanup)  NO_CLEANUP=true ;;
  esac
done

# ── Helpers ───────────────────────────────────────────────────────────────
log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

alert_failure() {
  local message="$1"
  log "ALERT: ${message}"

  if [[ -n "${TELEGRAM_BOT_TOKEN:-}" && -n "${TELEGRAM_CHAT_ID:-}" ]]; then
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d chat_id="${TELEGRAM_CHAT_ID}" \
      -d text="🚨 SassyGurl Backup FAILED%0A%0A${message}%0ATimestamp: ${TIMESTAMP}" \
      -d parse_mode="HTML" \
      > /dev/null 2>&1 || true
  fi
}

alert_success() {
  local size="$1"
  if [[ -n "${TELEGRAM_BOT_TOKEN:-}" && -n "${TELEGRAM_CHAT_ID:-}" ]]; then
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d chat_id="${TELEGRAM_CHAT_ID}" \
      -d text="✅ SassyGurl Backup OK%0ASize: ${size}%0AFile: ${BACKUP_FILE}%0ATimestamp: ${TIMESTAMP}" \
      -d parse_mode="HTML" \
      > /dev/null 2>&1 || true
  fi
}

# ── Pre-flight checks ────────────────────────────────────────────────────
log "═══════════════════════════════════════════════"
log "Starting backup: ${BACKUP_FILE}"
log "═══════════════════════════════════════════════"

for var in PGHOST PGPORT PGDATABASE PGUSER PGPASSWORD; do
  if [[ -z "${!var:-}" ]]; then
    alert_failure "Missing required environment variable: ${var}"
    exit 1
  fi
done

mkdir -p "${BACKUP_DIR}/daily" "${WEEKLY_DIR}"

# ── Step 1: Create pg_dump ────────────────────────────────────────────────
log "Step 1/5: Running pg_dump..."

if ! pg_dump \
  -h "$PGHOST" \
  -p "$PGPORT" \
  -U "$PGUSER" \
  -d "$PGDATABASE" \
  -Fc \
  --no-owner \
  --no-privileges \
  --compress=6 \
  -f "$BACKUP_PATH" 2>> "$LOG_FILE"; then
  alert_failure "pg_dump failed with exit code $?"
  exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
log "  pg_dump complete: ${BACKUP_PATH} (${BACKUP_SIZE})"

# ── Step 2: Verify backup integrity ──────────────────────────────────────
log "Step 2/5: Verifying backup integrity..."

if ! pg_restore --list "$BACKUP_PATH" > /dev/null 2>> "$LOG_FILE"; then
  alert_failure "Backup verification FAILED — pg_restore --list returned error"
  rm -f "$BACKUP_PATH"
  exit 1
fi

TABLE_COUNT=$(pg_restore --list "$BACKUP_PATH" 2>/dev/null | grep -c "TABLE" || echo "0")
log "  Integrity OK — ${TABLE_COUNT} table entries found"

# ── Step 3: Weekly copy (every Sunday) ────────────────────────────────────
log "Step 3/5: Weekly rotation check..."

if [[ "$DAY_OF_WEEK" -eq 7 ]]; then
  WEEKLY_FILE="sassygurl_weekly_$(date +%Y%m%d).dump"
  cp "$BACKUP_PATH" "${WEEKLY_DIR}/${WEEKLY_FILE}"
  log "  Weekly backup created: ${WEEKLY_FILE}"
else
  log "  Not Sunday (day=${DAY_OF_WEEK}), skipping weekly copy"
fi

# ── Step 4: Cloud upload ─────────────────────────────────────────────────
log "Step 4/5: Cloud upload..."

if [[ "$LOCAL_ONLY" == true ]]; then
  log "  Skipped (--local-only flag)"
elif [[ -z "$CLOUD_BUCKET" ]]; then
  log "  Skipped (BACKUP_CLOUD_BUCKET not set)"
else
  CLOUD_TARGET="${CLOUD_BUCKET}/daily/${BACKUP_FILE}"

  if [[ "$CLOUD_PROVIDER" == "rclone" ]]; then
    if rclone copy "$BACKUP_PATH" "${CLOUD_TARGET}" --progress 2>> "$LOG_FILE"; then
      log "  Cloud upload OK (rclone): ${CLOUD_TARGET}"
    else
      alert_failure "Cloud upload failed (rclone)"
      # Continue — local backup still valid
    fi
  else
    if aws s3 cp "$BACKUP_PATH" "${CLOUD_TARGET}" --quiet 2>> "$LOG_FILE"; then
      log "  Cloud upload OK (s3): ${CLOUD_TARGET}"
    else
      alert_failure "Cloud upload failed (aws s3)"
      # Continue — local backup still valid
    fi
  fi

  # Upload weekly copy too
  if [[ "$DAY_OF_WEEK" -eq 7 && -f "${WEEKLY_DIR}/${WEEKLY_FILE}" ]]; then
    WEEKLY_CLOUD="${CLOUD_BUCKET}/weekly/${WEEKLY_FILE}"
    if [[ "$CLOUD_PROVIDER" == "rclone" ]]; then
      rclone copy "${WEEKLY_DIR}/${WEEKLY_FILE}" "${WEEKLY_CLOUD}" 2>> "$LOG_FILE" || true
    else
      aws s3 cp "${WEEKLY_DIR}/${WEEKLY_FILE}" "${WEEKLY_CLOUD}" --quiet 2>> "$LOG_FILE" || true
    fi
    log "  Weekly cloud upload sent"
  fi
fi

# ── Step 5: Rotation (cleanup old backups) ────────────────────────────────
log "Step 5/5: Rotating old backups..."

# Daily: keep last N days
DELETED_DAILY=0
find "${BACKUP_DIR}/daily" -name "sassygurl_*.dump" -mtime +"$RETENTION_DAYS" -type f | while read -r old_file; do
  rm -f "$old_file"
  DELETED_DAILY=$((DELETED_DAILY + 1))
done
log "  Daily rotation: removed files older than ${RETENTION_DAYS} days"

# Weekly: keep last N weeks
DELETED_WEEKLY=0
WEEKLY_RETENTION_DAYS=$((RETENTION_WEEKS * 7))
find "${WEEKLY_DIR}" -name "sassygurl_weekly_*.dump" -mtime +"$WEEKLY_RETENTION_DAYS" -type f | while read -r old_file; do
  rm -f "$old_file"
  DELETED_WEEKLY=$((DELETED_WEEKLY + 1))
done
log "  Weekly rotation: removed files older than ${WEEKLY_RETENTION_DAYS} days"

# ── Optional: Log retention cleanup ──────────────────────────────────────
if [[ "$NO_CLEANUP" == true ]]; then
  log "Log cleanup skipped (--no-cleanup flag)"
else
  log "Running SystemLogs retention cleanup (>${LOG_RETENTION} days)..."
  CLEANUP_RESULT=$(PGPASSWORD="$PGPASSWORD" psql \
    -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" \
    -t -c "DELETE FROM \"SystemLogs\" WHERE \"timestamp\" < NOW() - INTERVAL '${LOG_RETENTION} days';" \
    2>> "$LOG_FILE" || echo "FAILED")
  log "  Cleanup result: ${CLEANUP_RESULT} rows removed"
fi

# ── Summary ──────────────────────────────────────────────────────────────
log "═══════════════════════════════════════════════"
log "Backup COMPLETE"
log "  File:     ${BACKUP_FILE}"
log "  Size:     ${BACKUP_SIZE}"
log "  Tables:   ${TABLE_COUNT}"
log "  Cloud:    $(if [[ -n "$CLOUD_BUCKET" && "$LOCAL_ONLY" == false ]]; then echo "YES"; else echo "NO"; fi)"
log "═══════════════════════════════════════════════"

alert_success "$BACKUP_SIZE"

exit 0
