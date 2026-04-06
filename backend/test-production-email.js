// Production email test - Verify email configuration for Vercel deployment
require('dotenv').config(); // Load environment variables
const { sendExamNotification } = require('./services/emailService');

async function testProductionEmail() {
  console.log('🌍 PRODUCTION EMAIL TEST - Vercel Configuration\n');
  
  // Check environment variables
  console.log('📋 Environment Variables Check:');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***SET***' : 'NOT SET');
  console.log('STUDENT_LOGIN_URL:', process.env.STUDENT_LOGIN_URL);
  console.log('');
  
  try {
    // Test with production data
    const testEmailData = {
      name: 'Production Test Student',
      email: process.env.EMAIL_USER, // Send to yourself for testing
      examName: 'Production Test Exam',
      examDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      examDuration: 60,
      examKey: 'PROD2024TEST',
      subject: 'Computer Science',
      type: 'exam',
      loginUrl: process.env.STUDENT_LOGIN_URL || 'https://examshield.vercel.app/student/login'
    };
    
    console.log('📧 Sending production test email to:', testEmailData.email);
    console.log('📝 Exam Name:', testEmailData.examName);
    console.log('🔑 Exam Key:', testEmailData.examKey);
    console.log('🌐 Login URL:', testEmailData.loginUrl);
    console.log('');
    
    const result = await sendExamNotification(testEmailData);
    
    console.log('✅ Email sent successfully!');
    console.log('📧 Status:', result.status || 'success');
    console.log('📧 Message ID:', result.messageId || 'N/A');
    
    if (result.status === 'mock') {
      console.log('\n⚠️  EMAIL IS IN MOCK MODE');
      console.log('❌ Environment variables not properly configured in production');
      console.log('🔧 Add these environment variables in Vercel dashboard:');
      console.log('   EMAIL_HOST=smtp.gmail.com');
      console.log('   EMAIL_USER=pawankumaryadav75628697@gmail.com');
      console.log('   EMAIL_PASS=rygw bnfk dxnq cdsf');
      console.log('   STUDENT_LOGIN_URL=https://examshield.vercel.app/student/login');
    } else {
      console.log('\n✅ PRODUCTION EMAIL SYSTEM WORKING!');
      console.log('🎉 Students will receive exam notifications in production');
      console.log('📧 Check your inbox for the test email');
    }
    
  } catch (error) {
    console.error('❌ Production email test failed:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n🔧 Gmail Authentication Error:');
      console.log('1. Verify Gmail app password is correct');
      console.log('2. Enable 2-step verification');
      console.log('3. Generate new app password if needed');
    } else if (error.message.includes('connect')) {
      console.log('\n🔧 Connection Error:');
      console.log('1. Check EMAIL_HOST and EMAIL_PORT');
      console.log('2. Verify network connectivity');
    }
  }
}

// Run the test
testProductionEmail().then(() => {
  console.log('\n🏁 Production email test completed');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Test failed:', error);
  process.exit(1);
});
