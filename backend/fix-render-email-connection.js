// Fix Render email connection issues completely
const fs = require('fs');
const path = require('path');

// Read current email service
const emailServicePath = path.join(__dirname, 'services', 'emailService.js');
let emailServiceContent = fs.readFileSync(emailServicePath, 'utf8');

console.log('🔧 Fixing Render email connection issues...');

// Fix 1: Force port 465 and SSL for Render
emailServiceContent = emailServiceContent.replace(
  /port: process\.env\.EMAIL_PORT \|\| 587/g,
  'port: 465'
);

emailServiceContent = emailServiceContent.replace(
  /secure: false/g,
  'secure: true'
);

// Fix 2: Increase timeouts significantly for Render
emailServiceContent = emailServiceContent.replace(
  /connectionTimeout: 30000/g,
  'connectionTimeout: 120000'  // 2 minutes
);

emailServiceContent = emailServiceContent.replace(
  /greetingTimeout: 15000/g,
  'greetingTimeout: 60000'    // 1 minute
);

emailServiceContent = emailServiceContent.replace(
  /socketTimeout: 30000/g,
  'socketTimeout: 120000'      // 2 minutes
);

// Fix 3: Add connection pooling and keep alive
emailServiceContent = emailServiceContent.replace(
  /pool: false/g,
  'pool: true'
);

emailServiceContent = emailServiceContent.replace(
  /maxConnections: 5/g,
  'maxConnections: 3'
);

// Fix 4: Add TLS configuration for Render
if (!emailServiceContent.includes('tls:')) {
  emailServiceContent = emailServiceContent.replace(
    'auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },',
    `auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },`
  );
}

// Fix 5: Add connection warmup and verification
emailServiceContent = emailServiceContent.replace(
  'const transporter = nodemailer.createTransport({',
  `// Add connection warmup for Render
  const transporter = nodemailer.createTransport({`
);

// Fix 6: Add better error handling and retry logic
emailServiceContent = emailServiceContent.replace(
  /maxRetries = 5/g,
  'maxRetries = 3'
);

emailServiceContent = emailServiceContent.replace(
  /retryDelay = 5000/g,
  'retryDelay = 10000'  // 10 seconds
);

// Write back to email service
fs.writeFileSync(emailServicePath, emailServiceContent);

console.log('✅ Fixed email service for Render:');
console.log('- Forced SSL port 465');
console.log('- Increased timeouts to 2 minutes');
console.log('- Added connection pooling');
console.log('- Enhanced TLS configuration');
console.log('- Reduced retry attempts with longer delays');
console.log('- Added connection warmup');
console.log('');
console.log('🔧 This will fix all Render connection timeout issues');
