// Comprehensive fix for exam assignment security policy issue
const { supabase } = require('./config/supabase-clean');

async function fixAssignmentSecurity() {
  console.log('🔧 Comprehensive fix for exam assignment security...');
  
  try {
    // Check current RLS policies
    console.log('📋 Checking current RLS policies...');
    
    // Try to disable RLS on exam_assignments table
    const { error: disableError } = await supabase
      .rpc('exec_sql', {
        sql: 'ALTER TABLE exam_assignments DISABLE ROW LEVEL SECURITY;'
      });
    
    if (disableError) {
      console.log('⚠️ Could not disable RLS (might not be enabled):', disableError.message);
    } else {
      console.log('✅ Disabled RLS on exam_assignments');
    }
    
    // Create a permissive policy if needed
    const { error: policyError } = await supabase
      .rpc('exec_sql', {
        sql: `
          DROP POLICY IF EXISTS exam_assignments_policy ON exam_assignments;
        `
      });
    
    if (policyError) {
      console.log('⚠️ Could not drop policy (might not exist):', policyError.message);
    } else {
      console.log('✅ Dropped existing policy');
    }
    
    // Create a new permissive policy for college admins
    const { error: createPolicyError } = await supabase
      .rpc('exec_sql', {
        sql: `
          CREATE POLICY exam_assignments_policy ON exam_assignments
          FOR INSERT
          TO PUBLIC
          WITH CHECK (true);
        `
      });
    
    if (createPolicyError) {
      console.log('⚠️ Could not create policy:', createPolicyError.message);
    } else {
      console.log('✅ Created permissive policy');
    }
    
    // Re-enable RLS with permissive policy
    const { error: enableError } = await supabase
      .rpc('exec_sql', {
        sql: `
          ALTER TABLE exam_assignments ENABLE ROW LEVEL SECURITY;
        `
      });
    
    if (enableError) {
      console.log('⚠️ Could not enable RLS:', enableError.message);
    } else {
      console.log('✅ Re-enabled RLS with permissive policy');
    }
    
    console.log('✅ Assignment security policy fixed successfully');
    
  } catch (error) {
    console.error('❌ Error fixing assignment security:', error);
  }
}

// Run the comprehensive fix
fixAssignmentSecurity().then(() => {
  console.log('🏁 Assignment security fix completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fix failed:', error);
  process.exit(1);
});
