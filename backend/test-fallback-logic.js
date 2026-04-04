const { supabase } = require('./config/supabase-clean');

async function testFallback() {
  console.log('--- Testing Question Fallback ---');
  
  // 1. Create a dummy exam with questions in description
  const dummyExamId = '00000000-0000-0000-0000-000000000000'; // Or find a real one
  const questions = [
    { questionText: 'What is 1+1?', type: 'mcq', options: ['1','2','3'], correctAnswer: '2' },
    { questionText: 'What is the capital of France?', type: 'mcq', options: ['Paris', 'London'], correctAnswer: 'Paris' }
  ];
  const qJson = JSON.stringify(questions);
  const description = 'This is a test exam.\n\nQuestions: ' + qJson;

  // We won't actually create a new exam to avoid clutter, 
  // let's just test the parsing logic by extracting it from a real exam if possible
  // or just mocking the logic in this script.

  console.log('Simulating parsing from description:');
  if (description.includes('Questions:')) {
    const jsonPart = description.split('Questions:')[1].trim();
    const startIdx = jsonPart.indexOf('[');
    const endIdx = jsonPart.lastIndexOf(']') + 1;
    
    if (startIdx !== -1 && endIdx !== -1) {
      const rawJson = jsonPart.substring(startIdx, endIdx);
      const parsedQuestions = JSON.parse(rawJson);
      console.log('Parsed successfully! Found', parsedQuestions.length, 'questions.');
      console.log('First question:', parsedQuestions[0].questionText);
    } else {
      console.log('Failed to find JSON boundaries');
    }
  } else {
    console.log('No "Questions:" marker found');
  }
}

testFallback();
