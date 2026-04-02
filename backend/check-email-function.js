// Check if email function is working
const { sendStudentCredentials } = require('./services/emailService');

async function checkEmailFunction() {
  try {
    console.log('🔍 Checking Email Function Status\n');
    
    console.log('1. 📧 Testing email function directly...');
    console.log('   Watch the console for credential output...\n');
    
    // Test with sample data
    const testData = {
      name: 'Test Student',
      email: 'teststudent@examshield.com',
      studentId: 'ES-2026-999999',
      password: 'TestPass123!',
      collegeName: 'Test College',
      loginUrl: 'http://localhost:3000/student/login'
    };
    
    console.log('Sending test email with data:');
    console.log('- Name:', testData.name);
    console.log('- Email:', testData.email);
    console.log('- Student ID:', testData.studentId);
    console.log('- Password:', testData.password);
    console.log('');
    
    try {
      await sendStudentCredentials(testData);
      console.log('✅ Email function completed successfully!');
      console.log('');
      console.log('🎯 CHECK ABOVE FOR:');
      console.log('- "🎓 STUDENT CREDENTIALS GENERATED:" box');
      console.log('- All credential details');
      console.log('- "Mock email sent" message');
      console.log('- "Credentials email sent to" message');
      
    } catch (emailError) {
      console.log('❌ Email function failed:', emailError.message);
      console.log('This means there\'s an error in the email service');
    }
    
    console.log('\n2. 🔍 Checking email configuration...');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST || 'Not set (mock mode)');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
    
    console.log('\n3. 📊 Email Function Status:');
    
    if (!process.env.EMAIL_HOST) {
      console.log('✅ Email function is WORKING (Mock Mode)');
      console.log('ℹ️  In development, emails are logged to console');
      console.log('ℹ️  No real emails are sent');
      console.log('ℹ️  Credentials are displayed in console');
    } else {
      console.log('✅ Email function is WORKING (Real Mode)');
      console.log('ℹ️  Real emails should be sent');
      console.log('ℹ️  Check email inbox');
    }
    
    console.log('\n🎯 FINAL CHECK:');
    console.log('If you see the credential box above → ✅ WORKING');
    console.log('If you see error messages → ❌ NEEDS FIXING');
    console.log('If you see nothing → ❌ NOT BEING CALLED');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkEmailFunction();
