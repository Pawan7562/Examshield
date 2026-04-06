// Fix email connection timeout issues in Render
const fs = require('fs');
const path = require('path');

// Read current email service
const emailServicePath = path.join(__dirname, 'services', 'emailService.js');
let emailServiceContent = fs.readFileSync(emailServicePath, 'utf8');

// Fix the email service for better Render compatibility
emailServiceContent = emailServiceContent
  .replace(/port: process.env.EMAIL_PORT \|\| 587/g, 'port: 465') // Force SSL port
  .replace(/secure: false/g, 'secure: true') // Force SSL
  .replace(/connectionTimeout: 30000/g, 'connectionTimeout: 60000') // Increase timeout
  .replace(/greetingTimeout: 15000/g, 'greetingTimeout: 30000') // Increase timeout
  .replace(/socketTimeout: 30000/g, 'socketTimeout: 60000') // Increase timeout
  .replace(/maxRetries = 3/g, 'maxRetries = 5') // Increase retries
  .replace(/retryDelay = 2000/g, 'retryDelay = 5000'); // Increase delay

// Write back to email service
fs.writeFileSync(emailServicePath, emailServiceContent);

console.log('✅ Fixed email service for Render compatibility:');
console.log('- Forced SSL port 465');
console.log('- Increased timeouts to 60 seconds');
console.log('- Increased retries to 5 attempts');
console.log('- Increased retry delay to 5 seconds');
console.log('');
console.log('🔧 This will fix connection timeout issues in Render');
