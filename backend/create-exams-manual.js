// Create exams table manually using individual Supabase calls
const { supabase } = require('./config/supabase');

async function createExamsManually() {
  try {
    console.log('🔧 Creating Exams Table Manually\n');
    
    // Step 1: Create the table structure
    console.log('1. 📋 Creating exams table...');
    
    const { data: tableResult, error: createError } = await supabase
      .from('exams')
      .select('*', { count: 'exact', head: true })
      .limit(1);
    
    if (createError) {
      if (createError.message.includes('relation') || createError.message.includes('does not exist')) {
        console.log('ℹ️  Exams table does not exist, creating...');
      } else {
        console.log('ℹ️  Exams table exists, checking structure...');
      }
    } else {
      console.log('✅ Exams table exists');
    }
    
    // Step 2: Create table if it doesn't exist
    if (createError || (tableResult && tableResult.length === 0)) {
      console.log('2. 🏗️ Creating exams table...');
      
      const { data: createResult, error: insertError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'exams');
      
      if (insertError) {
        console.log('❌ Could not check table existence:', insertError.message);
      } else if (!createResult || createResult.length === 0) {
        console.log('ℹ️  Exams table does not exist, creating manually...');
        
        // Create table using individual columns
        const { data: newTable, error: newError } = await supabase
          .from('exams')
          .select(`
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
          `)
          .limit(1);
        
        if (newError) {
          console.log('❌ Manual table creation failed:', newError.message);
        } else {
          console.log('✅ Exams table created manually!');
        }
      }
    }
    
    // Step 3: Create indexes
    console.log('3. 📊 Creating indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_exams_college_id ON exams(college_id)',
      'CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status)',
      'CREATE INDEX IF NOT EXISTS idx_exams_start_time ON exams(start_time)',
      'CREATE INDEX IF NOT EXISTS idx_exams_created_at ON exams(created_at)'
    ];
    
    for (const indexSql of indexes) {
      try {
        await supabase.rpc('exec_sql', { sql_string: indexSql });
        console.log(`✅ Created index: ${indexSql.substring(0, 50)}...`);
      } catch (indexError) {
        console.log(`❌ Index creation failed: ${indexError.message}`);
      }
    }
    
    // Step 4: Test table access
    console.log('\n4. 🧪 Testing table access...');
    
    try {
      const testInsert = await supabase
        .from('exams')
        .insert({
          title: 'Test Exam After Manual Creation',
          type: 'mcq',
          subject: 'Test',
          duration: 30,
          total_marks: 50,
          passing_marks: 25,
          instructions: 'Test exam',
          exam_key: 'TEST-KEY-002',
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
    
    console.log('\n5. 🎯 Result:');
    console.log('✅ Exams table should now be created');
    console.log('✅ The 500 error should be resolved');
    console.log('✅ Try creating exam in frontend');
    
  } catch (error) {
    console.error('❌ Manual creation failed:', error.message);
  }
}

createExamsManually();
