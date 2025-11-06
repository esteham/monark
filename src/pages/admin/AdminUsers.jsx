import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ 
    current_page: 1, 
    last_page: 1, 
    per_page: 10, 
    total: 0 
  });
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = async (p = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`https://monark.xetroot.com/api/admin/users`, {
        params: { 
          page: p, 
          per_page: perPage, 
          q: q || undefined,
          role: 'user'
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (res.data.success) {
        setUsers(res.data.data.data);
        setMeta({
          current_page: res.data.data.current_page,
          last_page: res.data.data.last_page,
          per_page: res.data.data.per_page,
          total: res.data.data.total
        });
      } else {
        setUsers([]);
        console.error("API returned success: false");
      }
    } catch (err) {
      console.error("Error fetching users:", err.response?.data || err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1);
  };

  const handleRefresh = () => {
    setQ("");
    setPage(1);
    fetchUsers(1);
  };

  const handleBlockUser = async (userId) => {
    if (!window.confirm('Are you sure you want to block this user?')) {
      return;
    }

    setActionLoading(userId);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`https://monark.xetroot.com/api/admin/users/${userId}/block`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (res.data.success) {
        // Update local state
        setUsers(users.map(user => 
          user.id === userId ? { ...user, is_blocked: true } : user
        ));
        alert('User blocked successfully!');
      }
    } catch (err) {
      console.error("Error blocking user:", err.response?.data || err.message);
      alert('Failed to block user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblockUser = async (userId) => {
    if (!window.confirm('Are you sure you want to unblock this user?')) {
      return;
    }

    setActionLoading(userId);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`https://monark.xetroot.com/api/admin/users/${userId}/unblock`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (res.data.success) {
        // Update local state
        setUsers(users.map(user => 
          user.id === userId ? { ...user, is_blocked: false } : user
        ));
        alert('User unblocked successfully!');
      }
    } catch (err) {
      console.error("Error unblocking user:", err.response?.data || err.message);
      alert('Failed to unblock user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone!`)) {
      return;
    }

    setActionLoading(userId);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`https://monark.xetroot.com/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (res.data.success) {
        // Remove user from local state
        setUsers(users.filter(user => user.id !== userId));
        alert('User deleted successfully!');
      }
    } catch (err) {
      console.error("Error deleting user:", err.response?.data || err.message);
      alert('Failed to delete user');
    } finally {
      setActionLoading(null);
    }
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
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            {/*<div className="mb-3 mb-md-0">
              <h4 className="mb-2 fw-bold">
                <i className="fas fa-users me-3"></i>
                Regular Users Management
              </h4>
              <p className="mb-0 opacity-75 fw-light">
                Overview of all regular users in the system
              </p>
            </div>*/}
            
            <div className="d-flex flex-column flex-sm-row gap-3 w-100 w-md-auto">
              <form onSubmit={handleSearch} className="d-flex gap-2 flex-grow-1">
                <div className="position-relative flex-grow-1">
                  <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                  <input 
                    className="form-control form-control-lg border-0 rounded-pill ps-5 shadow-sm"
                    placeholder="Search users..."
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

        {/* Table Section */}
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5 my-5">
              <div className="spinner-grow text-primary mb-4" style={{width: '3rem', height: '3rem'}} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="text-muted mb-2">Loading Users Data</h5>
              <p className="text-muted">Please wait while we fetch user information</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-5 my-5">
              <div className="bg-light rounded-3 p-5 mx-auto" style={{maxWidth: '400px'}}>
                <i className="fas fa-user-slash fa-4x text-muted mb-4"></i>
                <h4 className="text-muted mb-3">No Regular Users Found</h4>
                <p className="text-muted mb-4">
                  {q ? 'No users match your search criteria. Try different keywords.' : 'There are no regular users in the system at the moment.'}
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
                    <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">User ID</th>
                    <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">User Details</th>
                    <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Wallet Balance</th>
                    <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Status</th>
                    <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Registration Date</th>
                    <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Total Bookings</th>
                    <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-top border-light">
                      <td className="text-center py-4">
                        <span className="fw-bold text-primary fs-6">#{user.id}</span>
                      </td>
                      <td className="text-center py-4">
                        <div className="d-flex flex-column align-items-center">
                          <span className="fw-semibold text-dark mb-1">{user.name}</span>
                          <small className="text-muted">{user.email}</small>
                        </div>
                      </td>
                      <td className="text-center py-4">
                        <span className="fw-bold text-success fs-6">
                          {formatCurrency(user.wallet_balance)}
                        </span>
                      </td>
                      <td className="text-center py-4">
                        <span className={`badge ${user.is_blocked ? 'bg-danger' : 'bg-success'} px-3 py-2`}>
                          <i className={`fas ${user.is_blocked ? 'fa-ban' : 'fa-check-circle'} me-2`}></i>
                          {user.is_blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="text-center py-4">
                        <div className="d-flex flex-column align-items-center">
                          <small className="text-muted fw-semibold">{formatDate(user.created_at)}</small>
                        </div>
                      </td>
                      <td className="text-center py-4">
                        <span className="badge bg-info px-3 py-2">
                          <i className="fas fa-calendar-check me-2"></i>
                          {user.bookings_count || 0}
                        </span>
                      </td>
                      <td className="text-center py-4">
                        <div className="d-flex justify-content-center gap-2">
                          {/* Block/Unblock Button */}
                          {user.is_blocked ? (
                            <button
                              className="btn btn-success btn-sm rounded-pill px-3"
                              onClick={() => handleUnblockUser(user.id)}
                              disabled={actionLoading === user.id}
                            >
                              {actionLoading === user.id ? (
                                <span className="spinner-border spinner-border-sm me-1" />
                              ) : (
                                <i className="fas fa-unlock me-1"></i>
                              )}
                              Unblock
                            </button>
                          ) : (
                            <button
                              className="btn btn-warning btn-sm rounded-pill px-3"
                              onClick={() => handleBlockUser(user.id)}
                              disabled={actionLoading === user.id}
                            >
                              {actionLoading === user.id ? (
                                <span className="spinner-border spinner-border-sm me-1" />
                              ) : (
                                <i className="fas fa-ban me-1"></i>
                              )}
                              Block
                            </button>
                          )}
                          
                          {/* Delete Button */}
                          <button
                            className="btn btn-danger btn-sm rounded-pill px-3"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={actionLoading === user.id}
                          >
                            {actionLoading === user.id ? (
                              <span className="spinner-border spinner-border-sm me-1" />
                            ) : (
                              <i className="fas fa-trash me-1"></i>
                            )}
                            Delete
                          </button>
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
                <span className="text-primary fw-bold">{meta.total}</span> regular users
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