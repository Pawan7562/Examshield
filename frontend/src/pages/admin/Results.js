// src/pages/admin/Results.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
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
  TrendingUp,
  Users,
  FileText,
  Eye,
  Edit3,
  X,
  Save,
  Printer,
  User,
  Award,
  Clock,
  BookOpen,
  RotateCcw,
  Check,
  Shield,
  AlertCircle
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
  const normalizedStatus = (status || 'pending').toLowerCase();
  const config = {
    pass: { color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)', label: 'PASS' },
    fail: { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)', label: 'FAIL' },
    pending: { color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)', label: 'PENDING' }
  };
  
  const statusConfig = config[normalizedStatus] || config.pending;
  return (
    <span className="admin-status-badge" style={{ 
      background: statusConfig.bg, 
      color: statusConfig.color,
      border: `1px solid ${statusConfig.color}30`,
      fontWeight: 700,
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '0.75rem',
      letterSpacing: '0.04em'
    }}>
      {statusConfig.label}
    </span>
  );
};

const GradeBadge = ({ grade }) => {
  const gradeColors = {
    'A+': { color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)' },
    'A': { color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)' },
    'B+': { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)' },
    'B': { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)' },
    'C+': { color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)' },
    'C': { color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)' },
    'D': { color: '#ea580c', bg: 'rgba(234, 88, 12, 0.12)' },
    'F': { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)' }
  };
  
  const displayGrade = grade || '—';
  const config = gradeColors[grade] || { color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' };
  return (
    <span className="admin-grade-badge" style={{ 
      background: config.bg, 
      color: config.color,
      border: `1px solid ${config.color}30`,
      fontWeight: 800,
      padding: '3px 8px',
      borderRadius: '6px',
      fontSize: '0.8rem'
    }}>
      {displayGrade}
    </span>
  );
};

export default function Results() {
  const { user } = useAuth();
  const collegeId = user?.id || '';
  const storageKey = collegeId ? `cached_admin_results_${collegeId}` : null;

  const [results, setResults] = useState(() => {
    try {
      if (!storageKey) return [];
      const cached = sessionStorage.getItem(storageKey);
      return cached ? JSON.parse(cached) : [];
    } catch (_) {
      return [];
    }
  });
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [loading, setLoading] = useState(() => {
    try {
      if (!storageKey) return true;
      const cached = sessionStorage.getItem(storageKey);
      const parsed = cached ? JSON.parse(cached) : [];
      return !parsed || parsed.length === 0;
    } catch (_) {
      return true;
    }
  });
  const [search, setSearch] = useState('');

  const fetchResults = async (examId, showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const r = await adminAPI.getResults({ examId }, { bypassCache: true });
      const raw = r.data || r;
      const list = raw.results || raw.data?.results || (Array.isArray(raw) ? raw : []);
      setResults(list);
      if (storageKey) {
        sessionStorage.setItem(storageKey, JSON.stringify(list));
      }
    } catch (err) { 
      console.error('fetchResults error:', err);
      toast.error('Failed to load results'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    adminAPI.getExams({ limit: 100 })
      .then(r => {
        const raw = r.data || r;
        const examList = raw.exams || raw.data?.exams || (Array.isArray(raw) ? raw : []);
        setExams(examList);
      })
      .catch(() => {});
    fetchResults(selectedExam || undefined, results.length === 0);
  }, []);

  // Modal states
  const [viewModal, setViewModal] = useState({ open: false, result: null });
  const [editModal, setEditModal] = useState({ 
    open: false, 
    result: null, 
    marks: '', 
    status: 'pass', 
    grade: 'A', 
    saving: false 
  });
  const [submissionModal, setSubmissionModal] = useState({
    open: false,
    loading: false,
    resultId: null,
    data: null,
    activeTab: 'all',
    reevaluating: false,
    editingMarks: {},
    editingRemarks: {},
    savingAnswerId: null
  });

  const handleOpenSubmission = async (result) => {
    setSubmissionModal({
      open: true,
      loading: true,
      resultId: result.id,
      data: null,
      activeTab: 'all',
      reevaluating: false,
      editingMarks: {},
      editingRemarks: {},
      savingAnswerId: null
    });

    try {
      const res = await adminAPI.getSubmission(result.id);
      const payload = res.data?.data || res.data;
      if (payload && payload.questions) {
        // Preload any marks and remarks into editing states
        const marksInit = {};
        const remarksInit = {};
        payload.questions.forEach(q => {
          if (q.answer?.id) {
            marksInit[q.answer.id] = q.answer.marks_obtained !== null ? q.answer.marks_obtained : '';
            remarksInit[q.answer.id] = q.answer.evaluator_remarks || '';
          }
        });

        setSubmissionModal(prev => ({
          ...prev,
          loading: false,
          data: payload,
          editingMarks: marksInit,
          editingRemarks: remarksInit
        }));
      } else {
        toast.error('Submission copy not found');
        setSubmissionModal(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load candidate answer sheet');
      setSubmissionModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleReevaluateSubmission = async (resultId) => {
    setSubmissionModal(prev => ({ ...prev, reevaluating: true }));
    try {
      await adminAPI.reevaluateResult(resultId);
      toast.success('Exam answers re-evaluated successfully with updated auto-marking!');
      const res = await adminAPI.getSubmission(resultId);
      const payload = res.data?.data || res.data;
      if (payload) {
        setSubmissionModal(prev => ({
          ...prev,
          data: payload,
          reevaluating: false
        }));
      }
      fetchResults(selectedExam, true);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Re-evaluation failed');
      setSubmissionModal(prev => ({ ...prev, reevaluating: false }));
    }
  };

  const handleSaveManualAnswerMarks = async (answerId, questionType) => {
    if (!answerId) return toast.error('No answer record found for this question');
    const marks = submissionModal.editingMarks[answerId];
    const remarks = submissionModal.editingRemarks[answerId] || '';

    try {
      setSubmissionModal(prev => ({ ...prev, savingAnswerId: answerId }));
      await adminAPI.evaluateResult(submissionModal.resultId, {
        evaluations: [{
          answerId,
          marksObtained: parseFloat(marks) || 0,
          remarks: remarks
        }]
      });
      toast.success('Marks updated successfully!');
      const res = await adminAPI.getSubmission(submissionModal.resultId);
      const payload = res.data?.data || res.data;
      if (payload) {
        setSubmissionModal(prev => ({
          ...prev,
          data: payload,
          savingAnswerId: null
        }));
      }
      fetchResults(selectedExam, true);
    } catch (err) {
      toast.error('Failed to update marks');
      setSubmissionModal(prev => ({ ...prev, savingAnswerId: null }));
    }
  };

  const handleBatchReevaluateExam = async () => {
    if (!selectedExam) return toast.error('Select an exam first');
    try {
      setLoading(true);
      const res = await adminAPI.reevaluateExam(selectedExam);
      toast.success(res.data?.message || 'Exam submissions re-evaluated successfully!');
      fetchResults(selectedExam, false);
    } catch (err) {
      toast.error('Batch re-evaluation failed');
    } finally {
      setLoading(false);
    }
  };

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

  const downloadResults = () => {
    try {
      if (!results || results.length === 0) {
        return toast.error('No results to export');
      }
      const headers = ['Student Name', 'Roll No', 'Email', 'Exam Title', 'Marks Obtained', 'Total Marks', 'Percentage', 'Grade', 'Status', 'Published', 'Submitted At'];
      const csvRows = [headers.join(',')];

      results.forEach(r => {
        const row = [
          `"${(r.student_name || '').replace(/"/g, '""')}"`,
          `"${(r.roll_no || '').replace(/"/g, '""')}"`,
          `"${(r.email || '').replace(/"/g, '""')}"`,
          `"${(r.exam_name || r.exam_title || 'Examination').replace(/"/g, '""')}"`,
          r.marks_obtained || 0,
          r.total_marks || 100,
          `${r.percentage || 0}%`,
          `"${r.grade || 'N/A'}"`,
          `"${(r.status || 'pending').toUpperCase()}"`,
          r.is_published ? 'Published' : 'Draft',
          `"${r.submitted_at ? new Date(r.submitted_at).toLocaleString() : 'N/A'}"`
        ];
        csvRows.push(row.join(','));
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `results_${selectedExam ? 'exam' : 'all'}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Results exported successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export CSV');
    }
  };

  const getStatistics = () => {
    if (results.length === 0) return null;
    
    const total = results.length;
    const passed = results.filter(r => (r.status || '').toLowerCase() === 'pass').length;
    const failed = results.filter(r => (r.status || '').toLowerCase() === 'fail').length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
    
    return { total, passed, failed, passRate };
  };

  const stats = getStatistics();

  // Open Edit Modal with prefilled values
  const handleOpenEdit = (result) => {
    const marks = result.marks_obtained !== undefined ? parseFloat(result.marks_obtained) : 0;
    const total = parseFloat(result.total_marks) || 100;
    const pct = total > 0 ? (marks / total) * 100 : 0;
    
    let grade = result.grade;
    if (!grade) {
      if (pct >= 90) grade = 'A+';
      else if (pct >= 80) grade = 'A';
      else if (pct >= 70) grade = 'B+';
      else if (pct >= 60) grade = 'B';
      else if (pct >= 50) grade = 'C';
      else grade = 'F';
    }

    setEditModal({
      open: true,
      result,
      marks: marks,
      status: result.status || (pct >= 40 ? 'pass' : 'fail'),
      grade: grade,
      saving: false
    });
  };

  // Handle Marks input change with automatic status & grade recommendations
  const handleMarksChange = (value) => {
    const num = parseFloat(value);
    const total = parseFloat(editModal.result?.total_marks) || 100;
    let newStatus = editModal.status;
    let newGrade = editModal.grade;

    if (!isNaN(num)) {
      const pct = (num / total) * 100;
      newStatus = pct >= 40 ? 'pass' : 'fail';
      if (pct >= 90) newGrade = 'A+';
      else if (pct >= 80) newGrade = 'A';
      else if (pct >= 70) newGrade = 'B+';
      else if (pct >= 60) newGrade = 'B';
      else if (pct >= 50) newGrade = 'C';
      else newGrade = 'F';
    }

    setEditModal(prev => ({
      ...prev,
      marks: value,
      status: newStatus,
      grade: newGrade
    }));
  };

  // Save updated result
  const handleSaveResult = async (e) => {
    e.preventDefault();
    if (!editModal.result) return;

    const numMarks = parseFloat(editModal.marks);
    if (isNaN(numMarks) || numMarks < 0) {
      return toast.error('Please enter a valid positive score');
    }

    const total = parseFloat(editModal.result.total_marks) || 100;
    if (numMarks > total) {
      return toast.error(`Marks cannot exceed exam total (${total})`);
    }

    const calculatedPct = Math.round((numMarks / total) * 100 * 10) / 10;

    setEditModal(prev => ({ ...prev, saving: true }));
    try {
      await adminAPI.updateResult(editModal.result.id, {
        marks_obtained: numMarks,
        status: editModal.status,
        grade: editModal.grade
      });

      // Update in-memory state immediately
      setResults(prev => prev.map(item => {
        if (item.id === editModal.result.id) {
          return {
            ...item,
            marks_obtained: numMarks.toFixed(2),
            percentage: calculatedPct.toFixed(2),
            status: editModal.status,
            grade: editModal.grade
          };
        }
        return item;
      }));

      // Update cached session storage
      try {
        const cached = sessionStorage.getItem('cached_admin_results');
        if (cached) {
          const list = JSON.parse(cached);
          const updated = list.map(item => item.id === editModal.result.id ? {
            ...item,
            marks_obtained: numMarks.toFixed(2),
            percentage: calculatedPct.toFixed(2),
            status: editModal.status,
            grade: editModal.grade
          } : item);
          sessionStorage.setItem('cached_admin_results', JSON.stringify(updated));
        }
      } catch (_) {}

      toast.success('Student result updated successfully');
      setEditModal({ open: false, result: null, marks: '', status: 'pass', grade: 'A', saving: false });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Failed to update result');
      setEditModal(prev => ({ ...prev, saving: false }));
    }
  };

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
          {selectedExam && (
            <Button 
              variant="secondary" 
              icon={RotateCcw} 
              onClick={handleBatchReevaluateExam}
              title="Re-run automatic evaluation on all submitted answer copies for this exam"
            >
              Re-evaluate All
            </Button>
          )}
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
              <div className="admin-stat-icon" style={{ background: 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)' }}>
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
                <option key={exam.id} value={exam.id}>
                  {exam.title || exam.name || 'Examination'}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="admin-select-arrow" />
          </div>
          
          <Button variant="secondary" icon={Filter} onClick={() => fetchResults(selectedExam, false)}>
            Refresh
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
              ) : results.map((result) => (
                <tr key={result.id}>
                  <td className="admin-student-info">
                    <div className="admin-student-name" style={{ fontWeight: 700, color: '#0f172a' }}>
                      {result.student_name}
                    </div>
                    <div className="admin-student-roll" style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {result.roll_no}
                    </div>
                  </td>
                  <td className="admin-exam-name">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#1e293b', fontWeight: 600 }}>
                      <FileText size={16} style={{ color: '#0a74da', flexShrink: 0 }} />
                      <span>{result.exam_name || result.exam_title || 'Examination'}</span>
                    </div>
                  </td>
                  <td className="admin-marks">
                    <span className="admin-marks-obtained" style={{ fontWeight: 700, color: '#0f172a' }}>
                      {result.marks_obtained !== undefined ? parseFloat(result.marks_obtained).toFixed(2) : '0.00'}
                    </span>
                    <span className="admin-marks-total" style={{ color: '#64748b', fontSize: '0.85rem' }}>
                      /{result.total_marks || 100}
                    </span>
                  </td>
                  <td className="admin-percentage">
                    <div className="admin-percentage-bar">
                      <div 
                        className="admin-percentage-fill" 
                        style={{ 
                          width: `${Math.min(parseFloat(result.percentage) || 0, 100)}%`,
                          background: (result.status === 'pass' || (parseFloat(result.percentage) >= 40)) ? '#22c55e' : '#ef4444'
                        }}
                      ></div>
                    </div>
                    <span style={{ fontWeight: 600 }}>
                      {result.percentage !== undefined ? parseFloat(result.percentage).toFixed(2) : '0.00'}%
                    </span>
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
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        icon={FileText}
                        onClick={() => handleOpenSubmission(result)}
                        title="View Candidate Submitted Answer Copy & Answers"
                        style={{ color: '#4f46e5', borderColor: '#c7d2fe', background: '#eef2ff' }}
                      >
                        Copy
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        icon={Eye}
                        onClick={() => setViewModal({ open: true, result })}
                        title="View Scorecard"
                      >
                        View
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        icon={Edit3}
                        onClick={() => handleOpenEdit(result)}
                        title="Edit Marks and Status"
                      >
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

      {/* VIEW SCORECARD MODAL */}
      {viewModal.open && viewModal.result && (
        <div className="admin-modal-overlay" onClick={() => setViewModal({ open: false, result: null })}>
          <div 
            className="admin-modal" 
            style={{ maxWidth: 650, borderRadius: 16 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="admin-modal-header" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(10, 116, 218, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a74da' }}>
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="admin-modal-title" style={{ fontSize: '1.15rem' }}>Student Scorecard</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Detailed exam evaluation record</p>
                </div>
              </div>
              <button 
                onClick={() => setViewModal({ open: false, result: null })} 
                className="admin-modal-close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-content" style={{ padding: '24px 28px' }}>
              {/* Student Bio Card */}
              <div style={{ 
                background: 'linear-gradient(135deg, #0b1329 0%, #1e293b 100%)', 
                borderRadius: 14, 
                padding: '20px 24px', 
                color: '#ffffff',
                marginBottom: 20,
                boxShadow: '0 4px 16px rgba(11, 19, 41, 0.15)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <User size={18} style={{ color: '#38bdf8' }} />
                      <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                        {viewModal.result.student_name}
                      </h4>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8, fontSize: '0.85rem', color: '#cbd5e1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#94a3b8' }}>Roll:</span>
                        <strong style={{ color: '#ffffff' }}>{viewModal.result.roll_no}</strong>
                      </div>
                      {viewModal.result.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#94a3b8' }}>Email:</span>
                          <span>{viewModal.result.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={viewModal.result.status} />
                </div>
              </div>

              {/* Exam Info Row */}
              <div style={{ 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderRadius: 12, 
                padding: '14px 18px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <BookOpen size={18} style={{ color: '#0a74da' }} />
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Examination</span>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                      {viewModal.result.exam_name || viewModal.result.exam_title || 'Examination'}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Status</span>
                  <div>
                    <GradeBadge grade={viewModal.result.grade} />
                  </div>
                </div>
              </div>

              {/* Performance Key Metrics Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: 14, 
                marginBottom: 20 
              }}>
                <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Marks Obtained</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0a74da' }}>
                    {viewModal.result.marks_obtained !== undefined ? parseFloat(viewModal.result.marks_obtained).toFixed(2) : '0.00'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>Out of {viewModal.result.total_marks || 100}</div>
                </div>

                <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Percentage</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>
                    {viewModal.result.percentage !== undefined ? parseFloat(viewModal.result.percentage).toFixed(2) : '0.00'}%
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
                    Passing: {viewModal.result.exam_passing_marks || '40%'}
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Result Grade</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: (viewModal.result.status === 'pass' || parseFloat(viewModal.result.percentage) >= 40) ? '#16a34a' : '#dc2626' }}>
                    {viewModal.result.grade || '—'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>Performance band</div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16, marginBottom: 20 }}>
                <h5 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Sectional Breakdown
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>MCQ Marks</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                      {viewModal.result.mcq_marks !== null && viewModal.result.mcq_marks !== undefined ? parseFloat(viewModal.result.mcq_marks).toFixed(2) : '—'}
                    </div>
                  </div>
                  <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Subjective</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                      {viewModal.result.subjective_marks !== null && viewModal.result.subjective_marks !== undefined ? parseFloat(viewModal.result.subjective_marks).toFixed(2) : '—'}
                    </div>
                  </div>
                  <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Coding</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
                      {viewModal.result.coding_marks !== null && viewModal.result.coding_marks !== undefined ? parseFloat(viewModal.result.coding_marks).toFixed(2) : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamp & Meta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b', padding: '0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} />
                  <span>Submitted: {viewModal.result.submitted_at ? new Date(viewModal.result.submitted_at).toLocaleString() : 'Not recorded'}</span>
                </div>
                <div>
                  Publication Status: <strong>{viewModal.result.is_published ? 'Published' : 'Draft'}</strong>
                </div>
              </div>
            </div>

            <div style={{ 
              padding: '16px 28px', 
              background: '#f8fafc', 
              borderTop: '1px solid #e2e8f0', 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Button 
                variant="secondary" 
                size="sm" 
                icon={Printer}
                onClick={() => window.print()}
              >
                Print Scorecard
              </Button>
              <div style={{ display: 'flex', gap: 10 }}>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  icon={FileText}
                  onClick={() => {
                    const r = viewModal.result;
                    setViewModal({ open: false, result: null });
                    handleOpenSubmission(r);
                  }}
                  style={{ color: '#4f46e5', borderColor: '#c7d2fe', background: '#eef2ff' }}
                >
                  View Submitted Copy
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  icon={Edit3}
                  onClick={() => {
                    const r = viewModal.result;
                    setViewModal({ open: false, result: null });
                    handleOpenEdit(r);
                  }}
                >
                  Edit Result
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setViewModal({ open: false, result: null })}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT RESULT MODAL */}
      {editModal.open && editModal.result && (
        <div className="admin-modal-overlay" onClick={() => !editModal.saving && setEditModal({ open: false, result: null, marks: '', status: 'pass', grade: 'A', saving: false })}>
          <div 
            className="admin-modal" 
            style={{ maxWidth: 540, borderRadius: 16 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="admin-modal-header" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="admin-modal-title" style={{ fontSize: '1.15rem' }}>Edit Student Result</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Adjust marks, evaluation grade and result status</p>
                </div>
              </div>
              <button 
                onClick={() => !editModal.saving && setEditModal({ open: false, result: null, marks: '', status: 'pass', grade: 'A', saving: false })} 
                className="admin-modal-close"
                disabled={editModal.saving}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveResult}>
              <div className="admin-modal-content" style={{ padding: '24px 28px' }}>
                {/* Student summary banner */}
                <div style={{ background: '#f1f5f9', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                    {editModal.result.student_name}
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: '0.82rem', color: '#64748b' }}>
                    <span>Roll No: <strong>{editModal.result.roll_no}</strong></span>
                    <span>Exam: <strong>{editModal.result.exam_name || editModal.result.exam_title || 'Examination'}</strong></span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: '0.8rem', color: '#0a74da', fontWeight: 600 }}>
                    Max Exam Marks: {editModal.result.total_marks || 100} | Passing: {editModal.result.exam_passing_marks || 40}
                  </div>
                </div>

                {/* Marks input */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                    Marks Obtained (Max: {editModal.result.total_marks || 100})
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" 
                      step="0.5" 
                      min="0" 
                      max={editModal.result.total_marks || 100}
                      value={editModal.marks}
                      onChange={e => handleMarksChange(e.target.value)}
                      required
                      className="admin-form-input"
                      style={{ fontSize: '1.1rem', fontWeight: 700, paddingRight: 70 }}
                    />
                    <span style={{ 
                      position: 'absolute', 
                      right: 14, 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: '#94a3b8', 
                      fontWeight: 600,
                      fontSize: '0.9rem' 
                    }}>
                      / {editModal.result.total_marks || 100}
                    </span>
                  </div>
                  
                  {/* Real-time calculated preview */}
                  {editModal.marks !== '' && !isNaN(parseFloat(editModal.marks)) && (
                    <div style={{ marginTop: 8, fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Calculated Percentage:</span>
                      <strong style={{ color: '#0a74da', fontSize: '0.9rem' }}>
                        {((parseFloat(editModal.marks) / (parseFloat(editModal.result.total_marks) || 100)) * 100).toFixed(1)}%
                      </strong>
                    </div>
                  )}
                </div>

                {/* Status select */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                    Result Status
                  </label>
                  <select 
                    value={editModal.status}
                    onChange={e => setEditModal(prev => ({ ...prev, status: e.target.value }))}
                    className="admin-form-input"
                    style={{ fontWeight: 600 }}
                  >
                    <option value="pass">PASS (Cleared)</option>
                    <option value="fail">FAIL (Did not meet cutoff)</option>
                    <option value="pending">PENDING (Evaluation in progress)</option>
                  </select>
                </div>

                {/* Grade select */}
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                    Grade Awarded
                  </label>
                  <select 
                    value={editModal.grade}
                    onChange={e => setEditModal(prev => ({ ...prev, grade: e.target.value }))}
                    className="admin-form-input"
                    style={{ fontWeight: 600 }}
                  >
                    <option value="A+">A+ (Outstanding: 90%+)</option>
                    <option value="A">A (Excellent: 80% - 89%)</option>
                    <option value="B+">B+ (Very Good: 70% - 79%)</option>
                    <option value="B">B (Good: 60% - 69%)</option>
                    <option value="C+">C+ (Average: 55% - 59%)</option>
                    <option value="C">C (Satisfactory: 50% - 54%)</option>
                    <option value="D">D (Marginal Pass: 40% - 49%)</option>
                    <option value="F">F (Fail: Under 40%)</option>
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
                  onClick={() => setEditModal({ open: false, result: null, marks: '', status: 'pass', grade: 'A', saving: false })}
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
                  Save Result Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANDIDATE SUBMITTED ANSWER COPY & EVALUATION MODAL */}
      {submissionModal.open && (
        <div 
          className="admin-modal-overlay" 
          onClick={() => !submissionModal.reevaluating && setSubmissionModal(prev => ({ ...prev, open: false }))}
          style={{ zIndex: 1100 }}
        >
          <div 
            className="admin-modal" 
            style={{ maxWidth: 980, width: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', borderRadius: 16 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="admin-modal-header" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(79, 70, 229, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                  <FileText size={22} />
                </div>
                <div>
                  <h3 className="admin-modal-title" style={{ fontSize: '1.2rem', margin: 0 }}>
                    Candidate Submitted Answer Copy
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                    {submissionModal.data?.result ? (
                      <>
                        <strong>{submissionModal.data.result.student_name}</strong> (Roll: {submissionModal.data.result.roll_no || 'N/A'}) &bull; {submissionModal.data.result.exam_title}
                      </>
                    ) : 'Loading candidate examination copy...'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {submissionModal.data?.result && (
                  <>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      icon={RotateCcw}
                      loading={submissionModal.reevaluating}
                      onClick={() => handleReevaluateSubmission(submissionModal.resultId)}
                      title="Re-run automatic evaluation algorithms on candidate answers"
                      style={{ color: '#4f46e5', borderColor: '#c7d2fe' }}
                    >
                      Re-evaluate Copy
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      icon={Printer}
                      onClick={() => window.print()}
                      title="Print Answer Sheet"
                    >
                      Print
                    </Button>
                  </>
                )}
                <button 
                  onClick={() => setSubmissionModal(prev => ({ ...prev, open: false }))} 
                  className="admin-modal-close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="admin-modal-content" style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
              {submissionModal.loading ? (
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <div className="admin-loading-spinner" style={{ margin: '0 auto 16px', borderColor: '#4f46e5', borderTopColor: 'transparent', width: 36, height: 36 }}></div>
                  <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Loading candidate answer sheet & evaluating marks...</p>
                </div>
              ) : !submissionModal.data ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                  <AlertCircle size={36} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
                  <p>Unable to load candidate submission copy.</p>
                </div>
              ) : (
                (() => {
                  const { result: subResult, questions = [] } = submissionModal.data;
                  const totalEarned = subResult.marks_obtained !== undefined ? parseFloat(subResult.marks_obtained) : 0;
                  const totalExam = parseFloat(subResult.exam_total_marks || subResult.total_marks) || 100;
                  const percentage = parseFloat(subResult.percentage) || (totalExam > 0 ? (totalEarned / totalExam) * 100 : 0);

                  const filteredQuestions = questions.filter(q => {
                    if (submissionModal.activeTab === 'mcq') return q.type === 'mcq' || q.type === 'true_false';
                    if (submissionModal.activeTab === 'coding') return q.type === 'coding';
                    if (submissionModal.activeTab === 'subjective') return q.type !== 'mcq' && q.type !== 'true_false' && q.type !== 'coding';
                    return true;
                  });

                  return (
                    <div>
                      {/* Summary Banner */}
                      <div style={{ 
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', 
                        borderRadius: 14, 
                        padding: '20px 24px', 
                        color: '#ffffff',
                        marginBottom: 24,
                        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.2)'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                          {/* Student Details */}
                          <div>
                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                              Candidate Details
                            </span>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 4, color: '#ffffff' }}>
                              {subResult.student_name}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: 4 }}>
                              Roll: <strong style={{ color: '#ffffff' }}>{subResult.roll_no || 'N/A'}</strong>
                              {subResult.student_code && ` &bull; Code: ${subResult.student_code}`}
                            </div>
                            {subResult.email && (
                              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
                                {subResult.email}
                              </div>
                            )}
                          </div>

                          {/* Score and Percentage */}
                          <div>
                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                              Evaluation Score
                            </span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#38bdf8' }}>
                                {totalEarned.toFixed(2)}
                              </span>
                              <span style={{ fontSize: '0.95rem', color: '#94a3b8' }}>
                                / {totalExam}
                              </span>
                              <span style={{ 
                                marginLeft: 6,
                                padding: '3px 8px', 
                                borderRadius: 6, 
                                fontSize: '0.75rem', 
                                fontWeight: 700,
                                background: subResult.status === 'pass' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: subResult.status === 'pass' ? '#4ade80' : '#f87171'
                              }}>
                                {(subResult.status || 'pending').toUpperCase()}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: 4 }}>
                              Percentage: <strong>{percentage.toFixed(2)}%</strong> &bull; Grade: <strong style={{ color: '#fbbf24' }}>{subResult.grade || 'N/A'}</strong>
                            </div>
                          </div>

                          {/* Proctoring & Integrity */}
                          <div>
                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                              Exam Telemetry & Proctoring
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: '0.85rem' }}>
                              <Shield size={16} style={{ color: (subResult.session_violation_count || 0) > 0 ? '#f87171' : '#4ade80' }} />
                              <span>Violations: <strong style={{ color: (subResult.session_violation_count || 0) > 0 ? '#f87171' : '#4ade80' }}>{subResult.session_violation_count || 0}</strong></span>
                            </div>
                            {subResult.is_auto_submitted && (
                              <div style={{ marginTop: 4, display: 'inline-block', padding: '2px 8px', borderRadius: 4, background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontSize: '0.75rem', fontWeight: 600 }}>
                                Auto-Submitted ({subResult.auto_submit_reason || 'Time limit / Violation'})
                              </div>
                            )}
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>
                              Submitted: {subResult.submitted_at ? new Date(subResult.submitted_at).toLocaleString() : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Question Filter Tabs */}
                      <div style={{ 
                        display: 'flex', 
                        gap: 8, 
                        borderBottom: '1px solid #e2e8f0', 
                        marginBottom: 20, 
                        paddingBottom: 8,
                        flexWrap: 'wrap'
                      }}>
                        <button
                          type="button"
                          onClick={() => setSubmissionModal(prev => ({ ...prev, activeTab: 'all' }))}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            background: submissionModal.activeTab === 'all' ? '#4f46e5' : '#f1f5f9',
                            color: submissionModal.activeTab === 'all' ? '#ffffff' : '#475569'
                          }}
                        >
                          All Questions ({questions.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubmissionModal(prev => ({ ...prev, activeTab: 'mcq' }))}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            background: submissionModal.activeTab === 'mcq' ? '#4f46e5' : '#f1f5f9',
                            color: submissionModal.activeTab === 'mcq' ? '#ffffff' : '#475569'
                          }}
                        >
                          Objective / MCQ ({questions.filter(q => q.type === 'mcq' || q.type === 'true_false').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubmissionModal(prev => ({ ...prev, activeTab: 'coding' }))}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            background: submissionModal.activeTab === 'coding' ? '#4f46e5' : '#f1f5f9',
                            color: submissionModal.activeTab === 'coding' ? '#ffffff' : '#475569'
                          }}
                        >
                          Coding ({questions.filter(q => q.type === 'coding').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubmissionModal(prev => ({ ...prev, activeTab: 'subjective' }))}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            background: submissionModal.activeTab === 'subjective' ? '#4f46e5' : '#f1f5f9',
                            color: submissionModal.activeTab === 'subjective' ? '#ffffff' : '#475569'
                          }}
                        >
                          Subjective ({questions.filter(q => q.type !== 'mcq' && q.type !== 'true_false' && q.type !== 'coding').length})
                        </button>
                      </div>

                      {/* Questions List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {filteredQuestions.length === 0 ? (
                          <div style={{ padding: '30px 16px', textAlign: 'center', color: '#64748b' }}>
                            No questions found under this filter.
                          </div>
                        ) : (
                          filteredQuestions.map((q, idx) => {
                            const ans = q.answer || {};
                            const hasAnswer = q.is_answered;
                            const isCorrect = ans.is_correct === true;
                            const isMCQ = q.type === 'mcq' || q.type === 'true_false';
                            const isCoding = q.type === 'coding';
                            const marksAwarded = ans.marks_obtained !== null && ans.marks_obtained !== undefined ? parseFloat(ans.marks_obtained) : 0;

                            // Parse options if stored as string or array
                            let optionsList = [];
                            if (q.options) {
                              if (Array.isArray(q.options)) {
                                optionsList = q.options;
                              } else if (typeof q.options === 'string') {
                                try {
                                  const parsed = JSON.parse(q.options);
                                  if (Array.isArray(parsed)) optionsList = parsed;
                                } catch (_) {
                                  optionsList = [];
                                }
                              }
                            }

                            // Normalizing check for selected option vs correct option
                            const selectedRaw = ans.selected_option !== null && ans.selected_option !== undefined ? String(ans.selected_option).trim() : null;
                            const correctRaw = q.correct_answer !== null && q.correct_answer !== undefined ? String(q.correct_answer).trim() : null;

                            return (
                              <div 
                                key={q.question_id || idx}
                                style={{
                                  border: '1px solid #e2e8f0',
                                  borderRadius: 12,
                                  background: '#ffffff',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                  overflow: 'hidden'
                                }}
                              >
                                {/* Question Header */}
                                <div style={{
                                  padding: '12px 18px',
                                  background: '#f8fafc',
                                  borderBottom: '1px solid #e2e8f0',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: 10
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ 
                                      background: '#0f172a', 
                                      color: '#ffffff', 
                                      fontWeight: 800, 
                                      fontSize: '0.85rem', 
                                      padding: '2px 8px', 
                                      borderRadius: 6 
                                    }}>
                                      Q{q.order_index || idx + 1}
                                    </span>
                                    <span style={{ 
                                      fontSize: '0.75rem', 
                                      fontWeight: 700, 
                                      textTransform: 'uppercase', 
                                      padding: '2px 8px', 
                                      borderRadius: 6,
                                      background: '#e0e7ff',
                                      color: '#3730a3'
                                    }}>
                                      {q.type.replace('_', ' ')}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                                      Max: {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                                    </span>
                                    {q.difficulty && (
                                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                        &bull; {q.difficulty}
                                      </span>
                                    )}
                                  </div>

                                  {/* Result Indicator Badge */}
                                  <div>
                                    {!hasAnswer ? (
                                      <span style={{ 
                                        padding: '4px 10px', 
                                        borderRadius: 6, 
                                        fontSize: '0.78rem', 
                                        fontWeight: 700, 
                                        background: '#f1f5f9', 
                                        color: '#64748b',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4
                                      }}>
                                        <XCircle size={14} /> Not Answered (0 marks)
                                      </span>
                                    ) : isMCQ ? (
                                      isCorrect ? (
                                        <span style={{ 
                                          padding: '4px 10px', 
                                          borderRadius: 6, 
                                          fontSize: '0.78rem', 
                                          fontWeight: 700, 
                                          background: 'rgba(34, 197, 94, 0.12)', 
                                          color: '#15803d',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 4
                                        }}>
                                          <Check size={14} /> Correct (+{marksAwarded})
                                        </span>
                                      ) : (
                                        <span style={{ 
                                          padding: '4px 10px', 
                                          borderRadius: 6, 
                                          fontSize: '0.78rem', 
                                          fontWeight: 700, 
                                          background: 'rgba(239, 68, 68, 0.12)', 
                                          color: '#b91c1c',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 4
                                        }}>
                                          <X size={14} /> Incorrect (0 marks)
                                        </span>
                                      )
                                    ) : (
                                      <span style={{ 
                                        padding: '4px 10px', 
                                        borderRadius: 6, 
                                        fontSize: '0.78rem', 
                                        fontWeight: 700, 
                                        background: ans.is_evaluated ? 'rgba(10, 116, 218, 0.12)' : 'rgba(245, 158, 11, 0.12)', 
                                        color: ans.is_evaluated ? '#0369a1' : '#b45309',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4
                                      }}>
                                        {ans.is_evaluated ? `Evaluated: ${marksAwarded} / ${q.marks}` : 'Manual Evaluation Required'}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Question Statement */}
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                                  <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#1e293b', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                                    {q.question_text}
                                  </div>
                                </div>

                                {/* Submission Answer Body */}
                                <div style={{ padding: '16px 20px', background: '#fafafa' }}>
                                  {isMCQ ? (
                                    <div>
                                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>
                                        Options & Candidate Answer:
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {optionsList.map((opt, optIdx) => {
                                          const optText = typeof opt === 'object' && opt !== null ? (opt.text || opt.label || '') : String(opt);
                                          const optKey = typeof opt === 'object' && opt !== null && opt.id ? String(opt.id) : String.fromCharCode(97 + optIdx);
                                          
                                          // Check if candidate selected this option
                                          const isCandidateChoice = selectedRaw && (
                                            selectedRaw === optKey ||
                                            selectedRaw.toLowerCase() === optKey.toLowerCase() ||
                                            selectedRaw.trim().toLowerCase() === optText.trim().toLowerCase() ||
                                            selectedRaw === String(optIdx)
                                          );

                                          // Check if this option is the correct answer
                                          const isCorrectKey = correctRaw && (
                                            correctRaw === optKey ||
                                            correctRaw.toLowerCase() === optKey.toLowerCase() ||
                                            correctRaw.trim().toLowerCase() === optText.trim().toLowerCase() ||
                                            correctRaw === String(optIdx)
                                          );

                                          let itemBg = '#ffffff';
                                          let itemBorder = '#e2e8f0';
                                          let textColor = '#334155';

                                          if (isCorrectKey) {
                                            itemBg = 'rgba(34, 197, 94, 0.08)';
                                            itemBorder = '#22c55e';
                                            textColor = '#14532d';
                                          } else if (isCandidateChoice && !isCorrectKey) {
                                            itemBg = 'rgba(239, 68, 68, 0.08)';
                                            itemBorder = '#ef4444';
                                            textColor = '#7f1d1d';
                                          }

                                          return (
                                            <div 
                                              key={optIdx}
                                              style={{
                                                padding: '10px 14px',
                                                borderRadius: 8,
                                                border: `1.5px solid ${itemBorder}`,
                                                background: itemBg,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                fontSize: '0.88rem'
                                              }}
                                            >
                                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: textColor }}>
                                                <span style={{ 
                                                  width: 24, 
                                                  height: 24, 
                                                  borderRadius: '50%', 
                                                  background: isCandidateChoice ? (isCorrectKey ? '#22c55e' : '#ef4444') : '#e2e8f0',
                                                  color: isCandidateChoice ? '#ffffff' : '#475569',
                                                  display: 'flex', 
                                                  alignItems: 'center', 
                                                  justifyContent: 'center',
                                                  fontSize: '0.75rem',
                                                  fontWeight: 700 
                                                }}>
                                                  {String.fromCharCode(65 + optIdx)}
                                                </span>
                                                <span style={{ fontWeight: isCandidateChoice || isCorrectKey ? 700 : 500 }}>
                                                  {optText}
                                                </span>
                                              </div>

                                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {isCandidateChoice && (
                                                  <span style={{ 
                                                    padding: '2px 8px', 
                                                    borderRadius: 4, 
                                                    fontSize: '0.72rem', 
                                                    fontWeight: 700, 
                                                    background: isCorrectKey ? '#22c55e' : '#ef4444',
                                                    color: '#ffffff'
                                                  }}>
                                                    Candidate's Choice
                                                  </span>
                                                )}
                                                {isCorrectKey && (
                                                  <span style={{ 
                                                    padding: '2px 8px', 
                                                    borderRadius: 4, 
                                                    fontSize: '0.72rem', 
                                                    fontWeight: 700, 
                                                    background: '#15803d',
                                                    color: '#ffffff'
                                                  }}>
                                                    Correct Key
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {!hasAnswer && (
                                        <div style={{ marginTop: 10, fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                          Candidate skipped this question.
                                        </div>
                                      )}
                                    </div>
                                  ) : isCoding ? (
                                    <div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                          Candidate Code Submission:
                                        </span>
                                        {ans.selected_language && (
                                          <span style={{ padding: '2px 8px', borderRadius: 4, background: '#0f172a', color: '#38bdf8', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                            {ans.selected_language}
                                          </span>
                                        )}
                                      </div>
                                      
                                      <div style={{ 
                                        background: '#0f172a', 
                                        borderRadius: 8, 
                                        padding: '14px', 
                                        color: '#e2e8f0', 
                                        fontFamily: 'Consolas, Monaco, monospace', 
                                        fontSize: '0.85rem',
                                        maxHeight: 260,
                                        overflowY: 'auto'
                                      }}>
                                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                          {ans.code_submission || '// No code submitted by candidate'}
                                        </pre>
                                      </div>

                                      {q.test_cases && (
                                        <div style={{ marginTop: 12, padding: '10px 14px', background: '#f1f5f9', borderRadius: 8, fontSize: '0.82rem' }}>
                                          <strong>Evaluation Test Cases:</strong>
                                          <pre style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap', color: '#475569' }}>
                                            {typeof q.test_cases === 'string' ? q.test_cases : JSON.stringify(q.test_cases, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
                                        Candidate Written Answer:
                                      </div>
                                      <div style={{ 
                                        background: '#ffffff', 
                                        border: '1px solid #e2e8f0', 
                                        borderRadius: 8, 
                                        padding: '14px', 
                                        fontSize: '0.9rem',
                                        lineHeight: 1.6,
                                        color: ans.answer_text ? '#1e293b' : '#94a3b8',
                                        fontStyle: ans.answer_text ? 'normal' : 'italic',
                                        whiteSpace: 'pre-wrap'
                                      }}>
                                        {ans.answer_text || 'No written response submitted'}
                                      </div>
                                    </div>
                                  )}

                                  {/* Evaluator Marks & Remarks Adjustment Row */}
                                  <div style={{ 
                                    marginTop: 14, 
                                    paddingTop: 12, 
                                    borderTop: '1px solid #e2e8f0', 
                                    display: 'flex', 
                                    flexWrap: 'wrap', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between', 
                                    gap: 12 
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                                          Award Marks:
                                        </span>
                                        <input 
                                          type="number"
                                          step="0.5"
                                          min="0"
                                          max={q.marks}
                                          value={submissionModal.editingMarks[ans.id] !== undefined ? submissionModal.editingMarks[ans.id] : marksAwarded}
                                          onChange={e => {
                                            const val = e.target.value;
                                            setSubmissionModal(prev => ({
                                              ...prev,
                                              editingMarks: { ...prev.editingMarks, [ans.id]: val }
                                            }));
                                          }}
                                          disabled={!ans.id}
                                          className="admin-form-input"
                                          style={{ width: 80, padding: '4px 8px', fontSize: '0.88rem', fontWeight: 700, textAlign: 'center' }}
                                        />
                                        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                                          / {q.marks}
                                        </span>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 260 }}>
                                        <input 
                                          type="text"
                                          placeholder="Evaluator remarks / feedback..."
                                          value={submissionModal.editingRemarks[ans.id] !== undefined ? submissionModal.editingRemarks[ans.id] : (ans.evaluator_remarks || '')}
                                          onChange={e => {
                                            const val = e.target.value;
                                            setSubmissionModal(prev => ({
                                              ...prev,
                                              editingRemarks: { ...prev.editingRemarks, [ans.id]: val }
                                            }));
                                          }}
                                          disabled={!ans.id}
                                          className="admin-form-input"
                                          style={{ padding: '4px 10px', fontSize: '0.82rem', flex: 1 }}
                                        />
                                      </div>
                                    </div>

                                    {ans.id && (
                                      <Button 
                                        variant="secondary" 
                                        size="sm" 
                                        icon={Save}
                                        loading={submissionModal.savingAnswerId === ans.id}
                                        onClick={() => handleSaveManualAnswerMarks(ans.id, q.type)}
                                      >
                                        Update Marks
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ 
              padding: '16px 28px', 
              background: '#f8fafc', 
              borderTop: '1px solid #e2e8f0', 
              display: 'flex', 
              justifyContent: 'flex-end',
              flexShrink: 0
            }}>
              <Button 
                variant="ghost" 
                size="md" 
                onClick={() => setSubmissionModal(prev => ({ ...prev, open: false }))}
              >
                Close Copy View
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
