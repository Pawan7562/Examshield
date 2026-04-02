-- add-missing-columns.sql - Add missing columns to students table
-- Run this in Supabase SQL Editor: https://jzxvxxgsfbzqhrirnqfm.supabase.co

-- Add missing columns to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS roll_no VARCHAR(50),
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS batch VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_college_id ON students(college_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_roll_no ON students(roll_no);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'students' 
AND table_schema = 'public'
ORDER BY ordinal_position;
