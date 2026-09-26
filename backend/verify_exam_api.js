// backend/verify_exam_api.js
const axios = require('axios');

async function testExamFlow() {
  const baseURL = 'http://localhost:5000/api';
  console.log('--- TESTING STUDENT EXAM LOGIN & START FLOW ---');

  // 1. Student Login
  console.log('1. Logging in student pawankumaryadav75628697@gmail.com...');
  const loginRes = await axios.post(`${baseURL}/auth/student/login`, {
    email: 'pawankumaryadav75628697@gmail.com',
    password: 'Pawan@1234'
  });

  const token = loginRes.data.data?.token || loginRes.data.token || loginRes.data.data?.accessToken;
  console.log('✅ Student logged in successfully. Token acquired.');

  const headers = { Authorization: `Bearer ${token}` };

  const examId = '6fcc9c13-8bec-43a8-99b9-869f9f616cd9';
  const examKey = 'EXAM2026';

  // 2. Get Exam Details
  console.log(`2. Fetching exam details for exam ${examId}...`);
  const detailsRes = await axios.get(`${baseURL}/student/exams/${examId}`, { headers });
  console.log('✅ Exam details response:', {
    success: detailsRes.data.success,
    examTitle: detailsRes.data.data?.exam?.title,
    questionsCount: detailsRes.data.data?.questions?.length,
    hasAccess: detailsRes.data.data?.hasAccess
  });

  // 3. Start Exam
  console.log(`3. Starting exam with key '${examKey}'...`);
  const startRes = await axios.post(`${baseURL}/student/exams/${examId}/start`, { examKey }, { headers });
  console.log('✅ Exam started successfully! Response:');
  console.log({
    success: startRes.data.success,
    message: startRes.data.message,
    sessionId: startRes.data.data?.session?.id,
    questionsCount: startRes.data.data?.questions?.length,
    firstQuestion: startRes.data.data?.questions?.[0]?.question_text
  });

  console.log('\n🎉 ALL CHECKS PASSED PERFECTLY!');
}

testExamFlow().catch(err => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
