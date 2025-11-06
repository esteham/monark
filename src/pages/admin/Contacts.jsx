import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    address: "",
    phone: "",
    email: "",
    map_embed: ""
  });
  const [isEditing, setIsEditing] = useState(false);

  // Get authentication token
  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  // Fetch contacts data with proper error handling
  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError("");
      
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Add authorization header only if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch("https://monark.xetroot.com/api/contacts", {
        method: 'GET',
        headers: headers,
      });

      // Handle different response statuses
      if (response.status === 401) {
        throw new Error("Authentication required. Please login again.");
      } else if (response.status === 403) {
        throw new Error("You don't have permission to access contacts.");
      } else if (response.status === 404) {
        // API route not found - might be authentication issue
        throw new Error("Contacts API endpoint not found. Check backend routes.");
      } else if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle case where API returns error object instead of array
      if (data && data.error) {
        throw new Error(data.message || data.error);
      }

      setContacts(Array.isArray(data) ? data : []);

      // If there's existing data, populate form for editing
      if (Array.isArray(data) && data.length > 0) {
        setFormData({
          address: data[0].address || "",
          phone: data[0].phone || "",
          email: data[0].email || "",
          map_embed: data[0].map_embed || ""
        });
        setIsEditing(true);
      }
    } catch (err) {
      console.error('Fetch contacts error:', err);
      setError(err.message);
      
      // Show more specific error messages
      if (err.message.includes('Failed to fetch')) {
        setError("Cannot connect to server. Please check if backend is running.");
      } else if (err.message.includes('CORS')) {
        setError("CORS error. Please check backend CORS configuration.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission with proper error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const token = getAuthToken();
      const currentContactId = contacts.length > 0 ? contacts[0].id : null;
      
      const url = isEditing && currentContactId
        ? `https://monark.xetroot.com/api/contacts/${currentContactId}`
        : "https://monark.xetroot.com/api/contacts";
      
      const method = isEditing && currentContactId ? "PUT" : "POST";

      const headers = {
        "Content-Type": "application/json",
      };

      // Add authorization header only if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: method,
        headers: headers,
        body: JSON.stringify(formData),
      });

      // Handle different response statuses
      if (response.status === 401) {
        throw new Error("Authentication required. Please login again.");
      } else if (response.status === 422) {
        const errorData = await response.json();
        const validationErrors = Object.values(errorData.errors || errorData.messages || {}).flat();
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      } else if (response.status === 404) {
        throw new Error("Contact not found. It may have been deleted.");
      } else if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Refresh contacts data
      await fetchContacts();
      
      // Show success message
      alert(`Contact information ${isEditing ? 'updated' : 'created'} successfully!`);
      
    } catch (err) {
      console.error('Save contact error:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Safe map preview component
  const MapPreview = () => {
    if (!formData.map_embed || !formData.map_embed.includes('iframe')) {
      return (
        <div className="text-center text-muted py-4">
          <i className="fas fa-map-marked-alt fa-3x mb-3"></i>
          <p>No valid map embed code provided</p>
          <small>Please add a Google Maps iframe code</small>
        </div>
      );
    }

    // Basic sanitization for map embed
    const sanitizedMapEmbed = formData.map_embed
      .replace(/on\w+=/g, 'data-removed=')
      .replace(/javascript:/g, 'data-removed:');

    return (
      <div 
        dangerouslySetInnerHTML={{ __html: sanitizedMapEmbed }}
        style={{ 
          pointerEvents: 'none',
          borderRadius: '8px',
          overflow: 'hidden',
          minHeight: '200px'
        }}
      />
    );
  };

  // Retry function
  const handleRetry = () => {
    fetchContacts();
  };

  if (loading && contacts.length === 0) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading contact information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1 text-gray-800">Contact Information</h1>
          <p className="text-muted">Manage your company's contact details and location map</p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-info"
            onClick={handleRetry}
            disabled={loading}
          >
            <i className="fas fa-sync-alt me-2"></i>
            Refresh
          </button>
          <Link to="/admin" className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <div className="d-flex align-items-center">
            <i className="fas fa-exclamation-triangle me-2"></i>
            <div>
              <strong>Error!</strong> {error}
            </div>
          </div>
          <div className="mt-2">
            <button className="btn btn-sm btn-outline-danger me-2" onClick={handleRetry}>
              <i className="fas fa-redo me-1"></i>
              Retry
            </button>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError("")}
              aria-label="Close"
            ></button>
          </div>
        </div>
      )}

      <div className="row">
        {/* Contact Form */}
        <div className="col-lg-6 mb-4">
          <div className="card shadow">
            <div className="card-header bg-primary text-white py-3">
              <h5 className="card-title mb-0">
                <i className="fas fa-edit me-2"></i>
                {isEditing ? "Update Contact Information" : "Add Contact Information"}
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="address" className="form-label">
                    Address <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    className="form-control"
                    rows="3"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter complete address"
                    disabled={saving}
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="phone" className="form-label">
                      Phone Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      className="form-control"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="+880 XXXX-XXXXXX"
                      disabled={saving}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="email" className="form-label">
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="contact@example.com"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="map_embed" className="form-label">
                    Google Map Embed Code
                  </label>
                  <textarea
                    id="map_embed"
                    name="map_embed"
                    className="form-control"
                    rows="4"
                    value={formData.map_embed}
                    onChange={handleInputChange}
                    placeholder='&lt;iframe src="https://www.google.com/maps/embed?pb=..." width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"&gt;&lt;/iframe&gt;'
                    disabled={saving}
                  />
                  <div className="form-text">
                    Paste the embed code from Google Maps. Make sure to include the full iframe code.
                  </div>
                </div>

                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <button
                    type="button"
                    className="btn btn-outline-secondary me-md-2"
                    onClick={() => {
                      setFormData({
                        address: contacts[0]?.address || "",
                        phone: contacts[0]?.phone || "",
                        email: contacts[0]?.email || "",
                        map_embed: contacts[0]?.map_embed || ""
                      });
                    }}
                    disabled={saving}
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        {isEditing ? "Updating..." : "Saving..."}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        {isEditing ? "Update" : "Save"} Contact Info
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Map Preview and Current Information */}
        <div className="col-lg-6">
          {/* Map Preview */}
          <div className="card shadow mb-4">
            <div className="card-header bg-success text-white py-3">
              <h5 className="card-title mb-0">
                <i className="fas fa-map me-2"></i>
                Map Preview
              </h5>
            </div>
            <div className="card-body p-0">
              <MapPreview />
            </div>
          </div>

          {/* Current Contact Information */}
          <div className="card shadow">
            <div className="card-header bg-info text-white py-3">
              <h5 className="card-title mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Current Contact Information
                {contacts.length > 0 && (
                  <span className="badge bg-success ms-2">
                    <i className="fas fa-check me-1"></i>
                    Saved
                  </span>
                )}
              </h5>
            </div>
            <div className="card-body">
              {contacts.length > 0 ? (
                <div className="row">
                  <div className="col-12 mb-3">
                    <strong className="d-block mb-1">Address:</strong>
                    <p className="mb-0 text-muted">{contacts[0].address}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <strong className="d-block mb-1">Phone:</strong>
                    <p className="mb-0 text-muted">
                      <i className="fas fa-phone me-1"></i>
                      {contacts[0].phone}
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <strong className="d-block mb-1">Email:</strong>
                    <p className="mb-0 text-muted">
                      <i className="fas fa-envelope me-1"></i>
                      {contacts[0].email}
                    </p>
                  </div>
                  <div className="col-12">
                    <strong className="d-block mb-1">Last Updated:</strong>
                    <p className="mb-0 text-muted">
                      <i className="fas fa-clock me-1"></i>
                      {new Date(contacts[0].updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="fas fa-address-book fa-3x mb-3"></i>
                  <p>No contact information found</p>
                  <small>Please add your company's contact details using the form</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}