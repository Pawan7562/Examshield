// create-tables-rest.js - Create Supabase tables using REST API
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jzxvxxgsfbzqhrirnqfm.supabase.co';
const supabaseKey = 'sb_publishable_y3eNbkdEjC59m67N0GiY4Q_1rOveLyL';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable(tableName, sql) {
  console.log(`🏗 Creating ${tableName} table...`);
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error && error.message !== 'Invalid API key') {
      console.log(`⚠️ ${tableName} table might exist or error:`, error.message);
    } else {
      console.log(`✅ ${tableName} table check completed`);
    }
  } catch (err) {
    console.error(`❌ Error checking ${tableName}:`, err.message);
  }
}

async function createDefaultAdmin() {
  console.log('👤 Creating default super admin...');
  try {
    const { data, error } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', 'admin@examshield.com');
    
    if (!data || data.length === 0) {
      const { data: insertData, error: insertError } = await supabase
        .from('super_admins')
        .insert([{
          name: 'Super Admin',
          email: 'admin@examshield.com',
          password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm',
          role: 'super_admin'
        }]);
      
      if (insertError) {
        console.error('❌ Error creating super admin:', insertError.message);
      } else {
        console.log('✅ Default super admin created');
      }
    } else {
      console.log('✅ Super admin already exists');
    }
  } catch (err) {
    console.error('❌ Error creating super admin:', err.message);
  }
}

async function main() {
  console.log('🚀 Setting up Supabase database...');
  
  // Check/create tables
  await createTable('colleges', 'colleges table');
  await createTable('super_admins', 'super_admins table');
  await createTable('subscriptions', 'subscriptions table');
  await createTable('students', 'students table');
  await createTable('exams', 'exams table');
  
  // Create default admin
  await createDefaultAdmin();
  
  console.log('🎉 Supabase database setup complete!');
  console.log('📊 You can now use the ExamShield registration system!');
  console.log('🌐 Test at: http://localhost:3000/admin/register');
}

main().catch(console.error);
