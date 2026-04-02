-- create-tables-supabase.sql - Create all tables for ExamShield
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),(index):1 Unsafe attempt to load URL http://localhost:3000/admin/login from frame with URL chrome-error://chromewebdata/. Domains, protocols and ports must match.


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

-- Insert default super admin
INSERT INTO super_admins (name, email, password, role)
VALUES ('Super Admin', 'admin@examshield.com', '$2a$12$Eegqb8BbC9AM2CRAvSpJ9O/GIlft9TTk2BCbamP5KmhJ11/9EWZha', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Insert test college with working password
INSERT INTO colleges (name, email, password, phone, address, website, subscription_plan, is_active)
VALUES ('Test College', 'test@examshield.com', '$2a$12$iGKR0au8j09EfzWhLKJPaORI.L/UhR9DqFY4EmPvQHHceOeRT/W0e', '1234567890', 'Test Address', 'http://test.com', 'basic', true)
ON CONFLICT (email) DO NOTHING;

-- Show created tables
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
