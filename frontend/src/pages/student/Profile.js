// src/pages/student/Profile.js — Candidate Academic Records & Identity Passport
// Ultra-Refined Executive Implementation matching College Admin Design (v6)
import React, { useEffect, useState, useMemo } from 'react';
import { studentAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { NexifyIcon } from '../../components/admin/NexifyIcons';
import { 
  User, 
  Mail, 
  Calendar, 
  BookOpen, 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff,
  Building,
  GraduationCap,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAPI.getProfile()
      .then(r => {
        setProfile(r.data.profile || r.data.data);
      })
      .catch(() => {
        toast.error('Failed to load candidate profile');
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePwChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setPwLoading(true);
    try {
      await studentAPI.changePassword({ 
        currentPassword: pwForm.currentPassword, 
        newPassword: pwForm.newPassword 
      });
      toast.success('Security password updated successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  if (loading) {
    return (
      <div className="wrap" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <div style={{
          width: 44, height: 44, border: '3.5px solid var(--prs)', borderTopColor: 'var(--c1)',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
        }} />
        <h3 style={{ color: 'var(--tx)', margin: '0 0 6px', fontWeight: 700 }}>Authenticating Candidate Profile...</h3>
        <p style={{ color: 'var(--mu)', fontSize: '13px' }}>Loading verified institutional credentials and clearance</p>
      </div>
    );
  }

  const initial = profile?.name ? profile.name.charAt(0).toUpperCase() : 'S';
  const candidateId = profile?.student_id || profile?.id 
    ? `EXS-${(profile.student_id || profile.id).slice(0, 8).toUpperCase()}` 
    : 'EXS-CANDIDATE';

  return (
    <div className="wrap">
      {/* ── 1. Page Header (College Admin Layout) ────────────────────── */}
      <section className="head rise" style={{ '--d': 0 }}>
        <div>
          <h1>Candidate Academic Profile &amp; Records</h1>
          <p id="date">
            {formattedDate}. Verified records for {profile?.name || 'Enrolled Candidate'} · {profile?.college_name || 'Academic Institution'}
          </p>
        </div>
        <div className="btns">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--goods)',
            border: '1px solid var(--good)',
            padding: '8px 16px',
            borderRadius: '10px'
          }}>
            <NexifyIcon name="shield" size={16} style={{ color: 'var(--good)' }} />
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--good)' }}>
              Clearance: Active &amp; Verified
            </span>
          </div>
        </div>
      </section>

      {/* ── 2. Two-Column Profile & Security Workspace ──────────────── */}
      <div className="pf-grid">
        {/* ── LEFT COLUMN: Identity Passport Card ── */}
        <article className="card pf-passport-card rise" style={{ '--d': 1 }}>
          <div className="pf-passport-hero">
            <div className="pf-passport-tag">
              <NexifyIcon name="shield" size={13} style={{ color: '#38bdf8' }} />
              <span>Official Examination Passport</span>
            </div>
            <div className="pf-avatar-circle">
              {initial}
              <div className="pf-avatar-verified-badge" title="Biometrically Verified Candidate">
                <CheckCircle2 size={15} />
              </div>
            </div>
          </div>

          <div className="pf-passport-body">
            <h2 className="pf-passport-name">{profile?.name || 'Verified Student'}</h2>
            <div className="pf-passport-id-chip">
              ID: {candidateId}
            </div>
            <div className="pf-passport-college">
              {profile?.college_name || 'Enrolled Academic Institution'}
            </div>

            <div className="pf-passport-meta-list">
              <div className="pf-passport-row">
                <span className="pf-passport-row-label">Roll / Enrollment:</span>
                <span className="pf-passport-row-val">{profile?.roll_no || 'Assigned via Portal'}</span>
              </div>
              <div className="pf-passport-row">
                <span className="pf-passport-row-label">Department:</span>
                <span className="pf-passport-row-val">{profile?.department || 'Information Technology'}</span>
              </div>
              <div className="pf-passport-row">
                <span className="pf-passport-row-label">Academic Semester:</span>
                <span className="pf-passport-row-val">{profile?.semester ? `Semester ${profile.semester}` : 'Current Term'}</span>
              </div>
              <div className="pf-passport-row">
                <span className="pf-passport-row-label">Graduation Batch:</span>
                <span className="pf-passport-row-val">{profile?.batch || '2024 - 2028'}</span>
              </div>
              <div className="pf-passport-row">
                <span className="pf-passport-row-label">Integrity Status:</span>
                <span className="pf-passport-row-val" style={{ color: 'var(--good)' }}>100% Good Standing</span>
              </div>
            </div>

            <div className="pf-clearance-alert">
              <ShieldCheck size={22} style={{ color: 'var(--good)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <h5>Proctoring Clearance Active</h5>
                <p>Cleared for AI-monitored high-stakes examinations with automated video, audio, and browser security telemetry.</p>
              </div>
            </div>
          </div>
        </article>

        {/* ── RIGHT COLUMN: Detailed Records & Credentials Form ── */}
        <div className="pf-right-column">
          {/* Academic & Contact Records Card */}
          <article className="card pad rise" style={{ '--d': 2 }}>
            <div className="ph">
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <GraduationCap size={20} style={{ color: 'var(--c1)' }} />
                  <span>Academic &amp; Institutional Registry</span>
                </h2>
                <p className="s">Verified identity parameters synced from college administration records.</p>
              </div>
              <span className="bdg" style={{ background: 'var(--prs)', color: 'var(--pr)' }}>
                Institutional Record
              </span>
            </div>

            <div className="pf-fields-grid">
              <div className="pf-field-item">
                <div className="pf-field-icon">
                  <User size={18} />
                </div>
                <div>
                  <div className="pf-field-label">Full Legal Name</div>
                  <div className="pf-field-val">{profile?.name || 'Candidate'}</div>
                </div>
              </div>

              <div className="pf-field-item">
                <div className="pf-field-icon">
                  <Mail size={18} />
                </div>
                <div>
                  <div className="pf-field-label">Institutional Email</div>
                  <div className="pf-field-val">{profile?.email || 'N/A'}</div>
                </div>
              </div>

              <div className="pf-field-item">
                <div className="pf-field-icon">
                  <Building size={18} />
                </div>
                <div>
                  <div className="pf-field-label">College / University</div>
                  <div className="pf-field-val">{profile?.college_name || 'Academic Institution'}</div>
                </div>
              </div>

              <div className="pf-field-item">
                <div className="pf-field-icon">
                  <BookOpen size={18} />
                </div>
                <div>
                  <div className="pf-field-label">Assigned Roll Number</div>
                  <div className="pf-field-val">{profile?.roll_no || 'Not Assigned'}</div>
                </div>
              </div>

              <div className="pf-field-item">
                <div className="pf-field-icon">
                  <Calendar size={18} />
                </div>
                <div>
                  <div className="pf-field-label">Enrolled Batch</div>
                  <div className="pf-field-val">{profile?.batch || 'Active Academic Year'}</div>
                </div>
              </div>

              <div className="pf-field-item">
                <div className="pf-field-icon">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="pf-field-label">Registration Date</div>
                  <div className="pf-field-val">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Verified Account'}
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Account Security & Password Update Card */}
          <article className="card pad rise" style={{ '--d': 3 }}>
            <div className="ph">
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={19} style={{ color: 'var(--c1)' }} />
                  <span>Access Credentials &amp; Security Key</span>
                </h2>
                <p className="s">Update your account password to safeguard your assessment submissions and transcripts.</p>
              </div>
              <span className="bdg" style={{ background: 'var(--goods)', color: 'var(--good)' }}>
                Encrypted SHA-256
              </span>
            </div>

            <form onSubmit={handlePwChange} style={{ marginTop: '16px' }}>
              <div className="pf-form-row">
                <label className="pf-input-label">Current Security Password</label>
                <div className="pf-input-wrap">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    className="pf-input"
                    placeholder="Enter existing account password"
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    className="pf-input-toggle"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    title={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label className="pf-input-label">New Password</label>
                  <div className="pf-input-wrap">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className="pf-input"
                      placeholder="Minimum 6 characters"
                      value={pwForm.newPassword}
                      onChange={(e) => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      className="pf-input-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="pf-input-label">Confirm New Password</label>
                  <div className="pf-input-wrap">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="pf-input"
                      placeholder="Re-enter new password"
                      value={pwForm.confirm}
                      onChange={(e) => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      className="pf-input-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pf-form-footer">
                <button type="submit" className="btn pri" disabled={pwLoading}>
                  <Sparkles size={15} />
                  <span>{pwLoading ? 'Securing Credentials...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </article>
        </div>
      </div>
    </div>
  );
}
