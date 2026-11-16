import React, { useEffect, useState } from 'react';
import {
  Sliders,
  Shield,
  AlertTriangle,
  Save,
  CheckCircle2,
  RefreshCw,
  Server,
  Cpu,
  Lock,
  Eye,
  Bell,
  Sparkles,
  Zap,
  Database,
  Radio,
  Check,
} from 'lucide-react';
import { superAdminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './SuperAdmin.css';

export default function PlatformSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    maintenance_mode: false,
    allow_college_self_registration: true,
    ai_proctoring_strictness: 'medium',
    face_detection_threshold: 85,
    tab_switch_limit: 3,
    default_trial_days: 14,
    system_notice: 'Nexify Examina cluster operating normally across all availability zones.',
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await superAdminAPI.getSettings();
      const s = res?.settings || res?.data?.settings;
      if (s) {
        setSettings(s);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await superAdminAPI.updateSettings(settings);
      toast.success(res?.message || res?.data?.message || 'Platform governance settings updated!');
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sa-page-shell">
      {/* ──── PAGE HEADER ──── */}
      <div className="sa-page-header">
        <div className="sa-page-title-stack">
          <h1 className="sa-page-title">Platform Governance &amp; Global Configuration</h1>
          <p className="sa-page-subtitle">
            Master control parameters for AI proctoring neural guardrails, multi-tenant onboarding policies, cluster maintenance, and emergency locks.
          </p>
        </div>

        <div className="sa-page-actions">
          <button
            type="button"
            className="sa-btn-secondary"
            onClick={fetchSettings}
            disabled={loading || saving}
            title="Reload settings from database"
          >
            <RefreshCw size={14} className={loading ? 'sa-spin' : ''} />
            <span>Reload</span>
          </button>

          <button
            type="button"
            className="sa-coral-pill-btn"
            onClick={handleSave}
            disabled={saving}
            id="sa-save-settings-btn"
          >
            <Save size={15} />
            <span>{saving ? 'Applying...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {/* ──── EMERGENCY BANNER IF ACTIVE ──── */}
      {settings.maintenance_mode && (
        <div className="sa-pending-alert-card" style={{ background: '#fef2f2', borderColor: '#fca5a5' }}>
          <div className="sa-pending-alert-left">
            <div className="sa-pending-icon-ring" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="sa-pending-alert-title" style={{ color: '#991b1b' }}>
                EMERGENCY MAINTENANCE LOCK ACTIVE
              </h3>
              <p className="sa-pending-alert-desc" style={{ color: '#b91c1c' }}>
                All non-admin tenant logins, student exam rooms, and public candidate sessions are currently paused platform-wide.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="sa-btn-success"
            onClick={() => setSettings({ ...settings, maintenance_mode: false })}
          >
            Disable Lock
          </button>
        </div>
      )}

      {/* ──── SETTINGS BENTO GRID ──── */}
      <form onSubmit={handleSave}>
        <div className="sa-settings-grid">
          {/* Card 1: Multi-Tenant Access & Policies */}
          <div className="sa-setting-card">
            <div className="sa-setting-card-header">
              <div className="sa-setting-icon-box sa-kpi-icon-forest">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="sa-setting-title">Access &amp; Onboarding Policies</h3>
                <p className="sa-setting-desc">Self-registration and platform-wide tenancy gatekeepers</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Maintenance Toggle */}
              <div className="sa-toggle-switch-row">
                <div>
                  <h4 className="sa-toggle-info-title">Platform Maintenance Lock</h4>
                  <p className="sa-toggle-info-sub">Restrict access exclusively to Super Administrators</p>
                </div>
                <input
                  type="checkbox"
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--sa-forest)' }}
                  checked={settings.maintenance_mode}
                  onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                />
              </div>

              {/* Self-Registration Toggle */}
              <div className="sa-toggle-switch-row">
                <div>
                  <h4 className="sa-toggle-info-title">University Self-Registration</h4>
                  <p className="sa-toggle-info-sub">Allow institutions to register through the public landing page</p>
                </div>
                <input
                  type="checkbox"
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--sa-mint)' }}
                  checked={settings.allow_college_self_registration}
                  onChange={(e) => setSettings({ ...settings, allow_college_self_registration: e.target.checked })}
                />
              </div>

              {/* Default Trial Days */}
              <div className="sa-form-group">
                <label className="sa-form-label">Default Free Trial Grace Period (Days)</label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  className="sa-form-input"
                  value={settings.default_trial_days}
                  onChange={(e) => setSettings({ ...settings, default_trial_days: parseInt(e.target.value, 10) || 0 })}
                />
                <span style={{ fontSize: '11.5px', color: 'var(--sa-text-subtle)' }}>
                  Number of days newly approved universities receive before requiring an active plan subscription.
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: AI Proctoring & Anti-Cheat Engine Defaults */}
          <div className="sa-setting-card">
            <div className="sa-setting-card-header">
              <div className="sa-setting-icon-box sa-kpi-icon-mint">
                <Cpu size={18} />
              </div>
              <div>
                <h3 className="sa-setting-title">Proctoring &amp; AI Security Guardrails</h3>
                <p className="sa-setting-desc">Global neural biometric thresholds and exam kiosk policies</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* AI Strictness */}
              <div className="sa-form-group">
                <label className="sa-form-label">Global AI Strictness Level</label>
                <select
                  className="sa-form-select"
                  value={settings.ai_proctoring_strictness}
                  onChange={(e) => setSettings({ ...settings, ai_proctoring_strictness: e.target.value })}
                >
                  <option value="lenient">Lenient (High tolerance for environmental glare/lighting)</option>
                  <option value="medium">Balanced / Recommended (Real-time 1080p biometric mesh)</option>
                  <option value="strict">Strict / Enterprise Defense (Zero tolerance, instant flagged dossier)</option>
                </select>
              </div>

              {/* Face Detection Confidence */}
              <div className="sa-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="sa-form-label">Face Verification Confidence Threshold</label>
                  <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--sa-forest)', fontFamily: 'Space Grotesk' }}>
                    {settings.face_detection_threshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="99"
                  style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--sa-mint)' }}
                  value={settings.face_detection_threshold}
                  onChange={(e) => setSettings({ ...settings, face_detection_threshold: parseInt(e.target.value, 10) })}
                />
                <span style={{ fontSize: '11.5px', color: 'var(--sa-text-subtle)' }}>
                  Biometric matching confidence required to certify candidate identity during exams.
                </span>
              </div>

              {/* Tab Switch Limit */}
              <div className="sa-form-group">
                <label className="sa-form-label">Max Allowed Tab Switches Before Auto-Termination</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="sa-form-input"
                  value={settings.tab_switch_limit}
                  onChange={(e) => setSettings({ ...settings, tab_switch_limit: parseInt(e.target.value, 10) || 1 })}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Global System Announcement Banner (Full Width) */}
          <div className="sa-setting-card span-2">
            <div className="sa-setting-card-header">
              <div className="sa-setting-icon-box sa-kpi-icon-amber">
                <Bell size={18} />
              </div>
              <div>
                <h3 className="sa-setting-title">System-Wide Operational Broadcast</h3>
                <p className="sa-setting-desc">Publish real-time announcements displayed across institutional command centers</p>
              </div>
            </div>

            <div className="sa-form-group">
              <label className="sa-form-label">Active Broadcast Notice</label>
              <input
                type="text"
                className="sa-form-input"
                placeholder="e.g. Scheduled cloud maintenance this Sunday between 02:00 - 04:00 UTC"
                value={settings.system_notice}
                onChange={(e) => setSettings({ ...settings, system_notice: e.target.value })}
              />
              <span style={{ fontSize: '11.5px', color: 'var(--sa-text-subtle)' }}>
                This notice appears prominently as a dismissal banner across all College Admin dashboards and candidate portals.
              </span>
            </div>
          </div>

          {/* Card 4: Infrastructure & High-Availability Mesh Health */}
          <div className="sa-setting-card span-2">
            <div className="sa-setting-card-header">
              <div className="sa-setting-icon-box sa-kpi-icon-forest">
                <Server size={18} />
              </div>
              <div>
                <h3 className="sa-setting-title">Cluster Mesh Infrastructure Telemetry</h3>
                <p className="sa-setting-desc">High-availability microservice backend instances and database replication</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
              {[1, 2, 3, 4, 5, 6].map((node) => (
                <div
                  key={node}
                  style={{
                    background: 'var(--sa-bg-canvas)',
                    border: '1px solid var(--sa-card-border)',
                    borderRadius: '14px',
                    padding: '14px 12px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span className="sa-pulse-radar" style={{ width: '8px', height: '8px' }} />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--sa-forest)', fontFamily: 'Space Grotesk' }}>
                    Node #{node}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--sa-mint-text)', fontWeight: 700, background: 'var(--sa-mint-soft)', padding: '2px 6px', borderRadius: '99px' }}>
                    ONLINE
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--sa-text-subtle)', fontFamily: 'monospace' }}>
                    172.16.1.{node + 1}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--sa-bg-canvas)', borderRadius: '12px', border: '1px solid var(--sa-card-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Database size={16} style={{ color: 'var(--sa-mint)' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--sa-forest)' }}>
                  Neon Lakebase PostgreSQL Connection Pool: Active &amp; Autoscaled
                </span>
              </div>
              <span className="sa-badge sa-badge-active">
                ZERO DISPUTES
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
