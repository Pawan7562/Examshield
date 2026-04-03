// src/pages/admin/Results.js
import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Trophy, 
  Download, 
  Filter, 
  Search, 
  ChevronDown, 
  Send, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  FileText,
  Calendar,
  BarChart3,
  Eye,
  Edit3
} from 'lucide-react';
import '../../components/admin/AdminSidebar.css';

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
  const config = {
    pass: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', label: 'PASS' },
    fail: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'FAIL' },
    pending: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'PENDING' }
  };
  
  const statusConfig = config[status] || config.pending;
  return (
    <span className="admin-status-badge" style={{ 
      background: statusConfig.bg, 
      color: statusConfig.color,
      border: `1px solid ${statusConfig.color}20`
    }}>
      {statusConfig.label}
    </span>
  );
};

const GradeBadge = ({ grade }) => {
  const gradeColors = {
    'A+': { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
    'A': { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
    'B+': { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    'B': { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    'C+': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    'C': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    'D': { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    'F': { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
  };
  
  const config = gradeColors[grade] || gradeColors['F'];
  return (
    <span className="admin-grade-badge" style={{ 
      background: config.bg, 
      color: config.color,
      border: `1px solid ${config.color}20`,
      fontWeight: 700
    }}>
      {grade}
    </span>
  );
};

export default function Results() {
  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminAPI.getExams({ status: 'completed', limit: 100 }).then(r => setExams(r.data.exams || [])).catch(() => {});
    fetchResults();
  }, []);

  const fetchResults = async (examId) => {
    setLoading(true);
    try {
      const r = await adminAPI.getResults({ examId, search: search || undefined });
      setResults(r.data.results || []);
    } catch { 
      toast.error('Failed to load results'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => fetchResults(selectedExam || undefined), 300);
    return () => clearTimeout(timeout);
  }, [search, selectedExam]);

  const publishAllResults = async () => {
    if (!selectedExam) return toast.error('Select an exam first');
    try {
      await adminAPI.publishResults(selectedExam);
      toast.success('Results published and students notified!');
      fetchResults(selectedExam);
    } catch (err) { 
      toast.error(err.message || 'Failed to publish'); 
    }
  };

  const downloadResults = async () => {
    try {
      const response = await adminAPI.downloadResults({ examId: selectedExam });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `results_${selectedExam || 'all'}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Results downloaded successfully');
    } catch (err) {
      toast.error('Failed to download results');
    }
  };

  const getStatistics = () => {
    if (results.length === 0) return null;
    
    const total = results.length;
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const passRate = ((passed / total) * 100).toFixed(1);
    const avgPercentage = (results.reduce((sum, r) => sum + r.percentage, 0) / total).toFixed(1);
    
    return { total, passed, failed, passRate, avgPercentage };
  };

  const stats = getStatistics();

  return (
    <div className="admin-pages-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-header-content">
          <h1 className="admin-page-title">Results Management</h1>
          <p className="admin-page-subtitle">
            {results.length} {results.length === 1 ? 'result' : 'results'} found
          </p>
        </div>
        <div className="admin-header-actions">
          <Button variant="secondary" icon={Download} onClick={downloadResults} disabled={results.length === 0}>
            Export CSV
          </Button>
          {selectedExam && (
            <Button variant="success" icon={Send} onClick={publishAllResults}>
              Publish Results
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="admin-stats-grid">
          <div className="admin-content-card admin-stat-card">
            <div className="admin-stat-header">
              <div className="admin-stat-icon" style={{ background: 'linear-gradient(135deg, #e94560 0%, #9b2335 100%)' }}>
                <Users size={24} />
              </div>
            </div>
            <div className="admin-stat-value">{stats.total}</div>
            <div className="admin-stat-label">Total Students</div>
          </div>
          
          <div className="admin-content-card admin-stat-card">
            <div className="admin-stat-header">
              <div className="admin-stat-icon" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #047857 100%)' }}>
                <CheckCircle size={24} />
              </div>
            </div>
            <div className="admin-stat-value">{stats.passed}</div>
            <div className="admin-stat-label">Passed</div>
          </div>
          
          <div className="admin-content-card admin-stat-card">
            <div className="admin-stat-header">
              <div className="admin-stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                <XCircle size={24} />
              </div>
            </div>
            <div className="admin-stat-value">{stats.failed}</div>
            <div className="admin-stat-label">Failed</div>
          </div>
          
          <div className="admin-content-card admin-stat-card">
            <div className="admin-stat-header">
              <div className="admin-stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                <TrendingUp size={24} />
              </div>
            </div>
            <div className="admin-stat-value">{stats.passRate}%</div>
            <div className="admin-stat-label">Pass Rate</div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="admin-content-card">
        <div className="admin-search-section">
          <div className="admin-search-input">
            <Search size={20} />
            <input
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by student name, roll number, or exam name..."
            />
          </div>
          
          <div className="admin-exam-selector">
            <select 
              value={selectedExam} 
              onChange={e => { setSelectedExam(e.target.value); fetchResults(e.target.value || undefined); }}
              className="admin-form-input"
            >
              <option value="">All Exams</option>
              {exams.map(exam => (
                <option key={exam.id} value={exam.id}>{exam.name}</option>
              ))}
            </select>
            <ChevronDown size={16} className="admin-select-arrow" />
          </div>
          
          <Button variant="secondary" icon={Filter}>
            Filters
          </Button>
        </div>
      </div>

      {/* Results Table */}
      <div className="admin-content-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Exam</th>
                <th>Marks</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th>Status</th>
                <th>Published</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="admin-table-loading">
                    <div className="admin-loading-spinner"></div>
                    Loading results...
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-table-empty">
                    <Trophy size={48} />
                    <h3>No results found</h3>
                    <p>
                      {search ? `No results found for "${search}"` : 'No results available. Results will appear here once exams are completed.'}
                    </p>
                  </td>
                </tr>
              ) : results.map((result, index) => (
                <tr key={result.id}>
                  <td className="admin-student-info">
                    <div className="admin-student-name">{result.student_name}</div>
                    <div className="admin-student-roll">{result.roll_no}</div>
                  </td>
                  <td className="admin-exam-name">
                    <FileText size={14} />
                    {result.exam_name}
                  </td>
                  <td className="admin-marks">
                    <span className="admin-marks-obtained">{result.marks_obtained}</span>
                    <span className="admin-marks-total">/{result.total_marks}</span>
                  </td>
                  <td className="admin-percentage">
                    <div className="admin-percentage-bar">
                      <div 
                        className="admin-percentage-fill" 
                        style={{ width: `${Math.min(result.percentage, 100)}%` }}
                      ></div>
                    </div>
                    <span>{result.percentage}%</span>
                  </td>
                  <td>
                    <GradeBadge grade={result.grade} />
                  </td>
                  <td>
                    <StatusBadge status={result.status} />
                  </td>
                  <td>
                    <span className={`admin-published-status ${result.is_published ? 'published' : 'unpublished'}`}>
                      {result.is_published ? (
                        <>
                          <CheckCircle size={12} />
                          Published
                        </>
                      ) : (
                        <>
                          <XCircle size={12} />
                          Draft
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <Button variant="ghost" size="sm" icon={Eye}>
                        View
                      </Button>
                      <Button variant="ghost" size="sm" icon={Edit3}>
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
