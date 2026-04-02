// test-backend.js - Simple test to verify backend is working
const axios = require('axios');

async function testBackend() {
  try {
    console.log('Testing backend registration...');
    
    const response = await axios.post('http://localhost:5000/api/auth/college/register', {
      name: 'Test Admin',
      email: 'test@example.com',
      password: 'password123',
      collegeName: 'Test College'
    });
    
    console.log('✅ Registration successful!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Registration failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testBackend();
