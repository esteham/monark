import React, { useEffect, useState, useRef } from "react";
import { getContact } from "../api/client";
import Spinner from "../components/Spinner";

export default function Contact() {
  const [contact, setContact] = useState(null);
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    subject: "", 
    message: "" 
    // phone field remove করা হয়েছে
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mapContainerRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContactData();
  }, []);

  const fetchContactData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('https://monark.xetroot.com/api/contact');
      
      if (!response.ok) {
        throw new Error('Failed to fetch contact data');
      }
      
      const data = await response.json();
      const contactData = data && data.length > 0 ? data[0] : getDefaultContactData();
      setContact(contactData);
      
      setTimeout(() => {
        if (contactData.map_embed && mapContainerRef.current) {
          mapContainerRef.current.innerHTML = contactData.map_embed;
        }
      }, 100);
      
    } catch (err) {
      console.error("Error fetching contact info:", err);
      setContact(getDefaultContactData());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContactData = () => {
    return {
      address: "Chasara, Narayanganj, Dhaka",
      phone: "+8801900000000",
      email: "shimzo@gmail.com",
      map_embed: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3655.448575332718!2d90.49608087589432!3d23.62410129361235!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755b10941d09f3f%3A0x9e53c62023606a5!2sChashara%2C%20Narayanganj!5e0!3m2!1sen!2sbd!4v1759514933929!5m2!1sen!2sbd" width="100%" height="250" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>'
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('https://monark.xetroot.com/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form) // শুধু form data send করছি, phone নেই
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      alert(result.message || "Message sent successfully!");
      setForm({ 
        name: "", 
        email: "", 
        subject: "", 
        message: "" 
      });
      
    } catch (err) {
      console.error("Error sending message:", err);
      alert(err.message || "Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Spinner />;
  if (!contact) return <div className="text-center py-5"><p>No contact information available.</p></div>;

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold text-primary mb-3">Get In Touch</h1>
        <p className="lead text-muted">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
      </div>

      <div className="row">
        <div className="col-lg-5">
          <div className="card border-0 shadow-lg h-100">
            <div className="card-body p-4 d-flex flex-column">
              <h4 className="card-title text-primary mb-5">Contact Information</h4>
              
              <div className="d-flex align-items-start mb-4">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                  <i className="fas fa-map-marker-alt text-primary"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Our Address</h6>
                  <p className="text-muted mb-0">{contact.address}</p>
                </div>
              </div>

              <div className="d-flex align-items-start mb-4">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                  <i className="fas fa-phone text-primary"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Phone Number</h6>
                  <p className="text-muted mb-0">{contact.phone}</p>
                </div>
              </div>

              <div className="d-flex align-items-start mb-4">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                  <i className="fas fa-envelope text-primary"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Email Address</h6>
                  <p className="text-muted mb-0">{contact.email}</p>
                </div>
              </div>

              {contact.map_embed && (
                <div className="mt-auto">
                  <h6 className="fw-bold mb-3">Find Us Here</h6>
                  <div 
                    ref={mapContainerRef}
                    className="rounded overflow-hidden shadow-sm"
                    style={{ minHeight: '250px' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card border-0 shadow-lg h-100">
            <div className="card-body p-4 d-flex flex-column">
              <h4 className="card-title text-primary mb-4">Send Us a Message</h4>
              
              <form onSubmit={handleSubmit} className="flex-grow-1 d-flex flex-column">
                <div className="row">
                  <div className="col-md-6 mb-4">
                    <input
                      className="form-control form-control-lg"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your full name *"
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-4">
                    <input
                      className="form-control form-control-lg"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Your email address *"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <input
                    className="form-control form-control-lg"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="Subject *"
                    required
                  />
                </div>

                <div className="mb-4 flex-grow-1">
                  <textarea
                    className="form-control form-control-lg h-100"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Your message *"
                    required
                    style={{ minHeight: "150px", resize: "none" }}
                  />
                </div>

                <div className="mt-auto pt-3">
                  <button 
                    className="btn btn-primary btn-lg px-5 py-3 w-100" 
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-2"></i>
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-5">
        <div className="col-12">
          <div className="card border-0 bg-light">
            <div className="card-body text-center p-4">
              <h5 className="text-primary mb-3">We're Here to Help</h5>
              <p className="text-muted mb-0">
                Our team typically responds within 24 hours. For urgent matters, please call us directly at {contact.phone}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}