const fs = require('fs');
const file = 'frontend/src/pages/admin/AIQuestionGenerator.js';
let code = fs.readFileSync(file, 'utf8');

const startTag = '  const fetchQuestionsFromSource = async (source, topic, difficulty, count) => {';
const endTag = '  const toggleQuestionSelection = (questionId) => {';

const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag);

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + '\n' + code.substring(endIndex);
  fs.writeFileSync(file, code);
  console.log('Successfully removed fetchQuestionsFromSource!');
} else {
  console.log('Indexes not found:', startIndex, endIndex);
}
