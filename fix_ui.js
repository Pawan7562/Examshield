const fs = require('fs');
const file = 'frontend/src/pages/admin/AIQuestionGenerator.js';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  '<div className="premium-description">\n                    {previewQuestion.description || previewQuestion.question_text}',
  '<div className="premium-description" style={{ whiteSpace: "pre-wrap" }}>\n                    {previewQuestion.description || previewQuestion.question_text}'
);

code = code.replace(
  '<div className="premium-description">\n                      {previewQuestion.solution}',
  '<div className="premium-description" style={{ whiteSpace: "pre-wrap" }}>\n                      {previewQuestion.solution}'
);

fs.writeFileSync(file, code);
console.log('Fixed styling');
