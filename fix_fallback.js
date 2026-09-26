const fs = require('fs');
const file = 'backend/controllers/aiQuestionController.js';
let code = fs.readFileSync(file, 'utf8');

const target1 = `    let genAI;
    try {
      genAI = getGemini();
    } catch (err) {
      return res.status(503).json({
        success: false,
        message: 'AI service not configured. Please set GEMINI_API_KEY in environment variables.',
        fallback: true,
      });
    }`;

const replacement1 = `    let genAI;
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
    }`;

const target2 = `    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.85,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: mode === 'full' ? 3000 : 1800,
      },
    });`;

const target3 = `          const prompt = buildPrompt(topic, difficulty, source, mode);
          const result = await model.generateContent(prompt);`;

const replacement3 = `          if (useFallback || !model) throw new Error('API Key missing, using fallback');
          
          const prompt = buildPrompt(topic, difficulty, source, mode);
          const result = await model.generateContent(prompt);`;

code = code.replace(target1, replacement1);
code = code.replace(target2, '');
code = code.replace(target3, replacement3);

fs.writeFileSync(file, code);
console.log('Fixed fallback logic in AI controller!');
