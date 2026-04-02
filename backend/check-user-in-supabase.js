// check-user-in-supabase.js - Check if user exists in Supabase
const { supabase } = require('./config/supabase');

async function checkUserInSupabase() {
  console.log('🔍 Checking if user exists in Supabase...');
  
  try {
    // Check for test@examshield.com
    console.log('\n📊 Step 1: Check test@examshield.com');
    const { data: testUser, error: testError } = await supabase
      .from('colleges')
      .select('*')
      .eq('email', 'test@examshield.com')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error checking test user:', testError);
    } else if (testUser && testUser.length > 0) {
      console.log('✅ Test user found:', {
        id: testUser[0].id,
        name: testUser[0].name,
        email: testUser[0].email,
        is_active: testUser[0].is_active
      });
    } else {
      console.log('❌ Test user NOT found in Supabase');
    }
    
    // Check for pawankumaryadav75628697@gmail.com
    console.log('\n📊 Step 2: Check pawankumaryadav75628697@gmail.com');
    const { data: emailUser, error: emailError } = await supabase
      .from('colleges')
      .select('*')
      .eq('email', 'pawankumaryadav75628697@gmail.com')
      .limit(1);
    
    if (emailError) {
      console.error('❌ Error checking email user:', emailError);
    } else if (emailUser && emailUser.length > 0) {
      console.log('✅ Email user found:', {
        id: emailUser[0].id,
        name: emailUser[0].name,
        email: emailUser[0].email,
        is_active: emailUser[0].is_active
      });
    } else {
      console.log('❌ Email user NOT found in Supabase');
    }
    
    // Check for admin@examshield.com
    console.log('\n📊 Step 3: Check admin@examshield.com');
    const { data: adminUser, error: adminError } = await supabase
      .from('colleges')
      .select('*')
      .eq('email', 'admin@examshield.com')
      .limit(1);
    
    if (adminError) {
      console.error('❌ Error checking admin user:', adminError);
    } else if (adminUser && adminUser.length > 0) {
      console.log('✅ Admin user found:', {
        id: adminUser[0].id,
        name: adminUser[0].name,
        email: adminUser[0].email,
        is_active: adminUser[0].is_active
      });
    } else {
      console.log('❌ Admin user NOT found in Supabase');
    }
    
    console.log('\n🎯 User Check Complete');
    console.log('\n📝 If users are NOT found, you need to:');
    console.log('  1. Run the complete database fix script in Supabase');
    console.log('  2. Or manually add users to the colleges table');
    console.log('  3. Check that Supabase is properly connected');
    
  } catch (error) {
    console.error('❌ Check error:', error);
  }
}

checkUserInSupabase();
