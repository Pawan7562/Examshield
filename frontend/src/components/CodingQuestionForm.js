import React from 'react';
import {
  Code2,
  Trash2,
  Plus,
  FileCode,
  Award,
  Sliders,
  Terminal,
  Check,
  CheckCircle2,
  Info,
  Sparkles,
} from 'lucide-react';

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
    const languages = q.allowedLanguages || ['javascript', 'python', 'java', 'cpp'];
    const newLanguages = languages.includes(lang)
      ? languages.filter(l => l !== lang)
      : [...languages, lang];
    onChange(idx, { ...q, allowedLanguages: newLanguages });
  };

  const selectAllLanguages = (e) => {
    e.preventDefault();
    const all = programmingLanguages.map(l => l.id);
    onChange(idx, { ...q, allowedLanguages: all });
  };

  const resetLanguages = (e) => {
    e.preventDefault();
    onChange(idx, { ...q, allowedLanguages: ['javascript', 'python', 'java', 'cpp'] });
  };

  const testCases = q.testCases && q.testCases.length > 0
    ? q.testCases
    : [{ input: '', output: '', explanation: '' }];

  const allowedLanguages = q.allowedLanguages && q.allowedLanguages.length > 0
    ? q.allowedLanguages
    : ['javascript', 'python', 'java', 'cpp'];

  const programmingLanguages = [
    { id: 'javascript', name: 'JavaScript', icon: '🟨', badge: 'JS' },
    { id: 'python', name: 'Python', icon: '🐍', badge: 'PY' },
    { id: 'java', name: 'Java', icon: '☕', badge: 'JAVA' },
    { id: 'cpp', name: 'C++', icon: '⚙️', badge: 'C++' },
    { id: 'c', name: 'C', icon: '🔧', badge: 'C' },
    { id: 'csharp', name: 'C#', icon: '🔷', badge: 'C#' },
    { id: 'ruby', name: 'Ruby', icon: '💎', badge: 'RB' },
    { id: 'go', name: 'Go', icon: '🐹', badge: 'GO' },
    { id: 'typescript', name: 'TypeScript', icon: '🔷', badge: 'TS' },
    { id: 'rust', name: 'Rust', icon: '🦀', badge: 'RS' },
  ];

  const getDifficultyMeta = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return { label: 'Easy', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
      case 'hard':
        return { label: 'Hard', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
      case 'medium':
      default:
        return { label: 'Medium', bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
    }
  };

  const currentDiff = getDifficultyMeta(q.difficulty || 'medium');

  return (
    <div style={{
      background: '#ffffff',
      border: '1.5px solid #e2e8f0',
      borderRadius: 16,
      padding: '24px 28px',
      marginBottom: 24,
      boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
      transition: 'all 0.2s ease',
    }}>
      {/* ── Header Bar ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 18,
        borderBottom: '1.5px solid #f1f5f9',
        marginBottom: 22,
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Question Number */}
          <span style={{
            background: 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
            color: '#ffffff',
            borderRadius: 8,
            padding: '5px 12px',
            fontSize: '0.85rem',
            fontWeight: 800,
            letterSpacing: '0.02em',
            boxShadow: '0 2px 6px rgba(10, 116, 218, 0.25)'
          }}>
            Q{idx + 1}
          </span>

          {/* Type Badge */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.78rem',
            fontWeight: 700,
            padding: '5px 12px',
            borderRadius: 20,
            background: '#f5f3ff',
            color: '#7c3aed',
            border: '1.2px solid #ddd6fe',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            <Code2 size={13} strokeWidth={2.5} />
            Coding Assessment
          </span>

          {/* Difficulty Badge */}
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            padding: '5px 12px',
            borderRadius: 20,
            background: currentDiff.bg,
            color: currentDiff.color,
            border: `1.2px solid ${currentDiff.border}`,
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            {currentDiff.label}
          </span>

          {/* Enabled Languages Counter */}
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#64748b',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '4px 10px',
            borderRadius: 16
          }}>
            {allowedLanguages.length} Languages Enabled
          </span>
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={() => onRemove(idx)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#ffffff',
            border: '1.5px solid #fecaca',
            borderRadius: 8,
            color: '#dc2626',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: 700,
            padding: '7px 14px',
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 2px rgba(220, 38, 38, 0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fef2f2';
            e.currentTarget.style.borderColor = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.borderColor = '#fecaca';
          }}
        >
          <Trash2 size={14} />
          Remove
        </button>
      </div>

      {/* ── Problem Statement & Meta Row ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(240px, 1fr)',
        gap: 20,
        marginBottom: 22
      }}>
        {/* Left: Problem Statement */}
        <div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: 8,
            letterSpacing: '0.02em'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileCode size={15} color="#0a74da" />
              <span>PROBLEM STATEMENT</span>
              <span style={{ color: '#ef4444' }}>*</span>
            </span>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 500 }}>
              Markdown & math expressions supported
            </span>
          </label>
          <textarea
            value={q.questionText || ''}
            onChange={set('questionText')}
            placeholder="Describe the problem, input format, output specifications, and any algorithmic nuances..."
            rows={6}
            style={{
              width: '100%',
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: 10,
              padding: '14px 16px',
              color: '#0f172a',
              fontSize: '0.92rem',
              lineHeight: 1.6,
              fontFamily: "'Inter', -apple-system, sans-serif",
              resize: 'vertical',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'all 0.15s ease'
            }}
            onFocus={(e) => {
              e.target.style.background = '#ffffff';
              e.target.style.borderColor = '#0a74da';
              e.target.style.boxShadow = '0 0 0 3px rgba(10, 116, 218, 0.12)';
            }}
            onBlur={(e) => {
              e.target.style.background = '#f8fafc';
              e.target.style.borderColor = '#cbd5e1';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Right: Difficulty & Marks */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          background: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: 12,
          padding: 16
        }}>
          {/* Difficulty */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: 6
            }}>
              <Sliders size={14} color="#f59e0b" />
              <span>DIFFICULTY LEVEL</span>
            </label>
            <select
              value={q.difficulty || 'medium'}
              onChange={set('difficulty')}
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: 9,
                padding: '9px 12px',
                color: '#0f172a',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="easy">🟢 Easy (Basic Logic & Control)</option>
              <option value="medium">🟡 Medium (Data Structures & Search)</option>
              <option value="hard">🔴 Hard (DP, Graphs & Advanced Trees)</option>
            </select>
          </div>

          {/* Marks */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#1e293b',
              marginBottom: 6
            }}>
              <Award size={14} color="#10b981" />
              <span>MARKS / WEIGHTAGE</span>
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: 9,
              padding: '0 12px',
              transition: 'border-color 0.15s ease'
            }}>
              <input
                type="number"
                value={q.marks || 10}
                onChange={set('marks')}
                min={1}
                max={100}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  padding: '9px 0',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                points
              </span>
            </div>
          </div>

          {/* Runtime Sandbox Guarantee Pill */}
          <div style={{
            background: '#ffffff',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            padding: '8px 10px',
            fontSize: '0.73rem',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <Sparkles size={12} color="#0a74da" />
            <span>Isolated Container: 2.0s limit, 256MB RAM</span>
          </div>
        </div>
      </div>

      {/* ── Constraints Section ── */}
      <div style={{ marginBottom: 22 }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '0.82rem',
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: 8,
          letterSpacing: '0.02em'
        }}>
          <Terminal size={14} color="#6366f1" />
          <span>CONSTRAINTS &amp; COMPLEXITY EXPECTATIONS</span>
          <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 500 }}>(Optional)</span>
        </label>
        <textarea
          value={q.constraints || ''}
          onChange={set('constraints')}
          placeholder={"1 ≤ nums.length ≤ 10^5\n-10^9 ≤ nums[i] ≤ 10^9\nExpected Time Complexity: O(n log n)\nExpected Space Complexity: O(1)"}
          rows={3}
          style={{
            width: '100%',
            background: '#f8fafc',
            border: '1.5px solid #cbd5e1',
            borderRadius: 10,
            padding: '12px 16px',
            color: '#0f172a',
            fontSize: '0.86rem',
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            resize: 'vertical',
            boxSizing: 'border-box',
            outline: 'none',
            lineHeight: 1.5
          }}
          onFocus={(e) => {
            e.target.style.background = '#ffffff';
            e.target.style.borderColor = '#0a74da';
          }}
          onBlur={(e) => {
            e.target.style.background = '#f8fafc';
            e.target.style.borderColor = '#cbd5e1';
          }}
        />
      </div>

      {/* ── Test Cases Section ── */}
      <div style={{
        marginBottom: 22,
        background: '#f8fafc',
        border: '1.5px solid #e2e8f0',
        borderRadius: 14,
        padding: '18px 20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
          flexWrap: 'wrap',
          gap: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} color="#10b981" />
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '0.02em',
              textTransform: 'uppercase'
            }}>
              Test Cases ({testCases.length})
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Used for real-time automated candidate evaluation
            </span>
          </div>

          <button
            type="button"
            onClick={addTestCase}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#f0fdf4',
              border: '1.5px solid #86efac',
              borderRadius: 8,
              color: '#15803d',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '6px 14px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#dcfce7';
              e.currentTarget.style.borderColor = '#4ade80';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f0fdf4';
              e.currentTarget.style.borderColor = '#86efac';
            }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Add Test Case
          </button>
        </div>

        {/* List of Test Cases */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {testCases.map((testCase, i) => (
            <div
              key={i}
              style={{
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: 10,
                padding: '16px 18px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#0a74da',
                    background: '#eff6ff',
                    padding: '3px 9px',
                    borderRadius: 6
                  }}>
                    Case #{i + 1}
                  </span>
                  {i === 0 && (
                    <span style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 600 }}>
                      (Public Sample Case)
                    </span>
                  )}
                </div>

                {testCases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTestCase(i)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      padding: '4px 8px',
                      borderRadius: 6,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#dc2626';
                      e.currentTarget.style.background = '#fef2f2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#94a3b8';
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    <Trash2 size={13} />
                    Delete Case
                  </button>
                )}
              </div>

              {/* Input & Output Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14,
                marginBottom: 12
              }}>
                <div>
                  <label style={{
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: '#475569',
                    marginBottom: 5,
                    display: 'block'
                  }}>
                    INPUT (STDIN)
                  </label>
                  <textarea
                    value={testCase.input}
                    onChange={(e) => setTestCase(i, 'input', e.target.value)}
                    placeholder="e.g. 5&#10;2 7 11 15&#10;9"
                    rows={3}
                    style={{
                      width: '100%',
                      background: '#f8fafc',
                      border: '1.2px solid #cbd5e1',
                      borderRadius: 8,
                      padding: '9px 12px',
                      color: '#0f172a',
                      fontSize: '0.82rem',
                      fontFamily: "'JetBrains Mono', Consolas, monospace",
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: '#475569',
                    marginBottom: 5,
                    display: 'block'
                  }}>
                    EXPECTED OUTPUT (STDOUT)
                  </label>
                  <textarea
                    value={testCase.output}
                    onChange={(e) => setTestCase(i, 'output', e.target.value)}
                    placeholder="e.g. [0, 1]"
                    rows={3}
                    style={{
                      width: '100%',
                      background: '#f8fafc',
                      border: '1.2px solid #cbd5e1',
                      borderRadius: 8,
                      padding: '9px 12px',
                      color: '#0f172a',
                      fontSize: '0.82rem',
                      fontFamily: "'JetBrains Mono', Consolas, monospace",
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Explanation Field */}
              <div>
                <label style={{
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  color: '#64748b',
                  marginBottom: 4,
                  display: 'block'
                }}>
                  Explanation / Test Target (Optional)
                </label>
                <input
                  type="text"
                  value={testCase.explanation}
                  onChange={(e) => setTestCase(i, 'explanation', e.target.value)}
                  placeholder="e.g. nums[0] + nums[1] = 2 + 7 = 9, so return [0, 1]"
                  style={{
                    width: '100%',
                    background: '#f8fafc',
                    border: '1.2px solid #cbd5e1',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: '#0f172a',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Allowed Programming Languages ── */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
          flexWrap: 'wrap',
          gap: 8
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#1e293b',
            letterSpacing: '0.02em',
            textTransform: 'uppercase'
          }}>
            <Code2 size={15} color="#0a74da" />
            <span>ALLOWED PROGRAMMING LANGUAGES</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.78rem' }}>
            <button
              type="button"
              onClick={selectAllLanguages}
              style={{
                background: 'none',
                border: 'none',
                color: '#0a74da',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0
              }}
            >
              Select All
            </button>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <button
              type="button"
              onClick={resetLanguages}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0
              }}
            >
              Reset Defaults
            </button>
          </div>
        </div>

        {/* Language Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: 10
        }}>
          {programmingLanguages.map((lang) => {
            const isSelected = allowedLanguages.includes(lang.id);
            return (
              <div
                key={lang.id}
                onClick={() => toggleLanguage(lang.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '9px 12px',
                  background: isSelected ? '#eff6ff' : '#ffffff',
                  border: isSelected ? '1.5px solid #3b82f6' : '1.5px solid #e2e8f0',
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  userSelect: 'none',
                  boxShadow: isSelected ? '0 2px 8px rgba(59, 130, 246, 0.12)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{lang.icon}</span>
                  <span style={{
                    fontSize: '0.84rem',
                    fontWeight: isSelected ? 700 : 600,
                    color: isSelected ? '#1e40af' : '#475569'
                  }}>
                    {lang.name}
                  </span>
                </div>

                <div style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  background: isSelected ? '#2563eb' : '#f1f5f9',
                  border: isSelected ? 'none' : '1.5px solid #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CodingQuestionForm;
