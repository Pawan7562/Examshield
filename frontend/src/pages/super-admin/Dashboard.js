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
  ChevronLeft,
  ChevronRight,
  Plus,
  Radio,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Check,
  TrendingUp,
} from 'lucide-react';
import { superAdminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './SuperAdmin.css';

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('monthly'); // 'weekly' | 'monthly'
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'colleges' | 'security'
  const [selectedDay, setSelectedDay] = useState(6); // default Sat (index 5 or day 21)

  // Quick Onboard Modal state
  const [showQuickOnboard, setShowQuickOnboard] = useState(false);
  const [onboardSubmitting, setOnboardSubmitting] = useState(false);
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
      const [dashRes, logsRes] = await Promise.allSettled([
        superAdminAPI.getDashboard(),
        superAdminAPI.getAuditLogs({ limit: 8 }),
      ]);

      if (dashRes.status === 'fulfilled') {
        const payload = dashRes.value?.data || dashRes.value;
        setData(payload);
      }

      if (logsRes.status === 'fulfilled') {
        const logsPayload = logsRes.value?.logs || logsRes.value?.data?.logs || [];
        setAuditLogs(Array.isArray(logsPayload) ? logsPayload : []);
      }

      if (isRefresh) toast.success('Telemetry synchronized with database');
    } catch (err) {
      console.error('Failed to load super admin telemetry:', err);
      toast.error('Unable to fetch live platform metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle Quick Onboarding
  const handleQuickOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!onboardForm.name || !onboardForm.email || !onboardForm.password) {
      return toast.error('Institution name, email, and password are required.');
    }
    setOnboardSubmitting(true);
    try {
      const res = await superAdminAPI.onboardCollege(onboardForm);
      toast.success(res?.message || res?.data?.message || 'College onboarded successfully!');
      setShowQuickOnboard(false);
      setOnboardForm({
        name: '',
        email: '',
        password: '',
        subscription_plan: 'basic',
        duration_months: 1,
      });
      fetchDashboardData(true);
    } catch (err) {
      console.error('Onboarding failed:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to onboard institution');
    } finally {
      setOnboardSubmitting(false);
    }
  };

  const { stats, recentColleges = [], planDistribution = {} } = data || {};

  const totalColleges = stats?.totalColleges || 0;
  const activeColleges = stats?.activeColleges || 0;
  const totalStudents = stats?.totalStudents || 0;
  const totalExams = stats?.totalExams || 0;
  const totalRevenue = stats?.totalRevenue || 0;

  // Plan distribution counts
  const basicCount = planDistribution?.basic || 0;
  const standardCount = planDistribution?.standard || 0;
  const premiumCount = planDistribution?.premium || 0;
  const totalPlans = basicCount + standardCount + premiumCount || 1;

  const basicPct = Math.round((basicCount / totalPlans) * 100);
  const standardPct = Math.round((standardCount / totalPlans) * 100);
  const premiumPct = Math.round((premiumCount / totalPlans) * 100);

  // Calendar Day Strip (Reference: Mon 2 Tue 3 Wed 4 Thu 5 Fri 6 Sat 7)
  const calendarDays = [
    { day: 'Mon', num: 16 },
    { day: 'Tue', num: 17 },
    { day: 'Wed', num: 18 },
    { day: 'Thu', num: 19 },
    { day: 'Fri', num: 20 },
    { day: 'Sat', num: 21 },
    { day: 'Sun', num: 22 },
  ];

  // Filtered Notifications / Logs
  const filteredLogs = auditLogs.filter((log) => {
    if (activeTab === 'colleges') return (log.action || '').includes('COLLEGE') || (log.action || '').includes('SUBSCRIPTION');
    if (activeTab === 'security') return (log.action || '').includes('AUTH') || (log.action || '').includes('SUSPEND') || (log.action || '').includes('SECURITY');
    return true;
  });

  return (
    <div className="sa-bento-viewport">
      {/* ──── 1. TOP HERO BENTO BANNER (Reference: "Work's always better together") ──── */}
      <section className="sa-bento-hero">
        <div className="sa-bento-hero-left">
          <div className="sa-bento-hero-header">
            <h1 className="sa-bento-hero-title">
              Platform governance is always <span className="sa-hero-serif-accent">better</span> together
            </h1>
            <p className="sa-bento-hero-subtitle">
              Supervise institutional tenants, review real-time AI invigilation telemetry, and maintain zero-dispute assessment integrity across all campuses.
            </p>
          </div>

          <div className="sa-bento-hero-cta-row">
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
              <span className="sa-coral-icon-bubble">
                <Plus size={16} />
              </span>
              <span>Onboard College</span>
            </button>

            <button
              type="button"
              className="sa-hero-sync-btn"
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              title="Refresh live telemetry"
            >
              <RefreshCw size={14} className={refreshing ? 'sa-spin-fast' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Sync Telemetry'}</span>
            </button>
          </div>
        </div>

        {/* Right Hero Stack: Cluster Nodes & Active Avatars */}
        <div className="sa-bento-hero-right">
          <div className="sa-hero-avatar-stack">
            <div className="sa-avatar-bubble sa-avatar-1" title="Cluster Admin: Root Lead">PK</div>
            <div className="sa-avatar-bubble sa-avatar-2" title="Security Invigilator: AI Mesh">AI</div>
            <div className="sa-avatar-bubble sa-avatar-3" title="Neon Lakebase Watchdog">DB</div>
            <div className="sa-avatar-bubble sa-avatar-count">+3</div>
          </div>
          <div className="sa-hero-nodes-pill">
            <span className="sa-pulse-dot" />
            <span>6 nodes active now</span>
          </div>
        </div>
      </section>

      {/* ──── 2. MAIN BENTO GRID (Split into Main Left Column & Side Right Column) ──── */}
      <div className="sa-bento-split-grid">
        {/* ──── LEFT MAIN BENTO COLUMN ──── */}
        <div className="sa-bento-main-col">
          {/* Bento Sub-Row 1: Institutions + Telemetry + Impact Bar */}
          <div className="sa-bento-tri-row">
            {/* Card A: Institutions (Reference: "Members 4.4") */}
            <div className="sa-card-organic sa-card-tenants">
              <div className="sa-card-organic-header">
                <div className="sa-tenants-title-stack">
                  <h3 className="sa-organic-title">Institutions</h3>
                  <span className="sa-organic-badge">
                    <span className="sa-badge-star">★</span> {activeColleges} Active
                  </span>
                </div>
                <Link to="/super-admin/colleges" className="sa-organic-arrow-btn" title="View Directory">
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="sa-tenants-avatar-grid">
                {recentColleges.slice(0, 4).map((col, idx) => (
                  <div key={col.id || idx} className="sa-tenant-chip" title={`${col.name} (${col.subscription_plan})`}>
                    <div className={`sa-tenant-avatar sa-avatar-bg-${idx % 4}`}>
                      {col.name ? col.name.slice(0, 2).toUpperCase() : 'UN'}
                    </div>
                    <div className="sa-tenant-name">{col.name}</div>
                  </div>
                ))}
                {recentColleges.length === 0 && (
                  <div className="sa-tenant-chip">
                    <div className="sa-tenant-avatar sa-avatar-bg-0">EX</div>
                    <div className="sa-tenant-name">ExamShield</div>
                  </div>
                )}
              </div>
            </div>

            {/* Card B: Live Telemetry & Latency (Reference: "Data 00,1h") */}
            <div className="sa-card-organic sa-card-telemetry">
              <div className="sa-card-organic-header">
                <span className="sa-organic-sublabel">Data &amp; Latency</span>
                <Link to="/super-admin/settings" className="sa-organic-arrow-btn" title="Cluster Telemetry">
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="sa-telemetry-num-row">
                <div className="sa-telemetry-big-num">
                  99<span className="sa-telemetry-comma">,</span>98<span className="sa-telemetry-unit">%</span>
                </div>
                <span className="sa-telemetry-tag">UPTIME</span>
              </div>

              {/* Dual-color Progress Bars */}
              <div className="sa-dual-meter-stack">
                <div className="sa-meter-track">
                  <div className="sa-meter-bar sa-meter-mint" style={{ width: '92%' }} />
                </div>
                <div className="sa-meter-chips-row">
                  <span className="sa-meter-chip">
                    <span className="sa-chip-dot sa-dot-mint" /> 92% Nodes
                  </span>
                  <span className="sa-meter-chip">
                    <span className="sa-chip-dot sa-dot-peach" /> 22ms DB
                  </span>
                  <span className="sa-meter-chip">
                    <span className="sa-chip-dot sa-dot-sand" /> 12k TPS
                  </span>
                </div>
              </div>
            </div>

            {/* Card C: Capacity Impact Pill Bars (Reference: "Impact / Engagement") */}
            <div className="sa-card-organic sa-card-impact">
              <div className="sa-card-organic-header">
                <span className="sa-impact-label active">Impact</span>
                <span className="sa-impact-label">Load</span>
              </div>

              {/* Vertical Organic Pill Bar Chart */}
              <div className="sa-impact-pill-chart">
                <div className="sa-vertical-pill-col">
                  <div className="sa-vertical-pill-bar sa-vbar-sand" style={{ height: '52%' }} title="Memory: 52%" />
                </div>
                <div className="sa-vertical-pill-col">
                  <div className="sa-vertical-pill-bar sa-vbar-mint" style={{ height: '88%' }} title="Cluster Uptime: 88%" />
                </div>
                <div className="sa-vertical-pill-col">
                  <div className="sa-vertical-pill-bar sa-vbar-peach" style={{ height: '64%' }} title="Active Exams: 64%" />
                </div>
              </div>
            </div>
          </div>

          {/* Bento Sub-Row 2: Statistics Card (Reference: "Statistics 01 00 tasks complete") */}
          <div className="sa-bento-dual-row">
            {/* Card D: Main Statistics Segment */}
            <div className="sa-card-organic sa-card-stats-full">
              <div className="sa-card-organic-header">
                <h3 className="sa-organic-title">Platform Performance</h3>
                <div className="sa-timeframe-pill-toggle">
                  <button
                    type="button"
                    className={`sa-toggle-pill ${timeframe === 'weekly' ? 'active' : ''}`}
                    onClick={() => setTimeframe('weekly')}
                  >
                    Weekly
                  </button>
                  <button
                    type="button"
                    className={`sa-toggle-pill ${timeframe === 'monthly' ? 'active' : ''}`}
                    onClick={() => setTimeframe('monthly')}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              {/* Digital Segment Numbers */}
              <div className="sa-digital-stats-grid">
                <div className="sa-digital-stat-item">
                  <div className="sa-digital-digits">
                    <span className="sa-digit-box">{String(totalColleges).padStart(2, '0')[0]}</span>
                    <span className="sa-digit-box">{String(totalColleges).padStart(2, '0')[1] || '0'}</span>
                  </div>
                  <span className="sa-digital-label">Colleges Onboarded</span>
                </div>

                <div className="sa-digital-stat-item">
                  <div className="sa-digital-digits">
                    <span className="sa-digit-box">{totalStudents >= 1000 ? Math.floor(totalStudents / 1000) : '0'}</span>
                    <span className="sa-digit-box">k+</span>
                  </div>
                  <span className="sa-digital-label">Enrolled Students</span>
                </div>

                <div className="sa-digital-stat-item">
                  <div className="sa-digital-digits">
                    <span className="sa-digit-box">{String(totalExams).padStart(2, '0')[0]}</span>
                    <span className="sa-digit-box">{String(totalExams).padStart(2, '0')[1] || '0'}</span>
                  </div>
                  <span className="sa-digital-label">Monitored Exams</span>
                </div>

                <div className="sa-digital-stat-item">
                  <div className="sa-digital-digits">
                    <span className="sa-digit-box">₹</span>
                    <span className="sa-digit-box">{totalRevenue >= 1000 ? `${Math.round(totalRevenue / 1000)}k` : totalRevenue}</span>
                  </div>
                  <span className="sa-digital-label">Subscription MRR</span>
                </div>
              </div>

              {/* Dotted / Segmented Progress Meter */}
              <div className="sa-dotted-progress-strip">
                <div className="sa-dotted-track">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <span
                      key={i}
                      className={`sa-dot-segment ${i < 19 ? 'filled' : ''}`}
                    />
                  ))}
                </div>
                <div className="sa-dotted-legend">
                  <span>99.98% System Health Reliability</span>
                  <span>Zero Security Disputes</span>
                </div>
              </div>
            </div>

            {/* Right Sub-Stack: Dark Security Pill + Unleash Your Potential */}
            <div className="sa-card-right-stack">
              {/* Card E: Dark Forest Green Security Pill (Reference: "Breakthrough Brainstorm 12:45 pm") */}
              <div className="sa-card-dark-pill">
                <div className="sa-dark-pill-left">
                  <div className="sa-dark-pill-glow-dot">
                    <ShieldCheck size={16} />
                  </div>
                  <div className="sa-dark-pill-text">
                    <span className="sa-dark-pill-title">Active Security Mesh</span>
                    <span className="sa-dark-pill-time">All 6 Nodes Operational</span>
                  </div>
                </div>
                <div className="sa-dark-pill-action">
                  <CheckCircle2 size={16} />
                </div>
              </div>

              {/* Card F: Unleash Your Potential / Pro Quota (Reference: "Unleash Your Potential / Pro") */}
              <div className="sa-card-organic sa-card-pro-quota">
                <div className="sa-pro-content-left">
                  <div className="sa-pro-icon-chip">
                    <Zap size={18} />
                  </div>
                  <div className="sa-pro-info">
                    <h4 className="sa-pro-tier-title">Enterprise Tier</h4>
                    <ul className="sa-pro-features-list">
                      <li><Check size={12} /> Unlimited seat allocation</li>
                      <li><Check size={12} /> 1080p deep facial mesh</li>
                      <li><Check size={12} /> Multi-campus ledger</li>
                    </ul>
                  </div>
                </div>

                <div className="sa-pro-action-col">
                  <h4 className="sa-pro-headline">Enterprise Quotas</h4>
                  <p className="sa-pro-subtext">Automated scale-to-zero capacity</p>
                  <Link to="/super-admin/payments" className="sa-pro-upgrade-btn">
                    <span>Manage Plans</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ──── RIGHT COLUMN BENTO STACK (Calendar + Registrations + Activity) ──── */}
        <div className="sa-bento-side-col">
          {/* Card G: Calendar & Day Selector (Reference: "November, 2026") */}
          <div className="sa-card-organic sa-card-calendar">
            <div className="sa-card-organic-header">
              <h3 className="sa-organic-title">November, 2026</h3>
              <div className="sa-cal-nav-buttons">
                <button type="button" className="sa-cal-nav-btn" aria-label="Previous week">
                  <ChevronLeft size={14} />
                </button>
                <button type="button" className="sa-cal-nav-btn" aria-label="Next week">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Horizontal Day Picker Strip */}
            <div className="sa-calendar-day-strip">
              {calendarDays.map((item, idx) => {
                const isSelected = selectedDay === idx;
                return (
                  <button
                    key={item.day}
                    type="button"
                    className={`sa-cal-day-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedDay(idx)}
                  >
                    <span className="sa-cal-day-name">{item.day}</span>
                    <span className="sa-cal-day-num">{item.num}</span>
                    {isSelected && <span className="sa-cal-active-pip" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card H: Recent Institutional Registrations (Reference: "Last videos") */}
          <div className="sa-card-organic sa-card-recent-colleges">
            <div className="sa-card-organic-header">
              <h3 className="sa-organic-title">Institutional Tenants</h3>
              <Link to="/super-admin/colleges" className="sa-organic-sublink">
                View all ({totalColleges})
              </Link>
            </div>

            <div className="sa-recent-cards-rail">
              {recentColleges.slice(0, 3).map((col, idx) => (
                <div key={col.id || idx} className="sa-recent-card-item">
                  <div className={`sa-recent-thumb sa-thumb-theme-${idx % 3}`}>
                    <Building2 size={24} />
                    <span className="sa-recent-plan-chip">
                      {(col.subscription_plan || 'basic').toUpperCase()}
                    </span>
                  </div>
                  <div className="sa-recent-info-block">
                    <h5 className="sa-recent-col-name">{col.name}</h5>
                    <div className="sa-recent-col-meta">
                      <span>{col.email}</span>
                      <span>•</span>
                      <span className={col.is_active ? 'sa-meta-active' : 'sa-meta-suspended'}>
                        {col.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {recentColleges.length === 0 && (
                <div className="sa-empty-state-card">
                  <Building2 size={24} style={{ color: '#94a3b8' }} />
                  <p>No institutions registered yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Card I: Live Audit & System Notifications (Reference: "Notifications: Overview / Shared / Comments") */}
          <div className="sa-card-organic sa-card-notifications">
            <div className="sa-card-organic-header">
              <h3 className="sa-organic-title">Audit Stream</h3>
              <div className="sa-notif-filter-tabs">
                <button
                  type="button"
                  className={`sa-notif-tab ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  type="button"
                  className={`sa-notif-tab ${activeTab === 'colleges' ? 'active' : ''}`}
                  onClick={() => setActiveTab('colleges')}
                >
                  Tenants
                </button>
                <button
                  type="button"
                  className={`sa-notif-tab ${activeTab === 'security' ? 'active' : ''}`}
                  onClick={() => setActiveTab('security')}
                >
                  Security
                </button>
              </div>
            </div>

            <div className="sa-notif-list">
              {filteredLogs.slice(0, 4).map((log, idx) => (
                <div key={log.id || idx} className="sa-notif-item">
                  <div className="sa-notif-avatar">
                    {(log.user_name || log.actor || 'SA').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="sa-notif-body">
                    <p className="sa-notif-text">
                      <strong className="sa-notif-actor">{log.user_name || log.actor || 'Super Admin'}</strong>{' '}
                      {log.action?.toLowerCase().replace(/_/g, ' ') || 'performed system operation'}: {log.details || ''}
                    </p>
                    <span className="sa-notif-time">
                      {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </span>
                  </div>
                </div>
              ))}

              {filteredLogs.length === 0 && (
                <div className="sa-notif-item">
                  <div className="sa-notif-avatar">SA</div>
                  <div className="sa-notif-body">
                    <p className="sa-notif-text">
                      <strong className="sa-notif-actor">System Health Monitor</strong> verified 6 backend instances and PostgreSQL connection pool.
                    </p>
                    <span className="sa-notif-time">Just now</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ──── QUICK ONBOARD MODAL ──── */}
      {showQuickOnboard && (
        <div className="sa-modal-backdrop" onClick={() => setShowQuickOnboard(false)}>
          <div className="sa-modal sa-modal-bento" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <div>
                <h3 className="sa-modal-title">Instant College Onboarding</h3>
                <p className="sa-modal-subtitle">Provision tenant database quotas &amp; super-admin credentials</p>
              </div>
              <button
                type="button"
                className="sa-modal-close"
                onClick={() => setShowQuickOnboard(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickOnboardSubmit}>
              <div className="sa-modal-body">
                <div className="sa-form-grid">
                  <div className="sa-form-group">
                    <label className="sa-form-label">College / University Name *</label>
                    <input
                      type="text"
                      className="sa-form-input"
                      required
                      placeholder="e.g. Stanford Technical Institute"
                      value={onboardForm.name}
                      onChange={(e) => setOnboardForm({ ...onboardForm, name: e.target.value })}
                    />
                  </div>

                  <div className="sa-form-group">
                    <label className="sa-form-label">Official Admin Email *</label>
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
                    <label className="sa-form-label">Admin Temporary Password *</label>
                    <input
                      type="text"
                      className="sa-form-input"
                      required
                      value={onboardForm.password}
                      onChange={(e) => setOnboardForm({ ...onboardForm, password: e.target.value })}
                    />
                  </div>

                  <div className="sa-form-group">
                    <label className="sa-form-label">Subscription Tier</label>
                    <select
                      className="sa-form-select"
                      value={onboardForm.subscription_plan}
                      onChange={(e) => setOnboardForm({ ...onboardForm, subscription_plan: e.target.value })}
                    >
                      <option value="basic">Basic (50 Candidates, 10 Exams)</option>
                      <option value="standard">Standard Growth (200 Candidates, 50 Exams)</option>
                      <option value="premium">Premium Enterprise (Unlimited Seats)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="sa-modal-footer">
                <button
                  type="button"
                  className="sa-btn-secondary"
                  onClick={() => setShowQuickOnboard(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sa-coral-pill-btn"
                  disabled={onboardSubmitting}
                >
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
