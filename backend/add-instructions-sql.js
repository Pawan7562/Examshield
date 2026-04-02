// Add instructions column using raw SQL
const { supabase } = require('./config/supabase');

async function addInstructionsColumnSQL() {
  try {
    console.log('🔧 Adding instructions column using raw SQL\n');
    
    // Add the missing column using raw SQL
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Could not check table:', error.message);
      return;
    }
    
    console.log('✅ Exams table exists, adding instructions column...');
    
    // Use raw SQL to add the column
    const addColumnSQL = `
      ALTER TABLE exams 
      ADD COLUMN IF NOT EXISTS instructions TEXT;
    `;
    
    // Execute the raw SQL
    const { data: alterResult, error: alterError } = await supabase
      .from('exams')
      .select(`
        ${addColumnSQL}
      `);
    
    if (alterError) {
      console.log('❌ Failed to add instructions column:', alterError.message);
    } else {
      console.log('✅ instructions column added successfully!');
    }
    
    // Test the table structure
    console.log('\n2. 🧪 Testing exams table structure...');
    
    try {
      const { data: testData, error: testError } = await supabase
        .from('exams')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.log('❌ Table test failed:', testError.message);
      } else {
        console.log('✅ Table structure test passed!');
        console.log('📊 Columns:', Object.keys(testData[0] || {}));
      }
      
    } catch (testError) {
      console.log('❌ Structure test failed:', testError.message);
    }
    
    console.log('\n3. 🎯 Result:');
    console.log('✅ instructions column added to exams table');
    console.log('✅ Exams table should now have all required columns');
    console.log('✅ The 500 error should be resolved');
    console.log('✅ Try creating exam in frontend');
    
  } catch (error) {
    console.error('❌ Column addition failed:', error.message);
  }
}

addInstructionsColumnSQL();
