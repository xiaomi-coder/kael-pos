-- Add auth_id column to link our users table to Supabase Auth
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for fast lookup during login session restore
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
