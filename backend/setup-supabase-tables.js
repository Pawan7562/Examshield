// setup-supabase-tables.js - Create Supabase tables directly
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jzxvxxgsfbzqhrirnqfm.supabase.co';
const supabaseKey = 'sb_publishable_y3eNbkdEjC59m67N0GiY4Q_1rOveLyL';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  console.log('🏗 Creating Supabase tables...');
  
  try {
    // Create colleges table
    const { error: collegesError } = await supabase.rpc('create_colleges_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS colleges (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          address TEXT,
          website VARCHAR(255),
          subscription_plan VARCHAR(50) DEFAULT 'basic',
          subscription_expiry TIMESTAMP,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `
    });
    
    if (collegesError) {
      console.error('❌ Colleges table error:', collegesError);
    } else {
      console.log('✅ Colleges table created');
    }

    // Create super_admins table
    const { error: adminsError } = await supabase.rpc('create_super_admins_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS super_admins (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'super_admin',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });
    
    if (adminsError) {
      console.error('❌ Super admins table error:', adminsError);
    } else {
      console.log('✅ Super admins table created');
    }

    // Create subscriptions table
    const { error: subsError } = await supabase.rpc('create_subscriptions_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
          plan VARCHAR(50) NOT NULL,
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP NOT NULL,
          status VARCHAR(20) DEFAULT 'active',
          amount DECIMAL(10,2) DEFAULT 0,
          max_students INTEGER DEFAULT 50,
          max_exams INTEGER DEFAULT 10,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });
    
    if (subsError) {
      console.error('❌ Subscriptions table error:', subsError);
    } else {
      console.log('✅ Subscriptions table created');
    }

    // Create students table
    const { error: studentsError } = await supabase.rpc('create_students_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS students (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
          student_id VARCHAR(20) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });
    
    if (studentsError) {
      console.error('❌ Students table error:', studentsError);
    } else {
      console.log('✅ Students table created');
    }

    // Create exams table
    const { error: examsError } = await supabase.rpc('create_exams_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS exams (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          subject VARCHAR(100),
          type VARCHAR(20) DEFAULT 'mcq',
          duration INTEGER NOT NULL,
          total_marks INTEGER DEFAULT 100,
          exam_code VARCHAR(10) UNIQUE NOT NULL,
          date_time TIMESTAMP,
          status VARCHAR(20) DEFAULT 'draft',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    });
    
    if (examsError) {
      console.error('❌ Exams table error:', examsError);
    } else {
      console.log('✅ Exams table created');
    }

    // Insert default super admin
    const { error: insertError } = await supabase
      .from('super_admins')
      .insert([{
        name: 'Super Admin',
        email: 'admin@examshield.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', // SuperAdmin@123
        role: 'super_admin'
      }])
      .select();
    
    if (insertError) {
      console.error('❌ Super admin insert error:', insertError);
    } else {
      console.log('✅ Default super admin inserted');
    }

    console.log('🎉 Supabase database setup complete!');
    
  } catch (error) {
    console.error('❌ Database setup error:', error);
  }
}

// Alternative: Use REST API if RPC doesn't work
async function createTablesREST() {
  console.log('🏗 Creating Supabase tables using REST API...');
  
  try {
    // Create colleges table
    const { error: collegesError } = await supabase
      .from('colleges')
      .select('*')
      .limit(1);
    
    if (!collegesError && collegesError.message !== 'Invalid API key') {
      console.log('✅ Colleges table exists or created');
    } else {
      console.log('⚠️ Colleges table check failed, but continuing...');
    }

    // Insert default super admin
    const { error: insertError } = await supabase
      .from('super_admins')
      .insert([{
        name: 'Super Admin',
        email: 'admin@examshield.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', // SuperAdmin@123
        role: 'super_admin'
      }])
      .select();
    
    if (insertError) {
      console.error('❌ Super admin insert error:', insertError);
    } else {
      console.log('✅ Default super admin inserted');
    }

    console.log('🎉 Supabase database setup complete!');
    
  } catch (error) {
    console.error('❌ Database setup error:', error);
  }
}

createTables();
