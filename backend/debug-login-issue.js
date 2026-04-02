// debug-login-issue.js - Debug the 401 Unauthorized error
const { supabase } = require('./config/supabase');

async function debugLogin() {
  console.log('🔍 Debugging 401 Unauthorized Error...');
  
  try {
    // Test 1: Check if user exists in Supabase
    console.log('\n📊 Step 1: Check if user exists in Supabase');
    const { data: colleges, error: collegeError } = await supabase
      .from('colleges')
      .select('*')
      .eq('email', 'test@examshield.com');
    
    if (collegeError) {
      console.error('❌ Error finding college:', collegeError);
      return;
    }
    
    console.log('✅ Colleges found:', colleges.length);
    if (colleges.length > 0) {
      console.log('🏫 College data:', colleges[0]);
    }
    
    // Test 2: Test password comparison
    console.log('\n📊 Step 2: Test password comparison');
    const bcrypt = require('bcryptjs');
    const testPassword = 'Test@123';
    const storedHash = colleges[0]?.password;
    
    if (storedHash) {
      const isMatch = await bcrypt.compare(testPassword, storedHash);
      console.log('🔑 Password match result:', isMatch);
      console.log('🔑 Test password:', testPassword);
      console.log('🔑 Stored hash:', storedHash);
    }
    
    // Test 3: Check account status
    console.log('\n📊 Step 3: Check account status');
    if (colleges.length > 0) {
      const college = colleges[0];
      console.log('🔍 is_active:', college.is_active);
      console.log('🔍 subscription_expiry:', college.subscription_expiry);
      
      // Check if subscription is expired
      if (college.subscription_expiry) {
        const now = new Date();
        const expiry = new Date(college.subscription_expiry);
        const isExpired = expiry < now;
        console.log('📅 Subscription expired:', isExpired);
        console.log('📅 Current date:', now.toISOString());
        console.log('📅 Expiry date:', expiry.toISOString());
      }
    }
    
    // Test 4: Simulate the exact login request
    console.log('\n📊 Step 4: Test login API endpoint');
    const axios = require('axios');
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/college/login', {
        email: 'test@examshield.com',
        password: 'Test@123'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Login API response:', response.data);
      console.log('📊 Status:', response.status);
      
    } catch (apiError) {
      console.error('❌ Login API error:', apiError.response?.data || apiError.message);
      if (apiError.response) {
        console.log('📊 Status:', apiError.response.status);
        console.log('📊 Headers:', apiError.response.headers);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugLogin();
