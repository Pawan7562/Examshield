import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  Globe,
  MapPin,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  X,
  Loader2,
  Video,
  FileCheck,
  LockKeyhole,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';
import PublicLayout from '../../components/public/PublicLayout';
import './Register.css';

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

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (errorMessage) setErrorMessage('');
  };

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'Not entered', colorClass: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak (needs numbers & symbols)', colorClass: 'active-weak' };
      case 2:
        return { score: 2, label: 'Fair (add capital letter or symbol)', colorClass: 'active-fair' };
      case 3:
        return { score: 3, label: 'Good (add special characters)', colorClass: 'active-good' };
      case 4:
        return { score: 4, label: 'Strong & secure password', colorClass: 'active-strong' };
      default:
        return { score: 0, label: 'Too short (min 8 chars)', colorClass: 'active-weak' };
    }
  };

  const pwdStrength = getPasswordStrength(form.password);

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!form.collegeName.trim()) {
      setErrorMessage('Please enter your college or institution name.');
      return;
    }
    setErrorMessage('');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!form.name.trim()) {
      setErrorMessage('Please enter the administrator full name.');
      return;
    }

    if (!form.email.trim() || !form.email.includes('@')) {
      setErrorMessage('Please enter a valid institutional email address.');
      return;
    }

    if (form.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Please accept the Terms of Service to activate your 14-day free trial.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.collegeRegister(form);
      const tokenPayload = {
        accessToken: res.data?.accessToken || res.data?.data?.accessToken,
        refreshToken: res.data?.refreshToken || res.data?.data?.refreshToken,
      };
      const userPayload = res.data?.user || res.data?.data?.user;

      login(userPayload, tokenPayload);
      toast.success('🎉 College registered! 14-day trial activated.');
      navigate('/admin/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout className="exam-landing-theme">
      <section className="public-shell register-page-section" aria-labelledby="register-heading">
        <div className="register-container">
          {/* Header */}
          <div className="register-page-header">
            <div className="register-eyebrow-pill">
              <Sparkles size={14} aria-hidden="true" />
              <span>14-Day Full-Access Free Trial • Instant Activation</span>
            </div>

            <h1 id="register-heading" className="register-page-title">
              Register Your <span>Institution</span>
            </h1>
            <p className="register-page-subtitle">
              Join 120+ leading universities and certification bodies deploying enterprise AI proctoring,
              automated exam key dispatch, and anti-cheating monitoring.
            </p>
          </div>

          {/* Two-Column Grid */}
          <div className="register-grid">
            {/* Left Column: Value Proposition & Trust Badges */}
            <div className="register-value-card">
              <div className="register-value-badge">
                <CheckCircle2 size={13} />
                <span>Enterprise Assessment Platform</span>
              </div>

              <h2 className="register-value-title">Everything you need to run secure online examinations</h2>
              <p className="register-value-desc">
                Setup takes under 2 minutes. Empower your faculty with turnkey AI proctoring, instant candidate enrollment, and automated grading.
              </p>

              <div className="register-benefits-list">
                <div className="register-benefit-item">
                  <div className="register-benefit-icon">
                    <Video size={18} />
                  </div>
                  <div className="register-benefit-text">
                    <h4>Multi-Modal AI Proctoring</h4>
                    <p>Real-time face detection, tab-switch interception, multiple-person warnings, and automated audio anomaly alerts.</p>
                  </div>
                </div>

                <div className="register-benefit-item">
                  <div className="register-benefit-icon">
                    <FileCheck size={18} />
                  </div>
                  <div className="register-benefit-text">
                    <h4>Automated Exam Keys & Credentials</h4>
                    <p>Enrolled candidates automatically receive unique Student IDs, secure passwords, and exam access keys directly via email.</p>
                  </div>
                </div>

                <div className="register-benefit-item">
                  <div className="register-benefit-icon">
                    <LockKeyhole size={18} />
                  </div>
                  <div className="register-benefit-text">
                    <h4>Bank-Grade Cloud Security</h4>
                    <p>Full SSL encryption, branch-isolated PostgreSQL storage, granular role-based permissions, and immutable audit logs.</p>
                  </div>
                </div>

                <div className="register-benefit-item">
                  <div className="register-benefit-icon">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="register-benefit-text">
                    <h4>Live Candidate Command Center</h4>
                    <p>Observe student progress in real-time with continuous telemetry, violation counter, and instant termination controls.</p>
                  </div>
                </div>
              </div>

              {/* Trial Guarantee Banner */}
              <div className="register-trial-guarantee">
                <Sparkles size={20} className="register-trial-icon" />
                <div className="register-trial-text">
                  <h5>No Credit Card Required</h5>
                  <p>14 days of unrestricted access. Easily upgrade to a dedicated plan anytime.</p>
                </div>
              </div>
            </div>

            {/* Right Column: Registration Card */}
            <div className="register-card">
              {/* Stepper Tabs */}
              <div className="register-stepper" role="navigation" aria-label="Registration steps">
                <button
                  type="button"
                  className={`register-step-item ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}
                  onClick={() => setStep(1)}
                >
                  <div className="register-step-circle">
                    {step > 1 ? <CheckCircle2 size={18} /> : '1'}
                  </div>
                  <div className="register-step-info">
                    <span className="register-step-num">Step 1</span>
                    <span className="register-step-name">Institution Details</span>
                  </div>
                </button>

                <div className="register-step-connector">
                  <div
                    className="register-step-connector-fill"
                    style={{ width: step > 1 ? '100%' : '0%' }}
                  />
                </div>

                <button
                  type="button"
                  className={`register-step-item ${step === 2 ? 'active' : ''}`}
                  onClick={() => {
                    if (form.collegeName.trim()) setStep(2);
                  }}
                >
                  <div className="register-step-circle">2</div>
                  <div className="register-step-info">
                    <span className="register-step-num">Step 2</span>
                    <span className="register-step-name">Admin Credentials</span>
                  </div>
                </button>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="register-error-banner" role="alert">
                  <AlertCircle size={18} />
                  <div>{errorMessage}</div>
                  <button
                    type="button"
                    className="register-error-close"
                    onClick={() => setErrorMessage('')}
                    title="Dismiss"
                    aria-label="Dismiss error"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={step === 1 ? handleNextStep : handleSubmit} className="register-form" noValidate>
                {step === 1 ? (
                  <>
                    <div className="register-field-group">
                      <label htmlFor="reg-college-name" className="register-field-label">
                        <span>College / University Name <span className="required-star">*</span></span>
                      </label>
                      <div className="register-input-wrap">
                        <input
                          id="reg-college-name"
                          type="text"
                          className="register-input"
                          value={form.collegeName}
                          onChange={handleChange('collegeName')}
                          placeholder="e.g. Indian Institute of Technology / Harvard University"
                          required
                          autoFocus
                        />
                        <div className="register-input-icon">
                          <Building2 size={18} />
                        </div>
                      </div>
                    </div>

                    <div className="register-field-row">
                      <div className="register-field-group">
                        <label htmlFor="reg-website" className="register-field-label">
                          <span>Institutional Website</span>
                          <span className="register-field-optional">Optional</span>
                        </label>
                        <div className="register-input-wrap">
                          <input
                            id="reg-website"
                            type="url"
                            className="register-input"
                            value={form.website}
                            onChange={handleChange('website')}
                            placeholder="https://college.edu"
                          />
                          <div className="register-input-icon">
                            <Globe size={18} />
                          </div>
                        </div>
                      </div>

                      <div className="register-field-group">
                        <label htmlFor="reg-address" className="register-field-label">
                          <span>Campus Location / City</span>
                          <span className="register-field-optional">Optional</span>
                        </label>
                        <div className="register-input-wrap">
                          <input
                            id="reg-address"
                            type="text"
                            className="register-input"
                            value={form.address}
                            onChange={handleChange('address')}
                            placeholder="City, State, Country"
                          />
                          <div className="register-input-icon">
                            <MapPin size={18} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="register-btn-row">
                      <button type="submit" className="register-btn-primary">
                        <span>Continue to Admin Setup</span>
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="register-field-row">
                      <div className="register-field-group">
                        <label htmlFor="reg-admin-name" className="register-field-label">
                          <span>Administrator Name <span className="required-star">*</span></span>
                        </label>
                        <div className="register-input-wrap">
                          <input
                            id="reg-admin-name"
                            type="text"
                            className="register-input"
                            value={form.name}
                            onChange={handleChange('name')}
                            placeholder="Dr. Rajesh Kumar"
                            required
                            autoFocus
                          />
                          <div className="register-input-icon">
                            <User size={18} />
                          </div>
                        </div>
                      </div>

                      <div className="register-field-group">
                        <label htmlFor="reg-admin-phone" className="register-field-label">
                          <span>Phone Number</span>
                          <span className="register-field-optional">Optional</span>
                        </label>
                        <div className="register-input-wrap">
                          <input
                            id="reg-admin-phone"
                            type="tel"
                            className="register-input"
                            value={form.phone}
                            onChange={handleChange('phone')}
                            placeholder="+91 98765 43210"
                          />
                          <div className="register-input-icon">
                            <Phone size={18} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="register-field-group">
                      <label htmlFor="reg-admin-email" className="register-field-label">
                        <span>Work / Institutional Email <span className="required-star">*</span></span>
                      </label>
                      <div className="register-input-wrap">
                        <input
                          id="reg-admin-email"
                          type="email"
                          className="register-input"
                          value={form.email}
                          onChange={handleChange('email')}
                          placeholder="admin@college.edu.in"
                          required
                        />
                        <div className="register-input-icon">
                          <Mail size={18} />
                        </div>
                      </div>
                    </div>

                    <div className="register-field-group">
                      <label htmlFor="reg-admin-password" className="register-field-label">
                        <span>Account Password <span className="required-star">*</span></span>
                        <span className="register-field-optional">Min. 8 characters</span>
                      </label>
                      <div className="register-input-wrap">
                        <input
                          id="reg-admin-password"
                          type={showPassword ? 'text' : 'password'}
                          className="register-input"
                          value={form.password}
                          onChange={handleChange('password')}
                          placeholder="Create a strong password"
                          required
                        />
                        <div className="register-input-icon">
                          <Lock size={18} />
                        </div>
                        <button
                          type="button"
                          className="register-input-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      {/* Password strength visualizer */}
                      {form.password && (
                        <div className="password-meter">
                          <div className="password-meter-bars">
                            <div className={`password-meter-bar ${pwdStrength.score >= 1 ? pwdStrength.colorClass : ''}`} />
                            <div className={`password-meter-bar ${pwdStrength.score >= 2 ? pwdStrength.colorClass : ''}`} />
                            <div className={`password-meter-bar ${pwdStrength.score >= 3 ? pwdStrength.colorClass : ''}`} />
                            <div className={`password-meter-bar ${pwdStrength.score >= 4 ? pwdStrength.colorClass : ''}`} />
                          </div>
                          <div className="password-meter-label">
                            <span>Strength: {pwdStrength.label}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Terms Checkbox */}
                    <label className="register-terms-label">
                      <input
                        type="checkbox"
                        className="register-terms-checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                      />
                      <span>
                        I agree to the <Link to="/contact" target="_blank">Terms of Service</Link> &amp;{' '}
                        <Link to="/contact" target="_blank">Privacy Policy</Link>, and acknowledge the 14-day free trial.
                      </span>
                    </label>

                    {/* Action Buttons */}
                    <div className="register-btn-row">
                      <button
                        type="button"
                        className="register-btn-back"
                        onClick={() => setStep(1)}
                        disabled={loading}
                      >
                        <ArrowLeft size={16} />
                        <span>Back</span>
                      </button>

                      <button
                        type="submit"
                        className="register-btn-primary"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Creating Account...</span>
                          </>
                        ) : (
                          <>
                            <span>Complete Registration</span>
                            <ArrowRight size={18} />
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>

              {/* Card Meta & Navigation */}
              <div className="register-card-meta">
                <div>
                  Already have an institutional account?{' '}
                  <Link to="/admin/login">Sign in to College Admin</Link>
                </div>

                <div>
                  <Link to="/student/login" className="register-meta-student-pill">
                    <GraduationCap size={15} />
                    <span>Are you a student? Take an exam via Student Portal &rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
