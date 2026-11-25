BEGIN;
CREATE TABLE IF NOT EXISTS public.auction_orders (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 auction_id bigint NOT NULL UNIQUE REFERENCES public.auctions(id),
 buyer_id bigint NOT NULL REFERENCES public.users(id),
 seller_id bigint NOT NULL REFERENCES public.users(id),
 amount_paise bigint NOT NULL CHECK(amount_paise>0),
 deadline timestamptz NOT NULL,
 deferred_at timestamptz,
 address_snapshot jsonb,
 gateway_order_id text UNIQUE,
 gateway_payment_id text UNIQUE,
 paid_at timestamptz,
 shipped_at timestamptz,
 delivered_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(buyer_id<>seller_id),
 CHECK(paid_at IS NULL OR (gateway_payment_id IS NOT NULL AND address_snapshot IS NOT NULL)),
 CHECK(shipped_at IS NULL OR paid_at IS NOT NULL),
 CHECK(delivered_at IS NULL OR shipped_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS ix_auction_orders_buyer ON public.auction_orders(buyer_id);
CREATE INDEX IF NOT EXISTS ix_auction_orders_seller ON public.auction_orders(seller_id);
COMMIT;
