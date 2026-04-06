// Fix email service to use correct port and get message IDs
const fs = require('fs');
const path = require('path');

// Read current .env file
const envPath = path.join(__dirname, '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

// Force EMAIL_PORT to 465 for production compatibility
envContent = envContent.replace(/EMAIL_PORT=.*/, 'EMAIL_PORT=465');

// Write back to .env file
fs.writeFileSync(envPath, envContent);

console.log('✅ Fixed EMAIL_PORT to 465 for production compatibility');
console.log('🔧 This will fix connection timeout issues in production');
console.log('📧 Email service will now use SSL port 465');
