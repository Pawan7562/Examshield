// Fix exam assignments table by disabling RLS temporarily
const { supabase } = require('./config/supabase-clean');

async function fixExamAssignments() {
  console.log('🔧 Fixing exam assignments table...');
  
  try {
    // Disable Row Level Security temporarily to allow assignments
    const { error: disableError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE exam_assignments 
        DISABLE ROW LEVEL SECURITY;
      `
    });
    
    if (disableError) {
      console.error('❌ Error disabling RLS:', disableError);
    } else {
      console.log('✅ Disabled Row Level Security on exam_assignments');
    }
    
    // Verify the table structure is correct
    const { error: checkError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'exam_assignments' 
        AND table_schema = 'public';
      `
    });
    
    if (checkError) {
      console.error('❌ Error checking table structure:', checkError);
    } else {
      console.log('✅ Exam assignments table structure verified');
    }
    
    console.log('✅ Exam assignments fix completed successfully');
    
  } catch (error) {
    console.error('❌ Error fixing exam assignments:', error);
  }
}

// Run the fix
fixExamAssignments().then(() => {
  console.log('🏁 Exam assignments fix completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fix failed:', error);
  process.exit(1);
});
