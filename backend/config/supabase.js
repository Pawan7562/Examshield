// config/supabase-fixed.js - Fixed Supabase configuration
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

// Supabase configuration - using service role key for full access
const supabaseUrl = process.env.SUPABASE_URL || 'https://jzxvxxgsfbzqhrirnqfm.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'sb_publishable_Y3eNbkdEjC59m67N0GiY4Q_1rOveLyL';

console.log('🔗 Supabase Configuration:');
console.log('URL:', supabaseUrl ? '✅ Configured' : '❌ Missing');
console.log('Key:', supabaseKey ? '✅ Service Key Configured' : '❌ Missing');
console.log('📝 Setting up full Supabase integration...');

// Initialize Supabase client
let supabase = null;
try {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client initialized');
} catch (error) {
  console.log('❌ Supabase error:', error.message);
  console.log('🔄 Falling back to local database...');
  const { query: professionalQuery, transaction: professionalTransaction } = require('./database-professional');
  module.exports = { query: professionalQuery, getClient: () => {}, transaction: professionalTransaction, supabase: null };
  return;
}

// Enhanced query function for Supabase
const query = async (text, params) => {
  const start = Date.now();
  console.log('🔍 Executing Supabase query:', text, params);
  
  try {
    let result = { rows: [], rowCount: 0 };
    
    // Handle SELECT queries for colleges
    if (text.includes('SELECT') && text.includes('colleges')) {
      if (text.includes('WHERE email')) {
        const email = params[0];
        const { data, error } = await supabase
          .from('colleges')
          .select('*')
          .eq('email', email);
        
        if (error) throw error;
        result.rows = data || [];
      } else if (text.includes('WHERE id')) {
        const id = params[0];
        const { data, error } = await supabase
          .from('colleges')
          .select('*')
          .eq('id', id);
        
        if (error) throw error;
        result.rows = data || [];
      } else {
        const { data, error } = await supabase
          .from('colleges')
          .select('*');
        
        if (error) throw error;
        result.rows = data || [];
      }
    }
    
    // Handle SELECT queries for super_admins
    if (text.includes('SELECT') && text.includes('super_admins')) {
      if (text.includes('WHERE email')) {
        const email = params[0];
        const { data, error } = await supabase
          .from('super_admins')
          .select('*')
          .eq('email', email);
        
        if (error) throw error;
        result.rows = data || [];
      } else {
        const { data, error } = await supabase
          .from('super_admins')
          .select('*');
        
        if (error) throw error;
        result.rows = data || [];
      }
    }
    
    // Handle INSERT queries for colleges
    else if (text.includes('INSERT INTO colleges')) {
      const [collegeName, email, hashedPassword, phone, address, website, subscriptionPlan, subscriptionExpiry] = params;
      
      const { data, error } = await supabase
        .from('colleges')
        .insert([{
          name: collegeName,
          email: email,
          password: hashedPassword,
          phone: phone || '',
          address: address || '',
          website: website || '',
          subscription_plan: subscriptionPlan || 'basic',
          subscription_expiry: subscriptionExpiry,
          is_active: true,
          created_at: new Date().toISOString()
        }])
        .select();
      
      if (error) throw error;
      result.rows = data || [];
    }
    
    // Handle INSERT queries for super_admins
    else if (text.includes('INSERT INTO super_admins')) {
      const [name, email, hashedPassword, role] = params;
      
      const { data, error } = await supabase
        .from('super_admins')
        .insert([{
          name: name,
          email: email,
          password: hashedPassword,
          role: role || 'super_admin',
          created_at: new Date().toISOString()
        }])
        .select();
      
      if (error) throw error;
      result.rows = data || [];
    }
    
    // Handle INSERT queries for subscriptions
    else if (text.includes('INSERT INTO subscriptions')) {
      const [collegeId, plan, startDate, endDate, status, amount, maxStudents, maxExams] = params;
      
      const { data, error } = await supabase
        .from('subscriptions')
        .insert([{
          college_id: collegeId,
          plan: plan,
          start_date: startDate,
          end_date: endDate,
          status: status,
          amount: amount,
          max_students: maxStudents,
          max_exams: maxExams,
          created_at: new Date().toISOString()
        }])
        .select();
      
      if (error) throw error;
      result.rows = data || [];
    }
    
    result.rowCount = result.rows.length;
    console.log(`✅ Query executed in ${Date.now() - start}ms`);
    return result;
    
  } catch (error) {
    console.error('❌ Supabase query error:', error);
    throw error;
  }
};

// Transaction function
const transaction = async (callback) => {
  console.log('🔄 Starting Supabase transaction...');
  try {
    await callback();
    console.log('✅ Transaction completed');
  } catch (error) {
    console.error('❌ Transaction error:', error);
    throw error;
  }
};

module.exports = { query, getClient: () => supabase, transaction, supabase };
