-- Miden OTC Swap Board Database Schema

CREATE TABLE IF NOT EXISTS active_swaps (
    id SERIAL PRIMARY KEY,
    note_id VARCHAR(255) UNIQUE NOT NULL,
    note_type VARCHAR(20) DEFAULT 'public',
    creator_account VARCHAR(255) NOT NULL,
    offering_asset VARCHAR(100) NOT NULL,
    offering_amount NUMERIC NOT NULL,
    requesting_asset VARCHAR(100) NOT NULL,
    requesting_amount NUMERIC NOT NULL,
    status VARCHAR(50) DEFAULT 'open', -- 'open' or 'consumed'
    approval_signature TEXT,
    fulfilled_tx_id TEXT,
    fulfilled_by VARCHAR(255),
    fulfilled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE active_swaps
ADD COLUMN IF NOT EXISTS note_type VARCHAR(20) DEFAULT 'public',
ADD COLUMN IF NOT EXISTS approval_signature TEXT,
ADD COLUMN IF NOT EXISTS fulfilled_tx_id TEXT,
ADD COLUMN IF NOT EXISTS fulfilled_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_swaps_status ON active_swaps(status);
CREATE INDEX IF NOT EXISTS idx_swaps_creator ON active_swaps(creator_account);
