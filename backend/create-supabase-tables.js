// Script to create missing tables in Supabase
const { supabase } = require('./config/supabase-clean');

async function createTables() {
  try {
    console.log('🔧 Creating missing tables in Supabase...');
    
    // Create exam_questions table
    console.log('\n📋 Creating exam_questions table...');
    const { error: examQuestionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS exam_questions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
          question_text TEXT NOT NULL,
          question_type VARCHAR(50) NOT NULL DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'subjective', 'coding', 'mixed')),
          marks INTEGER NOT NULL DEFAULT 1,
          difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
          question_data JSONB,
          order_index INTEGER NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON exam_questions(exam_id);
        CREATE INDEX IF NOT EXISTS idx_exam_questions_order ON exam_questions(exam_id, order_index);
      `
    });
    
    if (examQuestionsError) {
      console.log('❌ Failed to create exam_questions table:', examQuestionsError);
      // Try alternative approach using raw SQL
      console.log('🔄 Trying alternative approach...');
    } else {
      console.log('✅ exam_questions table created successfully');
    }
    
    // Create student_question_sets table
    console.log('\n📋 Creating student_question_sets table...');
    const { error: studentSetsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS student_question_sets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
          student_id UUID NOT NULL,
          question_id UUID NOT NULL,
          question_order INTEGER NOT NULL,
          question_data JSONB,
          random_seed FLOAT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_student_question_sets_exam_student ON student_question_sets(exam_id, student_id);
        CREATE INDEX IF NOT EXISTS idx_student_question_sets_student ON student_question_sets(student_id);
      `
    });
    
    if (studentSetsError) {
      console.log('❌ Failed to create student_question_sets table:', studentSetsError);
    } else {
      console.log('✅ student_question_sets table created successfully');
    }
    
    // Create exam_assignments table
    console.log('\n📋 Creating exam_assignments table...');
    const { error: assignmentsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS exam_assignments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
          student_id UUID NOT NULL,
          status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'started', 'submitted', 'terminated')),
          assigned_at TIMESTAMPTZ DEFAULT NOW(),
          started_at TIMESTAMPTZ,
          submitted_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_exam_assignments_exam_student ON exam_assignments(exam_id, student_id);
        CREATE INDEX IF NOT EXISTS idx_exam_assignments_student ON exam_assignments(student_id);
      `
    });
    
    if (assignmentsError) {
      console.log('❌ Failed to create exam_assignments table:', assignmentsError);
    } else {
      console.log('✅ exam_assignments table created successfully');
    }
    
    // Add missing columns to exams table
    console.log('\n📋 Adding missing columns to exams table...');
    const { error: examColumnsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE exams 
        ADD COLUMN IF NOT EXISTS question_randomization BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS title VARCHAR(255);
      `
    });
    
    if (examColumnsError) {
      console.log('❌ Failed to add columns to exams table:', examColumnsError);
    } else {
      console.log('✅ Columns added to exams table successfully');
    }
    
    console.log('\n🎉 Table creation completed!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
}

createTables();
