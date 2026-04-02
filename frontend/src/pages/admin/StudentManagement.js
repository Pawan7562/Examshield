// src/pages/admin/StudentManagement.js
import React, { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#0e0e1a', border: '1px solid rgba(233,69,96,0.25)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</label>
    <input {...props} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, fontFamily: 'Sora, sans-serif' }} />
  </div>
);

const Btn = ({ children, variant = 'primary', size = 'md', ...props }) => {
  const bg = variant === 'primary' ? 'linear-gradient(135deg,#e94560,#c62a47)' : variant === 'ghost' ? 'rgba(255,255,255,0.05)' : 'rgba(233,69,96,0.12)';
  const color = variant === 'primary' ? 'white' : '#e2e8f0';
  const pad = size === 'sm' ? '6px 14px' : '10px 20px';
  return (
    <button {...props} style={{ background: bg, border: `1px solid ${variant === 'primary' ? 'transparent' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, padding: pad, color, fontSize: size === 'sm' ? 12 : 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora, sans-serif', transition: 'all 0.15s', whiteSpace: 'nowrap', ...props.style }}>
      {children}
    </button>
  );
};

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', rollNo: '', department: '', semester: '', batch: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [bulkModal, setBulkModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const fileRef = useRef();

  const fetchStudents = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminAPI.getStudents({ page, limit: 15, search: search || undefined });
      setStudents(res.data.students);
      setPagination({ page, total: res.data.pagination.total, pages: res.data.pagination.pages });
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

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const openAdd = () => {
    setForm({ name: '', email: '', rollNo: '', department: '', semester: '', batch: '', phone: '' });
    setEditStudent(null);
    setAddModal(true);
  };
  const openEdit = (s) => {
    setForm({ name: s.name, email: s.email, rollNo: s.roll_no, department: s.department || '', semester: s.semester || '', batch: s.batch || '', phone: s.phone || '' });
    setEditStudent(s);
    setAddModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.rollNo) return toast.error('Name, email, and roll number are required');
    setSubmitting(true);
    try {
      if (editStudent) {
        await adminAPI.updateStudent(editStudent.id, form);
        toast.success('Student updated');
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
      toast.success(`${name} ${isActive ? 'deactivated' : 'activated'}`);
      fetchStudents(pagination.page);
    } catch {
      toast.error('Status update failed');
    }
  };

  const deleteStudent = async (id, name) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteStudent(id);
      toast.success('Student deleted');
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
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>Student Management</h1>
          <p style={{ fontSize: 13, color: '#4a5568', marginTop: 4 }}>{pagination.total} students total</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="ghost" onClick={() => setBulkModal(true)}>⬆ Bulk Upload</Btn>
          <Btn onClick={openAdd}>+ Add Student</Btn>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search by name, email, roll number, or student ID..."
          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', color: '#e2e8f0', fontSize: 14, fontFamily: 'Sora, sans-serif' }}
        />
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Student ID', 'Name', 'Email', 'Roll No', 'Department', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#4a5568', textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#4a5568' }}>Loading...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#4a5568' }}>
                {search ? `No students found for "${search}"` : 'No students yet. Add one to get started.'}
              </td></tr>
            ) : students.map((s, i) => (
              <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: '#e94560' }}>{s.student_id}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{s.name}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#718096' }}>{s.email}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#a0aec0' }}>{s.roll_no}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#a0aec0' }}>{s.department || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: s.is_active ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: s.is_active ? '#22c55e' : '#ef4444' }}>
                    {s.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn variant="ghost" size="sm" onClick={() => openEdit(s)}>Edit</Btn>
                    <Btn variant="ghost" size="sm" onClick={() => toggleStatus(s.id, s.name, s.is_active)} style={{ color: s.is_active ? '#f59e0b' : '#22c55e' }}>
                      {s.is_active ? 'Disable' : 'Enable'}
                    </Btn>
                    <Btn variant="ghost" size="sm" onClick={() => deleteStudent(s.id, s.name)} style={{ color: '#ef4444' }}>Del</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => fetchStudents(p)} style={{
              width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'Sora, sans-serif', fontSize: 13,
              background: p === pagination.page ? '#e94560' : 'rgba(255,255,255,0.05)',
              color: p === pagination.page ? 'white' : '#a0aec0',
            }}>{p}</button>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title={editStudent ? 'Edit Student' : 'Add New Student'}>
        <Input label="Full Name *" value={form.name} onChange={set('name')} placeholder="Student Full Name" />
        <Input label="Email *" type="email" value={form.email} onChange={set('email')} placeholder="student@email.com" disabled={!!editStudent} />
        <Input label="Roll Number *" value={form.rollNo} onChange={set('rollNo')} placeholder="CS-2024-001" />
        <Input label="Department" value={form.department} onChange={set('department')} placeholder="Computer Science" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Input label="Semester" value={form.semester} onChange={set('semester')} placeholder="5th" />
          <Input label="Batch" value={form.batch} onChange={set('batch')} placeholder="2022-26" />
        </div>
        <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" />
        {!editStudent && <p style={{ fontSize: 12, color: '#4a5568', marginBottom: 14 }}>A unique password will be generated and sent to the student's email.</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setAddModal(false)}>Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving...' : editStudent ? 'Update Student' : 'Add Student'}</Btn>
        </div>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal open={bulkModal} onClose={() => setBulkModal(false)} title="Bulk Upload Students">
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: '#a0aec0', marginBottom: 12 }}>Upload a CSV file with columns:</p>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12, fontFamily: 'monospace', fontSize: 12, color: '#e94560' }}>
            name,email,roll_no,department,semester,batch
          </div>
        </div>

        <div
          onClick={() => fileRef.current.click()}
          style={{
            border: `2px dashed ${csvFile ? '#22c55e' : 'rgba(233,69,96,0.4)'}`,
            borderRadius: 10, padding: 32, textAlign: 'center', cursor: 'pointer',
            background: csvFile ? 'rgba(34,197,94,0.05)' : 'transparent', marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
          <div style={{ fontSize: 13, color: '#a0aec0' }}>
            {csvFile ? csvFile.name : 'Click to select CSV file'}
          </div>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => setCsvFile(e.target.files[0])} />
        </div>

        <a href="data:text/csv;charset=utf-8,name,email,roll_no,department,semester,batch%0AJohn Doe,john@email.com,CS001,Computer Science,5th,2022-26"
          download="students_template.csv"
          style={{ fontSize: 12, color: '#e94560', display: 'block', textAlign: 'center', marginBottom: 16 }}>
          ⬇ Download CSV Template
        </a>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setBulkModal(false)}>Cancel</Btn>
          <Btn onClick={handleBulkUpload} disabled={!csvFile || submitting}>{submitting ? 'Uploading...' : 'Upload Students'}</Btn>
        </div>
      </Modal>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');
        input:focus{outline:none;border-color:#e94560!important;}
        input::placeholder{color:#4a5568;}
        button:hover:not(:disabled){opacity:0.85;}
      `}</style>
    </div>
  );
}
