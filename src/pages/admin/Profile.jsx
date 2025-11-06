// src/pages/admin/Profile.jsx
import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { getProfile, updateProfile, changePassword } from "../../api/client";

export default function Profile() {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profileData, setProfileData] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });

  // Load user data when component mounts
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await getProfile();
      if (response.success) {
        setProfileData(response.user);
        setProfileForm({
          name: response.user.name || '',
          email: response.user.email || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  // Clear validation errors when switching tabs
  useEffect(() => {
    setValidationErrors({});
    setMessage({ type: '', text: '' });
  }, [activeTab]);

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    setValidationErrors({});

    try {
      const response = await updateProfile(profileForm);
      
      if (response.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Update user context and profile data
        setUser(response.user);
        setProfileData(response.user);
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update profile' });
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
        setMessage({ type: 'error', text: 'Please fix the validation errors' });
      } else {
        const errorMessage = error.response?.data?.message || 'An error occurred while updating profile';
        setMessage({ type: 'error', text: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    setValidationErrors({});

    // Client-side validation
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      setValidationErrors({
        new_password_confirmation: ['New password and confirm password do not match']
      });
      setLoading(false);
      return;
    }

    try {
      const response = await changePassword(passwordForm);
      
      if (response.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordForm({
          current_password: '',
          new_password: '',
          new_password_confirmation: ''
        });
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to change password' });
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors);
        const errorMessage = error.response?.data?.message || 'Please fix the validation errors';
        setMessage({ type: 'error', text: errorMessage });
      } else if (error.response?.data?.message) {
        setMessage({ type: 'error', text: error.response.data.message });
      } else {
        const errorMessage = error.response?.data?.message || 'An error occurred while changing password';
        setMessage({ type: 'error', text: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  // Real-time password match validation
  const handlePasswordChangeInput = (field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear confirmation error when user starts typing
    if (field === 'new_password_confirmation' && validationErrors.new_password_confirmation) {
      setValidationErrors(prev => ({
        ...prev,
        new_password_confirmation: null
      }));
    }
  };

  // Check if passwords match in real-time
  const getPasswordMatchStatus = () => {
    if (!passwordForm.new_password_confirmation) return null;
    
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      return {
        isValid: false,
        message: 'Passwords do not match'
      };
    }
    
    return {
      isValid: true,
      message: 'Passwords match'
    };
  };

  const passwordMatch = getPasswordMatchStatus();

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Profile Settings</h2>
          </div>

          {/* Message Alert */}
          {message.text && (
            <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}>
              {message.text}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setMessage({ type: '', text: '' })}
              ></button>
            </div>
          )}

          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                  >
                    <i className="fas fa-user me-2"></i>
                    Profile Information
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'password' ? 'active' : ''}`}
                    onClick={() => setActiveTab('password')}
                  >
                    <i className="fas fa-lock me-2"></i>
                    Change Password
                  </button>
                </li>
              </ul>
            </div>

            <div className="card-body p-4">
              {/* Profile Information Tab */}
              {activeTab === 'profile' && (
                <div className="row">
                  <div className="col-md-8">
                    <form onSubmit={handleProfileUpdate}>
                      <div className="mb-3">
                        <label htmlFor="name" className="form-label">Full Name</label>
                        <input
                          type="text"
                          className={`form-control ${validationErrors.name ? 'is-invalid' : ''}`}
                          id="name"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                          required
                        />
                        {validationErrors.name && (
                          <div className="invalid-feedback">
                            {validationErrors.name[0]}
                          </div>
                        )}
                      </div>

                      <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email Address</label>
                        <input
                          type="email"
                          className={`form-control ${validationErrors.email ? 'is-invalid' : ''}`}
                          id="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                          required
                        />
                        {validationErrors.email && (
                          <div className="invalid-feedback">
                            {validationErrors.email[0]}
                          </div>
                        )}
                      </div>

                      <button 
                        type="submit" 
                        className="btn btn-success"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Updating...
                          </>
                        ) : (
                          'Update Profile'
                        )}
                      </button>
                    </form>
                  </div>

                  <div className="col-md-4">
                    <div className="card bg-light">
                      <div className="card-body text-center">
                        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" 
                             style={{width: '80px', height: '80px'}}>
                          <span className="text-white fw-bold fs-4">
                            {profileData?.name ? profileData.name.charAt(0).toUpperCase() : 'A'}
                          </span>
                        </div>
                        <h5 className="card-title">{profileData?.name}</h5>
                        <p className="card-text text-muted">{profileData?.email}</p>
                        <p className="card-text">
                          <small className="text-muted">
                            Role: <span className="badge bg-info">{profileData?.role}</span>
                          </small>
                        </p>
                        {/*{profileData?.wallet_balance !== undefined && (
                          <p className="card-text">
                            <small className="text-muted">
                              Wallet: <span className="badge bg-success">${profileData.wallet_balance}</span>
                            </small>
                          </p>
                        )}*/}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Change Password Tab */}
              {activeTab === 'password' && (
                <div className="row">
                  <div className="col-md-8">
                    <form onSubmit={handlePasswordChange}>
                      <div className="mb-3">
                        <label htmlFor="current_password" className="form-label">Current Password</label>
                        <input
                          type="password"
                          className={`form-control ${validationErrors.current_password ? 'is-invalid' : ''}`}
                          id="current_password"
                          value={passwordForm.current_password}
                          onChange={(e) => handlePasswordChangeInput('current_password', e.target.value)}
                          required
                        />
                        {validationErrors.current_password && (
                          <div className="invalid-feedback">
                            {validationErrors.current_password[0]}
                          </div>
                        )}
                      </div>

                      <div className="mb-3">
                        <label htmlFor="new_password" className="form-label">New Password</label>
                        <input
                          type="password"
                          className={`form-control ${validationErrors.new_password ? 'is-invalid' : ''}`}
                          id="new_password"
                          value={passwordForm.new_password}
                          onChange={(e) => handlePasswordChangeInput('new_password', e.target.value)}
                          required
                          minLength="6"
                        />
                        {validationErrors.new_password && (
                          <div className="invalid-feedback">
                            {validationErrors.new_password[0]}
                          </div>
                        )}
                        <div className="form-text">
                          Password must be at least 6 characters long.
                        </div>
                      </div>

                      <div className="mb-3">
                        <label htmlFor="new_password_confirmation" className="form-label">Confirm New Password</label>
                        <input
                          type="password"
                          className={`form-control ${
                            validationErrors.new_password_confirmation || (passwordMatch && !passwordMatch.isValid) ? 'is-invalid' : 
                            (passwordMatch && passwordMatch.isValid) ? 'is-valid' : ''
                          }`}
                          id="new_password_confirmation"
                          value={passwordForm.new_password_confirmation}
                          onChange={(e) => handlePasswordChangeInput('new_password_confirmation', e.target.value)}
                          required
                        />
                        {validationErrors.new_password_confirmation && (
                          <div className="invalid-feedback">
                            {validationErrors.new_password_confirmation[0]}
                          </div>
                        )}
                        {passwordMatch && !validationErrors.new_password_confirmation && (
                          <div className={`${passwordMatch.isValid ? 'valid-feedback' : 'invalid-feedback'} d-block`}>
                            {passwordMatch.message}
                          </div>
                        )}
                      </div>

                      <button 
                        type="submit" 
                        className="btn btn-success"
                        disabled={loading || (passwordMatch && !passwordMatch.isValid)}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Changing Password...
                          </>
                        ) : (
                          'Change Password'
                        )}
                      </button>
                    </form>
                  </div>

                  <div className="col-md-4">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6 className="card-title">
                          <i className="fas fa-shield-alt text-primary me-2"></i>
                          Password Requirements
                        </h6>
                        <ul className="list-unstyled small">
                          <li className="mb-2">
                            <i className="fas fa-check text-success me-2"></i>
                            At least 6 characters
                          </li>
                          <li className="mb-2">
                            <i className="fas fa-check text-success me-2"></i>
                            Include numbers and letters
                          </li>
                          <li>
                            <i className="fas fa-check text-success me-2"></i>
                            Don't reuse old passwords
                          </li>
                        </ul>

                        {/* Common Error Messages */}
                        <div className="mt-3">
                          <h6 className="text-danger">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            Common Issues
                          </h6>
                          <ul className="list-unstyled small text-danger">
                            <li>• Current password is incorrect</li>
                            <li>• New passwords don't match</li>
                            <li>• Password too short</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}