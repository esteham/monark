import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ReactDOM from "react-dom";
import { 
  FaCar, 
  FaStar, 
  FaCheckCircle, 
  FaClock, 
  FaMapMarkerAlt, 
  FaChevronLeft, 
  FaChevronRight,
  FaShieldAlt,
  FaQrcode,
  FaBolt,
  FaChartLine,
  FaUsers,
  FaParking
} from "react-icons/fa";
import "./Home.css";

const BASE_URL = "https://monark.xetroot.com";

export default function LandingPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [parkingSpots, setParkingSpots] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showModal, setShowModal] = useState(false); // ✅ Added missing state
    const navigate = useNavigate();

    // Hero Carousel Images
    const heroImages = [
        {
            id: 1,
            image: '/images/parking-hero.png',
            title: 'Smart Parking Solutions',
            bedge: 'PREMIUM PARKING SOLUTION',
            subtitle: 'Find and book premium parking spots in seconds',
            cta: 'Explore',
            link: '/all-parkings'
        },
        {
            id: 2,
            image: '/images/parking-hero-2.jpg',
            title: '24/7 Secure Parking',
            bedge: 'PREMIUM PARKING SOLUTION',
            subtitle: 'Your vehicle is safe with our advanced security systems',
            cta: 'Explore Locations',
            link: '/all-parkings'
        },
        {
            id: 3,
            image: '/images/parking-hero-3.jpg',
            title: 'Premium Car Services',
            bedge: 'PREMIUM SERVICES',
            subtitle: 'Professional cleaning and maintenance for your vehicle',
            cta: 'View Services',
            link: '/services'
        }
    ];

    // Escape key handler for modal
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && showModal) {
                setShowModal(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [showModal]);
    


    // Get full image URL
    const getImageUrl = (image) => {
        if (!image || image === 'null') {
            return '/images/default-parking.jpg';
        }
        
        if (image.startsWith('http')) {
            return image;
        }
        
        const imagePath = image.startsWith('/') ? image.substring(1) : image;
        return `${BASE_URL}/${imagePath}`;
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsLoggedIn(!!token);

        // Auto slide for hero carousel
        const slideInterval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroImages.length);
        }, 5000);

        // Fetch parking spots
        fetch(`${BASE_URL}/api/parkings`)
            .then(res => res.json())
            .then(data => {
                const processedParkings = Array.isArray(data) ? data : (data.data || []);
                const processedWithUrls = processedParkings.map(parking => ({
                    ...parking,
                    image: getImageUrl(parking.image)
                }));
                const latestParkings = processedWithUrls.slice(0, 3);
                setParkingSpots(latestParkings);
            })
            .catch(err => console.error("Error fetching parkings:", err));

        // Fetch services
        fetch(`${BASE_URL}/api/services`)
            .then(res => res.json())
            .then(data => {
                const servicesData = Array.isArray(data) ? data : (data.data || []);
                const processedServices = servicesData.map(service => ({
                    ...service,
                    image: getImageUrl(service.image)
                }));
                const featuredServices = processedServices.slice(0, 3);
                setServices(featuredServices);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching services:", err);
                setLoading(false);
            });

        return () => clearInterval(slideInterval);
    }, []);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
    };

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    const handleParkingSpotClick = (spotId) => {
        navigate(`/parking/${spotId}`);
    };

    const handleServiceClick = (serviceId) => {
        navigate(`/services`);
    };

    const handleViewAllServices = () => {
        navigate("/services");
    };

    const handleViewAllParkings = () => {
        navigate("/all-parkings");
    };

    // Function to parse description and extract features
    const parseParkingFeatures = (description) => {
        if (!description) return [];
        return description.split('•').map(item => item.trim()).filter(item => item);
    };

    // Modal handlers with useCallback
    const handleParkingsClick = useCallback(() => {
        navigate("/all-parkings");
        setShowModal(false);
    }, [navigate]);

    const handleServicesClick = useCallback(() => {
        navigate("/all-services");
        setShowModal(false);
    }, [navigate]);

    const handleCloseModal = useCallback(() => {
        setShowModal(false);
    }, []);

    const handleOpenModal = useCallback(() => {
        setShowModal(true);
    }, []);

    return (
        <div className="landing-home-page">
            {/* Enhanced Hero Section with Carousel */}
            <section className="home-hero-section">
                <div className="home-hero-carousel">
                    {heroImages.map((slide, index) => (
                        <div 
                            key={slide.id}
                            className={`home-hero-slide ${index === currentSlide ? 'active' : ''}`}
                            style={{ backgroundImage: `url(${slide.image})` }}
                        >
                            <div className="home-hero-overlay"></div>
                            <div className="home-hero-content">
                                <div className="container">
                                    <div className="row justify-content-center text-center">
                                        <div className="col-lg-12 col-md-12">
                                            <div className="home-hero-badge">{slide.bedge}</div>
                                            <h1 className="home-hero-title">
                                                {slide.title}
                                            </h1>
                                            <p className="home-hero-subtitle">
                                                {slide.subtitle}
                                            </p>
                                            <div className="home-hero-cta">
                                                <button
                                                    className="btn home-btn-neon-primary btn-lg"
                                                    onClick={() => navigate(slide.link)}
                                                >
                                                    {slide.cta}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Carousel Controls */}
                <button className="home-carousel-control prev" onClick={prevSlide}>
                    <FaChevronLeft />
                </button>
                <button className="home-carousel-control next" onClick={nextSlide}>
                    <FaChevronRight />
                </button>

                {/* Carousel Indicators */}
                <div className="home-carousel-indicators">
                    {heroImages.map((_, index) => (
                        <button
                            key={index}
                            className={`home-indicator ${index === currentSlide ? 'active' : ''}`}
                            onClick={() => goToSlide(index)}
                        />
                    ))}
                </div>
            </section>

            {/* Trusted By Section */}
            <section className="home-trusted-section">
                <div className="container-fluid px-5">
                    <div className="row align-items-center">
                        <div className="col-md-3 text-center text-md-start">
                            <span className="home-trusted-label">Trusted by Industry Leaders</span>
                        </div>
                        <div className="col-md-9">
                            <div className="home-trusted-logos">
                                {['City Corporation', 'Mega Mall', 'Grand Hotel', 'Plaza Center', 'Tech Park'].map((logo, index) => (
                                    <span key={index} className="home-logo-item">
                                        {logo}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid Section */}
            <section className="home-features-section">
                <div className="container">
                    <div className="home-section-header text-center mb-5">
                        <span className="home-section-badge">WHY CHOOSE US</span>
                    </div>
                    <div className="row g-4">
                        {[
                            {
                                icon: <FaBolt />,
                                title: 'Instant Booking',
                                desc: 'Real-time availability and instant confirmation'
                            },
                            {
                                icon: <FaShieldAlt />,
                                title: 'Military Grade Security',
                                desc: '24/7 surveillance and advanced security systems'
                            },
                            {
                                icon: <FaQrcode />,
                                title: 'Digital Access',
                                desc: 'Seamless entry and exit with QR technology'
                            },
                            {
                                icon: <FaChartLine />,
                                title: 'Smart Analytics',
                                desc: 'AI-powered insights and occupancy tracking'
                            },
                            {
                                icon: <FaUsers />,
                                title: 'Premium Support',
                                desc: 'Dedicated customer service team'
                            },
                            {
                                icon: <FaParking />,
                                title: 'Valet Service',
                                desc: 'Professional valet parking available'
                            }
                        ].map((feature, index) => (
                            <div key={index} className="col-lg-4 col-md-6">
                                <div className="home-feature-card">
                                    <div className="home-feature-icon">
                                        {feature.icon}
                                    </div>
                                    <h5>{feature.title}</h5>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Latest Parking Spots Section */}
            <section className="home-parking-section">
                <div className="container-fluid px-5">
                    <div className="home-section-header text-center mb-5">
                        <span className="home-section-badge">PARKING LOCATIONS</span>
                    </div>
                    
                    <div className="row g-4">
                        {parkingSpots.map((spot) => {
                            const features = parseParkingFeatures(spot.description);
                            return (
                                <div key={spot.id} className="col-lg-4 col-md-6 p-4">
                                    <div 
                                        className="home-parking-card h-100"
                                        onClick={() => handleParkingSpotClick(spot.id)}
                                    >
                                        <div className="home-card-image">
                                            <img 
                                                src={spot.image} 
                                                className="home-card-img" 
                                                alt={spot.name}
                                                onError={(e) => {
                                                    e.target.src = '/images/default-parking.jpg';
                                                }}
                                            />
                                            <div className="home-card-badge">
                                                <span className={`home-availability-badge ${spot.available_slots > 0 ? 'available' : 'full'}`}>
                                                    {spot.available_slots > 0 ? 
                                                        `${spot.available_slots} Available` : 
                                                        'Fully Booked'
                                                    }
                                                </span>
                                            </div>
                                            <div className="home-distance-badge">
                                                <FaMapMarkerAlt className="me-1" />
                                                {spot.distance || 'Premium Location'}
                                            </div>
                                        </div>
                                        <div className="home-card-body">
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <h5 className="home-card-title mb-0">{spot.name}</h5>
                                                <div className="home-rating">
                                                    <FaStar className="home-rating-star" />
                                                    <span className="ms-1">4.8</span>
                                                </div>
                                            </div>
                                            
                                            <div className="home-features-list mb-3">
                                                {features.map((feature, index) => (
                                                    <div key={index} className="home-feature-item">
                                                        <FaCheckCircle className="me-2" />
                                                        <span>{feature}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="home-card-meta">
                                                <div className="home-meta-item">
                                                    <FaCar className="me-2" />
                                                    <span>{spot.total_slots} Total Slots</span>
                                                </div>
                                                <div className="home-meta-item">
                                                    <FaClock className="me-2" />
                                                    <span>24/7 Access</span>
                                                </div>
                                            </div>

                                            <div className="home-card-footer">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div className="home-price-info">
                                                        <div className="home-price-amount">৳ {spot.price_per_hour}/hr</div>
                                                        <div className="home-price-note">All inclusive</div>
                                                    </div>
                                                    <button 
                                                        className={`btn ${spot.available_slots > 0 ? 'home-btn-neon-primary' : 'home-btn-neon-secondary'}`}
                                                        disabled={spot.available_slots === 0}
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

                    {parkingSpots.length === 0 && !loading && (
                        <div className="text-center py-5">
                            <div className="home-empty-state">
                                <FaCar className="home-empty-icon mb-3" />
                                <h4>No Parking Spots Available</h4>
                                <p>Premium locations coming soon</p>
                            </div>
                        </div>
                    )}

                    <div className="text-center mt-5">
                        <button 
                            className="btn home-btn-neon-outline btn-lg px-5"
                            onClick={handleViewAllParkings}
                        >
                            <FaMapMarkerAlt className="me-2" />
                            Explore All Locations
                        </button>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className="home-services-section">
                <div className="container-fluid px-5">
                    <div className="home-section-header text-center mb-5">
                        <span className="home-section-badge">PREMIUM SERVICES</span>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <div className="home-spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-3">Loading elite services...</p>
                        </div>
                    ) : (
                        <>
                            <div className="row g-4">
                                {services.map((service) => (
                                    <div key={service.id} className="col-lg-4 col-md-6 p-4">
                                        <div 
                                            className="home-service-card h-100"
                                            onClick={() => handleServiceClick(service.id)}
                                        >
                                            <div className="home-service-image">
                                                <img 
                                                    src={service.image} 
                                                    alt={service.name}
                                                    className="home-service-img"
                                                    onError={(e) => {
                                                        e.target.src = '/images/default-service.jpg';
                                                    }}
                                                />
                                                <div className="home-service-overlay">
                                                    <span className="home-service-price">
                                                        ৳ {service.price}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="home-service-content">
                                                <h5 className="home-service-title">{service.name}</h5>
                                                <p className="home-service-description">
                                                    {service.description}
                                                </p>
                                                <div className="home-service-meta">
                                                    <div className="home-service-duration">
                                                        <FaClock className="me-2" />
                                                        <span>{service.duration}</span>
                                                    </div>
                                                    <div className="home-service-rating">
                                                        <FaStar className="me-1" />
                                                        <span>4.5</span>
                                                    </div>
                                                </div>
                                                <div className="home-service-footer">
                                                    <button className="btn home-btn-neon-primary w-100">
                                                        Book This Service
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {services.length === 0 && !loading && (
                                <div className="text-center py-5">
                                    <div className="home-empty-state">
                                        <FaCar className="home-empty-icon mb-3" />
                                        <h4>Premium Services Coming Soon</h4>
                                        <p>Elite car care services launching soon</p>
                                    </div>
                                </div>
                            )}

                            <div className="text-center mt-5">
                                <button 
                                    className="btn home-btn-neon-outline btn-lg px-5"
                                    onClick={handleViewAllServices}
                                >
                                    <FaCar className="me-2" />
                                    View All Services
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Stats Section */}
            <section className="home-stats-section">
                <div className="container">
                    <div className="row text-center">
                        {[
                            { number: '1000+', label: 'Premium Bookings', icon: <FaCar /> },
                            { number: '50+', label: 'Elite Locations', icon: <FaMapMarkerAlt /> },
                            { number: '50,000+', label: 'Satisfied Clients', icon: <FaUsers /> },
                            { number: '24/7', label: 'Concierge Support', icon: <FaClock /> }
                        ].map((stat, index) => (
                            <div key={index} className="col-lg-3 col-md-6 mb-4">
                                <div className="home-stat-box">
                                    <div className="home-stat-icon">
                                        {stat.icon}
                                    </div>
                                    <h3 className="home-stat-number">{stat.number}</h3>
                                    <p className="home-stat-label">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="home-cta-section">
                <div className="container-fluid px-5">
                    <div className="home-cta-card">
                        <div className="row align-items-center">
                            <div className="col-lg-8">
                                <h2 className="home-cta-title">Ready for Elite Parking Experience?</h2>
                                <p className="home-cta-subtitle">
                                    Join thousands of premium users and experience the future of parking
                                </p>
                                <div className="home-cta-features">
                                    {['No Hidden Charges', 'Instant Confirmation', 'Premium Support', 'Secure Payments'].map((feature, index) => (
                                        <span key={index} className="home-cta-feature-item">
                                            <FaCheckCircle className="me-2" />
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="col-lg-4 text-lg-end">
                                <button 
                                    className="btn home-btn-neon-primary btn-lg px-5"
                                    onClick={() => setShowModal(true)}
                                >
                                    Get Started Today
                                </button>

                                {/* Professional Modal */}
                                {showModal && ReactDOM.createPortal(
                                    <div className="home-modal-overlay" onClick={() => setShowModal(false)}>
                                        <div className="home-modal-content" onClick={(e) => e.stopPropagation()}>
                                            {/* Modal Body - Fixed Height */}
                                            <div className="home-modal-body">
                                                <div className="home-modal-features mb-4">
                                                    <div className="row text-center">
                                                        <div className="col-6">
                                                            <div className="home-feature-badge text-light">
                                                                <FaCheckCircle className="text-success me-2" />
                                                                No Hidden Charges
                                                            </div>
                                                        </div>
                                                        <div className="col-6">
                                                            <div className="home-feature-badge text-light">
                                                                <FaCheckCircle className="text-success me-2" />
                                                                Instant Confirmation
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="row g-4">
                                                    <div className="col-md-6">
                                                        <div 
                                                            className="home-modal-option-card"
                                                            onClick={() => {
                                                                navigate("/all-parkings");
                                                                setShowModal(false);
                                                            }}
                                                        >
                                                            <div className="home-option-icon parking">
                                                                <FaParking />
                                                            </div>
                                                            <h5>Find Parking</h5>
                                                            
                                                            <div className="home-option-features mx-5 p-3">
                                                                <span><FaCheckCircle /> Real-time availability</span>
                                                                <span><FaCheckCircle /> Secure locations</span>
                                                                <span><FaCheckCircle /> Instant booking</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="col-md-6">
                                                        <div 
                                                            className="home-modal-option-card"
                                                            onClick={() => {
                                                                navigate("/all-services");
                                                                setShowModal(false);
                                                            }}
                                                        >
                                                            <div className="home-option-icon service">
                                                                <FaCar />
                                                            </div>
                                                            <h5>Car Services</h5>
                                                            <div className="home-option-features mx-5 p-3">
                                                                <span><FaCheckCircle /> Professional service</span>
                                                                <span><FaCheckCircle /> Quality guaranteed</span>
                                                                <span><FaCheckCircle /> Quick delivery</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>                                            
                                        </div>
                                    </div>,
                                    document.body
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}