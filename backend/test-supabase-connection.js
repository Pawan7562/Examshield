// test-supabase-connection.js - Test Supabase database operations
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jzxvxxgsfbzqhrirnqfm.supabase.co';
const supabaseKey = 'sb_publishable_y3eNbkdEjC59m67N0GiY4Q_1rOveLyL';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test if colleges table exists and can be queried
    console.log('📊 Testing colleges table...');
    const { data, error } = await supabase
      .from('colleges')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Colleges table error:', error);
      console.log('📝 This means the table doesn\'t exist yet');
      console.log('🔧 Solution: Create tables in Supabase dashboard');
      
      // Try to create a simple record to test
      console.log('🏗 Attempting to create table structure...');
      const { data: insertData, error: insertError } = await supabase
        .from('colleges')
        .insert([{
          name: 'Test College',
          email: 'test@example.com',
          password: 'test123',
          subscription_plan: 'basic'
        }])
        .select();
      
      if (insertError) {
        console.error('❌ Insert error:', insertError);
        console.log('📝 This confirms the table doesn\'t exist');
      } else {
        console.log('✅ Insert successful:', insertData);
      }
    } else {
      console.log('✅ Colleges table exists');
      console.log('📊 Data:', data);
    }
    
    // Test login query
    console.log('🔐 Testing login query...');
    const { data: loginData, error: loginError } = await supabase
      .from('colleges')
      .select('*')
      .eq('email', 'test@example.com');
    
    if (loginError) {
      console.error('❌ Login query error:', loginError);
    } else {
      console.log('✅ Login query successful:', loginData);
    }
    
  } catch (err) {
    console.error('❌ Connection error:', err);
  }
}

testConnection();
