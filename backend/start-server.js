// start-server.js - Simple server startup without npm dependencies
console.log('🚀 Starting ExamShield Backend Server...');

// Check if we have basic dependencies
try {
  require('express');
  require('bcryptjs');
  require('jsonwebtoken');
  require('cors');
  require('helmet');
  console.log('✅ Core dependencies loaded');
} catch (error) {
  console.error('❌ Missing core dependencies:', error.message);
  console.log('Please run: npm install express bcryptjs jsonwebtoken cors helmet');
  process.exit(1);
}

// Check database configuration
try {
  const { query } = require('./config/supabase');
  console.log('✅ Database configuration loaded');
} catch (error) {
  console.error('❌ Database configuration error:', error.message);
  process.exit(1);
}

// Start the server
try {
  require('./server.js');
} catch (error) {
  console.error('❌ Server startup error:', error.message);
  process.exit(1);
}
