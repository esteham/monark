import React, { useEffect, useState } from "react";
import axios from "axios";

// Base URL সেট করুন
const API_BASE_URL = "http://127.0.0.1:8000/api";

export default function MyServices() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError("Please login to view your bookings");
      setLoading(false);
      return;
    }

    axios.get(`${API_BASE_URL}/service-orders`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        console.log("API Response:", res.data);
        
        if (Array.isArray(res.data)) {
          setOrders(res.data);
        } else {
          setOrders([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching orders:", err);
        console.error("Error response:", err.response);
        
        if (err.response?.status === 401) {
          setError("Please login to view your bookings");
        } else if (err.response?.status === 404) {
          setError("API endpoint not found. Please check the server.");
        } else {
          setError("Failed to load bookings. Please try again.");
        }
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="container mt-4">
      <div className="text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading your bookings...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="container mt-4">
      <div className="alert alert-warning text-center">
        <h5>Oops!</h5>
        <p>{error}</p>
        <button 
          className="btn btn-primary btn-sm"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="container mt-4">
      <h2>My Car Wash Bookings</h2>
      {orders.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Service</th>
                <th>Booking Time</th>
                <th>Status</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={order.id}>
                  <td>{index + 1}</td>
                  <td>{order.service?.name || "N/A"}</td>
                  <td>{new Date(order.booking_time).toLocaleString()}</td>
                  <td>
                    <span className={`badge bg-${
                      order.status === "completed" ? "success" :
                      order.status === "in_progress" ? "warning" :
                      order.status === "cancelled" ? "danger" : 
                      order.status === "pending" ? "info" : "secondary"
                    }`}>
                      {order.status ? order.status.replace('_', ' ') : 'pending'}
                    </span>
                  </td>
                  <td>৳{order.service?.price || order.total_price || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="alert alert-info">
            <h5>No Bookings Found</h5>
            <p className="mb-0">You haven't booked any car wash services yet.</p>
          </div>
        </div>
      )}
    </div>
  );
}