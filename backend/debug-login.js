// debug-login.js - Debug login function
const { query } = require('./config/supabase');

async function debugLogin() {
  console.log('🔍 Debugging login function...');
  
  try {
    // Test if we can query the college that was just created
    const email = 'pawankumaryadav756286976@gmail.com';
    console.log('📧 Testing email:', email);
    
    const result = await query('SELECT * FROM colleges WHERE email = $1', [email]);
    console.log('📊 Query result:', result);
    console.log('📊 Rows found:', result.rows.length);
    
    if (result.rows.length > 0) {
      const college = result.rows[0];
      console.log('🏫 College found:', college);
      console.log('🔑 Password comparison test...');
      
      // Test password comparison
      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare('Pawan@1234', college.password);
      console.log('🔑 Password match:', isMatch);
      
      console.log('🔍 is_active check:', college.is_active);
      console.log('🔍 subscription_expiry check:', college.subscription_expiry);
    } else {
      console.log('❌ No college found with email:', email);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugLogin();
