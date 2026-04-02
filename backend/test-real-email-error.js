// Test real email with detailed error logging
require('dotenv').config();
const { sendStudentCredentials } = require('./services/emailService');

async function testRealEmailError() {
  try {
    console.log('🔍 Testing Real Email with Detailed Error Logging\n');
    
    console.log('Email Configuration:');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ SET' : '❌ NOT SET');
    console.log('');
    
    const testData = {
      name: 'Error Test Student',
      email: 'codingcollege12@gmail.com',
      studentId: 'ES-2026-ERROR001',
      password: 'ErrorTest123!',
      collegeName: 'Error Test College',
      loginUrl: 'http://localhost:3000/student/login'
    };
    
    console.log('Testing email send...');
    console.log('To:', testData.email);
    console.log('From:', process.env.EMAIL_USER);
    console.log('');
    
    try {
      await sendStudentCredentials(testData);
      console.log('✅ SUCCESS: Email sent!');
      console.log('📧 Check your Gmail inbox for the email');
      
    } catch (error) {
      console.log('❌ EMAIL SEND FAILED:');
      console.log('Error:', error.message);
      console.log('Error Code:', error.code);
      console.log('Full Error:', error);
      console.log('');
      
      // Specific error diagnostics
      if (error.code === 'EAUTH') {
        console.log('🔧 AUTHENTICATION ERROR:');
        console.log('1. Gmail app password might be incorrect');
        console.log('2. 2-factor authentication might not be enabled');
        console.log('3. "Less secure apps" might need to be enabled');
        console.log('4. App password might be revoked');
      }
      
      if (error.code === 'ECONNECTION') {
        console.log('🔧 CONNECTION ERROR:');
        console.log('1. Internet connection issue');
        console.log('2. Firewall blocking port 587');
        console.log('3. SMTP server might be down');
      }
      
      if (error.code === 'ESMTP') {
        console.log('🔧 SMTP ERROR:');
        console.log('1. Gmail might be blocking the connection');
        console.log('2. Account might be temporarily locked');
        console.log('3. Too many login attempts');
      }
      
      console.log('');
      console.log('🔧 SOLUTIONS:');
      console.log('1. Generate a new Gmail app password');
      console.log('2. Enable 2-factor authentication');
      console.log('3. Allow "Less secure apps" in Gmail settings');
      console.log('4. Check Gmail account for security alerts');
      console.log('5. Try with a different Gmail account');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRealEmailError();
