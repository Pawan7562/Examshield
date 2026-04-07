const { supabase } = require('./config/supabase-clean');

async function checkQuestionsTableDirect() {
  try {
    // Try to get a sample question to see the actual error
    const { data: question, error } = await supabase
      .from('questions')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error checking questions table:', error);
      console.log('Error details:', error);
      return;
    }

    if (question && question.length > 0) {
      console.log('Sample question structure:');
      console.log(JSON.stringify(question[0], null, 2));
    } else {
      console.log('No questions found in table');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkQuestionsTableDirect().then(() => {
  console.log('🏁 Direct table check completed');
  process.exit(0);
});
