import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mail, Lock, User, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import './PasswordReset.css';

const PasswordReset = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const userId = searchParams.get('userId');
  
  const [step, setStep] = useState(token && userId ? 'reset' : 'request');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Request reset form state
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  
  // Reset password form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tokenValid, setTokenValid] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);

  // Verify token on component mount if token is provided
  React.useEffect(() => {
    if (token && userId) {
      verifyToken();
    }
  }, [token, userId]);

  const verifyToken = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/student-password/verify-token?token=${token}&userId=${userId}`);
      
      if (response.data.success) {
        setTokenValid(true);
        setStudentInfo(response.data.data);
        setStep('reset');
      } else {
        setTokenValid(false);
        toast.error('Invalid or expired reset token');
      }
    } catch (error) {
      setTokenValid(false);
      toast.error('Invalid or expired reset token');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    
    if (!email || !studentId) {
      toast.error('Please enter both email and student ID');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/student-password/request-reset', {
        email,
        userId: studentId
      });

      if (response.data.success) {
        toast.success('Password reset instructions sent to your email');
        
        // For demo purposes, if the response includes a reset link, show it
        if (response.data.resetLink) {
          console.log('Password reset link (for demo):', response.data.resetLink);
          toast.success('Check console for reset link (demo mode)');
          
          // In a real app, you wouldn't do this, but for demo purposes:
          setTimeout(() => {
            if (window.confirm('Demo mode: Would you like to navigate to the reset link?')) {
              window.location.href = response.data.resetLink;
            }
          }, 2000);
        }
        
        setEmail('');
        setStudentId('');
      } else {
        toast.error(response.data.message || 'Failed to send reset instructions');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset instructions');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast.error('Please enter both password fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/student-password/reset', {
        token,
        userId,
        newPassword
      });

      if (response.data.success) {
        toast.success('Password reset successfully');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          window.location.href = '/student/login';
        }, 2000);
      } else {
        toast.error(response.data.message || 'Failed to reset password');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
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

  const passwordStrength = getPasswordStrength(newPassword);

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link
              to="/student/password-reset"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'request') {
    return (
      <div className="password-reset-container">
        <div className="password-reset-wrapper">
          <div className="password-reset-card">
            {step === 'request' ? (
              <>
                <div className="password-reset-header">
                  <div className="password-reset-icon">
                    <Mail className="w-8 h-8" />
                  </div>
                  <h1 className="password-reset-title">Reset Password</h1>
                  <p className="password-reset-subtitle">
                    Enter your email and student ID to receive password reset instructions
                  </p>
                </div>

                <div className="password-reset-body">
                  {/* Step Indicator */}
                  <div className="step-indicator">
                    <div className="step active">1</div>
                    <div className="step">2</div>
                  </div>

                  <form onSubmit={handleRequestReset} className="reset-form">
                    <div className="form-group">
                      <label className="form-label">
                        Email Address
                      </label>
                      <div className="form-input-wrapper">
                        <Mail className="form-input-icon" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="form-input"
                          placeholder="Enter your email address"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Student ID
                      </label>
                      <div className="form-input-wrapper">
                        <User className="form-input-icon" />
                        <input
                          type="text"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          className="form-input"
                          placeholder="Enter your student ID"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="submit-button"
                    >
                      {loading ? (
                        <div className="submit-spinner"></div>
                      ) : (
                        'Send Reset Instructions'
                      )}
                    </button>
                  </form>

                  {/* Help Section */}
                  <div className="help-section">
                    <h3 className="help-title">Need Help?</h3>
                    <ul className="help-list">
                      <li className="help-item">Check your email spam folder</li>
                      <li className="help-item">Ensure your student ID is correct</li>
                      <li className="help-item">Contact support if issues persist</li>
                    </ul>
                  </div>

                  <div className="back-to-login">
                    <Link to="/student/login" className="back-to-login-link">
                      Back to Login
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="password-reset-header">
                  <div className="password-reset-icon">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h1 className="password-reset-title">Set New Password</h1>
                  <p className="password-reset-subtitle">
                    Enter your new password to complete the reset process
                  </p>
                </div>

                <div className="password-reset-body">
                  {/* Step Indicator */}
                  <div className="step-indicator">
                    <div className="step completed">1</div>
                    <div className="step active">2</div>
                  </div>

                  <form onSubmit={handleResetPassword} className="reset-form">
                    <div className="form-group">
                      <label className="form-label">
                        New Password
                      </label>
                      <div className="form-input-wrapper">
                        <Lock className="form-input-icon" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="form-input"
                          placeholder="Enter your new password"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="form-input-toggle"
                          disabled={loading}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Password Strength Indicator */}
                      {newPassword && (
                        <div className="password-strength">
                          <div className="password-strength-header">
                            <span className="password-strength-label">Password Strength</span>
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
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Password Requirements */}
                      <div className="password-requirements">
                        <div className="password-requirement">
                          <div className={`password-requirement-dot ${newPassword.length >= 6 ? 'met' : ''}`}></div>
                          <span className={`password-requirement-text ${newPassword.length >= 6 ? 'met' : ''}`}>
                            At least 6 characters
                          </span>
                        </div>
                        <div className="password-requirement">
                          <div className={`password-requirement-dot ${/[A-Z]/.test(newPassword) ? 'met' : ''}`}></div>
                          <span className={`password-requirement-text ${/[A-Z]/.test(newPassword) ? 'met' : ''}`}>
                            One uppercase letter
                          </span>
                        </div>
                        <div className="password-requirement">
                          <div className={`password-requirement-dot ${/[a-z]/.test(newPassword) ? 'met' : ''}`}></div>
                          <span className={`password-requirement-text ${/[a-z]/.test(newPassword) ? 'met' : ''}`}>
                            One lowercase letter
                          </span>
                        </div>
                        <div className="password-requirement">
                          <div className={`password-requirement-dot ${/[0-9]/.test(newPassword) ? 'met' : ''}`}></div>
                          <span className={`password-requirement-text ${/[0-9]/.test(newPassword) ? 'met' : ''}`}>
                            One number
                          </span>
                        </div>
                        <div className="password-requirement">
                          <div className={`password-requirement-dot ${/[^A-Za-z0-9]/.test(newPassword) ? 'met' : ''}`}></div>
                          <span className={`password-requirement-text ${/[^A-Za-z0-9]/.test(newPassword) ? 'met' : ''}`}>
                            One special character
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Confirm New Password
                      </label>
                      <div className="form-input-wrapper">
                        <Lock className="form-input-icon" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="form-input"
                          placeholder="Confirm your new password"
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="form-input-toggle"
                          disabled={loading}
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      
                      {/* Password Match Indicator */}
                      {confirmPassword && newPassword && (
                        <div className={`password-match ${confirmPassword === newPassword ? 'success' : 'error'}`}>
                          {confirmPassword === newPassword ? (
                            <>
                              <Check className="password-match-icon" />
                              <span className="password-match-text">Passwords match</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="password-match-icon" />
                              <span className="password-match-text">Passwords do not match</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                      className="submit-button"
                    >
                      {loading ? (
                        <div className="submit-spinner"></div>
                      ) : (
                        'Reset Password'
                      )}
                    </button>
                  </form>

                  <div className="back-to-login">
                    <Link to="/student/login" className="back-to-login-link">
                      Back to Login
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'reset') {
    return (
      <div className="password-reset-container">
        <div className="password-reset-wrapper">
          <div className="password-reset-card">
            <div className="password-reset-header">
              <div className="password-reset-icon">
                <Lock className="w-8 h-8" />
              </div>
              <h1 className="password-reset-title">Set New Password</h1>
              <p className="password-reset-subtitle">
                Enter your new password to complete the reset process
              </p>
            </div>

            <div className="password-reset-body">
              {/* Step Indicator */}
              <div className="step-indicator">
                <div className="step completed">1</div>
                <div className="step active">2</div>
              </div>

              <form onSubmit={handleResetPassword} className="reset-form">
                <div className="form-group">
                  <label className="form-label">
                    New Password
                  </label>
                  <div className="form-input-wrapper">
                    <Lock className="form-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="form-input"
                      placeholder="Enter your new password"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="form-input-toggle"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="password-strength">
                      <div className="password-strength-header">
                        <span className="password-strength-label">Password Strength</span>
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
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Password Requirements */}
                  <div className="password-requirements">
                    <div className="password-requirement">
                      <div className={`password-requirement-dot ${newPassword.length >= 6 ? 'met' : ''}`}></div>
                      <span className={`password-requirement-text ${newPassword.length >= 6 ? 'met' : ''}`}>
                        At least 6 characters
                      </span>
                    </div>
                    <div className="password-requirement">
                      <div className={`password-requirement-dot ${/[A-Z]/.test(newPassword) ? 'met' : ''}`}></div>
                      <span className={`password-requirement-text ${/[A-Z]/.test(newPassword) ? 'met' : ''}`}>
                        One uppercase letter
                      </span>
                    </div>
                    <div className="password-requirement">
                      <div className={`password-requirement-dot ${/[a-z]/.test(newPassword) ? 'met' : ''}`}></div>
                      <span className={`password-requirement-text ${/[a-z]/.test(newPassword) ? 'met' : ''}`}>
                        One lowercase letter
                      </span>
                    </div>
                    <div className="password-requirement">
                      <div className={`password-requirement-dot ${/[0-9]/.test(newPassword) ? 'met' : ''}`}></div>
                      <span className={`password-requirement-text ${/[0-9]/.test(newPassword) ? 'met' : ''}`}>
                        One number
                      </span>
                    </div>
                    <div className="password-requirement">
                      <div className={`password-requirement-dot ${/[^A-Za-z0-9]/.test(newPassword) ? 'met' : ''}`}></div>
                      <span className={`password-requirement-text ${/[^A-Za-z0-9]/.test(newPassword) ? 'met' : ''}`}>
                        One special character
                      </span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Confirm New Password
                  </label>
                  <div className="form-input-wrapper">
                    <Lock className="form-input-icon" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="form-input"
                      placeholder="Confirm your new password"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="form-input-toggle"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Password Match Indicator */}
                  {confirmPassword && newPassword && (
                    <div className={`password-match ${confirmPassword === newPassword ? 'success' : 'error'}`}>
                      {confirmPassword === newPassword ? (
                        <>
                          <Check className="password-match-icon" />
                          <span className="password-match-text">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="password-match-icon" />
                          <span className="password-match-text">Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className="submit-button"
                >
                  {loading ? (
                    <div className="submit-spinner"></div>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>

              <div className="back-to-login">
                <Link to="/student/login" className="back-to-login-link">
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PasswordReset;
