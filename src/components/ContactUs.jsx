import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Contact.css';

const ContactPage = () => {
    const [contactData, setContactData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');

    useEffect(() => {
        fetchContactData();
    }, []);

    const fetchContactData = async () => {
        try {
            const response = await axios.get('/api/contact-page');
            setContactData(response.data);
        } catch (error) {
            console.error('Error fetching contact data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitMessage('');

        try {
            // Here you would typically send the form data to your backend
            const response = await axios.post('/api/contact-form', formData);
            
            setSubmitMessage('Thank you for your message! We will get back to you soon.');
            setFormData({
                name: '',
                email: '',
                phone: '',
                subject: '',
                message: ''
            });
        } catch (error) {
            console.error('Error sending message:', error);
            setSubmitMessage('Sorry, there was an error sending your message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (!contactData) return <div className="error">No data found</div>;

    // Parse JSON fields
    const businessHours = contactData.business_hours ? JSON.parse(contactData.business_hours) : {};
    const socialLinks = contactData.social_links ? JSON.parse(contactData.social_links) : {};

    return (
        <div className="contact-page">
            {/* Hero Section */}
            <section className="contact-hero">
                <div className="container">
                    <div className="row">
                        <div className="col-12 text-center">
                            <h1 className="hero-title">{contactData.title}</h1>
                            <p className="hero-subtitle">{contactData.subtitle}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Information & Form Section */}
            <section className="contact-main-section">
                <div className="container">
                    <div className="row">
                        {/* Contact Information */}
                        <div className="col-lg-4">
                            <div className="contact-info-card">
                                <h2 className="section-title">Get In Touch</h2>
                                <p className="contact-description">
                                    We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                                </p>

                                <div className="contact-details">
                                    <div className="contact-item">
                                        <div className="contact-icon">
                                            <i className="fas fa-map-marker-alt"></i>
                                        </div>
                                        <div className="contact-text">
                                            <h4>Address</h4>
                                            <p>{contactData.address}</p>
                                        </div>
                                    </div>

                                    <div className="contact-item">
                                        <div className="contact-icon">
                                            <i className="fas fa-phone"></i>
                                        </div>
                                        <div className="contact-text">
                                            <h4>Phone</h4>
                                            <p>{contactData.phone}</p>
                                        </div>
                                    </div>

                                    <div className="contact-item">
                                        <div className="contact-icon">
                                            <i className="fas fa-envelope"></i>
                                        </div>
                                        <div className="contact-text">
                                            <h4>Email</h4>
                                            <p>{contactData.email}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Business Hours */}
                                <div className="business-hours">
                                    <h3 className="hours-title">Business Hours</h3>
                                    {Object.entries(businessHours).map(([day, hours]) => (
                                        <div key={day} className="hours-item">
                                            <span className="day">{day}</span>
                                            <span className="time">{hours}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Social Links */}
                                <div className="social-links">
                                    <h3 className="social-title">Follow Us</h3>
                                    <div className="social-icons">
                                        {socialLinks.facebook && (
                                            <a href={socialLinks.facebook} className="social-icon">
                                                <i className="fab fa-facebook-f"></i>
                                            </a>
                                        )}
                                        {socialLinks.twitter && (
                                            <a href={socialLinks.twitter} className="social-icon">
                                                <i className="fab fa-twitter"></i>
                                            </a>
                                        )}
                                        {socialLinks.linkedin && (
                                            <a href={socialLinks.linkedin} className="social-icon">
                                                <i className="fab fa-linkedin-in"></i>
                                            </a>
                                        )}
                                        {socialLinks.instagram && (
                                            <a href={socialLinks.instagram} className="social-icon">
                                                <i className="fab fa-instagram"></i>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="col-lg-8">
                            <div className="contact-form-card">
                                <h2 className="form-title">{contactData.form_title}</h2>
                                <p className="form-subtitle">{contactData.form_subtitle}</p>

                                {submitMessage && (
                                    <div className={`alert ${submitMessage.includes('error') ? 'alert-error' : 'alert-success'}`}>
                                        {submitMessage}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="contact-form">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label htmlFor="name">Full Name *</label>
                                                <input
                                                    type="text"
                                                    id="name"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    required
                                                    placeholder="Enter your full name"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label htmlFor="email">Email Address *</label>
                                                <input
                                                    type="email"
                                                    id="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    required
                                                    placeholder="Enter your email"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label htmlFor="phone">Phone Number</label>
                                                <input
                                                    type="tel"
                                                    id="phone"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter your phone number"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label htmlFor="subject">Subject *</label>
                                                <input
                                                    type="text"
                                                    id="subject"
                                                    name="subject"
                                                    value={formData.subject}
                                                    onChange={handleInputChange}
                                                    required
                                                    placeholder="Enter subject"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="message">Message *</label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleInputChange}
                                            required
                                            rows="6"
                                            placeholder="Enter your message..."
                                        ></textarea>
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="submit-btn"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin"></i>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-paper-plane"></i>
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Map Section */}
            {contactData.map_embed && (
                <section className="map-section">
                    <div className="container">
                        <div className="row">
                            <div className="col-12">
                                <h2 className="section-title text-center">Find Us</h2>
                                <div 
                                    className="map-container"
                                    dangerouslySetInnerHTML={{ __html: contactData.map_embed }} 
                                />
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default ContactPage;
