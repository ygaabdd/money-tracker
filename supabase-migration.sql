-- Migration: Add account_id to all tables for multi-tenant support
-- This allows same app instance to serve multiple accounts

-- 1. Add account_id to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_id TEXT NOT NULL DEFAULT 'adminry';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Add account_id to wallets table
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS account_id TEXT NOT NULL DEFAULT 'adminry';
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Add account_id to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS account_id TEXT NOT NULL DEFAULT 'adminry';

-- 4. Add account_id to budgets table
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS account_id TEXT NOT NULL DEFAULT 'adminry';

-- 5. Add account_id to debts table
ALTER TABLE debts ADD COLUMN IF NOT EXISTS account_id TEXT NOT NULL DEFAULT 'adminry';
ALTER TABLE debts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes untuk faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_wallets_account_id ON wallets(account_id);
CREATE INDEX IF NOT EXISTS idx_categories_account_id ON categories(account_id);
CREATE INDEX IF NOT EXISTS idx_budgets_account_id ON budgets(account_id);
CREATE INDEX IF NOT EXISTS idx_debts_account_id ON debts(account_id);

-- Update RLS policies untuk account-based access
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
ALTER PUBLICATION supabase_realtime ADD TABLE budgets;
ALTER PUBLICATION supabase_realtime ADD TABLE debts;
