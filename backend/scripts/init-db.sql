-- ============================================================================
-- SassyGurl Store — Initial Database Migration Script
-- PostgreSQL 16
--
-- This script creates:
--   1. AuditableTransactions table (new audit trail system)
--   2. SystemLogs table (Serilog sink target)
--   3. TransactionStatus enum type
--   4. Required indexes for performance
--
-- NOTE: This script is additive — it does NOT modify existing tables.
--       Run alongside EF Core migrations for the original schema.
-- ============================================================================

-- ─── Transaction Status Enum ─────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
        CREATE TYPE transaction_status AS ENUM (
            'Created',
            'PaymentPending',
            'PaymentReceived',
            'Processing',
            'Fulfilled',
            'Completed',
            'Failed',
            'Refunding',
            'Refunded',
            'Cancelled',
            'Expired'
        );
    END IF;
END
$$;

-- ─── Auditable Transactions Table ────────────────────────────────────────
-- Stores transactions with JSONB audit trails for automatic status tracking.
CREATE TABLE IF NOT EXISTS "AuditableTransaction" (
    "id"                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "orderNumber"               VARCHAR(50) NOT NULL,
    "status"                    INTEGER NOT NULL DEFAULT 0,
    "amount"                    DECIMAL(18, 2) NOT NULL DEFAULT 0,
    "auditLog"                  JSONB NOT NULL DEFAULT '[]'::jsonb,
    "originalTransactionId"     VARCHAR(255),
    "createdAt"                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint on order number
    CONSTRAINT "UQ_AuditableTransaction_OrderNumber" UNIQUE ("orderNumber")
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS "IX_AuditableTransaction_Status"
    ON "AuditableTransaction" ("status");

CREATE INDEX IF NOT EXISTS "IX_AuditableTransaction_CreatedAt"
    ON "AuditableTransaction" ("createdAt" DESC);

CREATE INDEX IF NOT EXISTS "IX_AuditableTransaction_OrderNumber"
    ON "AuditableTransaction" ("orderNumber");

-- GIN index on JSONB AuditLog for querying audit entries
CREATE INDEX IF NOT EXISTS "IX_AuditableTransaction_AuditLog"
    ON "AuditableTransaction" USING GIN ("auditLog");

-- ─── System Logs Table (Serilog Sink) ────────────────────────────────────
-- This table is auto-created by Serilog's PostgreSQL sink (needAutoCreateTable: true),
-- but we define it explicitly here for documentation and to ensure the schema
-- matches expectations in production environments where auto-create may be disabled.
CREATE TABLE IF NOT EXISTS "SystemLogs" (
    "id"                SERIAL PRIMARY KEY,
    "message"           TEXT,
    "message_template"  TEXT,
    "level"             VARCHAR(50),
    "timestamp"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "exception"         TEXT,
    "log_event"         JSONB,
    "properties"        JSONB
);

-- Index for querying logs by level and time range
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_Level_Timestamp"
    ON "SystemLogs" ("level", "timestamp" DESC);

-- Index for searching structured properties
CREATE INDEX IF NOT EXISTS "IX_SystemLogs_Properties"
    ON "SystemLogs" USING GIN ("properties");

-- ─── Cleanup: Auto-purge old logs (optional scheduled job) ──────────────
-- Run this as a cron job or pg_cron to keep the SystemLogs table manageable:
-- DELETE FROM "SystemLogs" WHERE "timestamp" < NOW() - INTERVAL '30 days';

COMMENT ON TABLE "AuditableTransaction" IS 'Transactions with automatic JSONB audit trail. Status changes are recorded by EF Core SaveChangesInterceptor.';
COMMENT ON COLUMN "AuditableTransaction"."auditLog" IS 'Chronological array of status change entries: [{timestamp, fromStatus, toStatus, changedBy, metadata}]';
COMMENT ON TABLE "SystemLogs" IS 'Structured log sink for Serilog. Stores Warning+ level logs with JSONB properties for searchability.';
