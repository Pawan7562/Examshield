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
  CheckCircle2,
  XCircle, 
  TrendingUp,
  Users,
  FileText,
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
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import './Gradebook.css';

/* ── Modern Grade Badge ────────────────────────────────────────────────────── */
const GradeBadge = ({ grade }) => {
  const g = (grade || '—').toUpperCase();
  let colorClass = 'c';
  if (g.startsWith('A')) colorClass = 'a';
  else if (g.startsWith('B')) colorClass = 'b';
  else if (g.startsWith('C') || g.startsWith('D')) colorClass = 'c';
  else if (g.startsWith('F')) colorClass = 'f';

  return (
    <span className={`gb-grade-badge ${colorClass}`}>
      {g}
    </span>
  );
};

/* ── Modern Status Chip ────────────────────────────────────────────────────── */
const StatusChip = ({ status }) => {
  const s = (status || 'pending').toLowerCase();
  let type = 'pending';
  let label = 'PENDING';

  if (s === 'pass' || s === 'passed') {
    type = 'pass';
    label = 'PASS';
  } else if (s === 'fail' || s === 'failed') {
    type = 'fail';
    label = 'FAIL';
  }

  return (
    <span className={`gb-status-chip ${type}`}>
      <span className="gb-status-dot" />
      {label}
    </span>
  );
};

/* ── Candidate Initials Helper ─────────────────────────────────────────────── */
const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (name.substring(0, 2) || 'ST').toUpperCase();
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
  const [serverStats, setServerStats] = useState(null);
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
      const r = await adminAPI.getResults({ examId, limit: 'all' }, { bypassCache: true });
      const raw = r.data || r;
      const list = raw.results || raw.data?.results || (Array.isArray(raw) ? raw : []);
      const statsData = raw.stats || raw.data?.stats || null;
      setResults(list);
      if (statsData) {
        setServerStats(statsData);
      }
      if (storageKey) {
        sessionStorage.setItem(storageKey, JSON.stringify(list));
      }
    } catch (err) { 
      console.error('fetchResults error:', err);
      toast.error('Failed to load gradebook records'); 
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
      const payload = res?.data?.data || res?.data || res;
      if (payload && payload.questions) {
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
        toast.error('Candidate submission copy not found');
        setSubmissionModal(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load candidate answer copy');
      setSubmissionModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleReevaluateSubmission = async (resultId) => {
    setSubmissionModal(prev => ({ ...prev, reevaluating: true }));
    try {
      await adminAPI.reevaluateResult(resultId);
      toast.success('Exam answers re-evaluated with updated marking keys!');
      const res = await adminAPI.getSubmission(resultId);
      const payload = res?.data?.data || res?.data || res;
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
      const payload = res?.data?.data || res?.data || res;
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
      toast.success(res?.message || res?.data?.message || 'Exam submissions re-evaluated successfully!');
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
      toast.success('Results published and candidates notified!');
      fetchResults(selectedExam);
    } catch (err) { 
      toast.error(err.message || 'Failed to publish results'); 
    }
  };

  const downloadResults = () => {
    try {
      if (!results || results.length === 0) {
        return toast.error('No results to export');
      }
      const headers = ['Candidate Name', 'Roll No', 'Email', 'Exam Title', 'Marks Obtained', 'Total Marks', 'Percentage', 'Grade', 'Status', 'Published', 'Submitted At'];
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
      a.download = `gradebook_${selectedExam ? 'exam' : 'all'}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Gradebook exported to CSV');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export CSV');
    }
  };

  const getStatistics = () => {
    if (serverStats && typeof serverStats.total === 'number' && serverStats.total > 0) {
      return serverStats;
    }
    if (results.length === 0) return null;
    
    const total = results.length;
    const passed = results.filter(r => (r.status || '').toLowerCase() === 'pass').length;
    const failed = results.filter(r => (r.status || '').toLowerCase() === 'fail').length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
    
    return { total, passed, failed, passRate };
  };

  const stats = getStatistics();

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

      setResults(prev => prev.map(item => {
        if (item.id === editModal.result.id) {
          return {
            ...item,
            marks_obtained: numMarks,
            percentage: calculatedPct,
            status: editModal.status,
            grade: editModal.grade
          };
        }
        return item;
      }));

      toast.success('Candidate result updated successfully');
      setEditModal({ open: false, result: null, marks: '', status: 'pass', grade: 'A', saving: false });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update result');
    } finally {
      setEditModal(prev => ({ ...prev, saving: false }));
    }
  };

  // Filtered results list based on search
  const filteredResults = results.filter(r => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      (r.student_name && r.student_name.toLowerCase().includes(term)) ||
      (r.roll_no && r.roll_no.toLowerCase().includes(term)) ||
      (r.exam_name && r.exam_name.toLowerCase().includes(term)) ||
      (r.exam_title && r.exam_title.toLowerCase().includes(term))
    );
  });

  return (
    <div className="gb-container">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="gb-header">
        <div className="gb-header-left">
          <div className="gb-eyebrow">
            <span className="gb-eyebrow-dot" />
            <span>Academic Performance • Forensic Audits &amp; Grade Certification</span>
          </div>
          <h1 className="gb-title">Gradebook &amp; Assessment Audits</h1>
          <p className="gb-subtitle">
            <span>Review auto-evaluated submissions, adjust scores, verify proctoring telemetry, and publish certified grade reports.</span>
          </p>
        </div>

        <div className="gb-header-actions">
          {selectedExam && (
            <button
              type="button"
              className="gb-btn secondary"
              onClick={handleBatchReevaluateExam}
              title="Re-run automated evaluation on all submitted answer copies for this exam"
            >
              <RotateCcw size={15} />
              <span>Re-evaluate All</span>
            </button>
          )}

          <button
            type="button"
            className="gb-btn secondary"
            onClick={downloadResults}
            disabled={results.length === 0}
          >
            <Download size={15} />
            <span>Export Roster CSV</span>
          </button>

          {selectedExam && (
            <button
              type="button"
              className="gb-btn success"
              onClick={publishAllResults}
            >
              <Send size={15} />
              <span>Publish Exam Results</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Executive Metric KPI Cards ──────────────────────────────────────── */}
      {stats && (
        <div className="gb-metrics-grid">
          <div className="gb-metric-card">
            <div className="gb-metric-icon">
              <Users size={22} />
            </div>
            <div className="gb-metric-content">
              <span className="gb-metric-label">Evaluated Candidates</span>
              <span className="gb-metric-value">{stats.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="gb-metric-card">
            <div className="gb-metric-icon good">
              <CheckCircle2 size={22} />
            </div>
            <div className="gb-metric-content">
              <span className="gb-metric-label">Certified Passed</span>
              <span className="gb-metric-value">{stats.passed}</span>
            </div>
          </div>

          <div className="gb-metric-card">
            <div className="gb-metric-icon bad">
              <XCircle size={22} />
            </div>
            <div className="gb-metric-content">
              <span className="gb-metric-label">Review / Failed</span>
              <span className="gb-metric-value">{stats.failed}</span>
            </div>
          </div>

          <div className="gb-metric-card">
            <div className="gb-metric-icon gold">
              <TrendingUp size={22} />
            </div>
            <div className="gb-metric-content">
              <span className="gb-metric-label">Roster Pass Rate</span>
              <span className="gb-metric-value">{stats.passRate}%</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Search & Filter Cockpit ─────────────────────────────────────────── */}
      <div className="gb-filter-card">
        <div className="gb-search-box">
          <Search size={18} className="gb-search-icon" />
          <input
            type="text"
            className="gb-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search gradebook by candidate name, roll number, or exam title..."
          />
          {search && (
            <button type="button" className="gb-search-clear" onClick={() => setSearch('')}>
              <X size={15} />
            </button>
          )}
        </div>

        <div className="gb-filter-group">
          <div className="gb-select-wrapper">
            <BookOpen size={15} className="gb-select-icon" />
            <select
              value={selectedExam}
              onChange={e => {
                setSelectedExam(e.target.value);
                fetchResults(e.target.value || undefined);
              }}
              className="gb-select"
              aria-label="Filter gradebook by examination"
            >
              <option value="">All Examinations ({exams.length})</option>
              {exams.map(exam => (
                <option key={exam.id} value={exam.id}>
                  {exam.title || exam.name || 'Examination'}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="gb-select-arrow" />
          </div>

          <button
            type="button"
            className="gb-btn secondary"
            onClick={() => fetchResults(selectedExam, false)}
          >
            <Filter size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Gradebook Roster Table ──────────────────────────────────────────── */}
      <div className="gb-table-card">
        <div className="gb-table-wrapper">
          <table className="gb-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Examination</th>
                <th>Attempted</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Grade</th>
                <th>Status</th>
                <th>Delivery</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--mu, #667085)' }}>
                    <RotateCcw size={22} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px', display: 'block' }} />
                    <span>Loading gradebook &amp; audit evaluations...</span>
                  </td>
                </tr>
              ) : filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '56px 20px' }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '16px',
                      background: 'var(--wash, rgba(37, 99, 235, 0.08))',
                      color: 'var(--c1, #2563eb)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px'
                    }}>
                      <Trophy size={28} />
                    </div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 600, color: 'var(--tx, #101828)' }}>
                      No evaluation records found
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--mu, #667085)' }}>
                      {search ? `No results matching "${search}"` : 'Results will populate here once candidates complete scheduled examinations.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredResults.map((result) => {
                  const pct = Math.min(Math.max(parseFloat(result.percentage) || 0, 0), 100);
                  const isPass = (result.status || '').toLowerCase() === 'pass' || pct >= 40;

                  return (
                    <tr key={result.id}>
                      <td>
                        <div className="gb-candidate-cell">
                          <div className="gb-candidate-avatar">
                            {getInitials(result.student_name)}
                          </div>
                          <div className="gb-candidate-meta">
                            <span className="gb-candidate-name">{result.student_name}</span>
                            <span className="gb-candidate-sub">
                              <span className="gb-id-pill">Roll: {result.roll_no || 'N/A'}</span>
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--tx, #101828)', fontWeight: 600 }}>
                          <FileText size={15} color="var(--c1, #2563eb)" style={{ flexShrink: 0 }} />
                          <span>{result.exam_name || result.exam_title || 'Examination'}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--tx, #101828)' }}>
                          {result.questions_attempted !== undefined && result.questions_attempted !== null ? result.questions_attempted : '—'}
                        </span>
                        <span style={{ color: 'var(--mu, #667085)', fontSize: '0.82rem' }}>
                          /{result.total_questions || '—'}
                        </span>
                      </td>
                      <td>
                        <div className="gb-marks-box">
                          <span className="gb-marks-val">
                            {result.marks_obtained !== undefined ? parseFloat(result.marks_obtained).toFixed(2) : '0.00'}
                          </span>
                          <span className="gb-marks-tot">
                            /{result.total_marks || 100}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--tx, #101828)' }}>
                            {pct.toFixed(1)}%
                          </span>
                          <div className="gb-progress-bar">
                            <div 
                              className="gb-progress-fill" 
                              style={{ 
                                width: `${pct}%`,
                                background: isPass ? 'var(--good, #0f8a68)' : 'var(--bad, #c2410c)'
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <GradeBadge grade={result.grade} />
                      </td>
                      <td>
                        <StatusChip status={result.status} />
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: result.is_published ? 'var(--goods, #e1f4ec)' : 'var(--s2, #f8f9fc)',
                          color: result.is_published ? 'var(--good, #0f8a68)' : 'var(--mu, #667085)',
                          border: `1px solid ${result.is_published ? 'rgba(15, 138, 104, 0.25)' : 'var(--bd, #e6e9f0)'}`
                        }}>
                          {result.is_published ? <CheckCircle size={12} /> : null}
                          {result.is_published ? 'PUBLISHED' : 'DRAFT'}
                        </span>
                      </td>
                      <td>
                        <div className="gb-action-group">
                          <button
                            type="button"
                            className="gb-action-btn primary"
                            onClick={() => handleOpenSubmission(result)}
                            title="Inspect complete submitted copy, question telemetry & score"
                          >
                            <FileText size={13} />
                            <span>View Copy &amp; Score</span>
                          </button>

                          <button
                            type="button"
                            className="gb-action-btn"
                            onClick={() => handleOpenEdit(result)}
                            title="Adjust marks, grade, and pass/fail status"
                          >
                            <Edit3 size={13} />
                            <span>Adjust</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL 1: VIEW SCORECARD ────────────────────────────────────────── */}
      {viewModal.open && viewModal.result && (
        <div className="gb-modal-overlay" onClick={() => setViewModal({ open: false, result: null })}>
          <div className="gb-modal" onClick={e => e.stopPropagation()}>
            <div className="gb-modal-header">
              <h3 className="gb-modal-title">
                <Award size={20} color="var(--c1, #2563eb)" />
                <span>Candidate Scorecard Dossier</span>
              </h3>
              <button 
                onClick={() => setViewModal({ open: false, result: null })} 
                className="gb-modal-close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="gb-modal-body">
              {/* Bio Card */}
              <div style={{
                background: 'var(--s2, #f8f9fc)',
                border: '1px solid var(--bd, #e6e9f0)',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--tx, #101828)' }}>
                    {viewModal.result.student_name}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--mu, #667085)', marginTop: '2px' }}>
                    Roll No: <strong style={{ color: 'var(--tx, #101828)' }}>{viewModal.result.roll_no}</strong> • {viewModal.result.email}
                  </div>
                </div>
                <StatusChip status={viewModal.result.status} />
              </div>

              {/* Key Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ background: 'var(--sf, #ffffff)', border: '1px solid var(--bd, #e6e9f0)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--mu, #667085)', fontWeight: 700, textTransform: 'uppercase' }}>Marks Earned</div>
                  <div style={{ fontFamily: 'Newsreader, serif', fontSize: '1.6rem', fontWeight: 700, color: 'var(--c1, #2563eb)', marginTop: '4px' }}>
                    {viewModal.result.marks_obtained !== undefined ? parseFloat(viewModal.result.marks_obtained).toFixed(2) : '0.00'}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--mu, #667085)' }}>Out of {viewModal.result.total_marks || 100}</div>
                </div>

                <div style={{ background: 'var(--sf, #ffffff)', border: '1px solid var(--bd, #e6e9f0)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--mu, #667085)', fontWeight: 700, textTransform: 'uppercase' }}>Percentage</div>
                  <div style={{ fontFamily: 'Newsreader, serif', fontSize: '1.6rem', fontWeight: 700, color: 'var(--tx, #101828)', marginTop: '4px' }}>
                    {viewModal.result.percentage !== undefined ? parseFloat(viewModal.result.percentage).toFixed(2) : '0.00'}%
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--mu, #667085)' }}>Pass mark: {viewModal.result.exam_passing_marks || '40'}%</div>
                </div>

                <div style={{ background: 'var(--sf, #ffffff)', border: '1px solid var(--bd, #e6e9f0)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--mu, #667085)', fontWeight: 700, textTransform: 'uppercase' }}>Certified Grade</div>
                  <div style={{ marginTop: '8px' }}>
                    <GradeBadge grade={viewModal.result.grade} />
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--mu, #667085)', marginTop: '6px' }}>Performance band</div>
                </div>
              </div>

              {/* Sectional Breakdown */}
              <div style={{ background: 'var(--s2, #f8f9fc)', borderRadius: '10px', padding: '14px 18px', border: '1px solid var(--bd, #e6e9f0)' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--mu, #667085)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Sectional Marks Breakdown:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
                  <div style={{ background: 'var(--sf, #ffffff)', padding: '10px', borderRadius: '8px', border: '1px solid var(--bd, #e6e9f0)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--mu, #667085)' }}>MCQ / Objective</div>
                    <div style={{ fontWeight: 700, color: 'var(--tx, #101828)', fontSize: '0.96rem' }}>
                      {viewModal.result.mcq_marks !== null && viewModal.result.mcq_marks !== undefined ? parseFloat(viewModal.result.mcq_marks).toFixed(2) : '—'}
                    </div>
                  </div>
                  <div style={{ background: 'var(--sf, #ffffff)', padding: '10px', borderRadius: '8px', border: '1px solid var(--bd, #e6e9f0)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--mu, #667085)' }}>Subjective &amp; Essay</div>
                    <div style={{ fontWeight: 700, color: 'var(--tx, #101828)', fontSize: '0.96rem' }}>
                      {viewModal.result.subjective_marks !== null && viewModal.result.subjective_marks !== undefined ? parseFloat(viewModal.result.subjective_marks).toFixed(2) : '—'}
                    </div>
                  </div>
                  <div style={{ background: 'var(--sf, #ffffff)', padding: '10px', borderRadius: '8px', border: '1px solid var(--bd, #e6e9f0)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--mu, #667085)' }}>Coding / Practical</div>
                    <div style={{ fontWeight: 700, color: 'var(--tx, #101828)', fontSize: '0.96rem' }}>
                      {viewModal.result.coding_marks !== null && viewModal.result.coding_marks !== undefined ? parseFloat(viewModal.result.coding_marks).toFixed(2) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="gb-modal-footer">
              <button 
                type="button"
                className="gb-btn secondary"
                onClick={() => window.print()}
              >
                <Printer size={15} />
                <span>Print Scorecard</span>
              </button>
              <button 
                type="button"
                className="gb-btn primary"
                onClick={() => {
                  const r = viewModal.result;
                  setViewModal({ open: false, result: null });
                  handleOpenSubmission(r);
                }}
              >
                <FileText size={15} />
                <span>View Full Answer Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ADJUST MARKS & STATUS ─────────────────────────────────── */}
      {editModal.open && editModal.result && (
        <div className="gb-modal-overlay" onClick={() => !editModal.saving && setEditModal({ open: false, result: null, marks: '', status: 'pass', grade: 'A', saving: false })}>
          <div className="gb-modal" onClick={e => e.stopPropagation()}>
            <div className="gb-modal-header">
              <h3 className="gb-modal-title">
                <Edit3 size={18} color="var(--c1, #2563eb)" />
                <span>Adjust Candidate Evaluation</span>
              </h3>
              <button 
                onClick={() => !editModal.saving && setEditModal({ open: false, result: null, marks: '', status: 'pass', grade: 'A', saving: false })} 
                className="gb-modal-close"
                disabled={editModal.saving}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveResult}>
              <div className="gb-modal-body">
                {/* Candidate banner */}
                <div style={{ background: 'var(--s2, #f8f9fc)', borderRadius: '12px', padding: '14px 18px', border: '1px solid var(--bd, #e6e9f0)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--tx, #101828)', fontSize: '1rem' }}>
                    {editModal.result.student_name}
                  </div>
                  <div style={{ display: 'flex', gap: '14px', marginTop: '4px', fontSize: '0.82rem', color: 'var(--mu, #667085)' }}>
                    <span>Roll No: <strong>{editModal.result.roll_no}</strong></span>
                    <span>Exam: <strong>{editModal.result.exam_name || editModal.result.exam_title || 'Examination'}</strong></span>
                  </div>
                </div>

                {/* Marks Input */}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: 'var(--tx, #101828)', marginBottom: '6px' }}>
                    Marks Obtained (Max: {editModal.result.total_marks || 100})
                  </label>
                  <input 
                    type="number" 
                    step="0.5" 
                    min="0" 
                    max={editModal.result.total_marks || 100}
                    value={editModal.marks}
                    onChange={e => handleMarksChange(e.target.value)}
                    required
                    className="gb-search-input"
                    style={{ padding: '10px 14px', fontWeight: 700, fontSize: '1rem' }}
                  />
                </div>

                {/* Status and Grade row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: 'var(--tx, #101828)', marginBottom: '6px' }}>
                      Result Status
                    </label>
                    <select 
                      value={editModal.status} 
                      onChange={e => setEditModal(prev => ({ ...prev, status: e.target.value }))}
                      className="gb-select"
                      style={{ width: '100%', padding: '10px 14px' }}
                    >
                      <option value="pass">PASS (Certified)</option>
                      <option value="fail">FAIL (Unmet threshold)</option>
                      <option value="pending">PENDING (In review)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: 'var(--tx, #101828)', marginBottom: '6px' }}>
                      Awarded Grade
                    </label>
                    <select 
                      value={editModal.grade}
                      onChange={e => setEditModal(prev => ({ ...prev, grade: e.target.value }))}
                      className="gb-select"
                      style={{ width: '100%', padding: '10px 14px' }}
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
              </div>

              <div className="gb-modal-footer">
                <button 
                  type="button" 
                  className="gb-btn secondary"
                  disabled={editModal.saving}
                  onClick={() => setEditModal({ open: false, result: null, marks: '', status: 'pass', grade: 'A', saving: false })}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="gb-btn primary"
                  disabled={editModal.saving}
                >
                  <Save size={15} />
                  <span>{editModal.saving ? 'Saving...' : 'Save Result Adjustments'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: FORENSIC SUBMISSION COPY & MANUAL EVALUATION ──────────── */}
      {submissionModal.open && (
        <div 
          className="gb-modal-overlay" 
          onClick={() => !submissionModal.reevaluating && setSubmissionModal(prev => ({ ...prev, open: false }))}
        >
          <div className="gb-modal wide" onClick={e => e.stopPropagation()}>
            <div className="gb-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={22} color="var(--c1, #2563eb)" />
                <div>
                  <h3 className="gb-modal-title" style={{ fontSize: '1.25rem' }}>
                    Candidate Submitted Answer Copy
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--mu, #667085)' }}>
                    {submissionModal.data?.result ? (
                      <>
                        <strong>{submissionModal.data.result.student_name || submissionModal.data.student?.name || 'Candidate'}</strong> (Roll: {submissionModal.data.result.roll_no || submissionModal.data.student?.roll_no || 'N/A'}) &bull; {submissionModal.data.result.exam_title || submissionModal.data.exam?.title || 'Examination'}
                      </>
                    ) : 'Loading candidate answer sheet...'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {submissionModal.data?.result && (
                  <>
                    <button 
                      type="button"
                      className="gb-btn secondary"
                      disabled={submissionModal.reevaluating}
                      onClick={() => handleReevaluateSubmission(submissionModal.resultId)}
                      title="Re-run automatic scoring algorithm"
                    >
                      <RotateCcw size={14} className={submissionModal.reevaluating ? 'spin' : ''} />
                      <span>Re-evaluate Copy</span>
                    </button>
                    <button 
                      type="button"
                      className="gb-btn secondary"
                      onClick={() => window.print()}
                    >
                      <Printer size={14} />
                      <span>Print</span>
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setSubmissionModal(prev => ({ ...prev, open: false }))} 
                  className="gb-modal-close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="gb-modal-body">
              {submissionModal.loading ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--mu, #667085)' }}>
                  <RotateCcw size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block' }} />
                  <p style={{ margin: 0, fontSize: '0.92rem' }}>Loading candidate answer sheet and evaluation keys...</p>
                </div>
              ) : !submissionModal.data ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--mu, #667085)' }}>
                  <AlertCircle size={36} color="var(--bad, #c2410c)" style={{ margin: '0 auto 10px', display: 'block' }} />
                  <p>Unable to load candidate submission copy.</p>
                </div>
              ) : (
                (() => {
                  const subResult = submissionModal.data.result || {};
                  const subStudent = submissionModal.data.student || {};
                  const subExam = submissionModal.data.exam || {};
                  const subSession = submissionModal.data.session || {};
                  const questions = submissionModal.data.questions || [];

                  const studentName = subResult.student_name || subStudent.name || 'Candidate';
                  const studentRoll = subResult.roll_no || subStudent.roll_no || 'N/A';
                  const studentCode = subResult.student_code || subStudent.student_id;
                  const studentEmail = subResult.email || subStudent.email;

                  const totalEarned = subResult.marks_obtained !== undefined ? parseFloat(subResult.marks_obtained) : 0;
                  const totalExam = parseFloat(subResult.exam_total_marks || subResult.total_marks || subExam.total_marks) || 100;
                  const percentage = parseFloat(subResult.percentage) || (totalExam > 0 ? (totalEarned / totalExam) * 100 : 0);

                  const filteredQuestions = questions.filter(q => {
                    if (submissionModal.activeTab === 'mcq') return q.type === 'mcq' || q.type === 'true_false';
                    if (submissionModal.activeTab === 'coding') return q.type === 'coding';
                    if (submissionModal.activeTab === 'subjective') return q.type !== 'mcq' && q.type !== 'true_false' && q.type !== 'coding';
                    return true;
                  });

                  return (
                    <div>
                      {/* Hero Summary Card */}
                      <div className="gb-dossier-hero">
                        <div>
                          <div className="gb-dossier-title">Candidate Details</div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--tx, #101828)' }}>
                            {studentName}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--mu, #667085)', marginTop: '2px' }}>
                            Roll: <strong style={{ color: 'var(--tx, #101828)' }}>{studentRoll}</strong>
                            {studentCode && ` • ID: ${studentCode}`}
                          </div>
                          {studentEmail && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--c1, #2563eb)', marginTop: '2px' }}>
                              {studentEmail}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="gb-dossier-title">Evaluation Score</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            <span className="gb-dossier-score">{totalEarned.toFixed(2)}</span>
                            <span style={{ fontSize: '0.95rem', color: 'var(--mu, #667085)' }}>/ {totalExam}</span>
                            <span style={{ marginLeft: '6px' }}>
                              <StatusChip status={subResult.status} />
                            </span>
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--mu, #667085)', marginTop: '4px' }}>
                            Percentage: <strong>{percentage.toFixed(2)}%</strong> • Grade: <strong>{subResult.grade || 'N/A'}</strong>
                          </div>
                        </div>

                        <div>
                          <div className="gb-dossier-title">Exam Telemetry &amp; Proctoring</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.85rem' }}>
                            <Shield size={16} color={(subResult.session_violation_count || subSession.violation_count || 0) > 0 ? 'var(--bad, #c2410c)' : 'var(--good, #0f8a68)'} />
                            <span>Violations: <strong>{subResult.session_violation_count ?? subSession.violation_count ?? 0}</strong></span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--mu, #667085)', marginTop: '4px' }}>
                            Submitted: {subResult.submitted_at || subSession.submitted_at ? new Date(subResult.submitted_at || subSession.submitted_at).toLocaleString() : 'Recent'}
                          </div>
                        </div>
                      </div>

                      {/* Question Tabs */}
                      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--bd, #e6e9f0)', margin: '20px 0 16px', paddingBottom: '10px', flexWrap: 'wrap' }}>
                        {[
                          { id: 'all', label: `All Responses (${questions.length})` },
                          { id: 'mcq', label: `Objective / MCQ (${questions.filter(q => q.type === 'mcq' || q.type === 'true_false').length})` },
                          { id: 'coding', label: `Coding (${questions.filter(q => q.type === 'coding').length})` },
                          { id: 'subjective', label: `Subjective (${questions.filter(q => q.type !== 'mcq' && q.type !== 'true_false' && q.type !== 'coding').length})` }
                        ].map(tab => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSubmissionModal(prev => ({ ...prev, activeTab: tab.id }))}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '8px',
                              border: '1px solid transparent',
                              cursor: 'pointer',
                              fontSize: '0.84rem',
                              fontWeight: 600,
                              background: submissionModal.activeTab === tab.id ? 'var(--sf, #ffffff)' : 'transparent',
                              borderColor: submissionModal.activeTab === tab.id ? 'var(--bd, #e6e9f0)' : 'transparent',
                              color: submissionModal.activeTab === tab.id ? 'var(--c1, #2563eb)' : 'var(--mu, #667085)',
                              boxShadow: submissionModal.activeTab === tab.id ? 'var(--sh, 0 1px 2px rgba(16,24,40,0.04))' : 'none'
                            }}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Question List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filteredQuestions.length === 0 ? (
                          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--mu, #667085)' }}>
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

                            const selectedRaw = ans.selected_option !== null && ans.selected_option !== undefined ? String(ans.selected_option).trim() : null;
                            const correctRaw = q.correct_answer !== null && q.correct_answer !== undefined ? String(q.correct_answer).trim() : null;

                            return (
                              <div 
                                key={q.question_id || idx}
                                className={`gb-question-card ${hasAnswer && isMCQ ? (isCorrect ? 'correct' : 'incorrect') : ''}`}
                              >
                                <div className="gb-question-header">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ 
                                      background: 'var(--pr, #14213d)', 
                                      color: 'var(--onpr, #ffffff)', 
                                      fontWeight: 800, 
                                      fontSize: '0.8rem', 
                                      padding: '2px 8px', 
                                      borderRadius: '6px' 
                                    }}>
                                      Q{q.order_index || idx + 1}
                                    </span>
                                    <span style={{ 
                                      fontSize: '0.74rem', 
                                      fontWeight: 700, 
                                      textTransform: 'uppercase', 
                                      padding: '2px 8px', 
                                      borderRadius: '6px',
                                      background: 'var(--wash, rgba(37,99,235,0.08))',
                                      color: 'var(--c1, #2563eb)'
                                    }}>
                                      {q.type.replace('_', ' ')}
                                    </span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--mu, #667085)', fontWeight: 600 }}>
                                      Max: {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                                    </span>
                                  </div>

                                  <div>
                                    {!hasAnswer ? (
                                      <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 700, background: 'var(--s2, #f8f9fc)', color: 'var(--mu, #667085)' }}>
                                        Not Answered (0 marks)
                                      </span>
                                    ) : isMCQ ? (
                                      isCorrect ? (
                                        <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 700, background: 'var(--goods, #e1f4ec)', color: 'var(--good, #0f8a68)' }}>
                                          ✓ Correct (+{marksAwarded})
                                        </span>
                                      ) : (
                                        <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 700, background: 'var(--bads, #fdebe1)', color: 'var(--bad, #c2410c)' }}>
                                          ✕ Incorrect (0 marks)
                                        </span>
                                      )
                                    ) : (
                                      <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 700, background: 'var(--wash, rgba(37,99,235,0.08))', color: 'var(--c1, #2563eb)' }}>
                                        {ans.is_evaluated ? `Awarded: ${marksAwarded} / ${q.marks}` : 'Manual Review'}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--tx, #101828)', lineHeight: 1.5 }}>
                                  {q.question_text}
                                </div>

                                {/* Answers section */}
                                {isMCQ ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {optionsList.map((opt, optIdx) => {
                                      const optText = typeof opt === 'object' && opt !== null ? (opt.text || opt.label || '') : String(opt);
                                      const optKey = typeof opt === 'object' && opt !== null && opt.id ? String(opt.id) : String.fromCharCode(97 + optIdx);
                                      
                                      const isCandidateChoice = selectedRaw && (
                                        selectedRaw === optKey ||
                                        selectedRaw.toLowerCase() === optKey.toLowerCase() ||
                                        selectedRaw.trim().toLowerCase() === optText.trim().toLowerCase() ||
                                        selectedRaw === String(optIdx)
                                      );

                                      const isCorrectKey = correctRaw && (
                                        correctRaw === optKey ||
                                        correctRaw.toLowerCase() === optKey.toLowerCase() ||
                                        correctRaw.trim().toLowerCase() === optText.trim().toLowerCase() ||
                                        correctRaw === String(optIdx)
                                      );

                                      return (
                                        <div 
                                          key={optIdx}
                                          style={{
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            border: '1px solid',
                                            borderColor: isCorrectKey ? 'var(--good, #0f8a68)' : isCandidateChoice ? 'var(--bad, #c2410c)' : 'var(--bd, #e6e9f0)',
                                            background: isCorrectKey ? 'var(--goods, #e1f4ec)' : isCandidateChoice ? 'var(--bads, #fdebe1)' : 'var(--sf, #ffffff)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            fontSize: '0.86rem'
                                          }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: 700 }}>{String.fromCharCode(65 + optIdx)}.</span>
                                            <span>{optText}</span>
                                          </div>
                                          <div style={{ display: 'flex', gap: '6px' }}>
                                            {isCandidateChoice && (
                                              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: isCorrectKey ? 'var(--good, #0f8a68)' : 'var(--bad, #c2410c)', color: '#ffffff' }}>
                                                Candidate Choice
                                              </span>
                                            )}
                                            {isCorrectKey && (
                                              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'var(--good, #0f8a68)', color: '#ffffff' }}>
                                                Correct Key
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : isCoding ? (
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.78rem', color: 'var(--mu, #667085)', fontWeight: 700 }}>
                                      <span>Candidate Code Submission:</span>
                                      {ans.selected_language && <span>Language: {ans.selected_language}</span>}
                                    </div>
                                    <div className="gb-code-box">
                                      {ans.code_submission || '// No code submitted by candidate'}
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--mu, #667085)', fontWeight: 700, marginBottom: '6px' }}>
                                      Candidate Written Answer:
                                    </div>
                                    <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--s2, #f8f9fc)', border: '1px solid var(--bd, #e6e9f0)', fontSize: '0.88rem', lineHeight: 1.5, color: 'var(--tx, #101828)' }}>
                                      {ans.answer_text || 'No written response submitted'}
                                    </div>
                                  </div>
                                )}

                                {/* Manual Scoring and Remarks Adjustment */}
                                <div style={{ 
                                  marginTop: '10px', 
                                  paddingTop: '10px', 
                                  borderTop: '1px solid var(--bd, #e6e9f0)', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between', 
                                  flexWrap: 'wrap', 
                                  gap: '10px' 
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tx, #101828)' }}>Marks:</span>
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
                                        style={{ width: '70px', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--bd, #e6e9f0)', textAlign: 'center', fontWeight: 700 }}
                                      />
                                      <span style={{ fontSize: '0.78rem', color: 'var(--mu, #667085)' }}>/ {q.marks}</span>
                                    </div>

                                    <input 
                                      type="text"
                                      placeholder="Evaluator feedback / remarks..."
                                      value={submissionModal.editingRemarks[ans.id] !== undefined ? submissionModal.editingRemarks[ans.id] : (ans.evaluator_remarks || '')}
                                      onChange={e => {
                                        const val = e.target.value;
                                        setSubmissionModal(prev => ({
                                          ...prev,
                                          editingRemarks: { ...prev.editingRemarks, [ans.id]: val }
                                        }));
                                      }}
                                      disabled={!ans.id}
                                      style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--bd, #e6e9f0)', fontSize: '0.82rem', minWidth: '220px' }}
                                    />
                                  </div>

                                  {ans.id && (
                                    <button 
                                      type="button" 
                                      className="gb-action-btn primary"
                                      disabled={submissionModal.savingAnswerId === ans.id}
                                      onClick={() => handleSaveManualAnswerMarks(ans.id, q.type)}
                                    >
                                      <Save size={13} />
                                      <span>{submissionModal.savingAnswerId === ans.id ? 'Updating...' : 'Update Marks'}</span>
                                    </button>
                                  )}
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

            <div className="gb-modal-footer">
              <button 
                type="button"
                className="gb-btn secondary"
                onClick={() => setSubmissionModal(prev => ({ ...prev, open: false }))}
              >
                Close Copy View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
