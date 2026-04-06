// Update environment variables for Render compatibility
const fs = require('fs');
const path = require('path');

// Read current .env file
const envPath = path.join(__dirname, '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

// Update EMAIL_PORT to 465 for Render compatibility
envContent = envContent.replace(/EMAIL_PORT=.*/, 'EMAIL_PORT=465');

// Add EMAIL_FROM if not present
if (!envContent.includes('EMAIL_FROM=')) {
  envContent += '\nEMAIL_FROM=pawankumaryadav75628697@gmail.com';
}

// Update NODE_ENV to production for Render
envContent = envContent.replace(/NODE_ENV=.*/, 'NODE_ENV=production');

// Write back to .env file
fs.writeFileSync(envPath, envContent);

console.log('✅ Updated .env file for Render compatibility:');
console.log('- EMAIL_PORT changed to 465 (SSL)');
console.log('- EMAIL_FROM added');
console.log('- NODE_ENV set to production');
console.log('');
console.log('🔧 These changes will fix connection timeout issues on Render');
