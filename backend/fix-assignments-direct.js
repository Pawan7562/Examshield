// Fix exam assignments using direct Supabase SQL
const { supabase } = require('./config/supabase-clean');

async function fixExamAssignmentsDirect() {
  console.log('🔧 Fixing exam assignments table with direct SQL...');
  
  try {
    // Try to insert a test assignment to see the exact error
    console.log('📋 Testing exam assignments...');
    
    // First, let's check if we can read the table
    const { data: assignments, error: readError } = await supabase
      .from('exam_assignments')
      .select('*')
      .limit(1);
    
    if (readError) {
      console.error('❌ Error reading exam_assignments:', readError);
      return;
    }
    
    console.log('✅ Can read exam_assignments table');
    
    // Check if there are any existing assignments
    if (assignments && assignments.length > 0) {
      console.log(`📊 Found ${assignments.length} existing assignments`);
    } else {
      console.log('📊 No existing assignments found');
    }
    
    // The issue might be that the exam_assignments table doesn't exist
    // Let's check if we need to create it
    const { error: createError } = await supabase
      .from('exam_assignments')
      .select('*')
      .limit(1);
    
    if (createError && createError.code === 'PGRST114') {
      console.log('🔧 exam_assignments table does not exist, creating it...');
      
      // Create the exam_assignments table
      const { error: tableCreateError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS exam_assignments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
            student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (tableCreateError) {
        console.error('❌ Error creating exam_assignments table:', tableCreateError);
      } else {
        console.log('✅ Created exam_assignments table');
      }
    }
    
    console.log('✅ Exam assignments fix completed');
    
  } catch (error) {
    console.error('❌ Error in fix:', error);
  }
}

// Run the fix
fixExamAssignmentsDirect().then(() => {
  console.log('🏁 Exam assignments fix completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fix failed:', error);
  process.exit(1);
});
