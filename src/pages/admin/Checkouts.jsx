import React, { useState, useEffect } from "react";
import { adminAPI } from "../../api/client";
import Swal from "sweetalert2";

export default function AdminCheckouts() {
  const [checkouts, setCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [stats, setStats] = useState({
    pending_requests: 0,
    awaiting_payment: 0,
    ready_for_approval: 0,
    total_revenue: 0
  });
  const [meta, setMeta] = useState({ 
    current_page: 1, 
    last_page: 1, 
    per_page: 10, 
    total: 0 
  });
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  // Fetch stats from database
  const fetchStats = async () => {
    try {
      const response = await adminAPI.getCheckoutStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  // Fetch pending checkouts
  const fetchPendingCheckouts = async (p = 1) => {
    try {
      setLoading(true);
      const response = await adminAPI.getPendingCheckouts({ 
        q: searchTerm,
        page: p,
        per_page: perPage
      });
      
      if (response.data.success) {
        setCheckouts(response.data.data.data || response.data.data);
        setMeta({
          current_page: response.data.data.current_page || 1,
          last_page: response.data.data.last_page || 1,
          per_page: response.data.data.per_page || perPage,
          total: response.data.data.total || (response.data.data.data || response.data.data).length
        });
        
        // Fetch updated stats after loading checkouts
        await fetchStats();
      }
    } catch (error) {
      console.error("Failed to fetch checkouts:", error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to load pending checkouts',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCheckouts(page);
  }, [searchTerm, page]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPendingCheckouts(1);
  };

  // Handle refresh
  const handleRefresh = () => {
    setSearchTerm("");
    setPage(1);
    fetchPendingCheckouts(1);
  };

  // Handle approve checkout
  const handleApproveCheckout = async (checkoutId) => {
    try {
      setActionLoading(checkoutId);
      
      const result = await Swal.fire({
        title: 'Approve Checkout?',
        text: 'Are you sure you want to approve this checkout? This will generate a ticket and release the parking slot.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Approve',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
      });

      if (!result.isConfirmed) {
        setActionLoading(null);
        return;
      }

      const response = await adminAPI.approveCheckout(checkoutId);
      
      if (response.data.success) {
        Swal.fire({
          title: 'Success!',
          text: `Checkout approved! Ticket #${response.data.data.ticket_number} generated and sent to user email.`,
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3085d6',
        });
        fetchPendingCheckouts(page); // Refresh list and stats
      }
    } catch (error) {
      console.error("Approve failed:", error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to approve checkout',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject checkout
  const handleRejectCheckout = async (checkoutId) => {
    try {
      setActionLoading(checkoutId);
      
      const result = await Swal.fire({
        title: 'Reject Checkout?',
        text: 'Are you sure you want to reject this checkout request?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Reject',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
      });

      if (!result.isConfirmed) {
        setActionLoading(null);
        return;
      }

      const response = await adminAPI.rejectCheckout(checkoutId);
      
      if (response.data.success) {
        Swal.fire({
          title: 'Success!',
          text: 'Checkout request rejected successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3085d6',
        });
        fetchPendingCheckouts(page); // Refresh list and stats
      }
    } catch (error) {
      console.error("Reject failed:", error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to reject checkout',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate total time and charges
  const calculateTimeDetails = (booking) => {
    const scheduledEnd = new Date(booking.end_time);
    const actualEnd = new Date(booking.actual_end_time);
    const extraMinutes = Math.max(0, Math.ceil((actualEnd - scheduledEnd) / (1000 * 60)));
    const roundedMinutes = Math.ceil(extraMinutes / 10) * 10;
    
    return {
      extraMinutes,
      roundedMinutes,
      extraCharges: booking.extra_charges || 0
    };
  };

  return (
    <div className="container-fluid py-4">
      <div className="card border-0 shadow-lg rounded-3 overflow-hidden">
        {/* Header Section */}
        <div className="card-header bg-gradient-primary text-white border-0 py-4 px-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <div className="d-flex flex-column flex-sm-row gap-3 w-100 w-md-auto">
              <form onSubmit={handleSearch} className="d-flex gap-2 flex-grow-1">
                <div className="position-relative flex-grow-1">
                  <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                  <input 
                    className="form-control form-control-lg border-0 rounded-pill ps-5 shadow-sm"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                </div>
                <button 
                  type="submit"
                  className="btn btn-light btn-lg rounded-pill px-4 shadow-sm fw-semibold"
                >
                  <i className="fas fa-search me-2"></i>
                  Search
                </button>
              </form>
              
              <button 
                onClick={handleRefresh}
                className="btn btn-light btn-lg rounded-pill px-4 shadow-sm fw-semibold"
              >
                <i className="fas fa-sync-alt me-2"></i>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards - Database Data */}
        <div className="card-body border-bottom">
          <div className="row g-3">
            <div className="col-xl-3 col-md-3">
              <div className="card border-0 shadow-sm bg-primary text-white h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="card-title text-white-50 mb-2">Pending Requests</h6>
                      <h3 className="fw-bold mb-0">{stats.pending_requests}</h3>
                    </div>
                    <div className="flex-shrink-0">
                      <i className="fas fa-clock fa-2x opacity-50"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-xl-3 col-md-3">
              <div className="card border-0 shadow-sm bg-warning text-dark h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="card-title text-dark-50 mb-2">Awaiting Payment</h6>
                      <h3 className="fw-bold mb-0">{stats.awaiting_payment}</h3>
                    </div>
                    <div className="flex-shrink-0">
                      <i className="fas fa-money-bill-wave fa-2x opacity-50"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-3">
              <div className="card border-0 shadow-sm bg-info text-white h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="card-title text-white-50 mb-2">Ready for Approval</h6>
                      <h3 className="fw-bold mb-0">{stats.ready_for_approval}</h3>
                    </div>
                    <div className="flex-shrink-0">
                      <i className="fas fa-check-circle fa-2x opacity-50"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-3">
              <div className="card border-0 shadow-sm bg-success text-white h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="card-title text-white-50 mb-2">Total Revenue</h6>
                      <h3 className="fw-bold mb-0">
                        BDT {stats.total_revenue.toFixed(2)}
                      </h3>
                    </div>
                    <div className="flex-shrink-0">
                      <i className="fas fa-coins fa-2x opacity-50"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5 my-5">
              <div className="spinner-grow text-primary mb-4" style={{width: '3rem', height: '3rem'}} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="text-muted mb-2">Loading Checkouts Data</h5>
              <p className="text-muted">Please wait while we fetch checkout information</p>
            </div>
          ) : checkouts.length === 0 ? (
            <div className="text-center py-5 my-5">
              <div className="bg-light rounded-3 p-5 mx-auto" style={{maxWidth: '400px'}}>
                <i className="fas fa-check-circle fa-4x text-muted mb-4"></i>
                <h4 className="text-muted mb-3">No Pending Checkouts</h4>
                <p className="text-muted mb-4">
                  {searchTerm ? 'No checkouts match your search criteria. Try different keywords.' : 'All checkout requests have been processed.'}
                </p>
                {searchTerm && (
                  <button 
                    onClick={handleRefresh}
                    className="btn btn-primary rounded-pill px-4"
                  >
                    <i className="fas fa-times me-2"></i>
                    Clear Search
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Booking ID</th>
                    <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">User Details</th>
                    <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Parking & Slot</th>
                    <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Duration</th>
                    <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Charges</th>
                    <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Status</th>
                    <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {checkouts.map((checkout) => {
                    const timeDetails = calculateTimeDetails(checkout);
                    
                    return (
                      <tr key={checkout.id} className="border-top border-light">
                        <td className="text-center py-4">
                          <span className="fw-bold text-primary fs-6">#{checkout.id}</span>
                          <br />
                          <small className="text-muted">
                            {formatDate(checkout.created_at)}
                          </small>
                        </td>
                        
                        <td className="text-center py-4">
                          <div className="d-flex flex-column align-items-center">
                            <span className="fw-semibold text-dark mb-1">{checkout.user?.name}</span>
                            <small className="text-muted">{checkout.user?.email}</small>
                          </div>
                        </td>
                        
                        <td className="text-center py-4">
                          <div className="d-flex flex-column align-items-center">
                            <span className="fw-semibold text-dark mb-1">{checkout.parking?.name}</span>
                            <span className="badge bg-secondary px-3 py-2">
                              Slot: {checkout.slot?.slot_code}
                            </span>
                            <small className="text-muted mt-1">
                              {checkout.parking?.distance}
                            </small>
                          </div>
                        </td>
                        
                        <td className="text-center py-4">
                          <div className="d-flex flex-column align-items-center">
                            <small className="fw-semibold">
                              <strong>Booked:</strong> {checkout.hours} hour(s)
                            </small>
                            <small className="text-muted">
                              <strong>Ends:</strong> {formatDate(checkout.end_time)}
                            </small>
                            <small className="text-muted">
                              <strong>Actual End:</strong> {formatDate(checkout.actual_end_time)}
                            </small>
                            {timeDetails.extraMinutes > 0 && (
                              <small className="text-warning fw-semibold">
                                <strong>Extra:</strong> {timeDetails.extraMinutes} min
                              </small>
                            )}
                          </div>
                        </td>
                        
                        <td className="text-center py-4">
                          <div className="d-flex flex-column align-items-center">
                            <span className="fw-bold text-success fs-6">
                              BDT {parseFloat(checkout.total_price).toFixed(2)}
                            </span>
                            {checkout.extra_charges > 0 && (
                              <small className="text-warning fw-semibold">
                                + BDT {parseFloat(checkout.extra_charges).toFixed(2)}
                              </small>
                            )}
                            <span className="fw-bold text-primary">
                              Total: BDT {(parseFloat(checkout.total_price) + parseFloat(checkout.extra_charges || 0)).toFixed(2)}
                            </span>
                          </div>
                        </td>
                        
                        <td className="text-center py-4">
                          <span className={`badge ${
                            checkout.status === 'checkout_requested' && checkout.extra_charges > 0 
                              ? 'bg-warning' 
                              : checkout.status === 'checkout_requested' 
                                ? 'bg-info'
                                : checkout.status === 'checkout_paid'
                                  ? 'bg-success'
                                  : 'bg-secondary'
                          } px-3 py-2`}>
                            <i className={`fas ${
                              checkout.status === 'checkout_requested' && checkout.extra_charges > 0 
                                ? 'fa-money-bill-wave' 
                                : checkout.status === 'checkout_requested'
                                  ? 'fa-clock'
                                  : checkout.status === 'checkout_paid'
                                    ? 'fa-check-circle'
                                    : 'fa-info-circle'
                            } me-2`}></i>
                            {checkout.status === 'checkout_requested' && checkout.extra_charges > 0 
                              ? 'Payment Required' 
                              : checkout.status === 'checkout_requested'
                                ? 'Pending Review'
                                : checkout.status === 'checkout_paid'
                                  ? 'Ready to Approve'
                                  : checkout.status
                            }
                          </span>
                        </td>
                        
                        <td className="text-center py-4">
                          <div className="d-flex justify-content-center gap-2">
                            {/* Approve Button */}
                            <button
                              className="btn btn-success btn-sm rounded-pill px-3"
                              onClick={() => handleApproveCheckout(checkout.id)}
                              disabled={actionLoading === checkout.id}
                              title="Approve checkout and generate ticket"
                            >
                              {actionLoading === checkout.id ? (
                                <span className="spinner-border spinner-border-sm me-1" />
                              ) : (
                                <i className="fas fa-check me-1"></i>
                              )}
                              Approve
                            </button>
                            
                            {/* Reject Button */}
                            {(checkout.status === 'checkout_requested' || checkout.status === 'checkout_paid') && (
                              <button
                                className="btn btn-danger btn-sm rounded-pill px-3"
                                onClick={() => handleRejectCheckout(checkout.id)}
                                disabled={actionLoading === checkout.id}
                                title="Reject checkout request"
                              >
                                {actionLoading === checkout.id ? (
                                  <span className="spinner-border spinner-border-sm me-1" />
                                ) : (
                                  <i className="fas fa-times me-1"></i>
                                )}
                                Reject
                              </button>
                            )}
                          </div>
                          
                          {/* Status specific messages */}
                          {checkout.status === 'checkout_requested' && checkout.extra_charges > 0 && (
                            <small className="text-warning d-block mt-1">
                              User needs to pay extra charges first
                            </small>
                          )}
                          
                          {checkout.status === 'checkout_paid' && (
                            <small className="text-success d-block mt-1">
                              All payments completed
                            </small>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta.last_page > 1 && !loading && (
          <div className="card-footer bg-white border-0 py-4 px-4">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-center gap-4">
              <div className="text-muted fw-semibold">
                Displaying <span className="text-primary fw-bold">{((meta.current_page - 1) * meta.per_page) + 1}</span> to{" "}
                <span className="text-primary fw-bold">{Math.min(meta.current_page * meta.per_page, meta.total)}</span> of{" "}
                <span className="text-primary fw-bold">{meta.total}</span> checkout requests
              </div>
              
              <div className="d-flex gap-3">
                <button 
                  className="btn btn-outline-primary btn-lg rounded-pill px-4 fw-semibold d-flex align-items-center" 
                  disabled={meta.current_page <= 1} 
                  onClick={() => setPage(page - 1)}
                >
                  <i className="fas fa-chevron-left me-2"></i>
                  Previous Page
                </button>
                <button 
                  className="btn btn-outline-primary btn-lg rounded-pill px-4 fw-semibold d-flex align-items-center" 
                  disabled={meta.current_page >= meta.last_page} 
                  onClick={() => setPage(page + 1)}
                >
                  Next Page
                  <i className="fas fa-chevron-right ms-2"></i>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Info Section */}
      {checkouts.length > 0 && (
        <div className="card border-0 shadow-sm mt-4">
          <div className="card-header bg-light">
            <h6 className="mb-0">
              <i className="fas fa-info-circle me-2 text-primary"></i>
              Checkout Process Information
            </h6>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4">
                <h6>🟡 Payment Required</h6>
                <p className="text-muted small">
                  User has extra charges to pay before approval
                </p>
              </div>
              <div className="col-md-4">
                <h6>🔵 Pending Review</h6>
                <p className="text-muted small">
                  Checkout request submitted, waiting for admin review
                </p>
              </div>
              <div className="col-md-4">
                <h6>🟢 Ready to Approve</h6>
                <p className="text-muted small">
                  All payments completed, ready for final approval
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}