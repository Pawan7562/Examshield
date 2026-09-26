const fs = require('fs');
const file = 'frontend/src/pages/admin/AIQuestionGenerator.js';
let code = fs.readFileSync(file, 'utf8');

const newGenerateQuestions = `  const generateQuestions = async () => {
    if (selectedSources.length === 0) {
      toast.error('Please select at least one source');
      return;
    }

    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    if (!difficulty) {
      toast.error('Please select a difficulty level');
      return;
    }

    const generationId = Date.now().toString();
    setCurrentGeneration(generationId);
    currentGenerationRef.current = generationId;
    setIsGenerating(true);
    
    console.log('Starting AI question generation:', generationId);

    try {
      const targetQuestionCount = parseInt(questionCount);
      
      const payload = {
        topic,
        difficulty,
        sources: selectedSources,
        count: targetQuestionCount,
        mode
      };

      const response = await adminAPI.generateAIQuestions(payload);
      
      if (currentGenerationRef.current !== generationId) {
        console.log('Generation cancelled - newer generation started:', generationId);
        return;
      }

      const rd = response.data;
      if (!rd || !rd.success || !rd.data || !rd.data.questions) {
        throw new Error((rd && rd.message) || 'Failed to generate questions');
      }

      const generatedList = rd.data.questions;
      
      const finalQuestions = generatedList.map(q => {
        return {
          id: q.id,
          type: 'coding',
          questionText: q.description,
          question_text: q.description, 
          title: q.title,
          description: q.description,
          marks: q.difficulty === 'easy' ? 5 : q.difficulty === 'medium' ? 10 : 15,
          difficulty: q.difficulty,
          source: sources.find(s => s.id === q.platform) || { id: q.platform, name: q.platform.charAt(0).toUpperCase() + q.platform.slice(1) },
          tags: q.tags || [],
          timeComplexity: q.timeComplexity,
          spaceComplexity: q.spaceComplexity,
          examples: q.examples || [], 
          testCases: q.examples || [], 
          constraints: q.constraints || [],
          solution: q.solutionCode || q.solutionApproach || '',
          editorial: q.editorial,
          followUp: q.followUp,
          generatedAt: q.generatedAt || new Date().toISOString(),
          randomSeed: Math.random(),
          aiGenerated: q.aiGenerated,
          isFallback: q.isFallback
        };
      });

      const meta = rd.data.meta;
      const parsedStats = {
        total: meta.generated, // Use requested/generated total
        fallbacks: meta.fallbacks,
        aiGenerated: meta.aiGenerated,
        bySource: {},
        byDifficulty: {}
      };
      
      // Calculate accurate stats based on the exact final list
      finalQuestions.forEach(q => {
        const diff = q.difficulty || difficulty;
        const srcId = q.source?.id || 'unknown';
        parsedStats.byDifficulty[diff] = (parsedStats.byDifficulty[diff] || 0) + 1;
        parsedStats.bySource[srcId] = (parsedStats.bySource[srcId] || 0) + 1;
      });

      setGeneratedQuestions(finalQuestions);
      setGenerationStats(parsedStats);
      
      if (mode === 'full') {
        setSelectedQuestions(finalQuestions);
        toast.success(\`Generated \${finalQuestions.length} questions automatically!\`);
        
        if (examConfig.name && examConfig.dateTime && selectedStudents.length > 0) {
          if (currentGenerationRef.current === generationId) {
            setTimeout(() => createExamWithQuestions(finalQuestions, generationId), 1000);
          }
        } else {
          toast.error('Please complete exam configuration and select students');
        }
      } else {
        if (parsedStats.fallbacks > 0) {
          toast.success(\`Generated \${finalQuestions.length} questions (\${parsedStats.fallbacks} fallbacks due to AI limits)\`);
        } else {
          toast.success(\`Generated \${finalQuestions.length} questions successfully!\`);
        }
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error(error.message || 'Failed to generate questions. Please try again.');
    } finally {
      if (currentGenerationRef.current === generationId) {
        setIsGenerating(false);
      }
    }
  };`;

const startTag = '  const generateQuestions = async () => {';
const endTag = '  const fetchQuestionsFromSource = async (source, topic, difficulty, count) => {';

const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag);

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + newGenerateQuestions + '\n\n' + code.substring(endIndex);
  fs.writeFileSync(file, code);
  console.log('Successfully replaced generateQuestions!');
} else {
  console.log('Indexes not found:', startIndex, endIndex);
}
