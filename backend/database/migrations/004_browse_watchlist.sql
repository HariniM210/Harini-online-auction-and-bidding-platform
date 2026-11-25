BEGIN;
-- Fails safely if duplicate watchlist pairs already exist; does not delete records.
CREATE UNIQUE INDEX IF NOT EXISTS ux_browse_watchlist_pair ON public.watchlists(user_id,auction_id);
CREATE INDEX IF NOT EXISTS ix_browse_bid_amount ON public.bids(auction_id,amount DESC);
CREATE INDEX IF NOT EXISTS ix_browse_auction_category ON public.auctions(category_id);
INSERT INTO public.categories(name) SELECT n FROM unnest(ARRAY['Electronics','Vehicles','Collectibles','Home & Living','Watches','Fashion','Books & Media','Sports','Others']) AS t(n) WHERE NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.name=t.n);
COMMIT;
