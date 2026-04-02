// fix-dashboard-auth.js - Fix dashboard authorization issues
const { supabase } = require('./config/supabase');

async function testDashboardAuth() {
  console.log('🔍 Testing Dashboard Authorization...');
  
  try {
    // Step 1: Get a valid token by logging in
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
    
    // Step 2: Test dashboard API with token
    console.log('\n📊 Step 2: Test dashboard API');
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
      console.log('  - Data:', dashboardResponse.data);
      
    } catch (dashboardError) {
      console.error('❌ Dashboard API Error:');
      if (dashboardError.response) {
        console.log('  - Status:', dashboardError.response.status);
        console.log('  - Message:', dashboardError.response.data?.message);
        console.log('  - Error:', dashboardError.response.data?.error);
      }
      
      // Step 3: Check if user exists in database
      console.log('\n📊 Step 3: Verify user in database');
      const { data: colleges, error } = await supabase
        .from('colleges')
        .select('*')
        .eq('email', 'test@examshield.com');
      
      if (error) {
        console.error('❌ Database error:', error);
        return;
      }
      
      if (colleges.length === 0) {
        console.log('❌ User not found in database');
        return;
      }
      
      const college = colleges[0];
      console.log('✅ User found in database:');
      console.log('  - ID:', college.id);
      console.log('  - Email:', college.email);
      console.log('  - Active:', college.is_active);
      
      // Step 4: Check JWT token payload
      console.log('\n📊 Step 4: Verify JWT token');
      const jwt = require('jsonwebtoken');
      
      try {
        const decoded = jwt.decode(accessToken);
        console.log('✅ JWT Token Payload:');
        console.log('  - ID:', decoded.id);
        console.log('  - Role:', decoded.role);
        console.log('  - Issued At:', new Date(decoded.iat * 1000));
        console.log('  - Expires At:', new Date(decoded.exp * 1000));
        
        // Check if token matches user
        if (decoded.id === college.id) {
          console.log('✅ Token ID matches user ID');
        } else {
          console.log('❌ Token ID does not match user ID');
          console.log('  - Token ID:', decoded.id);
          console.log('  - User ID:', college.id);
        }
        
      } catch (jwtError) {
        console.error('❌ JWT decode error:', jwtError);
      }
    }
    
    // Step 5: Test token refresh
    console.log('\n📊 Step 5: Test token refresh');
    try {
      const refreshToken = loginResponse.data.data.refreshToken;
      const refreshResponse = await axios.post('http://localhost:5000/api/auth/refresh', {
        refreshToken: refreshToken
      });
      
      console.log('✅ Token refresh successful');
      console.log('  - New token received');
      
    } catch (refreshError) {
      console.error('❌ Token refresh failed:', refreshError.response?.data || refreshError.message);
    }
    
    console.log('\n🎯 Dashboard Authorization Test Complete');
    console.log('📝 If dashboard still fails, check:');
    console.log('  1. JWT_SECRET is consistent');
    console.log('  2. User ID matches token payload');
    console.log('  3. Authorization header is properly formatted');
    console.log('  4. Backend middleware is correctly verifying tokens');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testDashboardAuth();
