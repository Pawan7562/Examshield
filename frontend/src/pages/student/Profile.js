// src/pages/student/Profile.js
import React, { useEffect, useState } from 'react';
import { studentAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Calendar, 
  BookOpen, 
  Shield, 
  Lock, 
  Eye, 
  EyeOff,
  Save,
  Camera
} from 'lucide-react';
import '../../components/student/StudentSidebar.css';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAPI.getProfile().then(r => {
      setProfile(r.data.profile);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const handlePwChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('Password must be 8+ characters');
      return;
    }
    setPwLoading(true);
    try {
      await studentAPI.changePassword({ 
        currentPassword: pwForm.currentPassword, 
        newPassword: pwForm.newPassword 
      });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="student-pages-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading your profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="content-card">
        <div className="card-header">
          <h1>My Profile</h1>
          <p>Manage your personal information and security</p>
        </div>
      </div>

      {/* Profile Information */}
      <div className="content-card">
        <div className="card-title">
          <User size={20} />
          Personal Information
        </div>

        <div className="profile-section">
          <div className="profile-header">
            <div className="profile-avatar">
              {profile?.name?.charAt(0) || 'S'}
            </div>
            <div className="profile-info">
              <h3>{profile?.name}</h3>
              <p>{profile?.student_id}</p>
              <p>{profile?.college_name}</p>
            </div>
            <button className="btn btn-secondary">
              <Camera size={16} />
              Change Photo
            </button>
          </div>

          <div className="profile-details">
            <div className="detail-grid">
              <div className="detail-item">
                <Mail size={16} />
                <div>
                  <div className="detail-label">Email Address</div>
                  <div className="detail-value">{profile?.email}</div>
                </div>
              </div>
              <div className="detail-item">
                <BookOpen size={16} />
                <div>
                  <div className="detail-label">Roll Number</div>
                  <div className="detail-value">{profile?.roll_no || 'Not assigned'}</div>
                </div>
              </div>
              <div className="detail-item">
                <Calendar size={16} />
                <div>
                  <div className="detail-label">Department</div>
                  <div className="detail-value">{profile?.department || 'Not specified'}</div>
                </div>
              </div>
              <div className="detail-item">
                <Shield size={16} />
                <div>
                  <div className="detail-label">Semester</div>
                  <div className="detail-value">{profile?.semester || 'Not specified'}</div>
                </div>
              </div>
              <div className="detail-item">
                <User size={16} />
                <div>
                  <div className="detail-label">Batch</div>
                  <div className="detail-value">{profile?.batch || 'Not specified'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="content-card">
        <div className="card-title">
          <Lock size={20} />
          Security Settings
        </div>

        <form onSubmit={handlePwChange} className="password-change-form">
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <div className="form-input-wrapper">
              <Lock className="form-input-icon" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                className="form-input"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="form-input-toggle"
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <div className="form-input-wrapper">
              <Lock className="form-input-icon" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={pwForm.newPassword}
                onChange={(e) => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                className="form-input"
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="form-input-toggle"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <div className="form-input-wrapper">
              <Lock className="form-input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={pwForm.confirm}
                onChange={(e) => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                className="form-input"
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="form-input-toggle"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={pwLoading}
            className="btn"
          >
            {pwLoading ? (
              <div className="loading-spinner" style={{ width: '16px', height: '16px', marginRight: '0.5rem' }}></div>
            ) : (
              <Save size={16} />
            )}
            {pwLoading ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
