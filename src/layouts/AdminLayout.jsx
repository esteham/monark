// src/layouts/AdminLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import AdminHeader from "../pages/admin/AdminHeader";
import AdminFooter from "../pages/admin/AdminFooter";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  // Sidebar state preserve korbe even route change holeo
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarOpen");
    if (savedState !== null) {
      setSidebarOpen(JSON.parse(savedState));
    }
  }, []);

  // Sidebar state change hole save kora
  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="d-flex vh-100 bg-light">
      {/* Sidebar with fixed width management */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main content area - FULL SCROLLABLE */}
      <div 
        className="flex-grow-1 d-flex flex-column" 
        style={{ 
          marginLeft: sidebarOpen ? "280px" : "80px",
          transition: "margin-left 0.3s ease",
          backgroundColor: '#f8f9fa',
          height: '100vh',
          overflowY: 'auto' // Ei container tai scroll hobe
        }}
      >
        {/* Header - Scroll with page */}
        <AdminHeader />
        
        {/* Main Content - Grow and take available space */}
        <div className="flex-grow-1 p-4">
          <Outlet />
        </div>
        
        {/* Footer - Scroll with page */}
        <AdminFooter />
      </div>
    </div>
  );
}