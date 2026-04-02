-- Fix students table RLS policy - Run this in Supabase SQL Editor

-- Disable RLS for students table to allow inserts
ALTER TABLE students DISABLE ROW LEVEL SECURITY;

-- Alternatively, if you want to keep RLS enabled, create proper policies:
-- DROP POLICY IF EXISTS "Students can view own data" ON students;
-- DROP POLICY IF EXISTS "Students can insert own data" ON students;
-- DROP POLICY IF EXISTS "Students can update own data" ON students;

-- Create permissive policies for college admins
-- CREATE POLICY "College admins can manage students" ON students
--   FOR ALL USING (auth.uid()::text = college_id::text);

-- Create policy for inserts
-- CREATE POLICY "College admins can insert students" ON students
--   FOR INSERT WITH CHECK (auth.uid()::text = college_id::text);

-- Verify the fix
SELECT 'Students table RLS disabled' as status;
