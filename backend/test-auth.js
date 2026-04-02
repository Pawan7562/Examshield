// Quick test for authentication
const { supabase } = require('./config/supabase');

async function testAuth() {
  try {
    console.log('🔍 Testing college login...');
    
    // Test the exact query used in auth
    const { data: college, error } = await supabase
      .from('colleges')
      .select('*')
      .eq('email', 'test@examshield.com')
      .maybeSingle();
    
    console.log('College found:', college);
    console.log('Error:', error);
    
    if (college) {
      console.log('✅ Test college exists in database');
      console.log('Email:', college.email);
      console.log('Name:', college.name);
      console.log('Password hash length:', college.password?.length);
    } else {
      console.log('❌ Test college not found - you need to run the SQL scripts!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAuth();
