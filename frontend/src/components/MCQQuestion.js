import React from 'react';

const MCQQuestion = ({ question, answer, onAnswer }) => {
  // Normalize the answer to a string if it's an object (for comparison with finalOptions)
  const normalizedAnswer = answer && typeof answer === 'object' 
    ? (answer.text || answer.label || answer.value || JSON.stringify(answer))
    : String(answer || '');

  console.log('🔍 MCQQuestion received:', {
    hasQuestion: !!question,
    questionId: question?.id,
    questionType: question?.type,
    hasOptions: !!question?.options,
    optionsCount: question?.options?.length || 0,
    hasText: !!question?.question_text,
    textLength: question?.question_text?.length || 0,
    options: question?.options,
    answer: answer,
    normalizedAnswer: normalizedAnswer
  });

  let finalOptions = question?.options || [];
  
  // Defensive local parsing if options is a string (fallback safety)
  if (typeof finalOptions === 'string') {
    try {
      finalOptions = JSON.parse(finalOptions);
    } catch (e) {
      console.error('MCQQuestion: Failed to parse options string', e);
      finalOptions = [];
    }
  }

  // Normalize options to ensure they are strings (handle {id, text} objects)
  if (Array.isArray(finalOptions)) {
    finalOptions = finalOptions.map(opt => {
      if (opt && typeof opt === 'object') {
        return opt.text || opt.label || opt.value || JSON.stringify(opt);
      }
      return String(opt);
    });
  }

  // Final validation - must be an array
  if (!Array.isArray(finalOptions) || finalOptions.length === 0) {
    return (
      <div style={{ color: '#a0aec0', fontSize: 14 }}>
        <p style={{ marginBottom: 16, lineHeight: 1.7, fontSize: 16, fontWeight: 500 }}>
          {question?.question_text || 'Question not available'}
        </p>
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.2)', 
          borderRadius: 8, 
          padding: 16,
          color: '#ef4444'
        }}>
          ⚠️ No valid options available for this question.
        </div>
      </div>
    );
  }

  return (
    <div style={{ color: '#a0aec0', fontSize: 14 }}>
      <p style={{ marginBottom: 24, lineHeight: 1.7, fontSize: 16, fontWeight: 500 }}>
        {question.question_text}
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {finalOptions.map((option, index) => (
          <label
            key={index}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '16px',
              background: normalizedAnswer === option ? 'rgba(233, 69, 69, 0.08)' : 'rgba(255, 255, 255, 0.03)',
              border: normalizedAnswer === option ? '2px solid #e94560' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (normalizedAnswer !== option) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (normalizedAnswer !== option) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }
            }}
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              value={option}
              checked={normalizedAnswer === option}
              onChange={() => onAnswer(option)}
              style={{
                marginTop: 2,
                width: 18,
                height: 18,
                accentColor: '#e94560',
              }}
            />
            <span style={{ flex: 1, lineHeight: 1.6 }}>
              {String.fromCharCode(65 + index)}. {option}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default MCQQuestion;
