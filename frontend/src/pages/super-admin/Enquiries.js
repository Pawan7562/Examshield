import React, { useEffect, useState, useCallback } from 'react';
import {
  Inbox,
  Search,
  RefreshCw,
  Building2,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  ShieldCheck,
  Send,
  HelpCircle,
  Users
} from 'lucide-react';
import { superAdminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './SuperAdmin.css';

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Modal State
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [editStatus, setEditStatus] = useState('new');
  const [editNotes, setEditNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superAdminAPI.getEnquiries({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
        page,
        limit: 25,
      });

      const data = res.data?.data || res.data || res;
      if (Array.isArray(data)) {
        setEnquiries(data);
        if (res.data?.pagination) {
          setPagination(res.data.pagination);
        }
      } else {
        setEnquiries([]);
      }
    } catch (err) {
      console.error('Failed to load enquiries:', err);
      toast.error('Failed to load institutional enquiries');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedEnquiry) return;
    setUpdating(true);
    try {
      await superAdminAPI.updateEnquiryStatus(selectedEnquiry.id, {
        status: editStatus,
        notes: editNotes,
      });
      toast.success('Inquiry updated successfully');
      setSelectedEnquiry(null);
      fetchEnquiries();
    } catch (err) {
      toast.error('Failed to update enquiry status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enquiry?')) return;
    try {
      await superAdminAPI.deleteEnquiry(id);
      toast.success('Enquiry removed');
      fetchEnquiries();
    } catch (err) {
      toast.error('Failed to delete enquiry');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      new: { label: 'New Lead', bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8' },
      contacted: { label: 'Contacted', bg: 'rgba(250, 204, 21, 0.15)', text: '#facc15' },
      demo_scheduled: { label: 'Demo Scheduled', bg: 'rgba(192, 132, 252, 0.15)', text: '#c084fc' },
      demo_completed: { label: 'Demo Completed', bg: 'rgba(96, 165, 250, 0.15)', text: '#60a5fa' },
      pilot_started: { label: 'Campus Pilot Active', bg: 'rgba(52, 211, 153, 0.15)', text: '#34d399' },
      converted: { label: 'Converted Client', bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' },
      not_interested: { label: 'Closed / Not Interested', bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8' },
    };
    const c = config[status] || { label: status, bg: 'rgba(255,255,255,0.1)', text: '#e2e8f0' };
    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: '600',
        background: c.bg,
        color: c.text
      }}>
        {c.label}
      </span>
    );
  };

  // Metrics summary
  const metrics = {
    total: pagination.total || enquiries.length,
    newCount: enquiries.filter(e => e.status === 'new').length,
    demoScheduled: enquiries.filter(e => e.status === 'demo_scheduled' || e.status === 'pilot_started').length,
    converted: enquiries.filter(e => e.status === 'converted').length,
  };

  return (
    <div className="sa-container">
      {/* Header */}
      <div className="sa-header">
        <div>
          <h1 className="sa-title">
            <Inbox className="sa-title-icon" /> Institutional Inquiries & Demo Leads
          </h1>
          <p className="sa-subtitle">
            Manage incoming demo requests, college inquiries, and sales pipeline from public SEO landing pages.
          </p>
        </div>
        <button className="sa-btn-refresh" onClick={fetchEnquiries} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="sa-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="sa-stat-card">
          <div className="stat-label">Total Inquiries</div>
          <div className="stat-value">{metrics.total}</div>
          <div className="stat-sub">From all public pages</div>
        </div>
        <div className="sa-stat-card">
          <div className="stat-label">New / Action Required</div>
          <div className="stat-value" style={{ color: '#38bdf8' }}>{metrics.newCount}</div>
          <div className="stat-sub">Awaiting initial contact</div>
        </div>
        <div className="sa-stat-card">
          <div className="stat-label">Demos / Pilots Active</div>
          <div className="stat-value" style={{ color: '#c084fc' }}>{metrics.demoScheduled}</div>
          <div className="stat-sub">Walkthroughs & pilots in progress</div>
        </div>
        <div className="sa-stat-card">
          <div className="stat-label">Converted Institutions</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{metrics.converted}</div>
          <div className="stat-sub">Signed institutional tenants</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="sa-controls-bar">
        <div className="sa-search-wrap">
          <Search size={16} color="#64748b" />
          <input
            type="text"
            placeholder="Search by college, contact person, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="sa-filter-selects">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="new">New Inquiries</option>
            <option value="contacted">Contacted</option>
            <option value="demo_scheduled">Demo Scheduled</option>
            <option value="demo_completed">Demo Completed</option>
            <option value="pilot_started">Campus Pilot Active</option>
            <option value="converted">Converted Client</option>
            <option value="not_interested">Not Interested</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="sa-table-card">
        <table className="sa-table">
          <thead>
            <tr>
              <th>Institution & Type</th>
              <th>Contact Person</th>
              <th>Contact Details</th>
              <th>Student Scope</th>
              <th>Lead Source</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {enquiries.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  {loading ? 'Fetching inquiries...' : 'No inquiries found matching your filters.'}
                </td>
              </tr>
            ) : (
              enquiries.map((enq) => (
                <tr key={enq.id}>
                  <td>
                    <div style={{ fontWeight: '600', color: '#f8fafc' }}>{enq.institution_name}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{enq.institution_type}</div>
                  </td>
                  <td>
                    <div style={{ color: '#e2e8f0', fontWeight: '500' }}>{enq.contact_person}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {new Date(enq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <Mail size={12} color="#10b981" />
                      <a href={`mailto:${enq.email}`} style={{ color: '#38bdf8', textDecoration: 'none' }}>{enq.email}</a>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginTop: '2px' }}>
                      <Phone size={12} color="#10b981" />
                      <a href={`tel:${enq.phone}`} style={{ color: '#94a3b8', textDecoration: 'none' }}>{enq.phone}</a>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: '#cbd5e1' }}>{enq.student_count || 'Flexible'}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{enq.exam_frequency || 'Semester'}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', color: '#94a3b8' }}>
                      {enq.source_page || '/'}
                    </span>
                  </td>
                  <td>
                    {getStatusBadge(enq.status)}
                    {enq.notes && (
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📝 {enq.notes}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        title="Update Status & Notes"
                        onClick={() => {
                          setSelectedEnquiry(enq);
                          setEditStatus(enq.status || 'new');
                          setEditNotes(enq.notes || '');
                        }}
                        style={{
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          color: '#38bdf8',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px'
                        }}
                      >
                        <Edit2 size={13} /> Update
                      </button>
                      <button
                        title="Delete Lead"
                        onClick={() => handleDelete(enq.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
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

      {/* Edit Modal */}
      {selectedEnquiry && (
        <div className="sa-modal-backdrop">
          <div className="sa-modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>Manage Inquiry: {selectedEnquiry.institution_name}</h3>
              <button className="close-btn" onClick={() => setSelectedEnquiry(null)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateStatus}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>Contact: <strong>{selectedEnquiry.contact_person}</strong> ({selectedEnquiry.email} | {selectedEnquiry.phone})</div>
                  {selectedEnquiry.requirements && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginTop: '8px', color: '#cbd5e1' }}>
                      <strong>Requirements:</strong> {selectedEnquiry.requirements}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>Lead Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    style={{ width: '100%', padding: '10px', background: '#091319', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="new">New Lead</option>
                    <option value="contacted">Contacted (Call / Email Sent)</option>
                    <option value="demo_scheduled">Demo Scheduled</option>
                    <option value="demo_completed">Demo Completed</option>
                    <option value="pilot_started">Campus Pilot Active</option>
                    <option value="converted">Converted Client (Signed / Subscribed)</option>
                    <option value="not_interested">Not Interested / Closed</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>Internal Notes / Meeting Log</label>
                  <textarea
                    rows={4}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="e.g. Conducted Google Meet demo with HOD and Dean. They want 1,200 students tested for semester coding exams starting next month."
                    style={{ width: '100%', padding: '10px', background: '#091319', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#fff', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn-cancel" onClick={() => setSelectedEnquiry(null)}>Cancel</button>
                <button type="submit" className="btn-save" disabled={updating}>
                  {updating ? 'Saving...' : 'Save Lead Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
