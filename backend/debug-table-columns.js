const { supabase } = require('./config/supabase-clean');
require('dotenv').config();

async function checkColumns() {
  try {
    console.log('--- Checking Questions Table ---');
    const { data: questions, error: qErr } = await supabase
      .from('questions')
      .select('*')
      .limit(1);
    
    if (qErr) console.error('Error fetching questions:', qErr);
    else if (questions && questions.length > 0) console.log('Questions columns:', Object.keys(questions[0]));
    else console.log('Questions table is empty');

    console.log('\n--- Checking Exam Questions Table ---');
    const { data: examQuestions, error: eqErr } = await supabase
      .from('exam_questions')
      .select('*')
      .limit(1);
    
    if (eqErr) console.error('Error fetching exam_questions:', eqErr);
    else if (examQuestions && examQuestions.length > 0) console.log('Exam Questions columns:', Object.keys(examQuestions[0]));
    else console.log('No exam questions found');

    const tables = ['exams', 'questions', 'exam_sessions', 'answers', 'results'];
    console.log('\n--- Checking Exams Table ---');
    const { data: exams, error: eErr } = await supabase
      .from('exams')
      .select('*')
      .limit(1);
    
    if (eErr) console.error('Error fetching exams:', eErr);
    else if (exams && exams.length > 0) console.log('Exams columns:', Object.keys(exams[0]));
  } catch (err) {
    console.error('Script error:', err);
  }
}

checkColumns();
