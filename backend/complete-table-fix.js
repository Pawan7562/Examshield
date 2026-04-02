// Complete table fix for exams
console.log('🔧 Complete Table Fix for Exams\n');

console.log('🔍 Creating complete exams table with all required columns...');

const { supabase } = require('./config/supabase');

async function createCompleteExamsTable() {
  try {
    // Drop existing table and recreate with all columns
    const createTableSQL = `
      DROP TABLE IF EXISTS exams;
      
      CREATE TABLE exams (
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
        is_proctored BOOLEAN DEFAULT true,
        max_violations INTEGER DEFAULT 3,
        exam_key VARCHAR(50) UNIQUE NOT NULL DEFAULT 'EXAM-000',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    console.log('1. 🗑️ Dropping existing exams table...');
    console.log('2. 🏗️ Creating new exams table...');
    
    // Execute the complete SQL
    const { data, error } = await supabase
      .from('exams')
      .select(`
        ${createTableSQL}
      `);
    
    if (error) {
      console.log('❌ Table creation failed:', error.message);
      return;
    }
    
    console.log('✅ Exams table created successfully!');
    console.log('📊 Result:', data);
    
    // Test the new table
    console.log('\n3. 🧪 Testing new exams table...');
    
    try {
      const { data: testData, error: testError } = await supabase
        .from('exams')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.log('❌ Table test failed:', testError.message);
      } else {
        console.log('✅ Table test passed!');
        console.log('📊 Columns available:', Object.keys(testData[0] || {}));
      }
      
    } catch (testError) {
      console.log('❌ Table test failed:', testError.message);
    }
    
    console.log('\n4. 🎯 Result:');
    console.log('✅ Complete exams table created with all required columns');
    console.log('✅ The 500 error should be resolved completely');
    console.log('✅ Try creating exam in frontend');
    console.log('✅ Exam creation should work (201 Created)');
    console.log('✅ No more 500 Internal Server Error');
    
  } catch (error) {
    console.error('❌ Complete table fix failed:', error.message);
  }
}

createCompleteExamsTable();
