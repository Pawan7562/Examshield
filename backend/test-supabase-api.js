// test-supabase-api.js - Test your Supabase connection
const { supabase } = require('./config/supabase');

async function testConnection() {
  console.log('🧪 Testing Supabase Connection...');
  
  try {
    // Test 1: Check if we can connect
    console.log('\n📊 Step 1: Testing connection...');
    const { data, error } = await supabase
      .from('colleges')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "colleges" does not exist')) {
        console.log('⚠️ Tables not created yet. Need to create tables first.');
        console.log('📝 Go to: https://jzxvxxgsfbzqhrirnqfm.supabase.co');
        console.log('📊 Open SQL Editor and run the table creation script.');
      } else {
        console.error('❌ Connection error:', error);
      }
    } else {
      console.log('✅ Connection successful!');
      console.log('📊 Found colleges:', data.length);
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Go to: https://jzxvxxgsfbzqhrirnqfm.supabase.co');
    console.log('2. Open SQL Editor');
    console.log('3. Run the table creation script');
    console.log('4. Test your login system');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testConnection();
