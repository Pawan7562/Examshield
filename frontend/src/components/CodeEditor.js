// src/components/CodeEditor.js — Enterprise Monaco-Powered Assessment IDE & Sandbox Console
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
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
  Code2
} from 'lucide-react';

const SUPPORTED_LANGUAGES = [
  {
    id: 'javascript',
    name: 'JavaScript (Node.js)',
    monacoLang: 'javascript',
    icon: '🟨',
    badge: 'Node v20',
    getDefaultCode: (format = 'stdin_stdout', fnName = 'solution') => {
      if (format === 'function') {
        return `/**
 * @param {any} input
 * @return {any}
 */
function ${fnName}(input) {
  // Write your solution here
  
  return input;
}`;
      }
      return `const fs = require('fs');

function main() {
  const input = fs.readFileSync(0, 'utf-8').trim();
  if (!input) return;

  // Write your solution here: process input and output with console.log
  
}

main();`;
    }
  },
  {
    id: 'python',
    name: 'Python 3',
    monacoLang: 'python',
    icon: '🐍',
    badge: 'Python 3.11',
    getDefaultCode: (format = 'stdin_stdout', fnName = 'solution') => {
      if (format === 'function') {
        return `class Solution:
    def ${fnName}(self, input):
        # Write your solution here
        
        return input`;
      }
      return `import sys

def main():
    # Read input from standard input
    input_data = sys.stdin.read().strip()
    if not input_data:
        return
    
    # Write your solution here: process input_data and print result
    

if __name__ == '__main__':
    main()`;
    }
  },
  {
    id: 'cpp',
    name: 'C++',
    monacoLang: 'cpp',
    icon: '⚙️',
    badge: 'GCC 13',
    getDefaultCode: (format = 'stdin_stdout', fnName = 'solution') => {
      if (format === 'function') {
        return `#include <iostream>
#include <vector>
#include <string>

using namespace std;

class Solution {
public:
    int ${fnName}(int input) {
        // Write your solution here
        return input;
    }
};`;
      }
      return `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    // Fast I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Write your solution here: read with cin and output with cout
    

    return 0;
}`;
    }
  },
  {
    id: 'java',
    name: 'Java',
    monacoLang: 'java',
    icon: '☕',
    badge: 'OpenJDK 21',
    getDefaultCode: (format = 'stdin_stdout', fnName = 'solution') => {
      if (format === 'function') {
        return `import java.util.*;

class Solution {
    public int ${fnName}(int input) {
        // Write your solution here
        return input;
    }
};`;
      }
      return `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here: read from sc and print to System.out
        
    }
}`;
    }
  }
];

const CodeEditor = ({
  question,
  answer,
  onAnswer,
  language = 'javascript',
  onLanguageChange,
  onRunCode,
  onSubmit,
  isRunning = false,
  isSubmitting = false,
  testResults = null,
  sampleTestCases = []
}) => {
  const [code, setCode] = useState(answer || '');
  const [fontSize, setFontSize] = useState(14);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [activeConsoleTab, setActiveConsoleTab] = useState('testcase'); // 'testcase' | 'result' | 'stdout'
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [isCustomCase, setIsCustomCase] = useState(false);

  const editorInstanceRef = useRef(null);
  const containerRef = useRef(null);

  const executionFormat = question?.executionFormat ||
    question?.execution_format ||
    (typeof question?.options === 'object' && question?.options?.executionFormat) ||
    'stdin_stdout';

  // Extract function name from question or fallback to 'solution'
  const detectedFnName = useMemo(() => {
    if (!question) return 'solution';
    const text = question.title || question.question_text || '';
    const match = text.match(/(?:function|def|method)\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
    if (match) return match[1];
    // If title has camelCase or PascalCase word
    const words = (question.title || '').split(/\s+/);
    for (const w of words) {
      if (/^[a-z][a-zA-Z0-9]+$/.test(w) && w.length > 3) return w;
    }
    return 'solution';
  }, [question]);

  // Normalized cases list
  const cases = useMemo(() => {
    if (Array.isArray(sampleTestCases) && sampleTestCases.length > 0) return sampleTestCases;
    if (Array.isArray(question?.examples) && question.examples.length > 0) return question.examples;
    if (Array.isArray(question?.sampleTestCases) && question.sampleTestCases.length > 0) return question.sampleTestCases;
    if (Array.isArray(question?.testCases) && question.testCases.length > 0) {
      return question.testCases.filter(tc => !tc.is_hidden && !tc.isHidden);
    }
    if (Array.isArray(question?.test_cases) && question.test_cases.length > 0) {
      return question.test_cases.filter(tc => !tc.is_hidden && !tc.isHidden);
    }
    return [];
  }, [sampleTestCases, question]);

  // Auto-switch to custom case if no sample cases exist
  useEffect(() => {
    if (cases.length === 0) {
      setIsCustomCase(true);
    }
  }, [cases.length]);

  // Initial code template setup
  useEffect(() => {
    if (!answer) {
      const currentLang = SUPPORTED_LANGUAGES.find(l => l.id === language) || SUPPORTED_LANGUAGES[0];
      const template = question?.code_template || currentLang.getDefaultCode(executionFormat, detectedFnName);
      setCode(template);
      onAnswer?.(template, language);
    } else {
      setCode(answer);
    }
  }, [language, question, executionFormat, detectedFnName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Switch to result tab automatically when run completes
  useEffect(() => {
    if (testResults) {
      setActiveConsoleTab('result');
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
    const newTemplate = langObj.getDefaultCode(executionFormat, detectedFnName);
    setCode(newTemplate);
    onAnswer?.(newTemplate, newLangId);
    toast.success(`Switched to ${langObj.name}`, { icon: langObj.icon, duration: 2500 });
  };

  // Reset to initial boilerplate template
  const handleResetCode = () => {
    const langObj = SUPPORTED_LANGUAGES.find(l => l.id === language) || SUPPORTED_LANGUAGES[0];
    const resetTemplate = question?.code_template || langObj.getDefaultCode(executionFormat, detectedFnName);
    setCode(resetTemplate);
    onAnswer?.(resetTemplate, language);
    toast.success('Code reset to default starter template');
  };

  // Run code handler (supports custom input or configured cases)
  const handleRun = useCallback(() => {
    const inputToRun = isCustomCase ? customInput : null;
    onRunCode?.(code, language, inputToRun);
  }, [code, language, isCustomCase, customInput, onRunCode]);

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
  const resultCaseData = testResults?.testCases?.[selectedCaseIdx];

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
            title="Reset to starter template"
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

          {/* Quick IDE Header Action Buttons (Always Visible at the Top) */}
          <div className="er-ide-header-actions">
            <button
              onClick={handleRun}
              disabled={isRunning || isSubmitting}
              className="er-ide-header-btn-run"
              title="Run code (Ctrl + Enter)"
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
      <div className="er-ide-editor-area" style={{ height: consoleOpen ? 'calc(100% - 280px)' : 'calc(100% - 46px)' }}>
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
            tabSize: 2,
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
              <span>Loading Assessment Compiler...</span>
            </div>
          }
        />
      </div>

      {/* ── LEETCODE-STYLE CONSOLE & TESTCASE DRAWER ─────────────────── */}
      <div className={`er-ide-console-drawer ${consoleOpen ? 'open' : 'closed'}`}>
        {/* Console Header Tabs */}
        <div className="er-ide-console-header">
          <div className="er-ide-console-tabs">
            <button
              onClick={() => { setActiveConsoleTab('testcase'); setConsoleOpen(true); }}
              className={`er-ide-tab-btn ${activeConsoleTab === 'testcase' ? 'active' : ''}`}
            >
              <Code2 size={13} />
              <span>Testcase</span>
            </button>
            <button
              onClick={() => { setActiveConsoleTab('result'); setConsoleOpen(true); }}
              className={`er-ide-tab-btn ${activeConsoleTab === 'result' ? 'active' : ''}`}
            >
              <Terminal size={13} />
              <span>Test Result</span>
              {testResults && (
                <span className={`er-ide-tab-dot ${testResults.status === 'Accepted' ? 'pass' : 'fail'}`} />
              )}
            </button>
            {testResults?.testCases?.some(t => t.stdout) && (
              <button
                onClick={() => { setActiveConsoleTab('stdout'); setConsoleOpen(true); }}
                className={`er-ide-tab-btn ${activeConsoleTab === 'stdout' ? 'active' : ''}`}
              >
                <span>Console Log</span>
              </button>
            )}
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
            {/* ── TAB 1: TESTCASE ── */}
            {activeConsoleTab === 'testcase' && (
              <div className="er-ide-testcase-view">
                {/* Case selector pills */}
                <div className="er-ide-case-pills">
                  {cases.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setSelectedCaseIdx(idx); setIsCustomCase(false); }}
                      className={`er-ide-case-pill ${!isCustomCase && selectedCaseIdx === idx ? 'active' : ''}`}
                    >
                      Case {idx + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setIsCustomCase(true)}
                    className={`er-ide-case-pill custom ${isCustomCase ? 'active' : ''}`}
                  >
                    <Plus size={11} /> Custom Input
                  </button>
                </div>

                {/* Case parameter content */}
                <div className="er-ide-case-content">
                  {isCustomCase ? (
                    <div className="er-ide-custom-input-box">
                      <div className="er-ide-case-label">Custom Test Input</div>
                      <textarea
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="Enter parameters (e.g., nums = [2,7,11,15], target = 9 or JSON format)"
                        className="er-ide-custom-textarea"
                        rows={3}
                      />
                    </div>
                  ) : activeCaseData ? (
                    <div className="er-ide-case-box">
                      <div className="er-ide-case-field">
                        <span className="er-ide-case-label">Input</span>
                        <pre className="er-ide-code-output">
                          {typeof activeCaseData.input === 'object'
                            ? JSON.stringify(activeCaseData.input, null, 2)
                            : String(activeCaseData.input || '(No input)')}
                        </pre>
                      </div>
                      {(activeCaseData.output || activeCaseData.expected_output) && (
                        <div className="er-ide-case-field" style={{ marginTop: 8 }}>
                          <span className="er-ide-case-label">Expected Output</span>
                          <pre className="er-ide-code-output expected">
                            {typeof (activeCaseData.output ?? activeCaseData.expected_output) === 'object'
                              ? JSON.stringify(activeCaseData.output ?? activeCaseData.expected_output, null, 2)
                              : String(activeCaseData.output ?? activeCaseData.expected_output)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="er-ide-empty-case">No testcase configured.</div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 2: TEST RESULT ── */}
            {activeConsoleTab === 'result' && (
              <div className="er-ide-result-view">
                {!testResults ? (
                  <div className="er-ide-empty-result">
                    <Play size={20} color="#64748b" />
                    <span>Run your code to see execution output and test case evaluation.</span>
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
                        <span className="er-ide-status-title">{testResults.status}</span>
                        {testResults.status !== 'Finished' && testResults.totalTestCases !== undefined && (
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

                    {/* Result Testcase Tabs */}
                    {testResults.testCases && testResults.testCases.length > 0 && (
                      <>
                        <div className="er-ide-case-pills" style={{ marginTop: 10 }}>
                          {testResults.testCases.map((tc, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedCaseIdx(idx)}
                              className={`er-ide-case-pill ${selectedCaseIdx === idx ? 'active' : ''} ${tc.passed ? 'pass' : 'fail'}`}
                            >
                              <span className={`er-ide-pill-dot ${tc.passed ? 'pass' : 'fail'}`} />
                              Case {idx + 1}
                            </button>
                          ))}
                        </div>

                        {resultCaseData && (
                          <div className="er-ide-case-result-detail">
                            <div className="er-ide-case-field">
                              <span className="er-ide-case-label">Input</span>
                              <pre className="er-ide-code-output">
                                {typeof resultCaseData.input === 'object'
                                  ? JSON.stringify(resultCaseData.input)
                                  : String(resultCaseData.input)}
                              </pre>
                            </div>

                            <div className="er-ide-case-field">
                              <span className="er-ide-case-label">Output</span>
                              <pre className={`er-ide-code-output ${resultCaseData.passed ? 'pass' : 'fail'}`}>
                                {typeof resultCaseData.actualOutput === 'object'
                                  ? JSON.stringify(resultCaseData.actualOutput)
                                  : String(resultCaseData.actualOutput)}
                              </pre>
                            </div>

                            <div className="er-ide-case-field">
                              <span className="er-ide-case-label">Expected</span>
                              <pre className="er-ide-code-output expected">
                                {typeof resultCaseData.expectedOutput === 'object'
                                  ? JSON.stringify(resultCaseData.expectedOutput)
                                  : String(resultCaseData.expectedOutput)}
                              </pre>
                            </div>

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

                    {/* Compilation or Global Error */}
                    {testResults.error && (
                      <div className="er-ide-error-banner">
                        <AlertTriangle size={15} color="#ef4444" />
                        <pre className="er-ide-error-text">{testResults.error}</pre>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── TAB 3: STDOUT / LOGS ── */}
            {activeConsoleTab === 'stdout' && (
              <div className="er-ide-stdout-view">
                <pre className="er-ide-raw-stdout">
                  {testResults?.testCases
                    ?.filter(t => t.stdout)
                    ?.map((t, i) => `[Case ${i + 1}]\n${t.stdout}`)
                    ?.join('\n\n') || 'No console.log output detected.'}
                </pre>
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
              title="Run code against sample test cases (Ctrl + Enter)"
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
