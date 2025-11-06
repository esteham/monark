import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import api, { getMe, walletAPI, bookingAPI, serviceOrdersAPI } from "../api/client";
import Spinner from "../components/Spinner";
import Swal from "sweetalert2";
import "./css/Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const [walletBalance, setWalletBalance] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [serviceOrders, setServiceOrders] = useState([]);
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bkash");
  const [transactionId, setTransactionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeSection, setActiveSection] = useState("parking");
  const [actionLoading, setActionLoading] = useState(null);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Fetch wallet data
  const fetchWalletData = async () => {
    try {
      const balanceData = await walletAPI.getBalance();
      if (balanceData && balanceData.success) {
        setWalletBalance(balanceData.balance);
      } else {
        setWalletBalance(0);
      }
    } catch (error) {
      console.error("Wallet fetch error:", error);
      setWalletBalance(0);
    }
  };

  // Fetch user bookings
  const fetchUserBookings = async () => {
    try {
      const response = await api.get('/bookings');
      if (response.data && response.data.success) {
        setBookings(response.data.bookings);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Bookings fetch error:", error);
      setBookings([]);
    }
  };

  // Fetch service orders data
  const fetchServiceOrders = async () => {
    try {
      const response = await serviceOrdersAPI.getUserOrders();
      if (response.data) {
        setServiceOrders(response.data);
      } else {
        setServiceOrders([]);
      }
    } catch (error) {
      console.error("Service orders fetch error:", error);
      setServiceOrders([]);
    }
  };

  // Initialize dashboard
  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);
      try {
        const savedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        let currentUser = null;
        if (savedUser) {
          try {
            currentUser = JSON.parse(savedUser);
            setUser(currentUser);
          } catch (err) {
            localStorage.removeItem("user");
          }
        }

        if (!currentUser && !token) {
          navigate("/login");
          return;
        }

        if (token) {
          try {
            const userData = await getMe();
            if (userData && userData.user) {
              setUser(userData.user);
              localStorage.setItem("user", JSON.stringify(userData.user));
            } else {
              navigate("/login");
              return;
            }
          } catch (err) {
            navigate("/login");
            return;
          }
        }

        await Promise.all([fetchWalletData(), fetchUserBookings(), fetchServiceOrders()]);
      } catch (error) {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [navigate, setUser]);

  // Handle checkout request
  const handleCheckoutRequest = async (bookingId) => {
    const result = await Swal.fire({
      title: 'Request Checkout?',
      text: 'Are you sure you want to checkout from this parking spot?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Checkout',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    });

    if (!result.isConfirmed) {
      return;
    }

    setActionLoading(bookingId);
    try {
      const response = await bookingAPI.requestCheckout(bookingId);
      
      if (response.data.success) {
        Swal.fire({
          title: 'Success!',
          text: 'Checkout requested successfully!',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3085d6',
        });
        
        if (response.data.requires_payment && response.data.extra_charges > 0) {
          const paymentResult = await Swal.fire({
            title: 'Extra Charges Required',
            text: `You have extra charges of BDT ${response.data.extra_charges}. Do you want to pay now?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Pay Now',
            cancelButtonText: 'Later',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
          });
          
          if (paymentResult.isConfirmed) {
            await handlePayExtraCharges(bookingId);
          }
        } else {
          await fetchUserBookings();
        }
      }
    } catch (error) {
      console.error('Checkout request failed:', error);
      const errorMessage = error.response?.data?.message || 'Checkout request failed. Please try again.';
      
      Swal.fire({
        title: 'Failed!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle extra charges payment
  const handlePayExtraCharges = async (bookingId) => {
    setActionLoading(bookingId);
    try {
      const response = await bookingAPI.payExtraCharges(bookingId);
      
      if (response.data.success) {
        Swal.fire({
          title: 'Success!',
          text: 'Extra charges paid successfully! Waiting for admin approval.',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3085d6',
        });
        
        await fetchUserBookings();
        await fetchWalletData();
      }
    } catch (error) {
      console.error('Payment failed:', error);
      const errorMessage = error.response?.data?.message || 'Payment failed. Please try again.';
      
      Swal.fire({
        title: 'Failed!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle view ticket
  const handleViewTicket = (booking) => {
    setSelectedTicket(booking);
    setShowTicketModal(true);
  };

  // Handle download ticket
  const handleDownloadTicket = async (booking) => {
    try {
      setActionLoading(booking.id);
      
      const response = await bookingAPI.downloadTicket(booking.id);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket-${booking.ticket_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      Swal.fire({
        title: 'Success!',
        text: 'Ticket downloaded successfully!',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6',
      });
      
    } catch (error) {
      console.error('Download failed:', error);
      
      let errorMessage = 'Failed to download ticket';
      if (error.response?.status === 404) {
        errorMessage = 'Ticket not found or not available for download';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      Swal.fire({
        title: 'Error!',
        text: errorMessage,
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate parking stats
  const totalBookings = bookings.length;
  const activeBookings = bookings.filter(b => 
    b.status === 'confirmed' || 
    b.status === 'active' || 
    b.status === 'checkout_requested' || 
    b.status === 'checkout_paid'
  ).length;
  const totalSpent = bookings.reduce((sum, booking) => sum + parseFloat(booking.grand_total || 0), 0);

  // Calculate service stats
  const totalServiceOrders = serviceOrders.length;
  const activeServiceOrders = serviceOrders.filter(order => 
    order.status === 'pending' || order.status === 'in_progress'
  ).length;
  const completedServiceOrders = serviceOrders.filter(order => 
    order.status === 'completed'
  ).length;

  // Get active bookings for display
  const activeBookingsList = bookings.filter(b => 
    b.status === 'confirmed' || 
    b.status === 'active' || 
    b.status === 'checkout_requested' || 
    b.status === 'checkout_paid'
  );

  // Get completed bookings for display
  const completedBookings = bookings.filter(b => 
    b.status === 'completed' || 
    b.status === 'cancelled'
  );

  // Get active service orders for display
  const activeServiceOrdersList = serviceOrders.filter(order => 
    order.status === 'pending' || order.status === 'in_progress'
  );

  // Get completed service orders
  const completedServiceOrdersList = serviceOrders.filter(order => 
    order.status === 'completed' || order.status === 'cancelled'
  );

  // Show loading spinner while initializing
  if (loading || !user) {
    return <Spinner />;
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="welcome-section mb-5">
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="welcome-content">
                <h1 className="welcome-message">
                  <span className="greeting-text">Hello, {user.name} !</span>
                  <span className="greeting-emoji"> </span>
                </h1>
              </div>
            </div>
            <div className="col-lg-4 mt-4 mt-lg-0">
              <div className="wallet-card">
                <div className="wallet-body">
                  <div className="wallet-amount position-relative">
                    <div className="d-flex align-items-center justify-content-between mb-5">
                      <h6 className="mb-0">
                        <i className="fas fa-wallet text-primary me-2"></i> Wallet Balance
                      </h6>
                      <div className="wallet-actions">
                        <button 
                          className="action-btn add-funds btn btn-primary btn-sm"
                          onClick={() => navigate("/topup")}
                        >
                          <i className="fas fa-plus-circle me-1"></i>
                          <b>Top Up</b>
                        </button>
                      </div>
                    </div>
                    
                    <div className="amount-display d-flex align-items-center justify-content-center">
                      <span className="amount">BDT {walletBalance}</span>
                    </div>
                  </div>
                </div>                

                <div className="wallet-decoration">
                  <div className="circle circle-1"></div>
                  <div className="circle circle-2"></div>
                  <div className="dotted-line"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Bookings/Service Tabs Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3">
              <div className="d-flex justify-content-center">
                <ul className="nav nav-pills nav-fill gap-3 p-2 small bg-light rounded-3" style={{maxWidth: "500px"}}>
                  <li className="nav-item">
                    <button
                      className={`nav-link rounded-3 p-2 px-3 ${activeSection === "parking" ? "active bg-primary" : "text-dark"}`}
                      onClick={() => setActiveSection("parking")}
                    >
                      <i className="fas fa-parking me-2"></i>
                      Parking Bookings 
                      {activeBookingsList.length > 0 && (
                        <span className="badge bg-danger ms-1">{activeBookingsList.length}</span>
                      )}
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link rounded-3 p-2 px-3 ${activeSection === "service" ? "active bg-success" : "text-dark"}`}
                      onClick={() => setActiveSection("service")}
                    >
                      <i className="fab fa-slack me-2"></i>
                      Car Services 
                      {activeServiceOrdersList.length > 0 && (
                        <span className="badge bg-danger ms-1">{activeServiceOrdersList.length}</span>
                      )}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Parking Section */}
      {activeSection === "parking" && (
        <>
          {/* Active Parking Bookings */}
          {activeBookingsList.length > 0 ? (
            <div className="row mb-5">
              <div className="col-12">
                <div className="card border-0 shadow-lg active-booking-card">
                  <div className="card-header bg-transparent border-0 py-4">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <div>
                          <h4 className="mb-0 text-dark fw-bold">
                            Active Bookings
                            <span className="badge active-booking-badge ms-2">{activeBookingsList.length}</span>
                          </h4>
                        </div>
                      </div>
                      <div className="text-end">
                        <small className="text-primary fw-semibold">
                          <i className="fas fa-clock me-1"></i>
                          Real-time Updates
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="active-booking-thead">
                          <tr>
                            <th className="ps-4">
                              <i className="fas fa-map-marker-alt me-2"></i>
                              Parking Location
                            </th>
                            <th>
                              <i className="fas fa-parking me-2"></i>
                              Slot
                            </th>
                            <th className="text-center">
                              <i className="fas fa-clock me-2"></i>
                              Duration
                            </th>
                            <th>
                              <i className="fas fa-money-bill-wave me-2"></i>
                              Amount
                            </th>
                            <th>
                              <i className="fas fa-info-circle me-2"></i>
                              Status
                            </th>
                            <th className="pe-4">
                              <i className="fas fa-cogs me-2"></i>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeBookingsList.map((booking) => (
                            <tr key={booking.id} className="active-booking-row">
                              <td className="ps-4">
                                <div>
                                  <strong className="text-dark">{booking.parking?.name}</strong>
                                  <br />
                                  <small className="text-muted">
                                    <i className="fas fa-location-arrow me-1"></i>
                                    {booking.parking?.distance}
                                  </small>
                                </div>
                              </td>
                              <td>
                                <span className="badge slot-badge">
                                  {booking.slot?.slot_code}
                                </span>
                              </td>
                              <td className="d-flex align-items-center justify-content-center">
                                <div className="duration-display text-center">
                                  <div className="duration-content" style={{minWidth: '120px', maxWidth: '340px'}}>
                                    <div className="duration-badge bg-primary bg-opacity-10 text-primary rounded-pill px-2 py-1 mb-1">
                                      <i className="fas fa-hourglass-half fa-sm text-primary me-1"></i>
                                      <span className="fw-bold" style={{fontSize: '0.8rem'}}>
                                        {booking.hours} hour{booking.hours > 1 ? 's' : ''}
                                      </span>
                                    </div>
                                    <div className="end-time" style={{minWidth: '110px'}}>
                                      <i className="fas fa-flag-checkered me-1 text-warning" style={{fontSize: '0.7rem'}}></i>
                                      <small className="text-muted fw-semibold" style={{fontSize: '0.75rem'}}>
                                        Ends: {formatDate(booking.end_time)}
                                      </small>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="amount-display">
                                  <strong className="text-success">BDT {booking.total_price}</strong>
                                  {booking.extra_charges > 0 && (
                                    <div className="extra-charges">
                                      <small className="text-danger fw-bold">
                                        <i className="fas fa-plus-circle me-1"></i>
                                        BDT {booking.extra_charges} extra
                                      </small>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <span className={`badge status-badge ${
                                  booking.status === 'confirmed' ? 'status-confirmed' : 
                                  booking.status === 'checkout_requested' ? 'status-pending' : 
                                  booking.status === 'checkout_paid' ? 'status-waiting' : 
                                  'status-other'
                                }`}>
                                  <i className={`fas ${
                                    booking.status === 'confirmed' ? 'fa-check-circle' : 
                                    booking.status === 'checkout_requested' ? 'fa-clock' : 
                                    booking.status === 'checkout_paid' ? 'fa-user-clock' : 
                                    'fa-info-circle'
                                  } me-1`}></i>
                                  {booking.status === 'checkout_requested' ? 'Wait for Approval' : 
                                   booking.status === 'checkout_paid' ? 'Wait for Approval' : 
                                   booking.status}
                                </span>
                              </td>
                              <td className="pe-4">
                                {booking.status === 'confirmed' && (
                                  <button
                                    className="btn btn-warning btn-sm fw-bold checkout-btn"
                                    onClick={() => handleCheckoutRequest(booking.id)}
                                    disabled={actionLoading === booking.id}
                                  >
                                    {actionLoading === booking.id ? (
                                      <span className="spinner-border spinner-border-sm me-1" />
                                    ) : (
                                      <i className="fas fa-sign-out-alt me-1"></i>
                                    )}
                                    Checkout
                                  </button>
                                )}
                                {booking.status === 'checkout_requested' && booking.extra_charges > 0 && (
                                  <button
                                    className="btn btn-danger btn-sm fw-bold pay-now-btn"
                                    onClick={() => handlePayExtraCharges(booking.id)}
                                    disabled={actionLoading === booking.id}
                                  >
                                    {actionLoading === booking.id ? (
                                      <span className="spinner-border spinner-border-sm me-1" />
                                    ) : (
                                      <i className="fas fa-money-bill me-1"></i>
                                    )}
                                    Pay Now
                                  </button>
                                )}
                                {booking.status === 'checkout_paid' && (
                                  <span className="waiting-approval">
                                    <i className="fas fa-clock me-1"></i>
                                    Waiting for Admin
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="row mb-5">
              <div className="col-12">
                <div className="card border-0 shadow-sm no-active-bookings-card">
                  <div className="card-body text-center py-5">
                    <div className="no-booking-icon mb-4">
                      <i className="fas fa-car"></i>
                    </div>
                    <h4 className="text-muted fw-bold mb-3">No Active Bookings</h4>
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={() => navigate("/all-parkings")}
                    >
                      {/*<i className="fas fa-parking me-2"></i>*/}
                      Book a Parking Spot
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Parking Stats Cards */}
          <div className="row g-4 mb-5">
            <div className="col-xl-4 col-md-6">
              <div className="card card-hover border-0 shadow-sm shadow-md shadow-lg h-100" style={{borderLeft: '4px solid #7fcdbb'}}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="card-title text-muted text-uppercase small mb-2">Total Bookings</h6>
                      <h3 className="fw-bold text-primary mb-0">{totalBookings}</h3>
                      <small className="text-muted">All time bookings</small>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                        <i className="bi bi-calendar-check text-primary fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-4 col-md-6">
              <div className="card card-hover border-0 shadow-sm shadow-md shadow-lg  h-100" style={{borderLeft: '4px solid #edf8b1'}}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="card-title text-muted text-uppercase small mb-2">Active Bookings</h6>
                      <h3 className="fw-bold text-info mb-0">{activeBookings}</h3>
                      <small className="text-muted">Currently running</small>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="bg-info bg-opacity-10 rounded-circle p-3">
                        <i className="bi bi-car-front text-info fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-4 col-md-6">
              <div className="card card-hover border-0 shadow-sm shadow-md shadow-lg h-100" style={{borderLeft: '4px solid #f03b20'}}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="card-title text-muted text-uppercase small mb-2">Total Spent</h6>
                      <h3 className="fw-bold text-warning mb-0">BDT {totalSpent.toFixed(2)}</h3>
                      <small className="text-muted">Parking expenses</small>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="bg-warning bg-opacity-10 rounded-circle p-3">
                        <i className="bi bi-currency-dollar text-warning fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Service Section */}
      {activeSection === "service" && (
        <>
          {/* Active Service Orders */}
          {activeServiceOrdersList.length > 0 ? (
            <div className="row mb-5">
              <div className="col-12">
                <div className="card border-0 shadow-lg active-service-card">
                  <div className="card-header bg-transparent border-0 py-4">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <div>
                          <h4 className="mb-0 text-dark fw-bold">
                            Active Car Services
                            <span className="badge active-service-badge ms-2">{activeServiceOrdersList.length}</span>
                          </h4>
                        </div>
                      </div>
                      <div className="text-end">
                        <small className="text-success fw-semibold">
                          <i className="fas fa-car me-1"></i>
                          Service in Progress
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="active-service-thead">
                          <tr>
                            <th className="ps-4">
                              <i className="fas fa-concierge-bell me-2"></i>
                              Service Type
                            </th>
                            <th>
                              <i className="fas fa-clock me-2"></i>
                              Booking Time
                            </th>
                            <th className="text-center">
                              <i className="fas fa-money-bill-wave me-2"></i>
                              Price
                            </th>
                            <th>
                              <i className="fas fa-info-circle me-2"></i>
                              Status
                            </th>
                            <th>
                              <i className="fas fa-sticky-note me-2"></i>
                              Notes
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeServiceOrdersList.map((order) => (
                            <tr key={order.id} className="active-service-row">
                              <td className="ps-4">
                                <div>
                                  <strong className="text-dark">{order.service?.name}</strong>
                                  <br />
                                  <small className="text-muted">
                                    <i className="fas fa-tag me-1"></i>
                                    {order.service?.duration}
                                  </small>
                                </div>
                              </td>
                              <td>
                                <div className="booking-time">
                                  <strong>{formatDate(order.booking_time)}</strong>
                                </div>
                              </td>
                              <td className="text-center">
                                <div className="">
                                  <strong className="text-success">BDT {order.service?.price}</strong>
                                </div>
                              </td>
                              <td>
                                <span className={`badge service-status-badge ${
                                  order.status === 'pending' ? 'service-status-pending' : 
                                  order.status === 'in_progress' ? 'service-status-progress' : 
                                  'service-status-other'
                                }`}>
                                  <i className={`fas ${
                                    order.status === 'pending' ? 'fa-clock' : 
                                    order.status === 'in_progress' ? 'fa-spinner' : 
                                    'fa-info-circle'
                                  } me-1`}></i>
                                  {order.status === 'in_progress' ? 'In Progress' : order.status}
                                </span>
                              </td>
                              <td className="pe-4">
                                {order.notes ? (
                                  <small className="text-muted">{order.notes}</small>
                                ) : (
                                  <span className="text-muted">No notes</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="row mb-5">
              <div className="col-12">
                <div className="card border-0 shadow-sm no-active-bookings-card">
                  <div className="card-body text-center py-5">
                    <div className="no-booking-icon mb-4">
                      <i className="fab fa-slack"></i>
                    </div>
                    <h4 className="text-muted fw-bold mb-3">No Active Services</h4>
                    {/*<p className="text-muted mb-4">You don't have any active car service bookings at the moment.</p>*/}
                    <button
                      className="btn btn-success btn-lg"
                      onClick={() => navigate("/services")}
                    >
                      {/*<i className="fas fa-concierge-bell me-2"></i>*/}
                      Book a Car Service
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Service Stats Cards */}
          <div className="row g-4 mb-5">
            <div className="col-xl-4 col-md-6">
              <div className="card card-hover border-0 shadow-sm h-100" style={{borderLeft: '4px solid #7fcdbb'}}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="card-title text-muted text-uppercase small mb-2">Total Services</h6>
                      <h3 className="fw-bold text-success mb-0">{totalServiceOrders}</h3>
                      <small className="text-muted">All time services</small>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="bg-success bg-opacity-10 rounded-circle p-3">
                        <i className="fas fa-concierge-bell text-success fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-4 col-md-6">
              <div className="card card-hover border-0 shadow-sm h-100" style={{borderLeft: '4px solid #edf8b1'}}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="card-title text-muted text-uppercase small mb-2">Active Services</h6>
                      <h3 className="fw-bold text-warning mb-0">{activeServiceOrders}</h3>
                      <small className="text-muted">Currently running</small>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="bg-warning bg-opacity-10 rounded-circle p-3">
                        <i className="fas fa-spinner text-warning fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-4 col-md-6">
              <div className="card card-hover border-0 shadow-sm h-100" style={{borderLeft: '4px solid #f03b20'}}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <h6 className="card-title text-muted text-uppercase small mb-2">Completed</h6>
                      <h3 className="fw-bold text-info mb-0">{completedServiceOrders}</h3>
                      <small className="text-muted">Services completed</small>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="bg-info bg-opacity-10 rounded-circle p-3">
                        <i className="fas fa-check-circle text-info fs-4"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="row g-4">
        <div className="col-lg-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-0 px-4 pt-4 sticky-tab-header">
              <ul className="nav nav-pills nav-fill gap-2 p-1 small bg-light rounded-3">
                <li className="nav-item">
                  <button
                    className={`nav-link rounded-2 ${activeTab === "overview" ? "active bg-primary" : "text-dark"}`}
                    onClick={() => setActiveTab("overview")}
                  >
                    <i className="bi bi-speedometer2 me-2"></i>
                    Overview
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link rounded-2 ${activeTab === "bookings" ? "active bg-primary" : "text-dark"}`}
                    onClick={() => setActiveTab("bookings")}
                  >
                    <i className="bi bi-list-check me-2"></i>
                    My Bookings ({bookings.length + serviceOrders.length})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link rounded-2 ${activeTab === "profile" ? "active bg-primary" : "text-dark"}`}
                    onClick={() => setActiveTab("profile")}
                  >
                    <i className="bi bi-person me-2"></i>
                    Profile
                  </button>
                </li>
              </ul>
            </div>

            <div className="card-body p-4 scrollable-tab-content">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div>
                  <h5 className="fw-bold mb-4">Recent Activity</h5>
                  {(bookings.length > 0 || serviceOrders.length > 0) ? (
                    <div className="space-y-3">
                      {[...bookings, ...serviceOrders.map(order => ({
                        ...order,
                        type: 'service',
                        created_at: order.created_at
                      }))]
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .slice(0, 5)
                        .map((item) => (
                        <div key={item.id} className="card card-hover border">
                          <div className="card-body py-3">
                            <div className="row align-items-center">
                              <div className="col-md-6">
                                <h6 className="fw-bold mb-1">
                                  {item.type === 'service' ? item.service?.name : item.parking?.name}
                                  {item.type === 'service' && (
                                    <span className="badge bg-success ms-2">Service</span>
                                  )}
                                </h6>
                                <p className="text-muted mb-0 small">
                                  {item.type === 'service' ? (
                                    <>
                                      <i className="fas fa-clock me-1"></i>
                                      {formatDate(item.booking_time)}
                                    </>
                                  ) : (
                                    <>
                                      <i className="bi bi-geo-alt me-1"></i>
                                      Slot {item.slot?.slot_code} • {item.hours} hour{item.hours > 1 ? 's' : ''}
                                    </>
                                  )}
                                </p>
                                <span className={`badge ${
                                  item.status === 'confirmed' || item.status === 'pending' ? 'bg-warning' : 
                                  item.status === 'in_progress' ? 'bg-info' : 
                                  item.status === 'completed' ? 'bg-success' : 
                                  'bg-secondary'
                                }`}>
                                  {item.status === 'checkout_requested' ? 'Waiting Approval' : 
                                   item.status === 'checkout_paid' ? 'Waiting Approval' : 
                                   item.status === 'in_progress' ? 'In Progress' :
                                   item.status}
                                </span>
                              </div>
                              <div className="col-md-3 text-center">
                                <span className="badge bg-success rounded-pill">
                                  BDT {item.type === 'service' ? item.service?.price : item.total_price}
                                </span>
                              </div>
                              <div className="col-md-3 text-end">
                                <small className="text-muted">
                                  {formatDate(item.created_at)}
                                </small>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '80px', height: '80px'}}>
                        <i className="bi bi-calendar-x text-muted fs-2"></i>
                      </div>
                      <h5 className="text-muted mb-2">No bookings yet</h5>
                      <p className="text-muted mb-3">Start by booking your first parking spot or car service</p>
                      <div className="d-flex gap-3 justify-content-center">
                        <button
                          className="btn btn-primary"
                          onClick={() => navigate("/all-parkings")}
                        >
                          <i className="bi bi-p-square me-2"></i>
                          Book Parking
                        </button>
                        <button
                          className="btn btn-success"
                          onClick={() => navigate("/services")}
                        >
                          <i className="fas fa-car-wash me-2"></i>
                          Book Service
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bookings Tab */}
              {activeTab === "bookings" && (
                <div>
                  <h5 className="fw-bold mb-4">All Bookings History</h5>
                  {(completedBookings.length > 0 || completedServiceOrdersList.length > 0) ? (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Type</th>
                            <th>Details</th>
                            <th>Duration/Time</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Parking Bookings */}
                          {completedBookings.map((booking) => (
                            <tr key={`parking-${booking.id}`}>
                              <td>
                                <span className="badge bg-primary">
                                  <i className="fas fa-parking me-1"></i>
                                  Parking
                                </span>
                              </td>
                              <td>
                                <div>
                                  <strong>{booking.parking?.name}</strong>
                                  <br />
                                  <small className="text-muted">
                                    Slot {booking.slot?.slot_code} • {booking.parking?.distance}
                                  </small>
                                </div>
                              </td>
                              <td>{booking.hours} hour{booking.hours > 1 ? 's' : ''}</td>
                              <td>
                                <strong className="text-success">BDT {booking.grand_total}</strong>
                                {booking.extra_charges > 0 && (
                                  <div>
                                    <small className="text-warning">
                                      +BDT {booking.extra_charges} extra
                                    </small>
                                  </div>
                                )}
                              </td>
                              <td>
                                <small>{formatDate(booking.created_at)}</small>
                              </td>
                              <td>
                                <span className={`badge ${
                                  booking.status === 'completed' ? 'bg-success' : 'bg-secondary'
                                }`}>
                                  {booking.status}
                                </span>
                              </td>
                              <td>
                                {booking.ticket_number && (
                                  <div className="d-flex gap-2 align-items-center">
                                    <button
                                      className="btn btn-primary btn-sm"
                                      onClick={() => handleViewTicket(booking)}
                                      disabled={actionLoading === booking.id}
                                    >
                                      {actionLoading === booking.id ? (
                                        <span className="spinner-border spinner-border-sm" />
                                      ) : (
                                        <i className="fas fa-eye me-1"></i>
                                      )}
                                      View
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                          
                          {/* Service Orders */}
                          {completedServiceOrdersList.map((order) => (
                            <tr key={`service-${order.id}`}>
                              <td>
                                <span className="badge bg-success">
                                  <i className="fas fa-car-wash me-1"></i>
                                  Service
                                </span>
                              </td>
                              <td>
                                <div>
                                  <strong>{order.service?.name}</strong>
                                  <br />
                                  <small className="text-muted">
                                    {order.service?.description}
                                  </small>
                                </div>
                              </td>
                              <td>
                                <small>{formatDate(order.booking_time)}</small>
                                <br />
                                <small className="text-muted">{order.service?.duration}</small>
                              </td>
                              <td>
                                <strong className="text-success">BDT {order.service?.price}</strong>
                              </td>
                              <td>
                                <small>{formatDate(order.created_at)}</small>
                              </td>
                              <td>
                                <span className={`badge ${
                                  order.status === 'completed' ? 'bg-success' : 
                                  order.status === 'cancelled' ? 'bg-danger' : 'bg-secondary'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td>
                                {order.notes && (
                                  <button
                                    className="btn btn-outline-info btn-sm"
                                    title={order.notes}
                                    onClick={() => {
                                      Swal.fire({
                                        title: 'Service Notes',
                                        text: order.notes,
                                        icon: 'info'
                                      });
                                    }}
                                  >
                                    <i className="fas fa-sticky-note"></i>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-muted">No booking history</p>
                    </div>
                  )}
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div>
                  <h5 className="fw-bold mb-4">Profile Information</h5>
                  <div className="row g-4">
                    <div className="col-md-6">
                      <div className="card border-0 bg-light">
                        <div className="card-body">
                          <h6 className="fw-bold mb-3">
                            <i className="bi bi-person-circle me-2"></i>
                            Personal Info
                          </h6>
                          <div className="space-y-2">
                            <div>
                              <small className="text-muted">Full Name</small>
                              <p className="fw-semibold mb-0">{user.name}</p>
                            </div>
                            <div>
                              <small className="text-muted">Email Address</small>
                              <p className="fw-semibold mb-0">{user.email}</p>
                            </div>
                            <div>
                              <small className="text-muted">Member Since</small>
                              <p className="fw-semibold mb-0">{formatDate(user.created_at)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card border-0 bg-light">
                        <div className="card-body">
                          <h6 className="fw-bold mb-3">
                            <i className="bi bi-graph-up me-2"></i>
                            Activity Summary
                          </h6>
                          <div className="space-y-2">
                            <div>
                              <small className="text-muted">Total Parking Bookings</small>
                              <p className="fw-semibold mb-0">{totalBookings}</p>
                            </div>
                            <div>
                              <small className="text-muted">Total Car Services</small>
                              <p className="fw-semibold mb-0">{totalServiceOrders}</p>
                            </div>
                            <div>
                              <small className="text-muted">Total Amount Spent</small>
                              <p className="fw-semibold mb-0 text-success">
                                BDT {(totalSpent + serviceOrders.reduce((sum, order) => sum + parseFloat(order.service?.price || 0), 0)).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      {showTicketModal && selectedTicket && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">
                  <i className="fas fa-ticket-alt text-primary me-2"></i>
                  Parking Ticket - MONARK
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowTicketModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="ticket-container border rounded p-4">
                  <div className="ticket-header text-center mb-4">
                    <div className="ticket-number bg-primary text-white rounded-pill py-1 px-3 d-inline-block">
                      <strong>{selectedTicket.ticket_number}</strong>
                    </div>
                    <div className="status-badge bg-success text-white rounded-pill py-1 px-3 d-inline-block mx-2">
                      COMPLETED
                    </div>
                  </div>

                  <div className="barcode-section text-center mb-4 py-3 bg-light rounded">
                    <div className="barcode-text font-monospace" style={{letterSpacing: '2px', fontSize: '18px'}}>
                      ***{selectedTicket.ticket_number}***
                    </div>
                    <small className="text-muted">Scan this barcode for verification</small>
                  </div>

                  <div className="ticket-details">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="detail-item mb-3">
                          <strong className="text-muted">User Name:</strong> 
                          <div className="fw-bold">{user.name}</div>
                        </div>
                        <div className="detail-item mb-3">
                          <strong className="text-muted">Parking Location:</strong>
                          <div className="fw-bold">{selectedTicket.parking?.name}</div>
                        </div>
                        <div className="detail-item mb-3">
                          <strong className="text-muted">Slot Number:</strong>
                          <div className="badge bg-secondary fs-6 mx-2">{selectedTicket.slot?.slot_code}</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="detail-item mb-3">
                          <strong className="text-muted">Duration:</strong>
                          <div className="fw-bold">{selectedTicket.hours} hour(s)</div>
                        </div>
                        <div className="detail-item mb-3">
                          <strong className="text-muted">Check-in Time:</strong>
                          <div className="fw-bold">{formatDate(selectedTicket.created_at)}</div>
                        </div>
                        <div className="detail-item mb-3">
                          <strong className="text-muted">Check-out Time:</strong>
                          <div className="fw-bold">{formatDate(selectedTicket.actual_end_time)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="charges-section border-top pt-3 mt-3">
                      <div className="row">
                        <div className="col-6">
                          <strong className="text-muted">Base Amount:</strong>
                        </div>
                        <div className="col-6 text-end">
                          <strong>BDT {selectedTicket.total_price}</strong>
                        </div>
                      </div>
                      {selectedTicket.extra_charges > 0 && (
                        <div className="row">
                          <div className="col-6">
                            <strong className="text-muted">Extra Charges:</strong>
                          </div>
                          <div className="col-6 text-end">
                            <strong className="text-warning">+ BDT {selectedTicket.extra_charges}</strong>
                          </div>
                        </div>
                      )}
                      <div className="row border-top pt-2 mt-2">
                        <div className="col-6">
                          <strong className="text-primary">Total Amount:</strong>
                        </div>
                        <div className="col-6 text-end">
                          <strong className="text-primary fs-5">
                            BDT {(parseFloat(selectedTicket.total_price) + parseFloat(selectedTicket.extra_charges || 0)).toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ticket-footer text-center mt-4 pt-3 border-top">
                    <p className="text-muted mb-2">
                      <small>Thank you for using our parking service!</small>
                    </p>
                    <p className="text-muted">
                      <small>Generated on: {formatDate(selectedTicket.actual_end_time)}</small>
                    </p>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowTicketModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleDownloadTicket(selectedTicket)}
                >
                  <i className="fas fa-download me-2"></i>
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}