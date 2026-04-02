// Debug students endpoint 400 error
const axios = require('axios');

// Mock localStorage
global.localStorage = {
  getItem: function(key) { return this[key] || null; },
  setItem: function(key, value) { this[key] = value; },
  removeItem: function(key) { delete this[key]; }
};

async function debugStudentsEndpoint() {
  try {
    console.log('🔍 Debugging Students Endpoint 400 Error\n');
    
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
    console.log('✅ Auth token obtained');
    
    // 2. Test students endpoint
    console.log('\n2. 👥 Testing /admin/students endpoint...');
    try {
      const studentsResponse = await api.get('/admin/students');
      console.log('✅ Students endpoint SUCCESS');
      console.log('Response:', JSON.stringify(studentsResponse.data, null, 2));
    } catch (studentsError) {
      console.log('❌ Students endpoint FAILED:');
      console.log('Status:', studentsError.response?.status);
      console.log('Error:', studentsError.response?.data);
      
      // Check if it's a database issue
      if (studentsError.response?.data?.message?.includes('students') || 
          studentsError.response?.data?.message?.includes('relation')) {
        console.log('\n🔧 Likely Issue: Missing students table');
        console.log('Solution: Create students table in Supabase');
      }
    }
    
    // 3. Check database tables
    console.log('\n3. 🗄️ Checking database tables...');
    const { supabase } = require('./config/supabase');
    
    try {
      const { data: tables, error } = await supabase
        .from('students')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log('❌ Students table error:', error.message);
        console.log('Solution: Create students table');
      } else {
        console.log('✅ Students table exists');
      }
    } catch (dbError) {
      console.log('❌ Database check failed:', dbError.message);
    }
    
    // 4. Provide SQL fix if needed
    console.log('\n🔧 If students table is missing, run this SQL in Supabase:');
    console.log('------------------------------------------------');
    console.log('CREATE TABLE IF NOT EXISTS students (');
    console.log('  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
    console.log('  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,');
    console.log('  student_id VARCHAR(20) UNIQUE NOT NULL,');
    console.log('  name VARCHAR(255) NOT NULL,');
    console.log('  email VARCHAR(255) UNIQUE NOT NULL,');
    console.log('  password VARCHAR(255) NOT NULL,');
    console.log('  roll_no VARCHAR(50),');
    console.log('  is_active BOOLEAN DEFAULT true,');
    console.log('  last_login TIMESTAMP WITH TIME ZONE,');
    console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    console.log(');');
    console.log('');
    console.log('ALTER TABLE students DISABLE ROW LEVEL SECURITY;');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugStudentsEndpoint();
