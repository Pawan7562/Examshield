// debug-auth-logic.js - Debug the complete authentication flow
const { query } = require('./config/supabase');
const bcrypt = require('bcryptjs');

async function debugAuthLogic() {
  console.log('🔍 Debugging Complete Authentication Logic...');
  
  try {
    // Test 1: Check if test user exists
    console.log('\n📊 Step 1: Check test user existence');
    const testEmail = 'test@examshield.com';
    const userResult = await query('SELECT * FROM colleges WHERE email = $1', [testEmail]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Test user not found in database');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ Test user found:', user);
    
    // Test 2: Test password comparison
    console.log('\n📊 Step 2: Test password comparison');
    const testPassword = 'Test@123';
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log('🔑 Password match result:', isMatch);
    
    if (!isMatch) {
      console.log('❌ Password does not match');
      console.log('🔑 Stored hash:', user.password);
      console.log('🔑 Testing password:', testPassword);
      
      // Try different passwords
      const passwords = ['password123', 'Test@123', 'Admin@123', 'test'];
      for (const pwd of passwords) {
        const match = await bcrypt.compare(pwd, user.password);
        console.log(`🔑 "${pwd}" matches: ${match}`);
      }
      return;
    }
    
    // Test 3: Check account status
    console.log('\n📊 Step 3: Check account status');
    console.log('🔍 is_active:', user.is_active);
    console.log('🔍 subscription_expiry:', user.subscription_expiry);
    
    if (!user.is_active) {
      console.log('❌ Account is not active');
      return;
    }
    
    // Test 4: Generate JWT tokens
    console.log('\n📊 Step 4: Test JWT token generation');
    const jwt = require('jsonwebtoken');
    const payload = { id: user.id, role: 'college_admin' };
    const jwtSecret = process.env.JWT_SECRET || 'examshield_jwt_secret_key_change_in_production_123456';
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'examshield_refresh_secret_key_change_in_production_123456';
    
    try {
      const accessToken = jwt.sign(payload, jwtSecret, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });
      const refreshToken = jwt.sign(payload, jwtRefreshSecret, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
      });
      
      console.log('✅ JWT tokens generated successfully');
      console.log('🔑 Access token length:', accessToken.length);
      console.log('🔑 Refresh token length:', refreshToken.length);
      
      // Test 5: Simulate complete login response
      console.log('\n📊 Step 5: Simulate complete login response');
      const loginResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: 'college_admin'
          },
          accessToken,
          refreshToken
        }
      };
      
      console.log('✅ Complete login response ready');
      console.log('🎯 LOGIN SHOULD WORK WITH THESE CREDENTIALS:');
      console.log('📧 Email:', testEmail);
      console.log('🔑 Password:', testPassword);
      
    } catch (jwtError) {
      console.log('❌ JWT generation error:', jwtError);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugAuthLogic();
