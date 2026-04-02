import React from 'react';

const SubjectiveQuestion = ({ question, answer, onAnswer }) => {
  return (
    <div style={{ color: '#a0aec0', fontSize: 14 }}>
      <p style={{ marginBottom: 24, lineHeight: 1.7, fontSize: 16, fontWeight: 500 }}>
        {question?.question_text || 'Question not available'}
      </p>
      
      <textarea
        value={answer || ''}
        onChange={(e) => onAnswer(e.target.value)}
        placeholder="Type your answer here..."
        rows={8}
        style={{
          width: '100%',
          background: '#0d0d14',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 8,
          padding: '16px',
          color: '#e2e8f0',
          fontSize: 14,
          fontFamily: 'Sora, sans-serif',
          lineHeight: 1.6,
          resize: 'vertical',
          transition: 'border-color 0.2s ease',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#e94560';
          e.target.style.outline = 'none';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}
      />
      
      <div style={{ 
        marginTop: 12, 
        fontSize: 12, 
        color: '#4a5568',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>Characters: {answer?.length || 0}</span>
        <span>Write your answer in the text area above</span>
      </div>
    </div>
  );
};

export default SubjectiveQuestion;
