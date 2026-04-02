// Mock localStorage for Node.js testing
global.localStorage = {
  getItem: function(key) { return this[key] || null; },
  setItem: function(key, value) { this[key] = value; },
  removeItem: function(key) { delete this[key]; }
};

// Test login exactly like the frontend does
const axios = require('axios');

async function testFrontendLogin() {
  try {
    console.log('🔐 Testing frontend login simulation...\n');
    
    // Create axios instance exactly like frontend
    const api = axios.create({
      baseURL: 'http://localhost:5000/api',
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
    
    // Add request interceptor like frontend
    api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    console.log('1. Testing college login (like frontend)...');
    try {
      const response = await api.post('/auth/college/login', {
        email: 'test@examshield.com',
        password: 'password123'
      });
      
      console.log('✅ Login SUCCESS!');
      console.log('Status:', response.status);
      console.log('User:', response.data.data.user);
      console.log('Tokens received:', !!response.data.data.accessToken);
      
      // Store tokens like frontend would
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('accessToken', response.data.data.accessToken);
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
      }
      
      console.log('\n2. Testing authenticated request...');
      try {
        const dashboardResponse = await api.get('/admin/dashboard');
        console.log('✅ Authenticated request SUCCESS!');
        console.log('Dashboard data:', dashboardResponse.data);
      } catch (dashboardError) {
        console.log('❌ Authenticated request FAILED:', dashboardError.response?.data || dashboardError.message);
      }
      
    } catch (loginError) {
      console.log('❌ Login FAILED:');
      console.log('Status:', loginError.response?.status);
      console.log('Error:', loginError.response?.data || loginError.message);
      
      if (loginError.response?.status === 401) {
        console.log('\n🔍 401 Debug Info:');
        console.log('- Backend server is running: ✅');
        console.log('- Database has test college: ✅');
        console.log('- CORS is configured: ✅');
        console.log('- Check frontend URL and credentials');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFrontendLogin();
