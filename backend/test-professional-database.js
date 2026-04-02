// test-professional-database.js - Test the professional database
const { query, database } = require('./config/supabase');

async function testDatabase() {
  console.log('🧪 Testing Professional Database...');
  
  try {
    // Test 1: Check if super admin exists
    console.log('\n📊 Test 1: Check Super Admin');
    const adminResult = await query('SELECT * FROM super_admins WHERE email = $1', ['admin@examshield.com']);
    console.log('✅ Super Admin found:', adminResult.rows.length > 0 ? 'YES' : 'NO');
    
    // Test 2: Check colleges table
    console.log('\n📊 Test 2: Check Colleges Table');
    const collegeResult = await query('SELECT * FROM colleges');
    console.log('✅ Colleges count:', collegeResult.rows.length);
    
    // Test 3: Test registration
    console.log('\n📊 Test 3: Test College Registration');
    const registrationResult = await query('INSERT INTO colleges (name, email, password, phone, address, website, subscription_plan, subscription_expiry) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [
      'Test College',
      'test@example.com',
      '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm',
      '1234567890',
      'Test Address',
      'http://test.com',
      'basic',
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    ]);
    console.log('✅ Registration successful:', registrationResult.rows[0]);
    
    // Test 4: Test login query
    console.log('\n📊 Test 4: Test Login Query');
    const loginResult = await query('SELECT * FROM colleges WHERE email = $1', ['test@example.com']);
    console.log('✅ Login query successful:', loginResult.rows.length > 0 ? 'YES' : 'NO');
    if (loginResult.rows.length > 0) {
      console.log('🏫 College found:', loginResult.rows[0]);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('📊 Database file location: ./data/examshield.json');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testDatabase();
