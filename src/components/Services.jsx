import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaMapMarkerAlt, FaPhone, FaClock, FaTimes, FaCar, FaCalendarAlt, FaWallet } from "react-icons/fa";
import Swal from 'sweetalert2';
import './css/Services.css';

const API_BASE_URL = "https://monark.xetroot.com/api";
const BASE_URL = "https://monark.xetroot.com/";


export default function Services() {
  const [services, setServices] = useState([]);
  const [serviceCenters, setServiceCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [centersLoading, setCentersLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingService, setBookingService] = useState(null);
  const [bookingTime, setBookingTime] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    fetchServices();
    fetchServiceCenters();
    getUserLocation();
    /*fetchUserData();*/
  }, []);

  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log("Location access denied or unavailable");
          setUserLocation({
            latitude: 23.8103,
            longitude: 90.4125
          });
        }
      );
    } else {
      setUserLocation({
        latitude: 23.8103,
        longitude: 90.4125
      });
    }
  };

  // Fetch user data including wallet balance
  /*const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUserData(response.data.user || response.data);
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };*/

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance.toFixed(1);
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API_BASE_URL}/services`);

      let servicesData = [];
      if (Array.isArray(response.data)) {
        servicesData = response.data;
      } else if (response.data.services && Array.isArray(response.data.services)) {
        servicesData = response.data.services;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        servicesData = response.data.data;
      }

      setServices(servicesData);
    } catch (err) {
      console.error("Error fetching services:", err);
      setError("Failed to load services. Please try again later.");
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceCenters = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/service-centers`);
      let centersData = [];
      
      if (Array.isArray(response.data)) {
        centersData = response.data;
      } else if (response.data.service_centers && Array.isArray(response.data.service_centers)) {
        centersData = response.data.service_centers;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        centersData = response.data.data;
      }

      setServiceCenters(centersData);
    } catch (err) {
      console.error("Error fetching service centers:", err);
      setServiceCenters([]);
    } finally {
      setCentersLoading(false);
    }
  };

  const handleBookClick = (service) => {
  const token = localStorage.getItem('token');
  if (!token) {
    Swal.fire({
      icon: 'warning',
      title: 'Login Required',
      text: 'Please login first to book a service',
      confirmButtonColor: '#007bff',
      customClass: {
        popup: 'sweetalert-popup',
        container: 'sweetalert-container'
      }
    });
    return;
  }

  // Check wallet balance before opening booking modal
  if (userData && parseFloat(userData.wallet_balance) < parseFloat(service.price)) {
    Swal.fire({
      icon: 'error',
      title: 'Insufficient Balance',
      html: `
        <div style="text-align: left;">
          <p>You don't have enough balance to book this service.</p>
          <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <div style="display: flex; justify-content: space-between;">
              <span>Service Price:</span>
              <strong>৳ ${service.price}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Your Balance:</span>
              <strong style="color: #dc3545;">৳ ${userData.wallet_balance}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 5px;">
              <span>Required:</span>
              <strong style="color: #dc3545;">৳ ${(parseFloat(service.price) - parseFloat(userData.wallet_balance)).toFixed(2)} more</strong>
            </div>
          </div>
        </div>
      `,
      confirmButtonColor: '#007bff',
      confirmButtonText: 'Add Money to Wallet',
      showCancelButton: true,
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'sweetalert-popup',
        container: 'sweetalert-container'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Redirect to topup page
        window.location.href = '/topup';
      }
    });
    return;
  }

  setBookingService(service);

  const now = new Date();
  now.setHours(now.getHours() + 1);

  const localDatetime = now
    .toLocaleString("sv-SE", { timeZone: "Asia/Dhaka" })
    .replace(" ", "T")
    .slice(0, 16);

  setBookingTime(localDatetime);
};

  const handleBookingSubmit = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    Swal.fire({
      icon: 'warning',
      title: 'Login Required',
      text: 'Please login first to book a service',
      confirmButtonColor: '#007bff',
      customClass: {
        popup: 'sweetalert-popup',
        container: 'sweetalert-container'
      }
    });
    return;
  }
  if (!bookingTime) {
    Swal.fire({
      icon: 'warning',
      title: 'Select Time',
      text: 'Please select booking time',
      confirmButtonColor: '#007bff',
      customClass: {
        popup: 'sweetalert-popup',
        container: 'sweetalert-container'
      }
    });
    return;
  }

  // Final wallet balance check before submitting
  if (userData && parseFloat(userData.wallet_balance) < parseFloat(bookingService.price)) {
    Swal.fire({
      icon: 'error',
      title: 'Insufficient Balance',
      html: `
        <div style="text-align: left;">
          <p>You don't have enough balance to book this service.</p>
          <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <div style="display: flex; justify-content: space-between;">
              <span>Service Price:</span>
              <strong>৳ ${bookingService.price}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Your Balance:</span>
              <strong style="color: #dc3545;">৳ ${userData.wallet_balance}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 5px;">
              <span>Required:</span>
              <strong style="color: #dc3545;">৳ ${(parseFloat(bookingService.price) - parseFloat(userData.wallet_balance)).toFixed(2)} more</strong>
            </div>
          </div>
        </div>
      `,
      confirmButtonColor: '#007bff',
      confirmButtonText: 'Add Money to Wallet',
      showCancelButton: true,
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'sweetalert-popup',
        container: 'sweetalert-container'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Redirect to topup page
        window.location.href = '/topup';
      }
    });
    return;
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/service-orders`,
      {
        service_id: bookingService.id,
        booking_time: bookingTime,
        notes: `Booking for ${bookingService.name}`
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    Swal.fire({
      icon: 'success',
      title: 'Booking Successful!',
      text: response.data.message || 'Service booked successfully',
      confirmButtonColor: '#28a745',
      customClass: {
        popup: 'sweetalert-popup',
        container: 'sweetalert-container'
      }
    });

    setBookingService(null);
    setBookingTime("");
    fetchServices();
    /*fetchUserData();*/
  } catch (err) {
    console.error("Booking error:", err);
    const errorMessage = err.response?.data?.error || 
                        err.response?.data?.message || 
                        "Booking failed. Please try again.";
    
    if (errorMessage.includes('INSUFFICIENT_WALLET_BALANCE') || errorMessage.includes('insufficient')) {
      Swal.fire({
        icon: 'error',
        title: 'Insufficient Balance',
        html: `
          <div style="text-align: left;">
            <p>Your wallet balance is insufficient for this booking.</p>
            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0;">
              <div style="display: flex; justify-content: space-between;">
                <span>Service Price:</span>
                <strong>৳ ${bookingService.price}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Your Balance:</span>
                <strong style="color: #dc3545;">৳ ${userData?.wallet_balance || 0}</strong>
              </div>
            </div>
          </div>
        `,
        confirmButtonColor: '#007bff',
        confirmButtonText: 'Add Money to Wallet',
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        customClass: {
          popup: 'sweetalert-popup',
          container: 'sweetalert-container'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = '/topup';
        }
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Booking Failed',
        text: errorMessage,
        confirmButtonColor: '#dc3545',
        customClass: {
          popup: 'sweetalert-popup',
          container: 'sweetalert-container'
        }
      });
    }
  }
};

  const openGoogleMaps = (latitude, longitude, address) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}&ll=${latitude},${longitude}&z=15`;
    window.open(url, '_blank');
  };

  // Sort service centers by distance from user
  const getSortedServiceCenters = () => {
    if (!userLocation) return serviceCenters;

    return [...serviceCenters].sort((a, b) => {
      const distA = calculateDistance(
        userLocation.latitude, 
        userLocation.longitude, 
        a.latitude, 
        a.longitude
      );
      const distB = calculateDistance(
        userLocation.latitude, 
        userLocation.longitude, 
        b.latitude, 
        b.longitude
      );
      return distA - distB;
    });
  };

  if (loading) {
    return (
      <div className="services-container">
        <div className="services-loading-spinner">
          <div className="services-spinner"></div>
          <p>Loading services...</p>
        </div>
      </div>
    );
  }

  const sortedServiceCenters = getSortedServiceCenters();

  return (
    <div className="services-container">
      {/* Existing Services Section - No Changes */}
      <div className="services-header">
        <h1 className="services-title">Car Wash Services</h1>
        <p className="services-subtitle">Professional car cleaning services with competitive pricing</p>
      </div>

      {error && (
        <div className="services-alert services-alert-error">
          {error}
          <button onClick={fetchServices} className="services-retry-btn">Retry</button>
        </div>
      )}

      <div className="services-grid">
        {services.length > 0 ? (
          services.map((service) => (
            <div key={service.id} className="service-card">
              <div className="service-image-container">
                {service.image ? (
                  <img
                    src={`${BASE_URL}${service.image}`}
                    alt={service.name}
                    className="service-image"
                    onError={(e) => (e.target.alt = "Image not available")}
                  />
                ) : (
                  <div className="service-no-image">Image not available</div>
                )}
              </div>

              <div className="service-content">
                <h3 className="service-title">{service.name}</h3>
                <p className="service-description">{service.description}</p>
                
                <div className="service-details">
                  <div className="service-price">
                    <span className="service-amount">৳ {service.price}</span>
                    <span className="service-currency">BDT</span>
                  </div>
                  <div className="service-duration">
                    <span className="service-time-icon">⏱️</span>
                    <span className="service-time">{service.duration}</span>
                  </div>
                </div>

                <button className="service-book-btn" onClick={() => handleBookClick(service)}>
                  <FaCalendarAlt className="btn-icon" />
                  Book Now
                </button>
              </div>
            </div>
          ))
        ) : (
          !loading && (
            <div className="services-empty">
              <div className="services-empty-icon">🔍</div>
              <h3>No Services Available</h3>
              <p>Please check back later for available services</p>
            </div>
          )
        )}
      </div>

      {/* New Service Centers Section - List View */}
      <div className="service-centers-section">
        <div className="service-centers-header">
          <h2 className="service-centers-title">Our Service Centers</h2>
          <p className="service-centers-subtitle">
            {userLocation ? 
              "Service centers near your location" : 
              "Find our service centers across the city"
            }
          </p>
        </div>

        {centersLoading ? (
          <div className="centers-loading">
            <div className="loading-spinner"></div>
            <p>Loading service centers...</p>
          </div>
        ) : (
          <div className="service-centers-list">
            {sortedServiceCenters.map((center, index) => {
              const distance = userLocation ? 
                calculateDistance(
                  userLocation.latitude, 
                  userLocation.longitude, 
                  center.latitude, 
                  center.longitude
                ) : null;

              return (
                <div 
                  key={center.id} 
                  className="service-center-item"
                  onClick={() => setSelectedCenter(center)}
                >
                  <div className="center-item-header">
                    <div className="center-item-info">
                      <h3 className="center-name">
                        <FaCar className="center-icon" />
                        {center.name}
                        {index === 0 && userLocation && (
                          <span className="nearest-tag">Nearest to You</span>
                        )}
                      </h3>
                      
                    </div>
                  </div>

                  <div className="center-item-details">
                    <div className="center-contact">
                    <div className="center-address">
                        <FaMapMarkerAlt className="address-icon" />
                        {center.address}
                      </div>
                      <div className="center-phone">
                        <FaPhone className="phone-icon" />
                        {center.phone}
                      </div>
                      <div className="center-hours">
                        <FaClock className="hours-icon" />
                        {center.opening_hours}
                      </div>
                    </div>
                    
                    {/*<div className="center-item-actions">
                      <button 
                        className="center-view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCenter(center);
                        }}
                      >
                        View Details
                      </button>
                      <button 
                        className="center-map-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openGoogleMaps(center.latitude, center.longitude, center.address);
                        }}
                      >
                        <FaMapMarkerAlt className="btn-icon" />
                        Map
                      </button>
                    </div>*/}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Service Center Details Modal */}
      {selectedCenter && (
      <div
        className="service-center-overlay"
        onClick={() => setSelectedCenter(null)}
      >
        <div
          className="service-center-modal glass-effect animate-pop"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            className="modal-close-btn"
            onClick={() => setSelectedCenter(null)}
            title="Close"
          >
            <FaTimes />
          </button>

          {/* Header Section */}
          <div className="modal-header py-3">
            <h2 className="modal-title">
              {/*<FaCar className="modal-title-icon" /> */}{selectedCenter.name}
            </h2>

            {userLocation && (
              <div className="modal-distance">
                <FaMapMarkerAlt className="distance-icon" />
                {calculateDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  selectedCenter.latitude,
                  selectedCenter.longitude
                )}{" "}
                km away
              </div>
            )}
          </div>

          {/* Center Details */}
          <div className="modal-body">
            <div className="detail-card">
              <FaMapMarkerAlt className="detail-icon" />
              <div>
                <h4>Address</h4>
                <p>{selectedCenter.address}</p>
              </div>
            </div>

            <div className="detail-card">
              <FaPhone className="detail-icon" />
              <div>
                <h4>Contact</h4>
                <p>{selectedCenter.phone}</p>
                {selectedCenter.email && <p>{selectedCenter.email}</p>}
              </div>
            </div>

            <div className="detail-card">
              <FaClock className="detail-icon" />
              <div>
                <h4>Opening Hours</h4>
                <p>{selectedCenter.opening_hours}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            <button
              className="action-btn call-btn"
              onClick={() => window.open(`tel:${selectedCenter.phone}`)}
            >
              <FaPhone className="btn-icon" />
              Call Now
            </button>
            <button
              className="action-btn map-btn"
              onClick={() =>
                openGoogleMaps(
                  selectedCenter.latitude,
                  selectedCenter.longitude,
                  selectedCenter.address
                )
              }
            >
              <FaMapMarkerAlt className="btn-icon" />
              Open in Google Maps
            </button>
          </div>
        </div>
      </div>
    )}


      {/* Existing Booking Modal */}
      {bookingService && (
        <div
          className="services-modal-overlay"
          onClick={() => setBookingService(null)}
        >
          <div
            className="services-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="services-modal-close"
              onClick={() => setBookingService(null)}
            >
              <FaTimes />
            </button>

            {bookingService.image && (
              <div className="service-modal-image-container">
                <img
                  src={`${BASE_URL}${bookingService.image}`}
                  alt={bookingService.name}
                  className="service-modal-image"
                  onError={(e) => (e.target.alt = "Image not available")}
                />
              </div>
            )}

            <div className="service-modal-content">
              <h3 className="service-modal-title">
                {/*<FaCar className="modal-title-icon" />*/}
                {bookingService.name}
              </h3>

              <ul className="service-modal-description">
                {bookingService.description.split('.').filter(Boolean).map((item, idx) => (
                  <li key={idx}>{item.trim()}.</li>
                ))}
              </ul>

              <div className="service-modal-details">
                <div className="service-modal-price">
                  <span className="service-modal-amount">৳ {bookingService.price}</span>
                  <span className="service-modal-currency">BDT</span>
                </div>
                <div className="service-modal-duration">
                  <span className="service-modal-time-icon">⏱️</span>
                  <span className="service-modal-time">{bookingService.duration}</span>
                </div>
              </div>

              <div className="services-form-group">
                <label htmlFor="bookingTime">
                  {/*<FaCalendarAlt className="form-icon" />*/}
                  Select Date & Time:
                </label>
                <input
                  type="datetime-local"
                  id="bookingTime"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  min={new Date()
                    .toLocaleString("sv-SE", { timeZone: "Asia/Dhaka" })
                    .replace(" ", "T")
                    .slice(0, 16)}
                  className="services-time-input"
                />
              </div>

              <div className="services-modal-buttons">
                <button className="services-btn-cancel" onClick={() => setBookingService(null)}>
                  Cancel
                </button>
                <button className="services-btn-confirm" onClick={handleBookingSubmit}>
                  <FaCalendarAlt className="btn-icon" />
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}