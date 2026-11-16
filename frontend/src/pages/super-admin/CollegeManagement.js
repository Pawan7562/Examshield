import React, { useEffect, useState, useCallback } from 'react';
import {
  Building2,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Users,
  Phone,
  Globe,
  Calendar,
  AlertTriangle,
  Plus,
  Edit2,
  KeyRound,
  Award,
  Trash2,
  X,
  CreditCard,
  MapPin,
  Lock,
  Mail,
  Sparkles,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { superAdminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { formatIST } from '../../utils/timezone';
import './SuperAdmin.css';

export default function CollegeManagement() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'active', 'suspended', 'rejected'
  const [togglingId, setTogglingId] = useState(null);

  // Modals state
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approvingId, setApprovingId] = useState(null);

  // Selected item state
  const [activeCollege, setActiveCollege] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Onboard Form Data
  const [onboardData, setOnboardData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    website: '',
    address: '',
    subscription_plan: 'basic',
    duration_months: 1,
  });

  // Edit Form Data
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
  });

  // Plan Override Form Data
  const [planData, setPlanData] = useState({
    plan: 'standard',
    extend_days: '30',
    custom_expiry: '',
    notes: '',
  });

  // Reset Password Form Data
  const [newPassword, setNewPassword] = useState('');

  const fetchColleges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superAdminAPI.getColleges({ search: search || undefined });
      const list = res?.colleges || res?.data?.colleges || (Array.isArray(res) ? res : []);
      setColleges(list);
    } catch (err) {
      console.error('Error fetching colleges:', err);
      toast.error('Failed to load institutions');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchColleges, 250);
    return () => clearTimeout(timer);
  }, [fetchColleges]);

  // Handle Toggle Active/Suspend
  const toggleCollege = async (id, name, currentIsActive) => {
    setTogglingId(id);
    try {
      const res = await superAdminAPI.toggleCollege(id);
      const nextState = !currentIsActive;
      toast.success(res?.message || res?.data?.message || `${name} ${nextState ? 'activated successfully' : 'suspended'}`);
      fetchColleges();
    } catch (err) {
      console.error('Error toggling college status:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to change college status');
    } finally {
      setTogglingId(null);
    }
  };

  // Open Onboard Modal
  const openOnboard = () => {
    setOnboardData({
      name: '',
      email: '',
      password: 'Exam@' + Math.floor(100000 + Math.random() * 900000),
      phone: '',
      website: '',
      address: '',
      subscription_plan: 'basic',
      duration_months: 1,
    });
    setShowOnboardModal(true);
  };

  // Submit Onboarding
  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!onboardData.name || !onboardData.email || !onboardData.password) {
      return toast.error('Institution name, email, and password are required.');
    }
    setSubmitting(true);
    try {
      const res = await superAdminAPI.onboardCollege(onboardData);
      toast.success(res?.message || res?.data?.message || 'College onboarded successfully!');
      setShowOnboardModal(false);
      fetchColleges();
    } catch (err) {
      console.error('Onboard error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to onboard institution');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEdit = (college) => {
    setActiveCollege(college);
    setEditData({
      name: college.name || '',
      email: college.email || '',
      phone: college.phone || '',
      website: college.website || '',
      address: college.address || '',
    });
    setShowEditModal(true);
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!activeCollege) return;
    setSubmitting(true);
    try {
      const res = await superAdminAPI.updateCollege(activeCollege.id, editData);
      toast.success(res?.message || res?.data?.message || 'College profile updated successfully');
      setShowEditModal(false);
      fetchColleges();
    } catch (err) {
      console.error('Edit error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update institution');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Plan Modal
  const openPlan = (college) => {
    setActiveCollege(college);
    setPlanData({
      plan: college.subscription_plan || 'basic',
      extend_days: '30',
      custom_expiry: '',
      notes: '',
    });
    setShowPlanModal(true);
  };

  // Submit Plan Override
  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    if (!activeCollege) return;
    setSubmitting(true);
    try {
      const payload = {
        plan: planData.plan,
        extend_days: planData.custom_expiry ? null : planData.extend_days,
        custom_expiry: planData.custom_expiry || null,
        notes: planData.notes,
      };
      const res = await superAdminAPI.updateCollegePlan(activeCollege.id, payload);
      toast.success(res?.message || res?.data?.message || 'Plan and licensing updated');
      setShowPlanModal(false);
      fetchColleges();
    } catch (err) {
      console.error('Plan update error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update license tier');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Reset Password
  const openResetPassword = (college) => {
    setActiveCollege(college);
    setNewPassword('Pass@' + Math.floor(100000 + Math.random() * 900000));
    setShowResetPasswordModal(true);
  };

  // Submit Reset Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!activeCollege) return;
    if (!newPassword || newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setSubmitting(true);
    try {
      const res = await superAdminAPI.resetCollegePassword(activeCollege.id, { new_password: newPassword });
      toast.success(res?.message || res?.data?.message || 'Password reset successfully');
      setShowResetPasswordModal(false);
    } catch (err) {
      console.error('Password reset error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Delete Modal
  const openDelete = (college) => {
    setActiveCollege(college);
    setShowDeleteModal(true);
  };

  // Submit Delete
  const handleDeleteSubmit = async () => {
    if (!activeCollege) return;
    setSubmitting(true);
    try {
      const res = await superAdminAPI.deleteCollege(activeCollege.id);
      toast.success(res?.message || res?.data?.message || 'Institution deleted');
      setShowDeleteModal(false);
      fetchColleges();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete institution');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Approve College
  const handleApproveCollege = async (id, name) => {
    setApprovingId(id);
    try {
      const res = await superAdminAPI.approveCollege(id);
      toast.success(res?.message || res?.data?.message || `${name} approved successfully!`);
      fetchColleges();
    } catch (err) {
      console.error('Approval error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to approve college');
    } finally {
      setApprovingId(null);
    }
  };

  // Open Reject Modal
  const openReject = (college) => {
    setActiveCollege(college);
    setRejectReason('');
    setShowRejectModal(true);
  };

  // Submit Reject
  const handleRejectSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!activeCollege) return;
    setSubmitting(true);
    try {
      const res = await superAdminAPI.rejectCollege(activeCollege.id, { reason: rejectReason });
      toast.success(res?.message || res?.data?.message || `${activeCollege.name} registration rejected.`);
      setShowRejectModal(false);
      fetchColleges();
    } catch (err) {
      console.error('Rejection error:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to reject college');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter colleges
  const filteredColleges = colleges.filter((c) => {
    if (statusFilter === 'pending') return c.status === 'pending';
    if (statusFilter === 'rejected') return c.status === 'rejected';
    if (statusFilter === 'active') return c.is_active === true && c.status !== 'pending';
    if (statusFilter === 'suspended') return c.is_active === false && c.status !== 'pending';
    return true;
  });

  const totalCount = colleges.length;
  const pendingCount = colleges.filter((c) => c.status === 'pending').length;
  const activeCount = colleges.filter((c) => c.is_active && c.status !== 'pending').length;
  const suspendedCount = totalCount - activeCount - pendingCount;

  return (
    <div className="sa-page-shell">
      {/* ──── PAGE HEADER ──── */}
      <div className="sa-page-header">
        <div className="sa-page-title-stack">
          <h1 className="sa-page-title">Multi-Tenant Institutional Directory</h1>
          <p className="sa-page-subtitle">
            Inspect verified university tenants, supervise autonomous AI proctoring licenses, manage approvals, and enforce institutional governance.
          </p>
        </div>

        <div className="sa-page-actions">
          <button
            type="button"
            className="sa-btn-secondary"
            onClick={fetchColleges}
            disabled={loading}
            title="Reload directory"
          >
            <RefreshCw size={14} className={loading ? 'sa-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="sa-coral-pill-btn"
            onClick={openOnboard}
            id="sa-onboard-college-btn"
          >
            <Plus size={16} />
            <span>Onboard Institution</span>
          </button>
        </div>
      </div>

      {/* ──── DIRECTORY KPI CARDS ──── */}
      <div className="sa-kpi-grid">
        <div className="sa-kpi-card">
          <div className="sa-kpi-top">
            <span className="sa-kpi-label">Total Institutions</span>
            <div className="sa-kpi-icon-bubble sa-kpi-icon-forest">
              <Building2 size={18} />
            </div>
          </div>
          <div className="sa-kpi-value">{totalCount}</div>
          <div className="sa-kpi-footer">
            <span className="sa-kpi-badge sa-badge-active">REGISTERED</span>
            <span>Accredited university tenants</span>
          </div>
        </div>

        <div
          className={`sa-kpi-card interactive ${pendingCount > 0 ? 'highlight-amber' : ''}`}
          onClick={() => setStatusFilter('pending')}
          title="Click to view pending requests"
        >
          <div className="sa-kpi-top">
            <span className="sa-kpi-label">Pending Approval</span>
            <div className="sa-kpi-icon-bubble sa-kpi-icon-amber">
              <Clock size={18} />
            </div>
          </div>
          <div className="sa-kpi-value" style={pendingCount > 0 ? { color: '#d97706' } : {}}>
            {pendingCount}
          </div>
          <div className="sa-kpi-footer">
            <span className={`sa-kpi-badge ${pendingCount > 0 ? 'sa-badge-pending' : ''}`}>
              {pendingCount > 0 ? 'ACTION REQUIRED' : 'UP TO DATE'}
            </span>
            <span>Awaiting root verification</span>
          </div>
        </div>

        <div className="sa-kpi-card">
          <div className="sa-kpi-top">
            <span className="sa-kpi-label">Active Campuses</span>
            <div className="sa-kpi-icon-bubble sa-kpi-icon-mint">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="sa-kpi-value" style={{ color: 'var(--sa-mint)' }}>
            {activeCount}
          </div>
          <div className="sa-kpi-footer">
            <span className="sa-kpi-badge sa-badge-active">OPERATIONAL</span>
            <span>Live invigilation enabled</span>
          </div>
        </div>

        <div className="sa-kpi-card">
          <div className="sa-kpi-top">
            <span className="sa-kpi-label">Suspended / Paused</span>
            <div className="sa-kpi-icon-bubble sa-kpi-icon-rose">
              <XCircle size={18} />
            </div>
          </div>
          <div className="sa-kpi-value" style={{ color: 'var(--sa-rose)' }}>
            {suspendedCount}
          </div>
          <div className="sa-kpi-footer">
            <span className="sa-kpi-badge sa-badge-suspended">RESTRICTED</span>
            <span>Access blocked or expired</span>
          </div>
        </div>
      </div>

      {/* ──── PENDING APPROVAL ALERT BANNER (If any pending) ──── */}
      {pendingCount > 0 && statusFilter !== 'pending' && (
        <div className="sa-pending-alert-card">
          <div className="sa-pending-alert-left">
            <div className="sa-pending-icon-ring">
              <Clock size={22} />
            </div>
            <div>
              <h3 className="sa-pending-alert-title">
                {pendingCount} Institution Registration{pendingCount > 1 ? 's' : ''} Awaiting Super Admin Review
              </h3>
              <p className="sa-pending-alert-desc">
                College administrators are waiting for your approval before their campus dashboards and exams can be unlocked.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="sa-pending-review-btn"
            onClick={() => setStatusFilter('pending')}
          >
            <span>Review Applications</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ──── TOOLBAR & FILTER CONTROLS ──── */}
      <div className="sa-toolbar-card">
        <div className="sa-search-box">
          <Search className="sa-search-icon" size={16} />
          <input
            type="text"
            className="sa-search-input"
            placeholder="Search by university name, administrator email, or campus address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="sa-filter-tabs">
          <button
            type="button"
            className={`sa-filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <span>All Tenants</span>
            <span className="sa-tab-counter">{totalCount}</span>
          </button>
          <button
            type="button"
            className={`sa-filter-tab tab-amber ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            <span>Pending Review</span>
            <span className="sa-tab-counter">{pendingCount}</span>
          </button>
          <button
            type="button"
            className={`sa-filter-tab ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            <span>Active</span>
            <span className="sa-tab-counter">{activeCount}</span>
          </button>
          <button
            type="button"
            className={`sa-filter-tab ${statusFilter === 'suspended' ? 'active' : ''}`}
            onClick={() => setStatusFilter('suspended')}
          >
            <span>Suspended</span>
            <span className="sa-tab-counter">{suspendedCount}</span>
          </button>
        </div>
      </div>

      {/* ──── INSTITUTIONS TABLE ──── */}
      <div className="sa-table-card">
        <div className="sa-table-scroll">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Institution</th>
                <th>Contact &amp; Domain</th>
                <th>Plan Tier &amp; Expiry</th>
                <th>Candidate Pool</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Governance Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="sa-table-empty">
                      <div className="sa-table-empty-icon sa-spin">
                        <RefreshCw size={22} />
                      </div>
                      <p style={{ margin: 0, fontWeight: 600 }}>Loading tenant records from database...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredColleges.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="sa-table-empty">
                      <div className="sa-table-empty-icon">
                        <Building2 size={24} />
                      </div>
                      <p style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--sa-forest)' }}>
                        No institutions match the selected filter
                      </p>
                      <p style={{ margin: 0, fontSize: '13px' }}>
                        Try clearing search terms or switching tabs to view other institutional tiers.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredColleges.map((c, idx) => {
                  const studentCount =
                    c.student_count ?? (c.students?.[0]?.count ?? (Array.isArray(c.students) ? c.students.length : 0));
                  const isSuspended = c.is_active === false;
                  const isPending = c.status === 'pending';

                  return (
                    <tr key={c.id}>
                      {/* Name & Avatar */}
                      <td>
                        <div className="sa-tenant-cell">
                          <div className={`sa-tenant-avatar-circle sa-avatar-bg-${idx % 4}`}>
                            {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <div className="sa-tenant-name">{c.name}</div>
                            {c.address && (
                              <div className="sa-tenant-subline">
                                <MapPin size={11} /> {c.address}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact & Website */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{ color: 'var(--sa-forest)', fontSize: '13px', fontWeight: 600 }}>
                            {c.email}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--sa-text-subtle)' }}>
                            {c.phone && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Phone size={11} /> {c.phone}
                              </span>
                            )}
                            {c.website && (
                              <a
                                href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: 'var(--sa-coral)', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none', fontWeight: 600 }}
                              >
                                <Globe size={11} /> Visit <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Plan Badge & Expiry */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div>
                            <span className={`sa-badge sa-plan-${c.subscription_plan || 'basic'}`}>
                              {(c.subscription_plan || 'basic').toUpperCase()}
                            </span>
                          </div>
                          <span style={{ fontSize: '11.5px', color: 'var(--sa-text-subtle)' }}>
                            Expires: {c.subscription_expiry ? formatIST(c.subscription_expiry, 'dateOnly') : 'No Expiry'}
                          </span>
                        </div>
                      </td>

                      {/* Enrolled Candidates */}
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--sa-forest)', fontWeight: 700, fontFamily: 'Space Grotesk' }}>
                          <Users size={14} style={{ color: 'var(--sa-text-subtle)' }} />
                          <span>{studentCount} Students</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        {isPending ? (
                          <span className="sa-badge sa-badge-pending">
                            <Clock size={11} />
                            PENDING APPROVAL
                          </span>
                        ) : c.status === 'rejected' ? (
                          <span className="sa-badge sa-badge-rejected">
                            REJECTED
                          </span>
                        ) : (
                          <span className={`sa-badge ${!isSuspended ? 'sa-badge-active' : 'sa-badge-suspended'}`}>
                            {!isSuspended ? 'ACTIVE' : 'SUSPENDED'}
                          </span>
                        )}
                      </td>

                      {/* Action Group */}
                      <td style={{ textAlign: 'right' }}>
                        {isPending ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              className="sa-btn-success"
                              onClick={() => handleApproveCollege(c.id, c.name)}
                              disabled={approvingId === c.id}
                              title="Approve registration request"
                            >
                              <CheckCircle2 size={13} />
                              <span>{approvingId === c.id ? 'Approving...' : 'Approve'}</span>
                            </button>

                            <button
                              type="button"
                              className="sa-btn-danger"
                              onClick={() => openReject(c)}
                              title="Decline registration request"
                            >
                              <XCircle size={13} />
                              <span>Decline</span>
                            </button>

                            <button
                              type="button"
                              className="sa-icon-btn sa-icon-btn-danger"
                              title="Remove Record"
                              onClick={() => openDelete(c)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="sa-action-btn-group">
                            {/* Plan Override */}
                            <button
                              type="button"
                              className="sa-icon-btn"
                              title="Manage Plan & Licensing Tier"
                              onClick={() => openPlan(c)}
                            >
                              <Award size={15} style={{ color: 'var(--sa-amber)' }} />
                            </button>

                            {/* Edit Metadata */}
                            <button
                              type="button"
                              className="sa-icon-btn"
                              title="Edit Institution Profile"
                              onClick={() => openEdit(c)}
                            >
                              <Edit2 size={14} />
                            </button>

                            {/* Reset Password */}
                            <button
                              type="button"
                              className="sa-icon-btn"
                              title="Reset Administrator Password"
                              onClick={() => openResetPassword(c)}
                            >
                              <KeyRound size={14} />
                            </button>

                            {/* Toggle Active/Suspend */}
                            <button
                              type="button"
                              className={`sa-btn-toggle ${!isSuspended ? 'sa-btn-suspend' : 'sa-btn-activate'}`}
                              onClick={() => toggleCollege(c.id, c.name, c.is_active)}
                              disabled={togglingId === c.id}
                              title={!isSuspended ? 'Suspend tenant access' : 'Activate tenant access'}
                            >
                              {!isSuspended ? (
                                <>
                                  <XCircle size={13} />
                                  <span>{togglingId === c.id ? '...' : 'Suspend'}</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={13} />
                                  <span>{togglingId === c.id ? '...' : 'Activate'}</span>
                                </>
                              )}
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              className="sa-icon-btn sa-icon-btn-danger"
                              title="Remove Institution"
                              onClick={() => openDelete(c)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MODAL 1: ONBOARD NEW INSTITUTION
          ═══════════════════════════════════════════════════════════ */}
      {showOnboardModal && (
        <div className="sa-modal-backdrop" onClick={() => setShowOnboardModal(false)}>
          <div className="sa-modal sa-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <div>
                <h3 className="sa-modal-title">
                  <Building2 size={20} style={{ color: 'var(--sa-mint)' }} />
                  Direct Institution Onboarding
                </h3>
                <p className="sa-modal-subtitle">
                  Provision an accredited tenant workspace with predefined access rights and billing tier.
                </p>
              </div>
              <button type="button" className="sa-modal-close" onClick={() => setShowOnboardModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit}>
              <div className="sa-modal-body">
                <div className="sa-form-grid">
                  <div className="sa-form-group sa-form-grid-full">
                    <label className="sa-form-label">University / Institution Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Stanford University"
                      className="sa-form-input"
                      value={onboardData.name}
                      onChange={(e) => setOnboardData({ ...onboardData, name: e.target.value })}
                    />
                  </div>

                  <div className="sa-form-group">
                    <label className="sa-form-label">Primary Admin Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@institution.edu"
                      className="sa-form-input"
                      value={onboardData.email}
                      onChange={(e) => setOnboardData({ ...onboardData, email: e.target.value })}
                    />
                  </div>

                  <div className="sa-form-group">
                    <label className="sa-form-label">Initial Password *</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        required
                        className="sa-form-input"
                        value={onboardData.password}
                        onChange={(e) => setOnboardData({ ...onboardData, password: e.target.value })}
                      />
                      <button
                        type="button"
                        className="sa-btn-secondary"
                        onClick={() =>
                          setOnboardData({
                            ...onboardData,
                            password: 'Exam@' + Math.floor(100000 + Math.random() * 900000),
                          })
                        }
                        title="Generate New Password"
                      >
                        <Sparkles size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="sa-form-group">
                    <label className="sa-form-label">Official Phone</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      className="sa-form-input"
                      value={onboardData.phone}
                      onChange={(e) => setOnboardData({ ...onboardData, phone: e.target.value })}
                    />
                  </div>

                  <div className="sa-form-group">
                    <label className="sa-form-label">Campus Website</label>
                    <input
                      type="url"
                      placeholder="https://www.institution.edu"
                      className="sa-form-input"
                      value={onboardData.website}
                      onChange={(e) => setOnboardData({ ...onboardData, website: e.target.value })}
                    />
                  </div>

                  <div className="sa-form-group sa-form-grid-full">
                    <label className="sa-form-label">Campus Physical Address</label>
                    <input
                      type="text"
                      placeholder="City, State, Country"
                      className="sa-form-input"
                      value={onboardData.address}
                      onChange={(e) => setOnboardData({ ...onboardData, address: e.target.value })}
                    />
                  </div>

                  {/* Plan Picker */}
                  <div className="sa-form-group sa-form-grid-full">
                    <label className="sa-form-label">Subscription Tier Assignment</label>
                    <div className="sa-plan-picker-grid">
                      <div
                        className={`sa-plan-card-opt ${onboardData.subscription_plan === 'basic' ? 'selected' : ''}`}
                        onClick={() => setOnboardData({ ...onboardData, subscription_plan: 'basic' })}
                      >
                        <div className="sa-plan-opt-name">Basic Plan</div>
                        <div className="sa-plan-opt-price">₹999/mo</div>
                        <div className="sa-plan-opt-desc">50 Students • 10 Exams</div>
                      </div>

                      <div
                        className={`sa-plan-card-opt ${onboardData.subscription_plan === 'standard' ? 'selected' : ''}`}
                        onClick={() => setOnboardData({ ...onboardData, subscription_plan: 'standard' })}
                      >
                        <div className="sa-plan-opt-name">Standard Plan</div>
                        <div className="sa-plan-opt-price">₹2,999/mo</div>
                        <div className="sa-plan-opt-desc">200 Students • Live Proctoring</div>
                      </div>

                      <div
                        className={`sa-plan-card-opt ${onboardData.subscription_plan === 'premium' ? 'selected' : ''}`}
                        onClick={() => setOnboardData({ ...onboardData, subscription_plan: 'premium' })}
                      >
                        <div className="sa-plan-opt-name">Premium Enterprise</div>
                        <div className="sa-plan-opt-price">₹7,999/mo</div>
                        <div className="sa-plan-opt-desc">Unlimited Candidates • AI Shield</div>
                      </div>
                    </div>
                  </div>

                  <div className="sa-form-group sa-form-grid-full">
                    <label className="sa-form-label">Initial Duration</label>
                    <select
                      className="sa-form-select"
                      value={onboardData.duration_months}
                      onChange={(e) => setOnboardData({ ...onboardData, duration_months: parseInt(e.target.value, 10) })}
                    >
                      <option value={1}>1 Month (Standard Period)</option>
                      <option value={3}>3 Months (Quarterly Academic)</option>
                      <option value={6}>6 Months (Semester License)</option>
                      <option value={12}>12 Months (Annual Enterprise)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="sa-modal-footer">
                <button
                  type="button"
                  className="sa-btn-secondary"
                  onClick={() => setShowOnboardModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sa-coral-pill-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Provisioning...' : 'Provision Institution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL 2: EDIT INSTITUTION
          ═══════════════════════════════════════════════════════════ */}
      {showEditModal && activeCollege && (
        <div className="sa-modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <div>
                <h3 className="sa-modal-title">
                  <Edit2 size={18} style={{ color: 'var(--sa-mint)' }} />
                  Edit Institution Details
                </h3>
                <p className="sa-modal-subtitle">Modify contact and profile details for {activeCollege.name}</p>
              </div>
              <button type="button" className="sa-modal-close" onClick={() => setShowEditModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="sa-modal-body">
                <div className="sa-form-group" style={{ marginBottom: '14px' }}>
                  <label className="sa-form-label">Institution Name</label>
                  <input
                    type="text"
                    required
                    className="sa-form-input"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                </div>

                <div className="sa-form-group" style={{ marginBottom: '14px' }}>
                  <label className="sa-form-label">Admin Email</label>
                  <input
                    type="email"
                    required
                    className="sa-form-input"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  />
                </div>

                <div className="sa-form-group" style={{ marginBottom: '14px' }}>
                  <label className="sa-form-label">Contact Phone</label>
                  <input
                    type="text"
                    className="sa-form-input"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  />
                </div>

                <div className="sa-form-group" style={{ marginBottom: '14px' }}>
                  <label className="sa-form-label">Website</label>
                  <input
                    type="text"
                    className="sa-form-input"
                    value={editData.website}
                    onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                  />
                </div>

                <div className="sa-form-group">
                  <label className="sa-form-label">Campus Address</label>
                  <input
                    type="text"
                    className="sa-form-input"
                    value={editData.address}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="sa-modal-footer">
                <button
                  type="button"
                  className="sa-btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sa-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL 3: PLAN OVERRIDE & EXTENSION
          ═══════════════════════════════════════════════════════════ */}
      {showPlanModal && activeCollege && (
        <div className="sa-modal-backdrop" onClick={() => setShowPlanModal(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <div>
                <h3 className="sa-modal-title">
                  <Award size={20} style={{ color: 'var(--sa-amber)' }} />
                  Subscription &amp; License Tier Override
                </h3>
                <p className="sa-modal-subtitle">Configure plan tier and validity for {activeCollege.name}</p>
              </div>
              <button type="button" className="sa-modal-close" onClick={() => setShowPlanModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handlePlanSubmit}>
              <div className="sa-modal-body">
                <div className="sa-form-group" style={{ marginBottom: '16px' }}>
                  <label className="sa-form-label">Select Subscription Plan</label>
                  <div className="sa-plan-picker-grid">
                    <div
                      className={`sa-plan-card-opt ${planData.plan === 'basic' ? 'selected' : ''}`}
                      onClick={() => setPlanData({ ...planData, plan: 'basic' })}
                    >
                      <div className="sa-plan-opt-name">Basic</div>
                      <div className="sa-plan-opt-price">₹999</div>
                      <div className="sa-plan-opt-desc">50 Students</div>
                    </div>

                    <div
                      className={`sa-plan-card-opt ${planData.plan === 'standard' ? 'selected' : ''}`}
                      onClick={() => setPlanData({ ...planData, plan: 'standard' })}
                    >
                      <div className="sa-plan-opt-name">Standard</div>
                      <div className="sa-plan-opt-price">₹2,999</div>
                      <div className="sa-plan-opt-desc">200 Students</div>
                    </div>

                    <div
                      className={`sa-plan-card-opt ${planData.plan === 'premium' ? 'selected' : ''}`}
                      onClick={() => setPlanData({ ...planData, plan: 'premium' })}
                    >
                      <div className="sa-plan-opt-name">Premium</div>
                      <div className="sa-plan-opt-price">₹7,999</div>
                      <div className="sa-plan-opt-desc">Unlimited</div>
                    </div>
                  </div>
                </div>

                <div className="sa-form-group" style={{ marginBottom: '16px' }}>
                  <label className="sa-form-label">Extend License Duration</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className={`sa-filter-tab ${planData.extend_days === '30' && !planData.custom_expiry ? 'active' : ''}`}
                      onClick={() => setPlanData({ ...planData, extend_days: '30', custom_expiry: '' })}
                    >
                      +30 Days
                    </button>
                    <button
                      type="button"
                      className={`sa-filter-tab ${planData.extend_days === '90' && !planData.custom_expiry ? 'active' : ''}`}
                      onClick={() => setPlanData({ ...planData, extend_days: '90', custom_expiry: '' })}
                    >
                      +90 Days
                    </button>
                    <button
                      type="button"
                      className={`sa-filter-tab ${planData.extend_days === '365' && !planData.custom_expiry ? 'active' : ''}`}
                      onClick={() => setPlanData({ ...planData, extend_days: '365', custom_expiry: '' })}
                    >
                      +1 Year (365d)
                    </button>
                  </div>
                </div>

                <div className="sa-form-group" style={{ marginBottom: '16px' }}>
                  <label className="sa-form-label">Or Pick Exact Expiry Date</label>
                  <input
                    type="date"
                    className="sa-form-input"
                    value={planData.custom_expiry}
                    onChange={(e) => setPlanData({ ...planData, custom_expiry: e.target.value })}
                  />
                </div>

                <div className="sa-form-group">
                  <label className="sa-form-label">Administrative Notes / Justification</label>
                  <input
                    type="text"
                    placeholder="e.g. Approved by Executive Board for Annual Contract"
                    className="sa-form-input"
                    value={planData.notes}
                    onChange={(e) => setPlanData({ ...planData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="sa-modal-footer">
                <button
                  type="button"
                  className="sa-btn-secondary"
                  onClick={() => setShowPlanModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sa-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Updating...' : 'Update License'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL 4: RESET PASSWORD
          ═══════════════════════════════════════════════════════════ */}
      {showResetPasswordModal && activeCollege && (
        <div className="sa-modal-backdrop" onClick={() => setShowResetPasswordModal(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <div>
                <h3 className="sa-modal-title">
                  <KeyRound size={20} style={{ color: 'var(--sa-mint)' }} />
                  Reset Administrator Password
                </h3>
                <p className="sa-modal-subtitle">Override credentials for {activeCollege.name}</p>
              </div>
              <button type="button" className="sa-modal-close" onClick={() => setShowResetPasswordModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit}>
              <div className="sa-modal-body">
                <div className="sa-form-group">
                  <label className="sa-form-label">New Secure Password</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      required
                      className="sa-form-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="sa-btn-secondary"
                      onClick={() =>
                        setNewPassword('Pass@' + Math.floor(100000 + Math.random() * 900000))
                      }
                      title="Generate Strong Password"
                    >
                      <Sparkles size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="sa-modal-footer">
                <button
                  type="button"
                  className="sa-btn-secondary"
                  onClick={() => setShowResetPasswordModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sa-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Resetting...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL 5: DELETE INSTITUTION
          ═══════════════════════════════════════════════════════════ */}
      {showDeleteModal && activeCollege && (
        <div className="sa-modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <div>
                <h3 className="sa-modal-title" style={{ color: 'var(--sa-rose)' }}>
                  <AlertTriangle size={20} />
                  Delete Institution
                </h3>
                <p className="sa-modal-subtitle">This action is irreversible and terminates all student &amp; exam data.</p>
              </div>
              <button type="button" className="sa-modal-close" onClick={() => setShowDeleteModal(false)}>
                ✕
              </button>
            </div>

            <div className="sa-modal-body">
              <p style={{ margin: 0, color: 'var(--sa-forest)', fontSize: '14px', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete <strong>"{activeCollege.name}"</strong> ({activeCollege.email})?
              </p>
            </div>

            <div className="sa-modal-footer">
              <button
                type="button"
                className="sa-btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sa-btn-danger"
                onClick={handleDeleteSubmit}
                disabled={submitting}
              >
                {submitting ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL 6: REJECT REGISTRATION REQUEST
          ═══════════════════════════════════════════════════════════ */}
      {showRejectModal && activeCollege && (
        <div className="sa-modal-backdrop" onClick={() => setShowRejectModal(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <div>
                <h3 className="sa-modal-title" style={{ color: 'var(--sa-rose)' }}>
                  <XCircle size={20} />
                  Reject Registration Request
                </h3>
                <p className="sa-modal-subtitle">
                  Decline onboarding for "{activeCollege.name}" ({activeCollege.email})
                </p>
              </div>
              <button type="button" className="sa-modal-close" onClick={() => setShowRejectModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleRejectSubmit}>
              <div className="sa-modal-body">
                <p style={{ margin: '0 0 16px', color: 'var(--sa-forest)', fontSize: '14px', lineHeight: 1.5 }}>
                  Are you sure you want to decline this institution registration? The college administrator will be barred from logging in or accessing platform features.
                </p>

                <div className="sa-form-group">
                  <label className="sa-form-label">Rejection Reason (Optional)</label>
                  <textarea
                    className="sa-form-textarea"
                    rows={3}
                    placeholder="e.g. Unverified institutional domain, incomplete contact details, duplicate application..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                  <span style={{ fontSize: '11.5px', color: 'var(--sa-text-subtle)', marginTop: '4px', display: 'block' }}>
                    This reason will be recorded and shown if the administrator attempts to sign in.
                  </span>
                </div>
              </div>

              <div className="sa-modal-footer">
                <button
                  type="button"
                  className="sa-btn-secondary"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sa-btn-danger"
                  disabled={submitting}
                >
                  {submitting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
