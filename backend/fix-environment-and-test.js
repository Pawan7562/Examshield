// fix-environment-and-test.js - Fix environment issues and test login
const fs = require('fs');
const path = require('path');

// Step 1: Ensure .env file exists and is properly loaded
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file missing! Creating...');
  const envContent = `# Supabase Configuration
SUPABASE_URL=https://jzxvxxgsfbzqhrirnqfm.supabase.co
SUPABASE_SERVICE_KEY=sb_publishable_Y3eNbkdEjC59m67N0GiY4Q_1rOveLyL

# JWT Configuration
JWT_SECRET=examshield_jwt_secret_key_change_in_production_123456
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=examshield_refresh_secret_key_change_in_production_123456
JWT_REFRESH_EXPIRES_IN=30d

# Server Configuration
PORT=5000
NODE_ENV=development`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created');
}

// Step 2: Load environment variables properly
require('dotenv').config({ path: envPath });

// Step 3: Verify environment variables
console.log('\n🔍 Environment Variable Check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Configured' : '❌ Missing');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅ Configured' : '❌ Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing');

// Step 4: Test Supabase connection with proper environment
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testLoginWithFixedEnv() {
  console.log('\n🚀 Testing Login with Fixed Environment...');
  
  try {
    // Test database connection
    console.log('📊 Testing database connection...');
    const { data: colleges, error } = await supabase
      .from('colleges')
      .select('*')
      .eq('email', 'test@examshield.com');
    
    if (error) {
      console.error('❌ Database error:', error);
      return;
    }
    
    console.log(`✅ Found ${colleges.length} colleges`);
    
    if (colleges.length > 0) {
      const college = colleges[0];
      console.log('🏫 College details:');
      console.log(`  - Name: ${college.name}`);
      console.log(`  - Email: ${college.email}`);
      console.log(`  - Active: ${college.is_active}`);
      
      // Test password
      const bcrypt = require('bcryptjs');
      const passwordMatch = await bcrypt.compare('Test@123', college.password);
      console.log(`  - Password Match: ${passwordMatch}`);
    }
    
    // Test login API
    console.log('\n🔐 Testing Login API...');
    const axios = require('axios');
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/college/login', {
        email: 'test@examshield.com',
        password: 'Test@123'
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });
      
      console.log('✅ Login API Response:');
      console.log(`  - Status: ${response.status}`);
      console.log(`  - Success: ${response.data.success}`);
      console.log(`  - Message: ${response.data.message}`);
      
      if (response.data.success) {
        console.log('\n🎉 LOGIN IS WORKING!');
        console.log('🌐 You can now login at: http://localhost:3000/admin/login');
        console.log('📧 Email: test@examshield.com');
        console.log('🔑 Password: Test@123');
      }
      
    } catch (apiError) {
      console.error('❌ Login API Error:', apiError.response?.data || apiError.message);
      
      if (apiError.response?.status === 401) {
        console.log('\n🔧 401 Error Fix:');
        console.log('1. Clear browser cache: Ctrl+Shift+Delete');
        console.log('2. Open incognito window');
        console.log('3. Go to: http://localhost:3000/admin/login');
        console.log('4. Try login again');
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testLoginWithFixedEnv();
