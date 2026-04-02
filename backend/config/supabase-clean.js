// config/supabase-clean.js - Clean Supabase configuration
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://jzxvxxgsfbzqhrirnqfm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'sb_publishable_Y3eNbkdEjC59m67N0GiY4Q_1rOveLyL';

console.log('🔗 Supabase Configuration:');
console.log('URL:', supabaseUrl ? '✅ Configured' : '❌ Missing');
console.log('Key:', supabaseKey ? '✅ Service Key Configured' : '❌ Missing');

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Supabase client initialized successfully');

module.exports = { supabase };
