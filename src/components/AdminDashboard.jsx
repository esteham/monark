import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    // Parking Stats
    totalParkings: 0,
    totalSlots: 0,
    availableSlots: 0,
    activeBookings: 0,
    totalUsers: 0,
    todayRevenue: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    completedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    
    // Service Stats 
    totalServices: 0,
    activeServices: 0,
    totalServiceOrders: 0,
    completedServiceOrders: 0,
    pendingServiceOrders: 0,
    inProgressServiceOrders: 0,
    cancelledServiceOrders: 0,
    totalServiceRevenue: 0,
    todayServiceRevenue: 0,
    monthlyServiceRevenue: 0,
    
    // Combined Stats 
    totalCombinedRevenue: 0,
    totalCombinedBookings: 0
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [recentServiceOrders, setRecentServiceOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      
      const [parkingsRes, bookingsRes, usersRes, slotsRes, servicesRes, serviceOrdersRes] = await Promise.all([
        axios.get('https://monark.xetroot.com/api/admin/parkings', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.warn('Parkings API error:', err.message);
          return { data: { data: [] } };
        }),
        
        axios.get('https://monark.xetroot.com/api/admin/bookings?per_page=1000', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.warn('Bookings API error:', err.message);
          return { data: { data: [] } };
        }),
        
        axios.get('https://monark.xetroot.com/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.warn('Users API error:', err.message);
          return { data: { data: [] } };
        }),

        axios.get('https://monark.xetroot.com/api/admin/slots', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.warn('Slots API error:', err.message);
          return { data: { data: [] } };
        }),

        // ✅ Services API fetch
        axios.get('https://monark.xetroot.com/api/admin/services', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.warn('Services API error:', err.message);
          return { data: { data: [] } };
        }),

        // ✅ Service Orders API fetch
        axios.get('https://monark.xetroot.com/api/admin/service-orders?per_page=1000', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.warn('Service Orders API error:', err.message);
          return { data: { data: [] } };
        })
      ]);

      // Handle API responses properly
      const parkings = extractData(parkingsRes.data);
      const bookings = extractData(bookingsRes.data);
      const users = extractData(usersRes.data);
      const slots = extractData(slotsRes.data);
      const services = extractData(servicesRes.data); // ✅ Services data
      const serviceOrders = extractData(serviceOrdersRes.data); // ✅ Service Orders data

      console.log('📊 PROCESSED DATA:');
      console.log('Parkings:', parkings.length);
      console.log('Bookings:', bookings.length);
      console.log('Services:', services.length);
      console.log('Service Orders:', serviceOrders.length);

      // ✅ FIXED: Calculate slots statistics from slots table
      const totalSlots = slots.length;
      const availableSlots = slots.filter(slot => slot.available === true || slot.available === 1).length;

      // Calculate parking revenue and statistics
      const totalParkingRevenue = bookings
        .filter(booking => booking.status === 'completed')
        .reduce((sum, booking) => sum + parseFloat(booking.total_price || 0), 0);

      // Calculate service revenue and statistics
      const totalServiceRevenue = serviceOrders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + parseFloat(order.service?.price || 0), 0);

      const totalCombinedRevenue = totalParkingRevenue + totalServiceRevenue;

      // Calculate parking booking statistics
      const activeParkingBookings = bookings.filter(booking => 
        booking.status === 'confirmed' || booking.status === 'active'
      ).length;

      const completedParkingBookings = bookings.filter(booking => 
        booking.status === 'completed'
      ).length;

      const pendingParkingBookings = bookings.filter(booking => 
        booking.status === 'pending'
      ).length;

      const cancelledParkingBookings = bookings.filter(booking => 
        booking.status === 'cancelled'
      ).length;

      // Calculate service order statistics
      const completedServiceOrders = serviceOrders.filter(order => 
        order.status === 'completed'
      ).length;

      const pendingServiceOrders = serviceOrders.filter(order => 
        order.status === 'pending'
      ).length;

      const inProgressServiceOrders = serviceOrders.filter(order => 
        order.status === 'in_progress'
      ).length;

      const cancelledServiceOrders = serviceOrders.filter(order => 
        order.status === 'cancelled'
      ).length;

      const totalServiceOrdersCount = serviceOrders.length;

      // Active services count
      const activeServices = services.filter(service => 
        service.status === 'active' || service.is_active === true || service.is_active === 1
      ).length;

      // Calculate revenue with date filters
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Parking revenue by time
      const todayParkingRevenue = bookings
        .filter(booking => 
          booking.status === 'completed' && 
          booking.created_at && 
          booking.created_at.includes(today)
        )
        .reduce((sum, booking) => sum + parseFloat(booking.total_price || 0), 0);

      const monthlyParkingRevenue = bookings
        .filter(booking => {
          if (booking.status !== 'completed' || !booking.created_at) return false;
          const bookingDate = new Date(booking.created_at);
          return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
        })
        .reduce((sum, booking) => sum + parseFloat(booking.total_price || 0), 0);

      const yearlyParkingRevenue = bookings
        .filter(booking => {
          if (booking.status !== 'completed' || !booking.created_at) return false;
          const bookingDate = new Date(booking.created_at);
          return bookingDate.getFullYear() === currentYear;
        })
        .reduce((sum, booking) => sum + parseFloat(booking.total_price || 0), 0);

      // Service revenue by time
      const todayServiceRevenue = serviceOrders
        .filter(order => 
          order.status === 'completed' && 
          order.created_at && 
          order.created_at.includes(today)
        )
        .reduce((sum, order) => sum + parseFloat(order.service?.price || 0), 0);

      const monthlyServiceRevenue = serviceOrders
        .filter(order => {
          if (order.status !== 'completed' || !order.created_at) return false;
          const orderDate = new Date(order.created_at);
          return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        })
        .reduce((sum, order) => sum + parseFloat(order.service?.price || 0), 0);

      // Recent bookings
      const recentBookingsData = [...bookings]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 5)
        .map(booking => ({
          ...booking,
          user: booking.user || { name: 'N/A' },
          parking: booking.parking || { name: 'N/A' },
          slot: booking.slot || { slot_code: 'N/A' },
          type: 'parking' // Type identifier
        }));

      // Recent service orders
      const recentServiceOrdersData = [...serviceOrders]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 5)
        .map(order => ({
          ...order,
          user: order.user || { name: 'N/A' },
          service: order.service || { name: 'N/A', price: 0 },
          type: 'service' // Type identifier
        }));

      // Set stats
      const newStats = {
        // Parking Stats
        totalParkings: parkings.length,
        totalSlots,
        availableSlots,
        activeBookings: activeParkingBookings,
        totalUsers: users.length,
        todayRevenue: todayParkingRevenue,
        monthlyRevenue: monthlyParkingRevenue,
        totalRevenue: totalParkingRevenue,
        yearlyRevenue: yearlyParkingRevenue,
        completedBookings: completedParkingBookings,
        pendingBookings: pendingParkingBookings,
        cancelledBookings: cancelledParkingBookings,
        
        // Service Stats
        totalServices: services.length,
        activeServices,
        totalServiceOrders: totalServiceOrdersCount,
        completedServiceOrders,
        pendingServiceOrders,
        inProgressServiceOrders,
        cancelledServiceOrders,
        totalServiceRevenue,
        todayServiceRevenue,
        monthlyServiceRevenue,
        
        // Combined Stats
        totalCombinedRevenue,
        totalCombinedBookings: bookings.length + serviceOrders.length
      };

      console.log('FINAL STATS:', newStats);

      setStats(newStats);
      setRecentBookings(recentBookingsData);
      setRecentServiceOrders(recentServiceOrdersData);

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract data from different API response structures
  const extractData = (response) => {
    if (!response) return [];
    
    // Case 1: Direct array
    if (Array.isArray(response.data)) {
      return response.data;
    }
    // Case 2: Paginated response { data: { data: [], ... } }
    else if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    // Case 3: Nested structure
    else if (response.data && typeof response.data === 'object') {
      // Try to find array in nested structure
      for (let key in response.data) {
        if (Array.isArray(response.data[key])) {
          return response.data[key];
        }
      }
    }
    // Case 4: Fallback
    return [];
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-BD', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      'pending': 'badge bg-warning text-dark',
      'confirmed': 'badge bg-primary',
      'active': 'badge bg-info',
      'completed': 'badge bg-success',
      'cancelled': 'badge bg-danger',
      'in_progress': 'badge bg-info'
    };
    return statusStyles[status] || 'badge bg-secondary';
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="text-center py-5">
          <div className="spinner-grow text-primary mb-4" style={{width: '3rem', height: '3rem'}} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Loading Dashboard...</h5>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="fas fa-exclamation-triangle me-3 fs-4"></i>
          <div>
            <h5 className="alert-heading mb-2">Unable to Load Dashboard</h5>
            <p className="mb-0">{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="btn btn-outline-danger btn-sm mt-2"
            >
              <i className="fas fa-refresh me-2"></i>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 10px 10px 20px #babecc, -10px -10px 20px #ffffff;
          transition: all 0.3s ease;
        }
        
        .glass-card:hover {
          transform: translateY(-5px);
          box-shadow: 15px 15px 30px #babecc, -15px -15px 30px #ffffff;
        }
        
        .neumorph-card {
          background: #e8ecf1;
          border-radius: 20px;
          box-shadow: 10px 10px 20px #babecc, -10px -10px 20px #ffffff;
          transition: all 0.3s ease;
          border: none;
        }
        
        .neumorph-card:hover {
          transform: translateY(-5px);
          box-shadow: 15px 15px 25px #babecc, -15px -15px 25px #ffffff;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .stats-icon {
          width: 60px;
          height: 60px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: inset 5px 5px 10px #babecc, inset -5px -5px 10px #ffffff;
        }
        
        .revenue-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 20px;
          box-shadow: 10px 10px 20px rgba(102, 126, 234, 0.3), -10px -10px 20px rgba(118, 75, 162, 0.2);
        }
        
        .booking-card {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          border-radius: 20px;
          box-shadow: 10px 10px 20px rgba(240, 147, 251, 0.3), -10px -10px 20px rgba(245, 87, 108, 0.2);
        }
        
        .user-card {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
          border-radius: 20px;
          box-shadow: 10px 10px 20px rgba(79, 172, 254, 0.3), -10px -10px 20px rgba(0, 242, 254, 0.2);
        }
        
        .success-card {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          color: white;
          border-radius: 20px;
          box-shadow: 10px 10px 20px rgba(67, 233, 123, 0.3), -10px -10px 20px rgba(56, 249, 215, 0.2);
        }
        
        .service-card {
          background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
          color: white;
          border-radius: 20px;
          box-shadow: 10px 10px 20px rgba(255, 154, 158, 0.3), -10px -10px 20px rgba(254, 207, 239, 0.2);
        }
      `}</style>

      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center ms-auto gap-3">
          <div className="text-muted small">Last Updated:</div>
          <div className="fw-bold text-primary">{new Date().toLocaleDateString('en-BD')}</div>
          <button
            onClick={fetchDashboardData}
            className="btn btn-sm btn-outline-primary"
            disabled={loading}
          >
            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i> Refresh
          </button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="row g-4 ">
        {/* Total Combined Revenue Card */}
        <div className="col-xl-4 col-md-4">
          <div className="card revenue-card h-100 border-0">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div className="flex-grow-1">
                  <h6 className="text-white-50 text-uppercase small mb-2">Total Revenue</h6>
                  <h2 className="fw-bold mb-1 text-white">{formatCurrency(stats.totalCombinedRevenue)}</h2>
                  <div className="d-flex align-items-center">
                    {/*<span className="badge bg-opacity-20 text-white px-1 py-1">
                      <i className="fas fa-chart-line me-1"></i>
                      Combined
                    </span>*/}
                    <small className="ms-2 text-white-75">Parking + Services</small>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="stats-icon bg-opacity-20">
                    <i className="fas fa-money-bill-wave text-white fs-4"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Bookings Card */}
        <div className="col-xl-4 col-md-4">
          <div className="card booking-card h-100 border-0">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div className="flex-grow-1">
                  <h6 className="text-white-50 text-uppercase small mb-2">Total Bookings</h6>
                  <h2 className="fw-bold mb-1">{stats.totalCombinedBookings}</h2>
                  <div className="d-flex align-items-center">
                    <span className="badge bg-opacity-20 px-1 py-1">
                      <i className="fas fa-check me-1"></i>
                      All Types
                    </span>
                    <small className="ms-2 opacity-75">Parking + Services</small>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="stats-icon bg-opacity-20">
                    <i className="fas fa-calendar-check text-white"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Users Card */}
        <div className="col-xl-4 col-md-4">
          <div className="card user-card h-100 border-0">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div className="flex-grow-1">
                  <h6 className="text-white-50 text-uppercase small mb-2">Total Users</h6>
                  <h2 className="fw-bold mb-1">{stats.totalUsers}</h2>
                  <div className="d-flex align-items-center">
                    <span className="badge bg-opacity-20 px-1 py-1">
                      <i className="fas fa-users me-1"></i>
                      Active
                    </span>
                    <small className="ms-2 opacity-75">Registered</small>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="stats-icon bg-opacity-20">
                    <i className="fas fa-user-friends text-white"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Services Card */}
        {/*<div className="col-xl-3 col-md-4">
          <div className="card service-card h-100 border-0">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div className="flex-grow-1">
                  <h6 className="text-white-50 text-uppercase small mb-2">Services</h6>
                  <h2 className="fw-bold mb-1">{stats.totalServices}</h2>
                  <div className="d-flex align-items-center">
                    <span className="badge bg-opacity-20 px-1 py-1">
                      <i className="fas fa-cog me-1"></i>
                      {stats.activeServices} Active
                    </span>
                    <small className="ms-2 opacity-75">Available</small>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="stats-icon bg-opacity-20">
                    <i className="fas fa-concierge-bell text-white"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>*/}
      </div>

      {/* Additional Stats Cards */}
      <div className="row g-4 mb-5">
        {/* Parking Stats */}
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card neumorph-card h-100">
            <div className="card-body text-center p-4">
              <div className="stats-icon mx-auto mb-3 bg-primary text-white">
                <i className="fas fa-square-parking"></i>
              </div>
              <h6 className="text-muted mb-2">Parking Lots</h6>
              <h4 className="fw-bold gradient-text">{stats.totalParkings}</h4>
              <small className="text-muted">Locations</small>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card neumorph-card h-100">
            <div className="card-body text-center p-4">
              <div className="stats-icon mx-auto mb-3 bg-info text-white">
                <i className="fas fa-car-side"></i>
              </div>
              <h6 className="text-muted mb-2">Total Slots</h6>
              <h4 className="fw-bold gradient-text">{stats.totalSlots}</h4>
              <small className="text-muted">All slots</small>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card neumorph-card h-100">
            <div className="card-body text-center p-4">
              <div className="stats-icon mx-auto mb-3 bg-warning text-white">
                <i className="fas fa-clock"></i>
              </div>
              <h6 className="text-muted mb-2">Parking Bookings</h6>
              <h4 className="fw-bold gradient-text">{stats.activeBookings}</h4>
              <small className="text-muted">Active</small>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card neumorph-card h-100">
            <div className="card-body text-center p-4">
              <div className="stats-icon mx-auto mb-3 bg-success text-white">
                <i className="fas fa-check-circle"></i>
              </div>
              <h6 className="text-muted mb-2">Parking Revenue</h6>
              <h4 className="fw-bold gradient-text">{formatCurrency(stats.totalRevenue)}</h4>
              <small className="text-muted">Total</small>
            </div>
          </div>
        </div>

        {/* Service Stats */}
        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card neumorph-card h-100">
            <div className="card-body text-center p-4">
              <div className="stats-icon mx-auto mb-3 bg-danger text-white">
                <i className="fas fa-concierge-bell"></i>
              </div>
              <h6 className="text-muted mb-2">Service Orders</h6>
              <h4 className="fw-bold gradient-text">{stats.totalServiceOrders}</h4>
              <small className="text-muted">Total</small>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-sm-6">
          <div className="card neumorph-card h-100">
            <div className="card-body text-center p-4">
              <div className="stats-icon mx-auto mb-3 bg-purple text-white">
                <i className="fas fa-money-bill-wave"></i>
              </div>
              <h6 className="text-muted mb-2">Service Revenue</h6>
              <h4 className="fw-bold gradient-text">{formatCurrency(stats.totalServiceRevenue)}</h4>
              <small className="text-muted">Total</small>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Recent Bookings & Service Orders */}
        <div className="col-lg-6">
          {/* Recent Parking Bookings */}
          <div className="card glass-card border-0 mb-4">
            <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center py-3">
              <h5 className="mb-0 fw-bold gradient-text">
                <i className="fas fa-parking me-2"></i>
                Recent Parking Bookings
              </h5>
              <Link to="/admin/bookings" className="btn btn-sm btn-secondary">
                View All
              </Link>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Booking ID</th>
                      <th>User</th>
                      <th>Parking</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.length > 0 ? (
                      recentBookings.map(booking => (
                        <tr key={booking.id}>
                          <td className="ps-4">
                            <span className="fw-bold text-primary">#{booking.id}</span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="avatar-sm bg-light rounded-circle d-flex align-items-center justify-content-center me-2">
                                <i className="fas fa-user text-muted"></i>
                              </div>
                              <span>{booking.user?.name || 'N/A'}</span>
                            </div>
                          </td>
                          <td>{booking.parking?.name || 'N/A'}</td>
                          <td className="fw-bold text-success">{formatCurrency(booking.total_price)}</td>
                          <td>
                            <span className={`${getStatusBadge(booking.status)} px-2 py-1`}>
                              {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'Unknown'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">
                          <i className="fas fa-inbox fa-2x mb-2"></i>
                          <br />
                          No recent parking bookings
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Parking Statistics */}
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card glass-card border-0">
                <div className="card-body text-center">
                  <div className="bg-success bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                    <i className="fas fa-check-circle text-success fs-2"></i>
                  </div>
                  <h3 className="fw-bold text-success">{stats.completedBookings}</h3>
                  <p className="text-muted mb-0">Completed</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card glass-card border-0">
                <div className="card-body text-center">
                  <div className="bg-warning bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                    <i className="fas fa-clock text-warning fs-2"></i>
                  </div>
                  <h3 className="fw-bold text-warning">{stats.pendingBookings}</h3>
                  <p className="text-muted mb-0">Pending</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card glass-card border-0">
                <div className="card-body text-center">
                  <div className="bg-info bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                    <i className="fas fa-sync-alt text-info fs-2"></i>
                  </div>
                  <h3 className="fw-bold text-info">{stats.activeBookings}</h3>
                  <p className="text-muted mb-0">Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Service Orders Section */}
        <div className="col-lg-6">
          {/* Recent Service Orders */}
          <div className="card glass-card border-0 mb-4">
            <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center py-3">
              <h5 className="mb-0 fw-bold gradient-text">
                <i className="fas fa-concierge-bell me-2"></i>
                Recent Service Orders
              </h5>
              <Link to="/admin/service-orders" className="btn btn-sm btn-secondary">
                View All
              </Link>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Order ID</th>
                      <th>User</th>
                      <th>Service</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentServiceOrders.length > 0 ? (
                      recentServiceOrders.map(order => (
                        <tr key={order.id}>
                          <td className="ps-4">
                            <span className="fw-bold text-primary">#{order.id}</span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="avatar-sm bg-light rounded-circle d-flex align-items-center justify-content-center me-2">
                                <i className="fas fa-user text-muted"></i>
                              </div>
                              <span>{order.user?.name || 'N/A'}</span>
                            </div>
                          </td>
                          <td>{order.service?.name || 'N/A'}</td>
                          <td className="fw-bold text-success">{formatCurrency(order.service?.price)}</td>
                          <td>
                            <span className={`${getStatusBadge(order.status)} px-2 py-1`}>
                              {order.status?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Unknown'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">
                          <i className="fas fa-inbox fa-2x mb-2"></i>
                          <br />
                          No recent service orders
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Service Statistics */}
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card glass-card border-0">
                <div className="card-body text-center">
                  <div className="bg-success bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                    <i className="fas fa-check-circle text-success fs-2"></i>
                  </div>
                  <h3 className="fw-bold text-success">{stats.completedServiceOrders}</h3>
                  <p className="text-muted mb-0">Completed</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card glass-card border-0">
                <div className="card-body text-center">
                  <div className="bg-warning bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                    <i className="fas fa-clock text-warning fs-2"></i>
                  </div>
                  <h3 className="fw-bold text-warning">{stats.pendingServiceOrders}</h3>
                  <p className="text-muted mb-0">Pending</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card glass-card border-0">
                <div className="card-body text-center">
                  <div className="bg-info bg-opacity-10 rounded-circle p-3 d-inline-block mb-3">
                    <i className="fas fa-spinner text-info fs-2"></i>
                  </div>
                  <h3 className="fw-bold text-info">{stats.inProgressServiceOrders}</h3>
                  <p className="text-muted mb-0">In Progress</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="card glass-card border-0 mt-4">
        <div className="card-header bg-transparent border-0 py-3">
          <h5 className="mb-0 fw-bold gradient-text">
            <i className="fas fa-chart-line me-2"></i>
            Financial Summary
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <h6 className="text-muted mb-3">Parking Revenue</h6>
              <div className="space-y-3">
                <div className="d-flex justify-content-between align-items-center p-2 rounded" style={{background: 'rgba(255, 193, 7, 0.1)'}}>
                  <span className="text-muted">
                    <i className="fas fa-sun me-2 text-warning"></i>
                    Today
                  </span>
                  <span className="fw-bold text-warning">{formatCurrency(stats.todayRevenue)}</span>
                </div>
                
                <div className="d-flex justify-content-between align-items-center p-2 rounded" style={{background: 'rgba(13, 110, 253, 0.1)'}}>
                  <span className="text-muted">
                    <i className="fas fa-calendar me-2 text-primary"></i>
                    This Month
                  </span>
                  <span className="fw-bold text-primary">{formatCurrency(stats.monthlyRevenue)}</span>
                </div>
                
                <div className="d-flex justify-content-between align-items-center p-2 rounded" style={{background: 'rgba(25, 135, 84, 0.1)'}}>
                  <span className="text-muted">
                    <i className="fas fa-chart-line me-2 text-success"></i>
                    All Time
                  </span>
                  <span className="fw-bold text-success">{formatCurrency(stats.totalRevenue)}</span>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <h6 className="text-muted mb-3">Service Revenue</h6>
              <div className="space-y-3">
                <div className="d-flex justify-content-between align-items-center p-2 rounded" style={{background: 'rgba(255, 193, 7, 0.1)'}}>
                  <span className="text-muted">
                    <i className="fas fa-sun me-2 text-warning"></i>
                    Today
                  </span>
                  <span className="fw-bold text-warning">{formatCurrency(stats.todayServiceRevenue)}</span>
                </div>
                
                <div className="d-flex justify-content-between align-items-center p-2 rounded" style={{background: 'rgba(13, 110, 253, 0.1)'}}>
                  <span className="text-muted">
                    <i className="fas fa-calendar me-2 text-primary"></i>
                    This Month
                  </span>
                  <span className="fw-bold text-primary">{formatCurrency(stats.monthlyServiceRevenue)}</span>
                </div>
                
                <div className="d-flex justify-content-between align-items-center p-2 rounded" style={{background: 'rgba(25, 135, 84, 0.1)'}}>
                  <span className="text-muted">
                    <i className="fas fa-chart-line me-2 text-success"></i>
                    All Time
                  </span>
                  <span className="fw-bold text-success">{formatCurrency(stats.totalServiceRevenue)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <hr />
          
          <div className="row">
            <div className="col-md-6">
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold">Total Users</span>
                <span className="fw-bold text-info">{stats.totalUsers}</span>
              </div>
              
              <div className="d-flex justify-content-between align-items-center mt-2">
                <span className="fw-bold">Total Services</span>
                <span className="fw-bold text-purple">{stats.totalServices}</span>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold">Total Bookings</span>
                <span className="fw-bold text-warning">{stats.totalCombinedBookings}</span>
              </div>
              
              <div className="d-flex justify-content-between align-items-center mt-2">
                <span className="fw-bold">Total Revenue</span>
                <span className="fw-bold text-success">{formatCurrency(stats.totalCombinedRevenue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}