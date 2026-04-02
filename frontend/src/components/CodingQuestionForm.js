import React, { useState } from 'react';

const CodingQuestionForm = ({ q, idx, onChange, onRemove }) => {
  const set = (k) => (e) => onChange(idx, { ...q, [k]: e.target.value });
  const setTestCase = (i, field, value) => {
    const testCases = [...(q.testCases || [{ input: '', output: '', explanation: '' }])];
    testCases[i] = { ...testCases[i], [field]: value };
    onChange(idx, { ...q, testCases });
  };

  const addTestCase = () => {
    const testCases = [...(q.testCases || [])];
    testCases.push({ input: '', output: '', explanation: '' });
    onChange(idx, { ...q, testCases });
  };

  const removeTestCase = (i) => {
    const testCases = [...(q.testCases || [])];
    testCases.splice(i, 1);
    onChange(idx, { ...q, testCases });
  };

  const toggleLanguage = (lang) => {
    const languages = q.allowedLanguages || ['javascript'];
    const newLanguages = languages.includes(lang)
      ? languages.filter(l => l !== lang)
      : [...languages, lang];
    onChange(idx, { ...q, allowedLanguages: newLanguages });
  };

  const testCases = q.testCases || [{ input: '', output: '', explanation: '' }];
  const allowedLanguages = q.allowedLanguages || ['javascript'];

  const programmingLanguages = [
    { id: 'javascript', name: 'JavaScript', icon: '🟨' },
    { id: 'python', name: 'Python', icon: '🐍' },
    { id: 'java', name: 'Java', icon: '☕' },
    { id: 'cpp', name: 'C++', icon: '⚙️' },
    { id: 'c', name: 'C', icon: '🔧' },
    { id: 'csharp', name: 'C#', icon: '🔷' },
    { id: 'ruby', name: 'Ruby', icon: '💎' },
    { id: 'go', name: 'Go', icon: '🐹' }
  ];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ 
      background: 'rgba(255,255,255,0.02)', 
      border: `1px solid ${q.questionText ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)'}`, 
      borderRadius: 12, 
      padding: 24, 
      marginBottom: 20,
      transition: 'all 0.2s ease'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#8b5cf6' }}>Q{idx + 1}</span>
          <span style={{ 
            fontSize: 11, 
            fontWeight: 600, 
            padding: '3px 10px', 
            borderRadius: 12, 
            background: 'rgba(139,92,246,0.15)', 
            color: '#8b5cf6' 
          }}>
            CODING
          </span>
          {q.difficulty && (
            <span style={{ 
              fontSize: 11, 
              fontWeight: 600, 
              padding: '3px 10px', 
              borderRadius: 12, 
              background: `${getDifficultyColor(q.difficulty)}15`, 
              color: getDifficultyColor(q.difficulty) 
            }}>
              {q.difficulty?.toUpperCase()}
            </span>
          )}
        </div>
        <button 
          onClick={() => onRemove(idx)} 
          style={{ 
            background: 'rgba(239,68,68,0.1)', 
            border: '1px solid rgba(239,68,68,0.3)', 
            borderRadius: 6, 
            color: '#ef4444', 
            cursor: 'pointer', 
            fontSize: 12,
            padding: '6px 12px',
            transition: 'all 0.2s ease'
          }}
        >
          Remove
        </button>
      </div>

      {/* Question Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: 11, 
            fontWeight: 600, 
            color: '#718096', 
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            Problem Statement
          </label>
          <textarea 
            value={q.questionText || ''} 
            onChange={set('questionText')}
            placeholder="Describe the coding problem here..." 
            rows={6}
            style={{ 
              width: '100%', 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.08)', 
              borderRadius: 8, 
              padding: '12px 16px', 
              color: '#e2e8f0', 
              fontSize: 14, 
              fontFamily: 'Sora, sans-serif',
              resize: 'vertical',
              transition: 'border-color 0.2s ease'
            }}
          />
        </div>
        
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: 11, 
            fontWeight: 600, 
            color: '#718096', 
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            Difficulty
          </label>
          <select 
            value={q.difficulty || ''} 
            onChange={set('difficulty')}
            style={{ 
              width: '100%',
              background: q.difficulty 
                ? `${getDifficultyColor(q.difficulty)}15` 
                : '#0e0e1a', 
              border: q.difficulty 
                ? `1px solid ${getDifficultyColor(q.difficulty)}30` 
                : '1px solid rgba(255,255,255,0.1)', 
              borderRadius: 8, 
              padding: '10px 12px', 
              color: q.difficulty ? getDifficultyColor(q.difficulty) : '#e2e8f0', 
              fontSize: 14,
              fontFamily: 'Sora, sans-serif',
              cursor: 'pointer',
              marginBottom: 16
            }}
          >
            <option value="">Select difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <label style={{ 
            display: 'block', 
            fontSize: 11, 
            fontWeight: 600, 
            color: '#718096', 
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            Marks
          </label>
          <input 
            type="number" 
            value={q.marks || 10} 
            onChange={set('marks')} 
            min={1}
            style={{ 
              width: '100%',
              background: 'rgba(255,255,255,0.04)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: 8, 
              padding: '10px 12px', 
              color: '#e2e8f0', 
              fontSize: 14, 
              fontFamily: 'Sora, sans-serif',
              textAlign: 'center',
              marginBottom: 16
            }} 
          />
        </div>
      </div>

      {/* Constraints */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ 
          display: 'block', 
          fontSize: 11, 
          fontWeight: 600, 
          color: '#718096', 
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: 0.5
        }}>
          Constraints
        </label>
        <textarea 
          value={q.constraints || ''} 
          onChange={set('constraints')}
          placeholder="Example:&#10;1 ≤ nums.length ≤ 10^4&#10;-10^4 ≤ nums[i] ≤ 10^4&#10;Time complexity: O(n)" 
          rows={4}
          style={{ 
            width: '100%', 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.08)', 
            borderRadius: 8, 
            padding: '12px 16px', 
            color: '#e2e8f0', 
            fontSize: 13, 
            fontFamily: 'Sora, sans-serif',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Test Cases */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <label style={{ 
            fontSize: 11, 
            fontWeight: 600, 
            color: '#718096',
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            Test Cases ({testCases.length})
          </label>
          <button 
            onClick={addTestCase}
            style={{ 
              background: 'rgba(34,197,94,0.1)', 
              border: '1px solid rgba(34,197,94,0.3)', 
              borderRadius: 6, 
              color: '#22c55e', 
              cursor: 'pointer', 
              fontSize: 12,
              padding: '4px 12px'
            }}
          >
            + Add Test Case
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {testCases.map((testCase, i) => (
            <div key={i} style={{ 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid rgba(255,255,255,0.06)', 
              borderRadius: 8, 
              padding: 16 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#8b5cf6' }}>Test Case {i + 1}</span>
                {testCases.length > 1 && (
                  <button 
                    onClick={() => removeTestCase(i)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#ef4444', 
                      cursor: 'pointer', 
                      fontSize: 14 
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 10, color: '#718096', marginBottom: 4, display: 'block' }}>Input</label>
                  <textarea 
                    value={testCase.input} 
                    onChange={e => setTestCase(i, 'input', e.target.value)}
                    placeholder="Input data..." 
                    rows={3}
                    style={{ 
                      width: '100%', 
                      background: 'rgba(255,255,255,0.03)', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: 6, 
                      padding: '8px 12px', 
                      color: '#e2e8f0', 
                      fontSize: 12, 
                      fontFamily: 'monospace',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: '#718096', marginBottom: 4, display: 'block' }}>Expected Output</label>
                  <textarea 
                    value={testCase.output} 
                    onChange={e => setTestCase(i, 'output', e.target.value)}
                    placeholder="Expected output..." 
                    rows={3}
                    style={{ 
                      width: '100%', 
                      background: 'rgba(255,255,255,0.03)', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: 6, 
                      padding: '8px 12px', 
                      color: '#e2e8f0', 
                      fontSize: 12, 
                      fontFamily: 'monospace',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
              
              <div>
                <label style={{ fontSize: 10, color: '#718096', marginBottom: 4, display: 'block' }}>Explanation (Optional)</label>
                <input 
                  type="text" 
                  value={testCase.explanation} 
                  onChange={e => setTestCase(i, 'explanation', e.target.value)}
                  placeholder="Explain what this test case checks..." 
                  style={{ 
                    width: '100%', 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid rgba(255,255,255,0.08)', 
                    borderRadius: 6, 
                    padding: '8px 12px', 
                    color: '#e2e8f0', 
                    fontSize: 12 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Programming Languages */}
      <div>
        <label style={{ 
          display: 'block', 
          fontSize: 11, 
          fontWeight: 600, 
          color: '#718096', 
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: 0.5
        }}>
          Allowed Programming Languages
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {programmingLanguages.map(lang => (
            <label 
              key={lang.id}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6,
                padding: '8px 12px',
                background: allowedLanguages.includes(lang.id) 
                  ? 'rgba(139,92,246,0.1)' 
                  : 'rgba(255,255,255,0.02)',
                border: allowedLanguages.includes(lang.id) 
                  ? '1px solid rgba(139,92,246,0.3)' 
                  : '1px solid rgba(255,255,255,0.06)',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <input 
                type="checkbox" 
                checked={allowedLanguages.includes(lang.id)}
                onChange={() => toggleLanguage(lang.id)}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: 14 }}>{lang.icon}</span>
              <span style={{ 
                fontSize: 11, 
                fontWeight: 500,
                color: allowedLanguages.includes(lang.id) ? '#8b5cf6' : '#718096'
              }}>
                {lang.name}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CodingQuestionForm;
