// src/pages/admin/QuestionDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function QuestionDetail() {
  const { id, questionId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestion();
  }, [id, questionId]);

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      // Get all questions for the exam and find the specific one
      const response = await adminAPI.getExamQuestions(id);
      const questions = response.data.questions || [];
      const foundQuestion = questions.find(q => q.id === questionId);
      
      if (foundQuestion) {
        setQuestion(foundQuestion);
      } else {
        toast.error('Question not found');
        navigate(`/admin/exams/${id}/questions`);
      }
    } catch (error) {
      toast.error('Failed to load question');
      console.error('Load question error:', error);
      navigate(`/admin/exams/${id}/questions`);
    } finally {
      setLoading(false);
    }
  };

  const renderOptions = (question) => {
    if (!question.options) return null;
    
    try {
      const options = typeof question.options === 'string' 
        ? JSON.parse(question.options) 
        : question.options;
      
      return options.map((opt, index) => (
        <div key={opt.id || index} style={{ 
          fontSize: 14, 
          padding: '10px 15px', 
          borderRadius: 8, 
          background: question.correct_answer === (opt.id || index) ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', 
          color: question.correct_answer === (opt.id || index) ? '#22c55e' : '#e2e8f0', 
          border: `1px solid ${question.correct_answer === (opt.id || index) ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
          marginBottom: 8
        }}>
          <strong>{(opt.id || String.fromCharCode(65 + index)).toUpperCase()}.</strong> {opt.text} {question.correct_answer === (opt.id || index) && '✓'}
        </div>
      ));
    } catch (error) {
      console.error('Error parsing options:', error);
      return <div style={{ color: '#ef4444', fontSize: 14 }}>Error loading options</div>;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#4a5568' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
        <div>Loading question...</div>
      </div>
    );
  }

  if (!question) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#4a5568' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>❓</div>
        <p>No Question Found</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>Question Details</h1>
        <button
          onClick={() => navigate(`/admin/exams/${id}/questions`)}
          style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#3b82f6',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(59, 130, 246, 0.2)';
            e.target.style.borderColor = 'rgba(59, 130, 246, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(59, 130, 246, 0.1)';
            e.target.style.borderColor = 'rgba(59, 130, 246, 0.3)';
          }}
        >
          ← Back to Questions
        </button>
      </div>

      <div style={{ 
        background: 'rgba(255,255,255,0.02)', 
        border: '1px solid rgba(255,255,255,0.06)', 
        borderRadius: 12, 
        padding: '24px',
        marginBottom: 20
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ 
              fontSize: 12, 
              fontWeight: 700, 
              color: question.type === 'mcq' ? '#e94560' : question.type === 'subjective' ? '#8b5cf6' : question.type === 'coding' ? '#06b6d4' : '#10b981' 
            }}>
              {question.type?.toUpperCase()} · {question.marks || 1} marks
            </span>
            <span style={{ fontSize: 11, color: '#4a5568' }}>
              Question ID: {question.id}
            </span>
          </div>
        </div>

        <div style={{ 
          fontSize: 16, 
          color: '#e2e8f0', 
          lineHeight: 1.6, 
          marginBottom: 20,
          padding: '16px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          {question.question_text}
        </div>

        {renderOptions(question)}

        {question.code_template && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 14, color: '#8b5cf6', marginBottom: 8, fontWeight: 600 }}>Code Template:</div>
            <pre style={{ 
              background: 'rgba(0,0,0,0.4)', 
              padding: 16, 
              borderRadius: 8, 
              fontSize: 13, 
              color: '#e2e8f0', 
              overflow: 'auto',
              maxHeight: '300px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              {question.code_template}
            </pre>
          </div>
        )}

        <div style={{ marginTop: 20, padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Question Metadata:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div>
              <span style={{ fontSize: 11, color: '#6b7280' }}>Type:</span>
              <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{question.type?.toUpperCase()}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#6b7280' }}>Marks:</span>
              <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{question.marks || 1}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: '#6b7280' }}>Order:</span>
              <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{question.order_index || 0}</div>
            </div>
            {question.time_limit && (
              <div>
                <span style={{ fontSize: 11, color: '#6b7280' }}>Time Limit:</span>
                <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{question.time_limit}s</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
