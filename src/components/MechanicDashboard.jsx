import React, { useState, useEffect } from "react";
import axios from "axios";
import Spinner from "../components/Spinner";
import Swal from 'sweetalert2';

const MechanicDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [statusFilter, setStatusFilter] = useState("");
  const [loadingButtons, setLoadingButtons] = useState({});

  const API_BASE_URL = "http://127.0.0.1:8000/api";

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const params = new URLSearchParams({
        ...(statusFilter && { status: statusFilter })
      });

      const response = await axios.get(
        `${API_BASE_URL}/mechanic/orders?${params}`, 
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
          }
        }
      );

      if (response.data.success) {
        setOrders(response.data.data.data || response.data.data);
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to load orders',
        text: 'Please try again later',
        timer: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/mechanic/dashboard-stats`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });

      if (response.data.success) {
        setStats(response.data.data);
      } else {
        console.warn("Stats API returned success: false", response.data);
        setStats({
          confirmed_orders: orders.filter(o => o.status === 'confirmed').length,
          in_progress_orders: orders.filter(o => o.status === 'in_progress').length,
          completed_today: 0,
          total_assigned: orders.length
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats({
        confirmed_orders: orders.filter(o => o.status === 'confirmed').length,
        in_progress_orders: orders.filter(o => o.status === 'in_progress').length,
        completed_today: 0,
        total_assigned: orders.length
      });
    }
  };

  const startService = async (orderId) => {
    const result = await Swal.fire({
      title: 'Start Service?',
      text: 'Are you sure you want to start this service?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Start Service!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      setLoadingButtons(prev => ({ ...prev, [orderId]: true }));
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/mechanic/orders/${orderId}/start`,
        {},
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Service Started!',
          text: 'Service has been started successfully',
          timer: 2000,
          showConfirmButton: false
        });
        fetchOrders();
        fetchStats();
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Failed to start service',
        text: 'Please try again',
        timer: 3000
      });
    } finally {
      setLoadingButtons(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const completeService = async (orderId) => {
    const result = await Swal.fire({
      title: 'Complete Service?',
      text: 'Are you sure you want to mark this service as completed?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Complete Service!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      setLoadingButtons(prev => ({ ...prev, [orderId]: true }));
      const token = localStorage.getItem("token");
      
      const response = await axios.post(
        `${API_BASE_URL}/mechanic/orders/${orderId}/complete`,
        {},
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      if (response.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Service Completed!',
          text: 'Service has been completed successfully',
          timer: 2000,
          showConfirmButton: false
        });
        fetchOrders();
        fetchStats();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to complete service',
          text: response.data.message || 'Please try again',
          timer: 3000
        });
      }
    } catch (error) {
      let errorMessage = 'Failed to complete service';
      
      if (error.response) {
        errorMessage = error.response.data.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Network error: Could not connect to server';
      } else {
        errorMessage = 'Error: ' + error.message;
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        timer: 4000
      });
    } finally {
      setLoadingButtons(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // Slip download function
  const downloadSlip = async (order) => {
    try {
      const token = localStorage.getItem("token");
      console.log('Downloading slip for order:', order.id);
      console.log('Slip number:', order.slip_number);

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
        
        await Swal.fire({
          icon: 'success',
          title: 'Slip Downloaded!',
          text: 'Booking slip has been downloaded successfully',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Download failed');
      }
    } catch (error) {
      console.error('Download slip error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: error.message || 'Failed to download slip',
        timer: 3000
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPrice = (price) => {
    return `৳${parseFloat(price).toFixed(2)}`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'confirmed': { class: 'bg-info text-white', label: 'Ready' },
      'in_progress': { class: 'bg-warning text-dark', label: 'In Progress' }
    };
    
    return statusConfig[status] || { class: 'bg-secondary', label: status };
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              {/*<h1 className="h3 mb-0 text-gray-800">Mechanic Dashboard</h1>
              <p className="text-muted">Manage your assigned car wash services</p>*/}
            </div>
            <button className="btn btn-primary my-4" onClick={() => { fetchOrders(); fetchStats(); }}>
              <i className="fas fa-sync-alt me-2"></i>Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Mechanic Stats */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-primary shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Ready for Service
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.confirmed_orders || 0}
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
          <div className="card border-left-warning shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    In Progress
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.in_progress_orders || 0}
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
                    Completed Today
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.completed_today || 0}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-check-circle fa-2x text-gray-300"></i>
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
                    Total Assigned
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.total_assigned || 0}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-clipboard-list fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Assigned Orders</option>
                    <option value="confirmed">Ready for Service</option>
                    <option value="in_progress">In Progress</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={() => setStatusFilter("")}
                  >
                    Clear Filter
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
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th className="text-center">Order ID</th>
                      <th className="text-center">Customer</th>
                      <th className="text-center">Service</th>
                      <th className="text-center">Booking Time</th>
                      <th className="text-center">Slip</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length > 0 ? (
                      orders.map((order) => {
                        const statusConfig = getStatusBadge(order.status);
                        const isLoading = loadingButtons[order.id];
                        
                        return (
                          <tr key={order.id}>
                            <td>
                              <strong>#{order.id}</strong>
                              {order.notes && (
                                <>
                                  <br />
                                  <small className="text-muted">
                                    📝 {order.notes}
                                  </small>
                                </>
                              )}
                            </td>
                            <td>
                              <strong>{order.user?.name}</strong>
                              <br />
                              <small>{order.user?.email}</small>
                            </td>
                            <td>
                              <strong>{order.service?.name}</strong>
                              <br />
                              <small>{order.service?.description}</small>
                              <br />
                              <small className="text-info">{order.service?.duration}</small>
                              <br />
                              <strong className="text-success">{formatPrice(order.service?.price)}</strong>
                            </td>
                            <td>{formatDate(order.booking_time)}</td>
                            <td className="text-center">
                              {order.slip_number ? (
                                <div className="d-flex flex-column align-items-center">
                                  <strong 
                                    className="text-primary cursor-pointer text-decoration-underline"
                                    onClick={() => downloadSlip(order)}
                                    style={{ cursor: 'pointer' }}
                                    title="Click to download slip"
                                  >
                                    {order.slip_number}
                                  </strong>
                                  {/*<small className="text-muted mt-1">Click to download</small>*/}
                                </div>
                              ) : (
                                <span className="text-muted">Not generated</span>
                              )}
                            </td>
                            <td className="text-center">
                              <span className={`badge p-2 ${statusConfig.class}`}>
                                {statusConfig.label}
                              </span>
                            </td>
                            <td>
                              {order.status === 'confirmed' && (
                                <button
                                  className="btn btn-success btn-sm w-100 mb-2"
                                  onClick={() => startService(order.id)}
                                  disabled={isLoading}
                                >
                                  {isLoading ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                      Starting...
                                    </>
                                  ) : (
                                    'Start Service'
                                  )}
                                </button>
                              )}
                              
                              {order.status === 'in_progress' && (
                                <button
                                  className="btn btn-primary btn-sm w-100"
                                  onClick={() => completeService(order.id)}
                                  disabled={isLoading}
                                >
                                  {isLoading ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                      Completing...
                                    </>
                                  ) : (
                                    'Complete Service'
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          <div className="text-muted">
                            <i className="fas fa-tools fa-3x mb-3"></i>
                            <p>No assigned orders found</p>
                            <p className="small">Orders will appear here after admin confirmation</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MechanicDashboard;