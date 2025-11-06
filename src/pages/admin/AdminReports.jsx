import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminReports() {
  const [parkingBookings, setParkingBookings] = useState([]);
  const [serviceBookings, setServiceBookings] = useState([]);
  const [filteredParkingBookings, setFilteredParkingBookings] = useState([]);
  const [filteredServiceBookings, setFilteredServiceBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRange, setTimeRange] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("parking"); // "parking" or "services"
  const [dateRange, setDateRange] = useState({
    start: "",
    end: ""
  });

  // Summary statistics
  const [summary, setSummary] = useState({
    totalParkingBookings: 0,
    totalServiceBookings: 0,
    totalParkingRevenue: 0,
    totalServiceRevenue: 0,
    totalCombinedRevenue: 0,
    completedParkingBookings: 0,
    completedServiceBookings: 0,
    pendingParkingBookings: 0,
    pendingServiceBookings: 0
  });

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch parking bookings
      const parkingResponse = await axios.get(`https://monark.xetroot.com/api/admin/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          per_page: 1000 // Get all bookings for reporting
        }
      });

      // Fetch service bookings
      const serviceResponse = await axios.get(`https://monark.xetroot.com/api/admin/service-orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          per_page: 1000
        }
      });

      if (parkingResponse.data.success) {
        const parkingData = parkingResponse.data.data.data || [];
        setParkingBookings(parkingData);
        setFilteredParkingBookings(parkingData);
      }

      if (serviceResponse.data.success) {
        const serviceData = serviceResponse.data.data.data || [];
        setServiceBookings(serviceData);
        setFilteredServiceBookings(serviceData);
      }

      // Calculate summary after both requests
      calculateSummary(
        parkingResponse.data.success ? (parkingResponse.data.data.data || []) : [],
        serviceResponse.data.success ? (serviceResponse.data.data.data || []) : []
      );

    } catch (error) {
      console.error('Error fetching bookings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (parkingData, serviceData) => {
    const totalParkingBookings = parkingData.length;
    const totalServiceBookings = serviceData.length;
    
    const totalParkingRevenue = parkingData
      .filter(booking => booking.status === 'completed')
      .reduce((sum, booking) => sum + parseFloat(booking.total_price || 0), 0);
    
    const totalServiceRevenue = serviceData
      .filter(booking => booking.status === 'completed')
      .reduce((sum, booking) => sum + parseFloat(booking.service?.price || 0), 0);

    const totalCombinedRevenue = totalParkingRevenue + totalServiceRevenue;

    const completedParkingBookings = parkingData.filter(booking => booking.status === 'completed').length;
    const completedServiceBookings = serviceData.filter(booking => booking.status === 'completed').length;
    
    const pendingParkingBookings = parkingData.filter(booking => booking.status === 'pending').length;
    const pendingServiceBookings = serviceData.filter(booking => booking.status === 'pending').length;

    setSummary({
      totalParkingBookings,
      totalServiceBookings,
      totalParkingRevenue,
      totalServiceRevenue,
      totalCombinedRevenue,
      completedParkingBookings,
      completedServiceBookings,
      pendingParkingBookings,
      pendingServiceBookings
    });
  };

  const applyFilters = () => {
    let filteredParking = [...parkingBookings];
    let filteredService = [...serviceBookings];

    // Search filter
    if (searchTerm) {
      filteredParking = filteredParking.filter(booking => 
        booking.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.parking?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.slot?.slot_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.toString().includes(searchTerm)
      );

      filteredService = filteredService.filter(booking => 
        booking.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.service?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.toString().includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filteredParking = filteredParking.filter(booking => booking.status === statusFilter);
      filteredService = filteredService.filter(booking => booking.status === statusFilter);
    }

    // Date range filter
    if (dateRange.start) {
      filteredParking = filteredParking.filter(booking => 
        new Date(booking.created_at) >= new Date(dateRange.start)
      );
      filteredService = filteredService.filter(booking => 
        new Date(booking.created_at) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filteredParking = filteredParking.filter(booking => 
        new Date(booking.created_at) <= new Date(dateRange.end + 'T23:59:59')
      );
      filteredService = filteredService.filter(booking => 
        new Date(booking.created_at) <= new Date(dateRange.end + 'T23:59:59')
      );
    }

    // Time range filter
    const now = new Date();
    switch (timeRange) {
      case "today":
        filteredParking = filteredParking.filter(booking => {
          const bookingDate = new Date(booking.created_at);
          return bookingDate.toDateString() === now.toDateString();
        });
        filteredService = filteredService.filter(booking => {
          const bookingDate = new Date(booking.created_at);
          return bookingDate.toDateString() === now.toDateString();
        });
        break;
      case "weekly":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredParking = filteredParking.filter(booking => 
          new Date(booking.created_at) >= weekAgo
        );
        filteredService = filteredService.filter(booking => 
          new Date(booking.created_at) >= weekAgo
        );
        break;
      case "monthly":
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
        filteredParking = filteredParking.filter(booking => 
          new Date(booking.created_at) >= monthAgo
        );
        filteredService = filteredService.filter(booking => 
          new Date(booking.created_at) >= monthAgo
        );
        break;
      case "yearly":
        const yearAgo = new Date(now.getFullYear(), 0, 1);
        filteredParking = filteredParking.filter(booking => 
          new Date(booking.created_at) >= yearAgo
        );
        filteredService = filteredService.filter(booking => 
          new Date(booking.created_at) >= yearAgo
        );
        break;
      default:
        // "all" - no time filter
        break;
    }

    setFilteredParkingBookings(filteredParking);
    setFilteredServiceBookings(filteredService);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    applyFilters();
  };

  const handleReset = () => {
    setSearchTerm("");
    setTimeRange("all");
    setStatusFilter("all");
    setDateRange({ start: "", end: "" });
    setFilteredParkingBookings(parkingBookings);
    setFilteredServiceBookings(serviceBookings);
  };

  const handleRefresh = () => {
    fetchBookings();
  };

  // Print function
  const handlePrint = () => {
    const printContent = document.getElementById(`${activeTab}-bookings-table`);
    const printWindow = window.open('', '_blank');
    
    // Get date range information
    let dateRangeText = "All Time";
    if (timeRange !== "all") {
      const timeRangeMap = {
        "today": "Today",
        "weekly": "Last 7 Days",
        "monthly": "This Month",
        "yearly": "This Year"
      };
      dateRangeText = timeRangeMap[timeRange];
    }
    
    if (dateRange.start && dateRange.end) {
      dateRangeText = `${new Date(dateRange.start).toLocaleDateString()} to ${new Date(dateRange.end).toLocaleDateString()}`;
    } else if (dateRange.start) {
      dateRangeText = `From ${new Date(dateRange.start).toLocaleDateString()}`;
    } else if (dateRange.end) {
      dateRangeText = `Until ${new Date(dateRange.end).toLocaleDateString()}`;
    }

    // Get status filter information
    let statusText = "All Status";
    if (statusFilter !== "all") {
      statusText = statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
    }

    const currentBookings = activeTab === 'parking' ? filteredParkingBookings : filteredServiceBookings;
    const totalRevenue = activeTab === 'parking' ? 
      currentBookings.filter(booking => booking.status === 'completed').reduce((sum, booking) => sum + parseFloat(booking.total_price || 0), 0) :
      currentBookings.filter(booking => booking.status === 'completed').reduce((sum, booking) => sum + parseFloat(booking.service?.price || 0), 0);

    printWindow.document.write(`
      <html>
        <head>
          <title>${activeTab === 'parking' ? 'Parking' : 'Service'} Bookings Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .summary { margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-radius: 5px; }
            .filters { margin-bottom: 15px; padding: 10px; background: #f0f8ff; border-radius: 5px; }
            .filter-item { margin: 5px 0; }
            .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .badge-success { background: #28a745; color: white; }
            .badge-primary { background: #007bff; color: white; }
            .badge-warning { background: #ffc107; color: black; }
            .badge-danger { background: #dc3545; color: white; }
            .badge-info { background: #17a2b8; color: white; }
            .text-center { text-align: center; }
            .text-success { color: #28a745; }
            .text-primary { color: #007bff; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${activeTab === 'parking' ? 'Parking' : 'Service'} Bookings Report</h2>
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString('en-BD')} at ${new Date().toLocaleTimeString('en-BD')}</p>
          </div>
          
          <div class="filters">
            <h4>Summary:</h4>
            <div class="filter-item"><strong>Date Range:</strong> ${dateRangeText}</div>
            <div class="filter-item"><strong>Status:</strong> ${statusText}</div>
            ${searchTerm ? `<div class="filter-item"><strong>Search:</strong> "${searchTerm}"</div>` : ''}
            <div class="filter-item"><strong>Bookings:</strong> ${currentBookings.length} of ${activeTab === 'parking' ? parkingBookings.length : serviceBookings.length} bookings</div>
            <div class="filter-item"><strong>Revenue:</strong> ${formatCurrency(totalRevenue)}</div>
          </div>

          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [timeRange, statusFilter, dateRange, searchTerm]);

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

  const getStatusBadge = (status) => {
    const statusStyles = {
      'pending': 'badge bg-warning text-dark px-3 py-2',
      'confirmed': 'badge bg-primary px-3 py-2',
      'active': 'badge bg-info px-3 py-2',
      'completed': 'badge bg-success px-3 py-2',
      'cancelled': 'badge bg-danger px-3 py-2',
      'in_progress': 'badge bg-info px-3 py-2'
    };
    
    return `${statusStyles[status] || 'badge bg-secondary px-3 py-2'}`;
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (activeTab === 'parking') {
      csvContent += "Booking ID,User Name,User Email,Parking Name,Slot Code,Hours,Amount,Status,Booking Date\n";
      filteredParkingBookings.forEach(booking => {
        csvContent += `${booking.id},${booking.user?.name || 'N/A'},${booking.user?.email || 'N/A'},${booking.parking?.name || 'N/A'},${booking.slot?.slot_code || 'N/A'},${booking.hours},${booking.total_price},${booking.status},${booking.created_at}\n`;
      });
    } else {
      csvContent += "Order ID,User Name,User Email,Service Name,Service Price,Booking Time,Status,Order Date\n";
      filteredServiceBookings.forEach(booking => {
        csvContent += `${booking.id},${booking.user?.name || 'N/A'},${booking.user?.email || 'N/A'},${booking.service?.name || 'N/A'},${booking.service?.price || 'N/A'},${booking.booking_time},${booking.status},${booking.created_at}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab}-bookings-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCurrentBookings = () => {
    return activeTab === 'parking' ? filteredParkingBookings : filteredServiceBookings;
  };

  const getTotalBookings = () => {
    return activeTab === 'parking' ? parkingBookings.length : serviceBookings.length;
  };

  const getFilteredRevenue = () => {
    if (activeTab === 'parking') {
      return filteredParkingBookings
        .filter(booking => booking.status === 'completed')
        .reduce((sum, booking) => sum + parseFloat(booking.total_price || 0), 0);
    } else {
      return filteredServiceBookings
        .filter(booking => booking.status === 'completed')
        .reduce((sum, booking) => sum + parseFloat(booking.service?.price || 0), 0);
    }
  };

  const getFilteredCombinedRevenue = () => {
    const parkingRevenue = filteredParkingBookings
      .filter(booking => booking.status === 'completed')
      .reduce((sum, booking) => sum + parseFloat(booking.total_price || 0), 0);
    
    const serviceRevenue = filteredServiceBookings
      .filter(booking => booking.status === 'completed')
      .reduce((sum, booking) => sum + parseFloat(booking.service?.price || 0), 0);
    
    return parkingRevenue + serviceRevenue;
  };

  return (
    <div className="container-fluid py-4">
      {/* Header Section */}
      <div className="card border-0 shadow-lg rounded-3 overflow-hidden mb-4">
        <div className="card-header bg-gradient-primary text-white border-0 py-4 px-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center">
            
            <div className="d-flex flex-column flex-sm-row gap-3 w-100 w-lg-auto">
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
                disabled={loading}
              >
                <i className={`fas fa-sync-alt me-2 ${loading ? 'fa-spin' : ''}`}></i>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>

              <button 
                onClick={exportToCSV}
                className="btn btn-light btn-lg rounded-pill px-4 shadow-sm fw-semibold"
                disabled={getCurrentBookings().length === 0}
              >
                <i className="fas fa-download me-2"></i>
                Export CSV
              </button>

              {/* Print Button */}
              <button 
                onClick={handlePrint}
                className="btn btn-light btn-lg rounded-pill px-4 shadow-sm fw-semibold"
                disabled={getCurrentBookings().length === 0}
              >
                <i className="fas fa-print me-2"></i>
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="card-body border-bottom bg-light-white py-4 px-4">
          <div className="row g-4">
            {/* Total Revenue - New Section */}
            <div className="col-md-3">
              <div className="d-flex align-items-center">
                <div className="bg-success rounded-3 p-3 me-3">
                  {/*<i className="fas fa-chart-line text-white fa-lg"></i>*/}
                  <i class="fa-solid fa-dollar-sign fa-lg"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1 fw-semibold">Total Revenue</h6>
                  <h4 className="mb-0 fw-bold text-success">{formatCurrency(summary.totalCombinedRevenue)}</h4>
                  <small className="text-muted">Combined from all services</small>
                </div>
              </div>
            </div>

            {/* Parking Bookings Summary */}
            <div className="col-md-3">
              <div className="d-flex align-items-center">
                <div className="bg-primary rounded-3 p-3 me-3">
                  <i className="fas fa-parking text-white fa-lg"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1 fw-semibold">Parking Bookings</h6>
                  <h4 className="mb-0 fw-bold text-primary">{summary.totalParkingBookings}</h4>
                  <small className="text-muted">{summary.completedParkingBookings} completed</small>
                </div>
              </div>
            </div>

            {/* Service Bookings Summary */}
            <div className="col-md-3">
              <div className="d-flex align-items-center">
                <div className="bg-info rounded-3 p-3 me-3">
                  <i className="fas fa-car text-white fa-lg"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1 fw-semibold">Service Bookings</h6>
                  <h4 className="mb-0 fw-bold text-info">{summary.totalServiceBookings}</h4>
                  <small className="text-muted">{summary.completedServiceBookings} completed</small>
                </div>
              </div>
            </div>

            {/* Combined Bookings */}
            <div className="col-md-3">
              <div className="d-flex align-items-center">
                <div className="bg-warning rounded-3 p-3 me-3">
                  <i className="fas fa-calendar-alt text-white fa-lg"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1 fw-semibold">Total Bookings</h6>
                  <h4 className="mb-0 fw-bold text-warning">{summary.totalParkingBookings + summary.totalServiceBookings}</h4>
                  <small className="text-muted">All booking types</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-0">
          <ul className="nav nav-pills nav-fill p-3 border-bottom">
            <li className="nav-item">
              <button
                className={`nav-link text-primary ${activeTab === 'parking' ? 'active' : ''} fw-semibold`}
                onClick={() => setActiveTab('parking')}
              >
                <i className="fas fa-parking me-2"></i>
                Parking Bookings
                <span className="badge bg-light text-dark ms-2">{filteredParkingBookings.length}</span>
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link text-primary ${activeTab === 'services' ? 'active' : ''} fw-semibold`}
                onClick={() => setActiveTab('services')}
              >
                <i className="fas fa-car me-2"></i>
                Service Bookings
                <span className="badge bg-light text-dark ms-2">{filteredServiceBookings.length}</span>
              </button>
            </li>
          </ul>

          {/* Filters Section */}
          <div className="p-4">
            <div className="row g-3">
              {/* Time Range */}
              <div className="col-md-3">
                <label className="form-label fw-semibold">Time Range</label>
                <select 
                  className="form-select"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="weekly">Last 7 Days</option>
                  <option value="monthly">This Month</option>
                  <option value="yearly">This Year</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="col-md-3">
                <label className="form-label fw-semibold">Status</label>
                <select 
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  {activeTab === 'services' && <option value="in_progress">In Progress</option>}
                </select>
              </div>

              {/* Date Range - Start */}
              <div className="col-md-3">
                <label className="form-label fw-semibold">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  placeholder="Start Date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                />
              </div>

              {/* Date Range - End */}
              <div className="col-md-3">
                <label className="form-label fw-semibold">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  placeholder="End Date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                />
              </div>
            </div>

            {/* Reset Button and Active Filters */}
            <div className="row mt-4">
              <div className="col-md-6">
                <button 
                  onClick={handleReset}
                  className="btn btn-outline-secondary"
                >
                  <i className="fas fa-times me-2"></i>
                  Reset All Filters
                </button>
              </div>
              
              <div className="col-md-6">
                <div className="d-flex flex-wrap gap-2 align-items-center justify-content-end">
                  <small className="text-muted fw-semibold">Active Filters:</small>
                  {timeRange !== "all" && (
                    <span className="badge bg-primary">
                      Time: {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}
                      <button 
                        className="btn-close btn-close-white ms-1"
                        style={{fontSize: '0.6rem'}}
                        onClick={() => setTimeRange("all")}
                      ></button>
                    </span>
                  )}
                  {statusFilter !== "all" && (
                    <span className="badge bg-info">
                      Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                      <button 
                        className="btn-close btn-close-white ms-1"
                        style={{fontSize: '0.6rem'}}
                        onClick={() => setStatusFilter("all")}
                      ></button>
                    </span>
                  )}
                  {dateRange.start && (
                    <span className="badge bg-warning text-dark">
                      From: {dateRange.start}
                      <button 
                        className="btn-close ms-1"
                        style={{fontSize: '0.6rem'}}
                        onClick={() => setDateRange({...dateRange, start: ""})}
                      ></button>
                    </span>
                  )}
                  {dateRange.end && (
                    <span className="badge bg-warning text-dark">
                      To: {dateRange.end}
                      <button 
                        className="btn-close ms-1"
                        style={{fontSize: '0.6rem'}}
                        onClick={() => setDateRange({...dateRange, end: ""})}
                      ></button>
                    </span>
                  )}
                  {searchTerm && (
                    <span className="badge bg-secondary">
                      Search: {searchTerm}
                      <button 
                        className="btn-close btn-close-white ms-1"
                        style={{fontSize: '0.6rem'}}
                        onClick={() => setSearchTerm("")}
                      ></button>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="row mb-3">
        <div className="col-12">
          <div className="alert alert-light border-0 shadow-sm rounded-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Showing {getCurrentBookings().length} of {getTotalBookings()} {activeTab === 'parking' ? 'parking' : 'service'} bookings</strong>
                {getCurrentBookings().length !== getTotalBookings() && (
                  <span className="text-muted ms-2">(filtered from total)</span>
                )}
              </div>
              <div className="text-end">
                <div className="d-flex flex-column flex-md-row gap-3 align-items-end align-items-md-center">
                  <div>
                    <strong>Filtered Revenue: </strong>
                    <span className="text-success fw-bold">
                      {formatCurrency(getFilteredRevenue())}
                    </span>
                  </div>
                  <div className="border-start ps-3">
                    <strong>Total Combined Revenue: </strong>
                    <span className="text-primary fw-bold">
                      {formatCurrency(getFilteredCombinedRevenue())}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="card border-0 shadow-lg rounded-3 overflow-hidden">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5 my-5">
              <div className="spinner-grow text-primary mb-4" style={{width: '3rem', height: '3rem'}} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5 className="text-muted mb-2">Loading Booking Reports</h5>
              <p className="text-muted">Please wait while we fetch the latest booking information</p>
            </div>
          ) : getCurrentBookings().length === 0 ? (
            <div className="text-center py-5 my-5">
              <div className="bg-light rounded-3 p-5 mx-auto" style={{maxWidth: '400px'}}>
                <i className="fas fa-inbox fa-4x text-muted mb-4"></i>
                <h4 className="text-muted mb-3">No {activeTab === 'parking' ? 'Parking' : 'Service'} Bookings Found</h4>
                <p className="text-muted mb-4">
                  {searchTerm || timeRange !== "all" || statusFilter !== "all" || dateRange.start || dateRange.end 
                    ? 'No bookings match your filter criteria. Try adjusting your filters.' 
                    : `There are no ${activeTab === 'parking' ? 'parking' : 'service'} bookings in the system at the moment.`}
                </p>
                {(searchTerm || timeRange !== "all" || statusFilter !== "all" || dateRange.start || dateRange.end) && (
                  <button 
                    onClick={handleReset}
                    className="btn btn-primary rounded-pill px-4"
                  >
                    <i className="fas fa-times me-2"></i>
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="table-responsive" id={`${activeTab}-bookings-table`}>
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    {activeTab === 'parking' ? (
                      <>
                        <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Booking ID</th>
                        <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">User Details</th>
                        <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Parking Location</th>
                        <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Slot Code</th>
                        <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Duration</th>
                        <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Amount</th>
                        <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Status</th>
                        <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Booking Date & Time</th>
                      </>
                    ) : (
                      <>
                        <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Order ID</th>
                        <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">User Details</th>
                        <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Service Details</th>
                        <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Booking Time</th>
                        <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Amount</th>
                        <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Status</th>
                        <th className="text-center border-0 py-4 fw-bold text-uppercase text-muted small bg-light">Order Date</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {getCurrentBookings().map(booking => (
                    <tr key={booking.id} className="border-top border-light">
                      {activeTab === 'parking' ? (
                        <>
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
                        </>
                      ) : (
                        <>
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
                            <div className="d-flex flex-column align-items-center">
                              <span className="fw-medium text-dark">{booking.service?.name || 'N/A'}</span>
                              <small className="text-muted">{booking.service?.description || ''}</small>
                            </div>
                          </td>
                          <td className="text-center py-4">
                            <span className="text-dark fw-semibold">
                              <i className="fas fa-calendar me-2 text-info"></i>
                              {formatDate(booking.booking_time)}
                            </span>
                          </td>
                          <td className="text-center py-4">
                            <span className="fw-bold text-success fs-6">
                              {formatCurrency(booking.service?.price || 0)}
                            </span>
                          </td>
                          <td className="text-center py-4">
                            <span className={getStatusBadge(booking.status)}>
                              <i className={`fas ${
                                booking.status === 'completed' ? 'fa-check-circle' :
                                booking.status === 'confirmed' ? 'fa-calendar-check' :
                                booking.status === 'in_progress' ? 'fa-spinner' :
                                booking.status === 'pending' ? 'fa-clock' :
                                'fa-times-circle'
                              } me-2`}></i>
                              {booking.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </span>
                          </td>
                          <td className="text-center py-4">
                            <div className="d-flex flex-column align-items-center">
                              <small className="text-muted fw-semibold">{formatDate(booking.created_at)}</small>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}