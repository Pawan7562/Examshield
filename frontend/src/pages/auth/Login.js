import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  GraduationCap,
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
  Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI, studentAPI } from '../../services/api';
import toast from 'react-hot-toast';
import PublicLayout from '../../components/public/PublicLayout';
import './Login.css';

const REMEMBER_KEY = 'examshield_saved_identifier';
const REMEMBER_ROLE_KEY = 'examshield_saved_role';

const Login = ({ role }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Determine initial role: prop role > path check > saved role > default 'admin'
  const getInitialRole = () => {
    if (role === 'student' || location.pathname.includes('/student')) return 'student';
    if (role === 'admin' || location.pathname.includes('/admin')) return 'admin';
    const savedRole = localStorage.getItem(REMEMBER_ROLE_KEY);
    return savedRole === 'student' ? 'student' : 'admin';
  };

  const [activeRole, setActiveRole] = useState(getInitialRole);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // College Admin Forgot Password Modal
  const [showAdminForgotModal, setShowAdminForgotModal] = useState(false);
  const [adminForgotStep, setAdminForgotStep] = useState('request'); // 'request' | 'reset'
  const [adminForgotEmail, setAdminForgotEmail] = useState('');
  const [adminResetToken, setAdminResetToken] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [adminForgotLoading, setAdminForgotLoading] = useState(false);
  const [adminForgotMsg, setAdminForgotMsg] = useState('');

  // Student Assistance Modal
  const [showStudentHelpModal, setShowStudentHelpModal] = useState(false);
  const [studentHelpIdentifier, setStudentHelpIdentifier] = useState('');
  const [studentHelpReason, setStudentHelpReason] = useState('Forgot account password');
  const [studentHelpNotes, setStudentHelpNotes] = useState('');
  const [studentHelpLoading, setStudentHelpLoading] = useState(false);
  const [studentHelpSuccess, setStudentHelpSuccess] = useState(null);

  const handleAdminForgotSubmit = async (e) => {
    e.preventDefault();
    if (!adminForgotEmail.trim()) {
      toast.error('Please enter your institutional email');
      return;
    }
    try {
      setAdminForgotLoading(true);
      const res = await authAPI.collegeForgotPassword({ email: adminForgotEmail.trim() });
      if (res.data?.success) {
        toast.success(res.data.message || 'Reset link sent to your email');
        setAdminForgotMsg(res.data.message);
        if (res.data?.data?.resetToken) {
          setAdminResetToken(res.data.data.resetToken);
          setAdminForgotStep('reset');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send reset link';
      toast.error(msg);
    } finally {
      setAdminForgotLoading(false);
    }
  };

  const handleAdminResetSubmit = async (e) => {
    e.preventDefault();
    if (!adminResetToken.trim()) {
      toast.error('Reset token is required');
      return;
    }
    if (adminNewPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (adminNewPassword !== adminConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      setAdminForgotLoading(true);
      const res = await authAPI.collegeResetPassword({
        token: adminResetToken.trim(),
        newPassword: adminNewPassword
      });
      if (res.data?.success) {
        toast.success('Admin password reset successfully! You can now log in.');
        setShowAdminForgotModal(false);
        setPassword('');
        if (adminForgotEmail) setIdentifier(adminForgotEmail);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to reset password';
      toast.error(msg);
    } finally {
      setAdminForgotLoading(false);
    }
  };

  const handleStudentHelpSubmit = async (e) => {
    e.preventDefault();
    const cleanId = (studentHelpIdentifier || identifier).trim();
    if (!cleanId) {
      toast.error('Please enter your Student ID, Roll No, or registered email');
      return;
    }
    try {
      setStudentHelpLoading(true);
      const res = await studentAPI.requestPasswordAssistance({
        studentIdOrEmail: cleanId,
        reason: `${studentHelpReason}${studentHelpNotes ? ' - ' + studentHelpNotes : ''}`
      });
      if (res.data?.success) {
        setStudentHelpSuccess(res.data);
        toast.success('Password assistance request sent to your College Administration');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit assistance request';
      toast.error(msg);
    } finally {
      setStudentHelpLoading(false);
    }
  };

  // Update activeRole if prop changes
  useEffect(() => {
    if (role) {
      setActiveRole(role);
    }
  }, [role]);

  // Load saved credentials on mount, role switch, or email link query params
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const emailParam = searchParams.get('email') || searchParams.get('identifier') || searchParams.get('studentId');
    const examKeyParam = searchParams.get('examKey') || searchParams.get('key');
    if (examKeyParam) {
      sessionStorage.setItem('pendingExamKey', examKeyParam);
    }

    if (emailParam) {
      setIdentifier(emailParam.trim());
      setRememberMe(true);
    } else {
      const saved = localStorage.getItem(`${REMEMBER_KEY}_${activeRole}`);
      if (saved) {
        setIdentifier(saved);
        setRememberMe(true);
      } else {
        setIdentifier('');
        setRememberMe(false);
      }
    }
    setErrorMessage('');
  }, [activeRole, location.search]);

  // Switch role handler
  const handleRoleChange = (newRole) => {
    if (newRole === activeRole) return;
    setActiveRole(newRole);
    setErrorMessage('');
    if (newRole === 'student' && location.pathname === '/admin/login') {
      navigate('/student/login', { replace: true });
    } else if (newRole === 'admin' && location.pathname === '/student/login') {
      navigate('/admin/login', { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || !password) {
      const msg = 'Please enter both your login identifier and password.';
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      const isStudent = activeRole === 'student';
      const res = isStudent
        ? await authAPI.studentLogin({ email: cleanIdentifier, password })
        : await authAPI.collegeLogin({ email: cleanIdentifier, password });

      // Save or clear rememberMe
      if (rememberMe) {
        localStorage.setItem(`${REMEMBER_KEY}_${activeRole}`, cleanIdentifier);
        localStorage.setItem(REMEMBER_ROLE_KEY, activeRole);
      } else {
        localStorage.removeItem(`${REMEMBER_KEY}_${activeRole}`);
      }

      // Check payload structure
      const payloadUser = res?.data?.user || res?.user;
      const payloadTokens = {
        accessToken: res?.data?.accessToken || res?.accessToken,
        refreshToken: res?.data?.refreshToken || res?.refreshToken,
      };

      if (!payloadTokens.accessToken) {
        throw new Error('Authentication succeeded but session token was missing. Please contact support.');
      }

      login(payloadUser, payloadTokens);

      toast.success(`Welcome back, ${payloadUser?.name || 'Administrator'}!`);
      navigate(isStudent ? '/student/dashboard' : '/admin/dashboard');
    } catch (err) {
      console.error('Login error details:', err);
      const displayMsg =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        (typeof err === 'string' ? err : 'Unable to sign in. Please verify your credentials.');

      setErrorMessage(displayMsg);
      toast.error(displayMsg);
    } finally {
      setLoading(false);
    }
  };

  const isStudent = activeRole === 'student';

  return (
    <PublicLayout className="exam-landing-theme">
      <section className="public-shell login-page-section" aria-labelledby="login-heading">
        <div className="login-shell-centered">
          {/* Eyebrow Pill */}
          <div className="login-eyebrow-pill">
            <ShieldCheck size={14} aria-hidden="true" />
            <span>Secure Examination &amp; Admin Access</span>
          </div>

          {/* Heading */}
          <div className="login-page-header">
            <h1 id="login-heading" className="login-page-title">
              {isStudent ? (
                <>
                  Student <span>Exam Portal</span>
                </>
              ) : (
                <>
                  Institution <span>Admin Sign In</span>
                </>
              )}
            </h1>
            <p className="login-page-subtitle">
              {isStudent
                ? 'Sign in with your Student ID or institutional email to access scheduled proctored exams.'
                : 'Access your college administrative console to orchestrate exams, monitor live candidates, and review AI proctoring logs.'}
            </p>
          </div>

          {/* Main Card */}
          <div className="login-card">
            {/* Role Tabs */}
            <div className="login-role-tabs" role="tablist" aria-label="Sign in role options">
              <button
                type="button"
                role="tab"
                aria-selected={!isStudent}
                className={`login-role-tab ${!isStudent ? 'active admin-active' : ''}`}
                onClick={() => handleRoleChange('admin')}
              >
                <Building2 size={16} aria-hidden="true" />
                <span>College Admin</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={isStudent}
                className={`login-role-tab ${isStudent ? 'active student-active' : ''}`}
                onClick={() => handleRoleChange('student')}
              >
                <GraduationCap size={16} aria-hidden="true" />
                <span>Student Portal</span>
              </button>
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
                <label htmlFor="login-identifier" className="login-field-label">
                  {isStudent ? 'Student ID / Roll No / Email' : 'Institutional Work Email'}
                </label>

                <div className="login-input-wrap">
                  <input
                    id="login-identifier"
                    type={isStudent ? 'text' : 'email'}
                    className="login-input"
                    placeholder={
                      isStudent
                        ? 'e.g. ES-2026-431532, 24205200, or student@mail.edu'
                        : 'admin@university.edu'
                    }
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    autoFocus
                    autoComplete={isStudent ? 'username' : 'email'}
                    required
                  />
                  <span className="login-input-icon" aria-hidden="true">
                    {isStudent ? <GraduationCap size={18} /> : <Mail size={18} />}
                  </span>
                </div>
                <span className="login-field-helper">
                  {isStudent
                    ? 'Accepted: ExamShield Student ID, University Roll Number, or registered email.'
                    : 'Enter the registered administrator email for your college.'}
                </span>
              </div>

              <div className="login-field-group">
                <div className="login-label-row">
                  <label htmlFor="login-password" className="login-field-label">
                    Password
                  </label>

                  {isStudent ? (
                    <button
                      type="button"
                      id="student-assistance-button"
                      onClick={() => {
                        setStudentHelpIdentifier(identifier);
                        setStudentHelpSuccess(null);
                        setShowStudentHelpModal(true);
                      }}
                      className="login-forgot-link"
                      title="Request assistance from College Administration"
                    >
                      Need Login Help?
                    </button>
                  ) : (
                    <button
                      type="button"
                      id="admin-forgot-password-button"
                      onClick={() => {
                        setAdminForgotEmail(identifier && identifier.includes('@') ? identifier : '');
                        setAdminForgotStep('request');
                        setAdminForgotMsg('');
                        setShowAdminForgotModal(true);
                      }}
                      className="login-forgot-link"
                      title="Reset your administrator password"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>

                <div className="login-input-wrap">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="login-input"
                    placeholder="Enter your secret account password"
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
                  <span>Remember my {isStudent ? 'Student ID' : 'email'}</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="login-submit-button"
                id="login-submit-button"
              >
                {loading ? (
                  <>
                    <Loader2 className="login-spin" size={19} />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In as {isStudent ? 'Student' : 'College Admin'}</span>
                    <ArrowRight size={17} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            {/* Trust Footer */}
            <div className="login-card-trust">
              <div className="login-card-trust-item">
                <ShieldCheck size={14} aria-hidden="true" />
                <span>Anti-Cheating Kiosk Active</span>
              </div>
              <div className="login-card-trust-item">
                <CheckCircle2 size={14} aria-hidden="true" />
                <span>ISO 27001 Certified</span>
              </div>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="login-meta-nav">
            {!isStudent && (
              <p className="login-meta-text">
                Looking to deploy ExamShield for your institution?{' '}
                <Link to="/admin/register">Register your college (14-day free trial)</Link>
              </p>
            )}

            {isStudent && (
              <p className="login-meta-text">
                First time taking an exam? Your credentials were emailed by your college examination controller.
              </p>
            )}

            <div className="login-quick-links">
              <Link to="/">← Back to Homepage</Link>
              <span className="login-dot">•</span>
              <Link to="/super-admin/login">Super Admin Console</Link>
              <span className="login-dot">•</span>
              <Link to="/contact">Need Support?</Link>
            </div>
          </div>
        </div>
      </section>

      {/* College Admin Password Reset Modal */}
      {showAdminForgotModal && (
        <div className="login-modal-overlay" onClick={() => setShowAdminForgotModal(false)}>
          <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="login-modal-header">
              <div className="login-modal-title">
                <Building2 size={20} color="#0a74da" />
                <span>College Admin Password Reset</span>
              </div>
              <button
                type="button"
                className="login-modal-close"
                onClick={() => setShowAdminForgotModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="login-modal-body">
              <div className="login-modal-tabs">
                <button
                  type="button"
                  className={`login-modal-tab ${adminForgotStep === 'request' ? 'active' : ''}`}
                  onClick={() => setAdminForgotStep('request')}
                >
                  1. Request Reset Link
                </button>
                <button
                  type="button"
                  className={`login-modal-tab ${adminForgotStep === 'reset' ? 'active' : ''}`}
                  onClick={() => setAdminForgotStep('reset')}
                >
                  2. Enter Reset Token
                </button>
              </div>

              {adminForgotStep === 'request' ? (
                <form onSubmit={handleAdminForgotSubmit}>
                  <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 16px' }}>
                    Enter your registered college administrator email. We will generate a secure reset link to restore your institutional access.
                  </p>

                  <div className="login-field-group" style={{ marginBottom: '16px' }}>
                    <label className="login-field-label">Institutional Email</label>
                    <div className="login-input-wrap">
                      <input
                        type="email"
                        className="login-input"
                        placeholder="admin@college.edu"
                        value={adminForgotEmail}
                        onChange={(e) => setAdminForgotEmail(e.target.value)}
                        required
                        autoFocus
                      />
                      <span className="login-input-icon">
                        <Mail size={18} />
                      </span>
                    </div>
                  </div>

                  {adminForgotMsg && (
                    <div style={{
                      padding: '12px 14px',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      color: '#065f46',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <CheckCircle2 size={16} color="#059669" />
                      <span>{adminForgotMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={adminForgotLoading}
                    className="login-submit-button"
                    style={{ width: '100%', marginBottom: '10px' }}
                  >
                    {adminForgotLoading ? 'Sending Instructions...' : 'Send Password Reset Link'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setAdminForgotStep('reset')}
                      style={{ background: 'none', border: 'none', color: '#0a74da', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Already have a reset token? Enter token →
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAdminResetSubmit}>
                  <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 16px' }}>
                    Provide the security token sent to your institutional email, then choose a strong new password.
                  </p>

                  <div className="login-field-group" style={{ marginBottom: '12px' }}>
                    <label className="login-field-label">Reset Token</label>
                    <div className="login-input-wrap">
                      <input
                        type="text"
                        className="login-input"
                        placeholder="Paste security token"
                        value={adminResetToken}
                        onChange={(e) => setAdminResetToken(e.target.value)}
                        required
                      />
                      <span className="login-input-icon">
                        <KeyRound size={18} />
                      </span>
                    </div>
                  </div>

                  <div className="login-field-group" style={{ marginBottom: '12px' }}>
                    <label className="login-field-label">New Password (min 8 characters)</label>
                    <div className="login-input-wrap">
                      <input
                        type="password"
                        className="login-input"
                        placeholder="Enter new password"
                        value={adminNewPassword}
                        onChange={(e) => setAdminNewPassword(e.target.value)}
                        required
                      />
                      <span className="login-input-icon">
                        <Lock size={18} />
                      </span>
                    </div>
                  </div>

                  <div className="login-field-group" style={{ marginBottom: '18px' }}>
                    <label className="login-field-label">Confirm New Password</label>
                    <div className="login-input-wrap">
                      <input
                        type="password"
                        className="login-input"
                        placeholder="Re-enter new password"
                        value={adminConfirmPassword}
                        onChange={(e) => setAdminConfirmPassword(e.target.value)}
                        required
                      />
                      <span className="login-input-icon">
                        <Lock size={18} />
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={adminForgotLoading}
                    className="login-submit-button"
                    style={{ width: '100%', marginBottom: '10px' }}
                  >
                    {adminForgotLoading ? 'Updating Password...' : 'Save New Password & Log In'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setAdminForgotStep('request')}
                      style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.84rem', cursor: 'pointer' }}
                    >
                      ← Back to Email Request
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student Assistance Request Modal */}
      {showStudentHelpModal && (
        <div className="login-modal-overlay" onClick={() => setShowStudentHelpModal(false)}>
          <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="login-modal-header">
              <div className="login-modal-title">
                <GraduationCap size={22} color="#0a74da" />
                <span>Student Login &amp; Password Assistance</span>
              </div>
              <button
                type="button"
                className="login-modal-close"
                onClick={() => setShowStudentHelpModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="login-modal-body">
              {studentHelpSuccess ? (
                <div style={{ textAlign: 'center', padding: '12px 6px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <CheckCircle2 size={34} />
                  </div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                    Assistance Request Logged
                  </h4>
                  <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 20px' }}>
                    {studentHelpSuccess.message || 'Your College Administration has received your password reset assistance request. They can securely reset your credentials and dispatch new login details to your official email.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStudentHelpModal(false);
                      setStudentHelpSuccess(null);
                    }}
                    className="login-submit-button"
                    style={{ width: '100%' }}
                  >
                    Got It, Return to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleStudentHelpSubmit}>
                  <div style={{
                    padding: '12px 14px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    color: '#1e40af',
                    lineHeight: 1.5,
                    marginBottom: '18px'
                  }}>
                    🛡️ <strong>Exam Integrity Policy:</strong> Student password resets are centrally managed by your college examination controller to prevent unauthorized exam access. Request assistance below if you are locked out.
                  </div>

                  <div className="login-field-group" style={{ marginBottom: '14px' }}>
                    <label className="login-field-label">Student ID, University Roll No, or Email *</label>
                    <div className="login-input-wrap">
                      <input
                        type="text"
                        className="login-input"
                        placeholder="e.g. ES-2026-431532, 24205200, or student@mail.edu"
                        value={studentHelpIdentifier}
                        onChange={(e) => setStudentHelpIdentifier(e.target.value)}
                        required
                        autoFocus
                      />
                      <span className="login-input-icon">
                        <GraduationCap size={18} />
                      </span>
                    </div>
                  </div>

                  <div className="login-field-group" style={{ marginBottom: '14px' }}>
                    <label className="login-field-label">Reason for Assistance</label>
                    <select
                      className="login-input"
                      style={{ paddingLeft: '14px', paddingRight: '14px' }}
                      value={studentHelpReason}
                      onChange={(e) => setStudentHelpReason(e.target.value)}
                    >
                      <option value="Forgot account password">Forgot account password</option>
                      <option value="Device changed or locked out">Device changed or locked out</option>
                      <option value="Never received initial credentials">Never received initial credentials</option>
                      <option value="Suspected unauthorized account access">Suspected unauthorized account access</option>
                      <option value="Other login assistance">Other login issue</option>
                    </select>
                  </div>

                  <div className="login-field-group" style={{ marginBottom: '20px' }}>
                    <label className="login-field-label">Additional Note / Phone (Optional)</label>
                    <input
                      type="text"
                      className="login-input"
                      style={{ paddingLeft: '14px' }}
                      placeholder="e.g. Phone number or urgent exam scheduled today"
                      value={studentHelpNotes}
                      onChange={(e) => setStudentHelpNotes(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={studentHelpLoading}
                    className="login-submit-button"
                    style={{ width: '100%', marginBottom: '10px' }}
                  >
                    {studentHelpLoading ? (
                      <>
                        <Loader2 className="login-spin" size={18} />
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Submit Request to College Admin</span>
                      </>
                    )}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setShowStudentHelpModal(false)}
                      style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.84rem', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  );
};

export default Login;
