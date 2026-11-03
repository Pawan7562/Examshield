-- ====================================================================
-- ExamShield High-Concurrency Database Initialization (PostgreSQL 16)
-- Optimised for 2,000+ Concurrent Students with PgBouncer Multiplexing
-- ====================================================================

-- 1. Create Staging & Production Databases if they don't exist
SELECT 'CREATE DATABASE examshield_staging'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'examshield_staging')\gexec

SELECT 'CREATE DATABASE examshield_prod'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'examshield_prod')\gexec

-- 2. Configure Extensions & Schema on examshield_staging
\c examshield_staging;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Essential High-Performance Composite Indexes for Staging
CREATE INDEX IF NOT EXISTS idx_students_email_lower 
  ON students (LOWER(TRIM(email)));

CREATE INDEX IF NOT EXISTS idx_students_student_code 
  ON students (student_id);

CREATE INDEX IF NOT EXISTS idx_exam_sessions_student_exam_started 
  ON exam_sessions (student_id, exam_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_exam_assignments_exam_student 
  ON exam_assignments (exam_id, student_id);

CREATE INDEX IF NOT EXISTS idx_answers_session_question 
  ON answers (session_id, question_id);

CREATE INDEX IF NOT EXISTS idx_results_student_exam 
  ON results (student_id, exam_id);

-- 3. Configure Extensions & Schema on examshield_prod
\c examshield_prod;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE INDEX IF NOT EXISTS idx_students_email_lower 
  ON students (LOWER(TRIM(email)));

CREATE INDEX IF NOT EXISTS idx_students_student_code 
  ON students (student_id);

CREATE INDEX IF NOT EXISTS idx_exam_sessions_student_exam_started 
  ON exam_sessions (student_id, exam_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_exam_assignments_exam_student 
  ON exam_assignments (exam_id, student_id);

CREATE INDEX IF NOT EXISTS idx_answers_session_question 
  ON answers (session_id, question_id);

CREATE INDEX IF NOT EXISTS idx_results_student_exam 
  ON results (student_id, exam_id);
