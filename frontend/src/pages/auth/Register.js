import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './AuthTheme.css';

const Field = ({ label, type = 'text', value, onChange, placeholder, required }) => (
  <div className="auth-theme-field">
    <label className="auth-theme-label">
      {label}
      {required ? ' *' : ''}
    </label>
    <input
      className="auth-theme-input"
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
    />
  </div>
);

export default function Register() {
  const [form, setForm] = useState({
    collegeName: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    website: '',
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      const res = await authAPI.collegeRegister(form);
      login(res.data.user, { accessToken: res.data.accessToken, refreshToken: res.data.refreshToken });
      toast.success('College registered! 14-day trial activated.');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
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

        <h1 className="auth-theme-title">Register Your College</h1>
        <p className="auth-theme-subtitle">Start your 14-day free trial with the same secure monitoring theme.</p>

        <div className="auth-theme-stepbar" aria-hidden="true">
          <span className={step >= 1 ? 'auth-theme-stepbar-active' : ''} />
          <span className={step >= 2 ? 'auth-theme-stepbar-active' : ''} />
        </div>

        <form onSubmit={handleSubmit} className="auth-theme-form">
          {step === 1 && (
            <>
              <Field
                label="College Name"
                value={form.collegeName}
                onChange={set('collegeName')}
                placeholder="Indian Institute of Technology"
                required
              />
              <Field
                label="Admin Full Name"
                value={form.name}
                onChange={set('name')}
                placeholder="Dr. Rajesh Kumar"
                required
              />
              <Field
                label="Official Email"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="admin@college.edu"
                required
              />
              <button
                type="button"
                className="auth-theme-button"
                onClick={() => {
                  if (!form.collegeName || !form.name || !form.email) return toast.error('Please fill all fields');
                  setStep(2);
                }}
              >
                Next
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <Field
                label="Password"
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="Min. 8 characters"
                required
              />
              <Field
                label="Phone Number"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+91 98765 43210"
              />
              <Field
                label="Address"
                value={form.address}
                onChange={set('address')}
                placeholder="City, State, Country"
              />
              <Field
                label="Website"
                value={form.website}
                onChange={set('website')}
                placeholder="https://college.edu"
              />
              <div className="auth-theme-button-row">
                <button type="button" className="auth-theme-secondary-button" onClick={() => setStep(1)}>
                  Back
                </button>
                <button type="submit" disabled={loading} className="auth-theme-button" style={{ flex: 1 }}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </>
          )}
        </form>

        <p className="auth-theme-meta">
          Already registered? <Link to="/admin/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
