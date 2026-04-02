// add-users-to-supabase.js - Add users to Supabase database
const bcrypt = require('bcryptjs');
const { supabase } = require('./config/supabase');

async function addUsersToSupabase() {
  console.log('🔍 Adding users to Supabase...');
  
  try {
    // Add test@examshield.com user
    console.log('\n📊 Step 1: Add test@examshield.com');
    const testPassword = await bcrypt.hash('Test@123', 12);
    const { data: testUser, error: testError } = await supabase
      .from('colleges')
      .insert([{
        id: '176863da-7279-4ae4-afcc-6aa099d192b8',
        name: 'Test College',
        email: 'test@examshield.com',
        password: testPassword,
        role: 'college_admin',
        is_active: true,
        subscription_plan: 'basic',
        subscription_expiry: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (testError) {
      console.error('❌ Error adding test user:', testError);
    } else {
      console.log('✅ Test user added successfully');
    }
    
    // Add pawankumaryadav75628697@gmail.com user
    console.log('\n📊 Step 2: Add pawankumaryadav75628697@gmail.com');
    const emailPassword = await bcrypt.hash('Test@123', 12);
    const { data: emailUser, error: emailError } = await supabase
      .from('colleges')
      .insert([{
        id: '276863da-7279-4ae4-afcc-6aa099d192b9',
        name: 'Pawan Kumar',
        email: 'pawankumaryadav75628697@gmail.com',
        password: emailPassword,
        role: 'college_admin',
        is_active: true,
        subscription_plan: 'basic',
        subscription_expiry: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (emailError) {
      console.error('❌ Error adding email user:', emailError);
    } else {
      console.log('✅ Email user added successfully');
    }
    
    // Add admin@examshield.com user
    console.log('\n📊 Step 3: Add admin@examshield.com');
    const adminPassword = await bcrypt.hash('Admin@123', 12);
    const { data: adminUser, error: adminError } = await supabase
      .from('colleges')
      .insert([{
        id: '376863da-7279-4ae4-afcc-6aa099d192b9',
        name: 'Super Admin',
        email: 'admin@examshield.com',
        password: adminPassword,
        role: 'super_admin',
        is_active: true,
        subscription_plan: 'enterprise',
        subscription_expiry: null, // No expiry for super admin
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (adminError) {
      console.error('❌ Error adding admin user:', adminError);
    } else {
      console.log('✅ Admin user added successfully');
    }
    
    console.log('\n🎯 User Addition Complete');
    console.log('\n📝 Users added to Supabase database!');
    console.log('\n🔐 You can now login with:');
    console.log('  - test@examshield.com / Test@123');
    console.log('  - pawankumaryadav75628697@gmail.com / Test@123');
    console.log('  - admin@examshield.com / Admin@123');
    
  } catch (error) {
    console.error('❌ Addition error:', error);
  }
}

addUsersToSupabase();
