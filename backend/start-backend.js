// Simple backend status checker and starter
const http = require('http');
const { spawn } = require('child_process');

console.log('🔍 Checking if backend server is running...');

// Check if backend is running on port 5000
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/health',
  method: 'GET',
  timeout: 2000
};

const req = http.request(options, (res) => {
  console.log('✅ Backend server is already running on port 5000');
  console.log('Status:', res.statusCode);
  process.exit(0);
});

req.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    console.log('❌ Backend server is not running');
    console.log('');
    console.log('🚀 Starting backend server...');
    
    // Start the backend server
    const backend = spawn('node', ['server.js'], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    backend.on('close', (code) => {
      console.log(`Backend server process exited with code ${code}`);
    });
    
    // Give it time to start
    setTimeout(() => {
      console.log('📋 Backend server should be starting...');
      console.log('🌐 Server will be available at: http://localhost:5000');
      console.log('🔗 API endpoint: http://localhost:5000/api');
      console.log('');
      console.log('If you see any errors, make sure:');
      console.log('1. You are in the backend directory');
      console.log('2. All dependencies are installed (npm install)');
      console.log('3. Environment variables are set (.env file)');
      console.log('4. Database is accessible');
    }, 2000);
    
  } else {
    console.log('❌ Error checking backend:', err.message);
  }
});

req.on('timeout', () => {
  req.destroy();
  console.log('❌ Backend server check timed out');
  console.log('Starting backend server...');
  
  const backend = spawn('node', ['server.js'], {
    stdio: 'inherit',
    cwd: __dirname
  });
});

req.end();
