import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Register from "./components/Register";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import ManagerLayout from "./layouts/ManagerLayout";
import ManagerDashboard from "./components/ManagerDashboard";
import AboutUs from './components/About';
import ContactUs from './components/Contact';
import Topup from './components/Topup';
import VerifyTransaction from './components/VerifyTransaction';

import { AuthProvider, AuthContext } from "./contexts/AuthContext";
import ParkingDetail from "./components/ParkingDetail";
import Services from "./components/Services";
import MyServices from "./components/MyServices";
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import UserProfile from './components/UserProfile';



// Admin Components
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./components/AdminDashboard";
import AdminParkings from './pages/admin/AdminParkings';
import AdminSlots from './pages/admin/AdminSlots';
import AdminBookings from './pages/admin/AdminBookings';
import AdminUsers from './pages/admin/AdminUsers';
import AdminWallet from './pages/admin/AdminWallet';
import AdminReports from './pages/admin/AdminReports';
import AllParkings from './components/AllParkings';
import Checkouts from './pages/admin/Checkouts';
import WalletTransactions from './pages/admin/WalletTransactions';
import AdminServiceOrders from './pages/admin/AdminServiceOrders';
import AdminServices from './pages/admin/AdminService';
import Profile from './pages/admin/Profile';
import Contacts from './pages/admin/Contacts';
import Messages from './pages/admin/Messages';
import ServiceCenters from './pages/admin/ServiceCenters';


import MechanicDashboard from './components/MechanicDashboard';

// Simple reusable Spinner component
function Spinner() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
    </div>
  );
}

// Navbar visibility check component
function NavbarWrapper() {
  const location = useLocation();
  const hideNavbarPaths = ["/admin", "/manager",  "/login", "/register", "/topup", "/verify-transaction"];

  const shouldShowNavbar = !hideNavbarPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  return shouldShowNavbar ? <Navbar /> : null;
}

function FooterWrapper() {
  const location = useLocation();
  const hideFooterPaths = ["/admin", "/manager",  "/login", "/register" , "/topup", "/verify-transaction"];

  const shouldShowFooter = !hideFooterPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  return shouldShowFooter ? <Footer /> : null;
}

function AppRoutes() {
  const { user, loading } = useContext(AuthContext);

  // show spinner until auth state is ready
  if (loading) {
    return <Spinner />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/all-parkings" element={<AllParkings />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/contact" element={<ContactUs />} />

      <Route path="/topup" element={<Topup />} />
      <Route path="/verify-transaction" element={<VerifyTransaction />} />
      <Route path="/services" element={<Services />} />
      <Route path="/my-services" element={<MyServices />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/user-profile" element={<UserProfile />} />
      
      {/* User Dashboard - only for regular users */}
      <Route
        path="/dashboard"
        element={
          user?.role === "user" ? <Dashboard /> : <Navigate to="/" />
        }
      />
      
      <Route
        path="/manager"
        element={
          user?.role === "manager" ? (
            <ManagerDashboard />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route path="/parking/:id" element={<ParkingDetail />} />

      {/* Admin nested route */}
      <Route
        path="/admin"
        element={
          user?.role === "admin" ? <AdminLayout /> : <Navigate to="/" />
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="parkings" element={<AdminParkings />} />
        <Route path="slots" element={<AdminSlots />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="wallet" element={<AdminWallet />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="checkouts" element={<Checkouts />} />
        <Route path="wallet-transactions" element={<WalletTransactions />} />
        <Route path="service-orders" element={<AdminServiceOrders />} />
        <Route path="/admin/services" element={<AdminServices />} />
        <Route path="profile" element={<Profile />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="messages" element={<Messages />} />
        <Route path="/admin/service-centers" element={<ServiceCenters />} />
      </Route>

      {/* Mechanic Route - Separate from admin */}
      <Route
        path="/mechanic/dashboard"
        element={
          user?.role === "mechanic" ? <MechanicDashboard /> : <Navigate to="/" />
        }
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}


export default function App() {
  return (
    <AuthProvider>
      <Router>
        <NavbarWrapper />
        <AppRoutes />
        <FooterWrapper />
      </Router>
    </AuthProvider>
  );
}