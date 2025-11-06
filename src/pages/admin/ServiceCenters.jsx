// src/components/admin/ServiceCenters.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Base URL for API - adjust this to match your Laravel backend
const API_BASE_URL = 'http://127.0.0.1:8000/api';

const ServiceCenters = () => {
  const [serviceCenters, setServiceCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    latitude: '',
    longitude: '',
    opening_hours: '',
    is_active: true
  });
  const [successMessage, setSuccessMessage] = useState(null);

  // Define resetForm function at the top level of component
  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      latitude: '',
      longitude: '',
      opening_hours: '',
      is_active: true
    });
    setEditingCenter(null);
    setShowModal(false);
    setError(null);
  };

  useEffect(() => {
    fetchServiceCenters();
  }, []);

  const fetchServiceCenters = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      console.log('Fetching service centers from:', `${API_BASE_URL}/admin/service-centers`);
      
      const response = await axios.get(`${API_BASE_URL}/admin/service-centers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log('Full API Response:', response);
      console.log('Response data:', response.data);
      
      // FIXED: Properly handle paginated response
      let centers = [];
      
      if (response.data && response.data.data) {
        // Case 1: Paginated response { data: { data: [...], current_page: 1, ... } }
        if (Array.isArray(response.data.data)) {
          centers = response.data.data;
        } 
        // Case 2: Direct data array { data: [...] }
        else if (response.data.data.data && Array.isArray(response.data.data.data)) {
          centers = response.data.data.data;
        }
      }
      
      console.log('Extracted centers:', centers);
      setServiceCenters(centers);
      
    } catch (error) {
      console.error('Error fetching service centers:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      
      if (error.response?.status === 404) {
        setError(`API endpoint not found. Please ensure:
        - Laravel server is running on http://127.0.0.1:8000
        - API routes are properly defined
        - You are logged in as admin`);
      } else if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Access forbidden. Admin privileges required.');
      } else {
        setError(error.response?.data?.message || 'Failed to load service centers. Please try again.');
      }
      setServiceCenters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      console.log('Form data before sending:', formData);
      
      const requestData = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        email: formData.email || '',
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        opening_hours: formData.opening_hours || '',
        is_active: formData.is_active ? 1 : 0
      };

      console.log('Sending data:', requestData);

      let response;
      if (editingCenter) {
        response = await axios.put(`${API_BASE_URL}/admin/service-centers/${editingCenter.id}`, requestData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setSuccessMessage('Service center updated successfully!');
      } else {
        response = await axios.post(`${API_BASE_URL}/admin/service-centers`, requestData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setSuccessMessage('Service center created successfully!');
      }

      console.log('Save response:', response.data);

      setShowModal(false);
      setEditingCenter(null);
      resetForm();
      fetchServiceCenters();
      
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error) {
      console.error('Error saving service center:', error);
      console.error('Full error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error details:', error.response?.data?.errors);
      
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        
        if (validationErrors) {
          let errorMessages = [];
          
          Object.keys(validationErrors).forEach(field => {
            validationErrors[field].forEach(message => {
              errorMessages.push(`${field}: ${message}`);
            });
          });
          
          setError(`Validation failed: ${errorMessages.join(', ')}`);
        } else {
          setError('Validation failed. Please check all required fields.');
        }
      } else {
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error ||
                            'Failed to save service center. Please try again.';
        setError(errorMessage);
      }
    }
  };

  const handleEdit = (center) => {
    setEditingCenter(center);
    setFormData({
      name: center.name || '',
      address: center.address || '',
      phone: center.phone || '',
      email: center.email || '',
      latitude: center.latitude?.toString() || '',
      longitude: center.longitude?.toString() || '',
      opening_hours: center.opening_hours || '',
      is_active: center.is_active !== undefined ? center.is_active : true
    });
    
    setShowModal(true);
    setError(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this service center? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/admin/service-centers/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setSuccessMessage('Service center deleted successfully!');
        fetchServiceCenters();
        
        setTimeout(() => setSuccessMessage(null), 3000);
        
      } catch (error) {
        console.error('Error deleting service center:', error);
        setError(error.response?.data?.message || 'Failed to delete service center. Please try again.');
      }
    }
  };

  const toggleStatus = async (center) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.patch(`${API_BASE_URL}/admin/service-centers/${center.id}/status`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setSuccessMessage(`Service center ${response.data.data.is_active ? 'activated' : 'deactivated'} successfully!`);
      fetchServiceCenters();
      
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error) {
      console.error('Error updating status:', error);
      setError(error.response?.data?.message || 'Failed to update status. Please try again.');
    }
  };

  // Test API connection
  const testApiConnection = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/service-centers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // FIXED: Proper data extraction for test
      const centers = response.data.data && Array.isArray(response.data.data) ? response.data.data : [];
      console.log('API Test Response:', response);
      alert(`API connection successful! Found ${centers.length} service centers.`);
    } catch (error) {
      console.error('API Test Error:', error);
      alert('API connection failed: ' + (error.response?.data?.message || error.message));
    }
  };

  // Test Laravel server connection
  const testLaravelServer = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000');
      console.log('Laravel Server Response:', response);
      alert('Laravel server is running!');
    } catch (error) {
      console.error('Laravel Server Test Error:', error);
      alert('Laravel server is not running. Please start it with: php artisan serve');
    }
  };

  // Debug function
  const debugAPI = async () => {
    const token = localStorage.getItem('token');
    console.log('=== DEBUG INFO ===');
    console.log('Token:', token);
    console.log('API URL:', `${API_BASE_URL}/admin/service-centers`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/service-centers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log('Response Status:', response.status);
      console.log('Response OK:', response.ok);
      
      const text = await response.text();
      console.log('Raw Response Text:', text);
      
      try {
        const data = JSON.parse(text);
        console.log('Parsed JSON:', data);
        
        // Show extracted data count
        if (data.data && data.data.data) {
          console.log('Data count:', data.data.data.length);
        } else if (data.data) {
          console.log('Data count:', data.data.length);
        }
        
      } catch (e) {
        console.log('Response is not JSON');
      }
      
    } catch (error) {
      console.error('Debug fetch error:', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Service Centers Management</h2>
          <button className="btn btn-success" disabled>
            <i className="fas fa-plus me-2"></i>
            Add New Service Center
          </button>
        </div>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="ms-3">Loading service centers...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Success Alert */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          {successMessage}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setSuccessMessage(null)}
          ></button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Service Centers ({serviceCenters.length})</h2>
          {/*<p className="text-muted mb-0">
            Total {serviceCenters.length} service center(s) found
          </p>*/}
        </div>
        <div>
          {/*<button 
            className="btn btn-info btn-sm me-2"
            onClick={testLaravelServer}
            title="Test Laravel Server"
          >
            <i className="fas fa-server me-1"></i>
            Test Server
          </button>
          <button 
            className="btn btn-warning btn-sm me-2"
            onClick={testApiConnection}
            title="Test API Connection"
          >
            <i className="fas fa-bug me-1"></i>
            Test API
          </button>
          <button 
            className="btn btn-secondary btn-sm me-2"
            onClick={debugAPI}
            title="Debug API"
          >
            <i className="fas fa-code me-1"></i>
            Debug
          </button>*/}
          <button 
            className="btn btn-success"
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-plus me-2"></i>
            Add New Service Center
          </button>
        </div>
      </div>

      {/* No Data State */}
      {serviceCenters.length === 0 ? (
        <div className="text-center py-5">
          <i className="fas fa-building fa-4x text-muted mb-3"></i>
          <h4>No Service Centers Found</h4>
          <p className="text-muted mb-4">Get started by adding your first service center.</p>
          <button 
            className="btn btn-success btn-lg"
            onClick={() => setShowModal(true)}
          >
            <i className="fas fa-plus me-2"></i>
            Add First Service Center
          </button>
        </div>
      ) : (
        <div className="row">
          {serviceCenters.map(center => (
            <div key={center.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100 shadow-sm border-0">
                <div className="position-relative">
                  {/*<div 
                                      className="card-img-top bg-gradient-primary d-flex align-items-center justify-content-center"
                                      style={{ height: '120px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                                    >
                                      <i className="fas fa-building fa-2x text-white"></i>
                                    </div>*/}
                  <div className="position-absolute top-0 end-0 m-3">
                    <div className="d-flex align-items-center">
                      <div 
                        className={`rounded-circle me-2 ${center.is_active ? 'bg-success' : 'bg-danger'}`}
                        style={{ width: '10px', height: '10px' }}
                      ></div>
                      {/*<span className="text-white fw-bold small">
                                              {center.is_active ? 'Online' : 'Offline'}
                                            </span>*/}
                    </div>
                  </div>
                </div>
                
                <div className="card-body">
                  <h5 className="card-title text-dark mb-2">{center.name}</h5>
                  <p className="card-text text-muted small mb-3">
                    <i className="fas fa-map-marker-alt me-1 text-primary"></i>
                    {center.address}
                  </p>
                  <div className="mb-2">
                    <i className="fas fa-phone me-2 text-muted"></i>
                    <span className="small text-dark">{center.phone}</span>
                  </div>
                  {center.email && (
                    <div className="mb-2">
                      <i className="fas fa-envelope me-2 text-muted"></i>
                      <span className="small text-dark">{center.email}</span>
                    </div>
                  )}
                  {center.opening_hours && (
                    <div className="mb-3">
                      <i className="fas fa-clock me-2 text-muted"></i>
                      <span className="small text-dark">{center.opening_hours}</span>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-top">
                    <small className="text-muted">
                      <i className="fas fa-map-pin me-1 text-warning"></i>
                      Coordinates: {parseFloat(center.latitude).toFixed(6)}, {parseFloat(center.longitude).toFixed(6)}
                    </small>
                  </div>
                </div>
                
                <div className="card-footer bg-transparent border-top-0">
                  <div className="btn-group w-100" role="group">
                    <button 
                      className="btn btn-outline-primary btn-sm rounded-start"
                      onClick={() => handleEdit(center)}
                      title="Edit"
                    >
                      <i className="fas fa-edit me-1"></i>
                      Edit
                    </button>
                    <button 
                      className={`btn btn-sm ${center.is_active ? 'btn-outline-warning' : 'btn-outline-success'} rounded-0`}
                      onClick={() => toggleStatus(center)}
                      title={center.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <i className={`fas ${center.is_active ? 'fa-pause' : 'fa-play'}`}></i>
                    </button>
                    <button 
                      className="btn btn-outline-danger btn-sm rounded-end"
                      onClick={() => handleDelete(center.id)}
                      title="Delete"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-light">
                <h5 className="modal-title text-dark">
                  {editingCenter ? `Edit: ${editingCenter.name}` : 'Add New Service Center'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={resetForm}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Name *</label>
                        <input
                          type="text"
                          className="form-control border-secondary"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          required
                          placeholder="Enter service center name"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Address *</label>
                        <textarea
                          className="form-control border-secondary"
                          rows="3"
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          required
                          placeholder="Enter full address"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Phone *</label>
                        <input
                          type="text"
                          className="form-control border-secondary"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          required
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Email</label>
                        <input
                          type="email"
                          className="form-control border-secondary"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="Enter email address"
                        />
                      </div>
                      <div className="row">
                        <div className="col-6">
                          <div className="mb-3">
                            <label className="form-label fw-semibold">Latitude *</label>
                            <input
                              type="number"
                              step="any"
                              className="form-control border-secondary"
                              value={formData.latitude}
                              onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                              required
                              placeholder="23.8103"
                            />
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="mb-3">
                            <label className="form-label fw-semibold">Longitude *</label>
                            <input
                              type="number"
                              step="any"
                              className="form-control border-secondary"
                              value={formData.longitude}
                              onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                              required
                              placeholder="90.4125"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Opening Hours</label>
                        <input
                          type="text"
                          className="form-control border-secondary"
                          value={formData.opening_hours}
                          onChange={(e) => setFormData({...formData, opening_hours: e.target.value})}
                          placeholder="e.g., 8:00 AM - 10:00 PM"
                        />
                      </div>
                      <div className="mb-3 form-check form-switch">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={formData.is_active}
                          onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                          role="switch"
                        />
                        <label className="form-check-label fw-semibold">Active Service Center</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="modal-footer border-top-0 bg-light">
                    <button type="button" className="btn btn-secondary" onClick={resetForm}>
                      <i className="fas fa-times me-1"></i>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-success">
                      <i className={`fas ${editingCenter ? 'fa-save' : 'fa-plus'} me-1`}></i>
                      {editingCenter ? 'Update Service Center' : 'Create Service Center'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceCenters;