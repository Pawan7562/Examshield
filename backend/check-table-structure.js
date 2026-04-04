// Check the actual structure of the questions table
const { supabase } = require('./config/supabase-clean');

async function checkTableStructure() {
  try {
    console.log('🔍 Checking questions table structure...');
    
    // Get a sample question to see the structure
    const { data: sampleQuestion, error: sampleError } = await supabase
      .from('questions')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Error getting sample:', sampleError);
    } else if (sampleQuestion && sampleQuestion.length > 0) {
      console.log('Sample question structure:', Object.keys(sampleQuestion[0]));
      console.log('Sample question data:', sampleQuestion[0]);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTableStructure();
