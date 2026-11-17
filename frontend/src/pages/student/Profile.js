// src/pages/student/Profile.js
import React, { useEffect, useState } from 'react';
import { studentAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Calendar, 
  BookOpen, 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff,
  Save,
  Building,
  GraduationCap,
  CheckCircle2,
  Fingerprint,
  Clock
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

  if (loading) {
    return (
      <div className="pf-container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <div style={{
          width: '42px',
          height: '42px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#0a74da',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px'
        }} />
        <h4 style={{ color: '#0f172a', margin: '0 0 6px', fontWeight: 700 }}>Authenticating Candidate Profile...</h4>
        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading verified institutional credentials</p>
      </div>
    );
  }

  const initial = profile?.name ? profile.name.charAt(0).toUpperCase() : 'S';

  return (
    <div className="pf-container">
      {/* Header Banner */}
      <div className="pf-header-banner">
        <div className="pf-header-left">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0a74da', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
            <Fingerprint size={16} /> Verified Candidate Identity
          </div>
          <h1>Candidate Records & Credentials</h1>
          <p>Institutional registration details, biometric verification clearance, and account access controls.</p>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#ecfdf5', border: '1.5px solid #a7f3d0', padding: '8px 16px', borderRadius: '12px' }}>
          <CheckCircle2 size={18} color="#059669" />
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#065f46' }}>
            Status: Active & Authorized
          </span>
        </div>
      </div>

      <div className="pf-layout-grid">
        {/* Left Column: Candidate ID Card */}
        <div className="pf-passport-card">
          <div className="pf-passport-header">
            <div className="pf-passport-shield">
              <ShieldCheck size={14} /> Official ID Passport
            </div>
            <div className="pf-avatar-wrap">
              {initial}
              <div className="pf-avatar-verified" title="Biometrically Verified">
                <CheckCircle2 size={16} />
              </div>
            </div>
          </div>

          <div className="pf-passport-body">
            <h2 className="pf-candidate-name">{profile?.name || 'Verified Student'}</h2>
            <div className="pf-candidate-id">
              ID: {profile?.student_id || profile?.id ? `EXS-${(profile.student_id || profile.id).slice(0, 8).toUpperCase()}` : 'EXS-CANDIDATE'}
            </div>
            <div className="pf-institution-name">
              {profile?.college_name || 'Enrolled Academic Institution'}
            </div>

            <div className="pf-passport-list">
              <div className="pf-passport-item">
                <span>Roll / Reg No:</span>
                <span>{profile?.roll_no || 'Assigned via Portal'}</span>
              </div>
              <div className="pf-passport-item">
                <span>Department:</span>
                <span>{profile?.department || 'Information Technology'}</span>
              </div>
              <div className="pf-passport-item">
                <span>Academic Semester:</span>
                <span>{profile?.semester ? `Semester ${profile.semester}` : 'Current Term'}</span>
              </div>
              <div className="pf-passport-item">
                <span>Graduation Batch:</span>
                <span>{profile?.batch || '2024 - 2028'}</span>
              </div>
            </div>

            <div className="pf-clearance-box">
              <ShieldCheck size={26} color="#16a34a" style={{ flexShrink: 0 }} />
              <div>
                <h5>Proctoring Clearance Active</h5>
                <p>Eligible for AI-proctored high-stakes online examinations with automated video and audio auditing.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Information & Security Form */}
        <div className="pf-right-column">
          {/* Institutional Information Card */}
          <div className="pf-section-card">
            <h2 className="pf-section-title">
              <GraduationCap size={20} color="#0a74da" />
              Academic & Contact Profile
            </h2>
            <p className="pf-section-subtitle">
              Verified records provided during institutional onboarding.
            </p>

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
          </div>

          {/* Security Credentials Update */}
          <div className="pf-section-card">
            <h2 className="pf-section-title">
              <Lock size={20} color="#0a74da" />
              Account Security & Access Key
            </h2>
            <p className="pf-section-subtitle">
              Update your account password to protect access to your assessments and transcripts.
            </p>

            <form onSubmit={handlePwChange}>
              <div className="pf-form-row">
                <label className="pf-input-label">Current Password</label>
                <div className="pf-input-wrapper">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    className="pf-input-field"
                    placeholder="Enter existing password"
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    className="pf-input-toggle"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label className="pf-input-label">New Password</label>
                  <div className="pf-input-wrapper">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className="pf-input-field"
                      placeholder="Minimum 6 characters"
                      value={pwForm.newPassword}
                      onChange={(e) => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      className="pf-input-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="pf-input-label">Confirm New Password</label>
                  <div className="pf-input-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="pf-input-field"
                      placeholder="Re-enter new password"
                      value={pwForm.confirm}
                      onChange={(e) => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      className="pf-input-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="pf-btn-submit" disabled={pwLoading}>
                  <Save size={16} />
                  {pwLoading ? 'Securing Credentials...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
