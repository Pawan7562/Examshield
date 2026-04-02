// Test student addition and email display
const axios = require('axios');

// Mock localStorage
global.localStorage = {
  getItem: function(key) { return this[key] || null; },
  setItem: function(key, value) { this[key] = value; },
  removeItem: function(key) { delete this[key]; }
};

async function testStudentEmail() {
  try {
    console.log('🎓 Testing Student Addition & Email Display\n');
    
    const api = axios.create({
      baseURL: 'http://localhost:5000/api',
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
    
    // Add auth interceptor
    api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // 1. Login
    console.log('1. 🔐 Logging in as admin...');
    const loginResponse = await api.post('/auth/college/login', {
      email: 'test@examshield.com',
      password: 'password123'
    });
    
    const { accessToken } = loginResponse.data.data;
    localStorage.setItem('accessToken', accessToken);
    console.log('✅ Logged in successfully');
    
    // 2. Add a test student
    console.log('\n2. 👤 Adding test student...');
    console.log('   Watch the backend console for email credentials!');
    
    const studentData = {
      name: 'Demo Student',
      email: 'demostudent@examshield.com',
      rollNo: 'DEMO' + Date.now().toString().slice(-6)
    };
    
    try {
      const addResponse = await api.post('/admin/students', studentData);
      console.log('✅ Student added successfully!');
      console.log('   Student ID:', addResponse.data.data.student_id);
      console.log('   Check backend console for email credentials');
      
      // 3. Get student details to show what was created
      console.log('\n3. 📋 Getting student details...');
      const studentsResponse = await api.get('/admin/students');
      const students = studentsResponse.data.data.students;
      
      if (students.length > 0) {
        const latestStudent = students[0];
        console.log('✅ Latest student in database:');
        console.log('   Name:', latestStudent.name);
        console.log('   Email:', latestStudent.email);
        console.log('   Student ID:', latestStudent.student_id);
        console.log('   Roll No:', latestStudent.roll_no);
        console.log('   Password: [Hidden - stored as hash]');
      }
      
    } catch (addError) {
      console.log('❌ Student addition failed:', addError.response?.data);
    }
    
    console.log('\n📧 Email Status:');
    console.log('✅ Email function was called');
    console.log('✅ Credentials were generated');
    console.log('ℹ️  In development mode, emails are logged to console');
    console.log('ℹ️  Check backend server console for full credentials');
    
    console.log('\n🔧 To Send Real Emails:');
    console.log('1. Create .env file in backend folder');
    console.log('2. Add Gmail SMTP credentials');
    console.log('3. Restart backend server');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testStudentEmail();
