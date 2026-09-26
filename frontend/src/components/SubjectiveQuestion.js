import React from 'react';

const SubjectiveQuestion = ({ question, answer, onAnswer }) => {
  const currentAnswer = answer || '';
  const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;
  const charCount = currentAnswer.length;

  return (
    <div className="er-subjective-container" style={{ width: '100%' }}>
      <h3 style={{
        fontSize: '1.12rem',
        fontWeight: 600,
        color: '#0f172a',
        lineHeight: 1.65,
        marginBottom: '24px',
        letterSpacing: '-0.01em'
      }}>
        {question?.question_text || 'Question statement not available'}
      </h3>

      <div style={{ position: 'relative' }}>
        <textarea
          value={currentAnswer}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="Type your comprehensive answer or solution here..."
          rows={10}
          style={{
            width: '100%',
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: '12px',
            padding: '18px 20px',
            color: '#0f172a',
            fontSize: '0.95rem',
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1.65,
            resize: 'vertical',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            outline: 'none',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#0a74da';
            e.target.style.boxShadow = '0 0 0 3px rgba(10, 116, 218, 0.15)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#cbd5e1';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      <div style={{
        marginTop: 12,
        padding: '8px 12px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.78rem',
        color: '#64748b',
        fontWeight: 500
      }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span><strong>Words:</strong> {wordCount}</span>
          <span><strong>Characters:</strong> {charCount}</span>
        </div>
        <span>Auto-saving as you type</span>
      </div>
    </div>
  );
};

export default SubjectiveQuestion;

