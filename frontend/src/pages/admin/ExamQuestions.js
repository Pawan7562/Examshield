// src/pages/admin/ExamQuestions.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Trash2, 
  Code, 
  HelpCircle, 
  FileText, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  Award,
  BookOpen
} from 'lucide-react';
import '../../components/admin/AdminSidebar.css';

export default function ExamQuestions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getExamQuestions(id);
      
      const qList = response.data?.questions || 
                    response.data?.data?.questions || 
                    (Array.isArray(response.data?.data) ? response.data.data : []) || 
                    (Array.isArray(response.data) ? response.data : []);
      
      setQuestions(qList);

      const examData = response.data?.exam || response.data?.data?.exam;
      if (examData) {
        setExam(examData);
      }
    } catch (error) {
      toast.error('Failed to load exam questions');
      console.error('Load questions error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [id]);

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      try {
        await adminAPI.deleteQuestion(id, questionId);
        toast.success('Question deleted successfully');
        setQuestions(prev => prev.filter(q => q.id !== questionId));
      } catch (error) {
        console.error('Delete question error:', error);
        toast.error('Failed to delete question');
      }
    }
  };

  const renderOptions = (question) => {
    if (!question.options) return null;
    
    try {
      const options = typeof question.options === 'string' 
        ? JSON.parse(question.options) 
        : question.options;
      
      if (!Array.isArray(options)) return null;

      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          {options.map((opt, index) => {
            const optLetter = (opt.id || String.fromCharCode(65 + index)).toUpperCase();
            const isCorrect = String(question.correct_answer).toUpperCase() === optLetter || 
                              String(question.correct_answer) === String(index) ||
                              question.correct_answer === opt.text;

            return (
              <div 
                key={opt.id || index} 
                style={{ 
                  fontSize: '0.85rem', 
                  padding: '10px 14px', 
                  borderRadius: 8, 
                  background: isCorrect ? 'rgba(34, 197, 94, 0.08)' : '#f8fafc', 
                  color: isCorrect ? '#16a34a' : '#334155', 
                  border: `1.5px solid ${isCorrect ? '#22c55e' : '#e2e8f0'}`,
                  fontWeight: isCorrect ? 700 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span><strong>{optLetter}.</strong> {opt.text}</span>
                {isCorrect && <CheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      );
    } catch (error) {
      console.error('Error parsing options:', error);
      return null;
    }
  };

  const getQuestionTypeBadge = (type) => {
    const t = (type || 'mcq').toLowerCase();
    if (t === 'coding') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(10, 116, 218, 0.1)', color: '#0a74da', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 800 }}>
          <Code size={12} /> CODING
        </span>
      );
    }
    if (t === 'subjective') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(168, 85, 247, 0.1)', color: '#9333ea', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 800 }}>
          <FileText size={12} /> SUBJECTIVE
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 800 }}>
        <HelpCircle size={12} /> MCQ
      </span>
    );
  };

  return (
    <div className="admin-pages-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-header-content">
          <button 
            onClick={() => navigate('/admin/exams')}
            className="admin-btn admin-btn-ghost admin-btn-sm"
            style={{ marginBottom: 8, padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b' }}
          >
            <ArrowLeft size={16} /> Back to Exams
          </button>
          <h1 className="admin-page-title">
            {exam ? (exam.title || exam.name) : 'Exam Questions'}
          </h1>
          <p className="admin-page-subtitle">
            {questions.length} questions in this assessment
          </p>
        </div>
        <div className="admin-header-actions">
          <button 
            className="admin-btn admin-btn-secondary admin-btn-md"
            onClick={() => navigate('/admin/ai-questions')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Sparkles size={16} style={{ color: '#0a74da' }} /> Generate AI Questions
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="admin-content-card">
        {loading ? (
          <div className="admin-table-loading" style={{ padding: '60px 0' }}>
            <div className="admin-loading-spinner"></div>
            Loading exam questions...
          </div>
        ) : questions.length === 0 ? (
          <div className="admin-empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <BookOpen size={48} style={{ color: '#94a3b8', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
              No questions found for this exam
            </h3>
            <p style={{ color: '#64748b', maxWidth: 460, margin: '0 auto 20px' }}>
              You can instantly generate relevant, curriculum-aligned questions with AI, or import them directly.
            </p>
            <button 
              className="admin-btn admin-btn-primary admin-btn-md"
              onClick={() => navigate('/admin/ai-questions')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Sparkles size={16} /> Generate Questions with AI
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {questions.map((q, i) => (
              <div 
                key={q.id || i}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 14,
                  padding: '22px 24px',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                  transition: 'all 0.18s ease'
                }}
              >
                {/* Question Top Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: 8, 
                      background: '#0b1329', 
                      color: '#ffffff', 
                      fontWeight: 800, 
                      fontSize: '0.85rem',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      Q{i + 1}
                    </span>
                    {getQuestionTypeBadge(q.type)}
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>
                      <Award size={12} style={{ display: 'inline', marginRight: 4 }} />
                      {q.marks || 1} {q.marks === 1 ? 'Mark' : 'Marks'}
                    </span>
                    {q.time_limit && (
                      <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {q.time_limit}s
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#dc2626',
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                    title="Delete Question"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>

                {/* Question Statement */}
                <p style={{ 
                  fontSize: '1rem', 
                  color: '#0f172a', 
                  lineHeight: 1.6, 
                  fontWeight: 600,
                  margin: '0 0 10px 0' 
                }}>
                  {q.question_text}
                </p>

                {/* Multiple choice options */}
                {renderOptions(q)}

                {/* Code template block if coding */}
                {q.code_template && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0a74da', textTransform: 'uppercase', marginBottom: 6 }}>
                      Starter Code Template:
                    </div>
                    <pre style={{ 
                      background: '#0b1329', 
                      color: '#38bdf8', 
                      padding: '14px 16px', 
                      borderRadius: 10, 
                      fontSize: '0.85rem', 
                      overflow: 'auto',
                      maxHeight: '220px',
                      fontFamily: 'monospace'
                    }}>
                      {q.code_template}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
