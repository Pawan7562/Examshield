// Force create exams table using Supabase client
const { supabase } = require('./config/supabase');

async function forceCreateExamsTable() {
  try {
    console.log('🔧 Force Creating Exams Table\n');
    
    // Create the table using raw SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS exams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
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
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_exams_college_id ON exams(college_id);
      CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
      CREATE INDEX IF NOT EXISTS idx_exams_start_time ON exams(start_time);
      CREATE INDEX IF NOT EXISTS idx_exams_created_at ON exams(created_at);
    `;
    
    console.log('1. 📋 Creating table structure...');
    
    // Execute the SQL
    const { data, error } = await supabase
      .rpc('exec_sql', { 
        sql_string: createTableSQL
      });
    
    if (error) {
      console.error('❌ Table creation failed:', error);
      return;
    }
    
    console.log('✅ Table creation initiated');
    console.log('📊 Response:', data);
    
    // Test if table was created by trying to insert a record
    console.log('\n2. 🧪 Testing table access...');
    
    try {
      const testInsert = await supabase
        .from('exams')
        .insert({
          title: 'Test Exam After Table Creation',
          type: 'mcq',
          subject: 'Test',
          duration: 30,
          total_marks: 50,
          passing_marks: 25,
          instructions: 'Test exam',
          exam_key: 'TEST-KEY-001',
          college_id: '749e5e00-413a-40d7-9461-279d3b8670dc',
          status: 'draft'
        })
        .select();
      
      if (testInsert.error) {
        console.log('❌ Table access test failed:', testInsert.error.message);
      } else {
        console.log('✅ Table access test passed!');
        console.log('📊 Test record created with ID:', testInsert.data?.id);
      }
      
    } catch (testError) {
      console.log('❌ Table test failed:', testError.message);
    }
    
    console.log('\n3. 🎯 Result:');
    if (testInsert.error) {
      console.log('❌ Table creation failed');
    } else {
      console.log('✅ Exams table created successfully!');
      console.log('✅ The 500 error should be fixed now');
      console.log('✅ Try creating exam in frontend');
    }
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Restart backend server');
    console.log('2. Try creating exam in frontend');
    console.log('3. The 500 error should be resolved');
    
  } catch (error) {
    console.error('❌ Force creation failed:', error.message);
  }
}

forceCreateExamsTable();
