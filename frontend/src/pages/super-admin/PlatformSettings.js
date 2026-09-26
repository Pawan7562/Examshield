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
    system_notice: 'ExamShield cluster operating normally across all availability zones.',
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await superAdminAPI.getSettings();
      if (res.data?.settings) {
        setSettings(res.data.settings);
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
    e.preventDefault();
    setSaving(true);
    try {
      const res = await superAdminAPI.updateSettings(settings);
      toast.success(res.data?.message || 'Platform governance settings updated!');
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* ──── PAGE HEADER ──── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.55rem', fontWeight: 800, color: 'var(--sa-text)', margin: '0 0 4px' }}>
            Platform Governance &amp; Global Configuration
          </h1>
          <p style={{ color: 'var(--sa-text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Master control parameters for AI Proctoring policies, tenant onboarding rules, and platform maintenance.
          </p>
        </div>

        <button
          type="button"
          className="sa-action-btn sa-btn-secondary"
          onClick={fetchSettings}
          disabled={loading || saving}
        >
          <RefreshCw size={14} className={loading ? 'sa-pulse-bullet' : ''} />
          <span>Reload Config</span>
        </button>
      </div>

      {settings.maintenance_mode && (
        <div style={{ background: 'var(--sa-rose-light)', border: '1px solid #fca5a5', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--sa-rose)' }}>
          <AlertTriangle size={22} />
          <div>
            <div style={{ fontWeight: 800 }}>EMERGENCY MAINTENANCE MODE ACTIVE</div>
            <div style={{ fontSize: '0.84rem' }}>All non-admin tenant logins and new exam starts are temporarily paused.</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          {/* Card 1: Multi-Tenant Access Control */}
          <div className="sa-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--sa-border)', paddingBottom: '12px' }}>
              <Lock size={18} style={{ color: 'var(--sa-primary)' }} />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--sa-text)' }}>
                Access &amp; Onboarding Policies
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Maintenance Mode Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--sa-border)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--sa-text)' }}>Platform Maintenance Lock</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Restrict access exclusively to Super Administrators.</div>
                </div>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  checked={settings.maintenance_mode}
                  onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                />
              </div>

              {/* Self-Registration Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--sa-border)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--sa-text)' }}>University Self-Registration</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Allow institutions to sign up via public landing page.</div>
                </div>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  checked={settings.allow_college_self_registration}
                  onChange={(e) => setSettings({ ...settings, allow_college_self_registration: e.target.checked })}
                />
              </div>

              {/* Default Trial Days */}
              <div className="sa-form-group">
                <label className="sa-form-label">Default Trial Grace Period (Days)</label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  className="sa-form-input"
                  value={settings.default_trial_days}
                  onChange={(e) => setSettings({ ...settings, default_trial_days: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>
          </div>

          {/* Card 2: AI Proctoring & Anti-Cheat Engine Defaults */}
          <div className="sa-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--sa-border)', paddingBottom: '12px' }}>
              <Cpu size={18} style={{ color: 'var(--sa-emerald)' }} />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--sa-text)' }}>
                Proctoring &amp; AI Security Guardrails
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* AI Strictness */}
              <div className="sa-form-group">
                <label className="sa-form-label">Global AI Strictness Level</label>
                <select
                  className="sa-form-select"
                  value={settings.ai_proctoring_strictness}
                  onChange={(e) => setSettings({ ...settings, ai_proctoring_strictness: e.target.value })}
                >
                  <option value="lenient">Lenient (High tolerance for environmental noise)</option>
                  <option value="medium">Balanced / Recommended (Real-time 1080p face mesh)</option>
                  <option value="strict">Strict / Military (Zero tolerance, instant flag)</option>
                </select>
              </div>

              {/* Face Detection Confidence */}
              <div className="sa-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="sa-form-label">Face Verification Confidence Threshold</label>
                  <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--sa-primary)' }}>
                    {settings.face_detection_threshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="99"
                  style={{ width: '100%', cursor: 'pointer' }}
                  value={settings.face_detection_threshold}
                  onChange={(e) => setSettings({ ...settings, face_detection_threshold: parseInt(e.target.value, 10) })}
                />
              </div>

              {/* Tab Switch Limit */}
              <div className="sa-form-group">
                <label className="sa-form-label">Max Allowed Tab Switches Before Auto-Submit</label>
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
          <div className="sa-card" style={{ gridColumn: 'span 2', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Bell size={18} style={{ color: 'var(--sa-amber)' }} />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--sa-text)' }}>
                System-Wide Operational Broadcast
              </h2>
            </div>
            <div className="sa-form-group">
              <label className="sa-form-label">Active Notification Banner for All Tenancy Dashboards</label>
              <input
                type="text"
                className="sa-form-input"
                placeholder="e.g. Scheduled cloud maintenance this Sunday between 02:00 - 04:00 UTC"
                value={settings.system_notice}
                onChange={(e) => setSettings({ ...settings, system_notice: e.target.value })}
              />
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="sa-action-btn sa-btn-primary"
                disabled={saving}
                id="sa-save-settings-btn"
              >
                <Save size={15} />
                <span>{saving ? 'Applying Policies...' : 'Save & Propagate Configuration'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
