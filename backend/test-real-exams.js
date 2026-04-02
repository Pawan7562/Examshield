// Test real exams endpoint with proper authentication
const axios = require('axios');

// Mock localStorage
global.localStorage = {
  getItem: function(key) { return this[key] || null; },
  setItem: function(key, value) { this[key] = value; },
  removeItem: function(key) { delete this[key]; }
};

async function testRealExams() {
  try {
    console.log('🔍 Testing Real Exams Endpoint\n');
    
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
    
    // Login and get real college ID
    console.log('1. 🔐 Logging in and getting college ID...');
    const loginResponse = await api.post('/auth/college/login', {
      email: 'test@examshield.com',
      password: 'password123'
    });
    
    const { accessToken, user } = loginResponse.data.data;
    localStorage.setItem('accessToken', accessToken);
    console.log('✅ Logged in');
    console.log('College ID:', user.id);
    
    // Test exams with different parameters
    console.log('\n2. 📋 Testing exams with different parameters...');
    
    const testCases = [
      { name: 'Basic exams', params: {} },
      { name: 'Exams with limit', params: { limit: 10 } },
      { name: 'Exams with offset', params: { offset: 0 } },
      { name: 'Exams with status', params: { status: 'active' } },
      { name: 'Exams with all params', params: { limit: 10, offset: 0, status: 'active' } }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n   Testing: ${testCase.name}`);
      try {
        const response = await api.get('/admin/exams', { params: testCase.params });
        console.log(`   ✅ Success: ${response.data.success}`);
        console.log(`   📊 Exams count: ${response.data.data?.total || 0}`);
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.response?.status}`);
        console.log(`   📝 Error: ${error.response?.data?.error || error.message}`);
        
        if (error.response?.status === 500) {
          console.log(`   🔍 This is the 500 error!`);
          console.log(`   📋 Params: ${JSON.stringify(testCase.params)}`);
        }
      }
    }
    
    // Check if we need to create exams table
    console.log('\n3. 🗃️ Checking if exams table needs to be created...');
    const { supabase } = require('./config/supabase');
    
    try {
      // Try to get exams table structure
      const { data: examSample, error: sampleError } = await supabase
        .from('exams')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.log('❌ Exams table query failed:', sampleError.message);
        
        if (sampleError.message.includes('relation') || sampleError.message.includes('does not exist')) {
          console.log('🔧 DIAGNOSIS: "exams" table does not exist');
          console.log('🔧 SOLUTION: Create exams table');
        }
      } else {
        console.log('✅ Exams table exists and is queryable');
        console.log('📊 Sample data:', examSample?.length || 0, 'records');
      }
      
    } catch (tableError) {
      console.log('❌ Table check failed:', tableError.message);
    }
    
    console.log('\n4. 🎯 Final Diagnosis:');
    console.log('If tests pass → Frontend cache issue');
    console.log('If tests fail → Backend database issue');
    console.log('If table missing → Need to create table');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRealExams();
