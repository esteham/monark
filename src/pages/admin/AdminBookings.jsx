import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [meta, setMeta] = useState({ 
    current_page: 1, 
    last_page: 1, 
    per_page: 10, 
    total: 0 
  });
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);

  const fetchBookings = async (p = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://127.0.0.1:8000/api/admin/bookings`, {
        params: { 
          page: p, 
          per_page: perPage, 
          q: q || undefined 
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (res.data.success) {
        setBookings(res.data.data.data);
        setMeta({
          current_page: res.data.data.current_page,
          last_page: res.data.data.last_page,
          per_page: res.data.data.per_page,
          total: res.data.data.total
        });
      } else {
        setBookings([]);
        console.error("API returned success: false");
      }
    } catch (err) {
      console.error("Error fetching bookings:", err.response?.data || err.message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(page);
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBookings(1);
  };

  const handleRefresh = () => {
    setQ("");
    setPage(1);
    fetchBookings(1);
  };

  // Status badge styling function
  const getStatusBadge = (status) => {
    const statusStyles = {
      'pending': 'badge bg-warning text-dark px-3 py-2',
      'confirmed': 'badge bg-primary px-3 py-2',
      'active': 'badge bg-info px-3 py-2',
      'completed': 'badge bg-success px-3 py-2',
      'cancelled': 'badge bg-danger px-3 py-2'
    };
    
    return `${statusStyles[status] || 'badge bg-secondary px-3 py-2'}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container-fluid py-4">
      <div className="card border-0 shadow-lg rounded-3 overflow-hidden">
        {/* Header Section */}
        <div className="card-header bg-gradient-primary text-white border-0 py-4 px-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center">
            {/*<div className="mb-3 mb-lg-0">
              <h4 className="mb-2 fw-bold">
                <i className="fas fa-calendar-alt me-3"></i>
                Booking Management System
              </h4>
              <p className="mb-0 opacity-75 fw-light">
                Comprehensive overview of all parking reservations and bookings
              </p>
            </div>*/}
            
            <div className="d-flex flex-column flex-sm-row gap-3 w-100 w-lg-auto">
              <form onSubmit={handleSearch} className="d-flex gap-2 flex-grow-1">
                <div className="position-relative flex-grow-1">
                  <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                  <input 
                    className="form-control form-control-lg border-0 rounded-pill ps-5 shadow-sm"
                    placeholder="Search..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)} 
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

        {/* Stats Dashboard */}
        {/*<div className="card-body border-bottom bg-light-white py-4 px-4">
          <div className="row g-4">
            <div className="col-md-3">
              <div className="d-flex align-items-center">
                <div className="bg-primary rounded-3 p-3 me-3">
                  <i className="fas fa-calendar-check text-white fa-lg"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1 fw-semibold">Total Bookings</h6>
                  <h4 className="mb-0 fw-bold text-primary">{meta.total}</h4>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex align-items-center">
                <div className="bg-success rounded-3 p-3 me-3">
                  <i className="fas fa-layer-group text-white fa-lg"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1 fw-semibold">Current Page</h6>
                  <h4 className="mb-0 fw-bold text-success">{meta.current_page}/{meta.last_page}</h4>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex align-items-center">
                <div className="bg-info rounded-3 p-3 me-3">
                  <i className="fas fa-eye text-white fa-lg"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1 fw-semibold">Showing</h6>
                  <h4 className="mb-0 fw-bold text-info">
                    {((meta.current_page - 1) * meta.per_page) + 1}-{Math.min(meta.current_page * meta.per_page, meta.total)}
                  </h4>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex align-items-center">
                <div className="bg-warning rounded-3 p-3 me-3">
                  <i className="fas fa-clock text-white fa-lg"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1 fw-semibold">Last Updated</h6>
                  <h4 className="mb-0 fw-bold text-warning">Now</h4>
                </div>
              </div>
            </div>
          </div>
        </div>*/}

        {/* Table Section */}
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5 my-5">
              <div className="spinner-grow text-primary mb-4" style={{width: '3rem', height: '3rem'}} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="text-muted mb-2">Loading Bookings Data</h5>
              <p className="text-muted">Please wait while we fetch the latest booking information</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-5 my-5">
              <div className="bg-light rounded-3 p-5 mx-auto" style={{maxWidth: '400px'}}>
                <i className="fas fa-inbox fa-4x text-muted mb-4"></i>
                <h4 className="text-muted mb-3">No Bookings Found</h4>
                <p className="text-muted mb-4">
                  {q ? 'No bookings match your search criteria. Try different keywords.' : 'There are no bookings in the system at the moment.'}
                </p>
                {q && (
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
                    <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Parking Location</th>
                    <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Slot Code</th>
                    <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Duration</th>
                    <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Amount</th>
                    <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Status</th>
                    <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Booking Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(booking => (
                    <tr key={booking.id} className="border-top border-light">
                      <td className="text-center py-4">
                        <span className="fw-bold text-primary fs-6">#{booking.id}</span>
                      </td>
                      <td className="text-center py-4">
                        <div className="d-flex flex-column align-items-center">
                          <span className="fw-semibold text-dark mb-1">{booking.user?.name || 'N/A'}</span>
                          <small className="text-muted">{booking.user?.email || 'N/A'}</small>
                        </div>
                      </td>
                      <td className="text-center py-4">
                        <span className="fw-medium text-dark">{booking.parking?.name || 'N/A'}</span>
                      </td>
                      <td className="text-center py-4">
                        <span className="badge bg-light text-dark border px-3 py-2 rounded-pill fw-semibold">
                          <i className="fas fa-parking me-2"></i>
                          {booking.slot?.slot_code || 'N/A'}
                        </span>
                      </td>
                      <td className="text-center py-4">
                        <span className="text-dark fw-semibold">
                          <i className="fas fa-clock me-2 text-info"></i>
                          {booking.hours} hour{booking.hours > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="text-center py-4">
                        <span className="fw-bold text-success fs-6">
                          {formatCurrency(booking.total_price)}
                        </span>
                      </td>
                      <td className="text-center py-4">
                        <span className={getStatusBadge(booking.status)}>
                          <i className={`fas ${
                            booking.status === 'completed' ? 'fa-check-circle' :
                            booking.status === 'confirmed' ? 'fa-calendar-check' :
                            booking.status === 'active' ? 'fa-play-circle' :
                            booking.status === 'pending' ? 'fa-clock' :
                            'fa-times-circle'
                          } me-2`}></i>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                      <td className="text-center py-4">
                        <div className="d-flex flex-column align-items-center">
                          <small className="text-muted fw-semibold">{formatDate(booking.created_at)}</small>
                        </div>
                      </td>
                    </tr>
                  ))}
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
                <span className="text-primary fw-bold">{meta.total}</span> booking records
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
    </div>
  );
}