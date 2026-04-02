// src/pages/admin/ExamQuestions.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ExamQuestions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, [id]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getExamQuestions(id);
      setQuestions(response.data.questions || []);
    } catch (error) {
      toast.error('Failed to load questions');
      console.error('Load questions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    console.log('🔍 Debug - Delete button clicked for question:', questionId);
    if (window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      try {
        console.log('🔍 Debug - Confirmed deletion for question:', questionId);
        await adminAPI.deleteQuestion(id, questionId);
        toast.success('Question deleted successfully');
        console.log('🔍 Debug - Question deleted successfully, refreshing list');
        // Refresh questions list
        await fetchQuestions();
      } catch (error) {
        console.error('Delete question error:', error);
        toast.error('Failed to delete question');
      }
    } else {
      console.log('🔍 Debug - Deletion cancelled for question:', questionId);
    }
  };

  const handleQuestionClick = (questionId) => {
    navigate(`/admin/exams/${id}/questions/${questionId}`);
  };

  const renderOptions = (question) => {
    if (!question.options) return null;
    
    try {
      const options = typeof question.options === 'string' 
        ? JSON.parse(question.options) 
        : question.options;
      
      return options.map((opt, index) => (
        <div key={opt.id || index} style={{ 
          fontSize: 12, 
          padding: '6px 10px', 
          borderRadius: 6, 
          background: question.correct_answer === (opt.id || index) ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)', 
          color: question.correct_answer === (opt.id || index) ? '#22c55e' : '#a0aec0', 
          border: `1px solid ${question.correct_answer === (opt.id || index) ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.06)'}` 
        }}>
          <strong>{(opt.id || String.fromCharCode(65 + index)).toUpperCase()}.</strong> {opt.text} {question.correct_answer === (opt.id || index) && '✓'}
        </div>
      ));
    } catch (error) {
      console.error('Error parsing options:', error);
      return <div style={{ color: '#ef4444', fontSize: 12 }}>Error loading options</div>;
    }
  };

  console.log('🔍 Debug - Current questions:', questions);
    console.log('🔍 Debug - Questions count:', questions.length);
    
    return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 24 }}>Exam Questions ({questions.length})</h1>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#4a5568' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
          <div>Loading questions...</div>
        </div>
      ) : questions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#4a5568' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
          <p>No questions yet.</p>
        </div>
      ) : (
        questions.map((q, i) => (
          <div 
            key={q.id} 
            style={{ 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid rgba(255,255,255,0.06)', 
              borderRadius: 10, 
              padding: '18px 20px', 
              marginBottom: 12,
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => handleQuestionClick(q.id)}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ 
                  fontSize: 11, 
                  fontWeight: 700, 
                  color: q.type === 'mcq' ? '#e94560' : q.type === 'subjective' ? '#8b5cf6' : q.type === 'coding' ? '#06b6d4' : '#10b981' 
                }}>
                  Q{i + 1} · {q.type?.toUpperCase()} · {q.marks || 1} marks
                </span>
                <span style={{ fontSize: 10, color: '#4a5568' }}>
                  {q.difficulty || 'medium'} · {q.time_limit ? `${q.time_limit}s` : 'No limit'}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent question click
                  handleDeleteQuestion(q.id);
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.target.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  e.target.style.transform = 'translateY(0)';
                }}
                title="Delete this question"
              >
                🗑️ Delete
              </button>
            </div>
            <p style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.7, margin: '0 0 12px 0' }}>
              {q.question_text}
            </p>
            {renderOptions(q)}
            {q.code_template && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: '#8b5cf6', marginBottom: 4 }}>Code Template:</div>
                <pre style={{ 
                  background: 'rgba(0,0,0,0.3)', 
                  padding: 8, 
                  borderRadius: 6, 
                  fontSize: 11, 
                  color: '#e2e8f0', 
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {q.code_template}
                </pre>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
