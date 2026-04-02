-- fix-colleges-table.sql - Fix colleges table schema
-- Run this in Supabase SQL Editor: https://jzxvxxgsfbzqhrirnqfm.supabase.co

-- Add missing columns to colleges table
ALTER TABLE colleges 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'college_admin',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have proper defaults
UPDATE colleges 
SET 
    role = 'college_admin',
    is_active = true,
    subscription_plan = 'basic',
    subscription_expiry = NOW() + INTERVAL '14 days',
    created_at = NOW(),
    updated_at = NOW()
WHERE role IS NULL OR is_active IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'colleges' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check data
SELECT 'Colleges table fixed successfully!' as status;
