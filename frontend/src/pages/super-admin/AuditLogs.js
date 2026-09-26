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
      setLogs(res.data.logs || []);
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
    if (action.includes('ONBOARD') || action.includes('ACTIVATED')) return 'sa-badge-active';
    if (action.includes('DELETED') || action.includes('SUSPENDED')) return 'sa-badge-suspended';
    if (action.includes('PAYMENT') || action.includes('SUBSCRIPTION')) return 'sa-plan-standard';
    return 'sa-plan-basic';
  };

  return (
    <>
      {/* ──── PAGE HEADER ──── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.55rem', fontWeight: 800, color: 'var(--sa-text)', margin: '0 0 4px' }}>
            System Audit &amp; Compliance Logs
          </h1>
          <p style={{ color: 'var(--sa-text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Immutable security event stream of administrative actions, tenancy modifications, and billing overrides.
          </p>
        </div>

        <button
          type="button"
          className="sa-action-btn sa-btn-secondary"
          onClick={fetchLogs}
          disabled={loading}
          title="Reload audit logs"
        >
          <RefreshCw size={14} className={loading ? 'sa-pulse-bullet' : ''} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* ──── FILTER PILLS ──── */}
      <div className="sa-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--sa-text-muted)', textTransform: 'uppercase', marginRight: '6px' }}>
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
              className={`sa-filter-pill ${actionFilter === pill.id ? 'active' : ''}`}
              onClick={() => setActionFilter(pill.id)}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* ──── LOGS TABLE ──── */}
      <div className="sa-card" style={{ padding: '0' }}>
        <div className="sa-table-wrapper">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Security Action</th>
                <th>Target Resource</th>
                <th>Details / Payload</th>
                <th>Origin / IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                    Streaming audit log records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                    No audit records registered for the current filter.
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
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: '#64748b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={12} />
                          <span>{log.created_at ? formatIST(log.created_at, 'dateTime') : '—'}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td>
                        <span className={`sa-badge ${getActionBadgeClass(log.action)}`}>
                          {log.action}
                        </span>
                      </td>

                      {/* Resource */}
                      <td>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--sa-text)' }}>
                          {log.resource_type ? log.resource_type.toUpperCase() : 'SYSTEM'}
                          {log.resource_id && (
                            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', fontFamily: 'monospace' }}>
                              {log.resource_id.substring(0, 14)}...
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Details */}
                      <td>
                        <div style={{ maxWidth: '380px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem', color: '#334155' }}>
                          {parsedDetails ? (
                            <code>{JSON.stringify(parsedDetails)}</code>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>No extra payload</span>
                          )}
                        </div>
                      </td>

                      {/* IP */}
                      <td>
                        <span style={{ fontSize: '0.76rem', color: '#64748b', fontFamily: 'monospace' }}>
                          {log.ip_address || '127.0.0.1'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
