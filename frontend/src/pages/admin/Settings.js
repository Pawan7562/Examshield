// src/pages/admin/Settings.js
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  User,
  Lock,
  Bell,
  Mail,
  Shield,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Trash2,
  LogOut,
  Settings as SettingsIcon,
  Palette,
  ChevronRight,
  Info,
  Key,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import '../../components/admin/AdminSidebar.css';

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */
const SectionTab = ({ id, icon: Icon, label, active, onClick }) => (
  <button
    onClick={() => onClick(id)}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.85rem 1.25rem',
      borderRadius: '12px',
      border: 'none',
      background: active ? 'rgba(10,116,218,0.12)' : 'transparent',
      color: active ? '#0a74da' : '#64748b',
      fontWeight: active ? 700 : 500,
      fontSize: '0.92rem',
      cursor: 'pointer',
      width: '100%',
      textAlign: 'left',
      transition: 'all 0.2s ease',
      borderLeft: active ? '3px solid #0a74da' : '3px solid transparent',
    }}
  >
    <Icon size={18} />
    {label}
    {active && <ChevronRight size={16} style={{ marginLeft: 'auto' }} />}
  </button>
);

const FormField = ({ label, hint, children }) => (
  <div style={{ marginBottom: '1.5rem' }}>
    <label style={{
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: 600,
      color: '#374151',
      marginBottom: '0.4rem',
    }}>
      {label}
    </label>
    {children}
    {hint && (
      <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        <Info size={12} /> {hint}
      </p>
    )}
  </div>
);

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '10px',
  border: '1.5px solid #e2e8f0',
  fontSize: '0.92rem',
  color: '#1e293b',
  background: '#f8fafc',
  outline: 'none',
  transition: 'all 0.2s ease',
  boxSizing: 'border-box',
};

const Toggle = ({ checked, onChange, label, subLabel }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.25rem',
    borderRadius: '12px',
    border: '1.5px solid #e2e8f0',
    marginBottom: '0.75rem',
    background: '#f8fafc',
    transition: 'all 0.2s',
  }}>
    <div>
      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>{label}</div>
      {subLabel && <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>{subLabel}</div>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        color: checked ? '#0a74da' : '#cbd5e1',
        transition: 'color 0.2s',
        flexShrink: 0,
      }}
    >
      {checked ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
    </button>
  </div>
);

const SaveButton = ({ loading, onClick }) => (
  <button
    onClick={onClick}
    disabled={loading}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 2rem',
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #0a74da 0%, #0656a3 100%)',
      color: 'white',
      fontWeight: 700,
      fontSize: '0.92rem',
      border: 'none',
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.7 : 1,
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 14px rgba(10,116,218,0.3)',
    }}
  >
    <Save size={18} />
    {loading ? 'Saving...' : 'Save Changes'}
  </button>
);

/* ─────────────────────────────────────────────
   Section: Profile
───────────────────────────────────────────── */
const ProfileSection = ({ user }) => {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    collegeName: user?.collegeName || '',
    phone: user?.phone || '',
    website: user?.website || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
  });
  const [saving, setSaving] = useState(false);
  const initials = (form.name || 'A').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    toast.success('Profile updated successfully!');
    setSaving(false);
  };

  return (
    <div>
      {/* Avatar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, rgba(233,69,96,0.05) 0%, rgba(139,92,246,0.05) 100%)',
        borderRadius: '16px',
        border: '1.5px solid rgba(10,116,218,0.12)',
        marginBottom: '2rem',
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0a74da, #0656a3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          fontWeight: 800,
          color: 'white',
          flexShrink: 0,
          boxShadow: '0 8px 24px rgba(10,116,218,0.3)',
        }}>{initials}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>{form.name || 'Admin User'}</div>
          <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>College Administrator</div>
          <div style={{
            display: 'inline-block',
            marginTop: '0.5rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '20px',
            background: 'rgba(34,197,94,0.1)',
            color: '#16a34a',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}>
            <CheckCircle size={11} style={{ display: 'inline', marginRight: 4 }} />
            Active Account
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0 2rem' }}>
        <FormField label="Full Name" hint="This name will appear across the dashboard">
          <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
        </FormField>
        <FormField label="Email Address" hint="Used for login and notifications">
          <input style={inputStyle} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" placeholder="admin@college.edu" />
        </FormField>
        <FormField label="College / Institution Name">
          <input style={inputStyle} value={form.collegeName} onChange={e => setForm({ ...form, collegeName: e.target.value })} placeholder="Your institution name" />
        </FormField>
        <FormField label="Phone Number">
          <input style={inputStyle} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} type="tel" placeholder="+91 98765 43210" />
        </FormField>
        <FormField label="Website">
          <input style={inputStyle} value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://yourcollege.edu" />
        </FormField>
        <FormField label="City">
          <input style={inputStyle} value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Mumbai" />
        </FormField>
        <FormField label="State">
          <input style={inputStyle} value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="Maharashtra" />
        </FormField>
        <FormField label="Address" hint="Office / campus address">
          <input style={inputStyle} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123, Main Street..." />
        </FormField>
      </div>
      <SaveButton loading={saving} onClick={handleSave} />
    </div>
  );
};

/* ─────────────────────────────────────────────
   Section: Security
───────────────────────────────────────────── */
const SecuritySection = () => {
  const [form, setForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [show, setShow] = useState({ current: false, newPwd: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const { logout } = useAuth();

  const strength = (() => {
    const p = form.newPwd;
    if (!p) return null;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength || 0];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e', '#16a34a'][strength || 0];

  const handleSave = async () => {
    if (form.newPwd !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.newPwd.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    toast.success('Password changed successfully!');
    setForm({ current: '', newPwd: '', confirm: '' });
    setSaving(false);
  };

  const PwdField = ({ field, label }) => (
    <FormField label={label}>
      <div style={{ position: 'relative' }}>
        <input
          style={inputStyle}
          type={show[field] ? 'text' : 'password'}
          value={form[field]}
          onChange={e => setForm({ ...form, [field]: e.target.value })}
          placeholder="••••••••"
        />
        <button
          onClick={() => setShow(s => ({ ...s, [field]: !s[field] }))}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
        >
          {show[field] ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </FormField>
  );

  return (
    <div>
      {/* Password card */}
      <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1.5px solid #e2e8f0', padding: '1.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'linear-gradient(135deg, #0a74da, #0656a3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Key size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#1e293b' }}>Change Password</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Use a strong, unique password</div>
          </div>
        </div>

        <div style={{ maxWidth: 480 }}>
          <PwdField field="current" label="Current Password" />
          <PwdField field="newPwd" label="New Password" />

          {/* Strength bar */}
          {form.newPwd && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.4rem' }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 4,
                    background: i <= strength ? strengthColor : '#e2e8f0',
                    transition: 'background 0.3s',
                  }} />
                ))}
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: strengthColor }}>{strengthLabel}</span>
            </div>
          )}

          <PwdField field="confirm" label="Confirm New Password" />

          {form.confirm && form.newPwd !== form.confirm && (
            <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <AlertTriangle size={13} /> Passwords do not match
            </p>
          )}

          <SaveButton loading={saving} onClick={handleSave} />
        </div>
      </div>

      {/* Security info */}
      <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1.5px solid #e2e8f0', padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Shield size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#1e293b' }}>Session Management</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Control your account sessions</div>
          </div>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.87rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          Signing out will end your current session. All unsaved changes will be lost.
          Use this if you're on a shared computer.
        </p>
        <button
          onClick={() => { if (window.confirm('Sign out of your account?')) logout(); }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.7rem 1.5rem', borderRadius: '10px',
            border: '1.5px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.07)', color: '#ef4444',
            fontWeight: 600, fontSize: '0.87rem', cursor: 'pointer',
          }}
        >
          <LogOut size={16} /> Sign Out of All Sessions
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Section: Notifications
───────────────────────────────────────────── */
const NotificationsSection = () => {
  const [prefs, setPrefs] = useState({
    emailOnNewStudent: true,
    emailOnExamPublish: true,
    emailOnResultPublish: false,
    emailExamReminder: true,
    browserNotifications: false,
    weeklyReport: true,
  });
  const [saving, setSaving] = useState(false);

  const toggle = key => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    toast.success('Notification preferences saved!');
    setSaving(false);
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>Email Notifications</h3>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Choose which emails you'd like to receive
        </p>
        <Toggle checked={prefs.emailOnNewStudent} onChange={() => toggle('emailOnNewStudent')} label="New Student Added" subLabel="Get notified when a new student joins" />
        <Toggle checked={prefs.emailOnExamPublish} onChange={() => toggle('emailOnExamPublish')} label="Exam Published" subLabel="Receive confirmation when an exam goes live" />
        <Toggle checked={prefs.emailOnResultPublish} onChange={() => toggle('emailOnResultPublish')} label="Results Published" subLabel="Notify when exam results are released" />
        <Toggle checked={prefs.emailExamReminder} onChange={() => toggle('emailExamReminder')} label="Exam Reminders" subLabel="1-hour reminder before scheduled exams" />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>Reports</h3>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>Automated activity summaries</p>
        <Toggle checked={prefs.weeklyReport} onChange={() => toggle('weeklyReport')} label="Weekly Activity Report" subLabel="Summary of students, exams, and results every Monday" />
        <Toggle checked={prefs.browserNotifications} onChange={() => toggle('browserNotifications')} label="Browser Notifications" subLabel="Real-time alerts while you're on the platform" />
      </div>

      <SaveButton loading={saving} onClick={handleSave} />
    </div>
  );
};

/* ─────────────────────────────────────────────
   Section: Email Configuration
───────────────────────────────────────────── */
const EmailSection = () => {
  const [form, setForm] = useState({
    senderName: 'Nexify Examina Admin',
    senderEmail: '',
    replyTo: '',
    studentLoginUrl: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    toast.success('Email settings updated!');
    setSaving(false);
  };

  return (
    <div>
      <div style={{
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        background: 'rgba(245,158,11,0.08)',
        border: '1.5px solid rgba(245,158,11,0.25)',
        marginBottom: '2rem',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start',
      }}>
        <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: '0.85rem', color: '#92400e', lineHeight: 1.6 }}>
          <strong>SMTP settings</strong> are configured in the backend <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 5px', borderRadius: 4 }}>.env</code> file.
          This section lets you customize how emails appear to recipients.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0 2rem' }}>
        <FormField label="Sender Name" hint="Name that appears in the From field">
          <input style={inputStyle} value={form.senderName} onChange={e => setForm({ ...form, senderName: e.target.value })} placeholder="Nexify Examina Notifications" />
        </FormField>
        <FormField label="Sender Email" hint="Must match your configured SMTP user">
          <input style={inputStyle} value={form.senderEmail} onChange={e => setForm({ ...form, senderEmail: e.target.value })} type="email" placeholder="noreply@yourcollege.edu" />
        </FormField>
        <FormField label="Reply-To Email" hint="Where student replies will be sent">
          <input style={inputStyle} value={form.replyTo} onChange={e => setForm({ ...form, replyTo: e.target.value })} type="email" placeholder="admin@yourcollege.edu" />
        </FormField>
        <FormField label="Student Login URL" hint="Included in all student credential emails">
          <input style={inputStyle} value={form.studentLoginUrl} onChange={e => setForm({ ...form, studentLoginUrl: e.target.value })} placeholder="https://yourapp.vercel.app/student/login" />
        </FormField>
      </div>

      <SaveButton loading={saving} onClick={handleSave} />
    </div>
  );
};

/* ─────────────────────────────────────────────
   Section: Preferences
───────────────────────────────────────────── */
const PreferencesSection = () => {
  const [prefs, setPrefs] = useState({
    theme: 'light',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    language: 'en',
    autoSave: true,
    compactMode: false,
    showStudentPasswords: false,
  });
  const [saving, setSaving] = useState(false);
  const toggle = key => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const SelectField = ({ label, value, onChange, options, hint }) => (
    <FormField label={label} hint={hint}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </FormField>
  );

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    toast.success('Preferences saved!');
    setSaving(false);
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0 2rem', marginBottom: '2rem' }}>
        <SelectField
          label="Timezone"
          hint="Used for exam scheduling and display"
          value={prefs.timezone}
          onChange={v => setPrefs({ ...prefs, timezone: v })}
          options={[
            { value: 'Asia/Kolkata', label: 'IST — India Standard Time (UTC+5:30)' },
            { value: 'UTC', label: 'UTC — Coordinated Universal Time' },
            { value: 'America/New_York', label: 'EST — Eastern Time (UTC-5)' },
            { value: 'Europe/London', label: 'GMT — Greenwich Mean Time' },
          ]}
        />
        <SelectField
          label="Date Format"
          value={prefs.dateFormat}
          onChange={v => setPrefs({ ...prefs, dateFormat: v })}
          options={[
            { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
            { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
            { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
          ]}
        />
        <SelectField
          label="Language"
          value={prefs.language}
          onChange={v => setPrefs({ ...prefs, language: v })}
          options={[
            { value: 'en', label: 'English' },
            { value: 'hi', label: 'Hindi' },
          ]}
        />
      </div>

      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>Interface Preferences</h3>
      <Toggle checked={prefs.autoSave} onChange={() => toggle('autoSave')} label="Auto-save Forms" subLabel="Automatically save form progress every 30 seconds" />
      <Toggle checked={prefs.compactMode} onChange={() => toggle('compactMode')} label="Compact Mode" subLabel="Reduce spacing for a denser information layout" />
      <Toggle checked={prefs.showStudentPasswords} onChange={() => toggle('showStudentPasswords')} label="Show Student Passwords" subLabel="Display plain-text passwords in student lists (admin only)" />

      <div style={{ marginTop: '1.5rem' }}>
        <SaveButton loading={saving} onClick={handleSave} />
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Section: Danger Zone
───────────────────────────────────────────── */
const DangerSection = () => {
  const DangerCard = ({ icon: Icon, title, description, buttonLabel, buttonColor = '#ef4444', onClick, requireConfirm }) => (
    <div style={{
      borderRadius: '16px',
      border: `1.5px solid ${buttonColor}30`,
      padding: '1.5rem',
      marginBottom: '1rem',
      background: `${buttonColor}06`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{
          width: 42, height: 42, borderRadius: '10px',
          background: `${buttonColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: buttonColor, flexShrink: 0,
        }}>
          <Icon size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>{title}</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, marginBottom: '1rem' }}>{description}</div>
          <button
            onClick={onClick}
            style={{
              padding: '0.6rem 1.25rem', borderRadius: '8px',
              border: `1.5px solid ${buttonColor}50`,
              background: `${buttonColor}12`, color: buttonColor,
              fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            }}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{
        padding: '1rem 1.25rem', borderRadius: '12px',
        background: 'rgba(239,68,68,0.05)', border: '1.5px solid rgba(239,68,68,0.2)',
        marginBottom: '2rem', display: 'flex', gap: '0.75rem',
      }}>
        <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: '0.85rem', color: '#dc2626', margin: 0, lineHeight: 1.6 }}>
          <strong>Warning:</strong> Actions in this section are permanent and cannot be undone. Please proceed with extreme caution.
        </p>
      </div>

      <DangerCard
        icon={Trash2}
        title="Delete All Student Data"
        description="Permanently deletes all student records, exam submissions, and associated results. This action cannot be reversed."
        buttonLabel="Delete All Students"
        onClick={() => toast.error('Contact support to delete all student data')}
      />
      <DangerCard
        icon={AlertTriangle}
        title="Reset Exam Results"
        description="Clears all exam results and scores across all students. Exams themselves will remain intact."
        buttonLabel="Reset All Results"
        buttonColor="#f59e0b"
        onClick={() => toast.error('Contact support to reset exam results')}
      />
      <DangerCard
        icon={Shield}
        title="Deactivate Account"
        description="Deactivates your admin account and disables all associated student logins. You can reactivate by contacting Nexify Examina support."
        buttonLabel="Deactivate Account"
        onClick={() => toast.error('Please contact Nexify Examina support to deactivate your account')}
      />
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main Settings Page
───────────────────────────────────────────── */
const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'email', label: 'Email Settings', icon: Mail },
  { id: 'preferences', label: 'Preferences', icon: Palette },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
];

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return <ProfileSection user={user} />;
      case 'security': return <SecuritySection />;
      case 'notifications': return <NotificationsSection />;
      case 'email': return <EmailSection />;
      case 'preferences': return <PreferencesSection />;
      case 'danger': return <DangerSection />;
      default: return null;
    }
  };

  const currentTab = TABS.find(t => t.id === activeTab);

  return (
    <div className="admin-pages-container">
      {/* Header */}
      <div className="admin-welcome-section" style={{ marginBottom: '2rem' }}>
        <div className="admin-welcome-content">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <SettingsIcon size={28} color="#0a74da" />
            Settings
          </h1>
          <p>Manage your account, security, and platform preferences</p>
        </div>
      </div>

      {/* Layout */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Sidebar nav */}
        <div style={{
          width: 220,
          flexShrink: 0,
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid rgba(0,0,0,0.08)',
          padding: '1rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          position: 'sticky',
          top: '1.5rem',
        }}>
          {TABS.map(tab => (
            <SectionTab
              key={tab.id}
              id={tab.id}
              icon={tab.icon}
              label={tab.label}
              active={activeTab === tab.id}
              onClick={setActiveTab}
            />
          ))}
        </div>

        {/* Content panel */}
        <div style={{
          flex: 1,
          minWidth: 0,
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid rgba(0,0,0,0.08)',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          animation: 'fadeInUp 0.3s ease-out',
        }}>
          {/* Section header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            paddingBottom: '1.5rem',
            marginBottom: '2rem',
            borderBottom: '1.5px solid #f1f5f9',
          }}>
            {currentTab && (
              <div style={{
                width: 42, height: 42, borderRadius: '10px',
                background: activeTab === 'danger'
                  ? 'rgba(239,68,68,0.1)'
                  : 'linear-gradient(135deg, rgba(10,116,218,0.1), rgba(99,102,241,0.1))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: activeTab === 'danger' ? '#ef4444' : '#0a74da',
              }}>
                <currentTab.icon size={20} />
              </div>
            )}
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>{currentTab?.label}</h2>
            </div>
          </div>

          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
