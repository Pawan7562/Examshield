// debug-login-live.js - Debug live login issues
const { query } = require('./config/supabase');

async function debugLiveLogin() {
  console.log('🔍 Debugging Live Login Issues...');
  
  try {
    // Test 1: Check what colleges exist in database
    console.log('\n📊 Step 1: Check existing colleges');
    const collegesResult = await query('SELECT * FROM colleges');
    console.log('🏫 Colleges in database:', collegesResult.rows.length);
    collegesResult.rows.forEach((college, index) => {
      console.log(`${index + 1}. ${college.name} - ${college.email}`);
    });
    
    // Test 2: Test specific email lookup
    console.log('\n📊 Step 2: Test email lookup');
    const testEmail = 'test@example.com';
    const emailResult = await query('SELECT * FROM colleges WHERE email = $1', [testEmail]);
    console.log(`🔍 Search for ${testEmail}:`, emailResult.rows.length > 0 ? 'FOUND' : 'NOT FOUND');
    
    if (emailResult.rows.length > 0) {
      const college = emailResult.rows[0];
      console.log('🏫 Found college:', college);
      
      // Test 3: Test password comparison
      console.log('\n📊 Step 3: Test password comparison');
      const bcrypt = require('bcryptjs');
      const testPassword = 'password123';
      const isMatch = await bcrypt.compare(testPassword, college.password);
      console.log('🔑 Password match:', isMatch);
      
      // Test 4: Check is_active status
      console.log('\n📊 Step 4: Check account status');
      console.log('🔍 is_active:', college.is_active);
      console.log('🔍 subscription_expiry:', college.subscription_expiry);
    }
    
    // Test 5: Try different emails
    console.log('\n📊 Step 5: Test with different emails');
    const testEmails = [
      'test@example.com',
      'pawankumaryadav756286976@gmail.com',
      'admin@examshield.com'
    ];
    
    for (const email of testEmails) {
      const result = await query('SELECT * FROM colleges WHERE email = $1', [email]);
      console.log(`🔍 ${email}: ${result.rows.length > 0 ? 'EXISTS' : 'NOT FOUND'}`);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugLiveLogin();
