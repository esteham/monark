import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminWallet() {
  const [transactions, setTransactions] = useState([]);
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
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Add scoped CSS to prevent conflicts
  const scopedStyles = `
    .admin-wallet-container .nav-pills .nav-link.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      border-color: rgba(255, 255, 255, 0.3) !important;
    }
    
    .admin-wallet-container .sidebar-gradient {
      background: inherit !important;
    }
    
    .admin-wallet-container .sidebar-scrollable {
      overflow: visible !important;
    }
    
    .admin-wallet-container .wallet-dropdown {
      display: none !important;
    }
    
    /* Ensure our component styles don't affect sidebar */
    .admin-wallet-container {
      isolation: isolate;
    }
    
    .admin-wallet-container * {
      box-sizing: border-box;
    }
  `;

  const fetchTransactions = async (p = 1, type = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      let apiUrl = `https://monark.xetroot.com/api/admin/wallet-transactions`;
      
      const params = { 
        page: p, 
        per_page: perPage, 
        q: q || undefined,
        type: type || filterType || undefined,
        status: filterStatus || undefined
      };

      const res = await axios.get(apiUrl, {
        params: params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (res.data.success) {
        setTransactions(res.data.data.data);
        setMeta({
          current_page: res.data.data.current_page,
          last_page: res.data.data.last_page,
          per_page: res.data.data.per_page,
          total: res.data.data.total
        });
      } else {
        setTransactions([]);
        console.error("API returned success: false");
      }
    } catch (err) {
      console.error("Error fetching transactions:", err.response?.data || err.message);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let type = "";
    if (activeTab !== "all") {
      type = activeTab;
    }
    fetchTransactions(page, type);
  }, [page, activeTab, filterType, filterStatus]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    let type = "";
    if (activeTab !== "all") {
      type = activeTab;
    }
    fetchTransactions(1, type);
  };

  const handleRefresh = () => {
    setQ("");
    setFilterType("");
    setFilterStatus("");
    setPage(1);
    let type = "";
    if (activeTab !== "all") {
      type = activeTab;
    }
    fetchTransactions(1, type);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setFilterType("");
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      let type = "";
      if (activeTab !== "all") {
        type = activeTab;
      }

      const res = await axios.get(`https://monark.xetroot.com/api/admin/wallet-transactions/export`, {
        params: {
          q: q || undefined,
          type: type || filterType || undefined,
          status: filterStatus || undefined
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `wallet-transactions-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      alert('Export started successfully!');
    } catch (err) {
      console.error("Error exporting transactions:", err.response?.data || err.message);
      alert('Failed to export transactions');
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

  const calculateTotals = () => {
    const totals = {
      topup: 0,
      payment: 0,
      refund: 0,
      all: 0
    };

    transactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount);
      if (transaction.type === 'topup') {
        totals.topup += amount;
      } else if (transaction.type === 'payment') {
        totals.payment += amount;
      } else if (transaction.type === 'refund') {
        totals.refund += amount;
      }
      totals.all += amount;
    });

    return totals;
  };

  const totals = calculateTotals();

  const getTypeBadge = (type) => {
    const typeStyles = {
      'topup': 'badge bg-success px-3 py-2',
      'payment': 'badge bg-primary px-3 py-2',
      'refund': 'badge bg-warning text-dark px-3 py-2'
    };
    
    return `${typeStyles[type] || 'badge bg-secondary px-3 py-2'}`;
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      'completed': 'badge bg-success px-3 py-2',
      'pending': 'badge bg-warning text-dark px-3 py-2',
      'failed': 'badge bg-danger px-3 py-2'
    };
    
    return `${statusStyles[status] || 'badge bg-secondary px-3 py-2'}`;
  };

  const getPaymentMethodBadge = (method) => {
    const methodStyles = {
      'bkash': 'badge bg-info px-3 py-2',
      'nagad': 'badge bg-primary px-3 py-2',
      'card': 'badge bg-warning text-dark px-3 py-2',
      'wallet': 'badge bg-secondary px-3 py-2'
    };
    
    return `${methodStyles[method] || 'badge bg-light text-dark px-3 py-2'}`;
  };

  return (
    <>
      {/* Scoped CSS to prevent conflicts */}
      <style>{scopedStyles}</style>
      
      <div className="container-fluid py-4 admin-wallet-container">
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
                      placeholder="Search transactions..."
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

                <button 
                  onClick={handleExport}
                  className="btn btn-light btn-lg rounded-pill px-4 shadow-sm fw-semibold"
                >
                  <i className="fas fa-download me-2"></i>
                  Export Report
                </button>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="card-body border-bottom bg-light-white py-3 px-4">
            <ul className="nav nav-pills nav-fill" role="tablist">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => handleTabChange('all')}
                >
                  <i className="fas fa-list me-2"></i>
                  All Transactions
                  <span className="badge bg-secondary ms-2">{meta.total}</span>
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'topup' ? 'active' : ''}`}
                  onClick={() => handleTabChange('topup')}
                >
                  <i className="fas fa-arrow-down me-2"></i>
                  Top Ups
                  <span className="badge bg-success ms-2">
                    {formatCurrency(totals.topup)}
                  </span>
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'payment' ? 'active' : ''}`}
                  onClick={() => handleTabChange('payment')}
                >
                  <i className="fas fa-arrow-up me-2"></i>
                  Payments
                  <span className="badge bg-primary ms-2">
                    {formatCurrency(totals.payment)}
                  </span>
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'refund' ? 'active' : ''}`}
                  onClick={() => handleTabChange('refund')}
                >
                  <i className="fas fa-exchange-alt me-2"></i>
                  Refunds
                  <span className="badge bg-warning ms-2">
                    {formatCurrency(totals.refund)}
                  </span>
                </button>
              </li>
            </ul>
          </div>

          {/* Filters Section */}
          <div className="card-body border-bottom bg-light-white py-4 px-4">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Transaction Status</label>
                <select 
                  className="form-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Payment Method</label>
                <select 
                  className="form-select"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">All Methods</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="card">Card</option>
                  <option value="wallet">Wallet</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">&nbsp;</label>
                <button 
                  className="btn btn-outline-secondary w-100"
                  onClick={() => {
                    setFilterType("");
                    setFilterStatus("");
                    setPage(1);
                    let type = "";
                    if (activeTab !== "all") {
                      type = activeTab;
                    }
                    fetchTransactions(1, type);
                  }}
                >
                  <i className="fas fa-times me-2"></i>
                  Clear Filters
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
                <h5 className="text-muted mb-2">Loading Transactions Data</h5>
                <p className="text-muted">Please wait while we fetch the latest transaction information</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-5 my-5">
                <div className="bg-light rounded-3 p-5 mx-auto" style={{maxWidth: '400px'}}>
                  <i className="fas fa-wallet fa-4x text-muted mb-4"></i>
                  <h4 className="text-muted mb-3">No Transactions Found</h4>
                  <p className="text-muted mb-4">
                    {q || filterType || filterStatus 
                      ? 'No transactions match your search criteria. Try different filters.' 
                      : `There are no ${activeTab !== 'all' ? activeTab + ' ' : ''}transactions in the system at the moment.`
                    }
                  </p>
                  {(q || filterType || filterStatus) && (
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
                      <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Transaction ID</th>
                      <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">User Details</th>
                      <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Type</th>
                      <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Amount (BDT)</th>
                      <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Payment Method</th>
                      <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Status</th>
                      <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Description</th>
                      <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Transaction Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(transaction => (
                      <tr key={transaction.id} className="border-top border-light">
                        <td className="text-center py-4">
                          <span className="fw-bold text-primary fs-6">#{transaction.id}</span>
                        </td>
                        <td className="text-center py-4">
                          <div className="d-flex flex-column align-items-center">
                            <span className="fw-semibold text-dark mb-1">{transaction.user?.name || 'N/A'}</span>
                            <small className="text-muted">{transaction.user?.email || 'N/A'}</small>
                          </div>
                        </td>
                        <td className="text-center py-4">
                          <span className={getTypeBadge(transaction.type)}>
                            <i className={`fas ${
                              transaction.type === 'topup' ? 'fa-arrow-down' :
                              transaction.type === 'payment' ? 'fa-arrow-up' :
                              'fa-exchange-alt'
                            } me-2`}></i>
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </span>
                        </td>
                        <td className="text-center py-4">
                          <span className={`fw-bold fs-6 ${
                            transaction.type === 'topup' || transaction.type === 'refund' ? 'text-success' : 'text-danger'
                          }`}>
                            {transaction.type === 'topup' || transaction.type === 'refund' ? '+ ' : '- '}
                            {transaction.amount}
                          </span>
                        </td>
                        <td className="text-center py-4">
                          {transaction.payment_method ? (
                            <span className={getPaymentMethodBadge(transaction.payment_method)}>
                              <i className={`fas ${
                                transaction.payment_method === 'bkash' ? 'fa-mobile-alt' :
                                transaction.payment_method === 'nagad' ? 'fa-mobile-alt' :
                                transaction.payment_method === 'card' ? 'fa-credit-card' :
                                'fa-wallet'
                              } me-2`}></i>
                              {transaction.payment_method.charAt(0).toUpperCase() + transaction.payment_method.slice(1)}
                            </span>
                          ) : (
                            <span className="badge bg-light text-dark px-3 py-2">N/A</span>
                          )}
                        </td>
                        <td className="text-center py-4">
                          <span className={getStatusBadge(transaction.status)}>
                            <i className={`fas ${
                              transaction.status === 'completed' ? 'fa-check-circle' :
                              transaction.status === 'pending' ? 'fa-clock' :
                              'fa-times-circle'
                            } me-2`}></i>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </td>
                        <td className="text-center py-4">
                          <small className="text-muted">{transaction.description || 'N/A'}</small>
                        </td>
                        <td className="text-center py-4">
                          <div className="d-flex flex-column align-items-center">
                            <small className="text-muted fw-semibold">{formatDate(transaction.created_at)}</small>
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
                  <span className="text-primary fw-bold">{meta.total}</span> transaction records
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
    </>
  );
}