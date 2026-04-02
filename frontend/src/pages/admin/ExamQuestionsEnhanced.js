// src/pages/admin/ExamQuestionsEnhanced.js - Enhanced Question Management Component
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import QuestionFormSimple from '../../components/QuestionFormSimple';

export default function ExamQuestionsEnhanced() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

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

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setEditingIndex(null);
    setShowAddForm(true);
  };

  const handleEditQuestion = (question, index) => {
    setEditingQuestion(question);
    setEditingIndex(index);
    setShowAddForm(true);
  };

  const handleSaveQuestion = async (formData) => {
    try {
      if (editingIndex !== null) {
        // Update existing question
        const updatedQuestions = [...questions];
        updatedQuestions[editingIndex] = {
          ...formData,
          exam_id: id,
          question_text: formData.questionText,
          type: formData.type,
          options: formData.type === 'mcq' ? JSON.stringify(formData.options) : null,
          correct_answer: formData.correctAnswer,
          marks: formData.marks,
          time_limit: formData.timeLimit,
          code_template: formData.codeTemplate,
          test_cases: formData.type === 'coding' ? formData.testCases : null
        };
        
        await adminAPI.updateQuestion(id, updatedQuestions[editingIndex].id, updatedQuestions[editingIndex]);
        toast.success('Question updated successfully');
        
        const updatedQuestionsList = await adminAPI.getExamQuestions(id);
        setQuestions(updatedQuestionsList.data.questions || []);
      } else {
        // Add new question
        const newQuestion = {
          exam_id: id,
          question_text: formData.questionText,
          type: formData.type,
          options: formData.type === 'mcq' ? JSON.stringify(formData.options) : null,
          correct_answer: formData.correctAnswer,
          marks: formData.marks,
          time_limit: formData.timeLimit,
          code_template: formData.codeTemplate,
          test_cases: formData.type === 'coding' ? formData.testCases : null
        };
        
        await adminAPI.addQuestions(id, [newQuestion]);
        toast.success('Question added successfully');
        
        const updatedQuestionsList = await adminAPI.getExamQuestions(id);
        setQuestions(updatedQuestionsList.data.questions || []);
      }
      
      setShowAddForm(false);
      setEditingQuestion(null);
      setEditingIndex(null);
    } catch (error) {
      toast.error('Failed to save question');
      console.error('Save question error:', error);
    }
  };

  const handleCancelEdit = () => {
    setShowAddForm(false);
    setEditingQuestion(null);
    setEditingIndex(null);
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
          padding: '10px 15px', 
          borderRadius: 8, 
          background: question.correct_answer === (opt.id || index) ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', 
          color: question.correct_answer === (opt.id || index) ? '#22c55e' : '#a0aec0', 
          border: `1px solid ${question.correct_answer === (opt.id || index) ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
          marginBottom: 8
        }}>
          <strong>{(opt.id || String.fromCharCode(65 + index)).toUpperCase()}.</strong> {opt.text} {question.correct_answer === (opt.id || index) && '✓'}
        </div>
      ));
    } catch (error) {
      console.error('Error parsing options:', error);
      return <div style={{ color: '#ef4444', fontSize: 12 }}>Error loading options</div>;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#4a5568' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
        <div>Loading questions...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>
          Exam Questions ({questions.length})
        </h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleAddQuestion}
            style={{
              background: 'linear-gradient(135deg,#e94560,#c62a47)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              color: 'white',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'Sora, sans-serif'
            }}
          >
            + Add Question
          </button>
          <button
            onClick={() => navigate(`/admin/exams/${id}/publish`)}
            style={{
              background: 'linear-gradient(135deg,#22c55e,#16a34a)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              color: 'white',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'Sora, sans-serif'
            }}
          >
            Publish Exam
          </button>
        </div>
      </div>

      {showAddForm ? (
        <div style={{ 
          background: 'rgba(255,255,255,0.95)', 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{ 
            background: 'white', 
            borderRadius: 12, 
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>
                {editingIndex !== null ? 'Edit Question' : 'Add New Question'}
              </h3>
              <button
                onClick={handleCancelEdit}
                style={{
                  background: 'none',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  padding: '6px 12px',
                  color: '#6b7280',
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
            
            <QuestionFormSimple
              question={editingQuestion}
              index={editingIndex}
              onChange={handleSaveQuestion}
              onRemove={() => {
                setShowAddForm(false);
                setEditingQuestion(null);
                setEditingIndex(null);
              }}
            />
          </div>
        </div>
      ) : (
        questions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#4a5568' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
            <p>No questions yet.</p>
            <button
              onClick={handleAddQuestion}
              style={{
                marginTop: 16,
                background: 'none',
                border: '1px solid #e94560',
                color: '#e94560',
                padding: '8px 16px',
                borderRadius: 6,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'Sora, sans-serif'
              }}
            >
              Create First Question
            </button>
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
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditQuestion(q, i);
                    }}
                    style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#3b82f6',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = 'rgba(59, 130, 246, 0.2)';
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                    title="Edit this question"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteQuestion(q.id);
                    }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: 12,
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
          </div>
        ))
      )}
    </div>
      )}
    </div>
  );
};
