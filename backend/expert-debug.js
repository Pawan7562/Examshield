// Expert-level debugging for 400 error
const axios = require('axios');

// Mock localStorage
global.localStorage = {
  getItem: function(key) { return this[key] || null; },
  setItem: function(key, value) { this[key] = value; },
  removeItem: function(key) { delete this[key]; }
};

async function expertDebug() {
  try {
    console.log('🔬 Expert Debug: 400 Error Analysis\n');
    
    const api = axios.create({
      baseURL: 'http://localhost:5000/api',
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
    
    // Add auth interceptor exactly like frontend
    api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // 1. Login and get token
    console.log('1. 🔐 Authentication...');
    const loginResponse = await api.post('/auth/college/login', {
      email: 'test@examshield.com',
      password: 'password123'
    });
    
    const { accessToken } = loginResponse.data.data;
    localStorage.setItem('accessToken', accessToken);
    console.log('✅ Token obtained:', accessToken.substring(0, 50) + '...');
    
    // 2. Test exact frontend request
    console.log('\n2. 🌐 Testing exact frontend request pattern...');
    
    // Test with params (like frontend does)
    try {
      console.log('   Testing with empty params...');
      const response1 = await api.get('/admin/students', { params: {} });
      console.log('✅ Empty params: SUCCESS');
    } catch (error1) {
      console.log('❌ Empty params FAILED:', error1.response?.status, error1.response?.data);
    }
    
    // Test with pagination params
    try {
      console.log('   Testing with pagination params...');
      const response2 = await api.get('/admin/students', { 
        params: { page: 1, limit: 50 } 
      });
      console.log('✅ Pagination params: SUCCESS');
    } catch (error2) {
      console.log('❌ Pagination params FAILED:', error2.response?.status, error2.response?.data);
    }
    
    // Test without params
    try {
      console.log('   Testing without params...');
      const response3 = await api.get('/admin/students');
      console.log('✅ No params: SUCCESS');
    } catch (error3) {
      console.log('❌ No params FAILED:', error3.response?.status, error3.response?.data);
    }
    
    // 3. Check backend logs
    console.log('\n3. 🔍 Checking backend request details...');
    
    // Create a test request with detailed logging
    const testApi = axios.create({
      baseURL: 'http://localhost:5000/api',
      timeout: 30000,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
    });
    
    try {
      const debugResponse = await testApi.get('/admin/students', {
        params: { page: 1, limit: 50 },
        validateStatus: (status) => status < 500 // Don't throw on 4xx
      });
      
      console.log('✅ Debug request status:', debugResponse.status);
      console.log('Response headers:', debugResponse.headers);
      
    } catch (debugError) {
      console.log('❌ Debug request failed:');
      console.log('Status:', debugError.response?.status);
      console.log('Data:', debugError.response?.data);
      console.log('Headers:', debugError.response?.headers);
    }
    
    console.log('\n🎯 Expert Analysis:');
    console.log('If 400 persists, the issue is likely:');
    console.log('1. Backend controller still has old code (not restarted properly)');
    console.log('2. Frontend sending unexpected parameters');
    console.log('3. Authentication middleware issue');
    
  } catch (error) {
    console.error('❌ Expert debug failed:', error.message);
  }
}

expertDebug();
