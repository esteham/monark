import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminServiceOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0
  });

  // Base URL
  const API_BASE_URL = "https://monark.xetroot.com/api";

  useEffect(() => {
    fetchOrders();
  }, [pagination.current_page, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        alert("Please login first");
        return;
      }

      const params = new URLSearchParams({
        page: pagination.current_page,
        ...(searchTerm && { q: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await axios.get(
        `${API_BASE_URL}/admin/service-orders?${params}`, 
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
          }
        }
      );

      console.log("API Response:", response.data);

      if (response.data.success) {
        setOrders(response.data.data.data);
        setPagination({
          current_page: response.data.data.current_page,
          last_page: response.data.data.last_page,
          total: response.data.data.total
        });
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to load service orders");
    } finally {
      setLoading(false);
    }
  };

  // Confirm booking function - FIXED
  const confirmBooking = async (orderId) => {
    if (!confirm('Confirm this booking and send confirmation email?')) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/admin/service-orders/${orderId}/confirm`,
        {}, // empty object since no data is being sent in body
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert('✅ Booking confirmed! Email sent to customer.');
        fetchOrders(); // Refresh the orders list
      } else {
        alert(response.data.message || 'Failed to confirm booking');
      }
    } catch (error) {
      console.error('Confirm booking error:', error);
      if (error.response) {
        // Server responded with error status
        alert(error.response.data.message || 'Failed to confirm booking');
      } else if (error.request) {
        // Request was made but no response received
        alert('Network error: Could not connect to server');
      } else {
        // Something else happened
        alert('Error: ' + error.message);
      }
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    if (!confirm(`Change status to ${newStatus}?`)) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${API_BASE_URL}/admin/service-orders/${orderId}/status`,
        { status: newStatus },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert("Status updated!");
        fetchOrders();
      }
    } catch (error) {
      alert("Failed to update status");
    }
  };

  // Slip ডাউনলোড ফাংশন
  // AdminServiceOrders.jsx - downloadSlip function এ update করুন
const downloadSlip = async (order) => {
  try {
    const token = localStorage.getItem("token");
    console.log('Token available:', !!token);
    console.log('Order ID:', order.id);
    console.log('Slip number:', order.slip_number);

    // Test API call first
    const testResponse = await fetch(
      `${API_BASE_URL}/admin/service-orders/${order.id}/download-slip`,
      {
        method: 'GET',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json'
        },
      }
    );

    console.log('Test response status:', testResponse.status);
    
    if (testResponse.status === 200) {
      // If test successful, proceed with download
      const response = await fetch(
        `${API_BASE_URL}/admin/service-orders/${order.id}/download-slip`,
        {
          method: 'GET',
          headers: { 
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `booking-slip-${order.slip_number || order.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('Slip downloaded successfully');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Download failed');
      }
    } else {
      const errorData = await testResponse.json();
      alert(`API Error: ${errorData.message || testResponse.statusText}`);
    }
  } catch (error) {
    console.error('Download slip error:', error);
    alert('Network error: ' + error.message);
  }
};

  // Invoice ডাউনলোড ফাংশন - FIXED Syntax Error
  const downloadInvoice = async (order) => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(
        `${API_BASE_URL}/admin/service-orders/${order.id}/download-invoice`,
        {
          method: 'GET',
          headers: { 
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `invoice-${order.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download invoice');
      }
    } catch (error) {
      console.error('Download invoice error:', error);
      alert(error.message || 'Failed to download invoice');
    }
  };

  // Get status badge configuration
  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { class: 'bg-warning text-dark', label: 'Pending' },
      'confirmed': { class: 'bg-info text-white', label: 'Confirmed' },
      'in_progress': { class: 'bg-primary text-white', label: 'In Progress' },
      'completed': { class: 'bg-success text-white', label: 'Completed' },
      'cancelled': { class: 'bg-danger text-white', label: 'Cancelled' }
    };
    
    return statusConfig[status] || { class: 'bg-secondary', label: status };
  };

  // Get available actions for each status
  const getAvailableActions = (order) => {
    const actions = {
      'pending': [
        { action: 'confirm', label: 'Confirm', class: 'btn-success' },
        { action: 'cancelled', label: 'Cancel', class: 'btn-danger' }
      ],
      'confirmed': [
        { action: 'cancelled', label: 'Cancel', class: 'btn-danger' }
      ],
      'in_progress': [
        { action: 'cancelled', label: 'Cancel', class: 'btn-danger' }
      ],
      'completed': [
        
      ],
      'cancelled': []
    };
    
    return actions[order.status] || [];
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, current_page: 1 }));
    fetchOrders();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPrice = (price) => {
    return `৳${parseFloat(price).toFixed(2)}`;
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, current_page: newPage }));
  };

  // Calculate stats from orders
  const stats = {
    total_orders: pagination.total,
    pending_orders: orders.filter(o => o.status === 'pending').length,
    in_progress_orders: orders.filter(o => o.status === 'in_progress').length,
    completed_orders: orders.filter(o => o.status === 'completed').length,
    cancelled_orders: orders.filter(o => o.status === 'cancelled').length,
    revenue: orders
      .filter(o => o.status === 'completed')
      .reduce((sum, order) => sum + (parseFloat(order.service?.price) || 0), 0)
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
          <div className="text-center py-5">
            <div className="spinner-grow text-primary mb-4" style={{width: '3rem', height: '3rem'}} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h5 className="text-muted">Loading services orders...</h5>
          </div>
        </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="h3 mb-0 text-gray-800">Car Wash Service Orders</h1>
            <button className="btn btn-success" onClick={fetchOrders}>
              <i className="fas fa-sync-alt me-2"></i>Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-primary shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Orders
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.total_orders}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-clipboard-list fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-warning shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Pending
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.pending_orders}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-clock fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-info shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    In Progress
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.in_progress_orders}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-spinner fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-success shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Revenue
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    ৳{stats.revenue.toFixed(2)}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-dollar-sign fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <form onSubmit={handleSearch}>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <button className="btn btn-success" type="submit">
                        <i className="fas fa-search"></i> Search
                      </button>
                    </div>
                  </form>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPagination(prev => ({ ...prev, current_page: 1 }));
                    }}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("");
                      setPagination(prev => ({ ...prev, current_page: 1 }));
                      fetchOrders();
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">
                  Service Orders ({pagination.total})
                </h5>
                <small className="text-muted">
                  Showing {orders.length} of {pagination.total} orders
                </small>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Service</th>
                      <th>Price</th>
                      <th>Booking Time</th>
                      <th>Status</th>
                      <th>Slip</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length > 0 ? (
                      orders.map((order) => {
                        const statusConfig = getStatusBadge(order.status);
                        const availableActions = getAvailableActions(order);
                        
                        return (
                          <tr key={order.id}>
                            <td>
                              <strong>#{order.id}</strong>
                              {order.notes && (
                                <>
                                  <br />
                                  <small className="text-muted" title={order.notes}>
                                    📝 {order.notes.length > 30 ? order.notes.substring(0, 30) + '...' : order.notes}
                                  </small>
                                </>
                              )}
                            </td>
                            <td>
                              <strong>{order.user?.name || 'N/A'}</strong>
                              <br />
                              <small className="text-muted">{order.user?.email || 'N/A'}</small>
                            </td>
                            <td>
                              <strong>{order.service?.name || 'N/A'}</strong>
                              <br />
                              <small className="text-muted">{order.service?.description || ''}</small>
                              <br />
                              <small className="text-info">{order.service?.duration || ''}</small>
                            </td>
                            <td>
                              <strong className="text-success">
                                {formatPrice(order.service?.price)}
                              </strong>
                            </td>
                            <td>{formatDate(order.booking_time)}</td>
                            <td>
                              <span className={`badge ${statusConfig.class}`}>
                                {statusConfig.label}
                              </span>
                            </td>
                            <td>
                              {order.slip_number ? (
                                <div className="d-flex flex-column align-items-start">
                                  <strong 
                                    className="text-primary cursor-pointer text-decoration-underline"
                                    onClick={() => downloadSlip(order)}
                                    style={{ cursor: 'pointer' }}
                                    title="Click to download slip"
                                  >
                                    {order.slip_number}
                                  </strong>
                                </div>
                              ) : (
                                <span className="text-muted">Not generated</span>
                              )}
                            </td>
                            <td>
                              <div className="btn-group-vertical">
                                {availableActions.map((action) => (
                                  <button
                                    key={action.action}
                                    className={`btn btn-sm ${action.class} mb-1`}
                                    onClick={() => {
                                      if (action.action === 'confirm') {
                                        confirmBooking(order.id);
                                      } else if (action.action === 'download') {
                                        downloadInvoice(order);
                                      } else {
                                        updateOrderStatus(order.id, action.action);
                                      }
                                    }}
                                  >
                                    {action.label}
                                  </button>
                                ))}
                                
                                {/* Always show download invoice button for completed orders */}
                                {order.status === 'completed' && (
                                  <button
                                    className="btn btn-sm btn-info mb-1"
                                    onClick={() => downloadInvoice(order)}
                                    title="Download Invoice"
                                  >
                                    <i className="fas fa-file-invoice me-1"></i>Invoice
                                  </button>
                                )}

                                {/* Show download slip button for confirmed orders */}
                                {order.status === 'confirmed' && order.slip_number && (
                                  <button
                                    className="btn btn-sm btn-warning mb-1"
                                    onClick={() => downloadSlip(order)}
                                    title="Download Booking Slip"
                                  >
                                    <i className="fas fa-ticket-alt me-1"></i>Slip
                                  </button>
                                )}
                                
                                {availableActions.length === 0 && order.status !== 'completed' && order.status !== 'confirmed' && (
                                  <span className="text-muted small">No actions</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center py-4">
                          <div className="text-muted">
                            <i className="fas fa-inbox fa-3x mb-3"></i>
                            <p>No service orders found</p>
                            <button 
                              className="btn btn-success btn-sm"
                              onClick={fetchOrders}
                            >
                              Try Again
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.last_page > 1 && (
                <nav className="d-flex justify-content-center mt-4">
                  <ul className="pagination">
                    <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(pagination.current_page - 1)}
                        disabled={pagination.current_page === 1}
                      >
                        Previous
                      </button>
                    </li>
                    
                    {[...Array(pagination.last_page)].map((_, index) => (
                      <li key={index + 1} className={`page-item ${pagination.current_page === index + 1 ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(index + 1)}
                        >
                          {index + 1}
                        </button>
                      </li>
                    ))}
                    
                    <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(pagination.current_page + 1)}
                        disabled={pagination.current_page === pagination.last_page}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminServiceOrders;