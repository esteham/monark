// src/components/AdminHeader.jsx
import React, { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../api/client";

export default function AdminHeader() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) await logoutUser();

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("sidebarOpen");
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("sidebarOpen");
      setUser(null);
      navigate("/login");
    }
  };

  const handleVisitSite = () => {
    window.open("/", "_blank");
  };

  const handleProfileClick = () => {
    navigate("/admin/profile"); // Absolute path ব্যবহার করুন
    setDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <header className="bg-white shadow-sm border-bottom" style={{ height: '70px', flexShrink: 0 }}>
      <div className="d-flex justify-content-between align-items-center h-100 px-4">
        {/* Left Side - Brand/Title */}
        <div className="d-flex align-items-center">
          <h4 className="mb-0 text-primary fw-bold"></h4>
        </div>
        
        {/* Right Side - Actions */}
        <div className="d-flex align-items-center gap-3">
          {/* Visit Site Button */}
          <button 
            className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
            onClick={handleVisitSite}
            style={{ 
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.875rem'
            }}
          >
            <i className="fa-solid fa-house"></i>
            <span>Visit Site</span>
          </button>

          {/* User Profile Dropdown - Custom */}
          <div className="position-relative" ref={dropdownRef}>
            <button 
              className="btn btn-light d-flex align-items-center gap-2 border-0"
              onClick={toggleDropdown}
              style={{ 
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.05)',
                padding: '8px 12px'
              }}
            >
              <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center" 
                   style={{width: '32px', height: '32px'}}>
                <span className="text-white fw-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </span>
              </div>
              <span>{user?.name || 'Admin'}</span>
              <i className={`fas fa-chevron-${dropdownOpen ? 'up' : 'down'}`} style={{ fontSize: '0.8rem' }}></i>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div 
                className="bg-white shadow-lg border rounded-3 p-2"
                style={{ 
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  zIndex: 1000,
                  minWidth: '200px',
                  marginTop: '8px'
                }}
              >
                <button 
                  className="btn btn-light w-100 text-start d-flex align-items-center gap-2 py-2 px-3 mb-1 rounded-2 border-0"
                  onClick={handleProfileClick}
                >
                  <i className="fas fa-user text-muted" style={{ width: '20px' }}></i>
                  <span>Profile</span>
                </button>
                
                {/*<button className="btn btn-light w-100 text-start d-flex align-items-center gap-2 py-2 px-3 mb-1 rounded-2 border-0">
                                  <i className="fas fa-cog text-muted" style={{ width: '20px' }}></i>
                                  <span>Settings</span>
                                </button>*/}
                
                <hr className="my-2" />
                
                <button 
                  className="btn btn-light w-100 text-start d-flex align-items-center gap-2 py-2 px-3 rounded-2 border-0 text-danger"
                  onClick={handleLogout}
                >
                  <i className="fas fa-sign-out-alt" style={{ width: '20px' }}></i>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}