// check-supabase-tables.js - Check if tables exist in Supabase
const { supabase } = require('./config/supabase');

async function checkTables() {
  console.log('🔍 Checking Supabase Tables...');
  
  try {
    // Test 1: Try to access colleges table
    console.log('\n📊 Testing colleges table...');
    const { data, error } = await supabase
      .from('colleges')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "colleges" does not exist')) {
        console.log('❌ Colleges table does not exist');
        console.log('📝 Need to run the SQL script first');
        console.log('🔗 Go to: https://jzxvxxgsfbzqhrirnqfm.supabase.co');
        console.log('📊 Open SQL Editor and run the create-tables-supabase.sql script');
      } else {
        console.log('❌ Error accessing colleges table:', error.message);
      }
    } else {
      console.log('✅ Colleges table exists!');
      console.log('📊 Current colleges:', data.length);
      
      if (data.length > 0) {
        console.log('🏫 Sample college:', data[0]);
      }
    }
    
    // Test 2: Try to access super_admins table
    console.log('\n📊 Testing super_admins table...');
    const { data: adminData, error: adminError } = await supabase
      .from('super_admins')
      .select('*')
      .limit(1);
    
    if (adminError) {
      console.log('❌ Super admins table error:', adminError.message);
    } else {
      console.log('✅ Super admins table exists!');
      console.log('👑 Current admins:', adminData.length);
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('1. If tables don\'t exist, run the SQL script');
    console.log('2. If tables exist but can\'t open, refresh the page');
    console.log('3. Check your permissions in Supabase dashboard');
    
  } catch (error) {
    console.error('❌ Check error:', error);
  }
}

checkTables();
