import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);

  useEffect(() => {
    // Fetch contact info dynamically from backend
    fetch("https://monark.xetroot.com/api/contact-info")
      .then((res) => res.json())
      .then((data) => setContactInfo(data))
      .catch((err) => console.error("Error fetching contact info:", err));
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const quickLinks = [
    { name: "Home", icon: "fas fa-home", path: "/" },
    { name: "Parking", icon: "fas fa-square-parking", path: "/parking" },
    { name: "Car Wash", icon: "fas fa-car", path: "/services" },
    { name: "Pricing", icon: "fas fa-tag", path: "/pricing" },
    { name: "About Us", icon: "fas fa-info-circle", path: "/about" },
    { name: "Contact", icon: "fas fa-phone", path: "/contact" },
  ];

  const services = [
    "Smart Parking",
    "Valet Service", 
    "Car Wash",
    "Interior Cleaning",
    "Wax & Polish",
    "24/7 Security"
  ];

  const parkingFeatures = [
    "24/7 CCTV Surveillance",
    "Easy Online Booking",
    "Secure Payment",
    "Real-time Slot Availability",
    "Monthly Passes",
    "Priority Parking"
  ];

  const socialLinks = [
    { icon: "fab fa-facebook-f", name: "Facebook", path: "#" },
    { icon: "fab fa-twitter", name: "Twitter", path: "#" },
    { icon: "fab fa-instagram", name: "Instagram", path: "#" },
    { icon: "fab fa-linkedin-in", name: "LinkedIn", path: "#" },
    { icon: "fab fa-youtube", name: "YouTube", path: "#" },
  ];

  return (
    <>
      {/* Main Footer */}
      <footer className="bg-dark text-white position-relative">
        {/* Background Gradient */}
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
            opacity: "0.95"
          }}
        ></div>

        <div className="container-fluid position-relative">
          {/* Top Section */}
          <div className="row p-5">
            {/* Company Info */}
            <div className="col-lg-4 mb-5 mb-lg-0 px-5">
              <div className="d-flex align-items-center mb-4">

                <div>
                  <h3 className="mb-0 fw-bold text-white">MONARK</h3>
                  <small className="text-primary">Smart Parking & Car Care</small>
                </div>
              </div>
              <p className="mb-4 text-light" style={{ lineHeight: "1.7" }}>
                Your trusted partner for smart parking solutions and premium car care services. 
                We provide secure, convenient, and professional services for all your vehicle needs.
              </p>

              {/* Features */}
              <div className="mb-4">
                <div className="row g-2">
                  <div className="col-6">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-shield-alt text-success me-2"></i>
                      <small>24/7 Security</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-camera text-info me-2"></i>
                      <small>CCTV Coverage</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-wifi text-warning me-2"></i>
                      <small>Free WiFi</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="d-flex align-items-center">
                      <i className="fas fa-bolt text-danger me-2"></i>
                      <small>EV Charging</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links & Services */}
            <div className="col-lg-4 col-md-6 mb-5 mb-md-0">
              <div className="row">
                <div className="col-sm-6 mb-4 mb-sm-0">
                  <h5 className="mb-4 text-primary fw-semibold">
                    <i className="fas fa-link me-2"></i>
                    Quick Links
                  </h5>
                  <ul className="list-unstyled">
                    {quickLinks.map((link, index) => (
                      <li key={index} className="mb-2">
                        <a
                          href={link.path}
                          className="text-light text-decoration-none hover-effect d-flex align-items-center"
                        >
                          <i className={`${link.icon} me-2`} style={{ width: "16px", color: "#3498db" }}></i>
                          <span>{link.name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="col-sm-6">
                  <h5 className="mb-4 text-primary fw-semibold">
                    <i className="fas fa-concierge-bell me-2"></i>
                    Our Services
                  </h5>
                  <ul className="list-unstyled">
                    {services.map((service, index) => (
                      <li key={index} className="mb-2">
                        <a
                          href="#"
                          className="text-light text-decoration-none hover-effect d-flex align-items-center"
                        >
                          <i className="fas fa-check-circle me-2 small" style={{ color: "#10b981" }}></i>
                          <span>{service}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Contact & Newsletter */}
            <div className="col-lg-4 col-md-6">
              <h5 className="mb-4 text-primary fw-semibold">
                <i className="fas fa-map-marker-alt me-2"></i>
                Contact Info
              </h5>

              {/* Contact Info (Dynamic from DB) */}
              {contactInfo ? (
                <div className="mb-4">
                  <div className="d-flex align-items-start mb-3">
                    <i className="fas fa-map-marker-alt mt-1 me-3 text-primary"></i>
                    <div>
                      <div className="fw-medium text-white">{contactInfo.address}</div>
                      <small className="text-muted">Main Parking Facility</small>
                    </div>
                  </div>

                  <div className="d-flex align-items-start mb-3">
                    <i className="fas fa-phone mt-1 me-3 text-primary"></i>
                    <div>
                      <div className="fw-medium text-white">{contactInfo.phone}</div>
                      <small className="text-muted">24/7 Support Available</small>
                    </div>
                  </div>

                  <div className="d-flex align-items-start mb-4">
                    <i className="fas fa-envelope mt-1 me-3 text-primary"></i>
                    <div>
                      <div className="fw-medium text-white">{contactInfo.email}</div>
                      <small className="text-muted">Quick Response</small>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="d-flex align-items-start mb-3">
                    <i className="fas fa-map-marker-alt mt-1 me-3 text-primary"></i>
                    <div>
                      <div className="fw-medium text-white">123 Parking Tower, City Center</div>
                      <small className="text-muted">Dhaka, Bangladesh</small>
                    </div>
                  </div>
                  <div className="d-flex align-items-start mb-3">
                    <i className="fas fa-phone mt-1 me-3 text-primary"></i>
                    <div>
                      <div className="fw-medium text-white">+880 1XXX-XXXXXX</div>
                      <small className="text-muted">24/7 Support</small>
                    </div>
                  </div>
                </div>
              )}

              {/* Newsletter */}
             {/* <div>
                <h6 className="mb-3 text-white">
                  <i className="fas fa-newspaper me-2 text-primary"></i>
                  Parking Updates
                </h6>
                {subscribed ? (
                  <div className="alert alert-success d-flex align-items-center mb-3" role="alert">
                    <i className="fas fa-check-circle me-2"></i>
                    <small>Thanks for subscribing!</small>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="mb-2">
                    <div className="input-group">
                      <input
                        type="email"
                        className="form-control border-end-0"
                        placeholder="Your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{borderRadius: '8px 0 0 8px'}}
                      />
                      <button
                        type="submit"
                        className="btn btn-primary px-3"
                        style={{borderRadius: '0 8px 8px 0'}}
                      >
                        <i className="fas fa-paper-plane"></i>
                      </button>
                    </div>
                  </form>
                )}
                <small className="text-muted">
                  Get parking availability alerts and special offers
                </small>
              </div>*/}
            </div>
          </div>

          {/* Features & Social */}
          <div className="row border-top border-secondary p-5">
            <div className="col-md-8 mb-4 mb-md-0 px-5">
              <h6 className="mb-3 text-white">
                <i className="fas fa-star me-2 text-warning"></i>
                Parking Features
              </h6>
              <div className="d-flex flex-wrap gap-3">
                {parkingFeatures.map((feature, index) => (
                  <div key={index} className="feature-badge">
                    <i className="fas fa-check-circle me-1 text-success small"></i>
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            <div className="col-md-4">
              <h6 className="mb-3 text-white">
                <i className="fas fa-share-alt me-2 text-info"></i>
                Connect With Us
              </h6>
              <div className="d-flex flex-wrap gap-3">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.path}
                    className="social-icon d-flex align-items-center justify-content-center"
                    title={social.name}
                  >
                    <i className={social.icon}></i>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="row py-4 border-top border-secondary p-5">
            <div className="col-md-6 mb-3 mb-md-0">
              <div className="d-flex justify-content-center align-items-center">
                <i className="fas fa-copyright text-muted me-2"></i>
                <p className="mb-0 text-light">
                  &copy;{new Date().getFullYear()} MONARK. All rights reserved.
                </p>
              </div>
            </div>
            <div className="col-md-6 text-md-end">
              <div className="d-flex flex-wrap justify-content-md-end gap-3">
                <a href="#" className="text-decoration-none text-light small hover-effect">
                  Privacy Policy
                </a>
                <a href="#" className="text-decoration-none text-light small hover-effect">
                  Terms of Service
                </a>
                <a href="#" className="text-decoration-none text-light small hover-effect">
                  Parking Policy
                </a>
                <a href="#" className="text-decoration-none text-light small hover-effect">
                  Safety & Security
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Footer Styles */}
      <style>{`
        .hover-effect {
          transition: all 0.3s ease;
          padding: 2px 0;
          display: inline-block;
        }
        .hover-effect:hover {
          color: #3498db !important;
          transform: translateX(3px);
        }
        .social-icon {
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
          color: #fff;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .social-icon:hover {
          background: #3498db;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
        }
        .feature-badge {
          background: rgba(255,255,255,0.05);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          border: 1px solid rgba(255,255,255,0.1);
          color: #e2e8f0;
        }
        .bg-dark {
          background-color: #0f172a !important;
        }
      `}</style>
    </>
  );
}