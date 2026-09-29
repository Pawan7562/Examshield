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
  Filter,
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
  XCircle,
  AlertCircle,
  Key,
  RefreshCw,
  Copy,
  Clock
} from 'lucide-react';
import '../../components/admin/AdminSidebar.css';

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal">
        <div className="admin-modal-header">
          <h3 className="admin-modal-title">{title}</h3>
          <button onClick={onClose} className="admin-modal-close">
            <X size={20} />
          </button>
        </div>
        <div className="admin-modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, icon: Icon, error, ...props }) => (
  <div className="admin-form-group">
    <label className="admin-form-label">
      {Icon && <Icon size={16} />}
      {label}
    </label>
    <input {...props} className={`admin-form-input ${error ? 'error' : ''}`} />
    {error && <span className="admin-form-error">{error}</span>}
  </div>
);

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

const StatusBadge = ({ isActive }) => (
  <span className={`admin-status-badge ${isActive ? 'active' : 'inactive'}`}>
    {isActive ? (
      <>
        <CheckCircle size={12} />
        ACTIVE
      </>
    ) : (
      <>
        <XCircle size={12} />
        INACTIVE
      </>
    )}
  </span>
);

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
  const [resendingId, setResendingId] = useState(null);
  const [bulkModal, setBulkModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
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
    toast.success('Generated password: ' + pwd);
  };

  const openResetModal = (student, linkedRequestId = null) => {
    setTargetStudentForReset(student);
    const initialPwd = 'Exam#' + Math.random().toString(36).substring(2, 6) + Math.floor(10 + Math.random() * 90);
    setResetForm({
      newPassword: initialPwd,
      notifyEmail: true,
      adminNotes: linkedRequestId ? 'Password reset processed via assistance request' : '',
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
        toast.success(res?.message || res?.data?.message || 'Student password updated successfully');
        setResetSuccessData({
          student: targetStudentForReset,
          newPassword: resetForm.newPassword,
          emailSent: res?.data?.emailSent ?? res?.emailSent
        });
        setResetModal(false);
        fetchPasswordRequests();
        fetchStudents(pagination.page, true);
      } else {
        toast.error(res?.message || res?.data?.message || 'Failed to reset student password');
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
    } catch (err) {
      toast.error('Failed to dismiss request');
    }
  };

  const fetchStudents = async (page = 1, isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await adminAPI.getStudents({ page, limit: 15, search: search || undefined });
      const payload = res?.data || res;
      let list = payload?.students || payload?.data?.students || (Array.isArray(payload) ? payload : []);
      if (collegeId) {
        list = list.filter(s => !s.college_id || s.college_id === collegeId);
      }
      setStudents(list);
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
      toast.error('Failed to load students');
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

  // Debounce only when actively searching
  useEffect(() => {
    if (!search) return;
    const t = setTimeout(() => fetchStudents(1, false), 250);
    return () => clearTimeout(t);
  }, [search]);

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
    // Load published & upcoming exams so admin can select one
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
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email format';
    if (!form.rollNo.trim()) errors.rollNo = 'Roll number is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      if (editStudent) {
        await adminAPI.updateStudent(editStudent.id, form);
        toast.success('Student updated successfully');
      } else {
        const response = await adminAPI.addStudent(form);
        const data = response.data?.data || response.data;
        if (data?.emailSent) {
          const keyMsg = data?.exam_key ? ` Exam Key: ${data.exam_key}` : '';
          toast.success(`Student added! Credentials &${keyMsg} sent to ${data.email}`);
        } else {
          setCredentialFallback(data);
          toast.success('Student added! Credentials generated below.');
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

  const handleResendEmail = async (student) => {
    if (!student || !student.id) return;
    setResendingId(student.id);
    const toastId = toast.loading(`Sending credentials email to ${student.email}...`);
    try {
      const res = await adminAPI.resendStudentCredentials(student.id);
      const data = res?.data || res;
      toast.success(res?.message || `Credentials email successfully sent to ${student.email}!`, { id: toastId });
      if (data?.temporaryPassword) {
        setCredentialFallback({
          id: student.id,
          name: student.name,
          email: student.email,
          student_id: student.student_id,
          password: data.temporaryPassword,
          exam_key: data.examKey
        });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to send credentials email', { id: toastId });
    } finally {
      setResendingId(null);
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

  const deleteStudent = async (id, name) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteStudent(id);
      toast.success('Student deleted successfully');
      fetchStudents(1);
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleBulkUpload = async () => {
    if (!csvFile) return toast.error('Select a CSV file first');
    const fd = new FormData();
    fd.append('file', csvFile);
    setSubmitting(true);
    try {
      const res = await adminAPI.bulkUpload(fd);
      toast.success(`${res.data.created} students created, ${res.data.failed} failed`);
      setBulkModal(false);
      setCsvFile(null);
      fetchStudents(1);
    } catch (err) {
      toast.error(err.message || 'Bulk upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-pages-container">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-header-content">
          <h1 className="admin-page-title">Student Management</h1>
          <p className="admin-page-subtitle">
            {pagination.total} {pagination.total === 1 ? 'student' : 'students'} total
          </p>
        </div>
        <div className="admin-header-actions">
          <Button variant="secondary" icon={Upload} onClick={() => setBulkModal(true)}>
            Bulk Upload
          </Button>
          <Button icon={UserPlus} onClick={openAdd}>
            Add Student
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`admin-btn ${activeTab === 'students' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          style={{ borderRadius: '10px', padding: '10px 18px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <Users size={16} />
          <span>Enrolled Students ({pagination.total})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('requests');
            fetchPasswordRequests();
          }}
          className={`admin-btn ${activeTab === 'requests' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          style={{ borderRadius: '10px', padding: '10px 18px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <Key size={16} />
          <span>Student Password Requests</span>
          {pendingRequestsCount > 0 && (
            <span style={{
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.74rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '999px',
              marginLeft: '4px'
            }}>
              {pendingRequestsCount} Pending
            </span>
          )}
        </button>
      </div>

      {activeTab === 'students' && (
        <>
          {/* Search and Filters */}
          <div className="admin-content-card">
            <div className="admin-search-section">
              <div className="admin-search-input">
                <Search size={20} />
                <input
                  value={search} 
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, email, roll number, or student ID..."
                />
              </div>
              <Button variant="secondary" icon={Filter}>
                Filters
              </Button>
            </div>
          </div>

          {/* Students Table */}
          <div className="admin-content-card">
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Roll No</th>
                <th>Department</th>
                <th>Semester</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="admin-table-loading">
                    <div className="admin-loading-spinner"></div>
                    Loading students...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-table-empty">
                    <Users size={48} />
                    <h3>No students found</h3>
                    <p>
                      {search ? `No students found for "${search}"` : 'No students yet. Add one to get started.'}
                    </p>
                    {!search && (
                      <Button icon={UserPlus} onClick={openAdd}>
                        Add First Student
                      </Button>
                    )}
                  </td>
                </tr>
              ) : students.map((student) => (
                <tr key={student.id}>
                  <td className="admin-student-id">{student.student_id}</td>
                  <td className="admin-student-name">
                    <div className="admin-student-info">
                      <span>{student.name}</span>
                    </div>
                  </td>
                  <td className="admin-student-email">
                    <Mail size={14} />
                    {student.email}
                  </td>
                  <td className="admin-student-roll">{student.roll_no}</td>
                  <td className="admin-student-department">
                    <Building size={14} />
                    {student.department || '—'}
                  </td>
                  <td className="admin-student-semester">
                    <GraduationCap size={14} />
                    {student.semester || '—'}
                  </td>
                  <td>
                    <StatusBadge isActive={student.is_active} />
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Mail}
                        loading={resendingId === student.id}
                        onClick={() => handleResendEmail(student)}
                        title="Send or resend login credentials email to student"
                        style={{ color: '#10b981', fontWeight: 600 }}
                      >
                        Send Email
                      </Button>
                      <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(student)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Key}
                        onClick={() => openResetModal(student)}
                        title="Reset Student Password"
                        style={{ color: '#0a74da' }}
                      >
                        Reset Pwd
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleStatus(student.id, student.name, student.is_active)}
                        className={student.is_active ? 'warning' : 'success'}
                      >
                        {student.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        icon={Trash2} 
                        onClick={() => deleteStudent(student.id, student.name)}
                        className="danger"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="admin-pagination">
            <button 
              onClick={() => fetchStudents(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="admin-pagination-btn"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            
            <div className="admin-pagination-numbers">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => fetchStudents(pageNum)}
                    className={`admin-pagination-number ${pageNum === pagination.page ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button 
              onClick={() => fetchStudents(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="admin-pagination-btn"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  )}

  {activeTab === 'requests' && (
    <div className="admin-content-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} color="#0a74da" />
            Student Password Assistance Queue
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
            Review and securely reset credentials for students requesting assistance.
          </p>
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={fetchPasswordRequests} loading={requestsLoading}>
          Refresh Queue
        </Button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Student Info</th>
              <th>Roll No</th>
              <th>Submitted At</th>
              <th>Requested From</th>
              <th>Reason &amp; Candidate Notes</th>
              <th>Status</th>
              <th>Admin Actions</th>
            </tr>
          </thead>
          <tbody>
            {requestsLoading ? (
              <tr>
                <td colSpan={7} className="admin-table-loading">
                  <div className="admin-loading-spinner" />
                  Loading assistance queue...
                </td>
              </tr>
            ) : passwordRequests.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-table-empty">
                  <CheckCircle size={44} color="#10b981" />
                  <h3>No Password Assistance Requests</h3>
                  <p>All student password reset requests are resolved and up to date.</p>
                </td>
              </tr>
            ) : (
              passwordRequests.map(req => (
                <tr key={req.id}>
                  <td>
                    <div className="admin-student-info">
                      <span style={{ fontWeight: 700 }}>{req.student_name}</span>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{req.student_email}</span>
                      <span style={{ fontSize: '0.74rem', color: '#0a74da', fontFamily: 'monospace' }}>{req.student_id}</span>
                    </div>
                  </td>
                  <td className="admin-student-roll">{req.roll_no || '—'}</td>
                  <td>
                    <div style={{ fontSize: '0.82rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} color="#64748b" />
                      <span>{new Date(req.created_at).toLocaleDateString()}</span>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', textTransform: 'capitalize' }}>
                      {req.requested_from || 'Dashboard'}
                    </span>
                  </td>
                  <td style={{ maxWidth: '280px' }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1e293b' }}>
                      {req.reason}
                    </div>
                    {req.admin_notes && (
                      <div style={{ fontSize: '0.78rem', color: '#059669', background: '#ecfdf5', padding: '3px 6px', borderRadius: '4px', marginTop: '4px' }}>
                        <strong>Admin:</strong> {req.admin_notes}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`admin-status-badge ${req.status === 'resolved' ? 'active' : 'inactive'}`} style={{
                      background: req.status === 'resolved' ? '#ecfdf5' : req.status === 'pending' ? '#fef3c7' : '#f1f5f9',
                      color: req.status === 'resolved' ? '#059669' : req.status === 'pending' ? '#d97706' : '#64748b'
                    }}>
                      {req.status === 'resolved' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      {req.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      {req.status === 'pending' ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Key}
                            onClick={() => openResetModal({
                              id: req.student_uuid || req.student_id,
                              name: req.student_name,
                              email: req.student_email,
                              student_id: req.student_id,
                              roll_no: req.roll_no
                            }, req.id)}
                          >
                            Reset &amp; Resolve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDismissRequest(req.id)}
                            className="danger"
                          >
                            Dismiss
                          </Button>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700 }}>
                          ✓ Resolved
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

      {/* Add/Edit Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title={editStudent ? 'Edit Student' : 'Add New Student'}>
        <div className="admin-form-grid">
          <Input 
            label="Full Name *" 
            icon={Users}
            value={form.name} 
            onChange={setFormField('name')} 
            placeholder="Student Full Name"
            error={formErrors.name}
          />
          <Input 
            label="Email *" 
            type="email" 
            icon={Mail}
            value={form.email} 
            onChange={setFormField('email')} 
            placeholder="student@email.com" 
            disabled={!!editStudent}
            error={formErrors.email}
          />
          <Input 
            label="Roll Number *" 
            icon={GraduationCap}
            value={form.rollNo} 
            onChange={setFormField('rollNo')} 
            placeholder="CS-2024-001"
            error={formErrors.rollNo}
          />
          <Input 
            label="Department" 
            icon={Building}
            value={form.department} 
            onChange={setFormField('department')} 
            placeholder="Computer Science" 
          />
          <div className="admin-form-row">
            <Input 
              label="Semester" 
              icon={Calendar}
              value={form.semester} 
              onChange={setFormField('semester')} 
              placeholder="5th" 
            />
            <Input 
              label="Batch" 
              icon={Calendar}
              value={form.batch} 
              onChange={setFormField('batch')} 
              placeholder="2022-26" 
            />
          </div>
          <Input 
            label="Phone" 
            icon={Phone}
            value={form.phone} 
            onChange={setFormField('phone')} 
            placeholder="+91 9876543210" 
          />

          {!editStudent && (
            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="admin-form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>
                <Key size={14} style={{ color: '#10b981' }} />
                <span>Assign to Examination &amp; Issue Exam Key</span>
              </label>
              <select
                className="admin-form-input"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', fontSize: '0.88rem', color: '#1f2937' }}
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
              <span style={{ fontSize: '0.76rem', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                The student will receive their <strong>Student ID</strong>, <strong>Temporary Password</strong>, and <strong>Exam Access Key</strong> directly via email.
              </span>
            </div>
          )}
        </div>
        
        {!editStudent && (
          <div className="admin-form-note">
            <AlertCircle size={16} />
            Student ID, password, and exam key will be dispatched instantly to the student's email.
          </div>
        )}
        
        <div className="admin-form-actions">
          <Button variant="secondary" onClick={() => setAddModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {submitting ? 'Saving...' : editStudent ? 'Update Student' : 'Add Student'}
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!credentialFallback}
        onClose={() => setCredentialFallback(null)}
        title="Student Credentials & Exam Access"
      >
        <div className="admin-form-note" style={{ background: '#ecfdf5', borderColor: '#10b981', color: '#065f46' }}>
          <CheckCircle size={16} style={{ color: '#10b981' }} />
          Student created successfully! Copy and share these credentials with the student:
        </div>
        <div className="admin-form-grid">
          <Input label="Student ID" value={credentialFallback?.student_id || ''} readOnly />
          <Input label="Email" value={credentialFallback?.email || ''} readOnly />
          <Input label="Temporary Password" value={credentialFallback?.password || ''} readOnly />
          {credentialFallback?.exam_key && (
            <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
              <label className="admin-form-label" style={{ fontWeight: 800, color: '#047857' }}>
                🔑 Exam Access Key ({credentialFallback?.exam_name || 'Scheduled Exam'})
              </label>
              <input
                className="admin-form-input"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '2px dashed #10b981',
                  background: '#f0fdf4',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  fontFamily: 'monospace',
                  color: '#065f46',
                  letterSpacing: '2px'
                }}
                value={credentialFallback?.exam_key || ''}
                readOnly
              />
            </div>
          )}
        </div>
        <div className="admin-form-actions">
          <Button
            variant="secondary"
            onClick={() => {
              const text = [
                `Student ID: ${credentialFallback?.student_id || ''}`,
                `Email: ${credentialFallback?.email || ''}`,
                `Password: ${credentialFallback?.password || ''}`,
                credentialFallback?.exam_key ? `Exam Key: ${credentialFallback.exam_key}` : '',
                `Login URL: ${window.location.origin}/student/login`
              ].filter(Boolean).join('\n');
              navigator.clipboard.writeText(text)
                .then(() => toast.success('All credentials & Exam Key copied!'))
                .catch(() => toast.error('Could not copy credentials'));
            }}
          >
            Copy All Credentials &amp; Key
          </Button>
          {credentialFallback?.id && (
            <Button
              variant="secondary"
              icon={Mail}
              loading={resendingId === credentialFallback.id}
              onClick={() => handleResendEmail(credentialFallback)}
              style={{ color: '#10b981' }}
            >
              Email Credentials
            </Button>
          )}
          <Button onClick={() => setCredentialFallback(null)}>Done</Button>
        </div>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal open={bulkModal} onClose={() => setBulkModal(false)} title="Bulk Upload Students">
        <div className="admin-bulk-upload">
          <div className="admin-bulk-info">
            <p>Upload a CSV file with the following columns:</p>
            <div className="admin-csv-format">
              name,email,roll_no,department,semester,batch
            </div>
          </div>

          <div 
            className={`admin-file-upload ${csvFile ? 'has-file' : ''}`}
            onClick={() => fileRef.current.click()}
          >
            <Upload size={32} />
            <p>
              {csvFile ? csvFile.name : 'Click to select CSV file'}
            </p>
            <span className="admin-file-hint">
              Supported format: .csv (Max 5MB)
            </span>
            <input 
              ref={fileRef} 
              type="file" 
              accept=".csv" 
              style={{ display: 'none' }} 
              onChange={e => setCsvFile(e.target.files[0])} 
            />
          </div>

          <a 
            href="data:text/csv;charset=utf-8,name,email,roll_no,department,semester,batch%0AJohn Doe,john@email.com,CS001,Computer Science,5th,2022-26"
            download="students_template.csv"
            className="admin-download-template"
          >
            <Download size={16} />
            Download CSV Template
          </a>

          <div className="admin-form-actions">
            <Button variant="secondary" onClick={() => setBulkModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkUpload} 
              disabled={!csvFile || submitting}
              loading={submitting}
            >
              {submitting ? 'Uploading...' : 'Upload Students'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset Student Password Modal */}
      <Modal
        open={resetModal}
        onClose={() => setResetModal(false)}
        title="Secure Student Password Reset"
      >
        {targetStudentForReset && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                {targetStudentForReset.name}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '3px' }}>
                Roll No: <strong>{targetStudentForReset.roll_no}</strong> • Student ID: <strong>{targetStudentForReset.student_id}</strong>
              </div>
              <div style={{ fontSize: '0.84rem', color: '#0a74da', marginTop: '2px' }}>
                {targetStudentForReset.email}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="admin-form-label" style={{ margin: 0, fontWeight: 700 }}>
                  New Student Password *
                </label>
                <button
                  type="button"
                  onClick={generateSecurePassword}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0a74da',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={13} />
                  Auto-Generate Strong Password
                </button>
              </div>
              <input
                type="text"
                className="admin-form-input"
                placeholder="Enter new password (min 6 chars)"
                value={resetForm.newPassword}
                onChange={(e) => setResetForm(f => ({ ...f, newPassword: e.target.value }))}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={resetForm.notifyEmail}
                onChange={(e) => setResetForm(f => ({ ...f, notifyEmail: e.target.checked }))}
              />
              <span>Send new login credentials to student's email</span>
            </label>

            <div>
              <label className="admin-form-label" style={{ fontWeight: 700 }}>
                Resolution / Administrative Notes (Optional)
              </label>
              <textarea
                className="admin-form-input"
                rows={2}
                placeholder="e.g. Identity verified via student roll number and updated credentials issued"
                value={resetForm.adminNotes}
                onChange={(e) => setResetForm(f => ({ ...f, adminNotes: e.target.value }))}
                style={{ padding: '8px 12px' }}
              />
            </div>

            <div className="admin-form-actions">
              <Button variant="secondary" onClick={() => setResetModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleResetSubmit} loading={resetSubmitting}>
                Confirm &amp; Reset Password
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reset Success Modal */}
      <Modal
        open={!!resetSuccessData}
        onClose={() => setResetSuccessData(null)}
        title="Student Password Reset Complete"
      >
        <div className="admin-form-note" style={{ background: '#ecfdf5', borderColor: '#10b981', color: '#065f46' }}>
          <CheckCircle size={16} style={{ color: '#10b981' }} />
          Password has been updated in the database {resetSuccessData?.emailSent ? 'and emailed to student' : ''}!
        </div>

        <div className="admin-form-grid" style={{ marginTop: '14px' }}>
          <Input label="Student Name" value={resetSuccessData?.student?.name || ''} readOnly />
          <Input label="Student Email" value={resetSuccessData?.student?.email || ''} readOnly />
          <div className="admin-form-group" style={{ gridColumn: 'span 2' }}>
            <label className="admin-form-label" style={{ fontWeight: 800, color: '#047857' }}>
              🔑 New Account Password
            </label>
            <input
              className="admin-form-input"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '2px dashed #10b981',
                background: '#f0fdf4',
                fontWeight: 800,
                fontSize: '1.1rem',
                fontFamily: 'monospace',
                color: '#065f46'
              }}
              value={resetSuccessData?.newPassword || ''}
              readOnly
            />
          </div>
        </div>

        <div className="admin-form-actions" style={{ marginTop: '20px' }}>
          <Button
            variant="secondary"
            onClick={() => {
              const text = [
                `Student: ${resetSuccessData?.student?.name || ''}`,
                `Student ID: ${resetSuccessData?.student?.student_id || ''}`,
                `Email: ${resetSuccessData?.student?.email || ''}`,
                `New Password: ${resetSuccessData?.newPassword || ''}`,
                `Login URL: ${window.location.origin}/student/login`
              ].join('\n');
              navigator.clipboard?.writeText(text);
              toast.success('Credentials copied to clipboard!');
            }}
          >
            <Copy size={16} />
            Copy Credentials
          </Button>
          <Button onClick={() => setResetSuccessData(null)}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}
