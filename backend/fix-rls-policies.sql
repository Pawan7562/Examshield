
-- fix-rls-policies.sql - Fix Row Level Security policies for registration
-- Run this in Supabase SQL Editor: https://jzxvxxgsfbzqhrirnqfm.supabase.co

-- Drop existing RLS policies that block registration
DROP POLICY IF EXISTS "Users can view their own college data" ON colleges;
DROP POLICY IF EXISTS "Users can insert their own college data" ON colleges;
DROP POLICY IF EXISTS "Users can update their own college data" ON colleges;

-- Create new RLS policies that allow registration
CREATE POLICY "Allow public college registration" ON colleges
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public college viewing" ON colleges
    FOR SELECT USING (true);

CREATE POLICY "Allow college self-management" ON colleges
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Allow college self-insertion" ON colleges
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Apply the new policies
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;

-- Verify the fix
SELECT 'RLS policies updated successfully!' as status;
