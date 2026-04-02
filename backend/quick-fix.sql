-- Quick fix for authentication - Run this in Supabase SQL Editor

-- Drop and recreate colleges table
DROP TABLE IF EXISTS colleges CASCADE;

CREATE TABLE colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  website VARCHAR(255),
  subscription_plan VARCHAR(50) DEFAULT 'basic',
  subscription_expiry TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS temporarily
ALTER TABLE colleges DISABLE ROW LEVEL SECURITY;

-- Insert test college with bcrypt password
INSERT INTO colleges (
  name, 
  email, 
  password, 
  phone, 
  address, 
  website, 
  subscription_plan, 
  is_active,
  subscription_expiry
) VALUES (
  'Test College',
  'test@examshield.com',
  '$2a$12$iGKR0au8j09EfzWhLKJPaORI.L/UhR9DqFY4EmPvQHHceOeRT/W0e',
  '1234567890',
  'Test Address',
  'http://test.com',
  'basic',
  true,
  NOW() + INTERVAL '14 days'
);

-- Create super_admins table
DROP TABLE IF EXISTS super_admins CASCADE;

CREATE TABLE super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'super_admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert super admin
INSERT INTO super_admins (name, email, password, role)
VALUES ('Super Admin', 'admin@examshield.com', '$2a$12$Eegqb8BbC9AM2CRAvSpJ9O/GIlft9TTk2BCbamP5KmhJ11/9EWZha', 'super_admin');

-- Verify data
SELECT 'Colleges table created with test data!' as status;
SELECT COUNT(*) as college_count FROM colleges;
SELECT COUNT(*) as admin_count FROM super_admins;
