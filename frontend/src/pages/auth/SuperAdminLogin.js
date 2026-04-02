import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './AuthTheme.css';

export default function SuperAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.superAdminLogin({ email, password });
      login(res.data.user, { accessToken: res.data.accessToken, refreshToken: res.data.refreshToken });
      navigate('/super-admin/dashboard');
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

      <div className="auth-theme-card" style={{ maxWidth: 420 }}>
        <div className="auth-theme-icon-top">A</div>
        <Link to="/" className="auth-theme-brand">
          <span className="auth-theme-brand-mark">
            <span className="auth-theme-brand-dot" />
          </span>
          <span className="auth-theme-brand-text">Exam Monitoring</span>
        </Link>

        <h1 className="auth-theme-title">Super Admin Login</h1>
        <p className="auth-theme-subtitle">Platform administration access with the same public theme.</p>

        <form onSubmit={handleSubmit} className="auth-theme-form">
          <div className="auth-theme-field">
            <label className="auth-theme-label">Admin Email</label>
            <input
              className="auth-theme-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>

          <div className="auth-theme-field">
            <label className="auth-theme-label">Password</label>
            <input
              className="auth-theme-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="auth-theme-button">
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-theme-meta">
          Need the public site first? <Link to="/">Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
