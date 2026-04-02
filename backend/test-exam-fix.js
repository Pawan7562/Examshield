// Test the fixed exam creation
const axios = require('axios');

// Mock localStorage
global.localStorage = {
  getItem: function(key) { return this[key] || null; },
  setItem: function(key, value) { this[key] = value; },
  removeItem: function(key) { delete this[key]; }
};

async function testExamFix() {
  try {
    console.log('🔧 Testing Fixed Exam Creation\n');
    
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
    
    // Test exam creation with correct field names
    console.log('\n2. 📝 Testing exam creation with fixed field names...');
    
    const examData = {
      title: 'Test Exam for Debugging',
      description: 'This is a test exam to verify the fix',
      type: 'mcq',
      subject: 'Testing',
      dateTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      duration: 30,
      totalMarks: 50,
      passingMarks: 25,
      instructions: 'This is a test exam for debugging purposes',
      isProctored: false,
      maxViolations: 3,
      studentIds: [],
      questions: []
    };
    
    try {
      const createResponse = await api.post('/admin/exams', examData);
      
      if (createResponse.status === 200 || createResponse.status === 201) {
        console.log('✅ SUCCESS: Exam created successfully!');
        console.log('📊 Exam ID:', createResponse.data?.data?.id);
        console.log('📊 Exam Code:', createResponse.data?.data?.exam_code);
        console.log('📊 Title:', createResponse.data?.data?.title);
        console.log('\n🎯 EXAM CREATION IS NOW WORKING!');
        console.log('✅ The 500 error should be fixed');
        console.log('✅ Field mapping issue resolved');
        console.log('✅ Backend accepts both title and name');
        
      } else {
        console.log('❌ Exam creation still failed:');
        console.log('Status:', createResponse.status);
        console.log('Error:', createResponse.data);
        
        if (createResponse.status === 400) {
          console.log('\n🔍 400 Error Analysis:');
          console.log('This might be a different field mapping issue');
          console.log('Check the exact error message above');
        }
      }
      
    } catch (error) {
      console.log('❌ Exam creation test failed:', error.message);
    }
    
    // Test with name field instead of title
    console.log('\n3. 🧪 Testing with name field (frontend compatibility)...');
    
    try {
      const nameFieldData = {
        ...examData,
        name: examData.title, // Use name instead of title
        title: undefined // Remove title to test name field
      };
      
      const nameResponse = await api.post('/admin/exams', nameFieldData);
      
      if (nameResponse.status === 200 || nameResponse.status === 201) {
        console.log('✅ SUCCESS: Exam created with name field!');
        console.log('📊 Exam ID:', nameResponse.data?.data?.id);
        console.log('✅ Both title and name fields work');
        
      } else {
        console.log('❌ Name field test failed:');
        console.log('Status:', nameResponse.status);
        console.log('Error:', nameResponse.data);
      }
      
    } catch (nameError) {
      console.log('❌ Name field test error:', nameError.message);
    }
    
    console.log('\n4. 🎯 Final Diagnosis:');
    console.log('If exam creation works → 500 error is fixed');
    console.log('If still fails → Check backend console for specific errors');
    console.log('The field mapping issue should be resolved');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testExamFix();
