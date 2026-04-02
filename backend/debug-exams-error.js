// Debug 500 error on /api/admin/exams
const axios = require('axios');

// Mock localStorage
global.localStorage = {
  getItem: function(key) { return this[key] || null; },
  setItem: function(key, value) { this[key] = value; },
  removeItem: function(key) { delete this[key]; }
};

async function debugExamsError() {
  try {
    console.log('🔍 Debugging 500 Error on /api/admin/exams\n');
    
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
    console.log('1. 🔐 Logging in as admin...');
    const loginResponse = await api.post('/auth/college/login', {
      email: 'test@examshield.com',
      password: 'password123'
    });
    
    const { accessToken } = loginResponse.data.data;
    localStorage.setItem('accessToken', accessToken);
    console.log('✅ Logged in');
    
    // Test exams endpoint
    console.log('\n2. 📋 Testing /api/admin/exams endpoint...');
    console.log('This should trigger the 500 error...');
    
    try {
      const examsResponse = await api.get('/admin/exams');
      console.log('✅ Exams endpoint works!');
      console.log('Response:', JSON.stringify(examsResponse.data, null, 2));
      
    } catch (examsError) {
      console.log('❌ Exams endpoint failed:');
      console.log('Status:', examsError.response?.status);
      console.log('Error:', examsError.response?.data);
      
      if (examsError.response?.status === 500) {
        console.log('\n🔍 500 Error Analysis:');
        console.log('Possible causes:');
        console.log('1. "exams" table does not exist');
        console.log('2. Database schema issues');
        console.log('3. Permission issues (RLS policies)');
        console.log('4. College_id mismatch');
        console.log('5. Database connection issues');
      }
    }
    
    // Check if exams table exists
    console.log('\n3. 🗃️ Checking database schema...');
    const { supabase } = require('./config/supabase');
    
    try {
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'exams');
      
      if (tablesError) {
        console.log('❌ Could not check table schema:', tablesError.message);
      } else {
        if (tables && tables.length > 0) {
          console.log('✅ "exams" table exists in database');
        } else {
          console.log('❌ "exams" table does NOT exist in database');
          console.log('🔧 This is likely the cause of 500 error');
        }
      }
      
      // Try to query exams table directly
      console.log('\n4. 🧪 Direct exams table test...');
      const collegeId = 'test-college-id'; // Using test ID
      
      const { data: directExams, error: directError } = await supabase
        .from('exams')
        .select('count')
        .eq('college_id', collegeId)
        .limit(1);
      
      if (directError) {
        console.log('❌ Direct exams query failed:', directError.message);
        console.log('🔧 This confirms database/table issue');
      } else {
        console.log('✅ Direct exams query works');
        console.log('Count:', directExams?.length || 0);
      }
      
    } catch (schemaError) {
      console.log('❌ Schema check failed:', schemaError.message);
    }
    
    console.log('\n5. 🎯 Diagnosis Summary:');
    console.log('If "exams" table missing → Create table');
    console.log('If direct query fails → Fix schema/permissions');
    console.log('If both work → Check authentication/college_id');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugExamsError();
