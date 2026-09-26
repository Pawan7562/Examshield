const fs = require('fs');
const file = 'backend/controllers/aiQuestionController.js';
let code = fs.readFileSync(file, 'utf8');

// Find the section that returns 503 and replace it
const startMarker = `    let genAI;`;
const endMarker = `    // Distribute questions across sources`;

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const newLogic = `    let genAI;
    let model = null;
    let useFallback = false;
    try {
      genAI = getGemini();
      model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.85,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: mode === 'full' ? 3000 : 1800,
        },
      });
    } catch (err) {
      console.warn('AI setup failed:', err.message);
      useFallback = true;
    }

`;
  
  code = code.substring(0, startIndex) + newLogic + code.substring(endIndex);
  
  // Now replace the generation loop
  code = code.replace(
    'const result = await model.generateContent(prompt);',
    'if (useFallback || !model) throw new Error("API Key missing, using fallback");\n          const result = await model.generateContent(prompt);'
  );
  
  fs.writeFileSync(file, code);
  console.log('Fixed backend properly');
} else {
  console.log('Markers not found');
}
