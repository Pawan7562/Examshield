import React, { useState } from 'react';
import CodeEditor from './CodeEditor';

const CodingQuestion = ({ question, answer, onAnswer }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    // Clear test results when language changes
    setTestResults(null);
  };

  const handleRunCode = async (code, language) => {
    setIsRunning(true);
    setTestResults(null);

    try {
      // Simulate API call to run code
      const response = await fetch('/api/student/run-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          questionId: question.id,
          code,
          language,
          testCases: question.testCases || []
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setTestResults(result.data);
      } else {
        setTestResults({ error: result.message });
      }
    } catch (error) {
      console.error('Error running code:', error);
      setTestResults({ error: 'Failed to run code. Please try again.' });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async (code, language) => {
    setIsSubmitting(true);

    try {
      // Save answer first
      onAnswer(code);

      // Simulate API call to submit code
      const response = await fetch('/api/student/submit-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          questionId: question.id,
          code,
          language,
          testCases: question.testCases || []
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setTestResults(result.data);
      } else {
        setTestResults({ error: result.message });
      }
    } catch (error) {
      console.error('Error submitting code:', error);
      setTestResults({ error: 'Failed to submit code. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDifficultyBadge = (difficulty) => {
    const colors = {
      easy: { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', color: '#22c55e' },
      medium: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', color: '#f59e0b' },
      hard: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', color: '#ef4444' }
    };
    return colors[difficulty] || colors.easy;
  };

  const difficultyBadge = getDifficultyBadge(question.difficulty);

  return (
    <div className="coding-view-premium">
      {/* Question Header */}
      <div className="premium-section" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
        <div className="premium-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{question.title || 'Coding Question'}</h3>
            <div className="premium-header-badges">
              {question.difficulty && (
                <span className={`premium-badge ${question.difficulty.toLowerCase()}`}>
                  {question.difficulty.toUpperCase()}
                </span>
              )}
              <span className="premium-badge">
                {question.marks || 10} {question.marks === 1 ? 'mark' : 'marks'}
              </span>
            </div>
          </div>
          
          {/* Allowed Languages */}
          {question.allowedLanguages && question.allowedLanguages.length > 0 && (
            <div className="premium-tags">
              {question.allowedLanguages.map(lang => (
                <span key={lang} className="premium-tag">
                  {lang.toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Problem Description */}
      <div className="premium-section">
        <div className="premium-section-header">
          <h4>Problem Statement</h4>
          <div className="premium-section-line"></div>
        </div>
        <div className="premium-description">
          {question.question_text || question.description || 'Write a function that solves the given problem.'}
        </div>
      </div>

      {/* Constraints */}
      {question.constraints && (
        <div className="premium-section">
          <div className="premium-section-header">
            <h4>Constraints</h4>
            <div className="premium-section-line"></div>
          </div>
          <ul className="premium-constraints-list">
            {Array.isArray(question.constraints) ? (
              question.constraints.map((c, i) => <li key={i}>{c}</li>)
            ) : (
              <li>{question.constraints}</li>
            )}
          </ul>
        </div>
      )}

      {/* Test Cases Preview */}
      {(question.testCases || question.examples) && (question.testCases?.length > 0 || question.examples?.length > 0) && (
        <div className="premium-section">
          <div className="premium-section-header">
            <h4>Sample Test Cases</h4>
            <div className="premium-section-line"></div>
          </div>
          <div className="premium-examples-list">
            {(question.testCases || question.examples).slice(0, 2).map((testCase, i) => (
              <div key={i} className="premium-example-item">
                <div className="premium-example-label">Sample {i + 1}</div>
                <div className="premium-example-content">
                  <div className="premium-io-group">
                    <span className="premium-io-label">Input</span>
                    <div className="premium-io-code">{testCase.input}</div>
                  </div>
                  <div className="premium-io-group">
                    <span className="premium-io-label">Output</span>
                    <div className="premium-io-code output">{testCase.output}</div>
                  </div>
                  {testCase.explanation && (
                    <div className="premium-io-group">
                      <span className="premium-io-label">Explanation</span>
                      <div className="premium-description" style={{ fontSize: '0.9rem' }}>
                        {testCase.explanation}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {(question.testCases || question.examples).length > 2 && (
            <p style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', marginTop: '0.5rem' }}>
              +{(question.testCases || question.examples).length - 2} more test cases (hidden when you run the code)
            </p>
          )}
        </div>
      )}

      {/* Code Editor */}
      <CodeEditor
        question={question}
        answer={answer}
        onAnswer={onAnswer}
        language={selectedLanguage}
        onLanguageChange={handleLanguageChange}
        onRunCode={handleRunCode}
        onSubmit={handleSubmit}
        isRunning={isRunning}
        isSubmitting={isSubmitting}
        testResults={testResults}
      />
    </div>
  );
};

export default CodingQuestion;
