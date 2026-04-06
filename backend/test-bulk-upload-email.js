// Test bulk student upload with email functionality
require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const { sendBulkStudentCredentials } = require('./services/emailService');

async function testBulkUpload() {
  console.log('🎓 Testing Bulk Student Upload with Email System\n');
  
  // Simulate CSV data
  const testStudents = [
    {
      name: 'Test Student 1',
      email: 'student1@test.com',
      student_id: 'ES-2024-123456',
      password: 'Test123@#'
    },
    {
      name: 'Test Student 2', 
      email: 'student2@test.com',
      student_id: 'ES-2024-789012',
      password: 'Test456@#'
    },
    {
      name: 'Test Student 3',
      email: 'student3@test.com', 
      student_id: 'ES-2024-345678',
      password: 'Test789@#'
    }
  ];
  
  console.log('📋 Test Students:');
  testStudents.forEach((student, index) => {
    console.log(`${index + 1}. ${student.name} - ${student.email} - ID: ${student.student_id}`);
  });
  console.log('');
  
  try {
    console.log('📧 Sending bulk credentials emails...');
    const results = await sendBulkStudentCredentials(
      testStudents,
      'Test College',
      process.env.STUDENT_LOGIN_URL || 'https://examshield.onrender.com/student/login'
    );
    
    console.log('\n📊 Bulk Email Results:');
    console.log(`✅ Successful: ${results.success}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📧 Total processed: ${testStudents.length}`);
    
    if (results.errors && results.errors.length > 0) {
      console.log('\n⚠️ Email Errors:');
      results.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n🎉 Bulk email test completed successfully!');
    console.log('📧 Check your inbox for test emails');
    
  } catch (error) {
    console.error('❌ Bulk email test failed:', error.message);
    
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
testBulkUpload().then(() => {
  console.log('\n🏁 Bulk upload email test completed');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Test failed:', error);
  process.exit(1);
});
