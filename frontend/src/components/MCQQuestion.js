import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

const MCQQuestion = ({ question, answer, onAnswer }) => {
  // Normalize answer to string
  const normalizedAnswer =
    answer && typeof answer === 'object'
      ? answer.text || answer.label || answer.value || JSON.stringify(answer)
      : String(answer || '');

  let finalOptions = question?.options || [];

  // Defensive local parsing if options is a JSON string
  if (typeof finalOptions === 'string') {
    try {
      finalOptions = JSON.parse(finalOptions);
    } catch (e) {
      finalOptions = [];
    }
  }

  // Normalize options to ensure they are strings
  if (Array.isArray(finalOptions)) {
    finalOptions = finalOptions.map((opt) => {
      if (opt && typeof opt === 'object') {
        return opt.text || opt.label || opt.value || JSON.stringify(opt);
      }
      return String(opt);
    });
  }

  // Keyboard shortcut listener (A, B, C, D or 1, 2, 3, 4)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in a textarea or input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const key = e.key.toUpperCase();
      let selectedIdx = -1;

      if (['1', '2', '3', '4'].includes(key)) {
        selectedIdx = parseInt(key, 10) - 1;
      } else if (['A', 'B', 'C', 'D'].includes(key)) {
        selectedIdx = key.charCodeAt(0) - 65;
      }

      if (selectedIdx >= 0 && selectedIdx < finalOptions.length) {
        onAnswer(finalOptions[selectedIdx]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [finalOptions, onAnswer]);

  if (!Array.isArray(finalOptions) || finalOptions.length === 0) {
    return (
      <div className="er-options-empty" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
        <p style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: 600, marginBottom: '12px' }}>
          {question?.question_text || 'Question statement not available'}
        </p>
        <div style={{ padding: '12px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#dc2626', display: 'inline-block', fontSize: '0.88rem' }}>
          ⚠️ No multiple-choice options are configured for this question.
        </div>
      </div>
    );
  }

  return (
    <div className="er-mcq-container">
      {/* Question Text */}
      <h3 className="er-question-text" style={{
        fontSize: '1.12rem',
        fontWeight: 600,
        color: '#0f172a',
        lineHeight: 1.65,
        marginBottom: '28px',
        letterSpacing: '-0.01em'
      }}>
        {question.question_text}
      </h3>

      {/* Options Grid */}
      <div className="er-options-grid" role="radiogroup" aria-label="Answer options">
        {finalOptions.map((option, index) => {
          const isSelected = normalizedAnswer === option;
          const letter = String.fromCharCode(65 + index);

          return (
            <label
              key={index}
              className={`er-option-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onAnswer(option)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  onAnswer(option);
                }
              }}
            >
              <input
                type="radio"
                name={`mcq-group-${question.id}`}
                value={option}
                checked={isSelected}
                onChange={() => onAnswer(option)}
                aria-label={`Option ${letter}: ${option}`}
              />

              <div className="er-option-letter" aria-hidden="true">
                {letter}
              </div>

              <div className="er-option-text">
                {option}
              </div>

              <div className="er-option-check" aria-hidden="true">
                <CheckCircle2 size={20} />
              </div>
            </label>
          );
        })}
      </div>

      <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: '#94a3b8' }}>
        <span>💡 Keyboard tip: Press keys <strong>A - D</strong> or <strong>1 - 4</strong> to select an answer directly</span>
      </div>
    </div>
  );
};

export default MCQQuestion;
