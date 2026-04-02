import React from 'react';

const MCQQuestion = ({ question, answer, onAnswer }) => {
  if (!question || !question.options) {
    return (
      <div style={{ color: '#a0aec0', fontSize: 14 }}>
        <p style={{ marginBottom: 16, lineHeight: 1.7 }}>
          {question?.question_text || 'Question not available'}
        </p>
        <p style={{ color: '#ef4444' }}>No options available for this question.</p>
      </div>
    );
  }

  return (
    <div style={{ color: '#a0aec0', fontSize: 14 }}>
      <p style={{ marginBottom: 24, lineHeight: 1.7, fontSize: 16, fontWeight: 500 }}>
        {question.question_text}
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {question.options.map((option, index) => (
          <label
            key={index}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '16px',
              background: answer === option ? 'rgba(233, 69, 96, 0.1)' : 'rgba(255, 255, 255, 0.03)',
              border: answer === option ? '2px solid #e94560' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (answer !== option) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (answer !== option) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }
            }}
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              value={option}
              checked={answer === option}
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
