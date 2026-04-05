import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './AuthTheme.css';

const Login = ({ role }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const isStudent = role === 'student';
  const isAdmin = role === 'admin' || !role;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      const res = isStudent
        ? await authAPI.studentLogin({ email, password })
        : await authAPI.collegeLogin({ email, password });

      login(res.data.user, { accessToken: res.data.accessToken, refreshToken: res.data.refreshToken });
      toast.success('Login successful!');
      navigate(isStudent ? '/student/dashboard' : '/admin/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-theme-page">
      <div className="auth-theme-glow auth-theme-glow-top" />
      <div className="auth-theme-glow auth-theme-glow-bottom" />

      <div className="auth-theme-card">
        <Link to="/" className="auth-theme-brand">
          <span className="auth-theme-brand-mark">
            <span className="auth-theme-brand-dot" />
          </span>
          <span className="auth-theme-brand-text">Exam Monitoring</span>
        </Link>

        <h1 className="auth-theme-title">{isStudent ? 'Student Login' : 'Admin Login'}</h1>
        <p className="auth-theme-subtitle">
          {isStudent
            ? 'Enter the credentials shared by your institution.'
            : 'Access your secure exam monitoring dashboard.'}
        </p>

        <form onSubmit={handleSubmit} className="auth-theme-form">
          <div className="auth-theme-field">
            <label className="auth-theme-label">Email Address</label>
            <input
              className="auth-theme-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoFocus
              required
            />
          </div>

          <div className="auth-theme-field">
            <label className="auth-theme-label">Password</label>
            <div className="auth-theme-input-wrap">
              <input
                className="auth-theme-input auth-theme-input-with-button"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                className="auth-theme-toggle"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-theme-button">
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {isAdmin && (
          <p className="auth-theme-meta">
            Do not have an account? <Link to="/admin/register">Register your college</Link>
          </p>
        )}

        {isStudent && (
          <p className="auth-theme-meta">
            <Link to="/student/password-reset">Forgot Password?</Link>
          </p>
        )}

        <div className="auth-theme-divider">
          <span>or</span>
        </div>

        <div className="auth-theme-link-row">
          {isStudent ? (
            <Link to="/admin/login">Admin Login</Link>
          ) : (
            <Link to="/student/login">Student Login</Link>
          )}
          <Link to="/">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
