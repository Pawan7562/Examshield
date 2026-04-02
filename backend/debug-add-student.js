// Debug student addition 400 error
const axios = require('axios');

// Mock localStorage
global.localStorage = {
  getItem: function(key) { return this[key] || null; },
  setItem: function(key, value) { this[key] = value; },
  removeItem: function(key) { delete this[key]; }
};

async function debugAddStudent() {
  try {
    console.log('🔍 Debugging Student Addition 400 Error\n');
    
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
    
    // 1. Login first
    console.log('1. 🔐 Getting auth token...');
    const loginResponse = await api.post('/auth/college/login', {
      email: 'test@examshield.com',
      password: 'password123'
    });
    
    const { accessToken } = loginResponse.data.data;
    localStorage.setItem('accessToken', accessToken);
    console.log('✅ Token obtained');
    
    // 2. Test student listing (should work)
    console.log('\n2. 📋 Testing student listing...');
    try {
      const listResponse = await api.get('/admin/students');
      console.log('✅ Student listing works:', listResponse.status);
    } catch (listError) {
      console.log('❌ Student listing failed:', listError.response?.status, listError.response?.data);
    }
    
    // 3. Test student addition (where 400 occurs)
    console.log('\n3. ➕ Testing student addition...');
    console.log('Sending student data like frontend...');
    
    const studentData = {
      name: 'Test Student',
      email: 'teststudent@examshield.com',
      rollNo: 'STU001',
      department: 'Computer Science',
      semester: '1st',
      batch: '2024',
      phone: '1234567890'
    };
    
    console.log('Student data:', studentData);
    
    try {
      const addResponse = await api.post('/admin/students', studentData);
      console.log('✅ Student addition SUCCESS:', addResponse.status);
      console.log('Response:', addResponse.data);
    } catch (addError) {
      console.log('❌ Student addition FAILED:');
      console.log('Status:', addError.response?.status);
      console.log('Error:', addError.response?.data);
      
      if (addError.response?.status === 400) {
        console.log('\n🔧 400 Error Analysis:');
        console.log('This is likely:');
        console.log('1. Missing required fields in backend');
        console.log('2. Database schema mismatch');
        console.log('3. Validation error in studentController');
      }
    }
    
    // 4. Test with minimal data
    console.log('\n4. 🧪 Testing with minimal required data...');
    const minimalData = {
      name: 'Minimal Student',
      email: 'minimal@examshield.com',
      rollNo: 'MIN001'
    };
    
    try {
      const minimalResponse = await api.post('/admin/students', minimalData);
      console.log('✅ Minimal data addition SUCCESS:', minimalResponse.status);
    } catch (minimalError) {
      console.log('❌ Minimal data addition FAILED:');
      console.log('Status:', minimalError.response?.status);
      console.log('Error:', minimalError.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugAddStudent();
