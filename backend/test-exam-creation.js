// Test exam creation and check console for exact errors
const axios = require('axios');

// Mock localStorage
global.localStorage = {
  getItem: function(key) { return this[key] || null; },
  setItem: function(key, value) { this[key] = value; },
  removeItem: function(key) { delete this[key]; }
};

async function testExamCreation() {
  try {
    console.log('🔧 Testing Exam Creation - Checking Console\n');
    
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
    
    // Login
    console.log('1. 🔐 Logging in...');
    const loginResponse = await api.post('/auth/college/login', {
      email: 'test@examshield.com',
      password: 'password123'
    });
    
    const { accessToken } = loginResponse.data.data;
    localStorage.setItem('accessToken', accessToken);
    console.log('✅ Logged in');
    
    // Test exam creation with minimal data
    console.log('\n2. 📝 Creating exam with minimal data...');
    
    const minimalExam = {
      title: 'Test Exam',
      type: 'mcq',
      subject: 'Test',
      dateTime: new Date(Date.now() + 86400000).toISOString(),
      duration: 30,
      totalMarks: 50,
      passingMarks: 25,
      instructions: 'Test instructions',
      isProctored: false,
      maxViolations: 3,
      studentIds: [],
      questions: []
    };
    
    try {
      const createResponse = await api.post('/admin/exams', minimalExam);
      
      if (createResponse.status === 200 || createResponse.status === 201) {
        console.log('✅ SUCCESS: Exam created with minimal data!');
        console.log('📊 Response:', JSON.stringify(createResponse.data, null, 2));
      } else {
        console.log('❌ FAILED: Exam creation failed');
        console.log('Status:', createResponse.status);
        console.log('Error:', createResponse.data);
        
        if (createResponse.status === 500) {
          console.log('\n🔍 500 ERROR CONFIRMED!');
          console.log('This is the exact error you are seeing in browser');
          console.log('Check the backend console for detailed error message');
        }
      }
      
    } catch (error) {
      console.log('❌ Exam creation test failed:', error.message);
    }
    
    console.log('\n3. 🎯 Instructions:');
    console.log('1. Watch the backend console carefully');
    console.log('2. Look for the exact error message');
    console.log('3. The console will show the real cause of 500 error');
    console.log('4. This will help identify the exact issue');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testExamCreation();
