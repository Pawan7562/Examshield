// src/components/CodeEditor.js — LeetCode-Grade Monaco IDE & Test Console
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import { parseParameters, formatLeetCodeInput, formatLeetCodeOutput } from '../utils/codeParamParser';
import { extractQuestionMetadata, generateStarterCode } from '../utils/starterCodeGenerator';
import {
  Play,
  Upload,
  RotateCcw,
  Terminal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Cpu,
  ChevronUp,
  ChevronDown,
  Plus,
  Code2,
  Copy,
  Check
} from 'lucide-react';

const SUPPORTED_LANGUAGES = [
  {
    id: 'cpp',
    name: 'C++',
    monacoLang: 'cpp',
    icon: '⚙️',
    badge: 'GCC 13',
    getDefaultCode: (metadata) => generateStarterCode('cpp', metadata),
  },
  {
    id: 'python',
    name: 'Python 3',
    monacoLang: 'python',
    icon: '🐍',
    badge: 'Python 3.11',
    getDefaultCode: (metadata) => generateStarterCode('python', metadata),
  },
  {
    id: 'javascript',
    name: 'JavaScript (Node.js)',
    monacoLang: 'javascript',
    icon: '🟨',
    badge: 'Node v20',
    getDefaultCode: (metadata) => generateStarterCode('javascript', metadata),
  },
  {
    id: 'java',
    name: 'Java',
    monacoLang: 'java',
    icon: '☕',
    badge: 'OpenJDK 21',
    getDefaultCode: (metadata) => generateStarterCode('java', metadata),
  }
];

const CodeEditor = ({
  question,
  answer,
  onAnswer,
  language = 'cpp',
  onLanguageChange,
  onRunCode,
  onSubmit,
  isRunning = false,
  isSubmitting = false,
  testResults = null,
  sampleTestCases = [],
  problemStatement = ''
}) => {
  const metadata = useMemo(() => {
    return extractQuestionMetadata(question);
  }, [question]);

  // Dynamic template generator that respects the selected language and question metadata
  const getTemplateForLanguage = useCallback((langId) => {
    const targetLang = langId || language || 'cpp';
    const langObj = SUPPORTED_LANGUAGES.find(l => l.id === targetLang) || SUPPORTED_LANGUAGES[0];

    // If question has a custom code_template that specifically matches this question and targetLang is C++:
    if (question?.code_template && (!targetLang || targetLang === 'cpp')) {
      if (metadata.executionMode === 'STANDARD_INPUT_OUTPUT' ||
          !metadata.functionName ||
          question.code_template.includes(metadata.functionName)) {
        return question.code_template;
      }
    }

    return langObj.getDefaultCode(metadata);
  }, [language, question, metadata]);

  // Detects if the current answer in state or storage is stale from another question or default
  const isStaleAnswer = useCallback((ans) => {
    if (!ans || typeof ans !== 'string') return true;
    const str = ans.trim();
    if (!str) return true;

    // Check 1: If question has a functionName and it is not 'twoSum', but answer contains 'twoSum'
    if (metadata.functionName && metadata.functionName !== 'twoSum') {
      if (str.includes('twoSum')) return true;
      // If answer is a template boilerplate (class Solution ...) but does NOT have functionName
      if ((str.includes('class Solution') || str.includes('public:') || str.includes('// Write your code here') || str.includes('def ')) && !str.includes(metadata.functionName)) {
        return true;
      }
    }

    // Check 2: If question is FUNCTION_BASED, but answer is a standard I/O template without the function
    if (metadata.executionMode === 'FUNCTION_BASED' && metadata.functionName) {
      if ((str.includes('cin >>') || str.includes('sys.stdin') || str.includes('Scanner sc')) && !str.includes(metadata.functionName)) {
        return true;
      }
    }

    // Check 3: If question is STANDARD_INPUT_OUTPUT, but answer contains 'class Solution' or 'twoSum'
    if (metadata.executionMode === 'STANDARD_INPUT_OUTPUT') {
      if (str.includes('class Solution') || str.includes('twoSum')) {
        return true;
      }
    }

    return false;
  }, [metadata]);

  const [code, setCode] = useState(() => {
    if (!isStaleAnswer(answer)) {
      return answer;
    }
    return getTemplateForLanguage(language);
  });
  const [fontSize, setFontSize] = useState(14);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [activeConsoleTab, setActiveConsoleTab] = useState('testcase'); // 'testcase' | 'console' | 'output'
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [isCustomCase, setIsCustomCase] = useState(false);
  const [copiedStdout, setCopiedStdout] = useState(false);

  // Editable parameters store: { [caseIdx]: [{ name, value }] }
  const [editedParamsMap, setEditedParamsMap] = useState({});

  const editorInstanceRef = useRef(null);
  const containerRef = useRef(null);

  // Normalized cases list
  const cases = useMemo(() => {
    if (Array.isArray(sampleTestCases) && sampleTestCases.length > 0) return sampleTestCases;
    if (Array.isArray(question?.examples) && question.examples.length > 0) return question.examples;
    if (Array.isArray(question?.sampleTestCases) && question.sampleTestCases.length > 0) return question.sampleTestCases;
    if (Array.isArray(question?.testCases) && question.testCases.length > 0) {
      const pub = question.testCases.filter(tc => !tc.is_hidden && !tc.isHidden);
      if (pub.length > 0) return pub;
    }
    if (Array.isArray(question?.test_cases) && question.test_cases.length > 0) {
      const pub = question.test_cases.filter(tc => !tc.is_hidden && !tc.isHidden);
      if (pub.length > 0) return pub;
    }

    if (metadata.functionName === 'findMax') {
      return [
        {
          input: 'nums = [3, 7, 2, 9, 4]',
          output: '9',
          explanation: 'The largest element in the array is 9.'
        },
        {
          input: 'nums = [-5, -2, -10, -1]',
          output: '-1',
          explanation: 'Tests the solution with negative integers.'
        }
      ];
    }

    if (metadata.functionName === 'twoSum') {
      return [
        {
          input: 'nums = [2,7,11,15], target = 9',
          output: '[0,1]',
          explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
        },
        {
          input: 'nums = [3,2,4], target = 6',
          output: '[1,2]',
          explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
        }
      ];
    }

    return [
      {
        input: 'nums = [1, 2, 3]',
        output: '3',
        explanation: 'Sample test case.'
      }
    ];
  }, [sampleTestCases, question, metadata]);

  // Synchronize code when question, language, or answer changes
  useEffect(() => {
    const isStale = isStaleAnswer(answer);
    if (isStale) {
      const template = getTemplateForLanguage(language);
      setCode(template);
      onAnswer?.(template, language);
    } else if (answer !== undefined && answer !== code) {
      setCode(answer);
    }
  }, [question?.id, language, isStaleAnswer, getTemplateForLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Switch to output tab automatically when run completes
  useEffect(() => {
    if (testResults) {
      setActiveConsoleTab('output');
      setConsoleOpen(true);
      setSelectedCaseIdx(0);
    }
  }, [testResults]);

  // Code change handler
  const handleCodeChange = (newCode) => {
    setCode(newCode || '');
    onAnswer?.(newCode || '', language);
  };

  // Language switch handler
  const handleSelectLanguage = (newLangId) => {
    const langObj = SUPPORTED_LANGUAGES.find(l => l.id === newLangId);
    if (!langObj) return;

    onLanguageChange?.(newLangId);
    const newTemplate = getTemplateForLanguage(newLangId);
    setCode(newTemplate);
    onAnswer?.(newTemplate, newLangId);
    toast.success(`Switched to ${langObj.name}`, { icon: langObj.icon, duration: 2000 });
  };

  // Reset to initial boilerplate template
  const handleResetCode = () => {
    const resetTemplate = getTemplateForLanguage(language);
    setCode(resetTemplate);
    onAnswer?.(resetTemplate, language);
    toast.success('Code reset to question starter template');
  };

  const knownParams = useMemo(() => {
    return metadata.parameters || [];
  }, [metadata]);

  // Get active case parameters (either user-edited or parsed from default case)
  const getActiveCaseParams = useCallback((idx) => {
    if (editedParamsMap[idx]) {
      return editedParamsMap[idx];
    }
    const targetCase = cases[idx];
    if (!targetCase) return [];
    return parseParameters(targetCase.input, problemStatement, knownParams);
  }, [editedParamsMap, cases, problemStatement, knownParams]);

  // Handle editing a specific parameter
  const handleParamChange = (caseIdx, paramIdx, newVal) => {
    const currentParams = [...getActiveCaseParams(caseIdx)];
    if (currentParams[paramIdx]) {
      currentParams[paramIdx] = {
        ...currentParams[paramIdx],
        value: newVal
      };
      setEditedParamsMap(prev => ({
        ...prev,
        [caseIdx]: currentParams
      }));
    }
  };

  // Run code handler (supports custom input or sample cases with edited parameters)
  const handleRun = useCallback(() => {
    if (isCustomCase) {
      onRunCode?.(code, language, customInput, null);
    } else {
      const casesToRun = cases.map((c, idx) => {
        const edited = editedParamsMap[idx];
        const inputVal = (edited && edited.length > 0) ? formatLeetCodeInput(edited) : (c.input || '');
        return {
          ...c,
          input: inputVal,
          output: c.output ?? c.expected_output ?? ''
        };
      });
      onRunCode?.(code, language, null, casesToRun);
    }
  }, [code, language, isCustomCase, customInput, cases, editedParamsMap, onRunCode]);

  // Submit solution handler
  const handleSubmit = () => {
    onSubmit?.(code, language);
  };

  // Keyboard shortcut listener (Ctrl + Enter to run)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isRunning && !isSubmitting) {
          handleRun();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun, isRunning, isSubmitting]);

  const activeLangConfig = SUPPORTED_LANGUAGES.find(l => l.id === language) || SUPPORTED_LANGUAGES[0];
  const activeCaseData = isCustomCase ? null : cases[selectedCaseIdx];
  const activeCaseParams = isCustomCase ? [] : getActiveCaseParams(selectedCaseIdx);
  const resultCaseData = testResults?.testCases?.[selectedCaseIdx];

  const handleCopyStdout = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedStdout(true);
    setTimeout(() => setCopiedStdout(false), 2000);
  };

  return (
    <div className="er-ide-container" ref={containerRef}>
      {/* ── IDE TOP TOOLBAR ─────────────────────────────────────────── */}
      <div className="er-ide-toolbar">
        <div className="er-ide-toolbar-left">
          {/* Language Selector */}
          <div className="er-ide-lang-selector-wrap">
            <span className="er-ide-lang-icon">{activeLangConfig.icon}</span>
            <select
              value={language}
              onChange={(e) => handleSelectLanguage(e.target.value)}
              className="er-ide-lang-select"
              aria-label="Select Programming Language"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
            <span className="er-ide-lang-badge">{activeLangConfig.badge}</span>
          </div>

          {/* Reset Code */}
          <button
            onClick={handleResetCode}
            className="er-ide-tool-btn"
            title="Reset code template"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="er-ide-toolbar-right">
          {/* Font Size Adjusters */}
          <div className="er-ide-font-controls">
            <button
              onClick={() => setFontSize(s => Math.max(11, s - 1))}
              className="er-ide-font-btn"
              title="Decrease font size"
            >
              A-
            </button>
            <span className="er-ide-font-label">{fontSize}px</span>
            <button
              onClick={() => setFontSize(s => Math.min(20, s + 1))}
              className="er-ide-font-btn"
              title="Increase font size"
            >
              A+
            </button>
          </div>

          <div className="er-ide-shortcut-hint">
            <code>Ctrl + Enter</code> to run
          </div>

          {/* Top Quick Actions */}
          <div className="er-ide-header-actions">
            <button
              onClick={handleRun}
              disabled={isRunning || isSubmitting}
              className="er-ide-header-btn-run"
              title="Run code against test case (Ctrl + Enter)"
            >
              {isRunning ? (
                <>
                  <div className="er-ide-btn-spinner" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play size={13} fill="#22c55e" color="#22c55e" />
                  <span>Run</span>
                </>
              )}
            </button>

            <button
              onClick={handleSubmit}
              disabled={isRunning || isSubmitting}
              className="er-ide-header-btn-submit"
              title="Submit code for evaluation"
            >
              {isSubmitting ? (
                <>
                  <div className="er-ide-btn-spinner" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Upload size={13} />
                  <span>Submit</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── MONACO CODE EDITOR ──────────────────────────────────────── */}
      <div
        className="er-ide-editor-area"
        style={{ height: consoleOpen ? 'calc(100% - 310px)' : 'calc(100% - 46px)' }}
      >
        <Editor
          height="100%"
          language={activeLangConfig.monacoLang}
          theme="vs-dark"
          value={code}
          onChange={handleCodeChange}
          onMount={(editor) => {
            editorInstanceRef.current = editor;
          }}
          options={{
            fontSize,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            renderLineHighlight: 'all',
            bracketPairColorization: { enabled: true },
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            suggestOnTriggerCharacters: true,
            wordWrap: 'on',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            padding: { top: 12, bottom: 12 },
          }}
          loading={
            <div className="er-ide-loading-box">
              <div className="er-ide-spinner" />
              <span>Loading Compiler Sandbox...</span>
            </div>
          }
        />
      </div>

      {/* ── LEETCODE DRAWER (TEST CASES │ CONSOLE │ OUTPUT) ─────────── */}
      <div className={`er-ide-console-drawer ${consoleOpen ? 'open' : 'closed'}`}>
        {/* Console Header Tabs */}
        <div className="er-ide-console-header">
          <div className="er-ide-console-tabs">
            {/* Tab 1: Test Cases */}
            <button
              onClick={() => { setActiveConsoleTab('testcase'); setConsoleOpen(true); }}
              className={`er-ide-tab-btn ${activeConsoleTab === 'testcase' ? 'active' : ''}`}
            >
              <Code2 size={13} />
              <span>Test Cases</span>
            </button>

            {/* Tab 2: Console Log */}
            <button
              onClick={() => { setActiveConsoleTab('console'); setConsoleOpen(true); }}
              className={`er-ide-tab-btn ${activeConsoleTab === 'console' ? 'active' : ''}`}
            >
              <Terminal size={13} />
              <span>Console</span>
            </button>

            {/* Tab 3: Output / Test Result */}
            <button
              onClick={() => { setActiveConsoleTab('output'); setConsoleOpen(true); }}
              className={`er-ide-tab-btn ${activeConsoleTab === 'output' ? 'active' : ''}`}
            >
              <span>Output</span>
              {testResults && (
                <span className={`er-ide-tab-dot ${testResults.status === 'Accepted' || testResults.status === 'Finished' ? 'pass' : 'fail'}`} />
              )}
            </button>
          </div>

          <div className="er-ide-console-header-actions">
            <button
              onClick={() => setConsoleOpen(o => !o)}
              className="er-ide-console-toggle-btn"
              title={consoleOpen ? 'Collapse console' : 'Expand console'}
            >
              {consoleOpen ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
            </button>
          </div>
        </div>

        {/* Console Content Body */}
        {consoleOpen && (
          <div className="er-ide-console-body">
            
            {/* ── TAB 1: TEST CASES (LEETCODE PARAMETER VIEW) ── */}
            {activeConsoleTab === 'testcase' && (
              <div className="er-ide-testcase-view">
                {/* Case selector pills with ✓ if evaluated */}
                <div className="er-ide-case-pills">
                  {cases.map((_, idx) => {
                    const evaluatedTc = testResults?.testCases?.[idx];
                    const isPassed = evaluatedTc?.passed;
                    return (
                      <button
                        key={idx}
                        onClick={() => { setSelectedCaseIdx(idx); setIsCustomCase(false); }}
                        className={`er-ide-case-pill ${!isCustomCase && selectedCaseIdx === idx ? 'active' : ''}`}
                      >
                        {evaluatedTc && (
                          <span className={`er-ide-pill-check ${isPassed ? 'pass' : 'fail'}`}>
                            {isPassed ? '✓' : '✗'}
                          </span>
                        )}
                        Case {idx + 1}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setIsCustomCase(true)}
                    className={`er-ide-case-pill custom ${isCustomCase ? 'active' : ''}`}
                  >
                    <Plus size={11} /> Custom Input
                  </button>
                </div>

                {/* Case parameters content */}
                <div className="er-ide-case-content">
                  {isCustomCase ? (
                    <div className="er-ide-custom-input-box">
                      <div className="er-ide-case-label">Custom Test Input</div>
                      <textarea
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Enter parameters (e.g. nums = [2,7,11,15], target = 9)"
                        className="er-ide-custom-textarea"
                        rows={4}
                      />
                    </div>
                  ) : activeCaseParams.length > 0 ? (
                    <div className="er-ide-params-container">
                      {activeCaseParams.map((param, pIdx) => (
                        <div key={pIdx} className="er-ide-param-group">
                          <div className="er-ide-param-name">
                            <span>{param.name} =</span>
                          </div>
                          <div className="er-ide-param-input-wrap">
                            <input
                              type="text"
                              className="er-ide-param-input"
                              value={param.value}
                              onChange={(e) => handleParamChange(selectedCaseIdx, pIdx, e.target.value)}
                              placeholder={`Enter ${param.name}`}
                            />
                          </div>
                        </div>
                      ))}

                      {/* Expected Output */}
                      {(activeCaseData?.output || activeCaseData?.expected_output) && (
                        <div className="er-ide-expected-box">
                          <span className="er-ide-expected-label">Expected Output:</span>
                          <code className="er-ide-expected-val">
                            {formatLeetCodeOutput(activeCaseData.output ?? activeCaseData.expected_output)}
                          </code>
                        </div>
                      )}
                    </div>
                  ) : activeCaseData ? (
                    <div className="er-ide-raw-case-box">
                      <div className="er-ide-param-name">input =</div>
                      <pre className="er-ide-code-output">
                        {String(activeCaseData.input || '(No input)')}
                      </pre>
                    </div>
                  ) : (
                    <div className="er-ide-empty-case">No test case selected.</div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 2: CONSOLE (STDOUT / LOGS) ── */}
            {activeConsoleTab === 'console' && (
              <div className="er-ide-stdout-view">
                <div className="er-ide-stdout-header">
                  <span className="er-ide-stdout-title">Terminal Standard Output</span>
                  {testResults?.testCases?.some(t => t.stdout) && (
                    <button
                      onClick={() => handleCopyStdout(testResults.testCases.map((t, i) => `[Case ${i + 1}]\n${t.stdout}`).join('\n\n'))}
                      className="er-ide-stdout-copy-btn"
                    >
                      {copiedStdout ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                      <span>{copiedStdout ? 'Copied' : 'Copy Logs'}</span>
                    </button>
                  )}
                </div>
                <pre className="er-ide-raw-stdout">
                  {testResults?.testCases
                    ?.filter(t => t.stdout)
                    ?.map((t, i) => `Case ${i + 1} output:\n${t.stdout}`)
                    ?.join('\n\n') || (
                      <span className="er-ide-stdout-placeholder">
                        Run your code to see console.log or standard output logs here.
                      </span>
                    )}
                </pre>
              </div>
            )}

            {/* ── TAB 3: OUTPUT / TEST RESULT ── */}
            {activeConsoleTab === 'output' && (
              <div className="er-ide-result-view">
                {!testResults ? (
                  <div className="er-ide-empty-result">
                    <Play size={20} color="#64748b" />
                    <span>Run your code to view evaluation output, execution runtime, and test results.</span>
                  </div>
                ) : (
                  <>
                    {/* Execution Status Banner */}
                    <div className={`er-ide-status-banner ${testResults.status === 'Accepted' || testResults.status === 'Finished' ? 'accepted' : 'rejected'}`}>
                      <div className="er-ide-status-left">
                        {testResults.status === 'Accepted' || testResults.status === 'Finished' ? (
                          <CheckCircle2 size={18} color="#22c55e" />
                        ) : testResults.status === 'Time Limit Exceeded' ? (
                          <Clock size={18} color="#f59e0b" />
                        ) : (
                          <XCircle size={18} color="#ef4444" />
                        )}
                        <span className="er-ide-status-title">
                          {testResults.status === 'Compilation Error' ? 'Compile Error' : testResults.status}
                        </span>
                        {testResults.status !== 'Compilation Error' && testResults.totalTestCases !== undefined && (
                          <span className="er-ide-status-score">
                            ({testResults.passedTestCases}/{testResults.totalTestCases} Cases Passed)
                          </span>
                        )}
                      </div>

                      <div className="er-ide-status-metrics">
                        {testResults.executionTimeMs !== undefined && (
                          <span className="er-ide-metric-item">
                            <Clock size={12} /> {testResults.executionTimeMs} ms
                          </span>
                        )}
                        {testResults.memoryKb !== undefined && (
                          <span className="er-ide-metric-item">
                            <Cpu size={12} /> {(testResults.memoryKb / 1024).toFixed(1)} MB
                          </span>
                        )}
                      </div>
                    </div>

                    {/* DEDICATED COMPILATION ERROR VIEW (LeetCode Grade) */}
                    {testResults.status === 'Compilation Error' ? (
                      <div className="er-ide-error-banner" style={{ marginTop: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#ef4444', fontWeight: 600, fontSize: 13 }}>
                          <AlertTriangle size={16} />
                          <span>Compilation Diagnostic Output</span>
                        </div>
                        <pre className="er-ide-error-text">{testResults.error || testResults.stderr || 'Compilation failed.'}</pre>
                      </div>
                    ) : (
                      <>
                        {/* Evaluated Testcase Tabs */}
                        {testResults.testCases && testResults.testCases.length > 0 && (
                          <>
                            <div className="er-ide-case-pills" style={{ marginTop: 10 }}>
                              {testResults.testCases.map((tc, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedCaseIdx(idx)}
                                  className={`er-ide-case-pill ${selectedCaseIdx === idx ? 'active' : ''} ${tc.passed ? 'pass' : 'fail'}`}
                                >
                                  <span className={`er-ide-pill-check ${tc.passed ? 'pass' : 'fail'}`}>
                                    {tc.passed ? '✓' : '✗'}
                                  </span>
                                  Case {idx + 1}
                                </button>
                              ))}
                            </div>

                            {resultCaseData && (
                              <div className="er-ide-case-result-detail">
                                {/* Decomposed Input */}
                                <div className="er-ide-case-field">
                                  <span className="er-ide-case-label">Input</span>
                                  <pre className="er-ide-code-output">
                                    {(() => {
                                      const parsed = parseParameters(resultCaseData.input, problemStatement, knownParams);
                                      return parsed.length > 0 ? formatLeetCodeInput(parsed) : String(resultCaseData.input ?? '');
                                    })()}
                                  </pre>
                                </div>

                                {/* Actual Output */}
                                <div className="er-ide-case-field">
                                  <span className="er-ide-case-label">Output</span>
                                  <pre className={`er-ide-code-output ${resultCaseData.passed ? 'pass' : 'fail'}`}>
                                    {formatLeetCodeOutput(resultCaseData.actualOutput ?? resultCaseData.output)}
                                  </pre>
                                </div>

                                {/* Expected Output */}
                                <div className="er-ide-case-field">
                                  <span className="er-ide-case-label">Expected</span>
                                  <pre className="er-ide-code-output expected">
                                    {formatLeetCodeOutput(resultCaseData.expectedOutput)}
                                  </pre>
                                </div>

                                {/* Stdout if available */}
                                {resultCaseData.stdout && (
                                  <div className="er-ide-case-field" style={{ gridColumn: '1 / -1' }}>
                                    <span className="er-ide-case-label">Stdout</span>
                                    <pre className="er-ide-code-output stdout">{resultCaseData.stdout}</pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}

                        {/* Runtime or Global Error */}
                        {testResults.error && (
                          <div className="er-ide-error-banner" style={{ marginTop: 12 }}>
                            <AlertTriangle size={15} color="#ef4444" />
                            <pre className="er-ide-error-text">{testResults.error}</pre>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── BOTTOM ACTION FOOTER ───────────────────────────────────── */}
        <div className="er-ide-action-footer">
          <div className="er-ide-footer-left">
            <button
              onClick={() => setConsoleOpen(o => !o)}
              className="er-ide-console-btn"
            >
              <Terminal size={14} />
              <span>Console</span>
              {consoleOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            </button>
          </div>

          <div className="er-ide-footer-right">
            <button
              onClick={handleRun}
              disabled={isRunning || isSubmitting}
              className="er-ide-run-btn"
              title="Run code against test cases (Ctrl + Enter)"
            >
              {isRunning ? (
                <>
                  <div className="er-ide-btn-spinner" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play size={14} fill="#22c55e" color="#22c55e" />
                  <span>Run Code</span>
                </>
              )}
            </button>

            <button
              onClick={handleSubmit}
              disabled={isRunning || isSubmitting}
              className="er-ide-submit-btn"
              title="Submit code for proctored evaluation and scoring"
            >
              {isSubmitting ? (
                <>
                  <div className="er-ide-btn-spinner" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Upload size={14} />
                  <span>Submit</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
