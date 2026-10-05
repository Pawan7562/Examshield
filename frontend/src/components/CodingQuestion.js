// src/components/CodingQuestion.js — LeetCode-Grade Assessment Environment
import React, { useState, useEffect, useCallback } from 'react';
import CodeEditor from './CodeEditor';
import toast from 'react-hot-toast';
import { studentAPI } from '../services/api';
import { parseParameters, formatLeetCodeInput, formatLeetCodeOutput } from '../utils/codeParamParser';
import { extractQuestionMetadata } from '../utils/starterCodeGenerator';
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
  Hash,
  Cpu
} from 'lucide-react';
import './CodingQuestion.css';

const CodingQuestion = ({ question, answer, onAnswer, sessionId, examId, initialLanguage }) => {
  // Resolve optimal starting language based on question config / code template / student preference
  const resolveInitialLanguage = useCallback(() => {
    if (initialLanguage) return initialLanguage;
    if (question?.language) return question.language;

    let qMeta = {};
    try {
      qMeta = typeof question?.options === 'string' ? JSON.parse(question.options) : (question?.options || {});
    } catch (_) {}

    if (qMeta?.language) return qMeta.language;
    if (qMeta?.defaultLanguage) return qMeta.defaultLanguage;

    // Detect language from question.code_template if present
    const tpl = question?.code_template || qMeta?.code_template || '';
    if (tpl) {
      if (tpl.includes('#include') || tpl.includes('vector<') || tpl.includes('public:')) return 'cpp';
      if (tpl.includes('def ') || tpl.includes('class Solution:')) return 'python';
      if (tpl.includes('public class') || tpl.includes('System.out')) return 'java';
      if (tpl.includes('function') || tpl.includes('console.log')) return 'javascript';
    }

    if (Array.isArray(qMeta?.allowedLanguages) && qMeta.allowedLanguages.length > 0) {
      if (qMeta.allowedLanguages.includes('cpp')) return 'cpp';
      return qMeta.allowedLanguages[0];
    }

    return 'cpp';
  }, [initialLanguage, question]);

  const [selectedLanguage, setSelectedLanguage] = useState(resolveInitialLanguage);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [showHints, setShowHints] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    setSelectedLanguage(resolveInitialLanguage());
    setTestResults(null);
  }, [question?.id, resolveInitialLanguage]);

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    setTestResults(null);
  };

  // Safely extract and normalize rich question data
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

  // 1. Title Extraction: Concise LeetCode-style title
  let title = question.title || meta.title || '';
  const questionText = question.question_text || question.problemStatement || meta.problemStatement || '';

  if (!title && questionText) {
    const firstLine = questionText.split('\n')[0].replace(/^#+\s*/, '').replace(/^[Q0-9:.-]+\s*/, '').trim();
    if (firstLine.length > 50) {
      if (/two\s*sum|indices of two|sum.*target|pair.*sum/i.test(questionText)) {
        title = 'Two Sum';
      } else if (/largest|max/i.test(questionText) && /element|array/i.test(questionText)) {
        title = 'Find Largest Element';
      } else if (/palindrome/i.test(questionText)) {
        title = 'Valid Palindrome';
      } else if (/parenthes/i.test(questionText)) {
        title = 'Valid Parentheses';
      } else if (/binary\s*search/i.test(questionText)) {
        title = 'Binary Search';
      } else {
        const periodIdx = firstLine.indexOf('.');
        title = periodIdx > 10 && periodIdx < 45 ? firstLine.slice(0, periodIdx).trim() : (meta.functionName || 'Coding Challenge');
      }
    } else {
      title = firstLine;
    }
  }
  if (!title) title = meta.functionName || 'Coding Challenge';

  // 2. Problem Statement
  const problemStatement = question.problemStatement ||
    question.problem_statement ||
    meta.problemStatement ||
    meta.problem_statement ||
    question.question_text ||
    question.description ||
    meta.description ||
    'You are given an array of integers nums and an integer target. Find the indices of two different elements whose sum is equal to target.\nYou can assume that exactly one valid pair exists.';

  const inputFormat = question.inputFormat || question.input_format || meta.inputFormat || meta.input_format || '';
  const outputFormat = question.outputFormat || question.output_format || meta.outputFormat || meta.output_format || '';

  // 3. Constraints
  let rawConstraints = safeParseArray(question.constraints)
    .concat(safeParseArray(meta.constraints));
  if (rawConstraints.length === 0 && question.constraints && typeof question.constraints === 'string') {
    rawConstraints = [question.constraints];
  }
  const constraints = [];
  rawConstraints.forEach(c => {
    if (typeof c === 'string' && c.includes('\n')) {
      c.split('\n').map(s => s.trim()).filter(Boolean).forEach(s => constraints.push(s));
    } else if (c) {
      constraints.push(String(c).trim());
    }
  });
  if (constraints.length === 0) {
    constraints.push('2 ≤ nums.length ≤ 10⁴');
    constraints.push('-10⁹ ≤ nums[i] ≤ 10⁹');
    constraints.push('-10⁹ ≤ target ≤ 10⁹');
    constraints.push('Only one valid answer exists.');
  }

  // 4. Complexity
  const difficulty = (question.difficulty || meta.difficulty || 'medium').toLowerCase();
  const timeComplexity = question.timeComplexity || meta.timeComplexity ||
    (difficulty === 'easy' ? 'O(n)' : difficulty === 'hard' ? 'O(n log n)' : 'O(n)');
  const spaceComplexity = question.spaceComplexity || meta.spaceComplexity ||
    (difficulty === 'easy' ? 'O(1)' : 'O(n)');

  // 5. Test Cases & Examples
  const rawExamples = safeParseArray(question.examples)
    .concat(safeParseArray(question.sampleTestCases))
    .concat(safeParseArray(meta.examples));

  const rawTestCases = safeParseArray(question.testCases)
    .concat(safeParseArray(question.test_cases))
    .concat(safeParseArray(meta.testCases))
    .concat(safeParseArray(meta.test_cases));

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
  let sampleCases = [];
  const seenInputs = new Set();
  for (const c of publicCases) {
    const key = String(c.input ?? '');
    if (!seenInputs.has(key)) {
      seenInputs.add(key);
      sampleCases.push(c);
    }
  }

  // Guarantee at least 2 clean sample cases for a complete LeetCode experience
  if (sampleCases.length === 0) {
    if (meta.functionName === 'findMax' || /largest|max/i.test(questionText)) {
      sampleCases = [
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
    } else if (meta.functionName === 'twoSum' || /two\s*sum|indices of two|sum.*target/i.test(questionText)) {
      sampleCases = [
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
    } else {
      sampleCases = [
        {
          input: 'nums = [1, 2, 3]',
          output: '3',
          explanation: 'Sample test case.'
        }
      ];
    }
  }

  const totalTestCasesCount = question.totalTestCases ||
    question.total_test_cases ||
    meta.totalTestCases ||
    Math.max(rawTestCases.length, rawExamples.length, sampleCases.length, 3);

  const rawHints = question.hints || meta.hints || [];
  const hints = Array.isArray(rawHints) ? rawHints : [];
  const marks = question.marks || 10;
  const timeLimit = question.time_limit || question.timeLimit || meta.timeLimit || '2.0s';

  const copyToClipboard = (text, label) => {
    try {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copied!`, { duration: 2000 });
    } catch (e) {
      toast.error('Copy failed');
    }
  };

  const handleRunCode = async (code, language, customInput = null, customCases = null) => {
    setIsRunning(true);
    setTestResults(null);

    try {
      const res = await studentAPI.runCode({
        questionId: question.id,
        code,
        language,
        testCases: (customCases && customCases.length > 0) ? customCases : sampleCases,
        customInput: customInput || undefined,
        questionMetadata: extractQuestionMetadata(question),
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
        questionMetadata: extractQuestionMetadata(question),
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
      {/* ── LEFT PANE: COMPLETE LEETCODE PROBLEM SPECIFICATION ── */}
      <div className="er-coding-problem-pane">
        
        {/* Header */}
        <div className="er-coding-header">
          <div className="er-coding-title-row">
            <h1 className="er-coding-title">{title}</h1>
          </div>
          <div className="er-coding-meta-bar">
            <span className={`er-coding-badge ${difficulty}`}>
              {difficulty === 'easy' ? 'Easy' : difficulty === 'medium' ? 'Medium' : 'Hard'}
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

        {/* Quick Navigation Anchor Bar */}
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
            className={`er-coding-nav-btn ${activeTab === 'examples' ? 'active' : ''}`}
            onClick={() => setActiveTab('examples')}
          >
            Examples ({sampleCases.length})
          </button>
          <button
            className={`er-coding-nav-btn ${activeTab === 'constraints' ? 'active' : ''}`}
            onClick={() => setActiveTab('constraints')}
          >
            Constraints
          </button>
          <button
            className={`er-coding-nav-btn ${activeTab === 'complexity' ? 'active' : ''}`}
            onClick={() => setActiveTab('complexity')}
          >
            Complexity
          </button>
        </div>

        {/* 1. Problem Statement */}
        {(activeTab === 'all' || activeTab === 'statement') && (
          <div className="er-coding-section">
            <div className="er-coding-section-header">
              <FileText size={16} color="#0a74da" />
              <h4>Description</h4>
            </div>
            <div className="er-coding-body">
              {problemStatement.split('\n').map((paragraph, pIdx) => (
                <p key={pIdx} className="er-coding-para">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* 2. Sample Test Cases / Examples */}
        {(activeTab === 'all' || activeTab === 'examples') && (
          <div className="er-coding-section">
            <div className="er-coding-section-header">
              <CheckCircle size={16} color="#10b981" />
              <h4>Examples</h4>
            </div>

            <div className="er-coding-examples-list">
              {sampleCases.map((sample, idx) => {
                const knownParams = question?.options?.parameters || question?.parameters || [];
                const parsedParams = parseParameters(sample.input, problemStatement, knownParams);
                const formattedInput = parsedParams.length > 0
                  ? formatLeetCodeInput(parsedParams)
                  : String(sample.input || '');
                const formattedOutput = formatLeetCodeOutput(sample.output ?? sample.expected_output);

                return (
                  <div key={idx} className="er-coding-example-card">
                    <div className="er-coding-example-top">
                      <span className="er-coding-example-title">Example {idx + 1}:</span>
                      <button
                        onClick={() => copyToClipboard(formattedInput, `Example ${idx + 1} Input`)}
                        className="er-coding-copy-btn"
                        title="Copy input"
                      >
                        <Copy size={12} /> Copy
                      </button>
                    </div>

                    <div className="er-coding-example-body">
                      {/* LeetCode standard Input display */}
                      <div className="er-coding-example-line">
                        <strong className="er-coding-example-label">Input:</strong>{' '}
                        {parsedParams.length > 0 ? (
                          <span className="er-coding-example-val">
                            {parsedParams.map((p, pIdx) => (
                              <span key={pIdx} className="er-coding-param-item">
                                <span className="param-k">{p.name}</span> = <code className="param-v">{p.value}</code>
                                {pIdx < parsedParams.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </span>
                        ) : (
                          <code className="er-coding-example-val">{formattedInput || '(none)'}</code>
                        )}
                      </div>

                      {/* Output line */}
                      <div className="er-coding-example-line">
                        <strong className="er-coding-example-label">Output:</strong>{' '}
                        <code className="er-coding-example-val output">{formattedOutput || '(none)'}</code>
                      </div>

                      {/* Explanation */}
                      {sample.explanation && (
                        <div className="er-coding-example-line explanation">
                          <strong className="er-coding-example-label">Explanation:</strong>{' '}
                          <span className="er-coding-explanation-text">{sample.explanation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Constraints & Boundaries */}
        {(activeTab === 'all' || activeTab === 'constraints') && (
          <div className="er-coding-section">
            <div className="er-coding-section-header">
              <Hash size={16} color="#0a74da" />
              <h4>Constraints</h4>
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

        {/* 4. Complexity Analysis (LeetCode Interview Standard) */}
        {(activeTab === 'all' || activeTab === 'complexity') && (
          <div className="er-coding-section">
            <div className="er-coding-section-header">
              <Cpu size={16} color="#0a74da" />
              <h4>Complexity</h4>
            </div>
            <div className="er-coding-complexity-card">
              <div className="er-coding-complexity-row">
                <span className="er-coding-complexity-label">Time Complexity:</span>
                <code className="er-coding-complexity-val time">{timeComplexity}</code>
              </div>
              <div className="er-coding-complexity-row">
                <span className="er-coding-complexity-label">Space Complexity:</span>
                <code className="er-coding-complexity-val space">{spaceComplexity}</code>
              </div>
            </div>
          </div>
        )}

        {/* 5. Input & Output Formats (if present) */}
        {activeTab === 'all' && (inputFormat || outputFormat) && (
          <div className="er-coding-section">
            <div className="er-coding-section-header">
              <Terminal size={16} color="#0a74da" />
              <h4>I/O Specification</h4>
            </div>

            {inputFormat && (
              <div className="er-coding-format-card">
                <div className="er-coding-format-title">📥 Input Format</div>
                <div className="er-coding-format-content" style={{ whiteSpace: 'pre-line' }}>{inputFormat}</div>
              </div>
            )}

            {outputFormat && (
              <div className="er-coding-format-card" style={{ marginTop: '8px' }}>
                <div className="er-coding-format-title" style={{ color: '#10b981' }}>📤 Output Format</div>
                <div className="er-coding-format-content" style={{ whiteSpace: 'pre-line' }}>{outputFormat}</div>
              </div>
            )}
          </div>
        )}

        {/* 6. Evaluation Sandbox Banner */}
        <div className="er-coding-sandbox-banner">
          <Shield size={16} />
          <span>
            {totalTestCasesCount} total test cases configured. Hidden test cases will be validated upon submission in the secure execution sandbox.
          </span>
        </div>

        {/* 7. Hints Accordion */}
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

      {/* ── RIGHT PANE: LEETCODE-STYLE IDE & TESTCASE/OUTPUT DRAWER ── */}
      <div className="er-coding-editor-pane">
        <CodeEditor
          key={question?.id}
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
          problemStatement={problemStatement}
        />
      </div>
    </div>
  );
};

export default CodingQuestion;
