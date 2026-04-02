// fix-backend-apis.js - Fix 401, 403, and 500 errors
const { supabase } = require('./config/supabase');

async function testBackendAPIs() {
  console.log('🔧 Testing and Fixing Backend APIs...');
  
  try {
    // Step 1: Get authentication token
    console.log('\n📊 Step 1: Get authentication token');
    const axios = require('axios');
    
    const loginResponse = await axios.post('http://localhost:5000/api/auth/college/login', {
      email: 'test@examshield.com',
      password: 'Test@123'
    });
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data);
      return;
    }
    
    const accessToken = loginResponse.data.data.accessToken;
    console.log('✅ Access token obtained');
    
    // Step 2: Test Dashboard API
    console.log('\n📊 Step 2: Test Dashboard API');
    try {
      const dashboardResponse = await axios.get('http://localhost:5000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Dashboard API Response:');
      console.log('  - Status:', dashboardResponse.status);
      console.log('  - Success:', dashboardResponse.data.success);
      
    } catch (dashboardError) {
      console.error('❌ Dashboard API Error:', dashboardError.response?.data);
      
      // Check if dashboard controller exists
      console.log('🔍 Checking dashboard controller...');
      const fs = require('fs');
      const path = require('path');
      const dashboardControllerPath = path.join(__dirname, 'controllers', 'adminController.js');
      
      if (!fs.existsSync(dashboardControllerPath)) {
        console.log('❌ Dashboard controller not found');
        
        // Create a basic dashboard controller
        const dashboardController = `
// controllers/adminController.js - Admin dashboard controller
const { supabase } = require('../config/supabase');

exports.getDashboard = async (req, res) => {
  try {
    const collegeId = req.user.id;
    
    // Get basic stats
    const [
      { count: totalStudents, error: studentsError },
      { count: totalExams, error: examsError },
      { count: activeExams, error: activeError }
    ] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('college_id', collegeId),
      supabase.from('exams').select('*', { count: 'exact', head: true }).eq('college_id', collegeId),
      supabase.from('exams').select('*', { count: 'exact', head: true }).eq('college_id', collegeId).eq('status', 'published')
    ]);
    
    const stats = {
      totalStudents: totalStudents || 0,
      totalExams: totalExams || 0,
      activeExams: activeExams || 0
    };
    
    res.json({
      success: true,
      data: { stats }
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data'
    });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const collegeId = req.user.id;
    const { limit = 50, offset = 0, search = '' } = req.query;
    
    let query = supabase
      .from('students')
      .select('*', { count: 'exact' })
      .eq('college_id', collegeId)
      .range(offset, offset + limit - 1);
    
    if (search) {
      query = query.or(\`name.ilike.%${search}%,email.ilike.%${search}%\`);
    }
    
    const { data: students, error, count } = await query;
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: { students, total: count || 0 }
    });
    
  } catch (error) {
    console.error('Students error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load students'
    });
  }
};

exports.getExams = async (req, res) => {
  try {
    const collegeId = req.user.id;
    const { limit = 50, offset = 0, status } = req.query;
    
    let query = supabase
      .from('exams')
      .select('*', { count: 'exact' })
      .eq('college_id', collegeId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: exams, error, count } = await query;
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: { exams, total: count || 0 }
    });
    
  } catch (error) {
    console.error('Exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load exams'
    });
  }
};
`;
        
        fs.writeFileSync(dashboardControllerPath, dashboardController);
        console.log('✅ Dashboard controller created');
      }
    }
    
    // Step 3: Test Students API
    console.log('\n📊 Step 3: Test Students API');
    try {
      const studentsResponse = await axios.get('http://localhost:5000/api/admin/students?limit=500', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Students API Response:');
      console.log('  - Status:', studentsResponse.status);
      console.log('  - Success:', studentsResponse.data.success);
      
    } catch (studentsError) {
      console.error('❌ Students API Error:', studentsError.response?.data);
    }
    
    // Step 4: Test Exams API
    console.log('\n📊 Step 4: Test Exams API');
    try {
      const examsResponse = await axios.get('http://localhost:5000/api/admin/exams', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Exams API Response:');
      console.log('  - Status:', examsResponse.status);
      console.log('  - Success:', examsResponse.data.success);
      
    } catch (examsError) {
      console.error('❌ Exams API Error:', examsError.response?.data);
    }
    
    console.log('\n🎯 Backend API Testing Complete');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testBackendAPIs();
