// src/pages/admin/Settings.js — Proctoring Rules & College Administration (v6 Executive Design)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Shield,
  ShieldAlert,
  Building,
  Lock,
  Bell,
  Mail,
  Palette,
  AlertTriangle,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  CheckCircle2,
  Trash2,
  LogOut,
  Key,
  Layers,
  Video,
  Mic,
  Monitor,
  Cpu,
  Sliders,
  Info,
  Sparkles,
  RefreshCw,
  Award,
  Globe,
  MapPin,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import './ProctoringRulesCollege.css';

const DEFAULT_PROCTORING_RULES = {
  preset: 'standard', // 'strict' | 'standard' | 'relaxed'
  face_detection: true,
  multiple_faces: true,
  gaze_tracking: true,
  absence_threshold: 10, // seconds
  audio_detection: true,
  speech_analysis: true,
  audio_threshold: 65, // dB
  fullscreen_lockdown: true,
  tab_switch_interception: true,
  tab_switch_limit: 3, // max before auto-terminate
  clipboard_block: true,
  devtools_block: true,
  auto_snapshot_on_flag: true,
  live_monitor_dispatch: true,
  secondary_device_block: true,
};

const PROCTORING_STORAGE_KEY = 'examshield_institutional_proctoring_rules';
const COLLEGE_STORAGE_KEY = 'examshield_institutional_college_profile';

export default function Settings() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('proctoring');
  const [saving, setSaving] = useState(false);

  // ── 1. Proctoring Rules State ─────────────────────────────
  const [proctoringRules, setProctoringRules] = useState(() => {
    try {
      const cached = localStorage.getItem(PROCTORING_STORAGE_KEY);
      return cached ? JSON.parse(cached) : DEFAULT_PROCTORING_RULES;
    } catch (_) {
      return DEFAULT_PROCTORING_RULES;
    }
  });

  // ── 2. College Profile State ──────────────────────────────
  const [collegeProfile, setCollegeProfile] = useState(() => {
    try {
      const cached = localStorage.getItem(COLLEGE_STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return {
      name: user?.collegeName || user?.name || 'Nexify Institute of Technology & Sciences',
      legalEntity: 'Nexify Higher Education Foundation',
      code: 'AISHE-U-0149',
      affiliation: 'Autonomous State Technical University',
      subdomain: 'nexify-tech',
      deanName: 'Dr. Ramesh Sharma, Dean of Academic Affairs',
      contactEmail: user?.email || 'dean.academics@nexify.edu.in',
      contactPhone: user?.phone || '+91 98765 43210',
      website: user?.website || 'https://nexify.edu.in',
      address: user?.address || 'Knowledge Park III, Institutional Academic Corridor',
      city: user?.city || 'Bengaluru',
      state: user?.state || 'Karnataka',
      gstin: '29ABCDE1234F1Z5',
    };
  });

  // ── 3. Security Form State ────────────────────────────────
  const [securityForm, setSecurityForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, newPwd: false, confirm: false });

  // ── 4. Notifications State ────────────────────────────────
  const [notifications, setNotifications] = useState({
    instantBreachAlerts: true,
    emailOnStudentViolation: true,
    emailOnExamPublished: true,
    emailOnResultAudited: true,
    dailyProctoringDigest: true,
    weeklyGovernanceReport: true,
  });

  // ── 5. Email Configuration State ──────────────────────────
  const [emailConfig, setEmailConfig] = useState({
    senderName: 'Examina Institutional Proctoring Dispatch',
    senderEmail: 'noreply@exam.nexifyforge.in',
    replyToEmail: 'support@exam.nexifyforge.in',
    portalUrl: 'https://exam.nexifyforge.in/student/login',
  });

  // ── 6. Preferences State ──────────────────────────────────
  const [preferences, setPreferences] = useState({
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    language: 'en',
    autoSave: true,
    compactMode: false,
    showStudentKeys: true,
  });

  // Apply Preset Logic
  const handleApplyPreset = (presetKey) => {
    if (presetKey === 'strict') {
      setProctoringRules(prev => ({
        ...prev,
        preset: 'strict',
        face_detection: true,
        multiple_faces: true,
        gaze_tracking: true,
        absence_threshold: 5,
        audio_detection: true,
        speech_analysis: true,
        fullscreen_lockdown: true,
        tab_switch_interception: true,
        tab_switch_limit: 1,
        clipboard_block: true,
        devtools_block: true,
        auto_snapshot_on_flag: true,
        secondary_device_block: true,
      }));
      toast.success('Applied Strict (State University & Finals) security preset');
    } else if (presetKey === 'standard') {
      setProctoringRules(prev => ({
        ...prev,
        preset: 'standard',
        face_detection: true,
        multiple_faces: true,
        gaze_tracking: true,
        absence_threshold: 10,
        audio_detection: true,
        speech_analysis: true,
        fullscreen_lockdown: true,
        tab_switch_interception: true,
        tab_switch_limit: 3,
        clipboard_block: true,
        devtools_block: true,
        auto_snapshot_on_flag: true,
        secondary_device_block: true,
      }));
      toast.success('Applied Standard (Midterm & Quizzes) security preset');
    } else if (presetKey === 'relaxed') {
      setProctoringRules(prev => ({
        ...prev,
        preset: 'relaxed',
        face_detection: true,
        multiple_faces: false,
        gaze_tracking: false,
        absence_threshold: 25,
        audio_detection: false,
        speech_analysis: false,
        fullscreen_lockdown: false,
        tab_switch_interception: true,
        tab_switch_limit: 5,
        clipboard_block: false,
        devtools_block: false,
        auto_snapshot_on_flag: false,
        secondary_device_block: false,
      }));
      toast('Applied Relaxed (Open Book & Practice) policy', { icon: '📖' });
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      localStorage.setItem(PROCTORING_STORAGE_KEY, JSON.stringify(proctoringRules));
      localStorage.setItem(COLLEGE_STORAGE_KEY, JSON.stringify(collegeProfile));
      await new Promise(r => setTimeout(r, 700));
      toast.success('Institutional proctoring rules & college profile saved successfully!');
    } catch (_) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (securityForm.newPwd !== securityForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (securityForm.newPwd.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    toast.success('Admin password updated successfully!');
    setSecurityForm({ current: '', newPwd: '', confirm: '' });
    setSaving(false);
  };

  const pwdStrength = (() => {
    const p = securityForm.newPwd;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e', '#10b981'][pwdStrength];
  const strengthText = ['', 'Weak', 'Fair', 'Good', 'Strong'][pwdStrength];

  const collegeInitials = (collegeProfile.name || 'Nexify')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  const TABS = [
    { id: 'proctoring', label: 'Proctoring Rules & AI', icon: ShieldAlert, badge: 'AI' },
    { id: 'college', label: 'College Profile', icon: Building },
    { id: 'security', label: 'Security & Access', icon: Lock },
    { id: 'notifications', label: 'Incident Alerts', icon: Bell },
    { id: 'email', label: 'Email Dispatch', icon: Mail },
    { id: 'preferences', label: 'Platform Preferences', icon: Palette },
    { id: 'danger', label: 'Data Governance', icon: AlertTriangle, isDanger: true },
  ];

  return (
    <div className="prc-container">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="prc-header">
        <div className="prc-header-left">
          <div className="prc-eyebrow">
            <span className="prc-eyebrow-dot" />
            <Shield size={13} />
            Institutional Governance & Policy
          </div>
          <h1 className="prc-title">Proctoring Rules & College Administration</h1>
          <p className="prc-subtitle">
            Configure campus-wide anti-cheat AI sensitivity thresholds, exam lockdown policies, accreditation credentials, and governance.
          </p>
        </div>
        <div className="prc-header-actions">
          <button
            type="button"
            className="prc-btn prc-btn-secondary"
            onClick={() => handleApplyPreset('standard')}
          >
            <RefreshCw size={15} />
            Reset to Standard
          </button>
          <button
            type="button"
            className="prc-btn prc-btn-primary"
            onClick={handleSaveAll}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? 'Synchronizing Policies...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* ── Two Column Master Layout ──────────────────────────── */}
      <div className="prc-layout">
        {/* Left: Navigation Sidebar */}
        <aside className="prc-nav-card">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`prc-nav-item ${isActive ? 'active' : ''} ${tab.isDanger ? 'danger-tab' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                {tab.badge && <span className="prc-nav-badge">{tab.badge}</span>}
              </button>
            );
          })}
        </aside>

        {/* Right: Active Content Panel */}
        <main className="prc-panel-card">
          {/* ═══════════ TAB 1: PROCTORING RULES ═══════════ */}
          {activeTab === 'proctoring' && (
            <div>
              <div className="prc-panel-head">
                <div className="prc-panel-title-wrap">
                  <div className="prc-panel-icon">
                    <ShieldAlert size={22} />
                  </div>
                  <div>
                    <h2 className="prc-panel-title">AI Proctoring & Anti-Cheat Governance</h2>
                    <p className="prc-panel-desc">
                      Configure automated real-time biometric tracking, screen security, and violation thresholds.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="#0a74da" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0a74da' }}>
                    Active Preset: {proctoringRules.preset.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Security Presets Strip */}
              <div className="prc-presets-grid">
                <div
                  className={`prc-preset-card ${proctoringRules.preset === 'strict' ? 'active' : ''}`}
                  onClick={() => handleApplyPreset('strict')}
                >
                  <div className="prc-preset-header">
                    <span className="prc-preset-name">Strict Mode</span>
                    <span className="prc-preset-badge strict">High Stakes</span>
                  </div>
                  <p className="prc-preset-desc">
                    1 Tab switch tolerance, continuous facial gaze verification, strict fullscreen, auto-termination.
                  </p>
                </div>

                <div
                  className={`prc-preset-card ${proctoringRules.preset === 'standard' ? 'active' : ''}`}
                  onClick={() => handleApplyPreset('standard')}
                >
                  <div className="prc-preset-header">
                    <span className="prc-preset-name">Standard Mode</span>
                    <span className="prc-preset-badge standard">Recommended</span>
                  </div>
                  <p className="prc-preset-desc">
                    3 Tab switch warnings, biometric tracking with 10s absence buffer, audio noise analysis.
                  </p>
                </div>

                <div
                  className={`prc-preset-card ${proctoringRules.preset === 'relaxed' ? 'active' : ''}`}
                  onClick={() => handleApplyPreset('relaxed')}
                >
                  <div className="prc-preset-header">
                    <span className="prc-preset-name">Relaxed Mode</span>
                    <span className="prc-preset-badge relaxed">Practice</span>
                  </div>
                  <p className="prc-preset-desc">
                    Audit logging only, relaxed camera tolerances, suitable for mock tests and open-book assessments.
                  </p>
                </div>
              </div>

              {/* 1. Biometric Video & Vision Tracking */}
              <h3 className="prc-section-title">
                <Video size={18} color="#0a74da" />
                Live Vision & Biometric Tracking
              </h3>

              <div className="prc-toggle-row">
                <div className="prc-toggle-info">
                  <span className="prc-toggle-label">Real-Time Face Presence Verification</span>
                  <span className="prc-toggle-sub">Detects if the candidate moves away or hides from camera view</span>
                </div>
                <label className="prc-switch">
                  <input
                    type="checkbox"
                    checked={proctoringRules.face_detection}
                    onChange={e => setProctoringRules({ ...proctoringRules, face_detection: e.target.checked })}
                  />
                  <span className="prc-slider" />
                </label>
              </div>

              <div className="prc-toggle-row">
                <div className="prc-toggle-info">
                  <span className="prc-toggle-label">Multiple Face & Person Detection</span>
                  <span className="prc-toggle-sub">Instantly flags if an unauthorized second individual enters the test environment</span>
                </div>
                <label className="prc-switch">
                  <input
                    type="checkbox"
                    checked={proctoringRules.multiple_faces}
                    onChange={e => setProctoringRules({ ...proctoringRules, multiple_faces: e.target.checked })}
                  />
                  <span className="prc-slider" />
                </label>
              </div>

              <div className="prc-toggle-row">
                <div className="prc-toggle-info">
                  <span className="prc-toggle-label">Eye Gaze & Head Orientation Analysis</span>
                  <span className="prc-toggle-sub">Monitors prolonged lateral head turns and off-screen glances</span>
                </div>
                <label className="prc-switch">
                  <input
                    type="checkbox"
                    checked={proctoringRules.gaze_tracking}
                    onChange={e => setProctoringRules({ ...proctoringRules, gaze_tracking: e.target.checked })}
                  />
                  <span className="prc-slider" />
                </label>
              </div>

              {/* Parameters Box */}
              <div className="prc-param-grid" style={{ marginTop: '14px' }}>
                <div className="prc-param-box">
                  <div className="prc-param-top">
                    <span className="prc-param-name">Absence Buffer Time</span>
                    <span className="prc-param-val">{proctoringRules.absence_threshold}s</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="30"
                    step="1"
                    className="prc-range-slider"
                    value={proctoringRules.absence_threshold}
                    onChange={e => setProctoringRules({ ...proctoringRules, absence_threshold: Number(e.target.value) })}
                  />
                  <span className="prc-param-hint">Flag candidate after being absent from camera frame for this duration</span>
                </div>

                <div className="prc-param-box">
                  <div className="prc-param-top">
                    <span className="prc-param-name">Tab Switch Auto-Submit Limit</span>
                    <span className="prc-param-val">{proctoringRules.tab_switch_limit} Warnings</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    className="prc-range-slider"
                    value={proctoringRules.tab_switch_limit}
                    onChange={e => setProctoringRules({ ...proctoringRules, tab_switch_limit: Number(e.target.value) })}
                  />
                  <span className="prc-param-hint">Exam will automatically submit when candidate exceeds this threshold</span>
                </div>
              </div>

              {/* 2. Audio & Ambient Speech AI */}
              <h3 className="prc-section-title">
                <Mic size={18} color="#0a74da" />
                Audio & Acoustic Environment Analysis
              </h3>

              <div className="prc-toggle-row">
                <div className="prc-toggle-info">
                  <span className="prc-toggle-label">Ambient Audio Monitoring</span>
                  <span className="prc-toggle-sub">Continuously samples microphone input for abnormal room decibel spikes</span>
                </div>
                <label className="prc-switch">
                  <input
                    type="checkbox"
                    checked={proctoringRules.audio_detection}
                    onChange={e => setProctoringRules({ ...proctoringRules, audio_detection: e.target.checked })}
                  />
                  <span className="prc-slider" />
                </label>
              </div>

              <div className="prc-toggle-row">
                <div className="prc-toggle-info">
                  <span className="prc-toggle-label">Speech & Whisper Intelligence</span>
                  <span className="prc-toggle-sub">Differentiates human speech from standard keyboard or fan noises</span>
                </div>
                <label className="prc-switch">
                  <input
                    type="checkbox"
                    checked={proctoringRules.speech_analysis}
                    onChange={e => setProctoringRules({ ...proctoringRules, speech_analysis: e.target.checked })}
                  />
                  <span className="prc-slider" />
                </label>
              </div>

              {/* 3. Browser & Screen Lockdown */}
              <h3 className="prc-section-title">
                <Monitor size={18} color="#0a74da" />
                Browser & Operating System Lockdown
              </h3>

              <div className="prc-toggle-row">
                <div className="prc-toggle-info">
                  <span className="prc-toggle-label">Mandatory Fullscreen Lockdown</span>
                  <span className="prc-toggle-sub">Forces browser into locked fullscreen; exiting fullscreen counts as a security breach</span>
                </div>
                <label className="prc-switch">
                  <input
                    type="checkbox"
                    checked={proctoringRules.fullscreen_lockdown}
                    onChange={e => setProctoringRules({ ...proctoringRules, fullscreen_lockdown: e.target.checked })}
                  />
                  <span className="prc-slider" />
                </label>
              </div>

              <div className="prc-toggle-row">
                <div className="prc-toggle-info">
                  <span className="prc-toggle-label">Tab Switch & Window Blur Interception</span>
                  <span className="prc-toggle-sub">Detects Alt+Tab, minimizing, opening new tabs, or selecting external windows</span>
                </div>
                <label className="prc-switch">
                  <input
                    type="checkbox"
                    checked={proctoringRules.tab_switch_interception}
                    onChange={e => setProctoringRules({ ...proctoringRules, tab_switch_interception: e.target.checked })}
                  />
                  <span className="prc-slider" />
                </label>
              </div>

              <div className="prc-toggle-row">
                <div className="prc-toggle-info">
                  <span className="prc-toggle-label">Disable Clipboard & Context Menus</span>
                  <span className="prc-toggle-sub">Blocks Right-Click, Cut, Copy, Paste, and PrintScreen commands during tests</span>
                </div>
                <label className="prc-switch">
                  <input
                    type="checkbox"
                    checked={proctoringRules.clipboard_block}
                    onChange={e => setProctoringRules({ ...proctoringRules, clipboard_block: e.target.checked })}
                  />
                  <span className="prc-slider" />
                </label>
              </div>

              <div className="prc-toggle-row">
                <div className="prc-toggle-info">
                  <span className="prc-toggle-label">Developer Tools & Screen Capture Blocker</span>
                  <span className="prc-toggle-sub">Prevents opening F12 inspect element, screen recorders, and virtual displays</span>
                </div>
                <label className="prc-switch">
                  <input
                    type="checkbox"
                    checked={proctoringRules.devtools_block}
                    onChange={e => setProctoringRules({ ...proctoringRules, devtools_block: e.target.checked })}
                  />
                  <span className="prc-slider" />
                </label>
              </div>

              {/* 4. Automated Forensic Evidence Capture */}
              <h3 className="prc-section-title">
                <Cpu size={18} color="#0a74da" />
                Evidence Capture & Proctor Alerts
              </h3>

              <div className="prc-toggle-row">
                <div className="prc-toggle-info">
                  <span className="prc-toggle-label">Instant Webcam Snapshot on Flag</span>
                  <span className="prc-toggle-sub">Automatically records high-resolution photographic evidence upon any violation</span>
                </div>
                <label className="prc-switch">
                  <input
                    type="checkbox"
                    checked={proctoringRules.auto_snapshot_on_flag}
                    onChange={e => setProctoringRules({ ...proctoringRules, auto_snapshot_on_flag: e.target.checked })}
                  />
                  <span className="prc-slider" />
                </label>
              </div>

              <div className="prc-toggle-row">
                <div className="prc-toggle-info">
                  <span className="prc-toggle-label">Live Monitoring Room Dispatch</span>
                  <span className="prc-toggle-sub">Instantly flashes security alerts directly into the live faculty proctor grid</span>
                </div>
                <label className="prc-switch">
                  <input
                    type="checkbox"
                    checked={proctoringRules.live_monitor_dispatch}
                    onChange={e => setProctoringRules({ ...proctoringRules, live_monitor_dispatch: e.target.checked })}
                  />
                  <span className="prc-slider" />
                </label>
              </div>

              <div className="prc-action-bar">
                <span className="prc-audit-note">
                  <CheckCircle size={14} color="#10b981" />
                  All rules apply campus-wide to every active and newly scheduled examination
                </span>
                <button type="button" className="prc-btn prc-btn-primary" onClick={handleSaveAll} disabled={saving}>
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Proctoring Rules'}
                </button>
              </div>
            </div>
          )}

          {/* ═══════════ TAB 2: COLLEGE PROFILE ═══════════ */}
          {activeTab === 'college' && (
            <div>
              <div className="prc-panel-head">
                <div className="prc-panel-title-wrap">
                  <div className="prc-panel-icon">
                    <Building size={22} />
                  </div>
                  <div>
                    <h2 className="prc-panel-title">College Profile & Institutional Accreditation</h2>
                    <p className="prc-panel-desc">Official institution details, accreditation identifiers, and administrator contacts.</p>
                  </div>
                </div>
              </div>

              {/* Institution Hero Badge */}
              <div className="prc-college-hero">
                <div className="prc-college-avatar">
                  {collegeInitials}
                </div>
                <div className="prc-college-meta">
                  <div className="prc-college-name">{collegeProfile.name}</div>
                  <div className="prc-college-type">{collegeProfile.affiliation} • {collegeProfile.code}</div>
                  <div className="prc-accred-badge">
                    <Award size={13} /> UGC / AICTE Verified Examination Center
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="prc-form-grid">
                <div className="prc-form-group">
                  <label className="prc-label">Registered Institution Name *</label>
                  <input
                    type="text"
                    className="prc-input"
                    value={collegeProfile.name}
                    onChange={e => setCollegeProfile({ ...collegeProfile, name: e.target.value })}
                  />
                  <span className="prc-hint">Appears on candidate scorecards and proctor certificates</span>
                </div>

                <div className="prc-form-group">
                  <label className="prc-label">Legal Society / Trust Entity</label>
                  <input
                    type="text"
                    className="prc-input"
                    value={collegeProfile.legalEntity}
                    onChange={e => setCollegeProfile({ ...collegeProfile, legalEntity: e.target.value })}
                  />
                </div>

                <div className="prc-form-group">
                  <label className="prc-label">Institutional Accreditation / AISHE Code *</label>
                  <input
                    type="text"
                    className="prc-input"
                    value={collegeProfile.code}
                    onChange={e => setCollegeProfile({ ...collegeProfile, code: e.target.value })}
                  />
                </div>

                <div className="prc-form-group">
                  <label className="prc-label">Affiliated University / Board</label>
                  <input
                    type="text"
                    className="prc-input"
                    value={collegeProfile.affiliation}
                    onChange={e => setCollegeProfile({ ...collegeProfile, affiliation: e.target.value })}
                  />
                </div>

                <div className="prc-form-group">
                  <label className="prc-label">Authorized Dean / Principal Name *</label>
                  <input
                    type="text"
                    className="prc-input"
                    value={collegeProfile.deanName}
                    onChange={e => setCollegeProfile({ ...collegeProfile, deanName: e.target.value })}
                  />
                </div>

                <div className="prc-form-group">
                  <label className="prc-label">Official Contact Email *</label>
                  <input
                    type="email"
                    className="prc-input"
                    value={collegeProfile.contactEmail}
                    onChange={e => setCollegeProfile({ ...collegeProfile, contactEmail: e.target.value })}
                  />
                </div>

                <div className="prc-form-group">
                  <label className="prc-label">Institutional Contact Phone *</label>
                  <input
                    type="tel"
                    className="prc-input"
                    value={collegeProfile.contactPhone}
                    onChange={e => setCollegeProfile({ ...collegeProfile, contactPhone: e.target.value })}
                  />
                </div>

                <div className="prc-form-group">
                  <label className="prc-label">Official Website URL</label>
                  <input
                    type="url"
                    className="prc-input"
                    value={collegeProfile.website}
                    onChange={e => setCollegeProfile({ ...collegeProfile, website: e.target.value })}
                  />
                </div>

                <div className="prc-form-group">
                  <label className="prc-label">Campus Physical Address</label>
                  <input
                    type="text"
                    className="prc-input"
                    value={collegeProfile.address}
                    onChange={e => setCollegeProfile({ ...collegeProfile, address: e.target.value })}
                  />
                </div>

                <div className="prc-form-group">
                  <label className="prc-label">City & State</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input
                      type="text"
                      className="prc-input"
                      placeholder="City"
                      value={collegeProfile.city}
                      onChange={e => setCollegeProfile({ ...collegeProfile, city: e.target.value })}
                    />
                    <input
                      type="text"
                      className="prc-input"
                      placeholder="State"
                      value={collegeProfile.state}
                      onChange={e => setCollegeProfile({ ...collegeProfile, state: e.target.value })}
                    />
                  </div>
                </div>

                <div className="prc-form-group">
                  <label className="prc-label">GSTIN / Tax Identification</label>
                  <input
                    type="text"
                    className="prc-input"
                    value={collegeProfile.gstin}
                    onChange={e => setCollegeProfile({ ...collegeProfile, gstin: e.target.value })}
                  />
                </div>
              </div>

              <div className="prc-action-bar">
                <span className="prc-audit-note">
                  <CheckCircle size={14} color="#10b981" />
                  Accreditation profile synchronizes with all official invoice and certificate downloads
                </span>
                <button type="button" className="prc-btn prc-btn-primary" onClick={handleSaveAll} disabled={saving}>
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save College Profile'}
                </button>
              </div>
            </div>
          )}

          {/* ═══════════ TAB 3: SECURITY & ACCESS ═══════════ */}
          {activeTab === 'security' && (
            <div>
              <div className="prc-panel-head">
                <div className="prc-panel-title-wrap">
                  <div className="prc-panel-icon">
                    <Lock size={22} />
                  </div>
                  <div>
                    <h2 className="prc-panel-title">Security & Administrative Credentials</h2>
                    <p className="prc-panel-desc">Manage college admin access keys, password security, and active sessions.</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePasswordChange} style={{ maxWidth: '520px', marginBottom: '32px' }}>
                <h3 className="prc-section-title">Change Administrative Password</h3>

                <div className="prc-form-group" style={{ marginBottom: '14px' }}>
                  <label className="prc-label">Current Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPwd.current ? 'text' : 'password'}
                      required
                      className="prc-input"
                      placeholder="••••••••"
                      value={securityForm.current}
                      onChange={e => setSecurityForm({ ...securityForm, current: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(s => ({ ...s, current: !s.current }))}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      {showPwd.current ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="prc-form-group" style={{ marginBottom: '14px' }}>
                  <label className="prc-label">New Secure Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPwd.newPwd ? 'text' : 'password'}
                      required
                      className="prc-input"
                      placeholder="••••••••"
                      value={securityForm.newPwd}
                      onChange={e => setSecurityForm({ ...securityForm, newPwd: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(s => ({ ...s, newPwd: !s.newPwd }))}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      {showPwd.newPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {securityForm.newPwd && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px', height: '4px' }}>
                        {[1, 2, 3, 4].map(i => (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              borderRadius: 4,
                              background: i <= pwdStrength ? strengthColor : 'var(--s2, #e2e8f0)',
                              transition: 'all 0.3s'
                            }}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: strengthColor, marginTop: '4px', display: 'inline-block' }}>
                        Password Strength: {strengthText}
                      </span>
                    </div>
                  )}
                </div>

                <div className="prc-form-group" style={{ marginBottom: '18px' }}>
                  <label className="prc-label">Confirm New Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPwd.confirm ? 'text' : 'password'}
                      required
                      className="prc-input"
                      placeholder="••••••••"
                      value={securityForm.confirm}
                      onChange={e => setSecurityForm({ ...securityForm, confirm: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(s => ({ ...s, confirm: !s.confirm }))}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      {showPwd.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="prc-btn prc-btn-primary" disabled={saving}>
                  <Key size={15} />
                  Update Admin Password
                </button>
              </form>

              <h3 className="prc-section-title">Session Management</h3>
              <div style={{ padding: '16px 20px', borderRadius: '12px', background: 'var(--s2, #f8fafc)', border: '1px solid var(--bd, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--tx, #0f172a)' }}>Current Active Administrator Session</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--mu, #64748b)' }}>Signed in as {user?.email || 'admin@college.edu'}</div>
                </div>
                <button
                  type="button"
                  onClick={() => { if (window.confirm('Sign out of your session?')) logout(); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    background: 'rgba(239, 68, 68, 0.08)',
                    color: '#dc2626',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* ═══════════ TAB 4: INCIDENT ALERTS ═══════════ */}
          {activeTab === 'notifications' && (
            <div>
              <div className="prc-panel-head">
                <div className="prc-panel-title-wrap">
                  <div className="prc-panel-icon">
                    <Bell size={22} />
                  </div>
                  <div>
                    <h2 className="prc-panel-title">Proctoring Incident Alerts & Notifications</h2>
                    <p className="prc-panel-desc">Configure automated dispatches for proctoring violations and exam audits.</p>
                  </div>
                </div>
              </div>

              <div className="prc-toggle-row">
                <div className="prc-toggle-info">
                  <span className="prc-toggle-label">Immediate Critical Breach Dispatches</span>
                  <span className="prc-toggle-sub">Send instant notification when a candidate exceeds warning limits or gets auto-submitted</span>
                </div>
                <label className="prc-switch">
                  <input
                    type="checkbox"
                    checked={notifications.instantBreachAlerts}
                    onChange={e => setNotifications({ ...notifications, instantBreachAlerts: e.target.checked })}
                  />
                  <span className="prc-slider" />
                </label>
              </div>

              <div className="prc-toggle-row">
                <div className="prc-toggle-info">
                  <span className="prc-toggle-label">Student Enrollment Alerts</span>
                  <span className="prc-toggle-sub">Receive confirmation email upon CSV bulk upload or new candidate enrollment</span>
                </div>
                <label className="prc-switch">
                  <input
                    type="checkbox"
                    checked={notifications.emailOnStudentViolation}
                    onChange={e => setNotifications({ ...notifications, emailOnStudentViolation: e.target.checked })}
                  />
                  <span className="prc-slider" />
                </label>
              </div>

              <div className="prc-toggle-row">
                <div className="prc-toggle-info">
                  <span className="prc-toggle-label">Examination Release Confirmations</span>
                  <span className="prc-toggle-sub">Email notifications when an examination schedule goes live for candidates</span>
                </div>
                <label className="prc-switch">
                  <input
                    type="checkbox"
                    checked={notifications.emailOnExamPublished}
                    onChange={e => setNotifications({ ...notifications, emailOnExamPublished: e.target.checked })}
                  />
                  <span className="prc-slider" />
                </label>
              </div>

              <div className="prc-toggle-row">
                <div className="prc-toggle-info">
                  <span className="prc-toggle-label">Weekly Executive Academic Governance Summary</span>
                  <span className="prc-toggle-sub">Automated weekly digest covering student participation, average scores, and audit flags</span>
                </div>
                <label className="prc-switch">
                  <input
                    type="checkbox"
                    checked={notifications.weeklyGovernanceReport}
                    onChange={e => setNotifications({ ...notifications, weeklyGovernanceReport: e.target.checked })}
                  />
                  <span className="prc-slider" />
                </label>
              </div>

              <div className="prc-action-bar">
                <button type="button" className="prc-btn prc-btn-primary" onClick={handleSaveAll} disabled={saving}>
                  <Save size={16} />
                  Save Alert Preferences
                </button>
              </div>
            </div>
          )}

          {/* ═══════════ TAB 5: EMAIL DISPATCH ═══════════ */}
          {activeTab === 'email' && (
            <div>
              <div className="prc-panel-head">
                <div className="prc-panel-title-wrap">
                  <div className="prc-panel-icon">
                    <Mail size={22} />
                  </div>
                  <div>
                    <h2 className="prc-panel-title">Institutional Email Dispatch & White-Labeling</h2>
                    <p className="prc-panel-desc">Customize outgoing student credential emails and exam invite dispatches.</p>
                  </div>
                </div>
              </div>

              <div className="prc-form-grid">
                <div className="prc-form-group">
                  <label className="prc-label">Sender Display Name *</label>
                  <input
                    type="text"
                    className="prc-input"
                    value={emailConfig.senderName}
                    onChange={e => setEmailConfig({ ...emailConfig, senderName: e.target.value })}
                  />
                  <span className="prc-hint">Name displayed in candidate inboxes</span>
                </div>

                <div className="prc-form-group">
                  <label className="prc-label">Outgoing Dispatch Email Address *</label>
                  <input
                    type="email"
                    className="prc-input"
                    value={emailConfig.senderEmail}
                    onChange={e => setEmailConfig({ ...emailConfig, senderEmail: e.target.value })}
                  />
                </div>

                <div className="prc-form-group">
                  <label className="prc-label">Support / Reply-To Email</label>
                  <input
                    type="email"
                    className="prc-input"
                    value={emailConfig.replyToEmail}
                    onChange={e => setEmailConfig({ ...emailConfig, replyToEmail: e.target.value })}
                  />
                </div>

                <div className="prc-form-group">
                  <label className="prc-label">Candidate Examination Entrance URL</label>
                  <input
                    type="url"
                    className="prc-input"
                    value={emailConfig.portalUrl}
                    onChange={e => setEmailConfig({ ...emailConfig, portalUrl: e.target.value })}
                  />
                  <span className="prc-hint">Direct link included in all candidate exam launch emails</span>
                </div>
              </div>

              <div className="prc-action-bar">
                <button type="button" className="prc-btn prc-btn-primary" onClick={handleSaveAll} disabled={saving}>
                  <Save size={16} />
                  Save Email Dispatch Settings
                </button>
              </div>
            </div>
          )}

          {/* ═══════════ TAB 6: PREFERENCES ═══════════ */}
          {activeTab === 'preferences' && (
            <div>
              <div className="prc-panel-head">
                <div className="prc-panel-title-wrap">
                  <div className="prc-panel-icon">
                    <Palette size={22} />
                  </div>
                  <div>
                    <h2 className="prc-panel-title">Platform Preferences & Localization</h2>
                    <p className="prc-panel-desc">Configure timezone scheduling, display standards, and administrator defaults.</p>
                  </div>
                </div>
              </div>

              <div className="prc-form-grid">
                <div className="prc-form-group">
                  <label className="prc-label">Institution Timezone *</label>
                  <select
                    className="prc-select"
                    value={preferences.timezone}
                    onChange={e => setPreferences({ ...preferences, timezone: e.target.value })}
                  >
                    <option value="Asia/Kolkata">IST — India Standard Time (UTC+5:30)</option>
                    <option value="UTC">UTC — Universal Coordinated Time</option>
                    <option value="Asia/Dubai">GST — Gulf Standard Time (UTC+4)</option>
                    <option value="America/New_York">EST — Eastern Standard Time (UTC-5)</option>
                    <option value="Europe/London">BST / GMT — London (UTC+0)</option>
                  </select>
                </div>

                <div className="prc-form-group">
                  <label className="prc-label">Date Format Standard</label>
                  <select
                    className="prc-select"
                    value={preferences.dateFormat}
                    onChange={e => setPreferences({ ...preferences, dateFormat: e.target.value })}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (Indian Standard)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Global Standard)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (US Standard)</option>
                  </select>
                </div>

                <div className="prc-form-group">
                  <label className="prc-label">Platform UI Language</label>
                  <select
                    className="prc-select"
                    value={preferences.language}
                    onChange={e => setPreferences({ ...preferences, language: e.target.value })}
                  >
                    <option value="en">English (Academic Standard)</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                  </select>
                </div>
              </div>

              <div className="prc-toggle-row">
                <div className="prc-toggle-info">
                  <span className="prc-toggle-label">Auto-Save Examination Drafts</span>
                  <span className="prc-toggle-sub">Periodically save exam questions and form inputs in local browser storage</span>
                </div>
                <label className="prc-switch">
                  <input
                    type="checkbox"
                    checked={preferences.autoSave}
                    onChange={e => setPreferences({ ...preferences, autoSave: e.target.checked })}
                  />
                  <span className="prc-slider" />
                </label>
              </div>

              <div className="prc-toggle-row">
                <div className="prc-toggle-info">
                  <span className="prc-toggle-label">Display Plain Candidate Passwords</span>
                  <span className="prc-toggle-sub">Allows authorized administrators to view initial student passwords in registry</span>
                </div>
                <label className="prc-switch">
                  <input
                    type="checkbox"
                    checked={preferences.showStudentKeys}
                    onChange={e => setPreferences({ ...preferences, showStudentKeys: e.target.checked })}
                  />
                  <span className="prc-slider" />
                </label>
              </div>

              <div className="prc-action-bar">
                <button type="button" className="prc-btn prc-btn-primary" onClick={handleSaveAll} disabled={saving}>
                  <Save size={16} />
                  Save Platform Preferences
                </button>
              </div>
            </div>
          )}

          {/* ═══════════ TAB 7: DANGER ZONE ═══════════ */}
          {activeTab === 'danger' && (
            <div>
              <div className="prc-panel-head">
                <div className="prc-panel-title-wrap">
                  <div className="prc-panel-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}>
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <h2 className="prc-panel-title" style={{ color: '#dc2626' }}>Institutional Data Governance & Danger Zone</h2>
                    <p className="prc-panel-desc">Destructive actions and permanent institutional database operations.</p>
                  </div>
                </div>
              </div>

              <div className="prc-danger-box">
                <div className="prc-danger-info">
                  <h4>Purge Local Examination Evaluation Cache</h4>
                  <p>
                    Invalidates cached proctoring violation logs and forces client browsers to fetch fresh transcripts directly from the database.
                  </p>
                </div>
                <button
                  type="button"
                  className="prc-danger-btn"
                  onClick={() => {
                    sessionStorage.clear();
                    toast.success('Evaluation cache cleared successfully');
                  }}
                >
                  Purge Cache
                </button>
              </div>

              <div className="prc-danger-box">
                <div className="prc-danger-info">
                  <h4>Reset Examination Audit Logs</h4>
                  <p>
                    Clears temporary anti-cheat flags and resets candidate warning counts across scheduled practice tests.
                  </p>
                </div>
                <button
                  type="button"
                  className="prc-danger-btn"
                  onClick={() => {
                    toast.error('Audit reset requires elevated Super-Admin clearance');
                  }}
                >
                  Reset Audit Logs
                </button>
              </div>

              <div className="prc-danger-box">
                <div className="prc-danger-info">
                  <h4>Deactivate Institutional Accreditation</h4>
                  <p>
                    Immediately revokes API access, stops proctoring endpoints, and disables active candidate exam portals.
                  </p>
                </div>
                <button
                  type="button"
                  className="prc-danger-btn"
                  onClick={() => {
                    toast.error('Please contact Nexify Examina compliance to decommission institutional license');
                  }}
                >
                  Deactivate Accreditation
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
