-- =====================================================
-- CollegeExam - Complete SQL Schema
-- Database: PostgreSQL
-- Version: 1.0.0
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: colleges (College Admin accounts)
-- =====================================================
CREATE TABLE IF NOT EXISTS colleges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  website VARCHAR(255),
  logo_url VARCHAR(500),
  subscription_plan VARCHAR(50) DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'standard', 'premium')),
  subscription_expiry TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  is_email_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: super_admins
-- =====================================================
CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: students
-- =====================================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id VARCHAR(50) UNIQUE NOT NULL,  -- Generated unique ID like ES-2024-00001
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  roll_no VARCHAR(50) NOT NULL,
  department VARCHAR(255),
  semester VARCHAR(50),
  batch VARCHAR(50),
  phone VARCHAR(20),
  profile_photo VARCHAR(500),
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email, college_id),
  UNIQUE(roll_no, college_id)
);

-- =====================================================
-- TABLE: exams
-- =====================================================
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255),
  title VARCHAR(255),
  description TEXT,
  exam_code VARCHAR(20) UNIQUE NOT NULL, -- Unique exam key sent to students
  exam_key VARCHAR(50) UNIQUE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('mcq', 'subjective', 'coding', 'mixed')),
  subject VARCHAR(255),
  date_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  total_marks INTEGER NOT NULL,
  passing_marks INTEGER,
  instructions TEXT,
  is_proctored BOOLEAN DEFAULT true,
  max_violations INTEGER DEFAULT 3,
  allowed_attempts INTEGER DEFAULT 1,
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  created_by UUID REFERENCES colleges(id),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'completed', 'cancelled')),
  result_published BOOLEAN DEFAULT false,
  question_randomization BOOLEAN DEFAULT false,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: exam_students (students assigned to an exam)
-- =====================================================
CREATE TABLE IF NOT EXISTS exam_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  is_notified BOOLEAN DEFAULT false,
  UNIQUE(exam_id, student_id)
);

-- =====================================================
-- TABLE: exam_assignments (student exam access and progress)
-- =====================================================
CREATE TABLE IF NOT EXISTS exam_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'assigned',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(exam_id, student_id)
);

-- =====================================================
-- TABLE: questions
-- =====================================================
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('mcq', 'subjective', 'coding', 'true_false')),
  options JSONB,                -- For MCQ: [{"id":"a","text":"Option A"},...]
  correct_answer TEXT,          -- For MCQ/True-False
  marks INTEGER DEFAULT 1,
  negative_marks NUMERIC(3,1) DEFAULT 0,
  difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  order_index INTEGER DEFAULT 0,
  image_url VARCHAR(500),
  -- For coding questions
  language VARCHAR(50),
  code_template TEXT,
  test_cases JSONB,             -- [{"input":"...","expected_output":"...","is_hidden":false}]
  time_limit INTEGER DEFAULT 2000,  -- ms
  memory_limit INTEGER DEFAULT 256, -- MB
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: exam_questions (AI and exam-specific question records)
-- =====================================================
CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL DEFAULT 'mcq',
  marks INTEGER NOT NULL DEFAULT 1,
  difficulty VARCHAR(20) DEFAULT 'medium',
  question_data JSONB,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: student_question_sets (per-student randomized questions)
-- =====================================================
CREATE TABLE IF NOT EXISTS student_question_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  question_id VARCHAR(255),
  question_order INTEGER NOT NULL,
  question_data JSONB NOT NULL,
  random_seed DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, student_id, question_order)
);

-- =====================================================
-- TABLE: exam_sessions (student taking exam)
-- =====================================================
CREATE TABLE IF NOT EXISTS exam_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id),
  student_id UUID NOT NULL REFERENCES students(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'submitted', 'terminated', 'timed_out')),
  ip_address VARCHAR(45),
  browser_info TEXT,
  violation_count INTEGER DEFAULT 0,
  is_auto_submitted BOOLEAN DEFAULT false,
  auto_submit_reason VARCHAR(100),
  UNIQUE(exam_id, student_id)
);

-- =====================================================
-- TABLE: answers
-- =====================================================
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  student_id UUID NOT NULL REFERENCES students(id),
  exam_id UUID NOT NULL REFERENCES exams(id),
  answer_text TEXT,
  selected_option VARCHAR(10),  -- For MCQ
  code_submission TEXT,         -- For coding
  selected_language VARCHAR(50),
  marks_obtained NUMERIC(5,2),
  is_correct BOOLEAN,
  is_evaluated BOOLEAN DEFAULT false,
  evaluator_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, question_id)
);

-- =====================================================
-- TABLE: results
-- =====================================================
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id),
  exam_id UUID NOT NULL REFERENCES exams(id),
  session_id UUID REFERENCES exam_sessions(id),
  total_marks INTEGER,
  marks_obtained NUMERIC(6,2) DEFAULT 0,
  percentage NUMERIC(5,2),
  grade VARCHAR(5),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'pass', 'fail', 'absent', 'terminated')),
  mcq_marks NUMERIC(6,2) DEFAULT 0,
  subjective_marks NUMERIC(6,2) DEFAULT 0,
  coding_marks NUMERIC(6,2) DEFAULT 0,
  rank INTEGER,
  is_published BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ,
  evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, exam_id)
);

-- =====================================================
-- TABLE: violations (anti-cheating log)
-- =====================================================
CREATE TABLE IF NOT EXISTS violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id),
  exam_id UUID NOT NULL REFERENCES exams(id),
  type VARCHAR(100) NOT NULL, -- 'tab_switch', 'face_not_detected', 'multiple_faces', 'audio_detected', 'copy_paste', 'window_blur'
  severity VARCHAR(20) DEFAULT 'warning' CHECK (severity IN ('warning', 'critical')),
  description TEXT,
  screenshot_url VARCHAR(500),
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: subscriptions
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL CHECK (plan IN ('basic', 'standard', 'premium')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  amount NUMERIC(10,2),
  currency VARCHAR(10) DEFAULT 'INR',
  payment_id VARCHAR(255),
  payment_gateway VARCHAR(50), -- 'razorpay' or 'stripe'
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
  max_students INTEGER,
  max_exams INTEGER,
  features JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL,
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('student', 'college', 'super_admin')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'exam', 'result', 'system')),
  is_read BOOLEAN DEFAULT false,
  link VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: audit_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID,
  actor_type VARCHAR(20),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE answers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE results ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_students_college_id ON students(college_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_exams_college_id ON exams(college_id);
CREATE INDEX IF NOT EXISTS idx_exams_date_time ON exams(date_time);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam_id ON exam_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_student_id ON exam_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_exam_student ON exam_assignments(exam_id, student_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_order ON exam_questions(exam_id, order_index);
CREATE INDEX IF NOT EXISTS idx_student_question_sets_exam_student ON student_question_sets(exam_id, student_id);
CREATE INDEX IF NOT EXISTS idx_answers_session_id ON answers(session_id);
CREATE INDEX IF NOT EXISTS idx_answers_exam_student ON answers(exam_id, student_id);
CREATE INDEX IF NOT EXISTS idx_answers_session_question ON answers(session_id, question_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam_status ON exam_sessions(exam_id, status);
CREATE INDEX IF NOT EXISTS idx_violations_session_id ON violations(session_id);
CREATE INDEX IF NOT EXISTS idx_violations_exam_student ON violations(exam_id, student_id);
CREATE INDEX IF NOT EXISTS idx_violations_exam_created_at ON violations(exam_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_results_exam_id ON results(exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam_order ON questions(exam_id, order_index ASC);
CREATE INDEX IF NOT EXISTS idx_students_roll_no ON students(roll_no);
CREATE INDEX IF NOT EXISTS idx_students_lower_roll ON students(LOWER(roll_no));
CREATE INDEX IF NOT EXISTS idx_students_lower_email ON students(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_students_lower_student_id ON students(LOWER(student_id));
CREATE INDEX IF NOT EXISTS idx_students_clean_roll ON students(LOWER(REPLACE(roll_no, ' ', '')));
CREATE INDEX IF NOT EXISTS idx_students_clean_student_id ON students(LOWER(REPLACE(student_id, ' ', '')));
CREATE INDEX IF NOT EXISTS idx_exam_students_student_id ON exam_students(student_id);
CREATE INDEX IF NOT EXISTS idx_exams_status_datetime ON exams(status, date_time);
CREATE INDEX IF NOT EXISTS idx_exams_college_status ON exams(college_id, status);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_student_exam ON exam_sessions(student_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_results_exam_student ON results(exam_id, student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_college_id ON subscriptions(college_id);

-- =====================================================
-- SUBSCRIPTION PLANS reference data
-- =====================================================
-- Basic:    50 students, 10 exams/month
-- Standard: 200 students, 50 exams/month
-- Premium:  Unlimited students, unlimited exams

-- =====================================================
-- TRIGGERS: auto-update updated_at timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_colleges_updated_at ON colleges;
CREATE TRIGGER update_colleges_updated_at BEFORE UPDATE ON colleges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_exams_updated_at ON exams;
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_answers_updated_at ON answers;
CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON answers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_results_updated_at ON results;
CREATE TRIGGER update_results_updated_at BEFORE UPDATE ON results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_exam_questions_updated_at ON exam_questions;
CREATE TRIGGER update_exam_questions_updated_at BEFORE UPDATE ON exam_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
