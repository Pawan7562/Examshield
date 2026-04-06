// Fix exam assignments table security policy
const { supabase } = require('./config/supabase-clean');

async function fixExamAssignmentsSecurity() {
  console.log('🔧 Fixing exam assignments table security policy...');
  
  try {
    // Check if the table exists and get current RLS policies
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, qual, cmd, with_check, roles')
      .eq('tablename', 'exam_assignments');
    
    if (policiesError) {
      console.error('❌ Error checking policies:', policiesError);
      return;
    }
    
    console.log('📋 Current policies:', policies);
    
    // Drop existing restrictive policy if it exists
    if (policies && policies.length > 0) {
      const { error: dropError } = await supabase.rpc('exec_sql', {
        sql: `
          DROP POLICY IF EXISTS exam_assignments_restrictive_policy;
        `
      });
      
      if (dropError) {
        console.error('❌ Error dropping policy:', dropError);
      } else {
        console.log('✅ Dropped restrictive policy');
      }
    }
    
    // Create permissive policy for exam assignments
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY exam_assignments_policy ON exam_assignments
        FOR INSERT
        WITH CHECK (
          -- Allow college admins to assign students to their own exams
          (
            auth.jwt() ->> 'college_admin' AND
            EXISTS (
              SELECT 1 FROM exams e 
              WHERE e.id = NEW.exam_id AND e.college_id = auth.jwt() ->> 'id'
            )
          ) OR
          -- Allow super admins to assign any students
          auth.jwt() ->> 'super_admin'
        );
      `
    });
    
    if (createError) {
      console.error('❌ Error creating policy:', createError);
    } else {
      console.log('✅ Created permissive exam assignments policy');
    }
    
    // Also ensure the table has the correct structure
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE exam_assignments 
        ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (tableError) {
      console.error('❌ Error enabling RLS:', tableError);
    } else {
      console.log('✅ Enabled Row Level Security on exam_assignments');
    }
    
    console.log('✅ Exam assignments security policy fixed successfully');
    
  } catch (error) {
    console.error('❌ Error fixing exam assignments:', error);
  }
}

// Run the fix
fixExamAssignmentsSecurity().then(() => {
  console.log('🏁 Exam assignments security fix completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fix failed:', error);
  process.exit(1);
});
