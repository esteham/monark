import React, { useEffect, useState } from "react";
import axios from "axios";

// Base URL configuration
const BASE_URL = "https://monark.xetroot.com";

export default function AdminParkings() {
  const [parkings, setParkings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedParking, setSelectedParking] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_per_hour: "",
    distance: "",
    total_slots: "",
    image: ""
  });

  // Your perfect image URL handler function
  const getImageUrl = (image) => {
    if (!image || image === 'null') {
        return '/images/default-parking.jpg';
    }
    
    // Check if image already has full URL
    if (image.startsWith('http')) {
        return image;
    }
    
    // Remove 'storage/' prefix if present and construct proper URL
    let imagePath = image;
    if (image.startsWith('storage/')) {
        imagePath = image.replace('storage/', '');
    }
    
    // Remove leading slash if present to avoid double slashes
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    
    // Construct full URL using BASE_URL
    return `${BASE_URL}/storage/${cleanPath}`;
};

  const fetchParkings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/api/admin/parkings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (res.data.success) {
        // Process images to include full URLs using your function
        const parkingsWithFullUrls = res.data.data.map(parking => ({
          ...parking,
          image: getImageUrl(parking.image)
        }));
        setParkings(parkingsWithFullUrls);
      } else {
        setParkings([]);
        console.error("API returned success: false");
      }
    } catch (err) {
      console.error("Error fetching parkings:", err.response?.data || err.message);
      // Temporary: Mock data for testing with full URLs
      setParkings([
        {
          id: 1,
          name: "Downtown Parking",
          description: "2 km from city center • BDT 20/hr • 5 spots available",
          price_per_hour: "20.00",
          total_slots: 7,
          available_slots: 6,
          distance: "2 km from city center",
          image: getImageUrl("/images/parking-lot1.jpg")
        },
        {
          id: 2,
          name: "Mall Parking", 
          description: "500 m from shopping mall • BDT 30/hr • 3 spots available",
          price_per_hour: "30.00",
          total_slots: 4,
          available_slots: 4,
          distance: "1 km from terminal",
          image: getImageUrl("/images/parking-lot2.jpg")
        },
        {
          id: 3,
          name: "Airport Parking",
          description: "1 km from terminal • BDT 50/hr • 8 spots available", 
          price_per_hour: "50.00",
          total_slots: 5,
          available_slots: 5,
          distance: "1 km from terminal",
          image: getImageUrl("/images/parking-lot3.jpg")
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const res = await axios.post(`${BASE_URL}/api/admin/upload-image`, uploadFormData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        const imageUrl = getImageUrl(res.data.url);
        setFormData(prev => ({ ...prev, image: res.data.url }));
        setImagePreview(imageUrl);
        return res.data.url;
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // File validation
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Upload image
      handleImageUpload(file);
    }
  };

  const handleAddParking = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${BASE_URL}/api/admin/parkings`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (res.data.success) {
        alert('Parking added successfully!');
        setShowAddModal(false);
        resetForm();
        fetchParkings();
      }
    } catch (err) {
      console.error("Error adding parking:", err);
      alert('Failed to add parking');
    }
  };

  const handleEditParking = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${BASE_URL}/api/admin/parkings/${selectedParking.id}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (res.data.success) {
        alert('Parking updated successfully!');
        setShowEditModal(false);
        resetForm();
        fetchParkings();
      }
    } catch (err) {
      console.error("Error updating parking:", err);
      alert('Failed to update parking');
    }
  };

  const handleDeleteParking = async (parkingId, parkingName) => {
    if (!window.confirm(`Are you sure you want to delete "${parkingName}"? This will also delete all associated slots!`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`${BASE_URL}/api/admin/parkings/${parkingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (res.data.success) {
        alert('Parking deleted successfully!');
        fetchParkings();
      }
    } catch (err) {
      console.error("Error deleting parking:", err);
      alert('Failed to delete parking');
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price_per_hour: "",
      distance: "",
      total_slots: "",
      image: ""
    });
    setImagePreview("");
    setSelectedParking(null);
  };

  const openEditModal = (parking) => {
    setSelectedParking(parking);
    setFormData({
      name: parking.name,
      description: parking.description,
      price_per_hour: parking.price_per_hour,
      distance: parking.distance,
      total_slots: parking.total_slots,
      image: parking.image || ""
    });
    setImagePreview(parking.image || "");
    setShowEditModal(true);
  };

  useEffect(() => {
    fetchParkings();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">
          <i className="fas fa-parking me-2"></i>
          Parking Lots Management
        </h2>
        <button 
          className="btn btn-success"
          onClick={() => setShowAddModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Add New Parking
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-grow text-primary mb-3" style={{width: '3rem', height: '3rem'}} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading parking data...</p>
        </div>
      ) : parkings.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="fas fa-parking fa-4x text-muted mb-3"></i>
            <h4 className="text-muted">No Parking Lots Found</h4>
            <p className="text-muted">There are no parking lots in the system yet.</p>
            <button 
              className="btn btn-success"
              onClick={() => setShowAddModal(true)}
            >
              <i className="fas fa-plus me-2"></i>
              Add First Parking
            </button>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="ps-4">Parking</th>
                    <th scope="col">Location</th>
                    <th scope="col">Slots</th>
                    <th scope="col">Price/Hour</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-center pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parkings.map(parking => (
                    <tr key={parking.id} className="align-middle">
                      <td className="ps-4">
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0 me-3">
                            <img 
                              src={getImageUrl(parking.image)} 
                              alt={parking.name}
                              className="rounded"
                              style={{ 
                                width: '60px', 
                                height: '45px', 
                                objectFit: 'cover' 
                              }}
                              onError={(e) => {
                                e.target.src = '/images/default-parking.jpg';
                              }}
                            />
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-1 fw-bold text-primary">{parking.name}</h6>
                            <small className="text-muted">{parking.description}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <small>
                          <i className="fas fa-map-marker-alt text-danger me-1"></i>
                          {parking.distance}
                        </small>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span className="fw-bold me-2">{parking.available_slots || 0}</span>
                          <small className="text-muted">/ {parking.total_slots || 0}</small>
                        </div>
                        <div className="progress" style={{height: '4px', width: '80px'}}>
                          <div 
                            className="progress-bar bg-success" 
                            style={{ 
                              width: `${((parking.available_slots || 0) / (parking.total_slots || 1)) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </td>
                      <td>
                        <span className="fw-bold text-info">
                          {formatCurrency(parking.price_per_hour)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${(parking.available_slots || 0) > 0 ? 'bg-success' : 'bg-danger'}`}>
                          {(parking.available_slots || 0) > 0 ? 'Available' : 'Full'}
                        </span>
                      </td>
                      <td className="text-center pe-4">
                        <div className="btn-group" role="group">
                          <button 
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => openEditModal(parking)}
                            title="Edit Parking"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteParking(parking.id, parking.name)}
                            title="Delete Parking"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Parking Modal */}
      {showAddModal && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Parking</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                ></button>
              </div>
              <form onSubmit={handleAddParking}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      {/* Image Upload Section */}
                      <div className="mb-4">
                        <label className="form-label fw-semibold">Parking Image</label>
                        <div className="border rounded p-3 text-center">
                          {imagePreview ? (
                            <div className="mb-3">
                              <img 
                                src={imagePreview} 
                                alt="Preview" 
                                className="img-fluid rounded mb-3"
                                style={{ 
                                  maxHeight: '200px', 
                                  width: '100%',
                                  objectFit: 'cover' 
                                }}
                                onError={(e) => {
                                  e.target.src = '/images/default-parking.jpg';
                                }}
                              />
                              <div className="d-flex gap-2 justify-content-center">
                                <button 
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => {
                                    setImagePreview("");
                                    setFormData(prev => ({ ...prev, image: "" }));
                                  }}
                                >
                                  <i className="fas fa-times me-1"></i>
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="py-4">
                              <i className="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                              <p className="text-muted mb-3">Upload parking image</p>
                            </div>
                          )}
                          
                          <div className="d-grid">
                            <label className="btn btn-outline-primary btn-sm">
                              {uploading ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2"></span>
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-upload me-2"></i>
                                  Choose Image
                                </>
                              )}
                              <input 
                                type="file" 
                                className="d-none" 
                                accept="image/*"
                                onChange={handleImageChange}
                                disabled={uploading}
                              />
                            </label>
                          </div>
                          <small className="text-muted mt-2 d-block">
                            Supported formats: JPG, PNG, GIF • Max size: 5MB
                          </small>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      {/* Form Fields */}
                      <div className="mb-3">
                        <label className="form-label">Parking Name *</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Description *</label>
                        <textarea 
                          className="form-control"
                          rows="3"
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          required
                        />
                      </div>
                      <div className="row">
                        <div className="col-sm-6">
                          <div className="mb-3">
                            <label className="form-label">Price Per Hour (BDT) *</label>
                            <input 
                              type="number" 
                              className="form-control"
                              value={formData.price_per_hour}
                              onChange={(e) => setFormData({...formData, price_per_hour: e.target.value})}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-sm-6">
                          <div className="mb-3">
                            <label className="form-label">Total Slots *</label>
                            <input 
                              type="number" 
                              className="form-control"
                              value={formData.total_slots}
                              onChange={(e) => setFormData({...formData, total_slots: e.target.value})}
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Distance Info *</label>
                        <input 
                          type="text" 
                          className="form-control"
                          placeholder="e.g., 2 km from city center"
                          value={formData.distance}
                          onChange={(e) => setFormData({...formData, distance: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success" disabled={uploading}>
                    {uploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Adding...
                      </>
                    ) : (
                      'Add Parking'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Parking Modal */}
      {showEditModal && selectedParking && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-dark">Edit Parking - {selectedParking.name}</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                ></button>
              </div>
              <form onSubmit={handleEditParking}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      {/* Image Upload Section */}
                      <div className="mb-4">
                        <label className="form-label fw-semibold">Parking Image</label>
                        <div className="border rounded p-3 text-center">
                          {imagePreview ? (
                            <div className="mb-3">
                              <img 
                                src={imagePreview} 
                                alt="Preview" 
                                className="img-fluid rounded mb-3"
                                style={{ 
                                  maxHeight: '200px', 
                                  width: '100%',
                                  objectFit: 'cover' 
                                }}
                                onError={(e) => {
                                  e.target.src = '/images/default-parking.jpg';
                                }}
                              />
                              <div className="d-flex gap-2 justify-content-center">
                                <button 
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => {
                                    setImagePreview("");
                                    setFormData(prev => ({ ...prev, image: "" }));
                                  }}
                                >
                                  <i className="fas fa-times me-1"></i>
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="py-4">
                              <i className="fas fa-image fa-3x text-muted mb-3"></i>
                              <p className="text-muted mb-3">No image selected</p>
                            </div>
                          )}
                          
                          <div className="d-grid">
                            <label className="btn btn-outline-primary btn-sm">
                              {uploading ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2"></span>
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-upload me-2"></i>
                                  Change Image
                                </>
                              )}
                              <input 
                                type="file" 
                                className="d-none" 
                                accept="image/*"
                                onChange={handleImageChange}
                                disabled={uploading}
                              />
                            </label>
                          </div>
                          <small className="text-muted mt-2 d-block">
                            Supported formats: JPG, PNG, GIF • Max size: 5MB
                          </small>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-md-6">
                      {/* Form Fields */}
                      <div className="mb-3">
                        <label className="form-label">Parking Name *</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Description *</label>
                        <textarea 
                          className="form-control"
                          rows="3"
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          required
                        />
                      </div>
                      <div className="row">
                        <div className="col-sm-6">
                          <div className="mb-3">
                            <label className="form-label">Price Per Hour (BDT) *</label>
                            <input 
                              type="number" 
                              className="form-control"
                              value={formData.price_per_hour}
                              onChange={(e) => setFormData({...formData, price_per_hour: e.target.value})}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-sm-6">
                          <div className="mb-3">
                            <label className="form-label">Total Slots *</label>
                            <input 
                              type="number" 
                              className="form-control"
                              value={formData.total_slots}
                              onChange={(e) => setFormData({...formData, total_slots: e.target.value})}
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Distance Info *</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={formData.distance}
                          onChange={(e) => setFormData({...formData, distance: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success" disabled={uploading}>
                    {uploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Updating...
                      </>
                    ) : (
                      'Update Parking'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}