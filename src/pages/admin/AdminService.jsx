import React, { useEffect, useState } from "react";
import { 
  getAdminServices, 
  createService, 
  updateService, 
  deleteService, 
  toggleServiceStatus,
  uploadServiceImage
} from '../../api/client';
import Swal from 'sweetalert2';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalServices, setTotalServices] = useState(0);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    status: "active",
    image: ""
  });

  const BASE_URL = "http://127.0.0.1:8000/";
  // Fetch services with pagination
  const fetchServices = async (page = currentPage) => {
    setLoading(true);
    try {
      const response = await getAdminServices(page, perPage);
      
      console.log('🟢 Full API Response:', response);
      
      if (response.success) {
        // Paginated response structure
        const servicesData = response.data?.data || [];
        const paginationInfo = response.data;
        
        setServices(servicesData);
        setCurrentPage(paginationInfo.current_page || 1);
        setTotalPages(paginationInfo.last_page || 1);
        setTotalServices(paginationInfo.total || 0);
        
        console.log('🟢 Pagination Info:', {
          current: paginationInfo.current_page,
          totalPages: paginationInfo.last_page,
          total: paginationInfo.total,
          perPage: paginationInfo.per_page
        });
      } else {
        setServices([]);
        console.error("API returned success: false");
      }
    } catch (err) {
      console.error("❌ Error fetching services:", err.response?.data || err.message);
      Swal.fire('Error', 'Failed to fetch services', 'error');
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (file) => {
    setUploading(true);
    try {
      console.log('🟡 Starting image upload...', file);

      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const result = await uploadServiceImage(uploadFormData);
      console.log('🟢 Upload response:', result);

      if (result.success) {
        setFormData(prev => ({ ...prev, image: result.url }));
        
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Image uploaded successfully',
          timer: 2000,
          showConfirmButton: false
        });
        
        return result.url;
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (err) {
      console.error("❌ Upload error:", err);
      Swal.fire('Error', err.message || 'Upload failed', 'error');
      setImagePreview("");
    } finally {
      setUploading(false);
    }
  };

  // Get image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath || imagePath === '') {
      return '/images/default-service.jpg';
    }
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    if (imagePath.startsWith('/storage/')) {
      return `${BASE_URL}${imagePath}`;
    }
    
    return `${BASE_URL}${imagePath}`;
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        Swal.fire('Error', 'Please select an image file', 'error');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire('Error', 'Image size should be less than 5MB', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);

      handleImageUpload(file);
    }
  };

  // Add new service
  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      console.log('🟡 Adding service with data:', formData);
      
      if (!formData.name || !formData.description || !formData.price || !formData.duration) {
        Swal.fire('Error', 'Please fill all required fields', 'error');
        return;
      }

      const response = await createService(formData);
      console.log('🟢 Add service response:', response);

      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Service added successfully!',
          timer: 2000,
          showConfirmButton: false
        });
        setShowAddModal(false);
        resetForm();
        fetchServices(currentPage); // Refresh current page
      } else {
        throw new Error(response.message || 'Failed to add service');
      }
    } catch (err) {
      console.error("❌ Error adding service:", err.response?.data || err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to add service', 'error');
    }
  };

  // Edit service
  const handleEditService = async (e) => {
    e.preventDefault();
    try {
      console.log('🟡 Updating service with data:', formData);
      
      const response = await updateService(selectedService.id, formData);
      console.log('🟢 Update service response:', response);

      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Service updated successfully!',
          timer: 2000,
          showConfirmButton: false
        });
        setShowEditModal(false);
        resetForm();
        fetchServices(currentPage); // Refresh current page
      } else {
        throw new Error(response.message || 'Failed to update service');
      }
    } catch (err) {
      console.error("❌ Error updating service:", err.response?.data || err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to update service', 'error');
    }
  };

  // Delete service
  const handleDeleteService = async (serviceId, serviceName) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You want to delete "${serviceName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const response = await deleteService(serviceId);
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Service has been deleted successfully',
            timer: 2000,
            showConfirmButton: false
          });
          fetchServices(currentPage); // Refresh current page
        } else {
          throw new Error(response.message || 'Failed to delete service');
        }
      } catch (error) {
        console.error('❌ Error deleting service:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || error.message || 'Failed to delete service'
        });
      }
    }
  };

  // Toggle service status
  const handleStatusToggle = async (service) => {
    const action = service.status === 'active' ? 'deactivate' : 'activate';

    const result = await Swal.fire({
      title: 'Change Status?',
      text: `Are you sure you want to ${action} "${service.name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Yes, ${action} it!`,
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const response = await toggleServiceStatus(service.id);
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: 'Status Updated!',
            text: `Service has been ${action}d successfully`,
            timer: 2000,
            showConfirmButton: false
          });
          fetchServices(currentPage); // Refresh current page
        } else {
          throw new Error(response.message || 'Failed to update service status');
        }
      } catch (error) {
        console.error('❌ Error updating service status:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || error.message || 'Failed to update service status'
        });
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      duration: "",
      status: "active",
      image: ""
    });
    setImagePreview("");
    setSelectedService(null);
  };

  // Open edit modal
  const openEditModal = (service) => {
    console.log('🟡 Opening edit modal for service:', service);
    setSelectedService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      status: service.status,
      image: service.image || ""
    });
    
    if (service.image) {
      const imageUrl = getImageUrl(service.image);
      console.log('🟡 Setting image preview:', imageUrl);
      setImagePreview(imageUrl);
    } else {
      setImagePreview("");
    }
    
    setShowEditModal(true);
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  useEffect(() => {
    fetchServices();
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
          <i className="fa-solid fa-wrench me-2"></i>
          Services Management
        </h2>
        <button 
          className="btn btn-success"
          onClick={() => setShowAddModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Add New Service
        </button>
      </div>
      
      {loading ? (
        <div className="container-fluid py-4">
          <div className="text-center py-5">
            <div className="spinner-grow text-primary mb-4" style={{width: '3rem', height: '3rem'}} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h5 className="text-muted">Loading services data...</h5>
          </div>
        </div>
      ) : services.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="fas fa-concierge-bell fa-4x text-muted mb-3"></i>
            <h4 className="text-muted">No Services Found</h4>
            <p className="text-muted">There are no services in the system yet.</p>
            <button 
              className="btn btn-success"
              onClick={() => setShowAddModal(true)}
            >
              <i className="fas fa-plus me-2"></i>
              Add First Service
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0">
                <i className="fas fa-list me-2"></i>
                Services List ({totalServices} total services)
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-4" style={{width: '80px'}}>Image</th>
                      <th>Service Name</th>
                      <th>Description</th>
                      <th>Price</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th className="text-center" style={{width: '200px'}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map(service => (
                      <tr key={service.id}>
                        <td className="ps-4">
                          <img 
                            src={`${BASE_URL}${service.image}`}
                            alt={service.name}
                            className="rounded"
                            style={{ 
                              width: '50px', 
                              height: '50px', 
                              objectFit: 'cover' 
                            }}
                            onError={(e) => {
                              console.log('❌ Image load error, using default');
                              e.target.src = '/images/default-service.jpg';
                            }}
                          />
                        </td>
                        <td>
                          <strong>{service.name}</strong>
                        </td>
                        <td>
                          <span 
                            className="text-truncate d-inline-block" 
                            style={{maxWidth: '250px'}}
                            title={service.description}
                          >
                            {service.description}
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold text-success">
                            {formatCurrency(service.price)}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-info text-dark">
                            {service.duration}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${service.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                            <i className={`fas ${service.status === 'active' ? 'fa-check' : 'fa-pause'} me-1`}></i>
                            {service.status}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => openEditModal(service)}
                              title="Edit Service"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-outline-warning"
                              onClick={() => handleStatusToggle(service)}
                              title={service.status === 'active' ? 'Deactivate' : 'Activate'}
                            >
                              <i className={`fas ${service.status === 'active' ? 'fa-pause' : 'fa-play'}`}></i>
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDeleteService(service.id, service.name)}
                              title="Delete Service"
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

          {/* Pagination Section */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div>
                <small className="text-muted">
                  Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalServices)} of {totalServices} services
                </small>
              </div>
              
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  {/* Previous Button */}
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => fetchServices(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                  </li>
                  
                  {/* Page Numbers */}
                  {generatePageNumbers().map(page => (
                    <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                      <button 
                        className="page-link"
                        onClick={() => fetchServices(page)}
                      >
                        {page}
                      </button>
                    </li>
                  ))}
                  
                  {/* Next Button */}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => fetchServices(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
              
              <div>
                <select 
                  className="form-select form-select-sm" 
                  style={{width: '80px'}}
                  value={perPage}
                  onChange={(e) => {
                    const newPerPage = Number(e.target.value);
                    setPerPage(newPerPage);
                    setCurrentPage(1);
                    setTimeout(() => fetchServices(1), 0);
                  }}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-dark">Add New Service</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                ></button>
              </div>
              <form onSubmit={handleAddService}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-4">
                        <label className="form-label fw-semibold">Service Image</label>
                        <div className="border rounded p-3 text-center">
                          {imagePreview ? (
                            <div className="mb-3">
                              <img 
                                src={imagePreview} 
                                alt="Preview" 
                                className="img-fluid rounded mb-3"
                                style={{ maxHeight: '200px', objectFit: 'cover' }}
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
                              <p className="text-muted mb-3">Upload service image</p>
                            </div>
                          )}
                          
                          <div className="d-grid">
                            <label className={`btn btn-outline-primary btn-sm ${uploading ? 'disabled' : ''}`}>
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
                      <div className="mb-3">
                        <label className="form-label">Service Name *</label>
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
                            <label className="form-label">Price (BDT) *</label>
                            <input 
                              type="number" 
                              className="form-control"
                              step="0.01"
                              min="0"
                              value={formData.price}
                              onChange={(e) => setFormData({...formData, price: e.target.value})}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-sm-6">
                          <div className="mb-3">
                            <label className="form-label">Duration *</label>
                            <input 
                              type="text" 
                              className="form-control"
                              placeholder="e.g., 30 min, 1 hour"
                              value={formData.duration}
                              onChange={(e) => setFormData({...formData, duration: e.target.value})}
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select 
                          className="form-select"
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
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
                      'Add Service'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && selectedService && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-dark">Edit Service - {selectedService.name}</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                ></button>
              </div>
              <form onSubmit={handleEditService}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-4">
                        <label className="form-label fw-semibold">Service Image</label>
                        <div className="border rounded p-3 text-center">
                          {imagePreview ? (
                            <div className="mb-3">
                              <img 
                                src={imagePreview} 
                                alt="Preview" 
                                className="img-fluid rounded mb-3"
                                style={{ maxHeight: '200px', objectFit: 'cover' }}
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
                            <label className={`btn btn-outline-primary btn-sm ${uploading ? 'disabled' : ''}`}>
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
                      <div className="mb-3">
                        <label className="form-label">Service Name *</label>
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
                            <label className="form-label">Price (BDT) *</label>
                            <input 
                              type="number" 
                              className="form-control"
                              step="0.01"
                              min="0"
                              value={formData.price}
                              onChange={(e) => setFormData({...formData, price: e.target.value})}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-sm-6">
                          <div className="mb-3">
                            <label className="form-label">Duration *</label>
                            <input 
                              type="text" 
                              className="form-control"
                              value={formData.duration}
                              onChange={(e) => setFormData({...formData, duration: e.target.value})}
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select 
                          className="form-select"
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
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
                      'Update Service'
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