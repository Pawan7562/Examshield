import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Activity,
  Terminal,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Building2,
  CreditCard,
  KeyRound,
  X,
  Code,
  Eye,
} from 'lucide-react';
import { superAdminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { formatIST } from '../../utils/timezone';
import './SuperAdmin.css';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superAdminAPI.getAuditLogs({
        action: actionFilter !== 'all' ? actionFilter : undefined,
      });
      setLogs(res?.logs || res?.data?.logs || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadgeClass = (action = '') => {
    if (action.includes('ONBOARD') || action.includes('ACTIVATED') || action.includes('APPROVED')) return 'sa-badge-active';
    if (action.includes('DELETED') || action.includes('SUSPENDED') || action.includes('REJECTED')) return 'sa-badge-suspended';
    if (action.includes('PAYMENT') || action.includes('SUBSCRIPTION')) return 'sa-plan-standard';
    return 'sa-badge-pending';
  };

  const getActionIcon = (action = '') => {
    if (action.includes('COLLEGE') || action.includes('ONBOARD')) return <Building2 size={13} />;
    if (action.includes('PAYMENT') || action.includes('SUBSCRIPTION')) return <CreditCard size={13} />;
    if (action.includes('PASSWORD') || action.includes('AUTH')) return <KeyRound size={13} />;
    if (action.includes('SETTINGS')) return <Activity size={13} />;
    return <ShieldCheck size={13} />;
  };

  // Quick stats
  const totalLogs = logs.length;
  const onboardingLogs = logs.filter((l) => (l.action || '').includes('ONBOARD') || (l.action || '').includes('APPROVED')).length;
  const credentialLogs = logs.filter((l) => (l.action || '').includes('PASSWORD') || (l.action || '').includes('AUTH')).length;
  const suspensionLogs = logs.filter((l) => (l.action || '').includes('SUSPEND') || (l.action || '').includes('DELETED')).length;

  return (
    <div className="sa-page-shell">
      {/* ──── PAGE HEADER ──── */}
      <div className="sa-page-header">
        <div className="sa-page-title-stack">
          <h1 className="sa-page-title">Security Audit &amp; Compliance Logs</h1>
          <p className="sa-page-subtitle">
            Cryptographically sealed timeline of institutional tenant onboarding, licensing overrides, administrative credentials, and governance policies.
          </p>
        </div>

        <div className="sa-page-actions">
          <button
            type="button"
            className="sa-btn-secondary"
            onClick={fetchLogs}
            disabled={loading}
            title="Reload audit logs"
          >
            <RefreshCw size={14} className={loading ? 'sa-spin' : ''} />
            <span>Refresh Feed</span>
          </button>
        </div>
      </div>

      {/* ──── AUDIT KPI CARDS ──── */}
      <div className="sa-kpi-grid">
        <div className="sa-kpi-card">
          <div className="sa-kpi-top">
            <span className="sa-kpi-label">Logged Audit Events</span>
            <div className="sa-kpi-icon-bubble sa-kpi-icon-forest">
              <Terminal size={18} />
            </div>
          </div>
          <div className="sa-kpi-value">{totalLogs}</div>
          <div className="sa-kpi-footer">
            <span className="sa-kpi-badge sa-badge-active">IMMUTABLE</span>
            <span>Recorded in PostgreSQL ledger</span>
          </div>
        </div>

        <div className="sa-kpi-card">
          <div className="sa-kpi-top">
            <span className="sa-kpi-label">Tenant Provisions</span>
            <div className="sa-kpi-icon-bubble sa-kpi-icon-mint">
              <Building2 size={18} />
            </div>
          </div>
          <div className="sa-kpi-value" style={{ color: 'var(--sa-mint)' }}>
            {onboardingLogs}
          </div>
          <div className="sa-kpi-footer">
            <span className="sa-kpi-badge sa-badge-active">ONBOARDED</span>
            <span>Accredited approvals &amp; creations</span>
          </div>
        </div>

        <div className="sa-kpi-card">
          <div className="sa-kpi-top">
            <span className="sa-kpi-label">Credential Operations</span>
            <div className="sa-kpi-icon-bubble sa-kpi-icon-coral">
              <KeyRound size={18} />
            </div>
          </div>
          <div className="sa-kpi-value" style={{ color: 'var(--sa-coral)' }}>
            {credentialLogs}
          </div>
          <div className="sa-kpi-footer">
            <span className="sa-kpi-badge sa-badge-pending">PASSWORDS</span>
            <span>Admin reset &amp; re-auth events</span>
          </div>
        </div>

        <div className="sa-kpi-card">
          <div className="sa-kpi-top">
            <span className="sa-kpi-label">Access Restrictions</span>
            <div className="sa-kpi-icon-bubble sa-kpi-icon-rose">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="sa-kpi-value" style={{ color: 'var(--sa-rose)' }}>
            {suspensionLogs}
          </div>
          <div className="sa-kpi-footer">
            <span className="sa-kpi-badge sa-badge-suspended">SUSPENSIONS</span>
            <span>Security locks &amp; deletions</span>
          </div>
        </div>
      </div>

      {/* ──── FILTER TOOLBAR ──── */}
      <div className="sa-toolbar-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--sa-forest)', textTransform: 'uppercase', marginRight: '6px', fontFamily: 'Space Grotesk' }}>
            Event Filter:
          </span>
          {[
            { id: 'all', label: 'All Events' },
            { id: 'COLLEGE_ONBOARDED', label: 'Onboardings' },
            { id: 'SUBSCRIPTION_OVERRIDDEN', label: 'Plan Overrides' },
            { id: 'PAYMENT_RECORDED_MANUALLY', label: 'Transactions' },
            { id: 'COLLEGE_PASSWORD_RESET', label: 'Credentials' },
            { id: 'COLLEGE_ACTIVATED', label: 'Activations' },
            { id: 'COLLEGE_SUSPENDED', label: 'Suspensions' },
            { id: 'PLATFORM_SETTINGS_UPDATED', label: 'Settings' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              className={`sa-filter-tab ${actionFilter === pill.id ? 'active' : ''}`}
              onClick={() => setActionFilter(pill.id)}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* ──── AUDIT LOGS TABLE ──── */}
      <div className="sa-table-card">
        <div className="sa-table-scroll">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Timestamp (IST)</th>
                <th>Security Action</th>
                <th>Actor / Admin</th>
                <th>Target Resource</th>
                <th>Details / Payload</th>
                <th>Origin / IP</th>
                <th style={{ textAlign: 'right' }}>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="sa-table-empty">
                      <div className="sa-table-empty-icon sa-spin">
                        <RefreshCw size={22} />
                      </div>
                      <p style={{ margin: 0, fontWeight: 600 }}>Streaming audit log records...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="sa-table-empty">
                      <div className="sa-table-empty-icon">
                        <Terminal size={24} />
                      </div>
                      <p style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--sa-forest)' }}>
                        No audit events recorded for this category
                      </p>
                      <p style={{ margin: 0, fontSize: '13px' }}>
                        Switch event filters to view other administrative action streams.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  let parsedDetails = null;
                  try {
                    parsedDetails = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
                  } catch (e) {
                    parsedDetails = log.details;
                  }

                  return (
                    <tr key={log.id}>
                      {/* Timestamp */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--sa-text-muted)' }}>
                          <Clock size={12} />
                          <span>{log.created_at ? formatIST(log.created_at, 'dateTime') : '—'}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td>
                        <span className={`sa-badge ${getActionBadgeClass(log.action)}`}>
                          {getActionIcon(log.action)}
                          {log.action}
                        </span>
                      </td>

                      {/* Actor */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="sa-notif-avatar" style={{ width: '28px', height: '28px', fontSize: '10px' }}>
                            {(log.user_name || log.actor || 'SA').slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--sa-forest)' }}>
                            {log.user_name || log.actor || 'Super Admin'}
                          </span>
                        </div>
                      </td>

                      {/* Target Resource */}
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sa-forest)' }}>
                          {log.resource_type ? log.resource_type.toUpperCase() : 'SYSTEM'}
                          {log.resource_id && (
                            <span style={{ fontSize: '11px', color: 'var(--sa-text-subtle)', display: 'block', fontFamily: 'monospace' }}>
                              {log.resource_id.substring(0, 14)}...
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Details / Payload preview */}
                      <td>
                        <div style={{ maxWidth: '340px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--sa-text)' }}>
                          {parsedDetails ? (
                            <code style={{ background: 'var(--sa-bg-canvas)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--sa-card-border)' }}>
                              {typeof parsedDetails === 'object' ? JSON.stringify(parsedDetails) : String(parsedDetails)}
                            </code>
                          ) : (
                            <span style={{ color: 'var(--sa-text-subtle)' }}>No extra payload</span>
                          )}
                        </div>
                      </td>

                      {/* IP */}
                      <td>
                        <span style={{ fontSize: '11.5px', color: 'var(--sa-text-muted)', fontFamily: 'Space Grotesk, monospace' }}>
                          {log.ip_address || '127.0.0.1'}
                        </span>
                      </td>

                      {/* Inspect button */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="sa-icon-btn"
                          title="Inspect raw audit record"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ──── PAYLOAD INSPECTION MODAL ──── */}
      {selectedLog && (
        <div className="sa-modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="sa-modal sa-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <div>
                <h3 className="sa-modal-title">
                  <Terminal size={18} style={{ color: 'var(--sa-mint)' }} />
                  Audit Record Deep Inspection
                </h3>
                <p className="sa-modal-subtitle">
                  Event ID #{selectedLog.id} • {selectedLog.action}
                </p>
              </div>
              <button type="button" className="sa-modal-close" onClick={() => setSelectedLog(null)}>
                ✕
              </button>
            </div>

            <div className="sa-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--sa-bg-canvas)', padding: '12px 14px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--sa-text-subtle)', fontWeight: 700, textTransform: 'uppercase' }}>Timestamp</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sa-forest)', marginTop: '2px' }}>
                    {selectedLog.created_at ? formatIST(selectedLog.created_at, 'dateTime') : '—'}
                  </div>
                </div>
                <div style={{ background: 'var(--sa-bg-canvas)', padding: '12px 14px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--sa-text-subtle)', fontWeight: 700, textTransform: 'uppercase' }}>Actor Identity</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sa-forest)', marginTop: '2px' }}>
                    {selectedLog.user_name || selectedLog.actor || 'Super Admin'}
                  </div>
                </div>
                <div style={{ background: 'var(--sa-bg-canvas)', padding: '12px 14px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--sa-text-subtle)', fontWeight: 700, textTransform: 'uppercase' }}>IP Address</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sa-forest)', marginTop: '2px', fontFamily: 'monospace' }}>
                    {selectedLog.ip_address || '127.0.0.1'}
                  </div>
                </div>
              </div>

              <div className="sa-form-group">
                <label className="sa-form-label">Full Record Payload (JSON)</label>
                <pre style={{
                  background: 'var(--sa-forest-dark)',
                  color: '#34d399',
                  padding: '16px',
                  borderRadius: '14px',
                  fontFamily: 'monospace',
                  fontSize: '12.5px',
                  maxHeight: '320px',
                  overflowY: 'auto',
                  margin: 0,
                  lineHeight: 1.5,
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            </div>

            <div className="sa-modal-footer">
              <button
                type="button"
                className="sa-btn-primary"
                onClick={() => setSelectedLog(null)}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
