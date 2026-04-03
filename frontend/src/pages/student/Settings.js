import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { User, Mail, Phone, Calendar, Shield, Settings, LogOut } from 'lucide-react';
import ChangePassword from '../../components/student/ChangePassword';
import api from '../../services/api';
import '../../components/student/StudentSidebar.css';

export default function StudentSettings() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch profile data if user is authenticated
    if (user) {
      fetchProfileData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const response = await api.get('/student/profile');
      if (response.data.success) {
        setProfileData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
      
      // Handle 401 Unauthorized error
      if (error.response?.status === 401) {
        console.log('Authentication failed - using auth context data as fallback');
        // Use auth context data as fallback
        if (user) {
          setProfileData({
            name: user.name,
            email: user.email,
            student_id: user.studentId,
            roll_no: user.rollNo,
            college_id: user.collegeId,
            is_active: true,
            created_at: new Date().toISOString()
          });
        }
      } else {
        toast.error('Failed to load profile data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  if (!user) {
    return (
      <div className="settings-container">
        <div className="settings-loading">
          <div className="settings-loading-spinner"></div>
          <p>Please log in to view your settings</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="settings-container">
        <div className="settings-loading">
          <div className="settings-loading-spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      <div className="settings-card">
        {/* Tabs */}
        <div className="settings-tabs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
          >
            <User className="settings-tab-icon" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
          >
            <Shield className="settings-tab-icon" />
            Security
          </button>
        </div>

        {/* Tab Content */}
        <div className="settings-content">
          {activeTab === 'profile' && (
            <>
              <div className="settings-section">
                <h2 className="settings-section-title">
                  <User className="settings-tab-icon" />
                  Profile Information
                </h2>
                
                <div className="profile-header">
                  <div className="profile-avatar">
                    {profileData?.name?.charAt(0) || user?.name?.charAt(0) || 'S'}
                  </div>
                  <div className="profile-info">
                    <h3>{profileData?.name || user?.name}</h3>
                    <p>Student</p>
                  </div>
                </div>

                <div className="profile-grid">
                  <div className="profile-item">
                    <div className="profile-item-header">
                      <User className="profile-item-icon" />
                      <span className="profile-item-label">Full Name</span>
                    </div>
                    <p className="profile-item-value">{profileData?.name || user?.name}</p>
                  </div>

                  <div className="profile-item">
                    <div className="profile-item-header">
                      <Mail className="profile-item-icon" />
                      <span className="profile-item-label">Email Address</span>
                    </div>
                    <p className="profile-item-value">{profileData?.email || user?.email}</p>
                  </div>

                  <div className="profile-item">
                    <div className="profile-item-header">
                      <User className="profile-item-icon" />
                      <span className="profile-item-label">Student ID</span>
                    </div>
                    <p className="profile-item-value">{profileData?.student_id || user?.studentId}</p>
                  </div>

                  <div className="profile-item">
                    <div className="profile-item-header">
                      <Phone className="profile-item-icon" />
                      <span className="profile-item-label">Phone Number</span>
                    </div>
                    <p className="profile-item-value">{profileData?.phone || 'Not provided'}</p>
                  </div>

                  <div className="profile-item">
                    <div className="profile-item-header">
                      <Calendar className="profile-item-icon" />
                      <span className="profile-item-label">Registration Date</span>
                    </div>
                    <p className="profile-item-value">
                      {profileData?.created_at ? 
                        new Date(profileData.created_at).toLocaleDateString() : 
                        'Not available'
                      }
                    </p>
                  </div>

                  <div className="profile-item">
                    <div className="profile-item-header">
                      <Shield className="profile-item-icon" />
                      <span className="profile-item-label">Account Status</span>
                    </div>
                    <p className="profile-item-value">
                      <span className={`profile-status ${profileData?.is_active ? 'active' : 'inactive'}`}>
                        {profileData?.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Actions */}
              <div className="account-actions">
                <h3>Account Actions</h3>
                <div className="action-buttons">
                  <button
                    onClick={handleLogout}
                    className="action-button danger"
                  >
                    <LogOut className="action-button-icon" />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <div className="settings-section security-section">
              <h2 className="settings-section-title">
                <Shield className="settings-tab-icon" />
                Security Settings
              </h2>
              <p className="security-description">
                Manage your password and security preferences
              </p>
              <ChangePassword />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
