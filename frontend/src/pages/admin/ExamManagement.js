// src/pages/admin/ExamManagement.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { formatIST } from '../../utils/timezone';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Filter, 
  Calendar, 
  Clock, 
  FileText, 
  Users, 
  Trophy, 
  Edit3, 
  CheckCircle,
  Search,
  MoreVertical,
  BarChart3,
  Monitor,
  X,
  Save,
  BookOpen
} from 'lucide-react';
import '../../components/admin/AdminSidebar.css';

const statusConfig = {
  draft: { color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)', label: 'Draft' },
  published: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', label: 'Published' },
  active: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)', label: 'Active' },
  completed: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', label: 'Completed' },
  cancelled: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', label: 'Cancelled' }
};

const Button = ({ children, variant = 'primary', size = 'md', icon: Icon, loading, ...props }) => {
  return (
    <button 
      {...props} 
      className={`admin-btn admin-btn-${variant} admin-btn-${size} ${loading ? 'loading' : ''}`}
      disabled={loading || props.disabled}
    >
      {loading ? (
        <div className="admin-btn-spinner"></div>
      ) : (
        <>
          {Icon && <Icon size={16} />}
          {children}
        </>
      )}
    </button>
  );
};

const StatusBadge = ({ status }) => {
  const normalized = (status || 'draft').toLowerCase();
  const config = statusConfig[normalized] || statusConfig.draft;
  return (
    <span className="admin-exam-status-badge" style={{ 
      background: config.bg, 
      color: config.color,
      border: `1px solid ${config.color}30`,
      fontWeight: 700,
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.04em'
    }}>
      {config.label}
    </span>
  );
};

export default function ExamManagement() {
  const [exams, setExams] = useState(() => {
    try {
      const cached = sessionStorage.getItem('cached_admin_exams');
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [loading, setLoading] = useState(exams.length === 0);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState({
    open: false,
    exam: null,
    title: '',
    description: '',
    duration: 60,
    total_marks: 100,
    passing_marks: 40,
    type: 'coding',
    status: 'draft',
    saving: false
  });

  const navigate = useNavigate();

  const fetchExams = (isBackground = false) => {
    if (!isBackground) setLoading(true);
    adminAPI.getExams({ 
      status: filter === 'all' ? undefined : filter, 
      search: search || undefined,
      limit: 50 
    })
      .then(r => {
        const data = r.data.exams || [];
        setExams(data);
        try { sessionStorage.setItem('cached_admin_exams', JSON.stringify(data)); } catch (_) {}
      })
      .catch(() => toast.error('Failed to load exams'))
      .finally(() => setLoading(false));
  };

  // Immediate fetch on mount or filter change
  useEffect(() => {
    fetchExams(exams.length > 0);
  }, [filter]);

  // Debounced only for search keystrokes
  useEffect(() => {
    if (!search) return;
    const timeout = setTimeout(() => fetchExams(false), 250);
    return () => clearTimeout(timeout);
  }, [search]);

  const publishExam = async (id, name) => {
    try { 
      await adminAPI.publishExam(id); 
      toast.success(`${name || 'Exam'} published successfully!`); 
      fetchExams(); 
    }
    catch (err) { 
      toast.error(err.response?.data?.message || err.message || 'Failed to publish'); 
    }
  };

  const handleOpenEdit = (exam) => {
    setEditModal({
      open: true,
      exam,
      title: exam.title || exam.name || '',
      description: exam.description || '',
      duration: exam.duration || 60,
      total_marks: exam.total_marks || 100,
      passing_marks: exam.passing_marks || 40,
      type: exam.type || 'coding',
      status: exam.status || 'draft',
      saving: false
    });
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    if (!editModal.exam) return;

    if (!editModal.title.trim()) {
      return toast.error('Exam title is required');
    }

    setEditModal(prev => ({ ...prev, saving: true }));
    try {
      const payload = {
        title: editModal.title.trim(),
        name: editModal.title.trim(),
        description: editModal.description.trim(),
        duration: parseInt(editModal.duration) || 60,
        total_marks: parseInt(editModal.total_marks) || 100,
        passing_marks: parseInt(editModal.passing_marks) || 40,
        type: editModal.type,
        status: editModal.status
      };

      await adminAPI.updateExam(editModal.exam.id, payload);

      // Update in state immediately
      setExams(prev => prev.map(item => {
        if (item.id === editModal.exam.id) {
          return {
            ...item,
            ...payload
          };
        }
        return item;
      }));

      // Update cache
      try {
        const cached = sessionStorage.getItem('cached_admin_exams');
        if (cached) {
          const list = JSON.parse(cached);
          const updated = list.map(item => item.id === editModal.exam.id ? { ...item, ...payload } : item);
          sessionStorage.setItem('cached_admin_exams', JSON.stringify(updated));
        }
      } catch (_) {}

      toast.success('Exam details updated successfully');
      setEditModal({ open: false, exam: null, title: '', description: '', duration: 60, total_marks: 100, passing_marks: 40, type: 'coding', status: 'draft', saving: false });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Failed to update exam');
      setEditModal(prev => ({ ...prev, saving: false }));
    }
  };

  const getExamActions = (exam) => {
    const actions = [];
    const examTitle = exam.title || exam.name || 'Exam';
    
    // Always offer Edit & Questions
    actions.push({
      label: 'Edit',
      icon: Edit3,
      variant: 'secondary',
      onClick: () => handleOpenEdit(exam)
    });

    actions.push({
      label: 'Questions',
      icon: FileText,
      variant: 'secondary',
      onClick: () => navigate(`/admin/exams/${exam.id}/questions`)
    });

    if (exam.status === 'draft') {
      actions.push({
        label: 'Publish',
        icon: CheckCircle,
        variant: 'success',
        onClick: () => publishExam(exam.id, examTitle)
      });
    } else if (exam.status === 'published' || exam.status === 'active') {
      actions.push({
        label: 'Monitor',
        icon: Monitor,
        variant: 'success',
        onClick: () => navigate(`/admin/exams/${exam.id}/monitor`)
      });
    } else if (exam.status === 'completed') {
      actions.push({
        label: 'Results',
        icon: Trophy,
        variant: 'secondary',
        onClick: () => navigate(`/admin/results`)
      });
      actions.push({
        label: 'Analytics',
        icon: BarChart3,
        variant: 'secondary',
        onClick: () => navigate(`/admin/dashboard`)
      });
    }
    
    return actions;
  };

  return (
    <div className="admin-pages-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-header-content">
          <h1 className="admin-page-title">Exam Management</h1>
          <p className="admin-page-subtitle">
            {exams.length} {exams.length === 1 ? 'exam' : 'exams'} total
          </p>
        </div>
        <div className="admin-header-actions">
          <Button icon={Plus} onClick={() => navigate('/admin/exams/create')}>
            Create Exam
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="admin-content-card">
        <div className="admin-search-section">
          <div className="admin-search-input">
            <Search size={20} />
            <input
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by exam name, type, or status..."
            />
          </div>
          <Button variant="secondary" icon={Filter} onClick={() => fetchExams(false)}>
            Filters
          </Button>
        </div>

        {/* Status Filters */}
        <div className="admin-filters-section">
          <div className="admin-filter-label">Status:</div>
          <div className="admin-filter-pills">
            {['all', 'draft', 'published', 'active', 'completed'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`admin-filter-pill ${filter === status ? 'active' : ''}`}
              >
                {status === 'all' ? 'All' : statusConfig[status]?.label || status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Exams List */}
      <div className="admin-content-card">
        <div className="admin-exams-list">
          {loading ? (
            <div className="admin-table-loading">
              <div className="admin-loading-spinner"></div>
              Loading exams...
            </div>
          ) : exams.length === 0 ? (
            <div className="admin-empty-state">
              <FileText size={48} />
              <h3>No exams found</h3>
              <p>
                {search ? `No exams found for "${search}"` : 'No exams yet. Create your first exam to get started.'}
              </p>
              {!search && (
                <Button icon={Plus} onClick={() => navigate('/admin/exams/create')}>
                  Create First Exam
                </Button>
              )}
            </div>
          ) : (
            exams.map(exam => {
              const examTitle = exam.title || exam.name || 'Untitled Exam';
              return (
                <div key={exam.id} className="admin-exam-card">
                  <div className="admin-exam-header">
                    <div className="admin-exam-title-section">
                      <h3 className="admin-exam-title">{examTitle}</h3>
                      <StatusBadge status={exam.status} />
                    </div>
                    <div className="admin-exam-actions">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        icon={MoreVertical}
                        className="admin-exam-menu-btn"
                        onClick={() => handleOpenEdit(exam)}
                      >
                        More
                      </Button>
                    </div>
                  </div>

                  <div className="admin-exam-details">
                    <div className="admin-exam-meta">
                      <div className="admin-exam-meta-item">
                        <Calendar size={14} />
                        {exam.date_time ? formatIST(exam.date_time, 'dateTime') : 'Scheduled anytime'}
                      </div>
                      <div className="admin-exam-meta-item">
                        <Clock size={14} />
                        {exam.duration || 60} minutes
                      </div>
                      <div className="admin-exam-meta-item">
                        <Trophy size={14} />
                        {exam.total_marks || 100} marks
                      </div>
                      <div className="admin-exam-meta-item">
                        <FileText size={14} />
                        {exam.question_count || 0} questions
                      </div>
                      <div className="admin-exam-meta-item">
                        <Users size={14} />
                        {exam.student_count || 0} students
                      </div>
                    </div>
                    <div className="admin-exam-type">
                      {(exam.type || 'coding').toUpperCase()}
                    </div>
                  </div>

                  <div className="admin-exam-footer">
                    <div className="admin-exam-description">
                      {exam.description || 'No description provided'}
                    </div>
                    <div className="admin-exam-action-buttons">
                      {getExamActions(exam).map((action, index) => (
                        <Button
                          key={index}
                          variant={action.variant}
                          size="sm"
                          icon={action.icon}
                          onClick={action.onClick}
                          className="admin-exam-action-btn"
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* EDIT EXAM MODAL */}
      {editModal.open && editModal.exam && (
        <div className="admin-modal-overlay" onClick={() => !editModal.saving && setEditModal(prev => ({ ...prev, open: false }))}>
          <div 
            className="admin-modal" 
            style={{ maxWidth: 580, borderRadius: 16 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="admin-modal-header" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(10, 116, 218, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a74da' }}>
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 className="admin-modal-title" style={{ fontSize: '1.15rem' }}>Edit Exam Details</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Update exam title, duration, marks, and settings</p>
                </div>
              </div>
              <button 
                onClick={() => !editModal.saving && setEditModal(prev => ({ ...prev, open: false }))} 
                className="admin-modal-close"
                disabled={editModal.saving}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExam}>
              <div className="admin-modal-content" style={{ padding: '24px 28px' }}>
                {/* Title */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                    Exam Title *
                  </label>
                  <input 
                    type="text" 
                    value={editModal.title}
                    onChange={e => setEditModal(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Full Stack & Cybersecurity Examination"
                    required
                    className="admin-form-input"
                    style={{ fontWeight: 600 }}
                  />
                </div>

                {/* Description */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                    Description
                  </label>
                  <textarea 
                    value={editModal.description}
                    onChange={e => setEditModal(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description or instructions for the exam..."
                    rows={3}
                    className="admin-form-input"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Duration & Type row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                      Duration (Minutes)
                    </label>
                    <input 
                      type="number" 
                      min="5" 
                      max="600"
                      value={editModal.duration}
                      onChange={e => setEditModal(prev => ({ ...prev, duration: e.target.value }))}
                      className="admin-form-input"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                      Exam Type
                    </label>
                    <select 
                      value={editModal.type}
                      onChange={e => setEditModal(prev => ({ ...prev, type: e.target.value }))}
                      className="admin-form-input"
                      style={{ fontWeight: 600 }}
                    >
                      <option value="coding">Coding Assessment</option>
                      <option value="mcq">Multiple Choice (MCQ)</option>
                      <option value="hybrid">Hybrid (Coding + MCQ)</option>
                      <option value="subjective">Subjective / Written</option>
                    </select>
                  </div>
                </div>

                {/* Marks row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                      Total Marks
                    </label>
                    <input 
                      type="number" 
                      min="1" 
                      max="1000"
                      value={editModal.total_marks}
                      onChange={e => setEditModal(prev => ({ ...prev, total_marks: e.target.value }))}
                      className="admin-form-input"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                      Passing Marks
                    </label>
                    <input 
                      type="number" 
                      min="1" 
                      max={editModal.total_marks || 1000}
                      value={editModal.passing_marks}
                      onChange={e => setEditModal(prev => ({ ...prev, passing_marks: e.target.value }))}
                      className="admin-form-input"
                      required
                    />
                  </div>
                </div>

                {/* Status */}
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                    Exam Lifecycle Status
                  </label>
                  <select 
                    value={editModal.status}
                    onChange={e => setEditModal(prev => ({ ...prev, status: e.target.value }))}
                    className="admin-form-input"
                    style={{ fontWeight: 600 }}
                  >
                    <option value="draft">Draft (Not yet visible to candidates)</option>
                    <option value="published">Published (Ready for students)</option>
                    <option value="active">Active (Ongoing exam window)</option>
                    <option value="completed">Completed (Evaluation ready)</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div style={{ 
                padding: '16px 28px', 
                background: '#f8fafc', 
                borderTop: '1px solid #e2e8f0', 
                display: 'flex', 
                justifyContent: 'flex-end',
                gap: 12
              }}>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="md" 
                  disabled={editModal.saving}
                  onClick={() => setEditModal(prev => ({ ...prev, open: false }))}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  variant="primary" 
                  size="md" 
                  icon={Save}
                  loading={editModal.saving}
                >
                  Save Exam Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
