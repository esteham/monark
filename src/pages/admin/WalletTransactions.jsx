import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Swal from 'sweetalert2';

export default function WalletTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('verified');
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({});

    useEffect(() => {
        fetchTransactions();
    }, [filter]);

    const fetchTransactions = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                status: filter,
                page: page,
                per_page: 10,
                ...(searchTerm && { q: searchTerm })
            });

            const response = await api.get(`/admin/wallet-transactions?${params}`);
            
            console.log('API Response:', response.data); // Debugging
            
            if (response.data.success) {
                setTransactions(response.data.data.data || []);
                setPagination({
                    current_page: response.data.data.current_page || 1,
                    last_page: response.data.data.last_page || 1,
                    total: response.data.data.total || 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
            Swal.fire({
                icon: 'error',
                title: 'Failed to load transactions',
                text: error.response?.data?.message || 'Network error occurred',
                timer: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (transactionId) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You want to approve this transaction and add money to user wallet?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, approve it!',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });

        if (!result.isConfirmed) return;

        try {
            const response = await api.post(`/admin/wallet-transactions/${transactionId}/approve`);
            if (response.data.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Approved!',
                    text: 'Transaction approved successfully! Money added to user wallet.',
                    timer: 3000,
                    showConfirmButton: false
                });
                fetchTransactions(pagination.current_page);
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'Failed to approve',
                text: error.response?.data?.message || 'Network error occurred',
                timer: 4000
            });
        }
    };

    const handleReject = async (transactionId) => {
        const { value: reason } = await Swal.fire({
            title: 'Enter rejection reason',
            input: 'textarea',
            inputLabel: 'Reason for rejection',
            inputPlaceholder: 'Please enter the reason for rejecting this transaction...',
            inputAttributes: {
                'aria-label': 'Enter rejection reason'
            },
            showCancelButton: true,
            confirmButtonText: 'Reject Transaction',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to enter a reason!';
                }
                if (value.length < 10) {
                    return 'Reason must be at least 10 characters long';
                }
            }
        });

        if (!reason) return; // User cancelled

        try {
            const response = await api.post(`/admin/wallet-transactions/${transactionId}/reject`, {
                reason: reason
            });
            
            if (response.data.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Rejected!',
                    text: 'Transaction rejected successfully!',
                    timer: 3000,
                    showConfirmButton: false
                });
                fetchTransactions(pagination.current_page);
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'Failed to reject',
                text: error.response?.data?.message || 'Network error occurred',
                timer: 4000
            });
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchTransactions(1);
    };

    // **FIX: Safe statistics calculation**
    const stats = {
        pending: Array.isArray(transactions) ? transactions.filter(t => t.status === 'pending').length : 0,
        verified: Array.isArray(transactions) ? transactions.filter(t => t.status === 'verified').length : 0,
        completed: Array.isArray(transactions) ? transactions.filter(t => t.status === 'completed').length : 0,
        failed: Array.isArray(transactions) ? transactions.filter(t => t.status === 'failed').length : 0,
        totalAmount: Array.isArray(transactions) ? transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) : 0
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { class: 'bg-warning', text: 'Pending Verification', icon: 'fa-clock' },
            verified: { class: 'bg-info', text: 'Waiting Approval', icon: 'fa-check-circle' },
            completed: { class: 'bg-success', text: 'Approved', icon: 'fa-check-double' },
            failed: { class: 'bg-danger', text: 'Rejected', icon: 'fa-times-circle' }
        };
        
        const config = statusConfig[status] || { class: 'bg-secondary', text: status, icon: 'fa-question' };
        return (
            <span className={`badge ${config.class}`}>
                <i className={`fas ${config.icon} me-1`}></i>
                {config.text}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-BD', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAmount = (amount) => {
        return `৳${parseFloat(amount || 0).toFixed(2)}`;
    };

    const getPaymentMethodIcon = (method) => {
        const icons = {
            bkash: 'fa-mobile-alt',
            nagad: 'fa-wallet',
            rocket: 'fa-rocket',
            card: 'fa-credit-card',
            wallet: 'fa-wallet'
        };
        return icons[method] || 'fa-money-bill';
    };

    return (
        <div className="container-fluid">
            {/* Header */}

            {/* Statistics Cards */}
            <div className="row mb-4 mt-5">
                <div className="col-xl-2 col-md-4 mb-3">
                    <div className="card border-left-primary shadow h-100 py-2">
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                        Pending
                                    </div>
                                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                                        {stats.pending}
                                    </div>
                                </div>
                                <div className="col-auto">
                                    <i className="fas fa-clock fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-2 col-md-4 mb-3">
                    <div className="card border-left-info shadow h-100 py-2">
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                                        Waiting Approval
                                    </div>
                                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                                        {stats.verified}
                                    </div>
                                </div>
                                <div className="col-auto">
                                    <i className="fas fa-check-circle fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-2 col-md-4 mb-3">
                    <div className="card border-left-success shadow h-100 py-2">
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                                        Approved
                                    </div>
                                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                                        {stats.completed}
                                    </div>
                                </div>
                                <div className="col-auto">
                                    <i className="fas fa-check-double fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-2 col-md-4 mb-3">
                    <div className="card border-left-danger shadow h-100 py-2">
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className="text-xs font-weight-bold text-danger text-uppercase mb-1">
                                        Rejected
                                    </div>
                                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                                        {stats.failed}
                                    </div>
                                </div>
                                <div className="col-auto">
                                    <i className="fas fa-times-circle fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-4 col-md-8 mb-3">
                    <div className="card border-left-warning shadow h-100 py-2">
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col mr-2">
                                    <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                        Total Amount
                                    </div>
                                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                                        ৳{stats.totalAmount.toFixed(2)}
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

            {/* Filters and Search */}
            <div className="card shadow mb-4">
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6">
                            <div className="btn-group">
                                <button 
                                    className={`btn btn-${filter === 'verified' ? 'info' : 'outline-info'}`}
                                    onClick={() => setFilter('verified')}
                                >
                                    <i className="fas fa-check-circle me-2"></i>
                                    Waiting Approval
                                </button>
                                <button 
                                    className={`btn btn-${filter === 'pending' ? 'warning' : 'outline-warning'}`}
                                    onClick={() => setFilter('pending')}
                                >
                                    <i className="fas fa-clock me-2"></i>
                                    Pending
                                </button>
                                <button 
                                    className={`btn btn-${filter === 'completed' ? 'success' : 'outline-success'}`}
                                    onClick={() => setFilter('completed')}
                                >
                                    <i className="fas fa-check-double me-2"></i>
                                    Approved
                                </button>
                                <button 
                                    className={`btn btn-${filter === 'failed' ? 'danger' : 'outline-danger'}`}
                                    onClick={() => setFilter('failed')}
                                >
                                    <i className="fas fa-times me-2"></i>
                                    Rejected
                                </button>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <form onSubmit={handleSearch} className="d-flex">
                                <input
                                    type="text"
                                    className="form-control me-2"
                                    placeholder="Search by Transaction ID, User, Mobile..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <button type="submit" className="btn btn-primary">
                                    <i className="fas fa-search"></i>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="card shadow">
                <div className="card-header py-3 d-flex justify-content-between align-items-center">
                    <h6 className="m-0 font-weight-bold text-primary">
                        <i className="fas fa-list me-2"></i>
                        Transactions ({filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)})
                        {pagination.total && <span className="badge bg-secondary ms-2">{pagination.total}</span>}
                    </h6>
                    <button 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => fetchTransactions()}
                        disabled={loading}
                    >
                        <i className="fas fa-sync-alt me-1"></i>
                        Refresh
                    </button>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-5 my-5">
                            <div className="spinner-grow text-primary mb-4" style={{width: '3rem', height: '3rem'}} role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : !Array.isArray(transactions) || transactions.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                            <h5 className="text-muted">No transactions found</h5>
                            <p className="text-muted">
                                {filter === 'verified' 
                                    ? 'No transactions waiting for approval' 
                                    : 'No transactions match your filter'
                                }
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-bordered table-hover table-striped">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>#</th>
                                            <th>Transaction ID</th>
                                            <th>User Details</th>
                                            <th>Amount</th>
                                            <th>Payment Method</th>
                                            <th>Mobile</th>
                                            <th>Status</th>
                                            <th>Request Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((transaction, index) => (
                                            <tr key={transaction.id}>
                                                <td className="fw-bold">{index + 1}</td>
                                                <td>
                                                    <div>
                                                        <code className="text-primary fs-6">
                                                            {transaction.generated_transaction_id}
                                                        </code>
                                                        {transaction.transaction_id && (
                                                            <div>
                                                                <small className="text-muted">
                                                                    Ref: {transaction.transaction_id}
                                                                </small>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <strong>{transaction.user?.name || 'N/A'}</strong>
                                                        <br />
                                                        <small className="text-muted">{transaction.user?.email || 'N/A'}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <strong className="text-success fs-5">
                                                        {formatAmount(transaction.amount)}
                                                    </strong>
                                                </td>
                                                <td>
                                                    <span className={`badge bg-${
                                                        transaction.payment_method === 'bkash' ? 'success' :
                                                        transaction.payment_method === 'nagad' ? 'primary' :
                                                        transaction.payment_method === 'rocket' ? 'info' : 'secondary'
                                                    } text-uppercase`}>
                                                        <i className={`fas ${getPaymentMethodIcon(transaction.payment_method)} me-1`}></i>
                                                        {transaction.payment_method}
                                                    </span>
                                                </td>
                                                <td>
                                                    <code className="fs-6">{transaction.mobile_number || 'N/A'}</code>
                                                </td>
                                                <td>
                                                    {getStatusBadge(transaction.status)}
                                                </td>
                                                <td>
                                                    <small>{formatDate(transaction.created_at)}</small>
                                                </td>
                                                <td>
                                                    {transaction.status === 'verified' && (
                                                        <div className="btn-group-vertical btn-group-sm">
                                                            <button 
                                                                className="btn btn-success"
                                                                onClick={() => handleApprove(transaction.id)}
                                                                title="Approve Transaction"
                                                            >
                                                                <i className="fas fa-check me-1"></i>
                                                                Approve
                                                            </button>
                                                            <button 
                                                                className="btn btn-danger mt-1"
                                                                onClick={() => handleReject(transaction.id)}
                                                                title="Reject Transaction"
                                                            >
                                                                <i className="fas fa-times me-1"></i>
                                                                Reject
                                                            </button>
                                                        </div>
                                                    )}
                                                    {transaction.status === 'completed' && (
                                                        <span className="text-success">
                                                            <i className="fas fa-check-double me-1"></i>
                                                            Approved
                                                            {transaction.approved_at && (
                                                                <div>
                                                                    <small className="text-muted">
                                                                        {formatDate(transaction.approved_at)}
                                                                    </small>
                                                                </div>
                                                            )}
                                                        </span>
                                                    )}
                                                    {transaction.status === 'failed' && (
                                                        <span className="text-danger">
                                                            <i className="fas fa-times-circle me-1"></i>
                                                            Rejected
                                                        </span>
                                                    )}
                                                    {transaction.status === 'pending' && (
                                                        <span className="text-warning">
                                                            <i className="fas fa-clock me-1"></i>
                                                            Waiting Verification
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.last_page > 1 && (
                                <div className="d-flex justify-content-between align-items-center mt-3">
                                    <div>
                                        <small className="text-muted">
                                            Showing {transactions.length} of {pagination.total} transactions
                                        </small>
                                    </div>
                                    <nav>
                                        <ul className="pagination pagination-sm">
                                            <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                                <button 
                                                    className="page-link"
                                                    onClick={() => fetchTransactions(pagination.current_page - 1)}
                                                    disabled={pagination.current_page === 1}
                                                >
                                                    Previous
                                                </button>
                                            </li>
                                            <li className="page-item active">
                                                <span className="page-link">{pagination.current_page}</span>
                                            </li>
                                            <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                                <button 
                                                    className="page-link"
                                                    onClick={() => fetchTransactions(pagination.current_page + 1)}
                                                    disabled={pagination.current_page === pagination.last_page}
                                                >
                                                    Next
                                                </button>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}