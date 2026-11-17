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
  ArrowRight
} from 'lucide-react';
import './AIQuestionStudio.css';
import AnimatedNumber from '../../components/common/AnimatedNumber';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const SOURCES = [
  { id: 'leetcode', name: 'LeetCode', icon: Database, color: '#ffa116', description: 'Function signature & interview benchmarks' },
  { id: 'codeforces', name: 'Codeforces', icon: Cpu, color: '#1f8e3f', description: 'Competitive programming with standard I/O' },
  { id: 'geeksforgeeks', name: 'GeeksforGeeks', icon: Globe, color: '#2f8d46', description: 'Educational DSA with theoretical foundation' },
  { id: 'hackerrank', name: 'HackerRank', icon: Target, color: '#00a86b', description: 'Structured challenges with test cases' },
];

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', color: 'var(--good, #0f8a68)', icon: '🟢', description: 'Single DS / algorithm' },
  { value: 'medium', label: 'Medium', color: 'var(--gold, #a9863f)', icon: '🟡', description: '2–3 combined techniques' },
  { value: 'hard', label: 'Hard', color: 'var(--bad, #c2410c)', icon: '🔴', description: 'Complex algorithms & graphs' },
];

const SUGGESTED_TOPICS = [
  'Dynamic Programming', 'Binary Trees', 'Graphs & BFS/DFS', 'Sliding Window',
  'Two Pointers', 'Arrays & Hashing', 'Linked Lists', 'Recursion & Backtracking',
  'Heaps & Priority Queues', 'Tries', 'String Manipulation', 'Greedy Algorithms'
];

const getDifficultyColor = (d) => {
  if (d === 'easy') return 'var(--good, #0f8a68)';
  if (d === 'medium') return 'var(--gold, #a9863f)';
  if (d === 'hard') return 'var(--bad, #c2410c)';
  return 'var(--mu, #667085)';
};

// ─────────────────────────────────────────────────────────────────────────────
// Platform Badge
// ─────────────────────────────────────────────────────────────────────────────
const PlatformBadge = ({ sourceId }) => {
  const src = SOURCES.find(s => s.id === sourceId) || { name: sourceId, icon: Code, color: '#64748b' };
  const Icon = src.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
      background: `${src.color}15`, border: `1px solid ${src.color}35`, color: src.color,
    }}>
      <Icon size={12} /> {src.name}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Question Card Component
// ─────────────────────────────────────────────────────────────────────────────
const QuestionCard = ({ question, selected, onToggle, onPreview, mode }) => {
  const diffColor = getDifficultyColor(question.difficulty);

  return (
    <div className={`qs-question-card ${selected ? 'selected' : ''}`}>
      <div className="qs-question-top">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          {mode === 'partial' && (
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggle}
              style={{ width: '16px', height: '16px', accentColor: 'var(--c1, #2563eb)', marginTop: '4px', cursor: 'pointer' }}
            />
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: `${diffColor}15`,
                  color: diffColor,
                  border: `1px solid ${diffColor}30`
                }}
              >
                {question.difficulty}
              </span>
              <PlatformBadge sourceId={question.platform} />
              {question.isFallback && (
                <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: 'var(--s2, #f8f9fc)', color: 'var(--mu, #667085)', border: '1px solid var(--bd, #e6e9f0)' }}>
                  Blueprint Template
                </span>
              )}
              {Array.from(new Set(question.tags || [])).slice(0, 3).map((tag, idx) => (
                <span key={`${tag}-${idx}`} style={{ fontSize: '0.7rem', color: 'var(--mu, #667085)', background: 'var(--s2, #f8f9fc)', padding: '2px 6px', borderRadius: '4px' }}>
                  #{tag}
                </span>
              ))}
            </div>
            <h4 className="qs-question-title">{question.title}</h4>
          </div>
        </div>

        <button
          type="button"
          onClick={onPreview}
          className="qs-btn secondary"
          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
        >
          <Eye size={13} />
          <span>View Problem</span>
        </button>
      </div>

      <div style={{ fontSize: '0.86rem', color: 'var(--mu, #667085)', lineHeight: 1.5, maxHeight: '80px', overflow: 'hidden' }}>
        <MarkdownRenderer question={question} compact />
      </div>

      <div className="qs-question-chips">
        <span className="qs-chip">
          <Terminal size={12} /> Time: <code>{question.timeComplexity || 'O(n)'}</code>
        </span>
        <span className="qs-chip">
          <Activity size={12} /> Space: <code>{question.spaceComplexity || 'O(1)'}</code>
        </span>
        {Array.isArray(question.testCases) && question.testCases.length > 0 && (
          <span className="qs-chip" style={{ color: 'var(--good, #0f8a68)', borderColor: 'rgba(15,138,104,0.25)' }}>
            <CheckCircle size={12} /> {question.testCases.length} Test Cases
          </span>
        )}
        <span className="qs-chip" style={{ color: 'var(--c1, #2563eb)' }}>
          <Brain size={12} /> {question.aiGenerated ? 'AI Synthesized' : 'Verified Blueprint'}
        </span>
        <span className="qs-chip" style={{ fontWeight: 700 }}>
          <Award size={12} /> {question.marks || 10} Pts
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Preview Modal Component
// ─────────────────────────────────────────────────────────────────────────────
const PreviewModal = ({ question, onClose, showFull }) => {
  const [activeTab, setActiveTab] = useState('problem');
  if (!question) return null;

  const tabs = [
    { id: 'problem', label: 'Problem Statement', icon: FileText },
    { id: 'hints', label: 'Hints & Clues', icon: Lightbulb },
    { id: 'approach', label: 'Solution Approach', icon: Target },
    ...(showFull && question.editorial ? [{ id: 'editorial', label: 'Editorial Theory', icon: BookOpen }] : []),
    ...(showFull && question.solutionCode ? [{ id: 'code', label: 'Reference Code', icon: Code }] : []),
  ];

  return (
    <div className="qs-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="qs-modal" onClick={e => e.stopPropagation()}>
        <div className="qs-modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <PlatformBadge sourceId={question.platform} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: getDifficultyColor(question.difficulty) }}>
                {question.difficulty}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--mu, #667085)' }}>
                • Time: {question.timeComplexity || 'O(n)'} • Space: {question.spaceComplexity || 'O(1)'}
              </span>
            </div>
            <h3 className="qs-modal-title">{question.title}</h3>
          </div>
          <button onClick={onClose} className="qs-modal-close" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', padding: '12px 24px', borderBottom: '1px solid var(--bd, #e6e9f0)', background: 'var(--sf, #ffffff)', overflowX: 'auto' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: activeTab === tab.id ? 'var(--bd, #e6e9f0)' : 'transparent',
                  background: activeTab === tab.id ? 'var(--s2, #f8f9fc)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--c1, #2563eb)' : 'var(--mu, #667085)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="qs-modal-body">
          {activeTab === 'problem' && (
            <MarkdownRenderer question={question} compact={false} showHints={false} showApproach={false} />
          )}
          {activeTab === 'hints' && (
            <MarkdownRenderer question={question} compact={false} showHints={true} showApproach={false} />
          )}
          {activeTab === 'approach' && (
            <MarkdownRenderer question={question} compact={false} showHints={false} showApproach={true} />
          )}
          {activeTab === 'editorial' && (
            <MarkdownRenderer question={question} compact={false} showHints={false} showApproach={false} showEditorial={true} />
          )}
          {activeTab === 'code' && (
            <MarkdownRenderer question={question} compact={false} showHints={false} showApproach={false} showSolutionCode={true} />
          )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--bd, #e6e9f0)', background: 'var(--s2, #f8f9fc)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="qs-btn secondary" onClick={onClose}>
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main AI Question Studio Component
// ─────────────────────────────────────────────────────────────────────────────
export default function AIQuestionGenerator() {
  const [mode, setMode] = useState('partial');
  const [topic, setTopic] = useState('Dynamic Programming');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [selectedSources, setSelectedSources] = useState(['leetcode', 'codeforces']);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [showPreview, setShowPreview] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [generationStats, setGenerationStats] = useState(null);
  const [savedCollections, setSavedCollections] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [expandedConfig, setExpandedConfig] = useState(true);

  const [apiStatus, setApiStatus] = useState(null);

  // Full mode exam config
  const [examConfig, setExamConfig] = useState({
    name: '', subject: '', dateTime: '', duration: 60,
    passingMarks: 40, totalMarks: 100, isProctored: true,
    maxViolations: 3, instructions: '',
  });
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isCreatingExam, setIsCreatingExam] = useState(false);

  const currentGenerationRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    adminAPI.getStudents({ limit: 'all' })
      .then(res => setAllStudents(res?.data?.students || res?.students || []))
      .catch(() => { });

    adminAPI.getAIStatus()
      .then(res => {
        const s = res?.data || res;
        if (s && typeof s.configured !== 'undefined') setApiStatus(s);
      })
      .catch(() => { });
  }, []);

  const toggleSource = useCallback((id) => {
    setSelectedSources(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }, []);

  const generateQuestions = async () => {
    if (!topic.trim()) { toast.error('Please enter a topic'); return; }
    if (!selectedSources.length) { toast.error('Select at least one benchmark source'); return; }

    const generationId = Date.now().toString();
    currentGenerationRef.current = generationId;
    setIsGenerating(true);
    setGeneratedQuestions([]);
    setSelectedQuestions([]);
    setGenerationStats(null);

    const toastId = toast.loading(`🤖 Synthesizing ${questionCount} ${difficulty} problems on "${topic}"…`, { duration: 120000 });

    try {
      const response = await adminAPI.generateAIQuestions({
        topic: topic.trim(),
        difficulty,
        sources: selectedSources,
        count: parseInt(questionCount),
        mode,
      });

      if (currentGenerationRef.current !== generationId) return;

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
        toast('📋 Synthesized using high-yield blueprints (configure Gemini API key for frontier models)', { icon: 'ℹ️', duration: 6000 });
      } else if (meta.fallbacks > 0) {
        toast.success(`✅ ${meta.aiGenerated} AI-generated + ${meta.fallbacks} verified blueprint problems`);
      } else {
        toast.success(`✅ ${qs.length} problems synthesized by AI Studio!`);
      }

      setExpandedConfig(false);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err?.message || 'Synthesis failed. Please try again.');
      console.error('Synthesis failed:', err);
    } finally {
      if (currentGenerationRef.current === generationId) setIsGenerating(false);
    }
  };

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
    const matchDiff = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    const matchSrc = filterSource === 'all' || q.platform === filterSource;
    return matchSearch && matchDiff && matchSrc;
  });

  const saveToCollection = () => {
    if (!collectionName.trim()) { toast.error('Enter a collection name'); return; }
    if (!selectedQuestions.length) { toast.error('Select at least one problem'); return; }
    setSavedCollections(prev => [...prev, {
      id: Date.now().toString(),
      name: collectionName,
      questions: selectedQuestions,
      createdAt: new Date().toISOString(),
      stats: { total: selectedQuestions.length },
    }]);
    setShowSaveModal(false);
    setCollectionName('');
    toast.success(`Collection "${collectionName}" saved to studio library!`);
  };

  const exportQuestions = () => {
    if (!selectedQuestions.length) { toast.error('Select questions to export'); return; }
    const blob = new Blob([JSON.stringify({ questions: selectedQuestions, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ai-problems-${Date.now()}.json`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success('Question dossier exported to JSON!');
  };

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
    try {
      sessionStorage.setItem('ai_generated_exam_questions', JSON.stringify(cleanQuestions));
    } catch (err) {
      console.warn('SessionStorage error:', err);
    }
    navigate('/admin/exams/create');
  };

  const createExamWithQuestions = async () => {
    if (!examConfig.name || !examConfig.dateTime) { toast.error('Complete exam name and scheduled window'); return; }
    if (!selectedStudents.length) { toast.error('Select at least one enrolled candidate'); return; }
    if (!selectedQuestions.length) { toast.error('Select at least one problem'); return; }
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
      toast.success(`Assessment "${examConfig.name}" launched with ${selectedQuestions.length} AI problems!`);
      setTimeout(() => navigate('/admin/exams', { state: { examCreated: true, examId: res?.data?.id } }), 1500);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Exam deployment failed');
    } finally {
      setIsCreatingExam(false);
    }
  };

  return (
    <div className="qs-container">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="qs-header">
        <div className="qs-header-left">
          <div className="qs-eyebrow">
            <span className="qs-eyebrow-dot" />
            <span>AI Reasoning Studio • Algorithmic Question Synthesis &amp; Benchmarks</span>
          </div>
          <h1 className="qs-title">AI Question Studio &amp; Problem Synthesis</h1>
          <p className="qs-subtitle">
            <span>Synthesize complete algorithmic problems with multi-platform signatures, input/output constraints, test cases, and editorial theory.</span>
          </p>
        </div>

        <div className="qs-header-actions">
          <button
            type="button"
            className="qs-btn secondary"
            onClick={() => navigate('/admin/exams')}
          >
            <BookOpen size={15} />
            <span>Examinations Center</span>
          </button>
        </div>
      </div>

      {/* ── Executive Metric KPI Cards ──────────────────────────────────────── */}
      <div className="qs-metrics-grid">
        <div className="qs-metric-card">
          <div className="qs-metric-icon">
            <Brain size={22} />
          </div>
          <div className="qs-metric-content">
            <span className="qs-metric-label">Synthesized Problems</span>
            <span className="qs-metric-value"><AnimatedNumber value={generatedQuestions.length} /></span>
          </div>
        </div>

        <div className="qs-metric-card">
          <div className="qs-metric-icon good">
            <Database size={22} />
          </div>
          <div className="qs-metric-content">
            <span className="qs-metric-label">Benchmark Platforms</span>
            <span className="qs-metric-value"><AnimatedNumber value={selectedSources.length} /></span>
          </div>
        </div>

        <div className="qs-metric-card">
          <div className="qs-metric-icon gold">
            <Award size={22} />
          </div>
          <div className="qs-metric-content">
            <span className="qs-metric-label">Selected for Roster</span>
            <span className="qs-metric-value"><AnimatedNumber value={selectedQuestions.length} /></span>
          </div>
        </div>

        <div className="qs-metric-card">
          <div className="qs-metric-icon purple">
            <Sparkles size={22} />
          </div>
          <div className="qs-metric-content">
            <span className="qs-metric-label">Synthesis Engine</span>
            <span className="qs-metric-value" style={{ fontSize: '1.25rem', marginTop: '3px' }}>
              {apiStatus?.configured ? 'Gemini AI Core' : 'Verified Blueprints'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Generation Mode Selection ───────────────────────────────────────── */}
      <div className="qs-mode-card">
        <h3 className="qs-section-heading">
          <Sparkles size={18} color="var(--c1, #2563eb)" />
          <span>Synthesis Mode</span>
        </h3>
        <div className="qs-modes-grid">
          {[
            { id: 'partial', icon: Layers, title: 'Partial Studio Mode', desc: 'Inspect, preview, and selectively curate problems into customized question banks.' },
            { id: 'full', icon: Zap, title: 'Full Assessment Mode', desc: 'Synthesize problems and directly instantiate an active examination with enrolled candidates.' },
          ].map(({ id, icon: Icon, title, desc }) => (
            <div
              key={id}
              className={`qs-mode-btn ${mode === id ? 'active' : ''}`}
              onClick={() => setMode(id)}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: mode === id ? 'var(--wash, rgba(37,99,235,0.1))' : 'var(--s2, #f8f9fc)',
                color: mode === id ? 'var(--c1, #2563eb)' : 'var(--mu, #667085)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={18} />
              </div>
              <div>
                <div className="qs-mode-title">{title}</div>
                <div className="qs-mode-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Synthesis Configuration Panel ──────────────────────────────────── */}
      <div className="qs-config-card">
        {generatedQuestions.length > 0 && (
          <button
            type="button"
            onClick={() => setExpandedConfig(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', width: '100%',
              background: 'none', border: 'none', color: 'var(--c1, #2563eb)', cursor: 'pointer',
              fontSize: '0.86rem', fontWeight: 700, padding: '0 0 16px',
            }}
          >
            {expandedConfig ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>{expandedConfig ? 'Collapse configuration panel' : 'Modify synthesis criteria'}</span>
          </button>
        )}

        {expandedConfig && (
          <>
            <div className="qs-form-grid">
              {/* Topic Input */}
              <div className="qs-form-group span-2">
                <label className="qs-form-label">
                  <Search size={14} color="var(--mu, #667085)" />
                  <span>Topic / Data Structure / Algorithmic Paradigm</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && generateQuestions()}
                  placeholder="e.g. Dynamic Programming, Graphs, Two Pointers, Trie..."
                  className="qs-input"
                />
                <div className="qs-topic-pills">
                  {SUGGESTED_TOPICS.map(t => (
                    <button
                      key={t}
                      type="button"
                      className={`qs-topic-pill ${topic === t ? 'active' : ''}`}
                      onClick={() => setTopic(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="qs-form-group">
                <label className="qs-form-label">
                  <Target size={14} color="var(--mu, #667085)" />
                  <span>Target Difficulty Level</span>
                </label>
                <div className="qs-difficulty-group">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d.value}
                      type="button"
                      className={`qs-diff-btn ${difficulty === d.value ? 'active' : ''}`}
                      onClick={() => setDifficulty(d.value)}
                      style={{ color: difficulty === d.value ? d.color : undefined }}
                    >
                      <span style={{ fontSize: '1rem' }}>{d.icon}</span>
                      <span>{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Questions */}
              <div className="qs-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="qs-form-label" style={{ margin: 0 }}>
                    <BarChart3 size={14} color="var(--mu, #667085)" />
                    <span>Problem Count (1–20)</span>
                  </label>
                  <span style={{ fontWeight: 800, color: 'var(--c1, #2563eb)', fontSize: '1rem' }}>
                    {questionCount}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={questionCount}
                    onChange={e => setQuestionCount(parseInt(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--c1, #2563eb)' }}
                  />
                </div>
              </div>
            </div>

            {/* Benchmark Platform Styles */}
            <div style={{ marginTop: '14px', paddingTop: '16px', borderTop: '1px solid var(--bd, #e6e9f0)' }}>
              <label className="qs-form-label">
                <Database size={14} color="var(--mu, #667085)" />
                <span>Benchmark Platform Signatures (Select one or more)</span>
              </label>
              <div className="qs-sources-grid">
                {SOURCES.map(source => {
                  const selected = selectedSources.includes(source.id);
                  const Icon = source.icon;
                  return (
                    <div
                      key={source.id}
                      className={`qs-source-btn ${selected ? 'selected' : ''}`}
                      onClick={() => toggleSource(source.id)}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: `${source.color}15`,
                        color: source.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: selected ? 'var(--tx, #101828)' : 'var(--mu, #667085)' }}>
                          {source.name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--mu, #667085)', marginTop: '2px' }}>
                          {source.description}
                        </div>
                      </div>
                      {selected && <CheckCircle size={16} color={source.color} style={{ flexShrink: 0 }} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--bd, #e6e9f0)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--mu, #667085)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="var(--c1, #2563eb)" />
                <span>All synthesized questions include time/space complexity bounds, examples &amp; hidden verification test cases.</span>
              </div>

              <button
                type="button"
                className="qs-btn primary"
                disabled={isGenerating || !topic.trim() || !selectedSources.length}
                onClick={generateQuestions}
                style={{ minWidth: '220px' }}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Synthesizing Problems...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>{mode === 'full' ? 'Synthesize & Deploy Exam' : 'Synthesize Problem Set'}</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Generated Questions Section ────────────────────────────────────── */}
      {generatedQuestions.length > 0 && (
        <div>
          {/* Action Header */}
          <div className="qs-results-header">
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--tx, #101828)' }}>
                Synthesized Problem Set ({filteredQuestions.length})
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--mu, #667085)' }}>
                {selectedQuestions.length} selected for assessment deployment
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="qs-btn secondary"
                onClick={() => setSelectedQuestions(selectedQuestions.length === generatedQuestions.length ? [] : [...generatedQuestions])}
                style={{ padding: '8px 12px', fontSize: '0.82rem' }}
              >
                {selectedQuestions.length === generatedQuestions.length ? 'Deselect All' : 'Select All'}
              </button>

              <button
                type="button"
                className="qs-btn secondary"
                disabled={!selectedQuestions.length}
                onClick={() => setShowSaveModal(true)}
                style={{ padding: '8px 12px', fontSize: '0.82rem' }}
              >
                <Save size={14} />
                <span>Save Collection</span>
              </button>

              <button
                type="button"
                className="qs-btn secondary"
                disabled={!selectedQuestions.length}
                onClick={exportQuestions}
                style={{ padding: '8px 12px', fontSize: '0.82rem' }}
              >
                <Download size={14} />
                <span>Export JSON</span>
              </button>

              <button
                type="button"
                className="qs-btn primary"
                disabled={!selectedQuestions.length}
                onClick={handleUseInExam}
                style={{ padding: '8px 14px', fontSize: '0.84rem' }}
              >
                <Plus size={14} />
                <span>Use in Exam ({selectedQuestions.length})</span>
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div>
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
        </div>
      )}

      {/* ── PREVIEW MODAL ──────────────────────────────────────────────────── */}
      {showPreview && previewQuestion && (
        <PreviewModal
          question={previewQuestion}
          onClose={() => setShowPreview(false)}
          showFull={mode === 'full'}
        />
      )}

      {/* ── SAVE COLLECTION MODAL ──────────────────────────────────────────── */}
      {showSaveModal && (
        <div className="qs-modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="qs-modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="qs-modal-header">
              <h3 className="qs-modal-title">Save Problem Collection</h3>
              <button onClick={() => setShowSaveModal(false)} className="qs-modal-close">
                <X size={18} />
              </button>
            </div>
            <div className="qs-modal-body">
              <div className="qs-form-group">
                <label className="qs-form-label">Collection Title</label>
                <input
                  type="text"
                  value={collectionName}
                  onChange={e => setCollectionName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveToCollection()}
                  placeholder="e.g. Midterm Dynamic Programming Bank..."
                  className="qs-input"
                  autoFocus
                />
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--mu, #667085)' }}>
                Saving <strong>{selectedQuestions.length}</strong> selected problems to college question archive.
              </div>
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--bd, #e6e9f0)', background: 'var(--s2, #f8f9fc)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="qs-btn secondary" onClick={() => setShowSaveModal(false)}>
                Cancel
              </button>
              <button type="button" className="qs-btn primary" onClick={saveToCollection}>
                <Save size={14} />
                <span>Save Collection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
