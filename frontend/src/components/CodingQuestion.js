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

const CodingQuestion = ({ question, answer, onAnswer }) => {
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

  const rawConstraints = question.constraints || meta.constraints || [];
  const constraints = Array.isArray(rawConstraints)
    ? rawConstraints
    : (rawConstraints ? [rawConstraints] : []);

  let rawExamples = Array.isArray(question.examples) && question.examples.length > 0
    ? question.examples
    : (Array.isArray(meta.examples) && meta.examples.length > 0 ? meta.examples : []);

  let rawTestCases = Array.isArray(question.testCases) && question.testCases.length > 0
    ? question.testCases
    : (Array.isArray(question.test_cases) && question.test_cases.length > 0
      ? question.test_cases
      : (Array.isArray(meta.testCases) ? meta.testCases : (Array.isArray(meta.test_cases) ? meta.test_cases : [])));

  // Parse if stringified
  if (typeof rawExamples === 'string') {
    try { rawExamples = JSON.parse(rawExamples); } catch (_) { rawExamples = []; }
  }
  if (typeof rawTestCases === 'string') {
    try { rawTestCases = JSON.parse(rawTestCases); } catch (_) { rawTestCases = []; }
  }

  // Cross-pollinate so that neither is empty if at least one exists
  if ((!rawExamples || rawExamples.length === 0) && Array.isArray(rawTestCases) && rawTestCases.length > 0) {
    rawExamples = rawTestCases;
  }
  if ((!rawTestCases || rawTestCases.length === 0) && Array.isArray(rawExamples) && rawExamples.length > 0) {
    rawTestCases = rawExamples;
  }

  // Guarantee sample test cases exist from either examples or testCases
  const sampleCases = Array.isArray(rawExamples) && rawExamples.length > 0
    ? rawExamples
    : (Array.isArray(rawTestCases) && rawTestCases.length > 0 ? rawTestCases.slice(0, 3) : []);

  const totalTestCasesCount = Math.max(
    Array.isArray(rawTestCases) ? rawTestCases.length : 0,
    Array.isArray(rawExamples) ? rawExamples.length : 0
  );

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
        testCases: rawTestCases.length > 0 ? rawTestCases : sampleCases,
        customInput
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
      onAnswer(code);

      const res = await studentAPI.submitCode({
        questionId: question.id,
        code,
        language,
        testCases: rawTestCases.length > 0 ? rawTestCases : sampleCases
      });

      if (res?.data) {
        setTestResults(res.data);
        toast.success('Code submitted and evaluated successfully!');
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
        {(activeTab === 'all' || activeTab === 'io') && (inputFormat || outputFormat) && (
          <div className="er-coding-section">
            <div className="er-coding-section-header">
              <Terminal size={16} color="#0a74da" />
              <h4>Input & Output Format</h4>
            </div>

            {inputFormat && (
              <div className="er-coding-format-card">
                <div className="er-coding-format-title">
                  <span>📥 Input Format</span>
                </div>
                <div className="er-coding-format-content">{inputFormat}</div>
              </div>
            )}

            {outputFormat && (
              <div className="er-coding-format-card" style={{ marginTop: '10px' }}>
                <div className="er-coding-format-title" style={{ color: '#10b981' }}>
                  <span>📤 Output Format</span>
                </div>
                <div className="er-coding-format-content">{outputFormat}</div>
              </div>
            )}
          </div>
        )}

        {/* 3. Constraints */}
        {(activeTab === 'all' || activeTab === 'io') && constraints.length > 0 && (
          <div className="er-coding-section">
            <div className="er-coding-section-header">
              <Hash size={16} color="#0a74da" />
              <h4>Constraints & Boundaries</h4>
            </div>
            <div className="er-coding-constraints-card">
              <ul className="er-coding-constraints-list">
                {constraints.map((c, i) => (
                  <li key={i} className="er-coding-constraint-item">
                    <span className="er-coding-constraint-bullet">•</span>
                    <code>{c}</code>
                  </li>
                ))}
              </ul>
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
          onAnswer={onAnswer}
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
