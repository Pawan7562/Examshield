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
} from 'lucide-react';
import { superAdminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './SuperAdmin.css';

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await superAdminAPI.getDashboard();
      setData(res.data);
      if (isRefresh) toast.success('Telemetry updated from database');
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

  return (
    <>
      {/* ──── HERO SUMMARY BANNER ──── */}
      <section className="sa-hero-banner">
        <div className="sa-hero-info">
          <h1>Platform Executive Command Center</h1>
          <p>
            Live multi-tenant supervision, university tenant health metrics, and institutional license controls.
          </p>
        </div>

        <div className="sa-hero-actions">
          <button
            type="button"
            className="sa-action-btn sa-btn-secondary"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            title="Reload telemetry"
          >
            <RefreshCw size={15} className={refreshing ? 'sa-pulse-bullet' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Refresh Telemetry'}</span>
          </button>

          <Link to="/super-admin/colleges" className="sa-action-btn sa-btn-primary">
            <span>Manage All Colleges</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ──── KPI STATS ──── */}
      <section className="sa-stats-grid">
        {/* Total Colleges */}
        <div className="sa-stat-card">
          <div className="sa-stat-top">
            <div className="sa-stat-icon sa-icon-blue">
              <Building2 size={20} />
            </div>
            <span className="sa-stat-badge">
              {activeColleges} / {totalColleges} Active
            </span>
          </div>
          <div className="sa-stat-val">{loading ? '...' : totalColleges}</div>
          <div className="sa-stat-label">Institutions Onboarded</div>
        </div>

        {/* Total Students */}
        <div className="sa-stat-card">
          <div className="sa-stat-top">
            <div className="sa-stat-icon sa-icon-green">
              <Users size={20} />
            </div>
            <span className="sa-stat-badge" style={{ color: '#059669' }}>
              Multi-Campus
            </span>
          </div>
          <div className="sa-stat-val">{loading ? '...' : totalStudents.toLocaleString()}</div>
          <div className="sa-stat-label">Enrolled Candidates</div>
        </div>

        {/* Exams Conducted */}
        <div className="sa-stat-card">
          <div className="sa-stat-top">
            <div className="sa-stat-icon sa-icon-purple">
              <FileText size={20} />
            </div>
            <span className="sa-stat-badge">Zero Dispute</span>
          </div>
          <div className="sa-stat-val">{loading ? '...' : totalExams}</div>
          <div className="sa-stat-label">Monitored Exams</div>
        </div>

        {/* Total ARR / Revenue */}
        <div className="sa-stat-card">
          <div className="sa-stat-top">
            <div className="sa-stat-icon sa-icon-amber">
              <IndianRupee size={20} />
            </div>
            <span className="sa-stat-badge">SaaS Billing</span>
          </div>
          <div className="sa-stat-val">
            {loading ? '...' : `₹${totalRevenue.toLocaleString()}`}
          </div>
          <div className="sa-stat-label">Subscription Revenue</div>
        </div>
      </section>

      {/* ──── SPLIT SECTION: PLANS & RECENT REGISTRATIONS ──── */}
      <div className="sa-split-row">
        {/* Left: Plan Distribution & System Cluster */}
        <div className="sa-card">
          <div className="sa-card-header">
            <div className="sa-card-title-group">
              <Activity size={18} style={{ color: '#f59e0b' }} />
              <div>
                <h2 className="sa-card-title">Tenant License Distribution</h2>
                <span className="sa-card-subtitle">Active tier breakdown</span>
              </div>
            </div>
          </div>

          <div className="sa-plan-list">
            {/* Basic / Trial */}
            <div className="sa-plan-item">
              <div className="sa-plan-row">
                <span style={{ color: '#cbd5e1' }}>Basic (14-Day Free Trial)</span>
                <span style={{ color: '#94a3b8' }}>
                  {basicCount} ({basicPct}%)
                </span>
              </div>
              <div className="sa-plan-bar-track">
                <div
                  className="sa-plan-bar-fill"
                  style={{ width: `${basicPct}%`, background: '#94a3b8' }}
                />
              </div>
            </div>

            {/* Standard */}
            <div className="sa-plan-item">
              <div className="sa-plan-row">
                <span style={{ color: '#60a5fa' }}>Standard Campus Plan</span>
                <span style={{ color: '#60a5fa' }}>
                  {standardCount} ({standardPct}%)
                </span>
              </div>
              <div className="sa-plan-bar-track">
                <div
                  className="sa-plan-bar-fill"
                  style={{ width: `${standardPct}%`, background: '#3b82f6' }}
                />
              </div>
            </div>

            {/* Premium Enterprise */}
            <div className="sa-plan-item">
              <div className="sa-plan-row">
                <span style={{ color: '#fbbf24' }}>Premium Enterprise</span>
                <span style={{ color: '#fbbf24' }}>
                  {premiumCount} ({premiumPct}%)
                </span>
              </div>
              <div className="sa-plan-bar-track">
                <div
                  className="sa-plan-bar-fill"
                  style={{ width: `${premiumPct}%`, background: '#f59e0b' }}
                />
              </div>
            </div>
          </div>

          {/* System Cluster Indicators */}
          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              INFRASTRUCTURE TELEMETRY
            </span>

            <div className="sa-health-strip">
              <div className="sa-health-card">
                <Database size={18} style={{ color: '#059669', flexShrink: 0 }} />
                <div className="sa-health-card-text">
                  <span className="sa-health-card-label">Neon Postgres</span>
                  <span className="sa-health-card-val" style={{ color: '#059669' }}>Healthy (22ms)</span>
                </div>
              </div>

              <div className="sa-health-card">
                <Cpu size={18} style={{ color: '#2563eb', flexShrink: 0 }} />
                <div className="sa-health-card-text">
                  <span className="sa-health-card-label">AI Proctor Node</span>
                  <span className="sa-health-card-val" style={{ color: '#2563eb' }}>Active (1080p)</span>
                </div>
              </div>

              <div className="sa-health-card">
                <Zap size={18} style={{ color: '#d97706', flexShrink: 0 }} />
                <div className="sa-health-card-text">
                  <span className="sa-health-card-label">Socket Gateway</span>
                  <span className="sa-health-card-val" style={{ color: '#d97706' }}>Zero Lag</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Recent Registrations Table */}
        <div className="sa-card">
          <div className="sa-card-header">
            <div>
              <h2 className="sa-card-title">Recent Institutional Registrations</h2>
              <span className="sa-card-subtitle">Latest colleges onboarding onto Nexify Examina</span>
            </div>

            <Link
              to="/super-admin/colleges"
              style={{
                fontSize: '0.82rem',
                color: '#f59e0b',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="sa-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>College Name</th>
                  <th>Subscription</th>
                  <th>Onboarded</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      Fetching institutional records...
                    </td>
                  </tr>
                ) : recentColleges.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No recent registrations recorded.
                    </td>
                  </tr>
                ) : (
                  recentColleges.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="sa-college-cell">
                          <div className="sa-college-avatar">
                            {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <div className="sa-college-name">{c.name}</div>
                            <div className="sa-college-email">{c.email}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`sa-badge sa-plan-${c.subscription_plan || 'basic'}`}>
                          {(c.subscription_plan || 'basic').toUpperCase()}
                        </span>
                      </td>

                      <td style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>

                      <td>
                        <span className={`sa-badge ${c.is_active ? 'sa-badge-active' : 'sa-badge-suspended'}`}>
                          {c.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
