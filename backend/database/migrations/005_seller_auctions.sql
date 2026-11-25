BEGIN;
-- Preserve existing constraints. Verify that cancellation is allowed before using it.
CREATE INDEX IF NOT EXISTS ix_seller_auctions ON public.auctions(seller_id,created_at DESC);
COMMIT;
-- Inspect status constraint; if cancelled is absent, share this output before changing it.
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='public.auctions'::regclass AND contype='c';
