// create-test-user.js - Create a test user with known password
const { query } = require('./config/supabase');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  console.log('👤 Creating Test User with Known Password...');
  
  try {
    // Hash the test password
    const testPassword = 'Test@123';
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    
    console.log('🔑 Test password:', testPassword);
    console.log('🔑 Hashed password:', hashedPassword);
    
    // Create a new college with known password
    const result = await query('INSERT INTO colleges (name, email, password, phone, address, website, subscription_plan, subscription_expiry) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [
      'Test College',
      'test@examshield.com',
      hashedPassword,
      '1234567890',
      'Test Address',
      'http://test.com',
      'basic',
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    ]);
    
    console.log('✅ Test user created:', result.rows[0]);
    
    // Test login with the new user
    console.log('\n🔍 Testing login with new user...');
    const loginResult = await query('SELECT * FROM colleges WHERE email = $1', ['test@examshield.com']);
    
    if (loginResult.rows.length > 0) {
      const college = loginResult.rows[0];
      const isMatch = await bcrypt.compare(testPassword, college.password);
      console.log('🔑 Login test successful:', isMatch);
      
      if (isMatch) {
        console.log('\n🎉 LOGIN CREDENTIALS READY:');
        console.log('📧 Email: test@examshield.com');
        console.log('🔑 Password: Test@123');
        console.log('🌐 Login URL: http://localhost:3000/admin/login');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestUser();
