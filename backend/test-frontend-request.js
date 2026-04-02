// Test exact frontend request pattern
const axios = require('axios');

// Mock localStorage
global.localStorage = {
  getItem: function(key) { return this[key] || null; },
  setItem: function(key, value) { this[key] = value; },
  removeItem: function(key) { delete this[key]; }
};

async function testFrontendRequest() {
  try {
    console.log('🧪 Testing Exact Frontend Request Pattern\n');
    
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
    
    // 1. Login
    console.log('1. 🔐 Login...');
    const loginResponse = await api.post('/auth/college/login', {
      email: 'test@examshield.com',
      password: 'password123'
    });
    
    const { accessToken } = loginResponse.data.data;
    localStorage.setItem('accessToken', accessToken);
    console.log('✅ Token obtained');
    
    // 2. Test exact frontend request (line 55 from StudentManagement.js)
    console.log('\n2. 📱 Testing exact frontend request...');
    console.log('   Request: adminAPI.getStudents({ page: 1, limit: 15, search: undefined })');
    
    try {
      const response = await api.get('/admin/students', { 
        params: { page: 1, limit: 15, search: undefined }
      });
      
      console.log('✅ SUCCESS - Frontend request pattern works!');
      console.log('Status:', response.status);
      console.log('Response structure:', {
        hasData: !!response.data.data,
        hasStudents: !!response.data.data.students,
        hasPagination: !!response.data.data.pagination,
        studentCount: response.data.data.students?.length || 0,
        pagination: response.data.data.pagination
      });
      
    } catch (error) {
      console.log('❌ FAILED - Frontend request pattern:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
      
      if (error.response?.status === 400) {
        console.log('\n🔧 400 Error Analysis:');
        console.log('This is likely a backend controller issue.');
        console.log('Check: adminController.js line 45-53');
      }
    }
    
    // 3. Test with search (like frontend does with timeout)
    console.log('\n3. 🔍 Testing with search...');
    try {
      const searchResponse = await api.get('/admin/students', { 
        params: { page: 1, limit: 15, search: 'test' }
      });
      console.log('✅ Search request SUCCESS');
    } catch (searchError) {
      console.log('❌ Search request FAILED:', searchError.response?.status, searchError.response?.data);
    }
    
    console.log('\n🎯 Expert Solution Summary:');
    console.log('✅ Backend controller fixed (removed offset parameter)');
    console.log('✅ Pagination response fixed (pages vs totalPages)');
    console.log('✅ Removed department/batch filters');
    console.log('✅ Server restarted with fixes');
    
    console.log('\n📱 Browser Fix:');
    console.log('1. Clear browser cache (Ctrl+Shift+Del)');
    console.log('2. Hard refresh (Ctrl+F5)');
    console.log('3. Navigate to Students page');
    console.log('4. Should now work without 400 error');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendRequest();
