// src/pages/admin/StudentManagement.js
import React, { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Search, 
  Plus, 
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
  AlertCircle
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
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    rollNo: '', 
    department: '', 
    semester: '', 
    batch: '', 
    phone: '' 
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [bulkModal, setBulkModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const fileRef = useRef();

  const fetchStudents = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminAPI.getStudents({ page, limit: 15, search: search || undefined });
      setStudents(res.data.students);
      setPagination({ 
        page, 
        total: res.data.pagination.total, 
        pages: res.data.pagination.pages 
      });
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchStudents(1), 300);
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
      phone: '' 
    });
    setEditStudent(null);
    setFormErrors({});
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
      phone: student.phone || '' 
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
        await adminAPI.addStudent(form);
        toast.success('Student added! Credentials sent via email.');
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
                      <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(student)}>
                        Edit
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
        </div>
        
        {!editStudent && (
          <div className="admin-form-note">
            <AlertCircle size={16} />
            A unique password will be generated and sent to the student's email.
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
    </div>
  );
}
