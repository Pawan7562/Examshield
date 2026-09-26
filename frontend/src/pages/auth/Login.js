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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
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

  // Update activeRole if prop changes
  useEffect(() => {
    if (role) {
      setActiveRole(role);
    }
  }, [role]);

  // Load saved credentials on mount or role switch
  useEffect(() => {
    const saved = localStorage.getItem(`${REMEMBER_KEY}_${activeRole}`);
    if (saved) {
      setIdentifier(saved);
      setRememberMe(true);
    } else {
      setIdentifier('');
      setRememberMe(false);
    }
    setErrorMessage('');
  }, [activeRole]);

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
                    <Link to="/student/password-reset" className="login-forgot-link">
                      Forgot password?
                    </Link>
                  ) : (
                    <a
                      href="mailto:support@examshield.com?subject=Admin%20Password%20Reset%20Request"
                      className="login-forgot-link"
                      title="Contact ExamShield Support"
                    >
                      Need help?
                    </a>
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
    </PublicLayout>
  );
};

export default Login;
