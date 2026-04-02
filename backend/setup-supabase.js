// setup-supabase.js - Setup Supabase database configuration
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Supabase for ExamShield...');

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
const envContent = `
# Server
PORT=5000
NODE_ENV=development

# Database (Supabase)
SUPABASE_URL=https://jzxvxxgsfbzqhrirnqfm.supabase.co
SUPABASE_SERVICE_KEY=sb_publishable_y3eNbkdEjC59m67N0GiY4Q_1rOveLyL

# JWT
JWT_SECRET=examshield_jwt_secret_key_change_in_production_123456
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=examshield_refresh_secret_key_change_in_production_123456
JWT_REFRESH_EXPIRES_IN=30d

# Email (Mock for development)
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=ExamShield <noreply@examshield.com>

# Platform
PLATFORM_URL=http://localhost:3000
STUDENT_LOGIN_URL=http://localhost:3000/student/login

# Super Admin
SUPER_ADMIN_EMAIL=admin@examshield.com
SUPER_ADMIN_PASSWORD=SuperAdmin@123

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
`;

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent.trim());
  console.log('✅ Created .env file with Supabase configuration');
} else {
  console.log('⚠️  .env file already exists. Please update it manually.');
}

// Create Supabase tables setup SQL
const supabaseSQL = `
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

-- Insert default super admin
INSERT INTO super_admins (name, email, password, role)
VALUES ('Super Admin', 'admin@examshield.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', 'super_admin')
ON CONFLICT (email) DO NOTHING;
`;

// Write SQL to file for manual execution in Supabase dashboard
const sqlPath = path.join(__dirname, 'supabase-setup.sql');
fs.writeFileSync(sqlPath, supabaseSQL);

console.log('✅ Created supabase-setup.sql file');
console.log('');
console.log('📋 Next Steps:');
console.log('1. Run: npm install');
console.log('2. Go to your Supabase dashboard');
console.log('3. Open SQL Editor and run the contents of supabase-setup.sql');
console.log('4. Start the server with: npm start');
console.log('');
console.log('🌍 Supabase URL:', 'https://jzxvxxgsfbzqhrirnqfm.supabase.co');
console.log('🔑 Service Key configured');
console.log('');
console.log('✨ Setup complete!');
