// src/pages/admin/ExamManagementProfessional.js - Professional-Grade Exam Management
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { format, formatDistance, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const statusColors = {
  draft: { bg: '#718096', text: '#ffffff', border: '#4a5568' },
  published: { bg: '#f59e0b', text: '#ffffff', border: '#d97706' },
  active: { bg: '#22c55e', text: '#ffffff', border: '#16a34a' },
  completed: { bg: '#3b82f6', text: '#ffffff', border: '#2563eb' },
  cancelled: { bg: '#ef4444', text: '#ffffff', border: '#dc2626' },
};

const statusIcons = {
  draft: '📝',
  published: '📤',
  active: '🚀',
  completed: '✅',
  cancelled: '❌',
};

export default function ExamManagementProfessional() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedExams, setSelectedExams] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [stats, setStats] = useState({ total: 0, draft: 0, published: 0, active: 0, completed: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, [filter, searchTerm, sortBy, sortOrder]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getExams({ 
        status: filter === 'all' ? undefined : filter, 
        limit: 50,
        search: searchTerm || undefined,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      const examsData = response.data.exams || [];
      setExams(examsData);
      updateStats(examsData);
    } catch (error) {
      toast.error('Failed to load exams');
      console.error('Load exams error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (examsData) => {
    const newStats = {
      total: examsData.length,
      draft: examsData.filter(e => e.status === 'draft').length,
      published: examsData.filter(e => e.status === 'published').length,
      active: examsData.filter(e => e.status === 'active').length,
      completed: examsData.filter(e => e.status === 'completed').length,
    };
    setStats(newStats);
  };

  const filteredAndSortedExams = useMemo(() => {
    let filtered = exams;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(exam => 
        exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.exam_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'created_at' || sortBy === 'date_time') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortBy === 'name') {
        aValue = aValue?.toLowerCase() || '';
        bValue = bValue?.toLowerCase() || '';
      } else if (sortBy === 'status') {
        aValue = aValue || '';
        bValue = bValue || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [exams, searchTerm, sortBy, sortOrder]);

  const handleBulkAction = async (action) => {
    if (selectedExams.length === 0) {
      toast.error('Please select exams first');
      return;
    }

    try {
      const promises = selectedExams.map(examId => {
        switch (action) {
          case 'publish':
            return adminAPI.publishExam(examId);
          case 'delete':
            return adminAPI.deleteExam(examId);
          case 'duplicate':
            return adminAPI.duplicateExam(examId);
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      toast.success(`${action} action completed for ${selectedExams.length} exam(s)`);
      setSelectedExams([]);
      setShowBulkActions(false);
      await fetchExams();
    } catch (error) {
      toast.error(`Failed to ${action} exams`);
      console.error('Bulk action error:', error);
    }
  };

  const handleSelectAll = () => {
    setSelectedExams(filteredAndSortedExams.map(exam => exam.id));
  };

  const handleSelectExam = (examId) => {
    setSelectedExams(prev => 
      prev.includes(examId) 
        ? prev.filter(id => id !== examId)
        : [...prev, examId]
    );
  };

  const handleCreateExam = () => {
    setEditingExam(null);
    setShowCreateModal(true);
  };

  const handleEditExam = (exam) => {
    setEditingExam(exam);
    setShowCreateModal(true);
  };

  const handleSaveExam = async (examData) => {
    try {
      if (editingExam) {
        await adminAPI.updateExam(editingExam.id, examData);
        toast.success('Exam updated successfully');
      } else {
        await adminAPI.createExam(examData);
        toast.success('Exam created successfully');
      }
      setShowCreateModal(false);
      setEditingExam(null);
      await fetchExams();
    } catch (error) {
      toast.error('Failed to save exam');
      console.error('Save exam error:', error);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      try {
        await adminAPI.deleteExam(examId);
        toast.success('Exam deleted successfully');
        await fetchExams();
      } catch (error) {
        toast.error('Failed to delete exam');
        console.error('Delete exam error:', error);
      }
    }
  };

  const getExamTypeIcon = (type) => {
    const icons = {
      'mcq': '📝',
      'coding': '💻',
      'mixed': '📚',
      'essay': '📄',
      'practical': '🔬'
    };
    return icons[type] || '📋';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'easy': '#22c55e',
      'medium': '#f59e0b',
      'hard': '#ef4444'
    };
    return colors[difficulty] || '#6b7280';
  };

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #1e293b 0%, #111827 100%)',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header Section */}
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: '16px', 
          padding: '24px', 
          marginBottom: '24px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: '#ffffff', 
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                📚 Exam Management
              </h1>
              <p style={{ 
                fontSize: '14px', 
                color: '#94a3b8', 
                margin: '8px 0 0 0',
                fontWeight: '400'
              }}>
                Professional exam creation and management system
              </p>
            </div>
            <button
              onClick={handleCreateExam}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                color: '#ffffff',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.25)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
              }}
            >
              + Create New Exam
            </button>
          </div>

          {/* Statistics Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              borderRadius: '12px', 
              padding: '16px',
              textAlign: 'center',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6', marginBottom: '8px' }}>
                {stats.total}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Total Exams
              </div>
            </div>
            <div style={{ 
              background: 'rgba(249, 115, 22, 0.1)', 
              borderRadius: '12px', 
              padding: '16px',
              textAlign: 'center',
              border: '1px solid rgba(249, 115, 22, 0.2)'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b', marginBottom: '8px' }}>
                {stats.draft}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Draft Exams
              </div>
            </div>
            <div style={{ 
              background: 'rgba(34, 197, 94, 0.1)', 
              borderRadius: '12px', 
              padding: '16px',
              textAlign: 'center',
              border: '1px solid rgba(34, 197, 94, 0.2)'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e', marginBottom: '8px' }}>
                {stats.published}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Published Exams
              </div>
            </div>
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              borderRadius: '12px', 
              padding: '16px',
              textAlign: 'center',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb', marginBottom: '8px' }}>
                {stats.active}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Active Exams
              </div>
            </div>
            <div style={{ 
              background: 'rgba(139, 92, 246, 0.1)', 
              borderRadius: '12px', 
              padding: '16px',
              textAlign: 'center',
              border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6', marginBottom: '8px' }}>
                {stats.completed}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Completed Exams
              </div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <input
                type="text"
                placeholder="Search exams by name, code, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: '#ffffff',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="created_at">Created Date</option>
                <option value="name">Name</option>
                <option value="status">Status</option>
                <option value="date_time">Exam Date</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: '#ffffff',
                  outline: 'none'
                }}
              >
                <option value="asc">A-Z</option>
                <option value="desc">Z-A</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['all', 'draft', 'published', 'active', 'completed'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    backgroundColor: filter === f ? statusColors[f].bg : 'transparent',
                    color: filter === f ? statusColors[f].text : '#94a3b8',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedExams.length > 0 && (
          <div style={{ 
            background: 'rgba(59, 130, 246, 0.1)', 
            borderRadius: '12px', 
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#ffffff' }}>
              {selectedExams.length} exam(s) selected
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleBulkAction('publish')}
                style={{
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: '#ffffff',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                📤 Publish
              </button>
              <button
                onClick={() => handleBulkAction('duplicate')}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: '#ffffff',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                📋 Duplicate
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: '#ffffff',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                🗑️ Delete
              </button>
              <button
                onClick={() => {
                  setSelectedExams([]);
                  setShowBulkActions(false);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: '#ffffff',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Select All Checkbox */}
        {filteredAndSortedExams.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontSize: '14px', 
              color: '#ffffff', 
              cursor: 'pointer' 
            }}>
              <input
                type="checkbox"
                checked={selectedExams.length === filteredAndSortedExams.length}
                onChange={handleSelectAll}
                style={{ cursor: 'pointer' }}
              />
              Select All ({selectedExams.length}/{filteredAndSortedExams.length})
            </label>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px', 
          color: '#94a3b8' 
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #3b82f6', 
            borderTop: '4px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>Loading exams...</div>
        </div>
      ) : filteredAndSortedExams.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px', 
          color: '#94a3b8' 
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '16px' }}>
            No exams found
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first exam to get started'}
          </div>
          <button
            onClick={handleCreateExam}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              color: '#ffffff',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Create Your First Exam
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredAndSortedExams.map(exam => (
            <div 
              key={exam.id} 
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                borderRadius: '16px', 
                padding: '20px',
                border: `2px solid ${statusColors[exam.status]?.border || 'rgba(255,255,255,0.1)'}`,
                transition: 'all 0.3s ease',
                position: 'relative',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
              }}
            >
              {/* Selection Checkbox */}
              <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
                <input
                  type="checkbox"
                  checked={selectedExams.includes(exam.id)}
                  onChange={() => handleSelectExam(exam.id)}
                  style={{ cursor: 'pointer' }}
                />
              </div>

              {/* Exam Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h3 style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      color: '#ffffff', 
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {getExamTypeIcon(exam.type)}
                      {exam.name}
                    </h3>
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: '700', 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      background: statusColors[exam.status]?.bg || '#6b7280',
                      color: statusColors[exam.status]?.text || '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {statusIcons[exam.status]} {exam.status?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      📅 {format(new Date(exam.date_time), 'MMM dd, yyyy')}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ⏱️ {exam.duration}m
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      📊 {exam.total_marks || 0}pts
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      📝 {exam.question_count || 0}qs
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      👥 {exam.student_count || 0}sts
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => navigate(`/admin/exams/${exam.id}/questions`)}
                  style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#ffffff',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(59, 130, 246, 0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(59, 130, 246, 0.1)';
                  }}
                >
                  📝 Questions
                </button>
                <button
                  onClick={() => handleEditExam(exam)}
                  style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#ffffff',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(139, 92, 246, 0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(139, 92, 246, 0.1)';
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => navigate(`/admin/exams/${exam.id}/monitor`)}
                  style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#ffffff',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(34, 197, 94, 0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(34, 197, 94, 0.1)';
                  }}
                >
                  🚀 Monitor
                </button>
                <button
                  onClick={() => handleDeleteExam(exam.id)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#ffffff',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>

            {/* Exam Description */}
            {exam.description && (
              <div style={{ 
                fontSize: '14px', 
                color: '#94a3b8', 
                lineHeight: '1.5',
                marginBottom: '16px',
                padding: '12px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                {exam.description}
              </div>
            )}

            {/* Exam Statistics */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
              gap: '12px',
              fontSize: '12px',
              color: '#94a3b8'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                  {exam.question_count || 0}
                </div>
                <div>Questions</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                  {exam.student_count || 0}
                </div>
                <div>Students</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                  {exam.total_marks || 0}
                </div>
                <div>Total Marks</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                  {exam.duration || 0}
                </div>
                <div>Minutes</div>
              </div>
            </div>

            {/* Time Information */}
            {exam.date_time && (
              <div style={{ 
                fontSize: '12px', 
                color: '#64748b', 
                marginTop: '16px',
                padding: '12px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ marginBottom: '8px', fontWeight: '600' }}>Time Information</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    📅 Created: {format(new Date(exam.date_time), 'MMM dd, yyyy HH:mm')}
                  </span>
                  <span>
                    🕐 Duration: {formatDistanceToNow(new Date(exam.date_time), { addSuffix: true })}
                  </span>
                </div>
                {exam.status === 'published' && (
                  <div style={{ marginTop: '8px' }}>
                    <span>
                      🚀 Starts: {formatDistanceToNow(new Date(exam.date_time), { addSuffix: true })}
                    </span>
                  </div>
                )}
                {exam.status === 'active' && (
                  <div style={{ marginTop: '8px' }}>
                    <span>
                      ⏰ Ends: {formatDistanceToNow(new Date(new Date(exam.date_time).getTime() + exam.duration * 60000), { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          ))}
        </div>
      )}
    </div>
  );
};
