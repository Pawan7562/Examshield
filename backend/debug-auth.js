// Debug authentication issues
const { supabase } = require('./config/supabase');

async function debugAuth() {
  try {
    console.log('🔍 Debugging authentication issues...\n');
    
    // 1. Check if colleges table exists
    console.log('1. Checking colleges table...');
    const { data: tables, error: tableError } = await supabase
      .from('colleges')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Colleges table error:', tableError.message);
      console.log('Solution: Run the SQL script to create the table');
      return;
    }
    
    // 2. Check for test college
    console.log('\n2. Checking for test college...');
    const { data: college, error: collegeError } = await supabase
      .from('colleges')
      .select('*')
      .eq('email', 'test@examshield.com')
      .maybeSingle();
    
    if (collegeError) {
      console.log('❌ College query error:', collegeError.message);
    } else if (college) {
      console.log('✅ Test college found:');
      console.log('   Email:', college.email);
      console.log('   Name:', college.name);
      console.log('   Active:', college.is_active);
      console.log('   Password hash exists:', !!college.password);
    } else {
      console.log('❌ No test college found');
      console.log('Solution: INSERT the test college data');
    }
    
    // 3. Check super admins
    console.log('\n3. Checking super admins...');
    const { data: admin, error: adminError } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', 'admin@examshield.com')
      .maybeSingle();
    
    if (adminError) {
      console.log('❌ Super admin table error:', adminError.message);
    } else if (admin) {
      console.log('✅ Super admin found:', admin.email);
    } else {
      console.log('❌ No super admin found');
    }
    
    // 4. Test direct API call simulation
    console.log('\n4. Testing authentication logic...');
    if (college && college.password) {
      const bcrypt = require('bcryptjs');
      const testPassword = 'password123';
      
      try {
        const isValid = await bcrypt.compare(testPassword, college.password);
        console.log('✅ Password validation:', isValid ? 'PASSED' : 'FAILED');
      } catch (bcryptError) {
        console.log('❌ bcrypt error:', bcryptError.message);
      }
    }
    
    console.log('\n🔧 If issues persist, run this SQL in Supabase:');
    console.log('----------------------------------------');
    console.log('DROP TABLE IF EXISTS colleges CASCADE;');
    console.log('DROP TABLE IF EXISTS super_admins CASCADE;');
    console.log('');
    console.log('CREATE TABLE colleges (');
    console.log('  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
    console.log('  name VARCHAR(255) NOT NULL,');
    console.log('  email VARCHAR(255) UNIQUE NOT NULL,');
    console.log('  password VARCHAR(255) NOT NULL,');
    console.log('  phone VARCHAR(20),');
    console.log('  address TEXT,');
    console.log('  website VARCHAR(255),');
    console.log('  subscription_plan VARCHAR(50) DEFAULT \'basic\',');
    console.log('  subscription_expiry TIMESTAMP WITH TIME ZONE,');
    console.log('  is_active BOOLEAN DEFAULT true,');
    console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    console.log(');');
    console.log('');
    console.log('ALTER TABLE colleges DISABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('INSERT INTO colleges (name, email, password, phone, address, website, subscription_plan, is_active, subscription_expiry)');
    console.log('VALUES (\'Test College\', \'test@examshield.com\', \'$2a$12$iGKR0au8j09EfzWhLKJPaORI.L/UhR9DqFY4EmPvQHHceOeRT/W0e\', \'1234567890\', \'Test Address\', \'http://test.com\', \'basic\', true, NOW() + INTERVAL \'14 days\');');
    console.log('');
    console.log('CREATE TABLE super_admins (');
    console.log('  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
    console.log('  name VARCHAR(255) NOT NULL,');
    console.log('  email VARCHAR(255) UNIQUE NOT NULL,');
    console.log('  password VARCHAR(255) NOT NULL,');
    console.log('  role VARCHAR(50) DEFAULT \'super_admin\',');
    console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    console.log(');');
    console.log('');
    console.log('INSERT INTO super_admins (name, email, password, role)');
    console.log('VALUES (\'Super Admin\', \'admin@examshield.com\', \'$2a$12$Eegqb8BbC9AM2CRAvSpJ9O/GIlft9TTk2BCbamP5KmhJ11/9EWZha\', \'super_admin\');');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugAuth();
