import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import Spinner from "../components/Spinner";

export default function AllParkings() {
    const [parkingSpots, setParkingSpots] = useState([]);
    const [filteredParkings, setFilteredParkings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(true);
    const [locationError, setLocationError] = useState(null);
    const [userArea, setUserArea] = useState(null);
    const [areaNames, setAreaNames] = useState({});
    const navigate = useNavigate();

    const BASE_URL = "http://127.0.0.1:8000/";

    // Get user's current location with better error handling
    const getUserLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported"));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    resolve({ latitude, longitude });
                },
                (error) => {
                    let errorMessage = "Unable to get your location";
                    
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = "Location access denied. Please enable location services.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = "Location information unavailable.";
                            break;
                        case error.TIMEOUT:
                            errorMessage = "Location request timed out.";
                            break;
                        default:
                            errorMessage = "An unknown error occurred.";
                            break;
                    }
                    
                    reject(new Error(errorMessage));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    };

    // Get area name from coordinates (Reverse Geocoding) with rate limiting
    const getAreaFromCoordinates = async (lat, lng, delay = 0) => {
        try {
            // Add delay to avoid rate limiting
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`
            );
            
            if (!response.ok) {
                throw new Error('Geocoding failed');
            }
            
            const data = await response.json();
            
            // Extract area name from address
            const address = data.address;
            let areaName = '';
            
            if (address.suburb) {
                areaName = address.suburb;
            } else if (address.neighbourhood) {
                areaName = address.neighbourhood;
            } else if (address.road) {
                areaName = `${address.road} Area`;
            } else if (address.city_district) {
                areaName = address.city_district;
            } else if (address.city) {
                areaName = address.city;
            } else {
                areaName = 'Dhaka Area';
            }
            
            return areaName;
        } catch (error) {
            console.error('Error getting area name:', error);
            return 'Dhaka Area';
        }
    };

    // Get area names for all parkings sequentially to avoid rate limiting
    const getAllParkingAreaNames = async (parkings) => {
        const areaNamesMap = {};
        
        for (let i = 0; i < parkings.length; i++) {
            const parking = parkings[i];
            
            if (parking.latitude && parking.longitude) {
                try {
                    // Add 1 second delay between API calls
                    const delay = i * 1000;
                    const areaName = await getAreaFromCoordinates(
                        parking.latitude,
                        parking.longitude,
                        delay
                    );
                    areaNamesMap[parking.id] = areaName;
                } catch (error) {
                    console.error(`Error getting area for parking ${parking.id}:`, error);
                    areaNamesMap[parking.id] = 'Dhaka Area';
                }
            } else {
                // Fallback if no coordinates
                areaNamesMap[parking.id] = 'Dhaka Area';
            }
        }
        
        return areaNamesMap;
    };

    // Fetch user location and parkings
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setLocationLoading(true);

            try {
                // Try to get user location
                try {
                    const location = await getUserLocation();
                    setUserLocation(location);
                    setLocationError(null);
                    
                    // Get user's area name
                    const area = await getAreaFromCoordinates(location.latitude, location.longitude);
                    setUserArea(area);
                } catch (error) {
                    console.log("Location access not available:", error.message);
                    setLocationError(error.message);
                }

                // Fetch parkings
                const response = await api.get("/parkings");
                const parkingsData = response.data;
                
                // Process parkings data to ensure coordinates are numbers
                const processedParkings = parkingsData.map(parking => ({
                    ...parking,
                    latitude: parking.latitude ? parseFloat(parking.latitude) : null,
                    longitude: parking.longitude ? parseFloat(parking.longitude) : null
                }));
                
                setParkingSpots(processedParkings);
                
                // Get area names for all parkings in background
                getAllParkingAreaNames(processedParkings)
                    .then(areaNamesMap => {
                        setAreaNames(areaNamesMap);
                    })
                    .catch(error => {
                        console.error("Error fetching area names:", error);
                    });
                
                // If we have user location, sort parkings by distance
                if (userLocation) {
                    const sortedParkings = sortParkingsByDistance(processedParkings, userLocation);
                    setFilteredParkings(sortedParkings);
                } else {
                    setFilteredParkings(processedParkings);
                }
                
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
                setLocationLoading(false);
            }
        };

        fetchData();
    }, []);

    // Update filtered parkings when userLocation changes
    useEffect(() => {
        if (userLocation && parkingSpots.length > 0) {
            const sortedParkings = sortParkingsByDistance(parkingSpots, userLocation);
            setFilteredParkings(sortedParkings);
        }
    }, [userLocation, parkingSpots]);

    // Haversine formula to calculate distance between two coordinates
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        return distance;
    };

    // Sort parkings by distance from user
    const sortParkingsByDistance = (parkings, userLoc) => {
        return parkings
            .map(parking => {
                let distanceKm;
                
                if (parking.latitude && parking.longitude) {
                    // Calculate actual distance using coordinates
                    distanceKm = calculateDistance(
                        userLoc.latitude,
                        userLoc.longitude,
                        parking.latitude,
                        parking.longitude
                    );
                } else {
                    // Fallback: estimate from distance field (e.g., "2 km from city center")
                    distanceKm = estimateDistanceFromText(parking.distance);
                }
                
                return {
                    ...parking,
                    calculatedDistance: distanceKm
                };
            })
            .sort((a, b) => a.calculatedDistance - b.calculatedDistance);
    };

    // Estimate distance from text description (fallback)
    const estimateDistanceFromText = (distanceText) => {
        if (!distanceText) return 10; // Default far distance
        
        const match = distanceText.match(/(\d+(?:\.\d+)?)\s*(km|m)/i);
        if (match) {
            const value = parseFloat(match[1]);
            const unit = match[2].toLowerCase();
            
            if (unit === 'km') return value;
            if (unit === 'm') return value / 1000;
        }
        
        // Extract number from text like "2 km from city center"
        const numberMatch = distanceText.match(/(\d+(?:\.\d+)?)/);
        if (numberMatch) {
            return parseFloat(numberMatch[1]);
        }
        
        return 10; // Default far distance
    };

    // Get display distance text - exactly like distance-badge
    const getDistanceText = (parking) => {
        if (!userLocation || !parking.calculatedDistance) {
            return parking.distance || 'Nearby';
        }
        
        const distance = parking.calculatedDistance;
        
        if (distance < 0.1) {
            return `${Math.round(distance * 1000)} m away`;
        } else if (distance < 1) {
            return `${Math.round(distance * 1000)} m away`;
        } else {
            return `${distance.toFixed(1)} km away`;
        }
    };

    // Get area name for display
    const getAreaName = (parking) => {
        return areaNames[parking.id] || "Loading...";
    };

    // Retry location access
    const retryLocation = async () => {
        setLocationLoading(true);
        setLocationError(null);
        
        try {
            const location = await getUserLocation();
            setUserLocation(location);
            
            // Get user's area name
            const area = await getAreaFromCoordinates(location.latitude, location.longitude);
            setUserArea(area);
        } catch (error) {
            setLocationError(error.message);
        } finally {
            setLocationLoading(false);
        }
    };

    const handleParkingSpotClick = (spotId) => {
        navigate(`/parking/${spotId}`);
    };

    const parseParkingFeatures = (description) => {
        if (!description) return [];
        return description.split('•').map(item => item.trim()).filter(item => item);
    };

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
        return `${BASE_URL}${imagePath}`;
    };

    if (loading) {
        return <Spinner />;
    }

    const displayParkings = filteredParkings.length > 0 ? filteredParkings : parkingSpots;

    return (
        <div className="container py-5">
            <div className="row mb-4 text-end">
                <div className="col-12">
                    <button 
                        className="btn btn-outline-secondary mb-3"
                        onClick={() => navigate("/")}
                    >
                        Back to Home
                    </button>
                    
                    <div className="section-header text-center mb-4">
                        <span className="section-badge">ALL PARKINGS</span>
                        <h2 className="section-title">
                            {userLocation ? "Parkings Near You" : "Explore All Locations"}
                        </h2>
                        {userLocation && userArea ? (
                            <p className="section-subtitle">
                                Showing parkings near <strong>{userArea}</strong>, sorted by distance
                            </p>
                        ) : userLocation ? (
                            <p className="section-subtitle">
                                Sorted by distance from your current location
                            </p>
                        ) : (
                            <p className="section-subtitle">
                                Discover available parking spots
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Location Status */}
            {locationError && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="alert alert-warning d-flex justify-content-between align-items-center">
                            <div>
                                <i className="fas fa-location-crosshairs me-2"></i>
                                {locationError}
                            </div>
                            <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={retryLocation}
                                disabled={locationLoading}
                            >
                                {locationLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Detecting...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-redo me-2"></i>
                                        Retry
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {userLocation && !locationError && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="alert alert-success" style={{textAlign: 'center'}}>
                            <i className="fas fa-check-circle me-2"></i>
                            <span>
                                {userArea ? (
                                    <>Showing parkings near <strong>{userArea}</strong></>
                                ) : (
                                    <>Showing parkings near your location</>
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className="row g-4">
                {displayParkings.map((spot, index) => {
                    const features = parseParkingFeatures(spot.description);
                    const isNearby = userLocation && index < 3;
                    
                    return (
                        <div key={spot.id} className="col-lg-4 col-md-6">
                            <div 
                                className="parking-card card h-100 shadow-hover"
                                onClick={() => handleParkingSpotClick(spot.id)}
                                style={{
                                    position: 'relative',
                                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                    cursor: 'pointer',
                                    border: 'none',
                                    borderRadius: '15px',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Distance Ribbon for nearby parkings */}
                                {isNearby && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '10px',
                                        left: '-5px',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        padding: '5px 15px',
                                        borderRadius: '0 20px 20px 0',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        zIndex: 2,
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                    }}>
                                        <i className="fas fa-location-arrow me-1"></i>
                                        {index === 0 ? 'Nearest' : index === 1 ? '2nd Nearest' : '3rd Nearest'}
                                    </div>
                                )}
                                
                                <div style={{
                                    position: 'relative',
                                    overflow: 'hidden',
                                    height: '200px'
                                }}>
                                    <img 
                                        src={getImageUrl(spot.image)} 
                                        className="card-img-top" 
                                        alt={spot.name}
                                        onError={(e) => {
                                            e.target.src = '/images/default-parking.jpg';
                                        }}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            transition: 'transform 0.3s ease'
                                        }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        top: '10px',
                                        right: '10px'
                                    }}>
                                        <span style={{
                                            padding: '5px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            background: spot.available_slots > 0 ? '#28a745' : '#dc3545',
                                            color: 'white'
                                        }}>
                                            {spot.available_slots > 0 ? 
                                                `${spot.available_slots} Slots` : 
                                                'Fully Booked'
                                            }
                                        </span>
                                    </div>
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '10px',
                                        left: '10px',
                                        background: 'rgba(0,0,0,0.8)',
                                        color: 'white',
                                        padding: '5px 12px',
                                        borderRadius: '15px',
                                        fontSize: '0.75rem',
                                        backdropFilter: 'blur(10px)'
                                    }}>
                                        <i className="fas fa-location-dot me-1"></i>
                                        {getDistanceText(spot)}
                                    </div>
                                </div>
                                
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <h5 className="card-title mb-0">{spot.name}</h5>
                                        <div className="rating">
                                            <i className="fas fa-star text-warning"></i>
                                            <span className="ms-1">4.5</span>
                                        </div>
                                    </div>
                                    
                                    {/* Location Area - Dynamic from real coordinates */}
                                    <div style={{
                                        fontSize: '0.9rem',
                                        padding: '8px 12px',
                                        background: '#f8f9fa',
                                        borderRadius: '8px',
                                        borderLeft: '3px solid #007bff',
                                        marginBottom: '1rem'
                                    }}>
                                        <i className="fas fa-map-marker-alt text-primary me-2"></i>
                                        <span className="text-muted">{getAreaName(spot)}</span>
                                    </div>
                                    
                                    {/* Parsed Features */}
                                    <div style={{
                                        maxHeight: '80px',
                                        overflowY: 'auto',
                                        marginBottom: '1rem'
                                    }}>
                                        {features.map((feature, index) => (
                                            <div key={index} style={{
                                                fontSize: '0.85rem',
                                                marginBottom: '5px'
                                            }}>
                                                <i className="fas fa-check-circle text-success me-2"></i>
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Additional Info */}
                                    <div style={{ fontSize: '0.8rem' }}>
                                        <div style={{ marginBottom: '3px' }}>
                                            <i className="fas fa-car me-2"></i>
                                            <span>Total: {spot.total_slots} slots</span>
                                        </div>
                                        <div style={{ marginBottom: '3px' }}>
                                            <i className="fas fa-clock me-2"></i>
                                            <span>24/7 Access</span>
                                        </div>
                                    </div>

                                    <div className="card-footer mt-4 bg-transparent border-0">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div className="price-info">
                                                <div style={{
                                                    fontSize: '1.25rem',
                                                    fontWeight: 'bold',
                                                    color: '#2c3e50'
                                                }}>
                                                    <b>৳</b> {spot.price_per_hour}/hr
                                                </div>
                                                <div className="price-note text-muted" style={{ fontSize: '0.75rem' }}>
                                                    Incl. all taxes
                                                </div>
                                            </div>
                                            <button 
                                                className={`btn ${spot.available_slots > 0 ? 'btn-primary' : 'btn-secondary'}`}
                                                disabled={spot.available_slots === 0}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleParkingSpotClick(spot.id);
                                                }}
                                            >
                                                {spot.available_slots > 0 ? 'Book Now' : 'Fully Booked'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {displayParkings.length === 0 && !loading && (
                <div className="text-center py-5">
                    <div className="empty-state">
                        <i className="fas fa-parking fa-3x text-muted mb-3"></i>
                        <h4>No Parking Spots Available</h4>
                        <p className="text-muted">Check back later for new locations</p>
                    </div>
                </div>
            )}
        </div>
    );
}