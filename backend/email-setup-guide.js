// Email Setup Guide for ExamShield
console.log('📧 Email Setup Guide for ExamShield\n');

console.log('🔍 Current Issue:');
console.log('Emails are in MOCK MODE (development) - only logged to console');
console.log('No real emails are being sent to students\n');

console.log('🔧 Solution Options:');
console.log('');

console.log('OPTION 1: View Credentials in Console (Quick Fix)');
console.log('When you add a student, check the backend console for:');
console.log('- Mock email sent log');
console.log('- Student credentials (ID, Email, Password)');
console.log('- These are displayed when a student is added\n');

console.log('OPTION 2: Configure Real Email Service');
console.log('Create a .env file in the backend folder with:');
console.log('EMAIL_HOST=smtp.gmail.com');
console.log('EMAIL_PORT=587');
console.log('EMAIL_USER=your-email@gmail.com');
console.log('EMAIL_PASS=your-app-password');
console.log('EMAIL_FROM=ExamShield <your-email@gmail.com>');
console.log('STUDENT_LOGIN_URL=http://localhost:3000/student/login\n');

console.log('OPTION 3: Use Gmail App Password');
console.log('1. Enable 2-factor authentication on Gmail');
console.log('2. Go to Google Account settings');
console.log('3. Security -> App passwords');
console.log('4. Generate app password for ExamShield');
console.log('5. Use that password in EMAIL_PASS\n');

console.log('📋 What Happens Currently:');
console.log('✅ Student is added to database');
console.log('✅ Password is generated');
console.log('✅ Email function is called');
console.log('❌ Email is only logged, not sent (mock mode)');
console.log('❌ Student doesn\'t receive credentials\n');

console.log('🎯 Immediate Solution:');
console.log('1. Add a student');
console.log('2. Check backend console for credentials');
console.log('3. Manually share credentials with student');
console.log('4. Or configure real email service above\n');

console.log('📝 Test Credentials Display:');
console.log('When you add a student, you\'ll see in console:');
console.log('Mock email sent {');
console.log('  to: "student@email.com",');
console.log('  subject: "Welcome to ExamShield...",');
console.log('  text: "...Your credentials..."');
console.log('}');
