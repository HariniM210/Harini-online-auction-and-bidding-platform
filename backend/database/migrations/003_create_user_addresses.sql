BEGIN;
CREATE TABLE public.user_addresses (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 full_name VARCHAR(255) NOT NULL CHECK (length(trim(full_name)) > 0),
 mobile_number VARCHAR(16) NOT NULL CHECK (mobile_number ~ '^[+]91[6-9][0-9]{9}$'),
 address_line1 VARCHAR(255) NOT NULL CHECK (length(trim(address_line1)) > 0),
 address_line2 VARCHAR(255) NOT NULL DEFAULT '',
 city VARCHAR(100) NOT NULL CHECK (length(trim(city)) > 0),
 state VARCHAR(100) NOT NULL CHECK (length(trim(state)) > 0),
 pin_code VARCHAR(6) NOT NULL CHECK (pin_code ~ '^[1-9][0-9]{5}$'),
 country VARCHAR(50) NOT NULL DEFAULT 'India' CHECK (country = 'India'),
 address_type VARCHAR(10) NOT NULL CHECK (address_type IN ('Home','Work','Other')),
 is_default BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_addresses_user ON public.user_addresses(user_id);
CREATE UNIQUE INDEX uq_user_addresses_default ON public.user_addresses(user_id) WHERE is_default;
COMMIT;
