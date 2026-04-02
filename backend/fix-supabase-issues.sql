-- fix-supabase-issues.sql - MCP-guided database fixes
-- Run this in Supabase SQL Editor: https://jzxvxxgsfbzqhrirnqfm.supabase.co

-- MCP Priority 1: Query Performance - Add missing indexes
CREATE INDEX IF NOT EXISTS idx_colleges_email ON colleges(email);
CREATE INDEX IF NOT EXISTS idx_colleges_is_active ON colleges(is_active);
CREATE INDEX IF NOT EXISTS idx_super_admins_email ON super_admins(email);

-- MCP Priority 3: Security & RLS - Ensure proper policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON colleges;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON colleges;
DROP POLICY IF EXISTS "Enable update for owners" ON colleges;

-- Create proper RLS policies
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON colleges
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON colleges
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for owners" ON colleges
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Similar for super_admins
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for super admins" ON super_admins
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for super admins" ON super_admins
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- MCP Priority 4: Schema Design - Add missing constraints
ALTER TABLE colleges 
  ADD CONSTRAINT check_subscription_plan 
  CHECK (subscription_plan IN ('basic', 'premium', 'enterprise'));

ALTER TABLE colleges 
  ADD CONSTRAINT check_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- MCP Priority 5: Concurrency - Add proper defaults
ALTER TABLE colleges 
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Verify the fixes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('colleges', 'super_admins')
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('colleges', 'super_admins')
ORDER BY tablename, policyname;
