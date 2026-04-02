// fix-password-hash.js - Fix password hashing issue
const bcrypt = require('bcryptjs');

async function fixPasswordHash() {
  console.log('🔧 Fixing Password Hash Issue...');
  
  try {
    // Test with different password hashes
    const testPassword = 'password123';
    const testPassword2 = 'Pawan@1234';
    
    console.log('\n📊 Testing password hashes:');
    
    // Hash both passwords
    const hash1 = await bcrypt.hash(testPassword, 12);
    const hash2 = await bcrypt.hash(testPassword2, 12);
    
    console.log('🔑 Hash for "password123":', hash1);
    console.log('🔑 Hash for "Pawan@1234":', hash2);
    
    // Test against existing hash
    const existingHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm';
    
    const match1 = await bcrypt.compare(testPassword, existingHash);
    const match2 = await bcrypt.compare(testPassword2, existingHash);
    
    console.log('\n🔍 Password comparison results:');
    console.log('🔑 "password123" matches:', match1);
    console.log('🔑 "Pawan@1234" matches:', match2);
    
    // Create new hash for testing
    const newHash = await bcrypt.hash('Test@123', 12);
    console.log('\n🔑 New hash for "Test@123":', newHash);
    
    // Test new hash
    const newMatch = await bcrypt.compare('Test@123', newHash);
    console.log('🔑 "Test@123" matches new hash:', newMatch);
    
    console.log('\n🎯 Solution: Use "Test@123" as password for testing');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixPasswordHash();
