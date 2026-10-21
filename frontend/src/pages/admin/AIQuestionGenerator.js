// src/pages/admin/AIQuestionGenerator.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import MarkdownRenderer from '../../components/common/MarkdownRenderer';
import toast from 'react-hot-toast';
import { toISTISOString } from '../../utils/timezone';
import {
  Brain, Activity, Sparkles, Layers, Zap,
  BookOpen, FileText, FolderOpen, Clock, Award,
  Calendar, Shield, Users, Database, Cpu,
  Globe, Target, Search, BarChart3, CheckCircle,
  HelpCircle, RefreshCw, Code, Save, Download,
  Plus, Eye, Upload, Trash2, AlertCircle,
  ChevronDown, ChevronUp, X, Terminal, Lightbulb,
} from 'lucide-react';
import '../../components/admin/AdminSidebar.css';
import './AIQuestionGenerator.css';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const SOURCES = [
  { id: 'leetcode',      name: 'LeetCode',      icon: Database, color: '#ffa116', description: 'Interview-style function-signature problems' },
  { id: 'codeforces',   name: 'Codeforces',    icon: Cpu,      color: '#1f8e3f', description: 'Competitive programming with strict I/O'       },
  { id: 'geeksforgeeks',name: 'GeeksforGeeks', icon: Globe,    color: '#2f8d46', description: 'Educational problems with background theory'   },
  { id: 'hackerrank',   name: 'HackerRank',    icon: Target,   color: '#00a86b', description: 'Assessment-style challenges with scoring'      },
];

const DIFFICULTIES = [
  { value: 'easy',   label: 'Easy',   color: '#22c55e', icon: '🟢', description: 'Single DS/algorithm, O(n)' },
  { value: 'medium', label: 'Medium', color: '#f59e0b', icon: '🟡', description: '2–3 combined techniques'  },
  { value: 'hard',   label: 'Hard',   color: '#ef4444', icon: '🔴', description: 'Advanced algorithms'      },
];

const SUGGESTED_TOPICS = [
  'Arrays', 'Linked Lists', 'Binary Trees', 'Dynamic Programming',
  'Graphs', 'Sliding Window', 'Two Pointers', 'Recursion',
  'Hashing', 'Sorting', 'Heaps', 'Tries', 'String Manipulation', 'Greedy',
];

const getDifficultyColor = (d) => DIFFICULTIES.find(x => x.value === d)?.color ?? '#64748b';

// ─────────────────────────────────────────────────────────────────────────────
// Platform Badge
// ─────────────────────────────────────────────────────────────────────────────
const PlatformBadge = ({ sourceId }) => {
  const src = SOURCES.find(s => s.id === sourceId) || { name: sourceId, icon: Code, color: '#64748b' };
  const Icon = src.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600,
      background: `${src.color}18`, border: `1px solid ${src.color}35`, color: src.color,
    }}>
      <Icon size={11} /> {src.name}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Question Card
// ─────────────────────────────────────────────────────────────────────────────
const QuestionCard = ({ question, selected, onToggle, onPreview, mode }) => {
  const diffColor = getDifficultyColor(question.difficulty);
  const src = SOURCES.find(s => s.id === question.platform);

  return (
    <div
      className={`admin-ai-question-card ${selected ? 'is-selected' : ''}`}
      style={{
        borderLeftColor: src?.color ?? '#0a74da',
      }}
    >
      {/* Header row */}
      <div className="admin-ai-question-header">
        <div className="admin-ai-question-meta">
          {mode === 'partial' && (
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggle}
              className="admin-ai-question-checkbox"
            />
          )}
          <div className="admin-ai-question-info">
            <div className="admin-ai-question-title-row">
              <span className="admin-ai-question-title">
                {question.isFallback && (
                  <span className="admin-ai-template-badge">
                    Template Blueprint
                  </span>
                )}
                {question.title}
              </span>
            </div>

            <div className="admin-ai-question-badges">
              <span
                className="admin-ai-difficulty-badge"
                style={{ backgroundColor: diffColor + '18', color: diffColor, border: `1px solid ${diffColor}40` }}
              >
                {DIFFICULTIES.find(d => d.value === question.difficulty)?.icon} {question.difficulty}
              </span>
              <PlatformBadge sourceId={question.platform} />
              {Array.from(new Set(question.tags || [])).slice(0, 4).map((tag, idx) => (
                <span key={`${tag}-${idx}`} className="admin-ai-tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-ai-question-actions-right">
          <button onClick={onPreview} className="admin-ai-preview-btn">
            <Eye size={14} /> View Problem
          </button>
        </div>
      </div>

      {/* Brief description */}
      <div className="admin-ai-question-content">
        <MarkdownRenderer question={question} compact />

        <div className="admin-ai-question-chips">
          <span className="admin-ai-chip">
            <Terminal size={12} /> Time: <code>{question.timeComplexity || 'O(n)'}</code>
          </span>
          <span className="admin-ai-chip">
            <Activity size={12} /> Space: <code>{question.spaceComplexity || 'O(1)'}</code>
          </span>
          {Array.isArray(question.testCases) && question.testCases.length > 0 && (
            <span className="admin-ai-chip success">
              <CheckCircle size={12} /> {question.testCases.length} test cases
            </span>
          )}
          {question.aiGenerated ? (
            <span className="admin-ai-chip ai">
              <Brain size={12} /> AI Synthesized
            </span>
          ) : (
            <span className="admin-ai-chip template">
              <Sparkles size={12} /> Standard Blueprint
            </span>
          )}
          <span className="admin-ai-chip marks">
            <Award size={12} /> {question.marks || 10} Pts
          </span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Preview Modal
// ─────────────────────────────────────────────────────────────────────────────
const PreviewModal = ({ question, onClose, showFull }) => {
  const [activeTab, setActiveTab] = useState('problem');
  if (!question) return null;

  const tabs = [
    { id: 'problem',   label: 'Problem Statement', icon: FileText  },
    { id: 'hints',     label: 'Hints & Clues',     icon: Lightbulb },
    { id: 'approach',  label: 'Solution Approach', icon: Target    },
    ...(showFull && question.editorial  ? [{ id: 'editorial', label: 'Editorial Theory', icon: BookOpen }] : []),
    ...(showFull && question.solutionCode ? [{ id: 'code',   label: 'Python Reference',  icon: Code    }] : []),
  ];

  const diffColor = getDifficultyColor(question.difficulty);

  return (
    <div
      className="admin-ai-preview-modal-premium"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="premium-modal-content">
        {/* Modal Header */}
        <div className="premium-modal-header">
          <div className="premium-header-title">
            <h3>{question.title}</h3>
            <div className="premium-header-badges">
              <span
                className="premium-badge"
                style={{
                  background: `${diffColor}18`, color: diffColor, border: `1px solid ${diffColor}40`,
                }}
              >
                {DIFFICULTIES.find(d => d.value === question.difficulty)?.icon} {question.difficulty}
              </span>
              <PlatformBadge sourceId={question.platform} />
              {question.isFallback && (
                <span className="premium-template-tag">
                  Blueprint Template
                </span>
              )}
              {Array.from(new Set(question.tags || [])).slice(0, 4).map((t, idx) => (
                <span key={`${t}-${idx}`} className="premium-tag">{t}</span>
              ))}
            </div>

            {/* Complexity row */}
            <div className="premium-complexity-row">
              <span>
                ⏱ Time: <code>{question.timeComplexity || 'O(n)'}</code>
              </span>
              <span>
                💾 Space: <code>{question.spaceComplexity || 'O(1)'}</code>
              </span>
              <span>
                🏆 Marks: <code>{question.marks || 10} Pts</code>
              </span>
            </div>
          </div>
          <button onClick={onClose} className="premium-modal-close" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="admin-ai-modal-tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`admin-ai-modal-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable body */}
        <div className="premium-modal-scroll-area">
          {activeTab === 'problem' && (
            <MarkdownRenderer
              question={question}
              compact={false}
              showHints={false}
              showApproach={false}
            />
          )}
          {activeTab === 'hints' && (
            <MarkdownRenderer
              question={question}
              compact={false}
              showHints={true}
              showApproach={false}
              // Only show hints section — override by rendering a wrapper
            />
          )}
          {activeTab === 'approach' && (
            <MarkdownRenderer
              question={question}
              compact={false}
              showHints={false}
              showApproach={true}
            />
          )}
          {activeTab === 'editorial' && (
            <MarkdownRenderer
              question={question}
              compact={false}
              showHints={false}
              showApproach={false}
              showEditorial={true}
            />
          )}
          {activeTab === 'code' && (
            <MarkdownRenderer
              question={question}
              compact={false}
              showHints={false}
              showApproach={false}
              showSolutionCode={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────
const AIQuestionGenerator = () => {
  // Config state
  const [mode, setMode]                     = useState('partial');
  const [topic, setTopic]                   = useState('');
  const [difficulty, setDifficulty]         = useState('medium');
  const [questionCount, setQuestionCount]   = useState(5);
  const [selectedSources, setSelectedSources] = useState(['leetcode', 'codeforces']);

  // UI state
  const [isGenerating, setIsGenerating]     = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions]   = useState([]);
  const [searchTerm, setSearchTerm]         = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterSource, setFilterSource]     = useState('all');
  const [showPreview, setShowPreview]       = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [generationStats, setGenerationStats] = useState(null);
  const [savedCollections, setSavedCollections] = useState([]);
  const [showSaveModal, setShowSaveModal]   = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [expandedConfig, setExpandedConfig] = useState(true);

  // API key status
  const [apiStatus, setApiStatus]           = useState(null); // { configured, message }

  // Full mode: exam creation
  const [examConfig, setExamConfig] = useState({
    name: '', subject: '', dateTime: '', duration: 60,
    passingMarks: 40, totalMarks: 100, isProctored: true,
    maxViolations: 3, instructions: '',
  });
  const [allStudents, setAllStudents]       = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isCreatingExam, setIsCreatingExam] = useState(false);

  const currentGenerationRef = useRef(null);
  const navigate = useNavigate();

  // ── On mount: load students + check AI status ────────────────────────────
  useEffect(() => {
    // axios interceptor returns response.data, so `res` IS the JSON body
    adminAPI.getStudents({ limit: 'all' })
      .then(res => setAllStudents(res?.data?.students || res?.students || []))
      .catch(() => {});

    // Use adminAPI so auth token is attached automatically
    adminAPI.getAIStatus()
      .then(res => { if (res?.data) setApiStatus(res.data); })
      .catch(() => {});
  }, []);

  // ── Source toggle ─────────────────────────────────────────────────────────
  const toggleSource = useCallback((id) => {
    setSelectedSources(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }, []);

  // ── Question generation ───────────────────────────────────────────────────
  const generateQuestions = async () => {
    if (!topic.trim())         { toast.error('Please enter a topic'); return; }
    if (!selectedSources.length) { toast.error('Please select at least one source'); return; }

    const generationId = Date.now().toString();
    currentGenerationRef.current = generationId;
    setIsGenerating(true);
    setGeneratedQuestions([]);
    setSelectedQuestions([]);
    setGenerationStats(null);

    const toastId = toast.loading(`🤖 Generating ${questionCount} ${difficulty} questions on "${topic}"…`, { duration: 120000 });

    try {
      const response = await adminAPI.generateAIQuestions({
        topic: topic.trim(),
        difficulty,
        sources: selectedSources,
        count: parseInt(questionCount),
        mode,
      });

      if (currentGenerationRef.current !== generationId) return;

      // NOTE: axios interceptor already returns response.data, so `response`
      // IS the parsed JSON body: { success, data: { questions, meta }, apiStatus }
      const rd = response;
      if (!rd?.success || !Array.isArray(rd?.data?.questions)) {
        throw new Error(rd?.message || 'Invalid response from server');
      }

      const qs = rd.data.questions.map(q => {
        const title = q.title || '';
        const problemStatement = q.problemStatement || q.description || '';
        return {
          ...q,
          type: 'coding',
          title,
          problemStatement,
          questionText: q.questionText || (title ? `${title}\n\n${problemStatement}` : problemStatement),
          platform: q.platform || 'leetcode',
          marks: q.marks || (q.difficulty === 'easy' ? 5 : q.difficulty === 'medium' ? 10 : 15),
        };
      });

      const meta = rd.data.meta || {};
      setGeneratedQuestions(qs);
      setGenerationStats({
        total: meta.generated || qs.length,
        aiGenerated: meta.aiGenerated || 0,
        fallbacks: meta.fallbacks || 0,
        bySource: qs.reduce((acc, q) => { acc[q.platform] = (acc[q.platform] || 0) + 1; return acc; }, {}),
        byDifficulty: qs.reduce((acc, q) => { acc[q.difficulty] = (acc[q.difficulty] || 0) + 1; return acc; }, {}),
      });

      if (rd.data.apiStatus) {
        setApiStatus(prev => ({ ...prev, ...rd.data.apiStatus }));
      }

      if (mode === 'full') setSelectedQuestions(qs);

      toast.dismiss(toastId);
      if (meta.fallbacks > 0 && meta.aiGenerated === 0) {
        toast('📋 Generated using built-in templates (add a Gemini API key for AI generation)', {
          icon: 'ℹ️', duration: 6000,
        });
      } else if (meta.fallbacks > 0) {
        toast.success(`✅ ${meta.aiGenerated} AI-generated + ${meta.fallbacks} template questions`);
      } else {
        toast.success(`✅ ${qs.length} questions fully generated by AI!`);
      }

      setExpandedConfig(false);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err?.message || 'Generation failed. Please try again.');
      console.error('Generation failed:', err);
    } finally {
      if (currentGenerationRef.current === generationId) setIsGenerating(false);
    }
  };

  // ── Question selection ────────────────────────────────────────────────────
  const toggleQuestion = id => {
    setSelectedQuestions(prev =>
      prev.some(q => q.id === id)
        ? prev.filter(q => q.id !== id)
        : [...prev, generatedQuestions.find(q => q.id === id)]
    );
  };

  const filteredQuestions = generatedQuestions.filter(q => {
    const matchSearch = !searchTerm ||
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.problemStatement || q.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchDiff   = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    const matchSrc    = filterSource === 'all' || q.platform === filterSource;
    return matchSearch && matchDiff && matchSrc;
  });

  // ── Save collection ───────────────────────────────────────────────────────
  const saveToCollection = () => {
    if (!collectionName.trim())    { toast.error('Enter a collection name'); return; }
    if (!selectedQuestions.length) { toast.error('Select at least one question'); return; }
    setSavedCollections(prev => [...prev, {
      id: Date.now().toString(),
      name: collectionName,
      questions: selectedQuestions,
      createdAt: new Date().toISOString(),
      stats: { total: selectedQuestions.length },
    }]);
    setShowSaveModal(false);
    setCollectionName('');
    toast.success(`Collection "${collectionName}" saved!`);
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const exportQuestions = () => {
    if (!selectedQuestions.length) { toast.error('Select questions to export'); return; }
    const blob = new Blob([JSON.stringify({ questions: selectedQuestions, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `ai-questions-${Date.now()}.json`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success('Questions exported!');
  };

  // ── Use in Exam navigation ────────────────────────────────────────────────
  const handleUseInExam = () => {
    if (!selectedQuestions.length) return;
    const cleanQuestions = selectedQuestions.map(q => {
      const { source, ...rest } = q;
      const title = rest.title || '';
      const problemStatement = rest.problemStatement || rest.description || '';
      return {
        ...rest,
        type: 'coding',
        title,
        problemStatement,
        questionText: rest.questionText || (title ? `${title}\n\n${problemStatement}` : problemStatement),
        platform: rest.platform || 'leetcode',
        marks: rest.marks || (rest.difficulty === 'easy' ? 5 : rest.difficulty === 'medium' ? 10 : 15),
      };
    });
    // Store in sessionStorage to completely avoid any History pushState Symbol cloning errors
    try {
      const serializableQuestions = JSON.parse(JSON.stringify(cleanQuestions));
      sessionStorage.setItem('ai_generated_exam_questions', JSON.stringify(serializableQuestions));
    } catch (err) {
      console.warn('SessionStorage questions storage warning:', err);
    }
    navigate('/admin/exams/create');
  };

  // ── Exam creation ─────────────────────────────────────────────────────────
  const createExamWithQuestions = async () => {
    if (!examConfig.name || !examConfig.dateTime) { toast.error('Complete exam configuration'); return; }
    if (!selectedStudents.length)                 { toast.error('Select at least one student'); return; }
    if (!selectedQuestions.length)                { toast.error('Select at least one question'); return; }
    setIsCreatingExam(true);
    try {
      const totalMarks = selectedQuestions.reduce((s, q) => s + (q.marks || 10), 0);
      const res = await adminAPI.createExam({
        ...examConfig,
        dateTime: toISTISOString(examConfig.dateTime),
        type: 'coding',
        totalMarks,
        duration: parseInt(examConfig.duration),
        passingMarks: parseInt(examConfig.passingMarks),
        questions: selectedQuestions.map(q => ({
          ...q,
          type: 'coding',
        })),
        studentIds: selectedStudents,
        questionRandomization: true,
        aiGenerated: true,
        createdAt: new Date().toISOString(),
      });
      toast.success(`Exam "${examConfig.name}" created with ${selectedQuestions.length} questions!`);
      setTimeout(() => navigate('/admin/exams', { state: { examCreated: true, examId: res?.data?.id } }), 2000);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Exam creation failed');
    } finally {
      setIsCreatingExam(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="admin-pages-container">
      <div className="admin-ai-generator-page">

        {/* ── API Key Banner ────────────────────────────────────────────────── */}
        {apiStatus && !apiStatus.configured && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '12px',
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '12px', padding: '14px 18px', marginBottom: '20px',
          }}>
            <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, color: '#fde68a', fontSize: '0.9rem', marginBottom: '4px' }}>
                Gemini API key not configured
              </div>
              <div style={{ color: '#92400e', fontSize: '0.82rem', lineHeight: '1.5' }}>
                Questions will use high-quality built-in templates. To enable full AI generation:
              </div>
              <ol style={{ margin: '8px 0 0', paddingLeft: '18px', color: '#92400e', fontSize: '0.82rem', lineHeight: '1.8' }}>
                <li>Get a free API key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#fbbf24', textDecoration: 'underline' }}>aistudio.google.com</a></li>
                <li>Open <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: '4px' }}>backend/.env</code> and set <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: '4px' }}>GEMINI_API_KEY=your_actual_key</code></li>
                <li>Restart the backend server</li>
              </ol>
            </div>
          </div>
        )}

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="admin-page-header">
          <div className="admin-header-content">
            <h1 className="admin-page-title">
              <Brain size={32} /> AI Question Generator
            </h1>
            <p className="admin-page-subtitle">
              Generate complete, professional coding problems with full descriptions, I/O format, constraints, examples & test cases
            </p>
          </div>
          <div className="admin-header-actions">
            <button className="admin-btn admin-btn-secondary" onClick={() => navigate('/admin/exams')}>
              <FileText size={16} /> Exam Management
            </button>
          </div>
        </div>

        {/* ── Mode Selector ─────────────────────────────────────────────────── */}
        <div className="admin-ai-mode-selector">
          <h3 className="admin-ai-title">
            <Sparkles size={22} /> Generation Mode
          </h3>
          <div className="admin-ai-modes">
            {[
              { id: 'partial', icon: Layers, name: 'Partial AI Mode', desc: 'Review & select questions before adding to an exam' },
              { id: 'full',    icon: Zap,    name: 'Full AI Mode',    desc: 'Generate questions and auto-create an exam' },
            ].map(({ id, icon: Icon, name, desc }) => (
              <button
                key={id}
                className={`admin-ai-mode-btn ${mode === id ? 'active' : ''}`}
                onClick={() => setMode(id)}
              >
                <Icon size={20} />
                <div>
                  <div className="admin-ai-mode-name">{name}</div>
                  <div className="admin-ai-mode-desc">{desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Config Panel ──────────────────────────────────────────────────── */}
        <div className="admin-ai-config">
          {/* Collapsible header when results are shown */}
          {generatedQuestions.length > 0 && (
            <button
              onClick={() => setExpandedConfig(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer',
                fontSize: '0.9rem', fontWeight: 600, padding: '0 0 12px',
              }}
            >
              {expandedConfig ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {expandedConfig ? 'Hide configuration' : 'Modify configuration'}
            </button>
          )}

          {expandedConfig && (
            <>
              {/* Topic + Difficulty + Count */}
              <div className="admin-ai-config-grid">
                <div className="admin-ai-config-item" style={{ gridColumn: 'span 2' }}>
                  <label className="admin-ai-config-label"><Search size={15} /> Topic / Keywords</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && generateQuestions()}
                    placeholder="e.g., dynamic programming, binary trees, sliding window…"
                    className="admin-ai-input"
                  />
                  {/* Suggested topics */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {SUGGESTED_TOPICS.map(t => (
                      <button
                        key={t}
                        onClick={() => setTopic(t)}
                        style={{
                          padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem',
                          background: topic === t ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${topic === t ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
                          color: topic === t ? '#a78bfa' : '#64748b',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-ai-config-item">
                  <label className="admin-ai-config-label"><Target size={15} /> Difficulty</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {DIFFICULTIES.map(d => (
                      <button
                        key={d.value}
                        onClick={() => setDifficulty(d.value)}
                        style={{
                          flex: 1, padding: '8px 4px', borderRadius: '8px', cursor: 'pointer',
                          background: difficulty === d.value ? `${d.color}20` : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${difficulty === d.value ? d.color + '60' : 'rgba(255,255,255,0.08)'}`,
                          color: difficulty === d.value ? d.color : '#64748b',
                          fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        }}
                      >
                        <span style={{ fontSize: '1.1rem' }}>{d.icon}</span>
                        {d.label}
                        <span style={{ fontSize: '0.65rem', opacity: 0.7, textAlign: 'center' }}>{d.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-ai-config-item">
                  <label className="admin-ai-config-label"><BarChart3 size={15} /> Number of Questions (1–20)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="range" min="1" max="20" value={questionCount}
                      onChange={e => setQuestionCount(parseInt(e.target.value))}
                      style={{ flex: 1, accentColor: '#a78bfa' }}
                    />
                    <span style={{
                      minWidth: '36px', textAlign: 'center', fontWeight: 700,
                      color: '#a78bfa', fontSize: '1.1rem',
                    }}>{questionCount}</span>
                  </div>
                </div>
              </div>

              {/* Source Selection */}
              <div className="admin-ai-sources">
                <label className="admin-ai-sources-label">
                  <Database size={15} /> Select Source Styles
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400, marginLeft: '6px' }}>
                    (questions are AI-generated in the style of each platform)
                  </span>
                </label>
                <div className="admin-ai-sources-grid">
                  {SOURCES.map(source => {
                    const selected = selectedSources.includes(source.id);
                    const Icon = source.icon;
                    return (
                      <button
                        key={source.id}
                        className={`admin-ai-source-btn ${selected ? 'selected' : ''}`}
                        onClick={() => toggleSource(source.id)}
                        style={{ borderColor: selected ? source.color + '60' : undefined }}
                      >
                        <Icon size={20} color={source.color} />
                        <div>
                          <span style={{ fontWeight: 700, color: selected ? source.color : undefined }}>
                            {source.name}
                          </span>
                          <small style={{ display: 'block', color: '#64748b', fontSize: '0.72rem', marginTop: '2px' }}>
                            {source.description}
                          </small>
                        </div>
                        {selected && <CheckCircle size={16} color={source.color} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Full Mode: Exam Config */}
              {mode === 'full' && (
                <div className="admin-ai-exam-config">
                  <h3 className="admin-ai-exam-config-title"><Calendar size={20} /> Exam Configuration</h3>
                  <div className="admin-ai-exam-config-grid">
                    {[
                      { field: 'name',         label: 'Exam Name',         Icon: FileText,  type: 'text',           placeholder: 'e.g., Data Structures Midterm'  },
                      { field: 'subject',      label: 'Subject',           Icon: BookOpen,  type: 'text',           placeholder: 'e.g., Computer Science'         },
                      { field: 'dateTime',     label: 'Date & Time',       Icon: Clock,     type: 'datetime-local', placeholder: ''                               },
                      { field: 'duration',     label: 'Duration (min)',     Icon: Clock,     type: 'number',         placeholder: '60'                             },
                      { field: 'passingMarks', label: 'Passing Marks',     Icon: Award,     type: 'number',         placeholder: '40'                             },
                    ].map(({ field, label, Icon, type, placeholder }) => (
                      <div key={field} className="admin-ai-exam-config-item">
                        <label className="admin-ai-exam-config-label"><Icon size={14} /> {label}</label>
                        <input
                          type={type}
                          value={examConfig[field]}
                          onChange={e => setExamConfig(p => ({ ...p, [field]: e.target.value }))}
                          placeholder={placeholder}
                          className="admin-ai-exam-input"
                          min={type === 'number' ? '0' : undefined}
                        />
                      </div>
                    ))}

                    <div className="admin-ai-exam-config-item">
                      <label className="admin-ai-exam-config-label"><Shield size={14} /> Proctoring</label>
                      <select
                        value={examConfig.isProctored ? 'enabled' : 'disabled'}
                        onChange={e => setExamConfig(p => ({ ...p, isProctored: e.target.value === 'enabled' }))}
                        className="admin-ai-exam-select"
                      >
                        <option value="enabled">Enabled</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </div>
                  </div>

                  {/* Student selection */}
                  <div className="admin-ai-student-selection">
                    <div className="admin-ai-student-header">
                      <h4 className="admin-ai-student-title">
                        <Users size={18} /> Select Students ({selectedStudents.length}/{allStudents.length})
                      </h4>
                      <button
                        onClick={() => setSelectedStudents(p => p.length === allStudents.length ? [] : allStudents.map(s => s.id))}
                        className="admin-ai-student-toggle-btn"
                      >
                        {selectedStudents.length === allStudents.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="admin-ai-student-grid">
                      {allStudents.slice(0, 30).map(student => (
                        <div key={student.id} className="admin-ai-student-item">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => setSelectedStudents(p =>
                              p.includes(student.id) ? p.filter(id => id !== student.id) : [...p, student.id]
                            )}
                            className="admin-ai-student-checkbox"
                          />
                          <div className="admin-ai-student-info">
                            <div className="admin-ai-student-name">{student.name}</div>
                            <div className="admin-ai-student-email">{student.email}</div>
                          </div>
                        </div>
                      ))}
                      {allStudents.length > 30 && (
                        <div className="admin-ai-student-more">+{allStudents.length - 30} more students</div>
                      )}
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="admin-ai-exam-instructions">
                    <label className="admin-ai-exam-config-label"><HelpCircle size={14} /> Exam Instructions</label>
                    <textarea
                      value={examConfig.instructions}
                      onChange={e => setExamConfig(p => ({ ...p, instructions: e.target.value }))}
                      placeholder="Instructions displayed to students before the exam starts…"
                      rows={3}
                      className="admin-ai-exam-textarea"
                    />
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <div className="admin-ai-generate-section">
                <button
                  onClick={generateQuestions}
                  disabled={isGenerating || isCreatingExam || !topic.trim() || !selectedSources.length}
                  className="admin-ai-generate-btn"
                  style={{ minWidth: '220px' }}
                >
                  {isGenerating ? (
                    <><RefreshCw size={18} className="animate-spin" /> Generating…</>
                  ) : (
                    <><Sparkles size={18} /> {mode === 'full' ? 'Generate & Create Exam' : 'Generate Questions'}</>
                  )}
                </button>
                {apiStatus && (
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '0.78rem',
                    color: apiStatus.configured ? '#22c55e' : '#f59e0b',
                  }}>
                    {apiStatus.configured
                      ? <><CheckCircle size={13} /> AI Active (Google Gemini)</>
                      : <><AlertCircle size={13} /> Using templates (no API key)</>
                    }
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Generation Stats ──────────────────────────────────────────────── */}
        {generationStats && (
          <div className="admin-ai-stats">
            <div className="admin-ai-stats-header">
              <h4 className="admin-ai-stats-title"><Activity size={18} /> Generation Telemetry & Distribution</h4>
              <span className="admin-ai-stats-badge">
                <CheckCircle size={13} /> Questions Ready
              </span>
            </div>
            <div className="admin-ai-stats-grid">
              <div className="admin-ai-stat-item">
                <div className="admin-ai-stat-value">{generationStats.total}</div>
                <div className="admin-ai-stat-label">Total Questions</div>
              </div>
              <div className="admin-ai-stat-item highlight">
                <div className="admin-ai-stat-value">{generationStats.aiGenerated}</div>
                <div className="admin-ai-stat-label">AI Synthesized</div>
              </div>
              {generationStats.fallbacks > 0 && (
                <div className="admin-ai-stat-item warning">
                  <div className="admin-ai-stat-value">{generationStats.fallbacks}</div>
                  <div className="admin-ai-stat-label">Verified Blueprints</div>
                </div>
              )}
              {Object.entries(generationStats.bySource).map(([src, cnt]) => {
                const s = SOURCES.find(x => x.id === src);
                return (
                  <div key={src} className="admin-ai-stat-item">
                    <div className="admin-ai-stat-value" style={{ color: s?.color }}>{cnt}</div>
                    <div className="admin-ai-stat-label">{s?.name ?? src}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Question List ──────────────────────────────────────────────────── */}
        {generatedQuestions.length > 0 && (
          <div className="admin-ai-questions">
            <div className="admin-ai-questions-header">
              <h4 className="admin-ai-questions-title">
                <Code size={18} /> Generated Questions ({filteredQuestions.length})
              </h4>

              {mode === 'partial' && (
                <div className="admin-ai-questions-actions">
                  <div className="admin-ai-filters">
                    <input
                      type="text"
                      placeholder="Search questions…"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="admin-ai-search-input"
                    />
                    <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)} className="admin-ai-filter-select">
                      <option value="all">All Difficulties</option>
                      {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                    <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className="admin-ai-filter-select">
                      <option value="all">All Sources</option>
                      {SOURCES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div className="admin-ai-selection-actions">
                    <button onClick={() => setSelectedQuestions([...generatedQuestions])} className="admin-ai-select-btn">Select All</button>
                    <button onClick={() => setSelectedQuestions([])} className="admin-ai-select-btn">Deselect All</button>
                    <button
                      onClick={() => setShowSaveModal(true)}
                      disabled={!selectedQuestions.length}
                      className="admin-ai-save-btn"
                    >
                      <Save size={14} /> Save ({selectedQuestions.length})
                    </button>
                    <button onClick={exportQuestions} disabled={!selectedQuestions.length} className="admin-ai-export-btn">
                      <Download size={14} /> Export
                    </button>
                    <button
                      onClick={handleUseInExam}
                      disabled={!selectedQuestions.length}
                      className="admin-ai-add-btn"
                    >
                      <Plus size={14} /> Use in Exam ({selectedQuestions.length})
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="admin-ai-questions-list">
              {filteredQuestions.map(q => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  selected={selectedQuestions.some(sq => sq.id === q.id)}
                  onToggle={() => toggleQuestion(q.id)}
                  onPreview={() => { setPreviewQuestion(q); setShowPreview(true); }}
                  mode={mode}
                />
              ))}
            </div>

            {/* Full mode: Create Exam action */}
            {mode === 'full' && (
              <div className="admin-ai-full-mode-action-card">
                <div className="admin-ai-full-mode-info">
                  <div className="admin-ai-full-mode-title">
                    <Zap size={22} color="#0099ff" /> Proctored AI Assessment Deployment
                  </div>
                  <div className="admin-ai-full-mode-sub">
                    <strong>{selectedQuestions.length}</strong> questions prepared for <strong>{selectedStudents.length}</strong> candidates ({examConfig.name || 'Untitled Exam'} • {examConfig.duration || 60} mins)
                  </div>
                </div>
                <button
                  onClick={createExamWithQuestions}
                  disabled={isCreatingExam || !selectedQuestions.length || !selectedStudents.length}
                  className="admin-ai-generate-btn full-deploy-btn"
                >
                  {isCreatingExam
                    ? <><RefreshCw size={18} className="animate-spin" /> Deploying Exam…</>
                    : <><Zap size={18} /> Deploy Exam ({selectedQuestions.length} Questions)</>
                  }
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Saved Collections ─────────────────────────────────────────────── */}
        {savedCollections.length > 0 && (
          <div className="admin-ai-collections">
            <h4 className="admin-ai-collections-title"><FolderOpen size={18} /> Saved Collections</h4>
            <div className="admin-ai-collections-grid">
              {savedCollections.map(col => (
                <div key={col.id} className="admin-ai-collection-card">
                  <div className="admin-ai-collection-header">
                    <h5>{col.name}</h5>
                    <div className="admin-ai-collection-actions">
                      <button onClick={() => { setGeneratedQuestions(col.questions); setSelectedQuestions([]); }} className="admin-ai-collection-btn">
                        <Upload size={13} /> Load
                      </button>
                      <button onClick={() => setSavedCollections(p => p.filter(c => c.id !== col.id))} className="admin-ai-collection-btn delete">
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                  <div className="admin-ai-collection-stats">
                    <span>{col.stats.total} questions</span>
                    <span>{new Date(col.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Preview Modal ──────────────────────────────────────────────────── */}
        {showPreview && previewQuestion && (
          <PreviewModal
            question={previewQuestion}
            onClose={() => setShowPreview(false)}
            showFull={mode === 'full'}
          />
        )}

        {/* ── Save Collection Modal ─────────────────────────────────────────── */}
        {showSaveModal && (
          <div className="admin-ai-save-modal">
            <div className="admin-ai-save-content">
              <div className="admin-ai-save-header">
                <h3>Save Question Collection</h3>
                <button onClick={() => setShowSaveModal(false)} className="admin-ai-save-close"><X size={18} /></button>
              </div>
              <div className="admin-ai-save-body">
                <div className="admin-ai-save-form">
                  <label className="admin-ai-save-label">Collection Name</label>
                  <input
                    type="text"
                    value={collectionName}
                    onChange={e => setCollectionName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveToCollection()}
                    placeholder="Enter a name…"
                    className="admin-ai-save-input"
                    autoFocus
                  />
                </div>
                <div className="admin-ai-save-stats">
                  <p>Selected Questions: <strong>{selectedQuestions.length}</strong></p>
                </div>
                <div className="admin-ai-save-actions">
                  <button onClick={() => setShowSaveModal(false)} className="admin-btn admin-btn-secondary">Cancel</button>
                  <button onClick={saveToCollection} className="admin-btn admin-btn-primary">
                    <Save size={15} /> Save Collection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AIQuestionGenerator;
