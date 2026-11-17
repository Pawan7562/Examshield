// src/pages/admin/StudentManagement.js
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Search, 
  Upload, 
  Edit2, 
  Trash2, 
  UserPlus, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Mail, 
  Phone, 
  Users, 
  GraduationCap, 
  Building, 
  Calendar, 
  CheckCircle, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  RefreshCw, 
  Copy, 
  Send, 
  FileSpreadsheet, 
  FileText,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import './CandidateRegistry.css';

/* ── Modern Executive Modal ────────────────────────────────────────────────── */
const Modal = ({ open, onClose, title, icon: Icon, children }) => {
  if (!open) return null;
  return (
    <div className="cr-modal-overlay" onClick={onClose}>
      <div className="cr-modal" onClick={e => e.stopPropagation()}>
        <div className="cr-modal-header">
          <h3 className="cr-modal-title">
            {Icon && <Icon size={20} color="var(--c1, #2563eb)" />}
            <span>{title}</span>
          </h3>
          <button onClick={onClose} className="cr-modal-close" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <div className="cr-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

/* ── Form Input Helper ─────────────────────────────────────────────────────── */
const FormInput = ({ label, icon: Icon, error, hint, ...props }) => (
  <div className="cr-form-group">
    {label && (
      <label className="cr-form-label">
        {Icon && <Icon size={14} color="var(--mu, #667085)" />}
        <span>{label}</span>
      </label>
    )}
    <input {...props} className={`cr-form-input ${error ? 'error' : ''}`} />
    {error && <span className="cr-form-error">{error}</span>}
    {hint && !error && <span className="cr-form-hint">{hint}</span>}
  </div>
);

/* ── Candidate Initials Helper ─────────────────────────────────────────────── */
const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (name.substring(0, 2) || 'ST').toUpperCase();
};

export default function StudentManagement() {
  const { user } = useAuth();
  const collegeId = user?.id || '';
  const storageKey = collegeId ? `cached_admin_students_${collegeId}` : null;

  const [students, setStudents] = useState(() => {
    try {
      sessionStorage.removeItem('cached_admin_students');
      if (!storageKey) return [];
      const cached = sessionStorage.getItem(storageKey);
      if (!cached) return [];
      const parsed = JSON.parse(cached);
      return Array.isArray(parsed) ? parsed.filter(s => !collegeId || !s.college_id || s.college_id === collegeId) : [];
    } catch (_) {
      return [];
    }
  });

  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [departmentsList, setDepartmentsList] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [exams, setExams] = useState([]);
  const [credentialFallback, setCredentialFallback] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    rollNo: '', 
    department: '', 
    semester: '', 
    batch: '', 
    phone: '',
    examId: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [bulkModal, setBulkModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [bulkExamId, setBulkExamId] = useState('');
  const fileRef = useRef();

  // Tab & Password Requests state
  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'requests'
  const [passwordRequests, setPasswordRequests] = useState([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Reset Student Password Modal State
  const [resetModal, setResetModal] = useState(false);
  const [targetStudentForReset, setTargetStudentForReset] = useState(null);
  const [resetForm, setResetForm] = useState({
    newPassword: '',
    notifyEmail: true,
    adminNotes: '',
    linkedRequestId: null
  });
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSuccessData, setResetSuccessData] = useState(null);

  const fetchPasswordRequests = async () => {
    try {
      setRequestsLoading(true);
      const res = await adminAPI.getStudentPasswordRequests();
      const payload = res?.data || res;
      if (payload?.success || res?.success) {
        const reqList = payload?.requests || payload?.data?.requests || res?.requests || [];
        setPasswordRequests(reqList);
        setPendingRequestsCount(payload?.pendingCount || payload?.data?.pendingCount || res?.pendingCount || 0);
      }
    } catch (err) {
      console.error('Failed to load password requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = 'Exam#';
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setResetForm(f => ({ ...f, newPassword: pwd }));
    navigator.clipboard?.writeText(pwd);
    toast.success('Generated & copied password: ' + pwd);
  };

  const openResetModal = (student, linkedRequestId = null) => {
    setTargetStudentForReset(student);
    const initialPwd = 'Exam#' + Math.random().toString(36).substring(2, 6) + Math.floor(10 + Math.random() * 90);
    setResetForm({
      newPassword: initialPwd,
      notifyEmail: true,
      adminNotes: linkedRequestId ? 'Password reset processed via candidate assistance request' : '',
      linkedRequestId
    });
    setResetSuccessData(null);
    setResetModal(true);
  };

  const handleResetSubmit = async () => {
    if (!resetForm.newPassword || resetForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setResetSubmitting(true);
      const res = await adminAPI.resetStudentPassword(targetStudentForReset.id, {
        newPassword: resetForm.newPassword,
        notifyEmail: resetForm.notifyEmail,
        adminNotes: resetForm.adminNotes,
        requestId: resetForm.linkedRequestId
      });

      const isSuccess = res?.success || res?.data?.success;
      if (isSuccess) {
        toast.success(res?.message || res?.data?.message || 'Candidate password updated successfully');
        setResetSuccessData({
          student: targetStudentForReset,
          newPassword: resetForm.newPassword,
          emailSent: res?.data?.emailSent ?? res?.emailSent
        });
        setResetModal(false);
        fetchPasswordRequests();
        fetchStudents(pagination.page, true);
      } else {
        toast.error(res?.message || res?.data?.message || 'Failed to reset candidate password');
      }
    } catch (err) {
      const msg = err?.message || err?.response?.data?.message || (typeof err === 'string' ? err : 'Failed to reset password');
      toast.error(msg);
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleDismissRequest = async (requestId) => {
    if (!window.confirm('Dismiss this password assistance request?')) return;
    try {
      await adminAPI.resolvePasswordRequest(requestId, {
        status: 'dismissed',
        adminNotes: 'Dismissed by administrator'
      });
      toast.success('Request dismissed');
      fetchPasswordRequests();
    } catch {
      toast.error('Failed to dismiss request');
    }
  };

  const fetchStudents = async (page = 1, isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await adminAPI.getStudents({ 
        page, 
        limit: 15, 
        search: search || undefined,
        department: selectedDeptFilter !== 'all' ? selectedDeptFilter : undefined
      });
      const payload = res?.data || res;
      let list = payload?.students || payload?.data?.students || (Array.isArray(payload) ? payload : []);
      if (collegeId) {
        list = list.filter(s => !s.college_id || s.college_id === collegeId);
      }
      setStudents(list);
      if (payload?.departments && Array.isArray(payload.departments)) {
        setDepartmentsList(payload.departments);
      }
      if (storageKey) {
        try { sessionStorage.setItem(storageKey, JSON.stringify(list)); } catch (_) {}
      }
      const totalCount = payload?.total ?? payload?.data?.total ?? payload?.pagination?.total ?? list.length;
      const totalPages = payload?.pagination?.pages ?? payload?.data?.pagination?.pages ?? Math.ceil(totalCount / 15) ?? 1;
      setPagination({ 
        page, 
        total: totalCount, 
        pages: Math.max(1, totalPages)
      });
    } catch {
      toast.error('Failed to load candidate registry');
    } finally {
      setLoading(false);
    }
  };

  // Fetch strictly for current college
  useEffect(() => {
    if (!collegeId) return;
    try {
      const cached = sessionStorage.getItem(`cached_admin_students_${collegeId}`);
      if (cached) {
        setStudents(JSON.parse(cached));
      } else {
        setStudents([]);
      }
    } catch (_) {
      setStudents([]);
    }
    fetchStudents(1, false);
    fetchPasswordRequests();
  }, [collegeId]);

  // Debounce search
  useEffect(() => {
    if (!search) return;
    const t = setTimeout(() => fetchStudents(1, false), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Refetch when department filter changes
  useEffect(() => {
    fetchStudents(1, false);
  }, [selectedDeptFilter]);

  const setFormField = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setFormErrors(errors => ({ ...errors, [field]: '' }));
  };

  const openAdd = () => {
    setForm({ 
      name: '', 
      email: '', 
      rollNo: '', 
      department: '', 
      semester: '', 
      batch: '', 
      phone: '',
      examId: ''
    });
    setEditStudent(null);
    setFormErrors({});
    adminAPI.getExams({ page: 1, limit: 50 })
      .then(res => setExams(res.data?.exams || []))
      .catch(() => {});
    setAddModal(true);
  };

  const openEdit = (student) => {
    setForm({ 
      name: student.name, 
      email: student.email, 
      rollNo: student.roll_no, 
      department: student.department || '', 
      semester: student.semester || '', 
      batch: student.batch || '', 
      phone: student.phone || '',
      examId: ''
    });
    setEditStudent(student);
    setFormErrors({});
    setAddModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Candidate full name is required';
    if (!form.email.trim()) errors.email = 'Candidate institutional email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email format';
    if (!form.rollNo.trim()) errors.rollNo = 'University / College roll number is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      if (editStudent) {
        await adminAPI.updateStudent(editStudent.id, form);
        toast.success('Candidate updated successfully');
      } else {
        const response = await adminAPI.addStudent(form);
        const data = response.data?.data || response.data;
        setCredentialFallback(data);
        const keyMsg = data?.exam_key ? ` • Exam Key: ${data.exam_key}` : '';
        if (data?.emailSent) {
          toast.success(`Candidate enrolled! Credentials${keyMsg} sent to ${data.email}`);
        } else {
          toast('Candidate enrolled! Credentials generated below (email delivery pending).');
        }
      }
      setAddModal(false);
      fetchStudents(1);
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id, name, isActive) => {
    try {
      await adminAPI.toggleStudent(id);
      toast.success(`${name} ${isActive ? 'deactivated' : 'activated'} successfully`);
      fetchStudents(pagination.page);
    } catch {
      toast.error('Status update failed');
    }
  };

  const handleResendCredentials = async (student) => {
    if (!window.confirm(`Resend credentials email to ${student.name} (${student.email})? A fresh login password will be generated and dispatched.`)) return;
    try {
      toast.loading(`Sending credentials to ${student.email}...`, { id: 'resend-toast' });
      const res = await adminAPI.resendStudentCredentials(student.id);
      const data = res?.data || res;
      toast.success(res?.message || 'Credentials resent successfully!', { id: 'resend-toast' });
      setCredentialFallback({
        ...data,
        name: student.name,
        email: student.email,
        student_id: student.student_id
      });
      fetchStudents(pagination.page || 1, true);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to resend credentials', { id: 'resend-toast' });
    }
  };

  const deleteStudent = async (id, name) => {
    if (!window.confirm(`Delete candidate ${name}? This will remove them from all active examinations.`)) return;

    const purgeFromLocal = () => {
      setStudents(prev => prev.filter(s => s.id !== id && s.student_id !== id));
      if (storageKey) {
        try {
          const cached = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
          const updated = cached.filter(s => s.id !== id && s.student_id !== id);
          sessionStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (_) {}
      }
    };

    try {
      const res = await adminAPI.deleteStudent(id);
      purgeFromLocal();
      toast.success(res?.message || 'Candidate removed from registry');
      fetchStudents(pagination.page || 1, true);
    } catch (err) {
      purgeFromLocal();
      const status = err?.response?.status;
      if (status === 404) {
        toast('Candidate already removed from registry');
      } else {
        toast.error(err?.response?.data?.message || err?.message || 'Delete failed');
      }
      fetchStudents(pagination.page || 1, true);
    }
  };

  const openBulkUpload = () => {
    setCsvFile(null);
    setBulkExamId('');
    adminAPI.getExams({ page: 1, limit: 50 })
      .then(res => setExams(res.data?.exams || []))
      .catch(() => {});
    setBulkModal(true);
  };

  const downloadExcelTemplate = () => {
    try {
      const templateData = [
        {
          'Student Name': 'Aarav Sharma',
          'Email Address': 'aarav.sharma@example.com',
          'Roll Number': 'CS2026-001',
          'Department': 'Computer Science',
          'Batch': '2022-26',
          'Semester': '6th'
        },
        {
          'Student Name': 'Diya Patel',
          'Email Address': 'diya.patel@example.com',
          'Roll Number': 'CS2026-002',
          'Department': 'Information Technology',
          'Batch': '2022-26',
          'Semester': '6th'
        }
      ];
      const ws = XLSX.utils.json_to_sheet(templateData);
      ws['!cols'] = [
        { wch: 22 },
        { wch: 30 },
        { wch: 18 },
        { wch: 26 },
        { wch: 14 },
        { wch: 12 }
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Candidates_Roster');
      XLSX.writeFile(wb, 'nexify_examina_candidates_template.xlsx');
      toast.success('Excel candidate template downloaded');
    } catch (err) {
      toast.error('Failed to create Excel template: ' + err.message);
    }
  };

  const downloadCsvTemplate = () => {
    const csvContent = 'Student Name,Email Address,Roll Number,Department,Batch,Semester\n' +
      'Aarav Sharma,aarav.sharma@example.com,CS2026-001,Computer Science,2022-26,6th\n' +
      'Diya Patel,diya.patel@example.com,CS2026-002,Information Technology,2022-26,6th';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'nexify_examina_candidates_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('CSV candidate template downloaded');
  };

  const handleBulkUpload = async () => {
    if (!csvFile) return toast.error('Please select a CSV or Excel file first');
    const fd = new FormData();
    fd.append('file', csvFile);
    if (bulkExamId) {
      fd.append('examId', bulkExamId);
    }
    setSubmitting(true);
    try {
      const res = await adminAPI.bulkUpload(fd);
      const payload = res.data?.data || res.data || {};
      const createdCount = payload.created ?? payload.uploaded?.length ?? 0;
      const emailsCount = payload.emailsSent ?? createdCount;
      const failedCount = payload.failed ?? payload.errors?.length ?? 0;

      if (createdCount > 0) {
        toast.success(`🎉 ${createdCount} candidate(s) enrolled! ${emailsCount} credentials email(s) dispatched.`);
      } else {
        toast.error(res.data?.message || 'No new candidates were added.');
      }

      if (failedCount > 0 && Array.isArray(payload.errors) && payload.errors.length > 0) {
        const sampleErrors = payload.errors.slice(0, 3).join('\n');
        toast((t) => (
          <div style={{ maxWidth: '420px' }}>
            <strong>{failedCount} row(s) skipped:</strong>
            <pre style={{ fontSize: '11px', marginTop: '6px', whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto' }}>
              {sampleErrors}
            </pre>
          </div>
        ), { duration: 7000 });
      }

      setBulkModal(false);
      setCsvFile(null);
      setBulkExamId('');
      fetchStudents(1, true);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Bulk candidate upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics computation
  const activeCount = students.filter(s => s.is_active).length;

  return (
    <div className="cr-container">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="cr-header">
        <div className="cr-header-left">
          <div className="cr-eyebrow">
            <span className="cr-eyebrow-dot" />
            <span>Institutional Candidate Roster &amp; Key Provisioning</span>
          </div>
          <h1 className="cr-title">Candidate Registry &amp; Enrollment</h1>
          <p className="cr-subtitle">
            <span>Manage registered student identities, secure exam access keys, and credential dispatch.</span>
          </p>
        </div>

        <div className="cr-header-actions">
          <button type="button" className="cr-btn secondary" onClick={openBulkUpload}>
            <Upload size={16} />
            <span>Bulk Upload Roster</span>
          </button>
          <button type="button" className="cr-btn primary" onClick={openAdd}>
            <UserPlus size={16} />
            <span>Enroll Candidate</span>
          </button>
        </div>
      </div>

      {/* ── Executive Metric KPI Cards ──────────────────────────────────────── */}
      <div className="cr-metrics-grid">
        <div className="cr-metric-card">
          <div className="cr-metric-icon">
            <Users size={22} />
          </div>
          <div className="cr-metric-content">
            <span className="cr-metric-label">Total Enrolled</span>
            <span className="cr-metric-value">{pagination.total.toLocaleString()}</span>
          </div>
        </div>

        <div className="cr-metric-card">
          <div className="cr-metric-icon good">
            <UserCheck size={22} />
          </div>
          <div className="cr-metric-content">
            <span className="cr-metric-label">Active on Roster</span>
            <span className="cr-metric-value">{activeCount}</span>
          </div>
        </div>

        <div className="cr-metric-card">
          <div className="cr-metric-icon gold">
            <Building size={22} />
          </div>
          <div className="cr-metric-content">
            <span className="cr-metric-label">Departments</span>
            <span className="cr-metric-value">{departmentsList.length || '—'}</span>
          </div>
        </div>

        <div className="cr-metric-card" style={{ cursor: 'pointer' }} onClick={() => { setActiveTab('requests'); fetchPasswordRequests(); }}>
          <div className={`cr-metric-icon ${pendingRequestsCount > 0 ? 'bad' : ''}`}>
            <Key size={22} />
          </div>
          <div className="cr-metric-content">
            <span className="cr-metric-label">Password Queue</span>
            <span className="cr-metric-value" style={{ color: pendingRequestsCount > 0 ? 'var(--bad, #c2410c)' : 'inherit' }}>
              {pendingRequestsCount}
            </span>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ─────────────────────────────────────────────────── */}
      <div className="cr-tabs-bar">
        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`cr-tab-btn ${activeTab === 'students' ? 'active' : ''}`}
        >
          <Users size={16} />
          <span>Enrolled Candidates</span>
          <span className="cr-tab-badge">{pagination.total}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('requests');
            fetchPasswordRequests();
          }}
          className={`cr-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
        >
          <Key size={16} />
          <span>Candidate Password Requests</span>
          <span className={`cr-tab-badge ${pendingRequestsCount > 0 ? 'alert' : ''}`}>
            {pendingRequestsCount > 0 ? `${pendingRequestsCount} Pending` : '0'}
          </span>
        </button>
      </div>

      {/* ── TAB 1: Enrolled Candidates Roster ──────────────────────────────── */}
      {activeTab === 'students' && (
        <>
          {/* Search & Filter Bar */}
          <div className="cr-filter-card">
            <div className="cr-search-box">
              <Search size={18} className="cr-search-icon" />
              <input
                type="text"
                className="cr-search-input"
                placeholder="Search candidates by name, email, roll number, or student ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" className="cr-search-clear" onClick={() => setSearch('')}>
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="cr-filter-group">
              <div className="cr-select-wrapper">
                <Building size={15} className="cr-select-icon" />
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="cr-select"
                  aria-label="Filter candidates by department"
                >
                  <option value="all">All Academic Departments</option>
                  {departmentsList.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                  <option value="unassigned">Unassigned</option>
                </select>
                <ChevronDown size={14} className="cr-select-arrow" />
              </div>

              {(search || selectedDeptFilter !== 'all') && (
                <button
                  type="button"
                  className="cr-action-btn"
                  onClick={() => {
                    setSearch('');
                    setSelectedDeptFilter('all');
                  }}
                >
                  <RefreshCw size={13} />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Table Card */}
          <div className="cr-table-card">
            <div className="cr-table-wrapper">
              <table className="cr-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Student ID</th>
                    <th>Roll Number</th>
                    <th>Department</th>
                    <th>Semester &amp; Batch</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--mu, #667085)' }}>
                        <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px', display: 'block' }} />
                        <span>Loading candidate registry...</span>
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '56px 20px' }}>
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
                          <Users size={28} />
                        </div>
                        <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 600, color: 'var(--tx, #101828)' }}>
                          No candidates found
                        </h3>
                        <p style={{ margin: '0 0 18px', fontSize: '0.86rem', color: 'var(--mu, #667085)' }}>
                          {search ? `No results matching "${search}"` : 'Your candidate roster is empty. Enroll candidates to get started.'}
                        </p>
                        {!search && (
                          <button type="button" className="cr-btn primary" onClick={openAdd}>
                            <UserPlus size={16} />
                            <span>Enroll First Candidate</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <div className="cr-candidate-cell">
                            <div className="cr-candidate-avatar">
                              {getInitials(student.name)}
                            </div>
                            <div className="cr-candidate-meta">
                              <span className="cr-candidate-name">{student.name}</span>
                              <span className="cr-candidate-sub">
                                <Mail size={12} />
                                {student.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="cr-id-pill">{student.student_id}</span>
                        </td>
                        <td>
                          <span className="cr-roll-badge">{student.roll_no}</span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', color: 'var(--tx, #101828)' }}>
                            <Building size={14} color="var(--mu, #667085)" />
                            {student.department || '—'}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', color: 'var(--mu, #667085)' }}>
                            <GraduationCap size={14} />
                            {[student.semester, student.batch].filter(Boolean).join(' • ') || '—'}
                          </span>
                        </td>
                        <td>
                          <span className={`cr-chip ${student.is_active ? 'active' : 'inactive'}`}>
                            <span className="cr-chip-dot" />
                            {student.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td>
                          <div className="cr-action-group">
                            <button
                              type="button"
                              className="cr-action-btn primary"
                              onClick={() => openResetModal(student)}
                              title="Reset candidate password & credentials"
                            >
                              <Key size={13} />
                              <span>Reset Key</span>
                            </button>

                            <button
                              type="button"
                              className="cr-action-btn"
                              onClick={() => handleResendCredentials(student)}
                              title="Resend email credentials"
                            >
                              <Send size={13} />
                              <span>Resend</span>
                            </button>

                            <button
                              type="button"
                              className="cr-action-btn"
                              onClick={() => openEdit(student)}
                              title="Edit candidate profile"
                            >
                              <Edit2 size={13} />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              className="cr-action-btn"
                              onClick={() => toggleStatus(student.id, student.name, student.is_active)}
                              title={student.is_active ? 'Deactivate candidate' : 'Activate candidate'}
                            >
                              {student.is_active ? 'Disable' : 'Enable'}
                            </button>

                            <button
                              type="button"
                              className="cr-action-btn danger"
                              onClick={() => deleteStudent(student.id, student.name)}
                              title="Remove candidate from registry"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="cr-pagination-bar">
                <span className="cr-pagination-info">
                  Showing page {pagination.page} of {pagination.pages} ({pagination.total} candidates total)
                </span>

                <div className="cr-pagination-controls">
                  <button
                    type="button"
                    onClick={() => fetchStudents(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="cr-page-btn"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => fetchStudents(pageNum)}
                        className={`cr-page-btn ${pageNum === pagination.page ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => fetchStudents(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="cr-page-btn"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TAB 2: Candidate Password Requests Queue ───────────────────────── */}
      {activeTab === 'requests' && (
        <div className="cr-table-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--bd, #e6e9f0)', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--tx, #101828)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} color="var(--c1, #2563eb)" />
                <span>Candidate Password &amp; Credential Assistance Queue</span>
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--mu, #667085)' }}>
                Review locked-out candidates and securely dispatch reset credentials to their registered email.
              </p>
            </div>
            <button type="button" className="cr-btn secondary" onClick={fetchPasswordRequests} disabled={requestsLoading}>
              <RefreshCw size={14} className={requestsLoading ? 'spin' : ''} />
              <span>Refresh Queue</span>
            </button>
          </div>

          <div className="cr-table-wrapper">
            <table className="cr-table">
              <thead>
                <tr>
                  <th>Candidate Info</th>
                  <th>Roll Number</th>
                  <th>Submitted At</th>
                  <th>Requested From</th>
                  <th>Reason &amp; Notes</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {requestsLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--mu, #667085)' }}>
                      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px', display: 'block' }} />
                      Loading assistance queue...
                    </td>
                  </tr>
                ) : passwordRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--mu, #667085)' }}>
                      <CheckCircle2 size={32} color="var(--good, #0f8a68)" style={{ margin: '0 auto 10px', display: 'block' }} />
                      <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--tx, #101828)' }}>Queue is clear</h4>
                      <p style={{ margin: 0, fontSize: '0.84rem' }}>No pending password assistance requests from candidates.</p>
                    </td>
                  </tr>
                ) : (
                  passwordRequests.map((req) => (
                    <tr key={req.id}>
                      <td>
                        <div className="cr-candidate-meta">
                          <span style={{ fontWeight: 600, color: 'var(--tx, #101828)' }}>{req.student_name}</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--mu, #667085)' }}>{req.student_email}</span>
                          {req.student_id && (
                            <span className="cr-id-pill" style={{ marginTop: '2px', display: 'inline-block' }}>{req.student_id}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="cr-roll-badge">{req.roll_no || '—'}</span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--mu, #667085)' }}>
                        {req.created_at ? new Date(req.created_at).toLocaleString() : 'Recent'}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--mu, #667085)' }}>
                        {req.ip_address || 'Exam Portal'}
                      </td>
                      <td>
                        <div style={{ maxWidth: '240px', fontSize: '0.82rem', color: 'var(--tx, #101828)', lineHeight: 1.4 }}>
                          {req.reason || 'Locked out of exam portal'}
                        </div>
                      </td>
                      <td>
                        <span className={`cr-chip ${req.status === 'resolved' ? 'active' : 'inactive'}`} style={{
                          background: req.status === 'resolved' ? 'var(--goods, #e1f4ec)' : 'var(--bads, #fdebe1)',
                          color: req.status === 'resolved' ? 'var(--good, #0f8a68)' : 'var(--bad, #c2410c)'
                        }}>
                          <span className="cr-chip-dot" />
                          {req.status?.toUpperCase() || 'PENDING'}
                        </span>
                      </td>
                      <td>
                        <div className="cr-action-group">
                          {req.status === 'pending' ? (
                            <>
                              <button
                                type="button"
                                className="cr-action-btn primary"
                                onClick={() => openResetModal({
                                  id: req.student_uuid || req.student_id,
                                  name: req.student_name,
                                  email: req.student_email,
                                  student_id: req.student_id,
                                  roll_no: req.roll_no
                                }, req.id)}
                              >
                                <Key size={13} />
                                <span>Reset &amp; Resolve</span>
                              </button>
                              <button
                                type="button"
                                className="cr-action-btn danger"
                                onClick={() => handleDismissRequest(req.id)}
                              >
                                Dismiss
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--good, #0f8a68)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={14} /> Resolved
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL 1: Enroll / Edit Candidate Modal ─────────────────────────── */}
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title={editStudent ? 'Edit Candidate Profile' : 'Enroll New Candidate'}
        icon={editStudent ? Edit2 : UserPlus}
      >
        <div className="cr-form-grid">
          <FormInput 
            label="Candidate Full Name *" 
            icon={Users}
            value={form.name} 
            onChange={setFormField('name')} 
            placeholder="e.g. Aarav Sharma"
            error={formErrors.name}
          />

          <FormInput 
            label="Institutional Email *" 
            type="email" 
            icon={Mail}
            value={form.email} 
            onChange={setFormField('email')} 
            placeholder="candidate@university.edu" 
            disabled={!!editStudent}
            error={formErrors.email}
          />

          <FormInput 
            label="University / College Roll No *" 
            icon={GraduationCap}
            value={form.rollNo} 
            onChange={setFormField('rollNo')} 
            placeholder="e.g. CS2026-042"
            error={formErrors.rollNo}
          />

          <FormInput 
            label="Academic Department" 
            icon={Building}
            value={form.department} 
            onChange={setFormField('department')} 
            placeholder="e.g. Computer Science" 
          />

          <FormInput 
            label="Current Semester" 
            icon={Calendar}
            value={form.semester} 
            onChange={setFormField('semester')} 
            placeholder="e.g. 6th Semester" 
          />

          <FormInput 
            label="Academic Batch" 
            icon={Calendar}
            value={form.batch} 
            onChange={setFormField('batch')} 
            placeholder="e.g. 2022-2026" 
          />

          <div className="cr-form-group full">
            <FormInput 
              label="Contact Phone (Optional)" 
              icon={Phone}
              value={form.phone} 
              onChange={setFormField('phone')} 
              placeholder="+91 98765 43210" 
            />
          </div>

          {!editStudent && (
            <div className="cr-form-group full">
              <label className="cr-form-label">
                <Key size={14} color="var(--c1, #2563eb)" />
                <span>Assign to Examination &amp; Issue Access Key (Optional)</span>
              </label>
              <select
                className="cr-form-select"
                value={form.examId || ''}
                onChange={setFormField('examId')}
              >
                <option value="">-- Automatically Assign to Active Examination --</option>
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} (Key: {ex.exam_key || ex.exam_code || 'Auto-Key'})
                  </option>
                ))}
              </select>
              <span className="cr-form-hint">
                The candidate will automatically receive their <strong>Student ID</strong>, <strong>Temporary Password</strong>, and <strong>Exam Access Key</strong> directly via official email.
              </span>
            </div>
          )}
        </div>

        {!editStudent && (
          <div className="cr-info-banner">
            <Sparkles size={18} color="var(--c1, #2563eb)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Instant Identity Provisioning:</strong> Nexify Examina creates an immutable candidate record, generates cryptographic credentials, and sends an official induction email.
            </div>
          </div>
        )}

        <div className="cr-modal-footer">
          <button type="button" className="cr-btn secondary" onClick={() => setAddModal(false)}>
            Cancel
          </button>
          <button type="button" className="cr-btn primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Enrolling Candidate...' : editStudent ? 'Update Profile' : 'Enroll Candidate'}
          </button>
        </div>
      </Modal>

      {/* ── MODAL 2: Fallback Credentials & Exam Access Key ────────────────── */}
      <Modal
        open={!!credentialFallback}
        onClose={() => setCredentialFallback(null)}
        title="Candidate Credentials &amp; Exam Key"
        icon={Key}
      >
        <div className="cr-info-banner success">
          <CheckCircle2 size={18} color="var(--good, #0f8a68)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            Candidate enrolled successfully! Official credentials generated. Share or copy these details:
          </div>
        </div>

        <div className="cr-form-grid" style={{ marginTop: '12px' }}>
          <FormInput label="Student ID" value={credentialFallback?.student_id || ''} readOnly />
          <FormInput label="Email Address" value={credentialFallback?.email || ''} readOnly />
          <div className="cr-form-group full">
            <FormInput label="Temporary Password" value={credentialFallback?.password || ''} readOnly />
          </div>

          {credentialFallback?.exam_key && (
            <div className="cr-form-group full">
              <label className="cr-form-label" style={{ color: 'var(--good, #0f8a68)', fontWeight: 700 }}>
                🔑 Exam Access Key ({credentialFallback?.exam_name || 'Scheduled Exam'})
              </label>
              <div className="cr-key-box">
                {credentialFallback?.exam_key}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--s2, #f8f9fc)', border: '1px solid var(--bd, #e6e9f0)', fontSize: '0.82rem', color: 'var(--mu, #667085)', lineHeight: 1.5 }}>
          💡 <strong>Delivery Note:</strong> Credentials were dispatched to <strong>{credentialFallback?.email}</strong>. If not visible in the Primary Inbox, advise the candidate to check Spam or deliver directly.
        </div>

        <div className="cr-modal-footer">
          <button
            type="button"
            className="cr-btn secondary"
            onClick={() => {
              const text = [
                `Student ID: ${credentialFallback?.student_id || ''}`,
                `Email: ${credentialFallback?.email || ''}`,
                `Password: ${credentialFallback?.password || ''}`,
                credentialFallback?.exam_key ? `Exam Key: ${credentialFallback.exam_key}` : '',
                `Login URL: ${window.location.origin}/student/login`
              ].filter(Boolean).join('\n');
              navigator.clipboard.writeText(text)
                .then(() => toast.success('All credentials & Exam Key copied to clipboard!'))
                .catch(() => toast.error('Could not copy credentials'));
            }}
          >
            <Copy size={15} />
            <span>Copy All Details</span>
          </button>
          <button type="button" className="cr-btn primary" onClick={() => setCredentialFallback(null)}>
            Done
          </button>
        </div>
      </Modal>

      {/* ── MODAL 3: Bulk Upload Roster (CSV & Excel) ──────────────────────── */}
      <Modal
        open={bulkModal}
        onClose={() => setBulkModal(false)}
        title="Bulk Upload Candidate Roster"
        icon={Upload}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="cr-info-banner">
            <Users size={18} color="var(--c1, #2563eb)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Automated Batch Provisioning:</strong> Upload your candidate roster via CSV or Excel (.xlsx, .xls). Every registered student will receive their official credentials automatically.
            </div>
          </div>

          {/* Exam Selection */}
          {exams && exams.length > 0 && (
            <div className="cr-form-group">
              <label className="cr-form-label">
                <Key size={14} color="var(--c1, #2563eb)" />
                <span>Assign to Scheduled Exam (Optional)</span>
              </label>
              <select
                className="cr-form-select"
                value={bulkExamId}
                onChange={(e) => setBulkExamId(e.target.value)}
              >
                <option value="">-- General Account Invitation (No specific exam) --</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title || ex.name} ({ex.exam_key || ex.exam_code || 'Auto-Key'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Interactive Dropzone */}
          <div 
            className={`cr-dropzone ${csvFile ? 'has-file' : ''}`}
            onClick={() => fileRef.current.click()}
          >
            <div className="cr-dropzone-icon">
              {csvFile ? (
                csvFile.name.endsWith('.xlsx') || csvFile.name.endsWith('.xls') ? (
                  <FileSpreadsheet size={28} />
                ) : (
                  <FileText size={28} />
                )
              ) : (
                <Upload size={28} />
              )}
            </div>

            {csvFile ? (
              <>
                <div className="cr-dropzone-title">{csvFile.name}</div>
                <div className="cr-dropzone-sub">
                  {(csvFile.size / 1024).toFixed(1)} KB • Click to choose a different roster file
                </div>
                <span style={{ color: 'var(--good, #0f8a68)', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={14} /> Ready for batch enrollment
                </span>
              </>
            ) : (
              <>
                <div className="cr-dropzone-title">Click to select CSV or Excel roster</div>
                <div className="cr-dropzone-sub">Supports .xlsx, .xls, and .csv files up to 10MB</div>
              </>
            )}

            <input 
              ref={fileRef} 
              type="file" 
              accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv" 
              style={{ display: 'none' }} 
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  setCsvFile(e.target.files[0]);
                }
              }} 
            />
          </div>

          {/* Download Starter Templates */}
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--mu, #667085)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Download Standard Roster Templates:
            </span>
            <div className="cr-template-pills">
              <button type="button" className="cr-template-pill" onClick={downloadExcelTemplate}>
                <FileSpreadsheet size={15} color="#107c41" />
                <span>Excel Template (.xlsx)</span>
              </button>
              <button type="button" className="cr-template-pill" onClick={downloadCsvTemplate}>
                <Download size={15} color="var(--c1, #2563eb)" />
                <span>CSV Template (.csv)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="cr-modal-footer">
          <button type="button" className="cr-btn secondary" onClick={() => setBulkModal(false)} disabled={submitting}>
            Cancel
          </button>
          <button 
            type="button" 
            className="cr-btn primary" 
            onClick={handleBulkUpload} 
            disabled={!csvFile || submitting}
          >
            <Send size={15} />
            <span>{submitting ? 'Uploading & Dispathing...' : 'Upload & Enroll Roster'}</span>
          </button>
        </div>
      </Modal>

      {/* ── MODAL 4: Secure Password Reset ─────────────────────────────────── */}
      <Modal
        open={resetModal}
        onClose={() => setResetModal(false)}
        title="Secure Candidate Password Reset"
        icon={Key}
      >
        {targetStudentForReset && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'var(--s2, #f8f9fc)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--bd, #e6e9f0)' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--tx, #101828)' }}>
                {targetStudentForReset.name}
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--mu, #667085)', marginTop: '4px' }}>
                Roll No: <strong style={{ color: 'var(--tx, #101828)' }}>{targetStudentForReset.roll_no}</strong> • Student ID: <strong style={{ color: 'var(--tx, #101828)' }}>{targetStudentForReset.student_id}</strong>
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--c1, #2563eb)', marginTop: '2px' }}>
                {targetStudentForReset.email}
              </div>
            </div>

            <div className="cr-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="cr-form-label" style={{ margin: 0 }}>
                  New Password *
                </label>
                <button
                  type="button"
                  onClick={generateSecurePassword}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--c1, #2563eb)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={12} />
                  Auto-Generate Password
                </button>
              </div>
              <input
                type="text"
                className="cr-form-input"
                placeholder="Enter new password (min 6 chars)"
                value={resetForm.newPassword}
                onChange={(e) => setResetForm(f => ({ ...f, newPassword: e.target.value }))}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: 'var(--tx, #101828)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={resetForm.notifyEmail}
                onChange={(e) => setResetForm(f => ({ ...f, notifyEmail: e.target.checked }))}
              />
              <span>Send updated credentials email to candidate</span>
            </label>

            <div className="cr-form-group">
              <label className="cr-form-label">
                Resolution Notes (Optional)
              </label>
              <textarea
                className="cr-form-textarea"
                rows={2}
                placeholder="e.g. Identity verified via university roll number and updated credentials issued"
                value={resetForm.adminNotes}
                onChange={(e) => setResetForm(f => ({ ...f, adminNotes: e.target.value }))}
              />
            </div>

            <div className="cr-modal-footer">
              <button type="button" className="cr-btn secondary" onClick={() => setResetModal(false)}>
                Cancel
              </button>
              <button type="button" className="cr-btn primary" onClick={handleResetSubmit} disabled={resetSubmitting}>
                {resetSubmitting ? 'Resetting Password...' : 'Confirm & Reset Password'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL 5: Reset Success Confirmation ────────────────────────────── */}
      <Modal
        open={!!resetSuccessData}
        onClose={() => setResetSuccessData(null)}
        title="Candidate Password Updated"
        icon={CheckCircle2}
      >
        <div className="cr-info-banner success">
          <CheckCircle2 size={18} color="var(--good, #0f8a68)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            Password updated in database {resetSuccessData?.emailSent ? 'and emailed to candidate' : ''}!
          </div>
        </div>

        <div className="cr-form-grid" style={{ marginTop: '14px' }}>
          <FormInput label="Candidate Name" value={resetSuccessData?.student?.name || ''} readOnly />
          <FormInput label="Email Address" value={resetSuccessData?.student?.email || ''} readOnly />
          <div className="cr-form-group full">
            <label className="cr-form-label" style={{ color: 'var(--good, #0f8a68)', fontWeight: 700 }}>
              🔑 New Account Password
            </label>
            <div className="cr-key-box">
              {resetSuccessData?.newPassword}
            </div>
          </div>
        </div>

        <div className="cr-modal-footer">
          <button
            type="button"
            className="cr-btn secondary"
            onClick={() => {
              const text = [
                `Candidate: ${resetSuccessData?.student?.name || ''}`,
                `Student ID: ${resetSuccessData?.student?.student_id || ''}`,
                `Email: ${resetSuccessData?.student?.email || ''}`,
                `New Password: ${resetSuccessData?.newPassword || ''}`,
                `Login URL: ${window.location.origin}/student/login`
              ].join('\n');
              navigator.clipboard?.writeText(text);
              toast.success('Credentials copied to clipboard!');
            }}
          >
            <Copy size={15} />
            <span>Copy Credentials</span>
          </button>
          <button type="button" className="cr-btn primary" onClick={() => setResetSuccessData(null)}>
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
}
