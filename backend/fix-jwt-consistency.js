// fix-jwt-consistency.js - Fix JWT secret consistency issue
const fs = require('fs');
const path = require('path');

async function fixJWTConsistency() {
  console.log('🔧 Fixing JWT Secret Consistency...');
  
  try {
    // Step 1: Check current JWT secret in backend
    console.log('\n📊 Step 1: Check current JWT configuration');
    const jwt = require('jsonwebtoken');
    const bcrypt = require('bcryptjs');
    
    // Load environment variables
    require('dotenv').config();
    
    const currentSecret = process.env.JWT_SECRET;
    console.log('🔑 Current JWT_SECRET:', currentSecret ? 'Configured' : 'Missing');
    
    if (!currentSecret) {
      console.log('❌ JWT_SECRET is missing from environment');
      return;
    }
    
    // Step 2: Test token generation and verification
    console.log('\n📊 Step 2: Test JWT token consistency');
    
    // Get user from database
    const { supabase } = require('./config/supabase');
    const { data: colleges } = await supabase
      .from('colleges')
      .select('*')
      .eq('email', 'test@examshield.com')
      .limit(1);
    
    if (!colleges || colleges.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const college = colleges[0];
    console.log('✅ User found:', college.email);
    
    // Generate test token
    const payload = { 
      id: college.id, 
      role: 'college_admin' 
    };
    
    const testToken = jwt.sign(payload, currentSecret, { 
      expiresIn: '7d' 
    });
    
    console.log('✅ Test token generated');
    
    // Verify token
    try {
      const decoded = jwt.verify(testToken, currentSecret);
      console.log('✅ Token verification successful');
      console.log('  - Decoded ID:', decoded.id);
      console.log('  - User ID:', college.id);
      console.log('  - Match:', decoded.id === college.id);
    } catch (verifyError) {
      console.error('❌ Token verification failed:', verifyError.message);
      return;
    }
    
    // Step 3: Check backend auth middleware
    console.log('\n📊 Step 3: Check backend auth middleware');
    
    // Test with actual API
    const axios = require('axios');
    
    try {
      const response = await axios.get('http://localhost:5000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Dashboard API successful with test token');
      console.log('  - Status:', response.status);
      
    } catch (apiError) {
      console.error('❌ Dashboard API still failing:', apiError.response?.data);
      
      if (apiError.response?.status === 401) {
        console.log('\n🔧 Applying JWT consistency fix...');
        
        // The issue might be that the backend is using a different JWT secret
        // Let's ensure the .env file has the correct secret
        
        const envPath = path.join(__dirname, '.env');
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
          envContent = fs.readFileSync(envPath, 'utf8');
        }
        
        // Update or add JWT_SECRET
        const jwtSecretLine = `JWT_SECRET=examshield_jwt_secret_key_change_in_production_123456`;
        
        if (envContent.includes('JWT_SECRET=')) {
          envContent = envContent.replace(/JWT_SECRET=.*/g, jwtSecretLine);
        } else {
          envContent += `\n${jwtSecretLine}`;
        }
        
        fs.writeFileSync(envPath, envContent);
        console.log('✅ JWT_SECRET updated in .env file');
        
        // Also add other required JWT secrets
        const otherSecrets = [
          'JWT_EXPIRES_IN=7d',
          'JWT_REFRESH_SECRET=examshield_refresh_secret_key_change_in_production_123456',
          'JWT_REFRESH_EXPIRES_IN=30d'
        ];
        
        otherSecrets.forEach(secret => {
          if (!envContent.includes(secret.split('=')[0] + '=')) {
            envContent += `\n${secret}`;
          }
        });
        
        fs.writeFileSync(envPath, envContent);
        console.log('✅ All JWT secrets configured');
        
        console.log('\n🔄 Please restart the backend server to apply changes:');
        console.log('1. Stop the current backend process');
        console.log('2. Run: node server.js');
        console.log('3. Try login again');
      }
    }
    
    console.log('\n🎯 JWT Consistency Fix Complete');
    
  } catch (error) {
    console.error('❌ Fix error:', error);
  }
}

fixJWTConsistency();
