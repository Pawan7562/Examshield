// src/pages/admin/AIQuestionGenerator.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import MarkdownRenderer from '../../components/common/MarkdownRenderer';
import toast from 'react-hot-toast';
import {
  Brain, Activity, Sparkles, Layers, Zap,
  BookOpen, FileText, FolderOpen, Clock, Award,
  Calendar, Shield, Users, Database, Cpu,
  Globe, Target, Search, BarChart3, CheckCircle,
  HelpCircle, RefreshCw, Code, Save, Download,
  Plus, Eye, Upload, Trash2, AlertCircle, Info,
  ChevronDown, ChevronUp, X, Terminal, Lightbulb,
} from 'lucide-react';
import '../../components/admin/AdminSidebar.css';

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
      className="admin-ai-question-card"
      style={{
        borderLeft: `3px solid ${src?.color ?? '#a78bfa'}`,
        background: selected ? 'rgba(139,92,246,0.08)' : undefined,
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header row */}
      <div className="admin-ai-question-header">
        <div className="admin-ai-question-meta" style={{ flex: 1, minWidth: 0 }}>
          {mode === 'partial' && (
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggle}
              className="admin-ai-question-checkbox"
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="admin-ai-question-title"
              style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {question.isFallback && (
                <span style={{ fontSize: '0.7rem', color: '#f59e0b', marginRight: '6px', verticalAlign: 'middle' }}>
                  [Template]
                </span>
              )}
              {question.title}
            </div>
            <div className="admin-ai-question-badges" style={{ marginTop: '6px', flexWrap: 'wrap', gap: '6px' }}>
              <span
                className="admin-ai-difficulty-badge"
                style={{ backgroundColor: diffColor + '25', color: diffColor, border: `1px solid ${diffColor}40` }}
              >
                {DIFFICULTIES.find(d => d.value === question.difficulty)?.icon} {question.difficulty}
              </span>
              <PlatformBadge sourceId={question.platform} />
              {question.tags?.slice(0, 3).map(tag => (
                <span key={tag} className="admin-ai-tag">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button onClick={onPreview} className="admin-ai-preview-btn">
            <Eye size={14} /> Preview
          </button>
        </div>
      </div>

      {/* Brief description */}
      <div className="admin-ai-question-content">
        <MarkdownRenderer question={question} compact />

        <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Terminal size={12} /> Time: <code style={{ color: '#a78bfa', marginLeft: '3px' }}>{question.timeComplexity}</code>
          </span>
          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Activity size={12} /> Space: <code style={{ color: '#a78bfa', marginLeft: '3px' }}>{question.spaceComplexity}</code>
          </span>
          {Array.isArray(question.testCases) && question.testCases.length > 0 && (
            <span style={{ fontSize: '0.75rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={12} /> {question.testCases.length} test cases
            </span>
          )}
          {question.aiGenerated && (
            <span style={{ fontSize: '0.75rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Brain size={12} /> AI Generated
            </span>
          )}
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
    { id: 'problem',   label: 'Problem',   icon: FileText  },
    { id: 'hints',     label: 'Hints',     icon: Lightbulb },
    { id: 'approach',  label: 'Approach',  icon: Target    },
    ...(showFull && question.editorial  ? [{ id: 'editorial', label: 'Editorial', icon: BookOpen }] : []),
    ...(showFull && question.solutionCode ? [{ id: 'code',   label: 'Solution',  icon: Code    }] : []),
  ];

  const diffColor = getDifficultyColor(question.difficulty);

  return (
    <div
      className="admin-ai-preview-modal-premium"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="premium-modal-content" style={{ maxWidth: '820px', width: '95vw' }}>
        {/* Modal Header */}
        <div className="premium-modal-header">
          <div className="premium-header-title" style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, wordBreak: 'break-word', lineHeight: '1.4' }}>
              {question.title}
            </h3>
            <div className="premium-header-badges" style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              <span
                className="premium-badge"
                style={{
                  background: `${diffColor}20`, color: diffColor, border: `1px solid ${diffColor}40`,
                  padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700,
                }}
              >
                {DIFFICULTIES.find(d => d.value === question.difficulty)?.icon} {question.difficulty}
              </span>
              <PlatformBadge sourceId={question.platform} />
              {question.isFallback && (
                <span style={{ fontSize: '0.72rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '2px 8px', borderRadius: '10px' }}>
                  Template (No AI Key)
                </span>
              )}
              {question.tags?.slice(0, 4).map(t => (
                <span key={t} className="premium-tag" style={{ fontSize: '0.72rem' }}>{t}</span>
              ))}
            </div>

            {/* Complexity row */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                ⏱ Time: <code style={{ color: '#a78bfa' }}>{question.timeComplexity}</code>
              </span>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                💾 Space: <code style={{ color: '#a78bfa' }}>{question.spaceComplexity}</code>
              </span>
            </div>
          </div>
          <button onClick={onClose} className="premium-modal-close" style={{ flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Bar */}
        <div style={{
          display: 'flex', gap: '4px', padding: '0 24px',
          borderBottom: '1px solid rgba(139,92,246,0.15)',
          background: 'rgba(0,0,0,0.2)',
          overflowX: 'auto',
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '10px 14px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #a78bfa' : '2px solid transparent',
                  color: activeTab === tab.id ? '#a78bfa' : '#64748b',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  fontSize: '0.83rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable body */}
        <div className="premium-modal-scroll-area" style={{ padding: '24px' }}>
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
    adminAPI.getStudents({ limit: 500 })
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

      const qs = rd.data.questions.map(q => ({
        ...q,
        // Normalise source object for the card
        source: SOURCES.find(s => s.id === q.platform) || { id: q.platform, name: q.platform, icon: Code, color: '#64748b' },
        marks: q.difficulty === 'easy' ? 5 : q.difficulty === 'medium' ? 10 : 15,
      }));

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
        totalMarks,
        duration: parseInt(examConfig.duration),
        passingMarks: parseInt(examConfig.passingMarks),
        questions: selectedQuestions,
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
            <h4 className="admin-ai-stats-title"><Activity size={18} /> Generation Results</h4>
            <div className="admin-ai-stats-grid">
              <div className="admin-ai-stat-item">
                <div className="admin-ai-stat-value">{generationStats.total}</div>
                <div className="admin-ai-stat-label">Total Questions</div>
              </div>
              <div className="admin-ai-stat-item">
                <div className="admin-ai-stat-value" style={{ color: '#60a5fa' }}>{generationStats.aiGenerated}</div>
                <div className="admin-ai-stat-label">AI Generated</div>
              </div>
              {generationStats.fallbacks > 0 && (
                <div className="admin-ai-stat-item">
                  <div className="admin-ai-stat-value" style={{ color: '#f59e0b' }}>{generationStats.fallbacks}</div>
                  <div className="admin-ai-stat-label">Templates Used</div>
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
                      placeholder="Search…"
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
                      onClick={() => navigate('/admin/exams/create', { state: { questions: selectedQuestions } })}
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
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <button
                  onClick={createExamWithQuestions}
                  disabled={isCreatingExam || !selectedQuestions.length}
                  className="admin-ai-generate-btn"
                  style={{ minWidth: '240px' }}
                >
                  {isCreatingExam
                    ? <><RefreshCw size={18} className="animate-spin" /> Creating Exam…</>
                    : <><Zap size={18} /> Create Exam with {selectedQuestions.length} Questions</>
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
