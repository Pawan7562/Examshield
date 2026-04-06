// Test student credential email functionality
require('dotenv').config();
const { sendStudentCredentials } = require('./services/emailService');

async function testStudentCredentials() {
  console.log('🎓 Testing Student Credentials Email System\n');
  
  // Test data
  const testStudent = {
    name: 'Test Student',
    email: process.env.EMAIL_USER || 'pawankumaryadav75628697@gmail.com',
    studentId: 'ES-2024-123456',
    password: 'Test123@#',
    collegeName: 'Test College',
    loginUrl: process.env.STUDENT_LOGIN_URL || 'https://examshield.onrender.com/student/login'
  };
  
  console.log('📋 Test Student Data:');
  console.log('Name:', testStudent.name);
  console.log('Email:', testStudent.email);
  console.log('Student ID:', testStudent.studentId);
  console.log('Password:', testStudent.password);
  console.log('College:', testStudent.collegeName);
  console.log('Login URL:', testStudent.loginUrl);
  console.log('');
  
  try {
    console.log('📧 Sending student credentials email...');
    const result = await sendStudentCredentials(testStudent);
    
    console.log('✅ Student credentials email sent successfully!');
    console.log('📧 Check your inbox for the test email');
    console.log('📧 Subject: "Welcome to ExamShield — Your Login Credentials"');
    console.log('');
    console.log('🎉 Both single student and CSV upload will now send emails!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('authentication')) {
      console.log('\n🔧 Gmail Authentication Error:');
      console.log('1. Check EMAIL_USER and EMAIL_PASS in .env');
      console.log('2. Verify Gmail app password is correct');
      console.log('3. Ensure 2-step verification is enabled');
    } else if (error.message.includes('connection')) {
      console.log('\n🔧 Connection Error:');
      console.log('1. Check EMAIL_HOST and EMAIL_PORT');
      console.log('2. Verify network connectivity');
      console.log('3. Try using port 465 with SSL');
    }
  }
}

// Run the test
testStudentCredentials().then(() => {
  console.log('\n🏁 Student credentials email test completed');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Test failed:', error);
  process.exit(1);
});
