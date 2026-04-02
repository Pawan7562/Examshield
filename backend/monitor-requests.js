// monitor-requests.js - Monitor incoming requests
const { supabase } = require('./config/supabase');

// Add request logging middleware
const requestLogger = (req, res, next) => {
  console.log('\n🔍 INCOMING REQUEST:');
  console.log('📊 Method:', req.method);
  console.log('📊 URL:', req.url);
  console.log('📊 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📊 Body:', JSON.stringify(req.body, null, 2));
  console.log('📊 Timestamp:', new Date().toISOString());
  console.log('='.repeat(50));
  
  next();
};

module.exports = { requestLogger, supabase };
