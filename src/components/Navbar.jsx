import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { logoutUser } from "../api/client";
import "./css/Navbar.css";

export default function Navbar() {
    const { user, setUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [contactInfo, setContactInfo] = useState(null);

    useEffect(() => {
        // Fetch contact info from backend
        fetch("http://127.0.0.1:8000/api/contact-info")
            .then(res => res.json())
            .then(data => setContactInfo(data))
            .catch(err => console.error("Error fetching contact info:", err));
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const navbar = document.querySelector('.custom-navbar');
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto-close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setServicesDropdownOpen(false);
            setUserDropdownOpen(false);
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        const token = localStorage.getItem("token");
        if (token) await logoutUser(token);

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/login");
    };

    const toggleServicesDropdown = (e) => {
        e.stopPropagation();
        setServicesDropdownOpen(!servicesDropdownOpen);
        setUserDropdownOpen(false);
    };

    const toggleUserDropdown = (e) => {
        e.stopPropagation();
        setUserDropdownOpen(!userDropdownOpen);
        setServicesDropdownOpen(false);
    };

    const dropdownArrowStyles = {
        base: {
            fontSize: '0.7rem',
            transition: 'transform 0.3s ease'
        },
        closed: {
            transform: 'rotate(0deg)'
        },
        open: {
            transform: 'rotate(180deg)'
        }
    };

    return (
        <>
            {/* Enhanced Top Bar */}
            <div className="top-bar">
                <div className="container">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="top-bar-left">
                            <div className="d-flex flex-wrap align-items-center">
                                {contactInfo ? (
                                    <>
                                        <span className="contact-item">
                                            <i className="fas fa-map-marker-alt"></i>
                                            {contactInfo.address}
                                        </span>
                                        <span className="separator">|</span>
                                        <span className="contact-item">
                                            <i className="fas fa-phone"></i>
                                            {contactInfo.phone}
                                        </span>
                                        <span className="separator">|</span>
                                        <span className="contact-item">
                                            <i className="fas fa-envelope"></i>
                                            {contactInfo.email}
                                        </span>
                                    </>
                                ) : (
                                    <span>Loading contact info...</span>
                                )}
                            </div>
                        </div>
                        <div className="top-bar-right">
                            <div className="social-links">
                                <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
                                <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
                                <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
                                <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Main Navigation Bar */}
            <nav className="navbar navbar-expand-lg navbar-light custom-navbar">
                <div className="container-fluid navbar-container">
                    <Link className="navbar-brand" to="/">
                        <div className="brand-container">
                            <span className="brand-text">MONARK</span>
                        </div>
                    </Link>
                    
                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarNav"
                        aria-controls="navbarNav"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav mx-auto">
                            <li className="nav-item">
                                <Link className="nav-link" to="/">
                                    <i className="fas fa-home me-1 d-lg-none"></i>
                                    Home
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/about">
                                    <i className="fas fa-info-circle me-1 d-lg-none"></i>
                                    About
                                </Link>
                            </li>

                            <li className="nav-item">
                                <Link className="nav-link" to="/contact">
                                    <i className="fas fa-phone me-1 d-lg-none"></i>
                                    Contact Us
                                </Link>
                            </li>

                            {/* Services Dropdown - Updated with Sidebar-style effect */}
                            <li className="nav-item dropdown">
                                <a 
                                    className="nav-link dropdown-toggle d-flex align-items-center" 
                                    href="#" 
                                    id="servicesDropdown" 
                                    role="button" 
                                    data-bs-toggle="dropdown" 
                                    aria-expanded="false"
                                    onClick={toggleServicesDropdown}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <i className="fas fa-concierge-bell me-1 d-lg-none"></i>
                                    Services
                                    <i 
                                        className="fas fa-chevron-down ms-1 dropdown-arrow"
                                        style={{
                                            ...dropdownArrowStyles.base,
                                            ...(servicesDropdownOpen ? dropdownArrowStyles.open : dropdownArrowStyles.closed)
                                        }}
                                    ></i>
                                </a>
                                <ul 
                                    className="dropdown-menu" 
                                    aria-labelledby="servicesDropdown"
                                    style={{ 
                                        display: servicesDropdownOpen ? 'block' : 'none'
                                    }}
                                >
                                    <li><Link className="dropdown-item" to="/all-parkings">Parking Lots</Link></li>
                                    <li><Link className="dropdown-item" to="/services">Car Services</Link></li>
                                </ul>
                            </li>
                        </ul>

                        <ul className="navbar-nav align-items-center">
                            {!user ? (
                                <>
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/login">
                                            Login/Register
                                        </Link>
                                    </li>
                                </>
                            ) : (
                                <>
                                    {/* User Dropdown - Updated with Sidebar-style effect */}
                                    <li className="nav-item dropdown user-menu ms-3">
                                        <a 
                                            className="nav-link dropdown-toggle d-flex align-items-center" 
                                            href="#" 
                                            id="userDropdown" 
                                            role="button" 
                                            data-bs-toggle="dropdown" 
                                            aria-expanded="false"
                                            onClick={toggleUserDropdown}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="user-info ms-2 d-none d-md-block d-flex align-items-center">
                                                <div className="user-name">{user.name || user.email}
                                                    <i 
                                                        className="fas fa-chevron-down ms-1 dropdown-arrow"
                                                        style={{
                                                            ...dropdownArrowStyles.base,
                                                            ...(userDropdownOpen ? dropdownArrowStyles.open : dropdownArrowStyles.closed)
                                                        }}
                                                    ></i>
                                                </div>
                                            </div>
                                        </a>
                                        <ul 
                                            className="dropdown-menu dropdown-menu-end" 
                                            aria-labelledby="userDropdown"
                                            style={{ 
                                                display: userDropdownOpen ? 'block' : 'none'
                                            }}
                                        >
                                            {user.role === "user" && (
                                                <Link className="dropdown-item" to="/dashboard">
                                                    <i className="fas fa-tachometer-alt me-1"></i>
                                                    Dashboard
                                                </Link>
                                            )}

                                            {user.role === "mechanic" && (
                                                <Link className="dropdown-item" to="/mechanic/dashboard">
                                                    <i className="fas fa-tachometer-alt me-2"></i>
                                                    Mechanic Panel
                                                </Link>
                                            )}

                                            {user.role === "admin" && (
                                                <Link className="dropdown-item" to="/admin">
                                                    <i class="fa-solid fa-user-tie me-2"></i>
                                                    Admin Panel
                                                </Link>
                                            )}
                                            {user.role === "manager" && (
                                                <Link className="dropdown-item" to="/manager">
                                                    <i className="fas fa-user-tie me-2"></i>
                                                    Manager Panel
                                                </Link>
                                            )}
                                            <li><Link className="dropdown-item" to="/user-profile"><i class="fa-solid fa-pen-to-square me-2"></i>My Profile</Link></li>
                                            <li><hr className="dropdown-divider" /></li>
                                            <li>
                                                <button className="dropdown-item text-danger" onClick={handleLogout}>
                                                    <i className="fas fa-sign-out-alt me-2"></i>Logout
                                                </button>
                                            </li>
                                        </ul>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>
            </nav>
        </>
    );
}