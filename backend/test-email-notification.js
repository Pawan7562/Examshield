// Test script to debug email notification issues
const { supabase } = require('./config/supabase');
const { sendExamNotification } = require('./services/emailService');

async function testEmailNotification() {
  console.log('🔍 Testing Email Notification System');
  console.log('================================');

  try {
    // 1. Check environment variables
    console.log('📧 Email Configuration:');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST || 'NOT SET');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'NOT SET');
    console.log('STUDENT_LOGIN_URL:', process.env.STUDENT_LOGIN_URL || 'NOT SET');

    // 2. Get a published exam to test
    const { data: exams, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('status', 'published')
      .limit(1);

    if (examError) {
      console.error('❌ Error fetching published exams:', examError);
      return;
    }

    if (!exams || exams.length === 0) {
      console.log('⚠️ No published exams found to test');
      return;
    }

    const testExam = exams[0];
    console.log('📊 Testing with exam:', {
      id: testExam.id,
      title: testExam.title,
      exam_code: testExam.exam_code,
      status: testExam.status
    });

    // 3. Get assigned students
    const { data: assignments } = await supabase
      .from('exam_assignments')
      .select('student_id')
      .eq('exam_id', testExam.id);

    if (!assignments || assignments.length === 0) {
      console.log('⚠️ No students assigned to this exam');
      return;
    }

    const studentIds = assignments.map(a => a.student_id);
    const { data: students } = await supabase
      .from('students')
      .select('name, email')
      .in('id', studentIds);

    console.log('👥 Found assigned students:', students.length);

    // 4. Test email notification for first student
    if (students.length > 0) {
      const testStudent = students[0];
      console.log('📧 Testing email notification for:', {
        name: testStudent.name,
        email: testStudent.email,
        examKey: testExam.exam_code
      });

      try {
        const result = await sendExamNotification({
          name: testStudent.name,
          email: testStudent.email,
          examName: testExam.title,
          examDate: testExam.date_time,
          examDuration: testExam.duration || 60,
          examKey: testExam.exam_code,
          subject: testExam.subject || 'Test',
          type: testExam.type || 'exam',
          loginUrl: process.env.STUDENT_LOGIN_URL || 'http://localhost:3002/student/login'
        });

        console.log('✅ Email notification result:', result);
        
        if (result && result.success) {
          console.log('🎉 SUCCESS: Email should have been sent to', testStudent.email);
        } else {
          console.log('❌ FAILED: Email notification failed');
        }
      } catch (emailError) {
        console.error('❌ Email notification error:', emailError.message);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEmailNotification().then(() => {
  console.log('🏁 Email notification test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
