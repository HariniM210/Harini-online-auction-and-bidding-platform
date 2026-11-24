-- ============================================================================
-- Migration: 001_enforce_bid_immutability.sql
-- Database: auction_platform
-- Description: Apply bid immutability enforcement and composite FK fix to
--              the existing auction_platform database.
--
-- This migration is SAFE to run on an existing database:
--   - All six tables are preserved (no DROP/CREATE TABLE)
--   - All existing bid records are preserved (no DELETE on bids)
--   - bids.updated_at column is preserved if it exists
--   - Wrapped in a transaction for atomicity
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Step 1: Create the bid immutability function
-- Blocks UPDATE and DELETE on the bids table by raising an exception.
-- CREATE OR REPLACE makes this idempotent.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_bids_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Bids are immutable. UPDATE and DELETE operations are not allowed.';
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Step 2: Remove the old trg_bids_updated_at trigger on bids if it exists
-- The original schema had an updated_at trigger on bids. Since bids are now
-- immutable, this trigger is unnecessary and would conflict with immutability.
-- DROP TRIGGER IF EXISTS makes this idempotent.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_bids_updated_at ON bids;

-- ----------------------------------------------------------------------------
-- Step 3: Create bid immutability triggers
-- PostgreSQL does NOT support CREATE TRIGGER IF NOT EXISTS, so we use
-- DROP TRIGGER IF EXISTS followed by CREATE TRIGGER for idempotency.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_bids_immutable_update ON bids;
CREATE TRIGGER trg_bids_immutable_update
    BEFORE UPDATE ON bids
    FOR EACH ROW
    EXECUTE FUNCTION prevent_bids_modification();

DROP TRIGGER IF EXISTS trg_bids_immutable_delete ON bids;
CREATE TRIGGER trg_bids_immutable_delete
    BEFORE DELETE ON bids
    FOR EACH ROW
    EXECUTE FUNCTION prevent_bids_modification();

-- ----------------------------------------------------------------------------
-- Step 4: Drop the existing composite foreign key on auctions if present
-- We do NOT assume the constraint name. A DO block dynamically finds any
-- foreign key on auctions that references bids(auction_id, id) via
-- winning_bid_id and drops it. This is safe even if no such constraint exists.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    existing_constraint_name text;
BEGIN
    SELECT conname INTO existing_constraint_name
    FROM pg_constraint
    WHERE conrelid = 'auctions'::regclass
      AND confrelid = 'bids'::regclass
      AND contype = 'f'
      AND pg_get_constraintdef(oid) LIKE '%winning_bid_id%';

    IF existing_constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE auctions DROP CONSTRAINT %I', existing_constraint_name);
    END IF;
END
$$;

-- ----------------------------------------------------------------------------
-- Step 5: Create the corrected composite foreign key
-- References auctions(id, winning_bid_id) -> bids(auction_id, id)
-- ON DELETE RESTRICT ON UPDATE CASCADE
-- This guarantees the winning bid belongs to the same auction.
-- ----------------------------------------------------------------------------
ALTER TABLE auctions
    ADD CONSTRAINT fk_auctions_winning_bid
    FOREIGN KEY (id, winning_bid_id)
    REFERENCES bids(auction_id, id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;

-- ============================================================================
-- Verification Queries
-- Run these separately after the migration to confirm success.
-- ============================================================================

-- Verify bid immutability triggers exist
SELECT
    tgname AS trigger_name,
    pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid = 'bids'::regclass
  AND tgname IN ('trg_bids_immutable_update', 'trg_bids_immutable_delete')
ORDER BY tgname;

-- Verify the old trg_bids_updated_at trigger is gone
SELECT
    tgname AS removed_trigger_name
FROM pg_trigger
WHERE tgrelid = 'bids'::regclass
  AND tgname = 'trg_bids_updated_at';

-- Verify composite FK action is RESTRICT (not SET NULL)
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'auctions'::regclass
  AND conname = 'fk_auctions_winning_bid';

-- Verify bid record count is preserved (should match pre-migration count)
SELECT count(*) AS total_bids FROM bids;

-- Verify auction count is preserved
SELECT count(*) AS total_auctions FROM auctions;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

