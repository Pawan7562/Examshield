// Test email delivery to codingcollege12@gmail.com
require('dotenv').config();
const { sendStudentCredentials } = require('./services/emailService');

async function testEmailDelivery() {
  console.log('Testing email delivery to codingcollege12@gmail.com\n');
  
  // Test data
  const testData = {
    name: 'Test Student',
    email: 'codingcollege12@gmail.com',
    studentId: 'ES-2026-TEST123',
    password: 'TestPassword123@',
    collegeName: 'Test College',
    loginUrl: 'https://examshield.onrender.com/student/login'
  };
  
  console.log('Test Email Details:');
  console.log('To:', testData.email);
  console.log('Student ID:', testData.studentId);
  console.log('Password:', testData.password);
  console.log('Login URL:', testData.loginUrl);
  console.log('');
  
  try {
    console.log('Sending test email...');
    const result = await sendStudentCredentials(testData);
    
    console.log('Email sent successfully!');
    console.log('Check inbox for email with subject:');
    console.log('Subject: "Welcome to ExamShield - Your Login Credentials"');
    console.log('');
    console.log('Email content includes:');
    console.log('- Student ID: ES-2026-TEST123');
    console.log('- Password: TestPassword123@');
    console.log('- Login URL: https://examshield.onrender.com/student/login');
    console.log('');
    console.log('Please check your inbox and confirm if received!');
    
  } catch (error) {
    console.error('Email sending failed:', error.message);
    
    if (error.message.includes('timeout')) {
      console.log('\nConnection timeout detected. This might be due to:');
      console.log('1. Network connectivity issues');
      console.log('2. Gmail SMTP server load');
      console.log('3. Render environment restrictions');
    } else if (error.message.includes('authentication')) {
      console.log('\nAuthentication error. Check:');
      console.log('1. EMAIL_USER in .env file');
      console.log('2. EMAIL_PASS (app password) in .env file');
      console.log('3. Gmail app password setup');
    }
  }
}

// Run the test
testEmailDelivery().then(() => {
  console.log('\nTest completed');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
