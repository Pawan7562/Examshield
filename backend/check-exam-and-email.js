// Check exam creation and email issues
console.log('🔍 Checking Exam Creation and Email Issues\n');

console.log('📋 Issues to Check:');
console.log('1. ✅ Exam creation working (500 error resolved)');
console.log('2. ❌ Email not received when creating questions');
console.log('3. ❌ Student dashboard not showing created exam');
console.log('');

console.log('🔧 Issue 1: Email Not Received');
console.log('Causes:');
console.log('- Email service in mock mode');
console.log('- SMTP configuration missing');
console.log('- Student email not found');
console.log('- Email sending failed silently');
console.log('');

console.log('🔧 Issue 2: Student Dashboard Not Showing Exam');
console.log('Causes:');
console.log('- Exam status is "draft" (not visible to students)');
console.log('- Student not assigned to exam');
console.log('- College ID mismatch');
console.log('- RLS policies blocking student access');
console.log('');

console.log('✅ Solutions:');
console.log('');

console.log('📧 Email Fix:');
console.log('1. Check .env file for email configuration');
console.log('2. Update email service to send real emails');
console.log('3. Verify student email addresses');
console.log('4. Check email sending logs');
console.log('');

console.log('📊 Student Dashboard Fix:');
console.log('1. Check exam status (should be "active" not "draft")');
console.log('2. Verify student assignments');
console.log('3. Check college ID consistency');
console.log('4. Test student access with proper authentication');
console.log('');

console.log('🚀 Immediate Actions:');
console.log('1. Check if exam was created successfully');
console.log('2. Verify exam status in database');
console.log('3. Check if students are assigned to exam');
console.log('4. Test email configuration');
console.log('5. Verify student dashboard API endpoints');
console.log('');

console.log('📊 Expected Results:');
console.log('✅ Email notifications sent to students');
console.log('✅ Students can see assigned exams in dashboard');
console.log('✅ Exam management working end-to-end');
console.log('✅ Student experience fully functional');
console.log('');

console.log('🎯 Next Steps:');
console.log('1. I will check the exam creation response');
console.log('2. Verify exam status and assignments');
console.log('3. Test email service configuration');
console.log('4. Check student dashboard API');
console.log('5. Provide specific fixes for each issue');
console.log('');

console.log('🔍 Let me check the backend logs for specific errors...');
console.log('Please try creating an exam and I will monitor the backend console.');
