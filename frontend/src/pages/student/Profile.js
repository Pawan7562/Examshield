// src/pages/student/Profile.js
import React, { useEffect, useState } from 'react';
import { studentAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    studentAPI.getProfile().then(r => setProfile(r.data.profile)).catch(() => {});
  }, []);

  const handlePwChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 8) return toast.error('Password must be 8+ characters');
    setPwLoading(true);
    try {
      await studentAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const inpStyle = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, fontFamily: 'Sora, sans-serif' };

  if (!profile) return <div style={{ textAlign: 'center', padding: 60, color: '#4a5568' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 24 }}>My Profile</h1>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#e94560,#9b2335)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'white' }}>
            {profile.name?.charAt(0)}
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>{profile.name}</h2>
            <p style={{ fontSize: 12, color: '#4a5568', fontFamily: 'monospace' }}>{profile.student_id}</p>
            <p style={{ fontSize: 12, color: '#718096' }}>{profile.college_name}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            ['Email', profile.email],
            ['Roll Number', profile.roll_no],
            ['Department', profile.department || '—'],
            ['Semester', profile.semester || '—'],
            ['Batch', profile.batch || '—'],
            ['Last Login', profile.last_login ? new Date(profile.last_login).toLocaleDateString() : 'First time'],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#4a5568', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 14, color: '#e2e8f0' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 }}>Change Password</h3>
        <form onSubmit={handlePwChange}>
          {[
            ['Current Password', 'currentPassword'],
            ['New Password', 'newPassword'],
            ['Confirm New Password', 'confirm'],
          ].map(([label, key]) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</label>
              <input type="password" value={pwForm[key]} onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))} required style={inpStyle} />
            </div>
          ))}
          <button type="submit" disabled={pwLoading} style={{ background: 'linear-gradient(135deg,#e94560,#c62a47)', border: 'none', borderRadius: 8, padding: '11px 24px', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Sora, sans-serif' }}>
            {pwLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      <style>{`input:focus{outline:none;border-color:#e94560!important;}`}</style>
    </div>
  );
}
