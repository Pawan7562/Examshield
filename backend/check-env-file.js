// Check .env file content and format
const fs = require('fs');
const path = require('path');

async function checkEnvFile() {
  try {
    console.log('🔍 Checking .env File Content and Format\n');
    
    const envPath = path.join(__dirname, '.env');
    
    // Check if .env file exists
    if (!fs.existsSync(envPath)) {
      console.log('❌ .env file does not exist at:', envPath);
      console.log('🔧 Solution: Create .env file in backend folder');
      return;
    }
    
    console.log('✅ .env file found at:', envPath);
    
    // Read .env file content
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('\n📄 .env File Content:');
    console.log('================');
    console.log(envContent);
    console.log('================');
    
    // Parse .env manually to check format
    const lines = envContent.split('\n');
    const envVars = {};
    
    for (const line of lines) {
      if (line.trim() && !line.trim().startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
    
    console.log('\n🔍 Parsed Environment Variables:');
    console.log('EMAIL_HOST:', envVars.EMAIL_HOST || '❌ NOT FOUND');
    console.log('EMAIL_PORT:', envVars.EMAIL_PORT || '❌ NOT FOUND');
    console.log('EMAIL_USER:', envVars.EMAIL_USER || '❌ NOT FOUND');
    console.log('EMAIL_PASS:', envVars.EMAIL_PASS ? '✅ FOUND' : '❌ NOT FOUND');
    console.log('EMAIL_FROM:', envVars.EMAIL_FROM || '❌ NOT FOUND');
    console.log('STUDENT_LOGIN_URL:', envVars.STUDENT_LOGIN_URL || '❌ NOT FOUND');
    
    // Check for common issues
    console.log('\n🔧 Common Issues Check:');
    
    if (!envVars.EMAIL_HOST) {
      console.log('❌ EMAIL_HOST is missing');
    }
    
    if (!envVars.EMAIL_USER) {
      console.log('❌ EMAIL_USER is missing');
    }
    
    if (!envVars.EMAIL_PASS) {
      console.log('❌ EMAIL_PASS is missing');
    }
    
    if (envVars.EMAIL_HOST && envVars.EMAIL_USER && envVars.EMAIL_PASS) {
      console.log('✅ All required email variables are present!');
      console.log('🔧 Try restarting the server again with: node server.js');
    } else {
      console.log('❌ Some email variables are missing');
      console.log('🔧 Add the missing variables to .env file');
    }
    
    // Test dotenv loading
    console.log('\n🧪 Testing dotenv loading...');
    require('dotenv').config({ path: envPath });
    
    console.log('After dotenv.config():');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST || '❌ STILL NOT LOADED');
    console.log('EMAIL_USER:', process.env.EMAIL_USER || '❌ STILL NOT LOADED');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ LOADED' : '❌ STILL NOT LOADED');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkEnvFile();
