BEGIN;
CREATE INDEX IF NOT EXISTS ix_bids_auction_amount ON public.bids(auction_id, amount DESC, id ASC);
CREATE OR REPLACE FUNCTION public.guard_live_bid() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE a public.auctions%ROWTYPE; highest numeric;
BEGIN
 SELECT * INTO a FROM public.auctions WHERE id=NEW.auction_id FOR UPDATE;
 IF NOT FOUND OR a.status NOT IN ('active','upcoming') OR clock_timestamp()<a.start_time OR clock_timestamp()>=a.end_time THEN RAISE EXCEPTION 'Auction is not accepting bids' USING ERRCODE='23514'; END IF;
 IF a.seller_id=NEW.bidder_id THEN RAISE EXCEPTION 'Cannot bid on your own auction' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.users WHERE id=NEW.bidder_id AND is_active AND role='user') THEN RAISE EXCEPTION 'Bidder is not eligible' USING ERRCODE='23514'; END IF;
 SELECT max(amount) INTO highest FROM public.bids WHERE auction_id=a.id;
 IF NEW.amount IS NULL OR NEW.amount<=0 OR NEW.amount<COALESCE(highest+a.min_bid_increment,a.starting_price) THEN RAISE EXCEPTION 'Bid is below the minimum' USING ERRCODE='23514'; END IF;
 NEW.bid_time=clock_timestamp();
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_guard_live_bid ON public.bids;
CREATE TRIGGER trg_guard_live_bid BEFORE INSERT ON public.bids FOR EACH ROW EXECUTE FUNCTION public.guard_live_bid();
COMMIT;
