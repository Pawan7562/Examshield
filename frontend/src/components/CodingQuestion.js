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
    switch (difficulty) {
      case 'easy': return '#22c55e';
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
    <div style={{ color: '#e2e8f0', fontSize: 14 }}>
      {/* Question Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: 24,
        paddingBottom: 16,
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ 
              fontSize: 16, 
              fontWeight: 600, 
              color: '#8b5cf6' 
            }}>
              {question.question_text || 'Coding Question'}
            </span>
            {question.difficulty && (
              <span style={{ 
                fontSize: 11, 
                fontWeight: 600, 
                padding: '4px 10px', 
                borderRadius: 12, 
                background: difficultyBadge.bg, 
                color: difficultyBadge.color,
                border: `1px solid ${difficultyBadge.border}`
              }}>
                {question.difficulty?.toUpperCase()}
              </span>
            )}
            <span style={{ fontSize: 12, color: '#4a5568' }}>
              {question.marks || 10} {question.marks === 1 ? 'mark' : 'marks'}
            </span>
          </div>
          
          {/* Allowed Languages */}
          {question.allowedLanguages && question.allowedLanguages.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#718096' }}>Languages:</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {question.allowedLanguages.map(lang => {
                  const langIcons = {
                    javascript: '🟨',
                    python: '🐍',
                    java: '☕',
                    cpp: '⚙️',
                    c: '🔧',
                    csharp: '🔷'
                  };
                  return (
                    <span key={lang} style={{ 
                      fontSize: 12, 
                      padding: '2px 8px', 
                      borderRadius: 12, 
                      background: 'rgba(139,92,246,0.1)', 
                      color: '#8b5cf6',
                      border: '1px solid rgba(139,92,246,0.3)'
                    }}>
                      {langIcons[lang] || '📝'} {lang}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Problem Description */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ 
          fontSize: 14, 
          lineHeight: 1.7, 
          whiteSpace: 'pre-wrap',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8,
          padding: '16px'
        }}>
          {question.question_text || 'Write a function that solves the given problem.'}
        </div>
      </div>

      {/* Constraints */}
      {question.constraints && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ 
            fontSize: 12, 
            fontWeight: 600, 
            color: '#718096', 
            textTransform: 'uppercase', 
            letterSpacing: 0.5,
            marginBottom: 8 
          }}>
            Constraints
          </h4>
          <div style={{ 
            fontSize: 13, 
            lineHeight: 1.6,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8,
            padding: '12px 16px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap'
          }}>
            {question.constraints}
          </div>
        </div>
      )}

      {/* Test Cases Preview */}
      {question.testCases && question.testCases.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ 
            fontSize: 12, 
            fontWeight: 600, 
            color: '#718096', 
            textTransform: 'uppercase', 
            letterSpacing: 0.5,
            marginBottom: 8 
          }}>
            Sample Test Cases
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {question.testCases.slice(0, 2).map((testCase, i) => (
              <div key={i} style={{ 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid rgba(255,255,255,0.06)', 
                borderRadius: 6, 
                padding: '12px'
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#8b5cf6', marginBottom: 6 }}>
                  Sample {i + 1}
                  {testCase.explanation && (
                    <span style={{ marginLeft: 8, color: '#718096', fontWeight: 400 }}>
                      ({testCase.explanation})
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 11 }}>
                  <div>
                    <span style={{ color: '#718096' }}>Input: </span>
                    <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>
                      {testCase.input}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#718096' }}>Output: </span>
                    <span style={{ color: '#22c55e', fontFamily: 'monospace' }}>
                      {testCase.output}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {question.testCases.length > 2 && (
            <p style={{ fontSize: 11, color: '#718096', fontStyle: 'italic', marginTop: 8 }}>
              +{question.testCases.length - 2} more test cases (hidden when you run the code)
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
