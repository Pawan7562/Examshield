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
  Eye,
  EyeOff,
  Clock,
  HardDrive,
  Cpu,
  BookOpen,
  Info,
  Sparkles,
  Zap,
} from 'lucide-react';

const CodingQuestionForm = ({ q, idx, onChange, onRemove }) => {
  const set = (k) => (e) => onChange(idx, { ...q, [k]: e.target.value });

  const executionMode = q.executionMode || (q.executionFormat === 'stdin_stdout' ? 'STANDARD_INPUT_OUTPUT' : 'FUNCTION_BASED');

  const setExecutionMode = (mode) => {
    onChange(idx, {
      ...q,
      executionMode: mode,
      executionFormat: mode === 'FUNCTION_BASED' ? 'function' : 'stdin_stdout',
      className: q.className || 'Solution',
      functionName: q.functionName || 'twoSum',
      returnType: q.returnType || 'vector<int>',
      parameters: q.parameters && q.parameters.length > 0 ? q.parameters : [
        { name: 'nums', type: 'vector<int>' },
        { name: 'target', type: 'int' }
      ],
      comparisonMode: q.comparisonMode || 'ARRAY',
    });
  };

  const parameters = Array.isArray(q.parameters) ? q.parameters : (
    executionMode === 'FUNCTION_BASED' ? [
      { name: 'nums', type: 'vector<int>' },
      { name: 'target', type: 'int' }
    ] : []
  );

  const setParameter = (paramIdx, field, val) => {
    const params = [...parameters];
    params[paramIdx] = { ...params[paramIdx], [field]: val };
    onChange(idx, { ...q, parameters: params });
  };

  const addParameter = () => {
    const params = [...parameters];
    params.push({ name: `param${params.length + 1}`, type: 'int' });
    onChange(idx, { ...q, parameters: params });
  };

  const removeParameter = (paramIdx) => {
    const params = [...parameters];
    params.splice(paramIdx, 1);
    onChange(idx, { ...q, parameters: params });
  };

  const generateStarterCode = () => {
    const className = q.className || 'Solution';
    const funcName = q.functionName || 'twoSum';
    const retType = q.returnType || 'vector<int>';
    const params = parameters.length > 0 ? parameters : [{ name: 'nums', type: 'vector<int>' }, { name: 'target', type: 'int' }];

    const cppParams = params.map(p => {
      const t = p.type || 'int';
      return (t.includes('vector') || t.includes('string')) ? `${t}& ${p.name}` : `${t} ${p.name}`;
    }).join(', ');

    const starter = `class ${className} {\npublic:\n    ${retType} ${funcName}(${cppParams}) {\n        // Write your code here\n        \n    }\n};`;

    onChange(idx, {
      ...q,
      codeTemplate: starter,
    });
  };

  const setTestCase = (i, field, value) => {
    const testCases = [...(q.testCases || [{ input: '', output: '', explanation: '', is_hidden: false }])];
    testCases[i] = { ...testCases[i], [field]: value };
    onChange(idx, { ...q, testCases });
  };

  const addTestCase = (isHidden = false) => {
    const testCases = [...(q.testCases || [])];
    testCases.push({ input: '', output: '', explanation: '', is_hidden: isHidden });
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
    : [{ input: '', output: '', explanation: '', is_hidden: false }];

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
  const publicCount = testCases.filter(t => !t.is_hidden && !t.isHidden).length;
  const hiddenCount = testCases.filter(t => t.is_hidden || t.isHidden).length;

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
        gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)',
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
            placeholder="Describe the algorithmic challenge, background context, rules, and problem goals..."
            rows={5}
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

        {/* Right: Difficulty, Marks & Execution Format */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
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
                padding: '8px 12px',
                color: '#0f172a',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="easy">🟢 Easy (Basic Logic & Loops)</option>
              <option value="medium">🟡 Medium (Data Structures & Search)</option>
              <option value="hard">🔴 Hard (DP, Graphs & Trees)</option>
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
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  padding: '8px 0',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>points</span>
            </div>
          </div>

          {/* Execution Mode */}
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
              <Terminal size={14} color="#0a74da" />
              <span>EXECUTION MODE</span>
            </label>
            <select
              value={executionMode}
              onChange={(e) => setExecutionMode(e.target.value)}
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: 9,
                padding: '8px 12px',
                color: '#0f172a',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="FUNCTION_BASED">⚡ Function-based (LeetCode class Solution — Default)</option>
              <option value="STANDARD_INPUT_OUTPUT">⌨️ Standard I/O (stdin → stdout with main())</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Function-based Structured Metadata & Starter Code Panel ── */}
      {executionMode === 'FUNCTION_BASED' && (
        <div style={{
          marginBottom: 20,
          background: '#f8fafc',
          border: '1.5px solid #cbd5e1',
          borderRadius: 12,
          padding: '16px 18px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
            flexWrap: 'wrap',
            gap: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                background: '#eff6ff',
                color: '#2563eb',
                padding: '4px 8px',
                borderRadius: 6,
                fontWeight: 800,
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}>
                <Zap size={13} /> FUNCTION SPECIFICATION
              </div>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Platform automatically wraps and executes test cases without requiring student main()
              </span>
            </div>

            <button
              type="button"
              onClick={generateStarterCode}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#eff6ff',
                border: '1.5px solid #93c5fd',
                borderRadius: 8,
                color: '#1d4ed8',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '6px 12px',
                transition: 'all 0.15s ease'
              }}
            >
              <Zap size={13} />
              Auto-Generate Starter Code
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 12,
            marginBottom: 14
          }}>
            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: 4, display: 'block' }}>
                CLASS NAME
              </label>
              <input
                type="text"
                value={q.className || 'Solution'}
                onChange={set('className')}
                placeholder="Solution"
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '7px 10px',
                  fontSize: '0.82rem',
                  fontFamily: 'monospace',
                  color: '#0f172a',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: 4, display: 'block' }}>
                FUNCTION NAME
              </label>
              <input
                type="text"
                value={q.functionName || 'twoSum'}
                onChange={set('functionName')}
                placeholder="twoSum"
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '7px 10px',
                  fontSize: '0.82rem',
                  fontFamily: 'monospace',
                  color: '#0f172a',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: 4, display: 'block' }}>
                RETURN TYPE
              </label>
              <input
                type="text"
                value={q.returnType || 'vector<int>'}
                onChange={set('returnType')}
                placeholder="vector<int>, int, string, bool"
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '7px 10px',
                  fontSize: '0.82rem',
                  fontFamily: 'monospace',
                  color: '#0f172a',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: 4, display: 'block' }}>
                OUTPUT COMPARATOR
              </label>
              <select
                value={q.comparisonMode || 'ARRAY'}
                onChange={set('comparisonMode')}
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '7px 10px',
                  fontSize: '0.82rem',
                  color: '#0f172a',
                  boxSizing: 'border-box'
                }}
              >
                <option value="ARRAY">ARRAY (e.g. [0, 1])</option>
                <option value="EXACT">EXACT (Strict stdout match)</option>
                <option value="UNORDERED_ARRAY">UNORDERED_ARRAY (Order agnostic)</option>
                <option value="INTEGER">INTEGER (Numeric equality)</option>
                <option value="FLOAT_WITH_TOLERANCE">FLOAT_WITH_TOLERANCE (Epsilon)</option>
                <option value="STRING">STRING (Trimmed text)</option>
                <option value="BOOLEAN">BOOLEAN (true / false)</option>
              </select>
            </div>
          </div>

          {/* Parameters Section */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569' }}>
                PARAMETERS ({parameters.length})
              </label>
              <button
                type="button"
                onClick={addParameter}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0a74da',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Plus size={12} /> Add Parameter
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {parameters.map((p, pIdx) => (
                <div key={pIdx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => setParameter(pIdx, 'name', e.target.value)}
                    placeholder="Parameter name (e.g. nums)"
                    style={{
                      flex: 1,
                      background: '#ffffff',
                      border: '1.2px solid #cbd5e1',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                  <input
                    type="text"
                    value={p.type}
                    onChange={(e) => setParameter(pIdx, 'type', e.target.value)}
                    placeholder="Type (e.g. vector<int>)"
                    style={{
                      flex: 1,
                      background: '#ffffff',
                      border: '1.2px solid #cbd5e1',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                  {parameters.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeParameter(pIdx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: 4
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Starter Code Editor */}
          <div>
            <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: 4, display: 'block' }}>
              STARTER CODE / TEMPLATE (Given to candidates in editor)
            </label>
            <textarea
              value={q.codeTemplate || ''}
              onChange={set('codeTemplate')}
              placeholder={`class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};`}
              rows={4}
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1.2px solid #cbd5e1',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: '0.82rem',
                fontFamily: "'JetBrains Mono', Consolas, monospace",
                color: '#0f172a',
                boxSizing: 'border-box',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>
        </div>
      )}

      {/* ── Input & Output Formats ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        marginBottom: 20
      }}>
        <div>
          <label style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#334155',
            marginBottom: 6,
            display: 'block'
          }}>
            INPUT FORMAT SPECIFICATION
          </label>
          <textarea
            value={q.inputFormat || ''}
            onChange={set('inputFormat')}
            placeholder="e.g. The first line contains an integer T. Each test case consists of two integers N and K..."
            rows={2}
            style={{
              width: '100%',
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: '0.84rem',
              color: '#0f172a',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
        </div>

        <div>
          <label style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#334155',
            marginBottom: 6,
            display: 'block'
          }}>
            OUTPUT FORMAT SPECIFICATION
          </label>
          <textarea
            value={q.outputFormat || ''}
            onChange={set('outputFormat')}
            placeholder="e.g. Print a single integer representing the maximum subarray sum..."
            rows={2}
            style={{
              width: '100%',
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: '0.84rem',
              color: '#0f172a',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* ── Constraints & Complexity & Limits Row ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(180px, 1fr) minmax(180px, 1fr)',
        gap: 14,
        marginBottom: 22
      }}>
        <div>
          <label style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#334155',
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <Terminal size={13} color="#6366f1" />
            <span>CONSTRAINTS</span>
          </label>
          <textarea
            value={q.constraints || ''}
            onChange={set('constraints')}
            placeholder={"1 ≤ N ≤ 10^5\n-10^9 ≤ A[i] ≤ 10^9"}
            rows={2}
            style={{
              width: '100%',
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: '0.82rem',
              fontFamily: 'monospace',
              color: '#0f172a',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
        </div>

        <div>
          <label style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#334155',
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <Cpu size={13} color="#059669" />
            <span>TIME COMPLEXITY</span>
          </label>
          <input
            type="text"
            value={q.timeComplexity || ''}
            onChange={set('timeComplexity')}
            placeholder="e.g. O(N log N)"
            style={{
              width: '100%',
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: '0.84rem',
              fontFamily: 'monospace',
              color: '#0f172a',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
          <div style={{ marginTop: 8 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} /> Time Limit (ms)
            </label>
            <input
              type="number"
              value={q.timeLimit || 2000}
              onChange={set('timeLimit')}
              min={500}
              max={10000}
              step={500}
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: '0.82rem',
                color: '#0f172a',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <div>
          <label style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#334155',
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <HardDrive size={13} color="#0284c7" />
            <span>SPACE COMPLEXITY</span>
          </label>
          <input
            type="text"
            value={q.spaceComplexity || ''}
            onChange={set('spaceComplexity')}
            placeholder="e.g. O(1)"
            style={{
              width: '100%',
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: '0.84rem',
              fontFamily: 'monospace',
              color: '#0f172a',
              boxSizing: 'border-box',
              outline: 'none'
            }}
          />
          <div style={{ marginTop: 8 }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
              <HardDrive size={11} /> Memory Limit (MB)
            </label>
            <input
              type="number"
              value={q.memoryLimit || 256}
              onChange={set('memoryLimit')}
              min={64}
              max={1024}
              step={64}
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: '0.82rem',
                color: '#0f172a',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Test Cases Section (Public Sample + Confidential Hidden) ── */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                Test Cases ({testCases.length})
              </span>
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              background: '#ecfdf5',
              color: '#059669',
              border: '1px solid #a7f3d0',
              padding: '2px 8px',
              borderRadius: 12
            }}>
              🟢 {publicCount} Public Sample
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              padding: '2px 8px',
              borderRadius: 12
            }}>
              🔒 {hiddenCount} Hidden / Evaluation
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => addTestCase(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                borderRadius: 8,
                color: '#15803d',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '6px 12px',
                transition: 'all 0.15s ease'
              }}
            >
              <Plus size={13} strokeWidth={2.5} />
              + Sample Case
            </button>
            <button
              type="button"
              onClick={() => addTestCase(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#fef2f2',
                border: '1.5px solid #fca5a5',
                borderRadius: 8,
                color: '#b91c1c',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '6px 12px',
                transition: 'all 0.15s ease'
              }}
            >
              <EyeOff size={13} strokeWidth={2.5} />
              + Hidden Case
            </button>
          </div>
        </div>

        {/* List of Test Cases */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {testCases.map((testCase, i) => {
            const isHidden = !!(testCase.is_hidden || testCase.isHidden);
            return (
              <div
                key={i}
                style={{
                  background: '#ffffff',
                  border: isHidden ? '1.5px solid #fecaca' : '1.5px solid #cbd5e1',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: isHidden ? '#b91c1c' : '#0a74da',
                      background: isHidden ? '#fef2f2' : '#eff6ff',
                      padding: '3px 9px',
                      borderRadius: 6
                    }}>
                      Case #{i + 1}
                    </span>

                    {/* Toggle Public / Hidden Button */}
                    <button
                      type="button"
                      onClick={() => setTestCase(i, 'is_hidden', !isHidden)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 14,
                        cursor: 'pointer',
                        background: isHidden ? '#fef2f2' : '#ecfdf5',
                        color: isHidden ? '#dc2626' : '#059669',
                        border: isHidden ? '1px solid #fca5a5' : '1px solid #a7f3d0'
                      }}
                    >
                      {isHidden ? (
                        <>
                          <EyeOff size={12} /> Hidden Case (Evaluated on Server)
                        </>
                      ) : (
                        <>
                          <Eye size={12} /> Public Sample Case (Visible to Student)
                        </>
                      )}
                    </button>
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
                      placeholder="e.g. 0 1"
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
                    value={testCase.explanation || ''}
                    onChange={(e) => setTestCase(i, 'explanation', e.target.value)}
                    placeholder="e.g. Test case verifies handling of negative integers and duplicate elements"
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
            );
          })}
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
