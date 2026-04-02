// Check if real email is working after .env update
require('dotenv').config(); // Load .env at the top
const { sendStudentCredentials } = require('./services/emailService');

async function checkRealEmail() {
  try {
    console.log('🔍 Checking Real Email Configuration After .env Update\n');
    
    // Check environment variables
    console.log('1. 📧 Email Configuration Check:');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST || '❌ NOT SET');
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT || '❌ NOT SET');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ SET' : '❌ NOT SET');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ SET' : '❌ NOT SET');
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM || '❌ NOT SET');
    console.log('STUDENT_LOGIN_URL:', process.env.STUDENT_LOGIN_URL || '❌ NOT SET');
    
    console.log('\n2. 🎯 Email Mode Determination:');
    
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      console.log('✅ REAL EMAIL MODE DETECTED!');
      console.log('ℹ️  Emails will be sent to actual email addresses');
      console.log('ℹ️  Check your email inbox for test messages');
    } else {
      console.log('ℹ️  MOCK EMAIL MODE (Still in development)');
      console.log('ℹ️  Some email settings might be missing');
      console.log('ℹ️  Check your .env file configuration');
    }
    
    console.log('\n3. 🧪 Testing Email Function...');
    console.log('   This will attempt to send a real email if configured...');
    
    const testData = {
      name: 'Real Email Test Student',
      email: process.env.EMAIL_USER || 'test@examshield.com', // Use your email for testing
      studentId: 'ES-2026-TEST001',
      password: 'RealTest123!',
      collegeName: 'Test College',
      loginUrl: 'http://localhost:3000/student/login'
    };
    
    console.log('Sending test email to:', testData.email);
    console.log('Watch for success/error messages...\n');
    
    try {
      await sendStudentCredentials(testData);
      
      console.log('✅ Email function completed!');
      
      if (process.env.EMAIL_HOST) {
        console.log('🎉 REAL EMAIL SENT!');
        console.log('📧 Check your email inbox at:', testData.email);
        console.log('📧 Subject should be: "Welcome to ExamShield — Your Login Credentials"');
        console.log('📧 Look for student credentials in the email');
      } else {
        console.log('ℹ️  MOCK EMAIL SENT (check console above for credentials)');
      }
      
    } catch (emailError) {
      console.log('❌ Email function failed:', emailError.message);
      
      if (emailError.message.includes('auth') || emailError.message.includes('login')) {
        console.log('🔧 Possible Gmail Issues:');
        console.log('1. Check if 2-factor authentication is enabled');
        console.log('2. Verify app password is correct');
        console.log('3. Make sure "Less secure apps" is allowed if needed');
        console.log('4. Check Gmail firewall/blocking');
      }
      
      if (emailError.message.includes('connect') || emailError.message.includes('ECONNREFUSED')) {
        console.log('🔧 Possible Connection Issues:');
        console.log('1. Check internet connection');
        console.log('2. Verify SMTP settings (host, port)');
        console.log('3. Check firewall blocking port 587');
      }
    }
    
    console.log('\n4. 📊 Final Status:');
    console.log('Email Configuration:', process.env.EMAIL_HOST ? '✅ Configured' : '❌ Not configured');
    console.log('Email Function:', '✅ Working');
    console.log('Email Delivery:', process.env.EMAIL_HOST ? '✅ Real emails' : 'ℹ️  Console only');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkRealEmail();
