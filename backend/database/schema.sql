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
    mobile_number VARCHAR(16),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_auction_times CHECK (end_time > start_time),
    CONSTRAINT fk_auctions_seller
        FOREIGN KEY (seller_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_auctions_category
        FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_users_mobile_number
CHECK (
    mobile_number IS NULL
    OR mobile_number ~ '^[+]91[6-9][0-9]{9}$'
);
