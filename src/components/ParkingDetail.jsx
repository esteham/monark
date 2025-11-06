import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { bookingAPI, walletAPI } from "../api/client";
import Swal from "sweetalert2";
import Spinner from "../components/Spinner";

// Base URL configuration
const BASE_URL = "https://monark.xetroot.com";

export default function ParkingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [parking, setParking] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingHours, setBookingHours] = useState(1);
    const [walletBalance, setWalletBalance] = useState(0);
    const [loading, setLoading] = useState(false);

    // Get full image URL
    const getImageUrl = (image) => {
        if (!image || image === 'null') {
            return '/images/default-parking.jpg';
        }
        
        // Check if image already has full URL
        if (image.startsWith('http')) {
            return image;
        }
        
        // Remove leading slash if present to avoid double slashes
        const imagePath = image.startsWith('/') ? image.substring(1) : image;
        
        // Construct full URL using BASE_URL
        return `${BASE_URL}/${imagePath}`;
    };

    // Fetch parking details and wallet balance
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch parking details
                const parkingRes = await api.get(`/parkings/${id}`);
                const parkingData = parkingRes.data;
                
                // Process image URL
                const processedParking = {
                    ...parkingData,
                    image: getImageUrl(parkingData.image)
                };
                
                setParking(processedParking);

                // Fetch wallet balance if user is logged in
                const token = localStorage.getItem("token");
                if (token) {
                    const walletRes = await walletAPI.getBalance();

                    // Check if walletRes and walletRes.data exist
                    if (walletRes && walletRes.data && typeof walletRes.data.balance !== "undefined") {
                        setWalletBalance(walletRes.data.balance);
                    } else if (walletRes && typeof walletRes.balance !== "undefined") {
                        // fallback if API returns balance directly
                        setWalletBalance(walletRes.balance);
                    } else {
                        console.warn("Wallet API returned unexpected response:", walletRes);
                        setWalletBalance(0); // fallback value
                    }
                }
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        };
        fetchData();
    }, [id]);


    // Handle booking with wallet payment
    const handleBookNow = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
        Swal.fire({
            icon: "warning",
            title: "Login Required",
            text: "Please login first to book a parking spot!",
            confirmButtonText: "OK"
        }).then(() => navigate("/login"));
        return;
    }

    if (!selectedSlot) {
        Swal.fire({
            icon: "info",
            title: "Select Slot",
            text: "Please select a parking slot first!",
            confirmButtonText: "OK"
        });
        return;
    }

    setLoading(true);

    try {
        // Prepare payload as numbers
        const payload = {
            parking_id: Number(parking.id),
            slot_id: Number(selectedSlot.id),
            hours: Number(bookingHours)
        };

        console.log("Booking payload:", payload);

        // Call API
        const res = await bookingAPI.createWithWallet(payload);

        // Update wallet balance
        const newBalanceRes = await walletAPI.getBalance();
        setWalletBalance(newBalanceRes.data?.balance || 0);

        Swal.fire({
            icon: "success",
            title: "Booking Successful!",
            html: `
                <div class="text-start">
                    <p><strong>Parking:</strong> ${parking.name}</p>
                    <p><strong>Slot:</strong> ${selectedSlot.slot_code}</p>
                    <p><strong>Duration:</strong> ${bookingHours} hour${bookingHours > 1 ? "s" : ""}</p>
                    <p><strong>Total Paid:</strong> BDT ${(bookingHours * parking.price_per_hour).toFixed(2)}</p>
                    <p><strong>New Wallet Balance:</strong> BDT ${walletBalance || 0}</p>
                </div>
            `,
            confirmButtonText: "View Dashboard"
        }).then(() => navigate("/dashboard"));

    } catch (err) {
        console.error("Booking error:", err.response?.data || err.message);

        let errorMessage = "Something went wrong. Please try again.";

        // Laravel 422 validation errors
        if (err.response?.status === 422) {
            if (err.response.data?.errors) {
                // Flatten all validation errors into a single message
                errorMessage = Object.values(err.response.data.errors)
                    .flat()
                    .join("\n");
            } else if (err.response.data?.message) {
                errorMessage = err.response.data.message;
            }
        } else if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
        }

        Swal.fire({
            icon: "error",
            title: "Booking Failed",
            text: errorMessage,
            confirmButtonText: "OK"
        });
    } finally {
        setLoading(false);
    }
};


    // Loading state
    if (!parking) {
        return <Spinner />;
    }

    return (
        <div className="container py-5">
            {/* Back Button */}
            <div className="row mb-4 text-end">
                <div className="col-12">
                    <button 
                        className="btn btn-outline-secondary mb-3"
                        onClick={() => navigate("/")}
                    >
                        Back to Home
                    </button>
                    
                </div>
            </div>

            {/* Parking Information */}
            <div className="row mb-5">
                <div className="col-md-6">
                    <img 
                        src={parking.image} 
                        alt={parking.name}
                        className="img-fluid rounded shadow"
                        style={{maxheight: "300", width: "100%", objectFit: "cover"}}
                        onError={(e) => {
                            e.target.src = '/images/default-parking.jpg';
                        }}
                    />
                </div>
                <div className="col-md-6">
                    <h1 className="fw-bold text-primary">{parking.name}</h1>
                    <p className="lead text-muted">{parking.description || parking.distance}</p>
                    
                    <div className="row mb-3">
                        <div className="col-6">
                            <div className="card bg-light border-0">
                                <div className="card-body text-center">
                                    <h6 className="text-muted">Total Slots</h6>
                                    <p className="h3 mb-0">{parking.total_slots}</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="card bg-success text-white border-0">
                                <div className="card-body text-center">
                                    <h6>Available Slots</h6>
                                    <p className="h3 mb-0">{parking.available_slots}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="card bg-primary text-white border-0">
                        <div className="card-body text-center">
                            <h6>Price Per Hour</h6>
                            <p className="h2 mb-0">BDT {parking.price_per_hour}</p>
                        </div>
                    </div>

                    {/* Wallet Balance Display */}
                    <div className="card bg-warning text-dark mt-3 border-0">
                        <div className="card-body text-center">
                            <h6>Your Wallet Balance</h6>
                            <p className="h4 mb-0">BDT {walletBalance}</p>
                            <small>
                                {walletBalance < 10 ? (
                                    <span className="text-danger">Low balance! Top up before booking.</span>
                                ) : (
                                    <span></span>
                                )}
                            </small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Available Slots and Booking Section */}
            <div className="row">
                <div className="col-md-8">
                    <div className="card shadow-sm">
                        <div className="card-header bg-light">
                            <h4 className="mb-0">Available Parking Slots</h4>
                        </div>
                        <div className="card-body">
                            {parking.slots && parking.slots.length > 0 ? (
                                <div className="row">
                                    {parking.slots.map((slot) => (
                                        <div key={slot.id} className="col-3 mb-3">
                                            <div 
                                                className={`card text-center slot-card ${
                                                    selectedSlot?.id === slot.id 
                                                        ? 'border-primary border-3 bg-primary text-white' 
                                                        : slot.available 
                                                            ? 'border-success bg-light' 
                                                            : 'border-secondary bg-secondary text-white'
                                                }`}
                                                style={{
                                                    cursor: slot.available ? 'pointer' : 'not-allowed',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onClick={() => slot.available && setSelectedSlot(slot)}
                                            >
                                                <div className="card-body py-3">
                                                    <h5 className="mb-1">{slot.slot_code}</h5>
                                                    <small className={slot.available ? 'text-muted' : 'text-light'}>
                                                        {slot.type}
                                                    </small>
                                                    <br />
                                                    <span className={`badge ${
                                                        slot.available 
                                                            ? selectedSlot?.id === slot.id 
                                                                ? 'bg-white text-primary'
                                                                : 'bg-success text-white'
                                                            : 'bg-danger text-white'
                                                    }`}>
                                                        {slot.available ? 'Available' : 'Booked'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-muted">No parking slots available at the moment.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Booking Summary */}
                <div className="col-md-4">
                    <div className="card shadow-lg sticky-top" style={{top: "20px"}}>
                        <div className="card-header bg-dark text-white">
                            <h4 className="mb-0 text-center">Booking</h4>
                        </div>
                        <div className="card-body">
                            {selectedSlot ? (
                                <>
                                    <div className="mb-3 p-3 bg-light rounded">
                                        <h6 className="text-primary">Selected Slot</h6>
                                        <p className="mb-1"><strong>Code:</strong> {selectedSlot.slot_code}</p>
                                        <p className="mb-0"><strong>Type:</strong> {selectedSlot.type}</p>
                                    </div>
                                    
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">
                                            Booking Duration:
                                        </label>
                                        <select 
                                            className="form-select"
                                            value={bookingHours}
                                            onChange={(e) => setBookingHours(parseInt(e.target.value))}
                                        >
                                            {[1,2,3,4,5,6,7,8].map(hour => (
                                                <option key={hour} value={hour}>
                                                    {hour} hour{hour > 1 ? 's' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="border-top pt-3">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Price/hour:</span>
                                            <span>BDT {parking.price_per_hour}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Duration:</span>
                                            <span>{bookingHours} hour{bookingHours > 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="d-flex justify-content-between fw-bold fs-5 text-primary">
                                            <span>Total Amount:</span>
                                            <span>BDT {(bookingHours * parking.price_per_hour).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <button 
                                            className="btn btn-success w-100 py-2"
                                            onClick={handleBookNow}
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                    Processing...
                                                </>
                                            ) : (
                                                "Confirm Booking"
                                            )}
                                        </button>
                                        
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <i className="bi bi-p-square text-muted" style={{fontSize: "3rem"}}></i>
                                    <p className="text-muted mt-2">Please select a parking slot to continue</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Important Notice */}
            {/*<div className="alert alert-info mt-4">
                <h6 className="alert-heading">Important Notice</h6>
                <p className="mb-0">
                    All parking bookings require payment through your wallet. 
                    Please ensure you have sufficient balance before confirming your booking. 
                    You can top up your wallet from the dashboard.
                </p>
            </div>*/}
        </div>
    );
}