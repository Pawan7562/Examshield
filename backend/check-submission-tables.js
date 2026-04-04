const { supabase } = require('./config/supabase-clean');
require('dotenv').config();

async function checkSubmissionTables() {
  try {
    console.log('--- Checking Results Table ---');
    const { data: results, error: rErr } = await supabase
      .from('results')
      .select('*')
      .limit(1);
    
    if (rErr) console.error('Error fetching results:', rErr);
    else if (results && results.length > 0) console.log('Results columns:', Object.keys(results[0]));
    else console.log('Results table is empty');

    console.log('\n--- Checking Answers Table ---');
    const { data: answers, error: aErr } = await supabase
      .from('answers')
      .select('*')
      .limit(1);
    
    if (aErr) console.error('Error fetching answers:', aErr);
    else if (answers && answers.length > 0) console.log('Answers columns:', Object.keys(answers[0]));
    else console.log('Answers table is empty');

    console.log('\n--- Checking Exam Sessions Table ---');
    const { data: sessions, error: sErr } = await supabase
      .from('exam_sessions')
      .select('*')
      .limit(1);
    
    if (sErr) console.error('Error fetching sessions:', sErr);
    else if (sessions && sessions.length > 0) console.log('Sessions columns:', Object.keys(sessions[0]));
    else console.log('Sessions table is empty');
  } catch (err) {
    console.error('Script error:', err);
  }
}

checkSubmissionTables();
