// src/pages/admin/ExamManagement.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Filter, 
  Calendar, 
  Clock, 
  FileText, 
  Users, 
  Trophy, 
  Eye, 
  Edit3, 
  Play, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  MoreVertical,
  BarChart3,
  Monitor,
  Settings
} from 'lucide-react';
import '../../components/admin/AdminSidebar.css';

const statusConfig = {
  draft: { color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', label: 'Draft' },
  published: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'Published' },
  active: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', label: 'Active' },
  completed: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', label: 'Completed' },
  cancelled: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'Cancelled' }
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
  const config = statusConfig[status] || statusConfig.draft;
  return (
    <span className="admin-exam-status-badge" style={{ 
      background: config.bg, 
      color: config.color,
      border: `1px solid ${config.color}20`
    }}>
      {config.label}
    </span>
  );
};

export default function ExamManagement() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchExams = () => {
    setLoading(true);
    adminAPI.getExams({ 
      status: filter === 'all' ? undefined : filter, 
      search: search || undefined,
      limit: 50 
    })
      .then(r => setExams(r.data.exams || []))
      .catch(() => toast.error('Failed to load exams'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { 
    const timeout = setTimeout(() => fetchExams(), 300);
    return () => clearTimeout(timeout);
  }, [filter, search]);

  const publishExam = async (id, name) => {
    try { 
      await adminAPI.publishExam(id); 
      toast.success(`${name} published successfully!`); 
      fetchExams(); 
    }
    catch (err) { 
      toast.error(err.message || 'Failed to publish'); 
    }
  };

  const getExamActions = (exam) => {
    const actions = [];
    
    if (exam.status === 'draft') {
      actions.push({
        label: 'Edit',
        icon: Edit3,
        variant: 'secondary',
        onClick: () => navigate(`/admin/exams/${exam.id}/edit`)
      });
      actions.push({
        label: 'Questions',
        icon: FileText,
        variant: 'secondary',
        onClick: () => navigate(`/admin/exams/${exam.id}/questions`)
      });
      actions.push({
        label: 'Publish',
        icon: CheckCircle,
        variant: 'success',
        onClick: () => publishExam(exam.id, exam.name)
      });
    } else if (exam.status === 'published' || exam.status === 'active') {
      actions.push({
        label: 'Monitor',
        icon: Monitor,
        variant: 'success',
        onClick: () => navigate(`/admin/exams/${exam.id}/monitor`)
      });
      actions.push({
        label: 'Questions',
        icon: FileText,
        variant: 'secondary',
        onClick: () => navigate(`/admin/exams/${exam.id}/questions`)
      });
    } else if (exam.status === 'completed') {
      actions.push({
        label: 'Results',
        icon: Trophy,
        variant: 'secondary',
        onClick: () => navigate(`/admin/exams/${exam.id}/results`)
      });
      actions.push({
        label: 'Analytics',
        icon: BarChart3,
        variant: 'secondary',
        onClick: () => navigate(`/admin/exams/${exam.id}/analytics`)
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
          <Button variant="secondary" icon={Filter}>
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
            exams.map(exam => (
              <div key={exam.id} className="admin-exam-card">
                <div className="admin-exam-header">
                  <div className="admin-exam-title-section">
                    <h3 className="admin-exam-title">{exam.name}</h3>
                    <StatusBadge status={exam.status} />
                  </div>
                  <div className="admin-exam-actions">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      icon={MoreVertical}
                      className="admin-exam-menu-btn"
                    >
                      More
                    </Button>
                  </div>
                </div>

                <div className="admin-exam-details">
                  <div className="admin-exam-meta">
                    <div className="admin-exam-meta-item">
                      <Calendar size={14} />
                      {format(new Date(exam.date_time), 'dd MMM yyyy, HH:mm')}
                    </div>
                    <div className="admin-exam-meta-item">
                      <Clock size={14} />
                      {exam.duration} minutes
                    </div>
                    <div className="admin-exam-meta-item">
                      <Trophy size={14} />
                      {exam.total_marks} marks
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
                    {exam.type?.toUpperCase()}
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
