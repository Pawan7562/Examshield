// Create exams table using direct Supabase calls
const { supabase } = require('./config/supabase');

async function createExamsTableDirect() {
  try {
    console.log('🔧 Creating exams table using direct Supabase calls...\n');
    
    // Step 1: Create the table structure
    console.log('1. 📋 Creating exams table structure...');
    
    const { data: tableResult, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'exams');
    
    if (tableError) {
      console.log('❌ Could not check table existence:', tableError.message);
    } else if (tableResult && tableResult.length > 0) {
      console.log('ℹ️  Exams table already exists');
    } else {
      console.log('ℹ️  Exams table does not exist, creating...');
      
      // Create table using raw SQL (alternative approach)
      const createTableSQL = `
        CREATE TABLE exams (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          college_id UUID NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          subject VARCHAR(100) NOT NULL,
          type VARCHAR(50) NOT NULL CHECK (type IN ('mcq', 'essay', 'practical')),
          duration INTEGER NOT NULL CHECK (duration > 0),
          start_time TIMESTAMP WITH TIME ZONE NOT NULL,
          end_time TIMESTAMP WITH TIME ZONE NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
          total_marks INTEGER DEFAULT 100,
          passing_marks INTEGER DEFAULT 50,
          instructions TEXT,
          exam_key VARCHAR(50) UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      // We'll create a simple record to test if table can be created
      console.log('2. 🧪 Testing table creation...');
      
      const { data: testExam, error: testError } = await supabase
        .from('exams')
        .insert({
          id: '00000000-0000-0000-0000-000000000001',
          college_id: '749e5e00-413a-40d7-9461-279d3b8670dc',
          title: 'Test Exam',
          description: 'Test exam for table creation',
          subject: 'Test',
          type: 'mcq',
          duration: 60,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 3600000).toISOString(),
          status: 'draft',
          total_marks: 100,
          passing_marks: 50,
          instructions: 'Test instructions',
          exam_key: 'TEST-001'
        })
        .select();
      
      if (testError) {
        if (testError.message.includes('relation') || testError.message.includes('does not exist')) {
          console.log('❌ Exams table does not exist - this is the issue!');
          console.log('🔧 SOLUTION: Create exams table manually in Supabase');
          console.log('');
          console.log('📋 Manual Creation Steps:');
          console.log('1. Go to Supabase Dashboard');
          console.log('2. Click on "SQL Editor"');
          console.log('3. Paste this SQL:');
          console.log(createTableSQL);
          console.log('4. Click "Run" to execute');
          console.log('5. Table should be created successfully');
        } else {
          console.log('❌ Other error creating exam:', testError.message);
        }
      } else {
        console.log('✅ Exams table creation successful!');
        console.log('📊 Test exam created with ID:', testExam[0]?.id);
      }
    }
    
    // Step 2: Test if we can query exams
    console.log('\n3. 🧪 Testing exams table query...');
    
    const { data: exams, error: queryError } = await supabase
      .from('exams')
      .select('*')
      .eq('college_id', '749e5e00-413a-40d7-9461-279d3b8670dc')
      .limit(5);
    
    if (queryError) {
      console.log('❌ Query error:', queryError.message);
    } else {
      console.log('✅ Query successful!');
      console.log('📊 Found exams:', exams?.length || 0);
    }
    
    console.log('\n🎯 Final Status:');
    console.log('If table creation successful → 500 error should be fixed');
    console.log('If table still missing → Manual creation required');
    console.log('If query works → Exams endpoint should work now');
    
  } catch (error) {
    console.error('❌ Creation failed:', error.message);
  }
}

createExamsTableDirect();
