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
      if (!isStudent && err.message?.includes('Unauthorized: No active administrator account')) {
        toast.custom((t) => (
          <div style={{
            background: '#0f172a', border: '1px solid #334155', borderRadius: '16px',
            padding: '28px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', textAlign: 'center', maxWidth: '380px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)', fontFamily: "'Inter', sans-serif",
            animation: t.visible ? 'er-enter 0.3s ease-out' : 'er-leave 0.3s ease-in forwards'
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <span style={{ fontSize: '24px' }}>🔒</span>
            </div>
            <h3 style={{ margin: '0 0 10px', color: '#f87171', fontSize: '19px', fontWeight: '800', letterSpacing: '-0.3px' }}>Access Denied</h3>
            <p style={{ margin: '0 0 24px', color: '#94a3b8', fontSize: '13.5px', lineHeight: '1.6', fontWeight: '500' }}>
              No active administrator account was found with this email. If you are a student, please use the correct portal.
            </p>
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button 
                type="button"
                onClick={() => { toast.dismiss(t.id); navigate('/student/login'); }}
                style={{ 
                  flex: 1, padding: '12px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer',
                  fontSize: '13px', transition: 'opacity 0.2s'
                }}
              >
                Student Login
              </button>
              <button 
                type="button"
                onClick={() => toast.dismiss(t.id)}
                style={{ 
                  flex: 1, padding: '12px', background: 'rgba(255,255,255,0.03)', color: '#cbd5e1', 
                  border: '1px solid #334155', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
                  fontSize: '13px', transition: 'background 0.2s'
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        ), { duration: 8000 });
      } else {
        toast.error(err.message || 'Login failed', {
          style: { background: '#1e293b', color: '#f87171', border: '1px solid #334155' }
        });
      }
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
