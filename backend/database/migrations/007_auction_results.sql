BEGIN;
CREATE INDEX IF NOT EXISTS ix_auctions_finalization_due ON public.auctions(end_time,id) WHERE status IN ('upcoming','active');
COMMIT;
