import React, { useState } from 'react';

const ExamKeyModal = ({ examName, onStart, disabled = false }) => {
  const [examKey, setExamKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!examKey.trim()) {
      alert('Please enter an exam key');
      return;
    }
    
    if (disabled) {
      return;
    }
    
    setIsLoading(true);
    try {
      await onStart(examKey.trim());
    } catch (error) {
      console.error('Failed to start exam:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      fontFamily: 'Sora, sans-serif'
    }}>
      <div style={{
        background: '#0a0a0f',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        padding: '32px',
        maxWidth: 400,
        width: '90%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔑</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
            Enter Exam Key
          </h1>
          <p style={{ fontSize: 14, color: '#4a5568', lineHeight: 1.5 }}>
            {examName || 'Loading exam name...'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ 
              display: 'block', 
              fontSize: 12, 
              fontWeight: 600, 
              color: '#718096', 
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}>
              Exam Key
            </label>
            <input
              type="text"
              value={examKey}
              onChange={(e) => setExamKey(e.target.value.toUpperCase())}
              placeholder="Enter your exam key"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#0d0d14',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                color: '#e2e8f0',
                fontSize: 14,
                fontFamily: 'Sora, sans-serif',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#e94560';
                e.target.style.outline = 'none';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
              disabled={isLoading || disabled}
            />
            <p style={{ 
              fontSize: 12, 
              color: '#4a5568', 
              marginTop: 8,
              lineHeight: 1.4
            }}>
              Enter the exam key provided by your instructor
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || disabled || !examKey.trim()}
            style={{
              width: '100%',
              padding: '14px',
              background: isLoading || disabled || !examKey.trim() 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'linear-gradient(135deg, #e94560, #c62a47)',
              border: 'none',
              borderRadius: 8,
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              cursor: isLoading || disabled || !examKey.trim() ? 'default' : 'pointer',
              fontFamily: 'Sora, sans-serif',
              transition: 'all 0.2s ease',
              opacity: isLoading || !examKey.trim() ? 0.6 : 1,
            }}
          >
            {isLoading ? 'Starting Exam...' : 'Start Exam'}
          </button>
        </form>

        <div style={{ 
          marginTop: 24, 
          padding: '16px',
          background: 'rgba(233, 69, 96, 0.1)',
          border: '1px solid rgba(233, 69, 96, 0.3)',
          borderRadius: 8,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 12, color: '#e94560', fontWeight: 600, marginBottom: 4 }}>
            📝 Exam Instructions
          </div>
          <ul style={{ 
            fontSize: 11, 
            color: '#718096', 
            textAlign: 'left', 
            paddingLeft: 16,
            margin: 0,
            lineHeight: 1.6
          }}>
            <li>Make sure you have a stable internet connection</li>
            <li>Ensure your camera is working (for proctored exams)</li>
            <li>Close unnecessary applications and browser tabs</li>
            <li>You will have limited time to complete the exam</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExamKeyModal;
