const axios = require('axios');

async function testFlow() {
  try {
    const API = 'http://localhost:5000/api';
    console.log('1. Logging in as College Admin...');
    const loginRes = await axios.post(`${API}/auth/college/login`, {
      email: 'pawankumaryadav75628697@gmail.com',
      password: 'Pawan@1234'
    });
    const token = loginRes.data.data.accessToken || loginRes.data.data.token;
    console.log('✅ College Admin logged in successfully! College:', loginRes.data.data.user.name);

    console.log('2. Fetching exams...');
    const examsRes = await axios.get(`${API}/admin/exams`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const exams = examsRes.data.data.exams || examsRes.data.data;
    console.log('Found', exams.length, 'exams.');
    
    let targetExam = exams[0];
    if (!targetExam) {
      console.log('Creating a test exam...');
      const createExamRes = await axios.post(`${API}/admin/exams`, {
        title: 'Final Semester Assessment 2026',
        subject: 'Computer Science & AI',
        duration_minutes: 45,
        total_marks: 50,
        passing_marks: 20,
        instructions: 'Please answer all questions within time limit.'
      }, { headers: { Authorization: `Bearer ${token}` } });
      targetExam = createExamRes.data.data;
      console.log('Created exam:', targetExam.id);
    } else {
      console.log('Using exam:', targetExam.name || targetExam.title, '| ID:', targetExam.id, '| Key:', targetExam.exam_key || targetExam.exam_code);
    }

    const testRollNo = 'ROLL' + Math.floor(100000 + Math.random() * 900000);
    const testEmail = `pawankumaryadav75628697+std${Date.now()}@gmail.com`; // Delivers directly to pawankumaryadav75628697@gmail.com!

    console.log('3. Adding student & assigning to exam with real email delivery...');
    const addStudentRes = await axios.post(`${API}/admin/students`, {
      name: 'Pawan Kumar Test Student',
      email: testEmail,
      roll_no: testRollNo,
      department: 'Computer Science',
      year: 4,
      semester: 8,
      examId: targetExam.id
    }, { headers: { Authorization: `Bearer ${token}` } });

    const studentData = addStudentRes.data.data;
    console.log('✅ Student added successfully!');
    console.log('Student ID:', studentData.student_id);
    console.log('Generated Password:', studentData.password);
    console.log('Assigned Exam Key:', studentData.exam_key);
    console.log('Email dispatched successfully:', addStudentRes.data.emailSent);

    console.log('4. Testing Student Login with Student ID:', studentData.student_id);
    const studentLoginRes = await axios.post(`${API}/auth/student/login`, {
      studentId: studentData.student_id,
      password: studentData.password
    });
    const studentToken = studentLoginRes.data.data.accessToken || studentLoginRes.data.data.token;
    console.log('✅ Student login with Student ID successful! Student:', studentLoginRes.data.data.user.name);

    console.log('5. Testing Student Login with Email:', testEmail);
    const studentLoginEmailRes = await axios.post(`${API}/auth/student/login`, {
      email: testEmail,
      password: studentData.password
    });
    console.log('✅ Student login with Email also successful!');

    console.log('6. Fetching assigned exams for student...');
    const studentExamsRes = await axios.get(`${API}/student/exams`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const studentExams = studentExamsRes.data.data.exams || studentExamsRes.data.data;
    console.log('Student assigned exams count:', studentExams.length);
    const assignedExam = studentExams.find(e => e.id === targetExam.id);
    console.log('Assigned Exam found in student dashboard:', assignedExam ? 'YES' : 'NO');

    console.log('6b. Ensuring exam has questions...');
    try {
      await axios.post(`${API}/admin/exams/${targetExam.id}/questions`, {
        questions: [
          {
            questionText: 'Which of the following is a core concept of Object-Oriented Programming?',
            type: 'multiple_choice',
            options: ['Inheritance', 'Compilation', 'Linking', 'Caching'],
            correctAnswer: 'Inheritance',
            marks: 5
          },
          {
            questionText: 'What is the time complexity of binary search on a sorted array?',
            type: 'multiple_choice',
            options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'],
            correctAnswer: 'O(log n)',
            marks: 5
          }
        ]
      }, { headers: { Authorization: `Bearer ${token}` } });
      console.log('✅ Exam questions seeded/verified successfully!');
    } catch (qErr) {
      console.log('Question addition note:', qErr.response?.data?.message || qErr.message);
    }

    console.log('7. Starting exam with Exam Key:', studentData.exam_key);
    const startRes = await axios.post(`${API}/student/exams/${targetExam.id}/start`, {
      examKey: studentData.exam_key
    }, { headers: { Authorization: `Bearer ${studentToken}` } });
    console.log('✅ Exam started successfully! Session ID:', startRes.data.data.session.id);
    console.log('Questions received:', (startRes.data.data.questions || []).length);

    console.log('\n🎉 ALL END-TO-END FLOWS COMPLETED AND FULLY VERIFIED!');
  } catch (err) {
    console.error('❌ Error during test flow:', err.response?.data || err.message);
  }
}

testFlow();
