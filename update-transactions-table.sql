-- Add columns to transactions table to match schema

-- Add nonce column
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS nonce BIGINT DEFAULT 0 NOT NULL;

-- Add signature column
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS signature TEXT DEFAULT '' NOT NULL;

-- Add status column
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' NOT NULL;

-- Add fee column
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS fee NUMERIC(18,6) NULL;

-- Add metadata column
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS metadata JSONB NULL;

-- Add created_at column
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW() NOT NULL;