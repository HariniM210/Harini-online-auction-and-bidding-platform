-- ============================================================================
-- Online Auction and Bidding Platform - PostgreSQL Schema
-- Database: auction_platform
-- ============================================================================
-- This file contains the complete DDL for the six-table architecture:
--   users, categories, auctions, bids, watchlists, payments
--
-- Tables are created in dependency order to avoid circular foreign key
-- references. A composite foreign key is used for auctions.winning_bid_id to
-- guarantee the referenced bid belongs to the same auction.
--
-- No SQL is executed here. Run this file in pgAdmin 4 against the
-- auction_platform database (instructions at the bottom of this file).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. users
--    Authentication and authorization.
--    Role-based access: normal users (role='user') can both buy and sell.
--    Admins (role='admin') have separate permissions enforced in the service layer.
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'admin')),
    full_name VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. categories
--    Product categorization for browsing and filtering auctions.
-- ----------------------------------------------------------------------------
CREATE TABLE categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. auctions
--    Auction listings with scheduling, status lifecycle, and recorded winner.
--    winning_bid_id is added via ALTER TABLE (see section 5) to break the
--    circular dependency between auctions and bids.
-- ----------------------------------------------------------------------------
CREATE TABLE auctions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    seller_id BIGINT NOT NULL,
    category_id BIGINT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    starting_price DECIMAL(12,2) NOT NULL CHECK (starting_price >= 0),
    min_bid_increment DECIMAL(12,2) NOT NULL CHECK (min_bid_increment > 0),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'upcoming'
        CHECK (status IN ('upcoming', 'active', 'ended', 'cancelled')),
    image_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_auction_times CHECK (end_time > start_time),
    CONSTRAINT fk_auctions_seller
        FOREIGN KEY (seller_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_auctions_category
        FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- ----------------------------------------------------------------------------
-- 4. bids
--    Immutable bid history: one row per bid, INSERT only (no UPDATE/DELETE
--    after creation) to preserve an accurate, tamper-proof record.
--    Unique constraint on (auction_id, id) supports the composite FK from auctions.
-- ----------------------------------------------------------------------------
CREATE TABLE bids (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    auction_id BIGINT NOT NULL,
    bidder_id BIGINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    bid_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_bids_auction
        FOREIGN KEY (auction_id) REFERENCES auctions(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_bids_bidder
        FOREIGN KEY (bidder_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uq_bids_auction_id_id UNIQUE (auction_id, id)
);

-- ----------------------------------------------------------------------------
-- 5. auctions.winning_bid_id (composite foreign key)
--    References bids(auction_id, id). Because both columns are included, the
--    database guarantees the winning bid belongs to the same auction.
--    NULL means no winner yet (auction still open or no bids were placed).
-- ----------------------------------------------------------------------------
ALTER TABLE auctions
    ADD COLUMN winning_bid_id BIGINT;

ALTER TABLE auctions
    ADD CONSTRAINT fk_auctions_winning_bid
    FOREIGN KEY (id, winning_bid_id)
    REFERENCES bids(auction_id, id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- 6. watchlists
--    Saved auctions per user (many-to-many relationship).
-- ----------------------------------------------------------------------------
CREATE TABLE watchlists (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    auction_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_watchlists_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_watchlists_auction
        FOREIGN KEY (auction_id) REFERENCES auctions(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_watchlists_user_auction UNIQUE (user_id, auction_id)
);

-- ----------------------------------------------------------------------------
-- 7. payments
--    Simulated payment records, stored separately from bid history.
--    UNIQUE(auction_id) enforces the one-payment-per-auction design.
-- ----------------------------------------------------------------------------
CREATE TABLE payments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    auction_id BIGINT NOT NULL,
    buyer_id BIGINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_reference VARCHAR(255),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_payments_auction
        FOREIGN KEY (auction_id) REFERENCES auctions(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_payments_buyer
        FOREIGN KEY (buyer_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uq_payments_auction UNIQUE (auction_id)
);

-- ----------------------------------------------------------------------------
-- 8. Automatic updated_at maintenance
--    A trigger function updates updated_at to NOW() on every row update.
--    Applied to users, auctions, bids, payments, and watchlists.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_auctions_updated_at
    BEFORE UPDATE ON auctions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_bids_updated_at
    BEFORE UPDATE ON bids
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_watchlists_updated_at
    BEFORE UPDATE ON watchlists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 9. Indexes
--    Foreign key columns and frequently queried columns are indexed for
--    performance on lookups, joins, bidding validation, and auction expiry.
-- ----------------------------------------------------------------------------
CREATE INDEX idx_auctions_seller_id ON auctions(seller_id);
CREATE INDEX idx_auctions_category_id ON auctions(category_id);
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_end_time ON auctions(end_time);
CREATE INDEX idx_auctions_start_time ON auctions(start_time);

CREATE INDEX idx_bids_auction_id ON bids(auction_id);
CREATE INDEX idx_bids_bidder_id ON bids(bidder_id);
CREATE INDEX idx_bids_auction_amount_desc ON bids(auction_id, amount DESC);
CREATE INDEX idx_bids_bid_time ON bids(bid_time);

CREATE INDEX idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX idx_watchlists_auction_id ON watchlists(auction_id);

CREATE INDEX idx_payments_auction_id ON payments(auction_id);
CREATE INDEX idx_payments_buyer_id ON payments(buyer_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
