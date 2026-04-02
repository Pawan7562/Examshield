-- disable-realtime.sql - Disable realtime for all ExamShield tables
-- Run this in Supabase SQL Editor: https://jzxvxxgsfbzqhrirnqfm.supabase.co

-- Disable realtime for colleges table
ALTER TABLE colleges SET (realtime = false);

-- Disable realtime for super_admins table  
ALTER TABLE super_admins SET (realtime = false);

-- Disable realtime for subscriptions table
ALTER TABLE subscriptions SET (realtime = false);

-- Disable realtime for students table
ALTER TABLE students SET (realtime = false);

-- Disable realtime for exams table
ALTER TABLE exams SET (realtime = false);

-- Verify realtime is disabled
SELECT 
  schemaname,
  tablename,
  relisrealtime as realtime_enabled
FROM pg_class 
JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid 
WHERE relname IN ('colleges', 'super_admins', 'subscriptions', 'students', 'exams')
  AND relkind = 'r';
