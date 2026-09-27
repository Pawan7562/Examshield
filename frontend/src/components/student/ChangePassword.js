import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle, 
  Shield, 
  HelpCircle, 
  Send, 
  Clock, 
  CheckCircle2, 
  Building2,
  RefreshCw
} from 'lucide-react';
import { studentAPI } from '../../services/api';
import './ChangePassword.css';

const ChangePassword = () => {
  const [activeMode, setActiveMode] = useState('change'); // 'change' | 'forgot'
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Change password form state
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Forgot password assistance state
  const [reason, setReason] = useState('Forgot current login password');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  useEffect(() => {
    if (activeMode === 'forgot') {
      fetchMyRequests();
    }
  }, [activeMode]);

  const fetchMyRequests = async () => {
    try {
      setRequestsLoading(true);
      const res = await studentAPI.getMyPasswordRequests();
      if (res.data?.success) {
        setMyRequests(res.data.data?.requests || []);
      }
    } catch (err) {
      console.error('Failed to load password requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '', color: '' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const strengthLevels = [
      { text: 'Very Weak', color: 'text-red-500' },
      { text: 'Weak', color: 'text-orange-500' },
      { text: 'Fair', color: 'text-yellow-500' },
      { text: 'Good', color: 'text-blue-500' },
      { text: 'Strong', color: 'text-green-500' },
      { text: 'Very Strong', color: 'text-green-600' }
    ];

    return {
      strength: (strength / 6) * 100,
      text: strengthLevels[Math.min(strength - 1, 5)]?.text || 'Very Weak',
      color: strengthLevels[Math.min(strength - 1, 5)]?.color || 'text-red-500'
    };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.newPassword || !formData.confirmPassword) {
      toast.error('Please enter your new password and confirmation');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const res = await studentAPI.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Password changed successfully!');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(res.data?.message || 'Failed to change password');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update password';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    try {
      setRequestLoading(true);
      const res = await studentAPI.requestPasswordAssistance({
        reason: `${reason}${additionalNotes ? ' — ' + additionalNotes : ''}`
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Password reset request submitted to your College Administration.');
        setAdditionalNotes('');
        fetchMyRequests();
      } else {
        toast.error(res.data?.message || 'Failed to submit assistance request');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit password reset request';
      toast.error(msg);
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      {/* Header Tabs */}
      <div style={{
        display: 'flex',
        background: '#f1f5f9',
        padding: '6px',
        borderRadius: '12px',
        gap: '6px',
        marginBottom: '24px'
      }}>
        <button
          type="button"
          onClick={() => setActiveMode('change')}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: activeMode === 'change' ? '#ffffff' : 'transparent',
            color: activeMode === 'change' ? '#0f172a' : '#64748b',
            boxShadow: activeMode === 'change' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <Lock size={16} color={activeMode === 'change' ? '#0a74da' : '#64748b'} />
          Change Password
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('forgot')}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: activeMode === 'forgot' ? '#ffffff' : 'transparent',
            color: activeMode === 'forgot' ? '#0f172a' : '#64748b',
            boxShadow: activeMode === 'forgot' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <HelpCircle size={16} color={activeMode === 'forgot' ? '#0a74da' : '#64748b'} />
          Forgot Password / Admin Reset
        </button>
      </div>

      {activeMode === 'change' ? (
        <div>
          <div className="change-password-header">
            <div className="change-password-icon">
              <Shield className="w-6 h-6" />
            </div>
            <div className="change-password-title">
              <h2>Change Account Password</h2>
              <p>Choose a strong new password to protect your candidate account and examination sessions.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="change-password-form">
            {/* Current Password */}
            <div className="form-group">
              <label className="form-label">
                Current Password <span style={{ color: '#64748b', fontWeight: 'normal' }}>(Optional if initial login)</span>
              </label>
              <div className="form-input-wrapper">
                <Lock className="form-input-icon" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter current password if set"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="form-input-toggle"
                  disabled={loading}
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="form-group">
              <label className="form-label">New Password *</label>
              <div className="form-input-wrapper">
                <Lock className="form-input-icon" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Minimum 6 characters"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="form-input-toggle"
                  disabled={loading}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {formData.newPassword && (
                <div className="password-strength">
                  <div className="password-strength-header">
                    <span className="password-strength-label">Security Level</span>
                    <span className={`password-strength-text ${passwordStrength.color}`}>
                      {passwordStrength.text}
                    </span>
                  </div>
                  <div className="password-strength-bar">
                    <div
                      className={`password-strength-fill ${
                        passwordStrength.strength <= 33 ? 'weak' :
                        passwordStrength.strength <= 66 ? 'fair' : 'strong'
                      }`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <div className="form-input-wrapper">
                <Lock className="form-input-icon" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Re-enter new password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="form-input-toggle"
                  disabled={loading}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.newPassword || formData.newPassword !== formData.confirmPassword}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: '#0a74da',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.94rem',
                cursor: 'pointer',
                marginTop: '10px',
                transition: 'all 0.2s',
                opacity: (loading || !formData.newPassword || formData.newPassword !== formData.confirmPassword) ? 0.6 : 1
              }}
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>
      ) : (
        <div>
          <div className="change-password-header">
            <div className="change-password-icon" style={{ background: 'linear-gradient(135deg, #0a74da 0%, #0284c7 100%)' }}>
              <Building2 className="w-6 h-6" />
            </div>
            <div className="change-password-title">
              <h2>Forgot Password? Request Admin Reset</h2>
              <p>Request password recovery or credential reset directly from your college examination administration.</p>
            </div>
          </div>

          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '18px 20px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
              How Does Student Password Recovery Work?
            </h4>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', lineHeight: 1.55 }}>
              Under strict anti-cheating regulations, candidate credentials are monitored and validated by your College Exam Cell. 
              Submitting this request alerts your College Administrator to verify your student profile and dispatch an updated temporary password or reset notification.
            </p>
          </div>

          <form onSubmit={handleForgotSubmit} className="change-password-form">
            <div className="form-group">
              <label className="form-label">Reason for Password Reset Assistance</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '14px' }}
              >
                <option value="Forgot current login password">Forgot current login password</option>
                <option value="Suspected unauthorized access / security concern">Suspected unauthorized access / security concern</option>
                <option value="Device changed / authentication issue">Device changed / authentication issue</option>
                <option value="Need credentials re-issued before upcoming examination">Need credentials re-issued before upcoming exam</option>
                <option value="Other assistance">Other assistance</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Additional Note for College Administrator (Optional)</label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Mention any relevant details (e.g. date of your next exam, registered phone number)..."
                rows={3}
                className="form-input"
                style={{ padding: '10px 14px', resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              disabled={requestLoading}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: '#0a74da',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.94rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                opacity: requestLoading ? 0.7 : 1
              }}
            >
              <Send size={16} />
              {requestLoading ? 'Submitting Request...' : 'Send Password Reset Request to College Admin'}
            </button>
          </form>

          {/* Past Requests Section */}
          <div style={{ marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#0a74da" />
                Your Password Assistance Requests
              </h3>
              <button
                type="button"
                onClick={fetchMyRequests}
                style={{ background: 'none', border: 'none', color: '#0a74da', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RefreshCw size={13} className={requestsLoading ? 'spin' : ''} />
                Refresh
              </button>
            </div>

            {requestsLoading ? (
              <p style={{ fontSize: '0.86rem', color: '#64748b' }}>Checking request status...</p>
            ) : myRequests.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '24px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px dashed #cbd5e1'
              }}>
                <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748b' }}>
                  No active password reset requests logged. If you ever lose or forget your credentials, you can submit one here anytime.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      padding: '14px 16px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                          {req.reason || 'Password Reset Assistance'}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          textTransform: 'uppercase',
                          background: req.status === 'resolved' ? '#ecfdf5' : req.status === 'pending' ? '#fef3c7' : '#f1f5f9',
                          color: req.status === 'resolved' ? '#059669' : req.status === 'pending' ? '#d97706' : '#64748b'
                        }}>
                          {req.status}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                        Submitted on {new Date(req.created_at).toLocaleDateString()} at {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {req.admin_notes && (
                        <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: '#059669', background: '#ecfdf5', padding: '4px 8px', borderRadius: '6px' }}>
                          <strong>Admin Note:</strong> {req.admin_notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangePassword;
