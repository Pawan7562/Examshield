import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  X,
  CheckCircle2,
  Loader2,
  KeyRound,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import PublicLayout from '../../components/public/PublicLayout';
import './Login.css';

export default function SuperAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      const msg = 'Please enter both your Super Admin email and master password.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      const res = await authAPI.superAdminLogin({ email: cleanEmail, password });

      const payloadUser = res?.data?.user || res?.user;
      const payloadTokens = {
        accessToken: res?.data?.accessToken || res?.accessToken,
        refreshToken: res?.data?.refreshToken || res?.refreshToken,
      };

      if (!payloadTokens.accessToken) {
        throw new Error('Authentication succeeded but session token was missing. Please contact support.');
      }

      login(payloadUser, payloadTokens);
      toast.success(`Welcome back, Master Administrator!`);
      navigate('/super-admin/dashboard');
    } catch (err) {
      console.error('Super Admin login error:', err);
      const displayMsg =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        (typeof err === 'string' ? err : 'Super admin authentication failed. Please verify credentials.');

      setErrorMessage(displayMsg);
      toast.error(displayMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout className="exam-landing-theme">
      <section className="public-shell login-page-section" aria-labelledby="super-admin-heading">
        <div className="login-shell-centered">
          {/* Eyebrow Pill */}
          <div className="login-eyebrow-pill" style={{ borderColor: 'rgba(234, 88, 12, 0.4)', color: '#c2410c' }}>
            <ShieldAlert size={14} style={{ color: '#ea580c' }} aria-hidden="true" />
            <span>Internal Platform Administration</span>
          </div>

          {/* Heading */}
          <div className="login-page-header">
            <h1 id="super-admin-heading" className="login-page-title">
              Super Admin <span>Console</span>
            </h1>
            <p className="login-page-subtitle">
              Restricted platform management console for multi-tenant oversight, college approvals, subscription billing, and global telemetry.
            </p>
          </div>

          {/* Main Card */}
          <div className="login-card" style={{ borderTop: '4px solid #ea580c' }}>
            {/* Header pill indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px 14px',
                background: '#fff7ed',
                borderRadius: '8px',
                color: '#c2410c',
                fontSize: '0.82rem',
                fontWeight: 700,
                marginBottom: '20px',
                border: '1px solid rgba(234, 88, 12, 0.2)',
              }}
            >
              <KeyRound size={15} />
              <span>Root Privilege Access Required</span>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="login-error-banner" role="alert">
                <AlertCircle />
                <div>{errorMessage}</div>
                <button
                  type="button"
                  className="login-error-close"
                  onClick={() => setErrorMessage('')}
                  title="Dismiss error"
                  aria-label="Dismiss"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="login-form" noValidate>
              <div className="login-field-group">
                <label htmlFor="super-admin-email" className="login-field-label">
                  Super Admin Work Email
                </label>

                <div className="login-input-wrap">
                  <input
                    id="super-admin-email"
                    type="email"
                    className="login-input"
                    placeholder="superadmin@examshield.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    autoFocus
                    autoComplete="email"
                    required
                  />
                  <span className="login-input-icon" aria-hidden="true">
                    <Mail size={18} />
                  </span>
                </div>
                <span className="login-field-helper">
                  Use your provisioned internal staff credentials.
                </span>
              </div>

              <div className="login-field-group">
                <div className="login-label-row">
                  <label htmlFor="super-admin-password" className="login-field-label">
                    Master Password
                  </label>
                  <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>2FA Protected</span>
                </div>

                <div className="login-input-wrap">
                  <input
                    id="super-admin-password"
                    type={showPassword ? 'text' : 'password'}
                    className="login-input"
                    placeholder="Enter platform master password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    autoComplete="current-password"
                    required
                  />
                  <span className="login-input-icon" aria-hidden="true">
                    <Lock size={18} />
                  </span>
                  <button
                    type="button"
                    className="login-toggle-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="login-options-row">
                <label className="login-checkbox-label">
                  <input
                    type="checkbox"
                    className="login-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember admin identifier</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="login-submit-button"
                id="super-admin-submit-button"
                style={{
                  background: 'linear-gradient(180deg, #ea580c 0%, #c2410c 100%)',
                  color: '#ffffff',
                  boxShadow: '0 12px 24px rgba(234, 88, 12, 0.28)',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="login-spin" size={19} />
                    <span>Authorizing Master Key...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Super Admin Console</span>
                    <ArrowRight size={17} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            {/* Trust Footer */}
            <div className="login-card-trust">
              <div className="login-card-trust-item">
                <ShieldCheck size={14} />
                <span>Dual Hardware Key Enforced</span>
              </div>
              <div className="login-card-trust-item">
                <CheckCircle2 size={14} />
                <span>Immutable Audit Logs</span>
              </div>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="login-meta-nav">
            <div className="login-quick-links">
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Building2 size={14} /> College Admin Sign In
              </Link>
              <span className="login-dot">•</span>
              <Link to="/student/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <GraduationCap size={14} /> Student Exam Portal
              </Link>
              <span className="login-dot">•</span>
              <Link to="/">← Back to Homepage</Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
