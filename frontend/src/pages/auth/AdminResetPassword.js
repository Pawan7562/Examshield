import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, Building, KeyRound } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authAPI } from '../../services/api';
import './Login.css';

export default function AdminResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token.trim()) {
      setError('Please provide a valid administrator reset token.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long for institutional security.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please re-enter.');
      return;
    }

    try {
      setLoading(true);
      const res = await authAPI.collegeResetPassword({
        token: token.trim(),
        newPassword
      });

      if (res.data?.success) {
        setSuccess(true);
        toast.success('Administrator password updated successfully!');
      } else {
        setError(res.data?.message || 'Failed to reset administrator password.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to reset password. The link may have expired.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-section" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="login-shell-centered" style={{ width: '100%', maxWidth: '480px' }}>
        <div className="login-eyebrow-pill">
          <Building size={14} />
          <span>College Administration Portal</span>
        </div>

        <div className="login-page-header">
          <h1 className="login-page-title">
            Reset <span>Admin Password</span>
          </h1>
          <p className="login-page-subtitle">
            Set a new secure password for your institution's ExamShield administrative account.
          </p>
        </div>

        <div className="login-card">
          {success ? (
            <div style={{ textAlign: 'center', padding: '16px 8px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <CheckCircle2 size={36} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                Password Updated Successfully
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5, marginBottom: '24px' }}>
                Your institutional administrator credentials have been securely updated. You can now log into your college dashboard.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login?role=admin')}
                className="login-submit-button"
                style={{ width: '100%' }}
              >
                <span>Proceed to College Login</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              {error && (
                <div className="login-error-banner" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <div>{error}</div>
                </div>
              )}

              {!tokenFromUrl && (
                <div className="login-field-group">
                  <label htmlFor="reset-token" className="login-field-label">
                    Administrator Reset Token
                  </label>
                  <div className="login-input-wrap">
                    <input
                      id="reset-token"
                      type="text"
                      className="login-input"
                      placeholder="Paste your reset token here"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      required
                    />
                    <span className="login-input-icon">
                      <KeyRound size={18} />
                    </span>
                  </div>
                </div>
              )}

              <div className="login-field-group">
                <label htmlFor="new-password" className="login-field-label">
                  New Admin Password (min 8 chars)
                </label>
                <div className="login-input-wrap">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    className="login-input"
                    placeholder="Enter new administrator password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <span className="login-input-icon">
                    <Lock size={18} />
                  </span>
                  <button
                    type="button"
                    className="login-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="login-field-group">
                <label htmlFor="confirm-password" className="login-field-label">
                  Confirm New Password
                </label>
                <div className="login-input-wrap">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="login-input"
                    placeholder="Confirm new administrator password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <span className="login-input-icon">
                    <Lock size={18} />
                  </span>
                  <button
                    type="button"
                    className="login-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="login-submit-button"
                style={{ marginTop: '12px' }}
              >
                {loading ? 'Updating Credentials...' : 'Save New Administrator Password'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Link to="/login?role=admin" style={{ fontSize: '0.85rem', color: '#0a74da', textDecoration: 'none', fontWeight: 600 }}>
                  ← Back to College Admin Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
