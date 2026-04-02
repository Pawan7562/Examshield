-- create-supabase-tables.sql - Create all necessary tables in Supabase
-- Run this in Supabase SQL Editor: https://jzxvxxgsfbzqhrirnqfm.supabase.co

-- Create colleges table
CREATE TABLE IF NOT EXISTS colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  website VARCHAR(255),
  subscription_plan VARCHAR(50) DEFAULT 'basic',
  subscription_expiry TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create super_admins table
CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'super_admin',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  amount DECIMAL(10,2) DEFAULT 0,
  max_students INTEGER DEFAULT 50,
  max_exams INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  student_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100),
  type VARCHAR(20) DEFAULT 'mcq',
  duration INTEGER NOT NULL,
  total_marks INTEGER DEFAULT 100,
  exam_code VARCHAR(10) UNIQUE NOT NULL,
  date_time TIMESTAMP,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now, can be restricted later)
CREATE POLICY "Enable insert for all users" ON colleges FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for all users" ON colleges FOR SELECT USING (true);
CREATE POLICY "Enable update for all users" ON colleges FOR UPDATE USING (true);

CREATE POLICY "Enable insert for all users" ON super_admins FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for all users" ON super_admins FOR SELECT USING (true);
CREATE POLICY "Enable update for all users" ON super_admins FOR UPDATE USING (true);

CREATE POLICY "Enable insert for all users" ON subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for all users" ON subscriptions FOR SELECT USING (true);
CREATE POLICY "Enable update for all users" ON subscriptions FOR UPDATE USING (true);

CREATE POLICY "Enable insert for all users" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for all users" ON students FOR SELECT USING (true);
CREATE POLICY "Enable update for all users" ON students FOR UPDATE USING (true);

CREATE POLICY "Enable insert for all users" ON exams FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for all users" ON exams FOR SELECT USING (true);
CREATE POLICY "Enable update for all users" ON exams FOR UPDATE USING (true);
