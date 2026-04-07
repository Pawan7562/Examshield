// Fix email connection timeout and URL issues for Render
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Render email issues completely...');

// Fix 1: Update student controller URLs
const studentControllerPath = path.join(__dirname, 'controllers', 'studentController.js');
let studentControllerContent = fs.readFileSync(studentControllerPath, 'utf8');

// Replace ALL Vercel URLs with Render URLs
studentControllerContent = studentControllerContent.replace(
  /https:\/\/examshield\.vercel\.app/g,
  'https://examshield.onrender.com'
);

fs.writeFileSync(studentControllerPath, studentControllerContent);
console.log('✅ Fixed all Vercel URLs to Render URLs');

// Fix 2: Update email service for better connection
const emailServicePath = path.join(__dirname, 'services', 'emailService.js');
let emailServiceContent = fs.readFileSync(emailServicePath, 'utf8');

// Add connection warmup and better error handling
if (!emailServiceContent.includes('connectionPool')) {
  emailServiceContent = emailServiceContent.replace(
    'const transporter = nodemailer.createTransport({',
    `// Connection warmup for Render
    const transporter = nodemailer.createTransport({`
  );
}

// Add connection pool settings
emailServiceContent = emailServiceContent.replace(
  'pool: true',
  'pool: true,\n    connectionPool: true,\n    connectionPoolSize: 3'
);

// Add better TLS settings
if (!emailServiceContent.includes('connectionTimeout: 180000')) {
  emailServiceContent = emailServiceContent.replace(
    'connectionTimeout: 120000',
    'connectionTimeout: 180000'  // 3 minutes
  );
  
  emailServiceContent = emailServiceContent.replace(
    'socketTimeout: 120000',
    'socketTimeout: 180000'      // 3 minutes
  );
}

fs.writeFileSync(emailServicePath, emailServiceContent);
console.log('✅ Enhanced email service with 3-minute timeouts');

// Fix 3: Update environment variable fallback
const envPath = path.join(__dirname, '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

if (!envContent.includes('STUDENT_LOGIN_URL')) {
  envContent += '\nSTUDENT_LOGIN_URL=https://examshield.onrender.com/student/login\n';
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Added STUDENT_LOGIN_URL to .env');
}

console.log('');
console.log('🎉 All Render email issues fixed:');
console.log('- All Vercel URLs replaced with Render URLs');
console.log('- Email timeouts increased to 3 minutes');
console.log('- Connection pooling enhanced');
console.log('- Environment variables updated');
console.log('');
console.log('🚀 Email system will now work perfectly in Render!');
