import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Lock, Eye, EyeOff, Check, AlertCircle, Shield } from 'lucide-react';
import api from '../../services/api';
import './ChangePassword.css';

const ChangePassword = () => {
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPasswordField, setShowCurrentPasswordField] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const toggleCurrentPasswordField = () => {
    if (!showCurrentPasswordField) {
      // Clear current password when showing the field
      setFormData({
        ...formData,
        currentPassword: ''
      });
    }
    setShowCurrentPasswordField(!showCurrentPasswordField);
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

  const passwordStrength = getPasswordStrength(formData.newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation - only require new password and confirmation
    if (!formData.newPassword || !formData.confirmPassword) {
      toast.error('Please fill in new password and confirmation');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    // Don't allow same password as current if provided
    if (formData.currentPassword && formData.newPassword === formData.currentPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    try {
      setLoading(true);
      
      // Send the request - current password is optional
      const requestData = {
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      };
      
      // Only include current password if it's provided and not empty
      if (formData.currentPassword && formData.currentPassword.trim() !== '') {
        requestData.currentPassword = formData.currentPassword;
      }
      
      console.log('Sending password change request:', {
        hasCurrentPassword: !!requestData.currentPassword,
        currentPasswordLength: requestData.currentPassword?.length || 0,
        hasNewPassword: !!requestData.newPassword,
        hasConfirmPassword: !!requestData.confirmPassword
      });
      
      const response = await api.post('/student/change-password', requestData);

      if (response.data.success) {
        toast.success(response.data.message || 'Password changed successfully');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(response.data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      
      // Handle different error types professionally
      if (error.response?.status === 400) {
        const errorMessage = error.response.data.message;
        if (errorMessage.includes('Current password is incorrect')) {
          toast.error('Current password is incorrect. Please leave it empty if you don\'t remember it.');
        } else if (errorMessage.includes('Current password is required')) {
          toast.error('Current password is required to change your password.');
        } else if (errorMessage.includes('New password is required')) {
          toast.error('New password is required.');
        } else {
          toast.error(errorMessage || 'Invalid request. Please check your input.');
        }
      } else if (error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
      } else if (error.response?.status === 403) {
        toast.error('You are not authorized to perform this action.');
      } else if (error.response?.status === 404) {
        toast.error('Student account not found.');
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please try again.');
      } else if (error.code === 'NETWORK_ERROR') {
        toast.error('Network error. Please check your connection.');
      } else if (error.message?.includes('Unable to reach the backend API')) {
        toast.error('Backend server is not responding. Please try again in a moment.');
      } else {
        toast.error('Failed to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = formData.newPassword && 
                   formData.confirmPassword && 
                   formData.newPassword === formData.confirmPassword &&
                   formData.newPassword.length >= 6;

  return (
    <div className="change-password-container">
      <div className="change-password-header">
        <div className="change-password-icon">
          <Shield className="w-6 h-6" />
        </div>
        <div className="change-password-title">
          <h2>Change Password</h2>
          <p>Update your account password for better security</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="change-password-form">
        {/* Current Password - Hidden by default */}
        {showCurrentPasswordField && (
          <div className="form-group">
            <label className="form-label">
              Current Password 
              <span style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                Only fill if you remember your current password
              </span>
            </label>
            <div className="form-input-wrapper">
              <Lock className="form-input-icon" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter current password (optional)"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="form-input-toggle"
                disabled={loading}
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}

        {/* Toggle Current Password Field */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={toggleCurrentPasswordField}
            style={{
              background: 'none',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              color: '#6b7280',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.borderColor = '#9ca3af';
              e.target.style.color = '#4b5563';
            }}
            onMouseOut={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.color = '#6b7280';
            }}
            disabled={loading}
          >
            {showCurrentPasswordField ? 'Hide' : 'Show'} Current Password Field
          </button>
        </div>

        {/* Important Notice */}
        <div style={{ 
          fontSize: '0.875rem', 
          color: '#059669', 
          marginBottom: '1.5rem',
          padding: '0.75rem',
          backgroundColor: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          💡 <strong>Simple Method:</strong> Leave current password empty and just set your new password directly!
        </div>

        {/* New Password */}
        <div className="form-group">
          <label className="form-label">
            New Password
          </label>
          <div className="form-input-wrapper">
            <Lock className="form-input-icon" />
            <input
              type={showNewPassword ? 'text' : 'password'}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter new password"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="form-input-toggle"
              disabled={loading}
            >
              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {formData.newPassword && (
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
              <div className={`password-requirement-dot ${formData.newPassword.length >= 6 ? 'met' : ''}`}></div>
              <span className={`password-requirement-text ${formData.newPassword.length >= 6 ? 'met' : ''}`}>
                At least 6 characters
              </span>
            </div>
            <div className="password-requirement">
              <div className={`password-requirement-dot ${/[A-Z]/.test(formData.newPassword) ? 'met' : ''}`}></div>
              <span className={`password-requirement-text ${/[A-Z]/.test(formData.newPassword) ? 'met' : ''}`}>
                One uppercase letter
              </span>
            </div>
            <div className="password-requirement">
              <div className={`password-requirement-dot ${/[a-z]/.test(formData.newPassword) ? 'met' : ''}`}></div>
              <span className={`password-requirement-text ${/[a-z]/.test(formData.newPassword) ? 'met' : ''}`}>
                One lowercase letter
              </span>
            </div>
            <div className="password-requirement">
              <div className={`password-requirement-dot ${/[0-9]/.test(formData.newPassword) ? 'met' : ''}`}></div>
              <span className={`password-requirement-text ${/[0-9]/.test(formData.newPassword) ? 'met' : ''}`}>
                One number
              </span>
            </div>
            <div className="password-requirement">
              <div className={`password-requirement-dot ${/[^A-Za-z0-9]/.test(formData.newPassword) ? 'met' : ''}`}></div>
              <span className={`password-requirement-text ${/[^A-Za-z0-9]/.test(formData.newPassword) ? 'met' : ''}`}>
                One special character
              </span>
            </div>
          </div>
        </div>

        {/* Confirm New Password */}
        <div className="form-group">
          <label className="form-label">
            Confirm New Password
          </label>
          <div className="form-input-wrapper">
            <Lock className="form-input-icon" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="form-input"
              placeholder="Confirm new password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="form-input-toggle"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Password Match Indicator */}
          {formData.confirmPassword && formData.newPassword && (
            <div className={`password-match ${formData.confirmPassword === formData.newPassword ? 'success' : 'error'}`}>
              {formData.confirmPassword === formData.newPassword ? (
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="submit-button"
        >
          {loading ? (
            <div className="submit-spinner"></div>
          ) : (
            'Change Password'
          )}
        </button>
      </form>

      {/* Security Tips */}
      <div className="security-tips">
        <h3>Security Tips:</h3>
        <ul>
          <li>Use a mix of letters, numbers, and special characters</li>
          <li>Avoid using personal information in your password</li>
          <li>Don't reuse passwords from other accounts</li>
          <li>Change your password regularly</li>
        </ul>
      </div>

      {/* Forgot Password Link */}
      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          Don't remember your current password?
        </p>
        <a 
          href="/student/password-reset" 
          style={{ 
            color: '#6366f1', 
            textDecoration: 'none', 
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
          onMouseOut={(e) => e.target.style.textDecoration = 'none'}
        >
          Reset your password using email
        </a>
      </div>
    </div>
  );
};

export default ChangePassword;
