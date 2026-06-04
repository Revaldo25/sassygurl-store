# SassyGurl Store — Recovery Runbook

## Quick Reference

| Action | Command |
|--------|---------|
| List backups | `docker exec sassygurl-backup /scripts/restore.sh --list` |
| Manual backup | `docker exec sassygurl-backup /scripts/backup.sh` |
| Restore (test DB) | `docker exec sassygurl-backup /scripts/restore.sh <file> --target-db sassygurl_test` |
| Restore (production) | `docker exec sassygurl-backup /scripts/restore.sh <file> --force` |
| Check backup logs | `docker exec sassygurl-backup cat /backups/backup.log` |

---

## 1. Database Restore Procedure

### 1.1 Restore to Test Database (RECOMMENDED FIRST STEP)

```bash
# List available backups
docker exec sassygurl-backup /scripts/restore.sh --list

# Restore to a separate test database
docker exec sassygurl-backup /scripts/restore.sh sassygurl_20260529_020000.dump --target-db sassygurl_restore_test

# Verify data in the test database
docker exec sassygurl-postgres psql -U sassygurl_user -d sassygurl_restore_test -c "SELECT COUNT(*) FROM \"Transactions\";"
docker exec sassygurl-postgres psql -U sassygurl_user -d sassygurl_restore_test -c "SELECT COUNT(*) FROM \"Users\";"
docker exec sassygurl-postgres psql -U sassygurl_user -d sassygurl_restore_test -c "SELECT COUNT(*) FROM \"Products\";"
```

### 1.2 Restore to Production Database

> ⚠️ This will OVERWRITE the production database. Only do this if the production database is corrupted or lost.

```bash
# Stop the API service first
docker-compose stop api

# Restore
docker exec sassygurl-backup /scripts/restore.sh sassygurl_20260529_020000.dump --force

# Restart the API service
docker-compose start api

# Verify the API is healthy
curl http://localhost:5000/health
```

---

## 2. Provider Failover Manual Override

### 2.1 Switch Active Provider

```bash
# Via API (requires SUPERADMIN auth token)
curl -X PATCH http://localhost:5000/api/settings/provider/Digiflazz \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json"

# Or switch to VIP Reseller
curl -X PATCH http://localhost:5000/api/settings/provider/VipReseller \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json"
```

### 2.2 Disable Smart Failover

If failover is causing issues, disable it via settings:

```bash
curl -X PUT http://localhost:5000/api/settings \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"key": "EnableSmartFailover", "value": "false"}'
```

---

## 3. Post-Recovery Health Check

After any restore or failover, verify these in order:

1. **Database connectivity**: `curl http://localhost:5000/health`
2. **API responsiveness**: `curl http://localhost:5000/api/catalog/games`
3. **Auth system**: Log in via admin panel
4. **Catalog integrity**: Check `/admin/catalog-health`
5. **Transaction flow**: Check `/admin` → Transactions tab
6. **Provider status**: Check `/admin` → Providers tab
7. **SignalR**: Verify real-time updates appear in admin dashboard

---

## 4. Environment Variable Reference

All secrets are stored in `.env` file (never committed). See `.env.example` for the complete list.

Critical variables for disaster recovery:
- `POSTGRES_PASSWORD` — Database access
- `JWT_SECRET_KEY` — API authentication (changing this invalidates all sessions)
- `BACKUP_CLOUD_BUCKET` — Cloud backup location
- `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` — Cloud backup credentials

---

## 5. Escalation Matrix

| Severity | Scenario | Action |
|----------|----------|--------|
| P0 | Database lost / corrupted | Restore from latest backup immediately |
| P0 | All providers down | Switch to manual processing, alert admin |
| P1 | Payment webhook failures | Check Midtrans/Xendit dashboard, verify IP whitelist |
| P1 | Redis down | Restart Redis container, check distributed locks |
| P2 | Catalog sync failed | Manual sync via admin panel |
| P3 | Notification failures | Check Telegram/WhatsApp API keys |
