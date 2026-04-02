-- COMPLETE DATABASE FIX - Run this in Supabase SQL Editor
-- URL: https://jzxvxxgsfbzqhrirnqfm.supabase.co

-- =====================================================
-- STEP 1: Fix Students Table Schema
-- =====================================================

-- Add all missing columns to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS roll_no VARCHAR(50),
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS batch VARCHAR(50),
ADD COLUMN IF NOT EXISTS semester VARCHAR(50),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS student_id VARCHAR(20),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================================
-- STEP 2: Create Proper Indexes
-- =====================================================

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_students_college_id;
DROP INDEX IF EXISTS idx_students_email;
DROP INDEX IF EXISTS idx_students_student_id;
DROP INDEX IF EXISTS idx_students_roll_no;

-- Create new indexes
CREATE INDEX idx_students_college_id ON students(college_id);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_roll_no ON students(roll_no);
CREATE INDEX idx_students_is_active ON students(is_active);

-- =====================================================
-- STEP 3: Fix Colleges Table
-- =====================================================

-- Add missing columns to colleges table
ALTER TABLE colleges 
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================================
-- STEP 4: Fix Exams Table
-- =====================================================

-- Add missing columns to exams table
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES colleges(id);

-- =====================================================
-- STEP 5: Create Missing Tables
-- =====================================================

-- Create subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create results table if it doesn't exist
CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE,
    evaluated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 6: Insert Default Data
-- =====================================================

-- Update existing colleges with subscription info
UPDATE colleges 
SET subscription_plan = 'basic',
    subscription_expiry = NOW() + INTERVAL '14 days'
WHERE subscription_expiry IS NULL;

-- =====================================================
-- STEP 7: Verify Everything
-- =====================================================

-- Check final students table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'students' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check data exists
SELECT 'students' as table_name, COUNT(*) as record_count FROM students
UNION ALL
SELECT 'colleges' as table_name, COUNT(*) as record_count FROM colleges
UNION ALL
SELECT 'exams' as table_name, COUNT(*) as record_count FROM exams
UNION ALL
SELECT 'subscriptions' as table_name, COUNT(*) as record_count FROM subscriptions
UNION ALL
SELECT 'results' as table_name, COUNT(*) as record_count FROM results;

-- =====================================================
-- STEP 8: Enable Row Level Security
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own college data" ON students
    FOR ALL USING (auth.uid()::text = college_id::text);

CREATE POLICY "Users can insert their own college data" ON students
    FOR INSERT WITH CHECK (auth.uid()::text = college_id::text);

CREATE POLICY "Users can update their own college data" ON students
    FOR UPDATE USING (auth.uid()::text = college_id::text);

CREATE POLICY "Users can view their own college data" ON colleges
    FOR ALL USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert their own college data" ON colleges
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own college data" ON colleges
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view their own college data" ON exams
    FOR ALL USING (auth.uid()::text = college_id::text);

CREATE POLICY "Users can insert their own college data" ON exams
    FOR INSERT WITH CHECK (auth.uid()::text = college_id::text);

CREATE POLICY "Users can update their own college data" ON exams
    FOR UPDATE USING (auth.uid()::text = college_id::text);

CREATE POLICY "Users can view all results" ON results
    FOR ALL USING (true);

CREATE POLICY "Users can insert results" ON results
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update results" ON results
    FOR UPDATE WITH CHECK (true);

-- =====================================================
-- COMPLETE SUCCESS MESSAGE
-- =====================================================

SELECT 'Database schema fix completed successfully!' as status;
