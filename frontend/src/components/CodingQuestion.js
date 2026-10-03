// src/components/CodingQuestion.js — Enterprise Split-Pane Coding Assessment Environment
import React, { useState } from 'react';
import CodeEditor from './CodeEditor';
import toast from 'react-hot-toast';
import { studentAPI } from '../services/api';
import {
  FileText,
  Terminal,
  CheckCircle,
  Copy,
  Clock,
  Award,
  Shield,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Database,
  Hash
} from 'lucide-react';
import './CodingQuestion.css';

const CodingQuestion = ({ question, answer, onAnswer, sessionId, examId }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [showHints, setShowHints] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    setTestResults(null);
  };

  // Safely extract and normalize rich question data (supports object JSONB or parsed JSON string)
  let meta = {};
  if (typeof question.options === 'string') {
    try {
      const parsed = JSON.parse(question.options);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) meta = parsed;
    } catch (_) {}
  } else if (question.options && typeof question.options === 'object' && !Array.isArray(question.options)) {
    meta = question.options;
  }

  const safeParseArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch (_) {}
    }
    return [];
  };

  const title = question.title || meta.title ||
    (question.question_text ? question.question_text.split('\n')[0].replace(/^#+\s*/, '') : 'Coding Challenge');

  const problemStatement = question.problemStatement ||
    question.problem_statement ||
    meta.problemStatement ||
    meta.problem_statement ||
    question.question_text ||
    question.description ||
    meta.description ||
    'Write a function that solves the given problem.';

  const inputFormat = question.inputFormat || question.input_format || meta.inputFormat || meta.input_format || '';
  const outputFormat = question.outputFormat || question.output_format || meta.outputFormat || meta.output_format || '';

  const rawConstraints = safeParseArray(question.constraints)
    .concat(safeParseArray(meta.constraints));
  const constraints = rawConstraints.length > 0 
    ? rawConstraints 
    : (question.constraints && typeof question.constraints === 'string' ? [question.constraints] : []);

  const rawExamples = safeParseArray(question.examples)
    .concat(safeParseArray(question.sampleTestCases))
    .concat(safeParseArray(meta.examples));

  const rawTestCases = safeParseArray(question.testCases)
    .concat(safeParseArray(question.test_cases))
    .concat(safeParseArray(meta.testCases))
    .concat(safeParseArray(meta.test_cases));

  // Determine public sample test cases (prefer explicit !is_hidden, then first 1-2 cases)
  let publicCases = rawExamples.filter(tc => !tc.is_hidden && !tc.isHidden);
  if (publicCases.length === 0) {
    publicCases = rawTestCases.filter(tc => !tc.is_hidden && !tc.isHidden);
  }
  if (publicCases.length === 0) {
    const combined = rawExamples.length > 0 ? rawExamples : rawTestCases;
    if (combined.length > 0) {
      publicCases = combined.slice(0, 2);
    }
  }

  // Deduplicate cases by input
  const sampleCases = [];
  const seenInputs = new Set();
  for (const c of publicCases) {
    const key = String(c.input ?? '');
    if (!seenInputs.has(key)) {
      seenInputs.add(key);
      sampleCases.push(c);
    }
  }

  const totalTestCasesCount = question.totalTestCases ||
    question.total_test_cases ||
    meta.totalTestCases ||
    Math.max(rawTestCases.length, rawExamples.length, sampleCases.length);

  const rawHints = question.hints || meta.hints || [];
  const hints = Array.isArray(rawHints) ? rawHints : [];
  const difficulty = (question.difficulty || meta.difficulty || 'medium').toLowerCase();
  const marks = question.marks || 10;
  const timeLimit = question.time_limit || question.timeLimit || meta.timeLimit || '2.0s';

  const formatIO = (val) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') {
      try { return JSON.stringify(val, null, 2); } catch (e) { return String(val); }
    }
    return String(val);
  };

  const copyToClipboard = (text, label) => {
    try {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`, { duration: 2000 });
    } catch (e) {
      toast.error('Copy failed');
    }
  };

  const handleRunCode = async (code, language, customInput = null) => {
    setIsRunning(true);
    setTestResults(null);

    try {
      const res = await studentAPI.runCode({
        questionId: question.id,
        code,
        language,
        testCases: sampleCases,
        customInput,
        sessionId,
        examId
      });

      if (res?.data) {
        setTestResults(res.data);
      } else if (res?.success) {
        setTestResults(res);
      } else {
        setTestResults({ error: res?.message || 'Execution error' });
      }
    } catch (error) {
      console.error('Error running code:', error);
      setTestResults({ error: error?.message || 'Failed to run code. Evaluation service error.' });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async (code, language) => {
    setIsSubmitting(true);

    try {
      onAnswer(code, language || selectedLanguage);

      const res = await studentAPI.submitCode({
        questionId: question.id,
        code,
        language,
        sessionId,
        examId
      });

      if (res?.data) {
        setTestResults(res.data);
        toast.success(`Evaluated: ${res.data.passedTestCases}/${res.data.totalTestCases} test cases passed (${res.data.earnedMarks}/${res.data.maxMarks} marks)`);
      } else if (res?.success) {
        setTestResults(res);
        toast.success('Code submitted and evaluated successfully!');
      } else {
        setTestResults({ error: res?.message || 'Evaluation error' });
      }
    } catch (error) {
      console.error('Error submitting code:', error);
      toast.error('Submission evaluation error');
      setTestResults({ error: error?.message || 'Failed to submit code.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="er-coding-workspace">
      {/* ── LEFT PANE: COMPLETE PROBLEM SPECIFICATION ── */}
      <div className="er-coding-problem-pane">
        
        {/* Header */}
        <div className="er-coding-header">
          <h2 className="er-coding-title">{title}</h2>
          <div className="er-coding-meta-bar">
            <span className={`er-coding-badge ${difficulty}`}>
              {difficulty === 'easy' ? '🟢 Easy' : difficulty === 'medium' ? '🟡 Medium' : '🔴 Hard'}
            </span>
            <span className="er-coding-badge marks">
              <Award size={13} /> {marks} Marks
            </span>
            <span className="er-coding-badge time">
              <Clock size={13} /> Limit: {timeLimit}
            </span>
            {question.topic && (
              <span className="er-coding-badge topic">
                <Database size={13} /> {question.topic}
              </span>
            )}
          </div>
        </div>

        {/* Quick Jump Navigation */}
        <div className="er-coding-nav-bar">
          <button
            className={`er-coding-nav-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Details
          </button>
          <button
            className={`er-coding-nav-btn ${activeTab === 'statement' ? 'active' : ''}`}
            onClick={() => setActiveTab('statement')}
          >
            Problem
          </button>
          <button
            className={`er-coding-nav-btn ${activeTab === 'io' ? 'active' : ''}`}
            onClick={() => setActiveTab('io')}
          >
            I/O Specs
          </button>
          <button
            className={`er-coding-nav-btn ${activeTab === 'examples' ? 'active' : ''}`}
            onClick={() => setActiveTab('examples')}
          >
            Examples ({sampleCases.length})
          </button>
        </div>

        {/* 1. Problem Statement */}
        {(activeTab === 'all' || activeTab === 'statement') && (
          <div className="er-coding-section">
            <div className="er-coding-section-header">
              <FileText size={16} color="#0a74da" />
              <h4>Problem Statement</h4>
            </div>
            <div className="er-coding-body">
              {problemStatement}
            </div>
          </div>
        )}

        {/* 2. Input & Output Formats */}
        {(activeTab === 'all' || activeTab === 'io') && (
          <div className="er-coding-section">
            <div className="er-coding-section-header">
              <Terminal size={16} color="#0a74da" />
              <h4>Input & Output Specification</h4>
            </div>

            {inputFormat ? (
              <div className="er-coding-format-card">
                <div className="er-coding-format-title">
                  <span>📥 Input Format</span>
                </div>
                <div className="er-coding-format-content" style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>{inputFormat}</div>
              </div>
            ) : (
              <div className="er-coding-format-card">
                <div className="er-coding-format-title">
                  <span>📥 Input Format</span>
                </div>
                <div className="er-coding-format-content" style={{ color: '#475569', fontStyle: 'italic' }}>
                  Read problem input from standard input (stdin) according to the problem statement and sample cases.
                </div>
              </div>
            )}

            {outputFormat ? (
              <div className="er-coding-format-card" style={{ marginTop: '10px' }}>
                <div className="er-coding-format-title" style={{ color: '#10b981' }}>
                  <span>📤 Output Format</span>
                </div>
                <div className="er-coding-format-content" style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>{outputFormat}</div>
              </div>
            ) : (
              <div className="er-coding-format-card" style={{ marginTop: '10px' }}>
                <div className="er-coding-format-title" style={{ color: '#10b981' }}>
                  <span>📤 Output Format</span>
                </div>
                <div className="er-coding-format-content" style={{ color: '#475569', fontStyle: 'italic' }}>
                  Print the computed result to standard output (stdout) with required formatting.
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Constraints */}
        {(activeTab === 'all' || activeTab === 'io') && (
          <div className="er-coding-section">
            <div className="er-coding-section-header">
              <Hash size={16} color="#0a74da" />
              <h4>Constraints & Boundaries</h4>
            </div>
            <div className="er-coding-constraints-card">
              {constraints.length > 0 ? (
                <ul className="er-coding-constraints-list">
                  {constraints.map((c, i) => (
                    <li key={i} className="er-coding-constraint-item">
                      <span className="er-coding-constraint-bullet">•</span>
                      <code style={{ whiteSpace: 'pre-line' }}>{c}</code>
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ fontSize: '0.86rem', color: '#64748b', fontStyle: 'italic', padding: '6px 0' }}>
                  Standard execution limits apply: Time limit {timeLimit}, Memory limit {question.memory_limit || meta.memoryLimit || 256} MB.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. Sample Test Cases / Examples */}
        {(activeTab === 'all' || activeTab === 'examples') && (
          <div className="er-coding-section">
            <div className="er-coding-section-header">
              <CheckCircle size={16} color="#10b981" />
              <h4>Sample Test Cases & Examples</h4>
            </div>

            {sampleCases.length > 0 ? (
              <div className="er-coding-examples-list">
                {sampleCases.map((sample, idx) => {
                  const formattedInput = formatIO(sample.input);
                  const formattedOutput = formatIO(sample.output ?? sample.expected_output);

                return (
                  <div key={idx} className="er-coding-example-card">
                    <div className="er-coding-example-top">
                      <span className="er-coding-example-badge">
                        Sample Case #{idx + 1}
                      </span>
                      <button
                        onClick={() => copyToClipboard(formattedInput, `Sample ${idx + 1} Input`)}
                        className="er-coding-copy-btn"
                        title="Copy input to test in code editor"
                      >
                        <Copy size={12} /> Copy Input
                      </button>
                    </div>

                    <div className="er-coding-io-grid">
                      <div className="er-coding-io-box">
                        <span className="er-coding-io-label">Input</span>
                        <pre className="er-coding-code-block">{formattedInput || '(No input)'}</pre>
                      </div>

                      <div className="er-coding-io-box">
                        <span className="er-coding-io-label output">Expected Output</span>
                        <pre className="er-coding-code-block">{formattedOutput || '(No output)'}</pre>
                      </div>
                    </div>

                    {sample.explanation && (
                      <div className="er-coding-explanation">
                        <strong>Explanation: </strong>{sample.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            ) : (
              <div className="er-coding-example-card" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                <p style={{ margin: 0, fontSize: '0.88rem' }}>
                  Standard test cases will be validated automatically in the secure sandbox upon submitting your solution.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 5. Evaluation Sandbox Security Banner */}
        <div className="er-coding-sandbox-banner">
          <Shield size={16} />
          <span>
            {totalTestCasesCount} total test cases configured. Hidden test cases will be validated upon submission in the secure execution sandbox.
          </span>
        </div>

        {/* 6. Hints Accordion */}
        {hints.length > 0 && (
          <div className="er-coding-hints-box">
            <button
              onClick={() => setShowHints(!showHints)}
              className="er-coding-hints-toggle"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lightbulb size={16} /> Need a hint? ({hints.length} available)
              </span>
              {showHints ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showHints && (
              <div className="er-coding-hints-content">
                {hints.map((h, i) => (
                  <div key={i} className="er-coding-hint-item">
                    <span>💡</span>
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── RIGHT PANE: INTEGRATED CODE EDITOR & TEST RESULTS ── */}
      <div className="er-coding-editor-pane">
        <CodeEditor
          question={question}
          answer={answer}
          onAnswer={(c, l) => onAnswer?.(c, l || selectedLanguage)}
          language={selectedLanguage}
          onLanguageChange={handleLanguageChange}
          onRunCode={handleRunCode}
          onSubmit={handleSubmit}
          isRunning={isRunning}
          isSubmitting={isSubmitting}
          testResults={testResults}
          sampleTestCases={sampleCases}
        />
      </div>
    </div>
  );
};

export default CodingQuestion;
