import React, { useState, useEffect, useRef } from 'react';

const CodeEditor = ({ 
  question, 
  answer, 
  onAnswer, 
  language, 
  onLanguageChange,
  onRunCode,
  onSubmit,
  isRunning = false,
  isSubmitting = false,
  testResults = null
}) => {
  const [code, setCode] = useState(answer || '');
  const editorRef = useRef(null);

  const programmingLanguages = [
    { id: 'javascript', name: 'JavaScript', icon: '🟨', defaultCode: `function solution(input) {\n  // Write your code here\n  return input;\n}` },
    { id: 'python', name: 'Python', icon: '🐍', defaultCode: `def solution(input):\n    # Write your code here\n    return input` },
    { id: 'java', name: 'Java', icon: '☕', defaultCode: `class Solution {\n    public static int solution(int input) {\n        // Write your code here\n        return input;\n    }\n}` },
    { id: 'cpp', name: 'C++', icon: '⚙️', defaultCode: `int solution(int input) {\n    // Write your code here\n    return input;\n}` },
    { id: 'c', name: 'C', icon: '🔧', defaultCode: `int solution(int input) {\n    // Write your code here\n    return input;\n}` },
    { id: 'csharp', name: 'C#', icon: '🔷', defaultCode: `public class Solution {\n    public static int SolutionMethod(int input) {\n        // Write your code here\n        return input;\n    }\n}` }
  ];

  useEffect(() => {
    if (code !== answer) {
      onAnswer(code);
    }
  }, [code, answer, onAnswer]);

  useEffect(() => {
    if (!answer && language) {
      const lang = programmingLanguages.find(l => l.id === language);
      if (lang) {
        setCode(lang.defaultCode);
      }
    }
  }, [language, answer]);

  const handleLanguageChange = (newLanguage) => {
    const lang = programmingLanguages.find(l => l.id === newLanguage);
    if (lang) {
      setCode(lang.defaultCode);
      onLanguageChange(newLanguage);
    }
  };

  const handleRun = () => {
    onRunCode(code, language);
  };

  const handleSubmit = () => {
    onSubmit(code, language);
  };

  const getLanguageIcon = (langId) => {
    const lang = programmingLanguages.find(l => l.id === langId);
    return lang ? lang.icon : '📝';
  };

  return (
    <div style={{ 
      background: '#0d0d14', 
      border: '1px solid rgba(255,255,255,0.1)', 
      borderRadius: 12, 
      overflow: 'hidden',
      fontFamily: 'Sora, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        background: 'rgba(255,255,255,0.02)', 
        borderBottom: '1px solid rgba(255,255,255,0.1)', 
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
            {getLanguageIcon(language)} {programmingLanguages.find(l => l.id === language)?.name}
          </span>
          <select 
            value={language} 
            onChange={(e) => handleLanguageChange(e.target.value)}
            style={{ 
              background: '#0e0e1a', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: 6, 
              padding: '6px 12px', 
              color: '#e2e8f0', 
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            {programmingLanguages.map(lang => (
              <option key={lang.id} value={lang.id}>
                {lang.icon} {lang.name}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={handleRun}
            disabled={isRunning}
            style={{ 
              background: isRunning 
                ? 'rgba(107,114,128,0.2)' 
                : 'rgba(34,197,94,0.15)', 
              border: isRunning 
                ? '1px solid rgba(107,114,128,0.3)' 
                : '1px solid rgba(34,197,94,0.3)', 
              borderRadius: 6, 
              padding: '8px 16px', 
              color: isRunning ? '#6b7280' : '#22c55e', 
              cursor: isRunning ? 'default' : 'pointer', 
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'Sora, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {isRunning ? (
              <>
                <div style={{ 
                  width: 12, 
                  height: 12, 
                  border: '2px solid #6b7280', 
                  borderTop: '2px solid transparent', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite' 
                }}></div>
                Running...
              </>
            ) : (
              <>
                ▶ Run Code
              </>
            )}
          </button>
          
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{ 
              background: isSubmitting 
                ? 'rgba(107,114,128,0.2)' 
                : 'rgba(233,69,96,0.15)', 
              border: isSubmitting 
                ? '1px solid rgba(107,114,128,0.3)' 
                : '1px solid rgba(233,69,96,0.3)', 
              borderRadius: 6, 
              padding: '8px 16px', 
              color: isSubmitting ? '#6b7280' : '#e94560', 
              cursor: isSubmitting ? 'default' : 'pointer', 
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'Sora, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {isSubmitting ? (
              <>
                <div style={{ 
                  width: 12, 
                  height: 12, 
                  border: '2px solid #6b7280', 
                  borderTop: '2px solid transparent', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite' 
                }}></div>
                Submitting...
              </>
            ) : (
              <>
                📤 Submit
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Editor */}
      <div style={{ position: 'relative' }}>
        <textarea
          ref={editorRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Write your code here..."
          spellCheck={false}
          style={{
            width: '100%',
            height: '400px',
            background: '#0d0d14',
            border: 'none',
            padding: '20px',
            color: '#e2e8f0',
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Consolas', 'Monaco', monospace",
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
            tabSize: 4
          }}
        />
        
        {/* Line Numbers */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '50px',
          height: '400px',
          background: 'rgba(255,255,255,0.02)',
          borderRight: '1px solid rgba(255,255,255,0.1)',
          padding: '20px 0',
          textAlign: 'center',
          color: '#4a5568',
          fontSize: 12,
          fontFamily: "'JetBrains Mono', monospace",
          lineHeight: 1.6,
          userSelect: 'none',
          pointerEvents: 'none'
        }}>
          {code.split('\n').map((_, i) => (
            <div key={i} style={{ height: '22.4px' }}>
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Test Results */}
      {testResults && (
        <div style={{ 
          background: 'rgba(255,255,255,0.02)', 
          borderTop: '1px solid rgba(255,255,255,0.1)', 
          padding: '20px'
        }}>
          <div style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            color: '#e2e8f0', 
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span>Test Results</span>
            <span style={{ 
              fontSize: 12, 
              fontWeight: 500, 
              padding: '2px 8px', 
              borderRadius: 12, 
              background: testResults.passed === testResults.total 
                ? 'rgba(34,197,94,0.15)' 
                : 'rgba(239,68,68,0.15)', 
              color: testResults.passed === testResults.total ? '#22c55e' : '#ef4444' 
            }}>
              {testResults.passed}/{testResults.total} Passed
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {testResults.results?.map((result, i) => (
              <div key={i} style={{ 
                background: 'rgba(255,255,255,0.02)', 
                border: `1px solid ${result.passed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, 
                borderRadius: 6, 
                padding: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>
                    Test Case {i + 1}
                  </span>
                  <span style={{ 
                    fontSize: 11, 
                    fontWeight: 600, 
                    color: result.passed ? '#22c55e' : '#ef4444' 
                  }}>
                    {result.passed ? '✓ Passed' : '✗ Failed'}
                  </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                  <div>
                    <span style={{ color: '#718096' }}>Input: </span>
                    <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>
                      {JSON.stringify(result.input)}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#718096' }}>Expected: </span>
                    <span style={{ color: '#22c55e', fontFamily: 'monospace' }}>
                      {JSON.stringify(result.expected)}
                    </span>
                  </div>
                  {!result.passed && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: '#718096' }}>Got: </span>
                      <span style={{ color: '#ef4444', fontFamily: 'monospace' }}>
                        {JSON.stringify(result.actual)}
                      </span>
                    </div>
                  )}
                </div>
                
                {result.explanation && (
                  <div style={{ marginTop: 8, fontSize: 11, color: '#718096', fontStyle: 'italic' }}>
                    {result.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {testResults.error && (
            <div style={{ 
              background: 'rgba(239,68,68,0.1)', 
              border: '1px solid rgba(239,68,68,0.3)', 
              borderRadius: 6, 
              padding: '12px',
              marginTop: 12
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#ef4444', marginBottom: 4 }}>
                Compilation Error
              </div>
              <div style={{ fontSize: 11, color: '#ef4444', fontFamily: 'monospace' }}>
                {testResults.error}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CodeEditor;
