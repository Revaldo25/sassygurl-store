# SassyGurl Store - Recovery Runbook

This document provides actionable steps for diagnosing and recovering the SassyGurl Store system in an emergency.

## 1. Stopping the API Safely

If the system is compromised, malfunctioning, or undergoing emergency maintenance, you must stop the API to prevent further transactions.

**Option A (Docker/Container Environment):**
```bash
docker stop sassygurl-api
```

**Option B (Systemd/Linux Server):**
```bash
sudo systemctl stop sassygurl-api
```

**Option C (Local/Windows/IIS):**
- Stop the process in IIS or run `taskkill /F /IM SassyGurl.Api.exe`

*Verify it is stopped by attempting to visit the API URL. It should fail to connect.*

---

## 2. Restoring from Backup

The database is backed up via `pg_dump`. 

1. **Locate the Backup File:**
   Check your configured `BACKUP_DIR` (e.g., `/backups/daily/`). Find the latest `.dump` file.

2. **Drop the Existing Database (DANGER!):**
   *Double check that you are operating on the correct environment!*
   ```bash
   dropdb -h localhost -U postgres sassygurl
   createdb -h localhost -U postgres sassygurl
   ```

3. **Restore the Backup:**
   ```bash
   pg_restore -h localhost -U postgres -d sassygurl -1 /backups/daily/sassygurl_TIMESTAMP.dump
   ```
   *Note: `-1` flag executes the restore as a single transaction.*

---

## 3. Verifying the Restore

Once restored, restart the API.

1. Start the API service.
2. Check the logs for EF Core migration errors. 
3. Run a quick validation query via `psql`:
   ```sql
   SELECT count(*) FROM "User";
   SELECT count(*) FROM "Transaction";
   ```
   Ensure these match expectations.

---

## 4. Validating Provider Status

After restoring, we must ensure the connection to VIP Reseller and Digiflazz is healthy.

1. Navigate to **Admin Dashboard -> Ops Status** (or call `GET /api/ops/status`).
2. Verify **Digiflazz** and **VIP Reseller** report `Status = Online`.
3. Check **Last Catalog Sync** is not `N/A`. If it is severely outdated, run a manual sync from the **Catalog Health** page.

---

## 5. Confirming Admin Access

1. Open the frontend and log in.
2. Verify you have `SUPERADMIN` access.
3. If the restore rolled back the `SUPERADMIN` password, log in with the old password or use the database seeding script to recreate the admin user.

---

## 6. Confirming Checkout Still Works

1. Log in as a test `MEMBER` account.
2. Attempt to create a transaction for a small product (e.g., Free Fire 5 Diamonds).
3. If using Xendit, use the Xendit test payment simulator to simulate a successful payment.
4. Confirm the transaction moves to `SUCCESS` state, proving the integration with the provider is working.

---

## 7. Escalation

If the recovery fails, or the backup is corrupted:

1. Escalate immediately to the Lead Engineer / Database Administrator.
2. Gather logs from `SystemLogs` table (if accessible) or raw container logs.
3. Do NOT attempt to forcefully manually insert missing transactions. Use provider reconciliation dashboards (e.g., Digiflazz Dashboard) to cross-reference successful top-ups against our missing local records.
