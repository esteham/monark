import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar({ isOpen, onToggle }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [parkingDropdownOpen, setParkingDropdownOpen] = useState(false);
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);

  if (!user || user.role !== "admin") {
    return null;
  }

  // Active state checker
  const isActive = (path) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  // Check if any wallet route is active
  const isWalletActive = () => {
    return location.pathname.startsWith("/admin/wallet") && 
           !location.pathname.startsWith("/admin/wallet-transactions");
  };

  const isWalletTransactionsActive = () => {
    return location.pathname.startsWith("/admin/wallet-transactions");
  };

  // Check if any parking route is active
  const isParkingActive = () => {
    return location.pathname.startsWith("/admin/parkings") || 
           location.pathname.startsWith("/admin/slots") ||
           location.pathname.startsWith("/admin/bookings");
  };

  // Check if any service route is active
  const isServiceActive = () => {
    return location.pathname.startsWith("/admin/service-orders") || 
           location.pathname.startsWith("/admin/services") ||
           location.pathname.startsWith("/admin/service-centers");
  };

  // Auto-open dropdown when route matches
  useEffect(() => {
    if (isWalletActive() || isWalletTransactionsActive()) {
      setWalletDropdownOpen(true);
    }
    if (isParkingActive()) {
      setParkingDropdownOpen(true);
    }
    if (isServiceActive()) {
      setServiceDropdownOpen(true);
    }
  }, [location.pathname]);

  // Toggle dropdown functions
  const toggleWalletDropdown = (e) => {
    e.stopPropagation();
    setWalletDropdownOpen(!walletDropdownOpen);
  };

  const toggleParkingDropdown = (e) => {
    e.stopPropagation();
    setParkingDropdownOpen(!parkingDropdownOpen);
  };

  const toggleServiceDropdown = (e) => {
    e.stopPropagation();
    setServiceDropdownOpen(!serviceDropdownOpen);
  };

  // Custom scrollbar and dropdown styles
  const webkitScrollbarStyles = `
    .sidebar-scrollable::-webkit-scrollbar {
      width: 6px;
    }
    .sidebar-scrollable::-webkit-scrollbar-track {
      background: #343a40;
      border-radius: 3px;
    }
    .sidebar-scrollable::-webkit-scrollbar-thumb {
      background: #4a5568;
      border-radius: 3px;
    }
    .sidebar-scrollable::-webkit-scrollbar-thumb:hover {
      background: #2d3748;
    }
    
    /* Modern Dropdown Styles */
    .wallet-dropdown, .parking-dropdown, .service-dropdown {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }
    
    .wallet-dropdown.open, .parking-dropdown.open, .service-dropdown.open {
      max-height: 300px;
      opacity: 1;
      transform: translateY(0);
    }
    
    .wallet-dropdown.closed, .parking-dropdown.closed, .service-dropdown.closed {
      max-height: 0;
      opacity: 0;
      transform: translateY(-10px);
    }
    
    .dropdown-arrow {
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .dropdown-arrow.open {
      transform: rotate(180deg);
    }
    
    .nav-item .nav-link {
      transition: all 0.2s ease-in-out;
      border: 1px solid transparent;
    }
    
    .nav-item .nav-link:hover {
      background-color: rgba(255, 255, 255, 0.1) !important;
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateX(5px);
    }
    
    .nav-item .nav-link.active {
      background: rgba(255, 255, 255, 0.4) !important;
      border-color: rgba(255, 255, 255, 0.3);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }
    
    .dropdown-item {
      transition: all 0.2s ease-in-out;
      margin: 2px 0;
      border-radius: 6px;
    }
    
    .dropdown-item:hover {
      background-color: rgba(255, 255, 255, 0.1) !important;
      transform: translateX(8px);
    }
    
    .dropdown-item.active {
      background: rgba(255, 255, 255, 0.1) !important;
      box-shadow: 0 2px 8px rgba(79, 172, 254, 0.3);
    }
    
    /* Sidebar background gradient */
    .sidebar-gradient {
      background: linear-gradient(135deg, #1a202c 0%, #2d3748 50%, #4a5568 100%);
    }
    
    /* Smooth sidebar transition */
    .sidebar-transition {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `;

  const scrollbarStyles = {
    scrollbarWidth: 'thin',
    scrollbarColor: '#4a5568 #343a40',
  };

  return (
    <div
      className="d-flex flex-column sidebar-gradient"
      style={{ 
        width: isOpen ? "280px" : "80px",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        overflow: "hidden",
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 1000,
        boxShadow: "4px 0 20px rgba(0, 0, 0, 0.3)"
      }}
    >
      {/* Add custom scrollbar styles */}
      <style>{webkitScrollbarStyles}</style>

      {/* Header with Toggle Button */}
      <div className="p-4 border-bottom border-gray-700" style={{ height: '70px', flexShrink: 0, background: 'rgba(26, 32, 44, 0.95)' }}>
        <div className="d-flex align-items-center justify-content-between w-100">
          {isOpen && (
            <div className="d-flex align-items-center">
              <div>
                <span className="fs-5 fw-bold text-white">Admin Panel</span>
              </div>
            </div>
          )}
          <button 
            className="btn btn-outline-light btn-sm border-0"
            onClick={onToggle}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              padding: 0,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            <i className="fa-solid fa-bars"></i>
          </button>
        </div>
      </div>

      {/* Scrollable Navigation Area */}
      <div 
        className="flex-grow-1 d-flex flex-column sidebar-scrollable"
        style={{ 
          overflowY: 'auto',
          overflowX: 'hidden',
          ...scrollbarStyles,
          padding: '1rem 0'
        }}
      >
        {/* Navigation Menu */}
        <ul className="nav nav-pills flex-column px-3 pb-3" style={{ flex: 1, gap: '0.5rem' }}>
          {/* Dashboard */}
          <li className="nav-item">
            <Link
              to="/admin"
              className={`nav-link d-flex align-items-center py-3 px-3 ${isActive("/admin") ? 'active' : 'text-white'}`}
              title="Dashboard"
              style={{ borderRadius: '', border: '1px solid transparent' }}
            >
              <i className="fas fa-tachometer-alt fs-5"></i>
              {isOpen && <span className="ms-3 fw-medium">Dashboard</span>}
            </Link>
          </li>

          {/* Parking Management Dropdown Menu */}
          <li className="nav-item">
            <div className={`nav-link d-flex align-items-center py-3 px-3 ${
              isParkingActive() ? 'active' : 'text-white'
            }`}
                 style={{ 
                   borderRadius: '', 
                   cursor: 'pointer',
                   border: '1px solid transparent',
                   position: 'relative',
                   background: isParkingActive() ? 
                     'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent'
                 }}
                 onClick={toggleParkingDropdown}>
              
              {/* Parking Icon with Badge */}
              <div className="position-relative">
                <i className="fas fa-square-parking fs-5"></i>
                {isParkingActive() && (
                  <div className="position-absolute top-0 start-100 translate-middle p-1 bg-success border border-light rounded-circle">
                    <span className="visually-hidden">Active</span>
                  </div>
                )}
              </div>
              
              {isOpen && (
                <>
                  <span className="ms-3 fw-medium flex-grow-1">Parking</span>
                  <i className={`fas fa-chevron-down dropdown-arrow ${parkingDropdownOpen ? 'open' : ''}`} 
                     style={{ 
                       fontSize: '0.8rem',
                       transition: 'transform 0.3s ease'
                     }}></i>
                </>
              )}
            </div>

            {/* Parking Dropdown Items */}
            {isOpen && (
              <div className={`parking-dropdown ${parkingDropdownOpen ? 'open' : 'closed'}`}
                   style={{ 
                     paddingLeft: '1rem',
                     paddingRight: '1rem'
                   }}>
                
                {/* Parking Lots Item */}
                <Link
                  to="/admin/parkings"
                  className={`dropdown-item d-flex align-items-center py-2 px-3 my-2 ${
                    isActive("/admin/parkings") ? 'active text-white' : 'text-gray-300'
                  }`}
                  title="Parking Lots"
                  style={{ 
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    textDecoration: 'none'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="d-flex align-items-center w-100">
                    <div className="flex-grow-1">
                      <div className="fw-medium text-light px-3">Parking Lots</div>
                    </div>
                    {isActive("/admin/parkings") && (
                      <div className="bg-white rounded-circle" style={{ width: '6px', height: '6px' }}></div>
                    )}
                  </div>
                </Link>

                {/* Parking Slots Item */}
                <Link
                  to="/admin/slots"
                  className={`dropdown-item d-flex align-items-center py-2 px-3 ${
                    isActive("/admin/slots") ? 'active text-white' : 'text-gray-300'
                  }`}
                  title="Parking Slots"
                  style={{ 
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    textDecoration: 'none'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="d-flex align-items-center w-100">
                    <div className="flex-grow-1">
                      <div className="fw-medium text-light px-3">Parking Slots</div>
                    </div>
                    {isActive("/admin/slots") && (
                      <div className="bg-white rounded-circle" style={{ width: '6px', height: '6px' }}></div>
                    )}
                  </div>
                </Link>

                {/* Bookings Item */}
                <Link
                  to="/admin/bookings"
                  className={`dropdown-item d-flex align-items-center py-2 px-3 ${
                    isActive("/admin/bookings") ? 'active text-white' : 'text-gray-300'
                  }`}
                  title="Bookings"
                  style={{ 
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    textDecoration: 'none'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="d-flex align-items-center w-100">
                    <div className="flex-grow-1">
                      <div className="fw-medium text-light px-3">Bookings</div>
                    </div>
                    {isActive("/admin/bookings") && (
                      <div className="bg-white rounded-circle" style={{ width: '6px', height: '6px' }}></div>
                    )}
                  </div>
                </Link>
              </div>
            )}
          </li>

          {/* Service Management Dropdown Menu */}
          <li className="nav-item">
            <div className={`nav-link d-flex align-items-center py-3 px-3 ${
              isServiceActive() ? 'active' : 'text-white'
            }`}
                 style={{ 
                   borderRadius: '', 
                   cursor: 'pointer',
                   border: '1px solid transparent',
                   position: 'relative',
                   background: isServiceActive() ? 
                     'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent'
                 }}
                 onClick={toggleServiceDropdown}>
              
              {/* Service Icon with Badge */}
              <div className="position-relative">
                <i className="fa-solid fa-wrench"></i>
                {isServiceActive() && (
                  <div className="position-absolute top-0 start-100 translate-middle p-1 bg-success border border-light rounded-circle">
                    <span className="visually-hidden">Active</span>
                  </div>
                )}
              </div>
              
              {isOpen && (
                <>
                  <span className="ms-3 fw-medium flex-grow-1">Car Services</span>
                  <i className={`fas fa-chevron-down dropdown-arrow ${serviceDropdownOpen ? 'open' : ''}`} 
                     style={{ 
                       fontSize: '0.8rem',
                       transition: 'transform 0.3s ease'
                     }}></i>
                </>
              )}
            </div>

            {/* Service Dropdown Items */}
            {isOpen && (
              <div className={`service-dropdown ${serviceDropdownOpen ? 'open' : 'closed'}`}
                   style={{ 
                     paddingLeft: '1rem',
                     paddingRight: '1rem'
                   }}>
                
                {/* Service Orders Item */}
                <Link
                  to="/admin/service-orders"
                  className={`dropdown-item d-flex align-items-center py-2 px-3 my-2 ${
                    isActive("/admin/service-orders") ? 'active text-white' : 'text-gray-300'
                  }`}
                  title="Service Orders"
                  style={{ 
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    textDecoration: 'none'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="d-flex align-items-center w-100">
                    <div className="flex-grow-1">
                      <div className="fw-medium text-light px-3">Orders</div>
                    </div>
                    {isActive("/admin/service-orders") && (
                      <div className="bg-white rounded-circle" style={{ width: '6px', height: '6px' }}></div>
                    )}
                  </div>
                </Link>

                {/* Services Management Item */}
                <Link
                  to="/admin/services"
                  className={`dropdown-item d-flex align-items-center py-2 px-3 ${
                    isActive("/admin/services") ? 'active text-white' : 'text-gray-300'
                  }`}
                  title="Services Management"
                  style={{ 
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    textDecoration: 'none'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="d-flex align-items-center w-100">
                    <div className="flex-grow-1">
                      <div className="fw-medium text-light px-3">Services</div>
                    </div>
                    {isActive("/admin/services") && (
                      <div className="bg-white rounded-circle" style={{ width: '6px', height: '6px' }}></div>
                    )}
                  </div>
                </Link>

                {/* Service Centers Item */}
                <Link
                  to="/admin/service-centers"
                  className={`dropdown-item d-flex align-items-center py-2 px-3 ${
                    isActive("/admin/service-centers") ? 'active text-white' : 'text-gray-300'
                  }`}
                  title="Service Centers"
                  style={{ 
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    textDecoration: 'none'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="d-flex align-items-center w-100">
                    <div className="flex-grow-1">
                      <div className="fw-medium text-light px-3">Service Centers</div>
                    </div>
                    {isActive("/admin/service-centers") && (
                      <div className="bg-white rounded-circle" style={{ width: '6px', height: '6px' }}></div>
                    )}
                  </div>
                </Link>
              </div>
            )}
          </li>

          {/* Users */}
          <li className="nav-item">
            <Link
              to="/admin/users"
              className={`nav-link d-flex align-items-center py-3 px-3 ${isActive("/admin/users") ? 'active' : 'text-white'}`}
              title="Users"
              style={{ borderRadius: '', border: '1px solid transparent' }}
            >
              <i className="fas fa-users fs-5"></i>
              {isOpen && <span className="ms-3 fw-medium">Users</span>}
            </Link>
          </li>

          {/* Checkouts */}
          <li className="nav-item">
            <Link
              to="/admin/checkouts"
              className={`nav-link d-flex align-items-center py-3 px-3 ${isActive("/admin/checkouts") ? 'active' : 'text-white'}`}
              title="Checkout Requests"
              style={{ borderRadius: '', border: '1px solid transparent' }}
            >
              <i className="fas fa-sign-out-alt fs-5"></i>
              {isOpen && <span className="ms-3 fw-medium">Checkouts</span>}
            </Link>
          </li>

          {/* Wallet Dropdown Menu */}
          <li className="nav-item">
            <div className={`nav-link d-flex align-items-center py-3 px-3 ${
              (isWalletActive() || isWalletTransactionsActive()) ? 'active' : 'text-white'
            }`}
                 style={{ 
                   borderRadius: '', 
                   cursor: 'pointer',
                   border: '1px solid transparent',
                   position: 'relative',
                   background: (isWalletActive() || isWalletTransactionsActive()) ? 
                     'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent'
                 }}
                 onClick={toggleWalletDropdown}>
              
              {/* Wallet Icon with Badge */}
              <div className="position-relative">
                <i className="fas fa-wallet fs-5"></i>
                {(isWalletActive() || isWalletTransactionsActive()) && (
                  <div className="position-absolute top-0 start-100 translate-middle p-1 bg-success border border-light rounded-circle">
                    <span className="visually-hidden">Active</span>
                  </div>
                )}
              </div>
              
              {isOpen && (
                <>
                  <span className="ms-3 fw-medium flex-grow-1">Wallet</span>
                  <i className={`fas fa-chevron-down dropdown-arrow ${walletDropdownOpen ? 'open' : ''}`} 
                     style={{ 
                       fontSize: '0.8rem',
                       transition: 'transform 0.3s ease'
                     }}></i>
                </>
              )}
            </div>

            {/* Wallet Dropdown Items */}
            {isOpen && (
              <div className={`wallet-dropdown ${walletDropdownOpen ? 'open' : 'closed'}`}
                   style={{ 
                     paddingLeft: '1rem',
                     paddingRight: '1rem'
                   }}>
                
                {/* Overview Item */}
                <Link
                  to="/admin/wallet"
                  className={`dropdown-item d-flex align-items-center py-2 px-3 my-2 ${
                    isWalletActive() ? 'active text-white' : 'text-gray-300'
                  }`}
                  title="Wallet Overview"
                  style={{ 
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    textDecoration: 'none'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="d-flex align-items-center w-100">
                    <div className="flex-grow-1">
                      <div className="fw-medium text-light px-3">Overview</div>
                    </div>
                    {isWalletActive() && (
                      <div className="bg-white rounded-circle" style={{ width: '6px', height: '6px' }}></div>
                    )}
                  </div>
                </Link>

                {/* Transactions Item */}
                <Link
                  to="/admin/wallet-transactions"
                  className={`dropdown-item d-flex align-items-center py-2 px-3 ${
                    isWalletTransactionsActive() ? 'active text-white' : 'text-gray-300'
                  }`}
                  title="Wallet Transactions"
                  style={{ 
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    textDecoration: 'none'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="d-flex align-items-center w-100">
                    <div className="flex-grow-1">
                      <div className="fw-medium text-light px-3">Transactions</div>
                    </div>
                    {isWalletTransactionsActive() && (
                      <div className="bg-white rounded-circle" style={{ width: '6px', height: '6px' }}></div>
                    )}
                  </div>
                </Link>
              </div>
            )}
          </li>

          {/* Reports */}
          <li className="nav-item">
            <Link
              to="/admin/reports"
              className={`nav-link d-flex align-items-center py-3 px-3 ${isActive("/admin/reports") ? 'active' : 'text-white'}`}
              title="Reports & Analytics"
              style={{ borderRadius: '', border: '1px solid transparent' }}
            >
              <i className="fas fa-chart-bar fs-5"></i>
              {isOpen && <span className="ms-3 fw-medium">Reports</span>}
            </Link>
          </li>

          {/* Messages */}
          <li className="nav-item">
            <Link
              to="/admin/messages"
              className={`nav-link d-flex align-items-center py-3 px-3 ${isActive("/admin/messages") ? 'active' : 'text-white'}`}
              title="Messages"
              style={{ borderRadius: '', border: '1px solid transparent' }}
            >
              <i className="fas fa-envelope fs-5"></i>
              {isOpen && <span className="ms-3 fw-medium">Messages</span>}
            </Link>
          </li>

          {/* Contacts */}
          <li className="nav-item">
            <Link
              to="/admin/contacts"
              className={`nav-link d-flex align-items-center py-3 px-3 ${isActive("/admin/contacts") ? 'active' : 'text-white'}`}
              title="Contacts"
              style={{ borderRadius: '', border: '1px solid transparent' }}
            >
              <i className="fas fa-address-book fs-5"></i>
              {isOpen && <span className="ms-3 fw-medium">About</span>}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}