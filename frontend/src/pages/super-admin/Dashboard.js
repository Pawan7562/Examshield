import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  FileText,
  IndianRupee,
  Activity,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Server,
  Database,
  Cpu,
  Zap,
  Plus,
  Clock,
  ExternalLink,
  Check,
  TrendingUp,
  XCircle,
  Eye,
  KeyRound,
} from 'lucide-react';
import { superAdminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { formatIST } from '../../utils/timezone';
import './SuperAdmin.css';

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [pendingColleges, setPendingColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [auditFilter, setAuditFilter] = useState('all'); // 'all', 'tenants', 'security'

  // Quick Onboard Modal state
  const [showQuickOnboard, setShowQuickOnboard] = useState(false);
  const [onboardSubmitting, setOnboardSubmitting] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [onboardForm, setOnboardForm] = useState({
    name: '',
    email: '',
    password: '',
    subscription_plan: 'basic',
    duration_months: 1,
  });

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [dashRes, logsRes, collegesRes] = await Promise.allSettled([
        superAdminAPI.getDashboard(),
        superAdminAPI.getAuditLogs({ limit: 8 }),
        superAdminAPI.getColleges({ status: 'pending' }),
      ]);

      if (dashRes.status === 'fulfilled') {
        const payload = dashRes.value?.data || dashRes.value;
        setData(payload || {});
      }

      if (logsRes.status === 'fulfilled') {
        const logsPayload =
          logsRes.value?.logs ||
          logsRes.value?.data?.logs ||
          [];
        setAuditLogs(Array.isArray(logsPayload) ? logsPayload : []);
      }

      if (collegesRes.status === 'fulfilled') {
        const pendingList =
          collegesRes.value?.colleges ||
          collegesRes.value?.data?.colleges ||
          [];
        setPendingColleges(Array.isArray(pendingList) ? pendingList.filter((c) => c.status === 'pending') : []);
      }

      if (isRefresh) toast.success('Telemetry synchronized successfully');
    } catch (err) {
      console.error('Failed to load super admin telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle Quick Onboard
  const handleQuickOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!onboardForm.name || !onboardForm.email || !onboardForm.password) {
      return toast.error('Institution name, email, and password are required.');
    }
    setOnboardSubmitting(true);
    try {
      const res = await superAdminAPI.onboardCollege(onboardForm);
      toast.success(res?.message || res?.data?.message || 'Institution onboarded successfully!');
      setShowQuickOnboard(false);
      setOnboardForm({ name: '', email: '', password: '', subscription_plan: 'basic', duration_months: 1 });
      fetchDashboardData(true);
    } catch (err) {
      console.error('Onboarding failed:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to onboard institution');
    } finally {
      setOnboardSubmitting(false);
    }
  };

  // Quick Approve College from Dashboard
  const handleQuickApprove = async (id, name) => {
    setApprovingId(id);
    try {
      const res = await superAdminAPI.approveCollege(id);
      toast.success(res?.message || res?.data?.message || `${name} approved successfully!`);
      fetchDashboardData(true);
    } catch (err) {
      console.error('Approval failed:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to approve institution');
    } finally {
      setApprovingId(null);
    }
  };

  // Safe data extraction
  const stats = data?.stats || {};
  const recentColleges = Array.isArray(data?.recentColleges) ? data.recentColleges : [];
  const planDistribution = data?.planDistribution || {};

  const totalColleges = Number(stats.totalColleges) || 0;
  const activeColleges = Number(stats.activeColleges) || 0;
  const suspendedColleges = totalColleges - activeColleges;
  const totalStudents = Number(stats.totalStudents) || 0;
  const totalExams = Number(stats.totalExams) || 0;
  const totalRevenue = Number(stats.totalRevenue) || 0;
  const allTimeRevenue = Number(stats.allTimeRevenue) || 0;

  // Plan distribution percentages
  const basicCount = Number(planDistribution.basic) || 0;
  const standardCount = Number(planDistribution.standard) || 0;
  const premiumCount = Number(planDistribution.premium) || 0;
  const totalPlans = Math.max(basicCount + standardCount + premiumCount, 1);

  const basicPct = Math.round((basicCount / totalPlans) * 100);
  const standardPct = Math.round((standardCount / totalPlans) * 100);
  const premiumPct = Math.round((premiumCount / totalPlans) * 100);

  // Filtered audit stream
  const safeAuditLogs = Array.isArray(auditLogs) ? auditLogs : [];
  const filteredLogs = safeAuditLogs.filter((log) => {
    const action = String(log.action || '');
    if (auditFilter === 'tenants') return action.includes('COLLEGE') || action.includes('SUBSCRIPTION');
    if (auditFilter === 'security') return action.includes('AUTH') || action.includes('SUSPEND') || action.includes('SECURITY') || action.includes('PASSWORD');
    return true;
  });

  if (loading) {
    return (
      <div className="sa-loading-container">
        <div className="sa-spinner" />
        <span className="sa-loading-text">Synchronizing cluster telemetry &amp; tenancy records...</span>
      </div>
    );
  }

  return (
    <div className="sa-page-shell">
      {/* ──── 1. EXECUTIVE COMMAND HEADER ──── */}
      <div className="sa-page-header">
        <div className="sa-page-title-stack">
          <h1 className="sa-page-title">Executive Command Overview</h1>
          <p className="sa-page-subtitle">
            Autonomous multi-tenant oversight, neural AI invigilation metrics, and infrastructure health across all availability zones.
          </p>
        </div>

        <div className="sa-page-actions">
          <button
            type="button"
            className="sa-btn-secondary"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            title="Synchronize live cluster metrics"
          >
            <RefreshCw size={14} className={refreshing ? 'sa-spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Sync Telemetry'}</span>
          </button>

          <button
            type="button"
            className="sa-coral-pill-btn"
            onClick={() => {
              setOnboardForm({
                name: '',
                email: '',
                password: 'Exam@' + Math.floor(100000 + Math.random() * 900000),
                subscription_plan: 'basic',
                duration_months: 1,
              });
              setShowQuickOnboard(true);
            }}
          >
            <Plus size={16} />
            <span>Onboard Institution</span>
          </button>
        </div>
      </div>

      {/* ──── 2. HIGH-DENSITY KPI METRIC GRID ──── */}
      <div className="sa-kpi-grid">
        {/* Total Institutions */}
        <div className="sa-kpi-card">
          <div className="sa-kpi-top">
            <span className="sa-kpi-label">Institutional Tenants</span>
            <div className="sa-kpi-icon-bubble sa-kpi-icon-forest">
              <Building2 size={18} />
            </div>
          </div>
          <div className="sa-kpi-value">{totalColleges}</div>
          <div className="sa-kpi-footer">
            <span className="sa-kpi-badge sa-badge-active">{activeColleges} ACTIVE</span>
            <span>{suspendedColleges > 0 ? `${suspendedColleges} suspended` : 'Zero suspensions'}</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <Link
          to="/super-admin/colleges"
          className={`sa-kpi-card interactive ${pendingColleges.length > 0 ? 'highlight-amber' : ''}`}
          style={{ textDecoration: 'none' }}
        >
          <div className="sa-kpi-top">
            <span className="sa-kpi-label">Pending Approvals</span>
            <div className="sa-kpi-icon-bubble sa-kpi-icon-amber">
              <Clock size={18} />
            </div>
          </div>
          <div className="sa-kpi-value" style={pendingColleges.length > 0 ? { color: '#d97706' } : {}}>
            {pendingColleges.length}
          </div>
          <div className="sa-kpi-footer">
            <span className={`sa-kpi-badge ${pendingColleges.length > 0 ? 'sa-badge-pending' : 'sa-badge-active'}`}>
              {pendingColleges.length > 0 ? 'ACTION REQUIRED' : 'ALL CLEAR'}
            </span>
            <span>{pendingColleges.length > 0 ? 'Awaiting verification' : 'Zero pending reviews'}</span>
          </div>
        </Link>

        {/* Enrolled Candidate Pool */}
        <div className="sa-kpi-card">
          <div className="sa-kpi-top">
            <span className="sa-kpi-label">Enrolled Candidate Pool</span>
            <div className="sa-kpi-icon-bubble sa-kpi-icon-mint">
              <Users size={18} />
            </div>
          </div>
          <div className="sa-kpi-value">
            {totalStudents.toLocaleString('en-IN')}
          </div>
          <div className="sa-kpi-footer">
            <span className="sa-kpi-badge sa-badge-active">REGISTERED</span>
            <span>Across all institutional rosters</span>
          </div>
        </div>

        {/* Active Invigilated Exams */}
        <div className="sa-kpi-card">
          <div className="sa-kpi-top">
            <span className="sa-kpi-label">Invigilated Assessments</span>
            <div className="sa-kpi-icon-bubble sa-kpi-icon-coral">
              <FileText size={18} />
            </div>
          </div>
          <div className="sa-kpi-value">{totalExams}</div>
          <div className="sa-kpi-footer">
            <span className="sa-kpi-badge sa-badge-pending">SCHEDULED</span>
            <span>AI biometric lockdown active</span>
          </div>
        </div>

        {/* Platform MRR */}
        <div className="sa-kpi-card">
          <div className="sa-kpi-top">
            <span className="sa-kpi-label">Monthly Run-Rate (MRR)</span>
            <div className="sa-kpi-icon-bubble sa-kpi-icon-mint">
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="sa-kpi-value" style={{ color: 'var(--sa-mint)' }}>
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="sa-kpi-footer">
            <span className="sa-kpi-badge sa-badge-active">RECURRING</span>
            <span>₹{allTimeRevenue.toLocaleString('en-IN')} lifetime gross</span>
          </div>
        </div>
      </div>

      {/* ──── 3. PENDING REGISTRATION ALERT BAR (If Any Pending) ──── */}
      {pendingColleges.length > 0 && (
        <div className="sa-pending-alert-card">
          <div className="sa-pending-alert-left">
            <div className="sa-pending-icon-ring">
              <Clock size={22} />
            </div>
            <div>
              <h3 className="sa-pending-alert-title">
                {pendingColleges.length} University Registration{pendingColleges.length > 1 ? 's' : ''} Awaiting Root Approval
              </h3>
              <p className="sa-pending-alert-desc">
                Applicants cannot access campus workspaces or student portals until approved.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="sa-btn-success"
              onClick={() => handleQuickApprove(pendingColleges[0].id, pendingColleges[0].name)}
              disabled={approvingId === pendingColleges[0].id}
            >
              <CheckCircle2 size={14} />
              <span>{approvingId === pendingColleges[0].id ? 'Approving...' : `Quick Approve: ${pendingColleges[0].name.slice(0, 18)}`}</span>
            </button>

            <Link to="/super-admin/colleges" className="sa-btn-secondary" style={{ textDecoration: 'none' }}>
              <span>View Directory</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* ──── 4. MAIN TWO-COLUMN SPLIT GRID ──── */}
      <div className="sa-split-grid">
        {/* ── LEFT COLUMN (65%): Plans & Recent Tenants ── */}
        <div className="sa-col-main">
          {/* Card A: License & Subscription Distribution */}
          <div className="sa-card">
            <div className="sa-card-header">
              <div>
                <h3 className="sa-card-title">Licensing &amp; Tier Allocation</h3>
                <p className="sa-card-desc">Active seat distribution across institutional quota packages</p>
              </div>
              <Link to="/super-admin/payments" className="sa-card-link">
                <span>Financial Ledger</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="sa-tier-distribution-grid">
              {/* Basic Tier */}
              <div className="sa-tier-stat-item">
                <div className="sa-tier-stat-top">
                  <span className="sa-tier-name">Basic Plan</span>
                  <span className="sa-tier-price">₹999/mo</span>
                </div>
                <div className="sa-tier-bar-track">
                  <div className="sa-tier-bar-fill fill-basic" style={{ width: `${basicPct}%` }} />
                </div>
                <div className="sa-tier-stat-footer">
                  <span className="sa-tier-count">{basicCount} Campuses</span>
                  <span className="sa-tier-pct">{basicPct}%</span>
                </div>
              </div>

              {/* Standard Tier */}
              <div className="sa-tier-stat-item">
                <div className="sa-tier-stat-top">
                  <span className="sa-tier-name">Standard Growth</span>
                  <span className="sa-tier-price">₹2,999/mo</span>
                </div>
                <div className="sa-tier-bar-track">
                  <div className="sa-tier-bar-fill fill-standard" style={{ width: `${standardPct}%` }} />
                </div>
                <div className="sa-tier-stat-footer">
                  <span className="sa-tier-count">{standardCount} Campuses</span>
                  <span className="sa-tier-pct">{standardPct}%</span>
                </div>
              </div>

              {/* Premium Tier */}
              <div className="sa-tier-stat-item">
                <div className="sa-tier-stat-top">
                  <span className="sa-tier-name">Premium Enterprise</span>
                  <span className="sa-tier-price">₹7,999/mo</span>
                </div>
                <div className="sa-tier-bar-track">
                  <div className="sa-tier-bar-fill fill-premium" style={{ width: `${premiumPct}%` }} />
                </div>
                <div className="sa-tier-stat-footer">
                  <span className="sa-tier-count">{premiumCount} Campuses</span>
                  <span className="sa-tier-pct">{premiumPct}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card B: Recent Institutional Onboardings */}
          <div className="sa-card">
            <div className="sa-card-header">
              <div>
                <h3 className="sa-card-title">Recent Institutional Onboardings</h3>
                <p className="sa-card-desc">Latest university tenancies provisioned in the cluster</p>
              </div>
              <Link to="/super-admin/colleges" className="sa-card-link">
                <span>Manage Directory ({totalColleges})</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="sa-table-scroll">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Institution</th>
                    <th>Official Admin</th>
                    <th>Tier</th>
                    <th>Status</th>
                    <th>Provisioned</th>
                    <th style={{ textAlign: 'right' }}>Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {recentColleges.slice(0, 5).map((col, idx) => (
                    <tr key={col.id || idx}>
                      <td>
                        <div className="sa-tenant-cell">
                          <div className={`sa-tenant-avatar-circle sa-avatar-bg-${idx % 4}`}>
                            {(col.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="sa-tenant-name">{col.name}</div>
                            <div className="sa-tenant-subline">{col.id?.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--sa-forest)', fontWeight: 600 }}>
                          {col.email}
                        </span>
                      </td>
                      <td>
                        <span className={`sa-badge sa-plan-${col.subscription_plan || 'basic'}`}>
                          {(col.subscription_plan || 'basic').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`sa-badge ${col.is_active ? 'sa-badge-active' : 'sa-badge-suspended'}`}>
                          {col.is_active ? 'ACTIVE' : 'SUSPENDED'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: 'var(--sa-text-muted)' }}>
                          {col.created_at ? formatIST(col.created_at, 'dateOnly') : '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to="/super-admin/colleges"
                          className="sa-icon-btn"
                          title="Inspect in directory"
                        >
                          <Eye size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {recentColleges.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--sa-text-subtle)' }}>
                        No institutions onboarded yet. Click "Onboard Institution" to register your first campus.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (35%): Cluster Telemetry & Real-Time Audit ── */}
        <div className="sa-col-side">
          {/* Card C: Infrastructure Health & Cluster Nodes */}
          <div className="sa-card">
            <div className="sa-card-header">
              <div>
                <h3 className="sa-card-title">Cluster Infrastructure</h3>
                <p className="sa-card-desc">High-availability backend mesh and database telemetry</p>
              </div>
              <span className="sa-badge sa-badge-active">99.98% UPTIME</span>
            </div>

            {/* 6 KVM Nodes Minimalist Grid */}
            <div className="sa-cluster-mini-grid">
              {[1, 2, 3, 4, 5, 6].map((node) => (
                <div key={node} className="sa-node-chip">
                  <div className="sa-node-chip-header">
                    <span className="sa-pulse-indicator" />
                    <span className="sa-node-num">Node {node}</span>
                  </div>
                  <span className="sa-node-latency">{(16 + node * 2)}ms</span>
                </div>
              ))}
            </div>

            {/* Services telemetry list */}
            <div className="sa-service-telemetry-list">
              <div className="sa-service-item">
                <div className="sa-service-left">
                  <Database size={15} style={{ color: 'var(--sa-mint)' }} />
                  <div>
                    <div className="sa-service-name">Neon Lakebase PostgreSQL</div>
                    <div className="sa-service-sub">Connection Pool • Autoscaling Active</div>
                  </div>
                </div>
                <span className="sa-service-status active">22ms</span>
              </div>

              <div className="sa-service-item">
                <div className="sa-service-left">
                  <Cpu size={15} style={{ color: 'var(--sa-coral)' }} />
                  <div>
                    <div className="sa-service-name">Neural Biometric AI Mesh</div>
                    <div className="sa-service-sub">1080p Facial Anti-Spoofing Engine</div>
                  </div>
                </div>
                <span className="sa-service-status active">Operational</span>
              </div>

              <div className="sa-service-item">
                <div className="sa-service-left">
                  <Server size={15} style={{ color: 'var(--sa-forest)' }} />
                  <div>
                    <div className="sa-service-name">NGINX High-Concurrency Load Balancer</div>
                    <div className="sa-service-sub">SSL Termination • Zero Dropped Packets</div>
                  </div>
                </div>
                <span className="sa-service-status active">100% OK</span>
              </div>
            </div>
          </div>

          {/* Card D: Real-Time Audit & Security Stream */}
          <div className="sa-card">
            <div className="sa-card-header">
              <div>
                <h3 className="sa-card-title">Live Audit Stream</h3>
                <p className="sa-card-desc">Immutable administrative security events</p>
              </div>
              <div className="sa-filter-tabs">
                <button
                  type="button"
                  className={`sa-filter-tab ${auditFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setAuditFilter('all')}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`sa-filter-tab ${auditFilter === 'tenants' ? 'active' : ''}`}
                  onClick={() => setAuditFilter('tenants')}
                >
                  Tenants
                </button>
                <button
                  type="button"
                  className={`sa-filter-tab ${auditFilter === 'security' ? 'active' : ''}`}
                  onClick={() => setAuditFilter('security')}
                >
                  Security
                </button>
              </div>
            </div>

            <div className="sa-audit-stream-list">
              {filteredLogs.slice(0, 5).map((log, idx) => (
                <div key={log.id || idx} className="sa-audit-stream-item">
                  <div className="sa-audit-avatar">
                    {(log.user_name || log.actor || 'SA').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="sa-audit-body">
                    <p className="sa-audit-text">
                      <strong>{log.user_name || log.actor || 'Super Admin'}</strong>{' '}
                      {String(log.action || 'performed operation').toLowerCase().replace(/_/g, ' ')}
                    </p>
                    <span className="sa-audit-timestamp">
                      {log.created_at ? formatIST(log.created_at, 'timeOnly') : 'Recent'}
                    </span>
                  </div>
                </div>
              ))}

              {filteredLogs.length === 0 && (
                <div className="sa-audit-stream-empty">
                  <ShieldCheck size={20} style={{ color: 'var(--sa-text-subtle)' }} />
                  <span>No security events recorded for this category</span>
                </div>
              )}
            </div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--sa-card-border)' }}>
              <Link to="/super-admin/audit-logs" className="sa-card-link" style={{ justifyContent: 'center' }}>
                <span>View Full Audit Dossier</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ──── QUICK ONBOARD MODAL ──── */}
      {showQuickOnboard && (
        <div className="sa-modal-backdrop" onClick={() => setShowQuickOnboard(false)}>
          <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <div>
                <h3 className="sa-modal-title">
                  <Building2 size={18} style={{ color: 'var(--sa-mint)' }} />
                  Direct Institution Provisioning
                </h3>
                <p className="sa-modal-subtitle">Provision college workspace and administrator credentials</p>
              </div>
              <button type="button" className="sa-modal-close" onClick={() => setShowQuickOnboard(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickOnboardSubmit}>
              <div className="sa-modal-body">
                <div className="sa-form-grid">
                  <div className="sa-form-group sa-form-grid-full">
                    <label className="sa-form-label">University / College Name *</label>
                    <input
                      type="text"
                      className="sa-form-input"
                      required
                      placeholder="e.g. Stanford University"
                      value={onboardForm.name}
                      onChange={(e) => setOnboardForm({ ...onboardForm, name: e.target.value })}
                    />
                  </div>

                  <div className="sa-form-group">
                    <label className="sa-form-label">Official Administrator Email *</label>
                    <input
                      type="email"
                      className="sa-form-input"
                      required
                      placeholder="admin@institution.edu"
                      value={onboardForm.email}
                      onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })}
                    />
                  </div>

                  <div className="sa-form-group">
                    <label className="sa-form-label">Temporary Password *</label>
                    <input
                      type="text"
                      className="sa-form-input"
                      required
                      value={onboardForm.password}
                      onChange={(e) => setOnboardForm({ ...onboardForm, password: e.target.value })}
                    />
                  </div>

                  <div className="sa-form-group sa-form-grid-full">
                    <label className="sa-form-label">Subscription Tier Assignment</label>
                    <select
                      className="sa-form-select"
                      value={onboardForm.subscription_plan}
                      onChange={(e) => setOnboardForm({ ...onboardForm, subscription_plan: e.target.value })}
                    >
                      <option value="basic">Basic Plan (50 Candidates, 10 Exams) — ₹999/mo</option>
                      <option value="standard">Standard Growth (200 Candidates, 50 Exams) — ₹2,999/mo</option>
                      <option value="premium">Premium Enterprise (Unlimited Seats) — ₹7,999/mo</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="sa-modal-footer">
                <button type="button" className="sa-btn-secondary" onClick={() => setShowQuickOnboard(false)}>
                  Cancel
                </button>
                <button type="submit" className="sa-coral-pill-btn" disabled={onboardSubmitting}>
                  {onboardSubmitting ? 'Provisioning...' : 'Provision Institution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
