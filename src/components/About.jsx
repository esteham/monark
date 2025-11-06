import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAbout } from "../api/client";
import './css/About.css';
import Spinner from "../components/Spinner";

export default function About() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getAbout().then(res => setData(res.data)).catch(console.error);
  }, []);

  if (!data) return <Spinner />;

  const { about, team } = data;
  
  // Founder আলাদা করুন (প্রথম member কে founder ধরে নিচ্ছি)
  const founder = team.length > 0 ? team[0] : null;
  const otherTeamMembers = team.length > 1 ? team.slice(1) : [];

  return (
    <div className="container py-5 mb-5">
      {/* Hero Section */}
      <div className="row align-items-center mb-5">
        <div className="col-lg-6">
          <h1 className="display-4 fw-bold text-dark mb-3">{about?.title}</h1>
          <p className="lead text-muted mb-4">{about?.story}</p>
          <div className="d-flex gap-3">
            <a href="/" className="btn btn-primary px-4 py-2 rounded-pill">
              Learn More
            </a>
            <a href="/contact" className="btn btn-outline-primary px-4 py-2 rounded-pill">
              Contact Us
            </a>
          </div>
        </div>
        {about?.image && (
          <div className="col-lg-6 mt-4 mt-lg-0">
            <img 
              src={about.image} 
              className="img-fluid rounded-3 shadow" 
              alt="about" 
              style={{maxHeight: '400px', objectFit: 'cover', width: '100%'}}
            />
          </div>
        )}
      </div>

      {/* Mission & Vision Cards */}
      <div className="row mb-5">
        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm h-100 hover-lift">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <div className="bg-primary bg-opacity-10 p-3 rounded-3 me-3">
                  <i className="fas fa-bullseye text-primary fs-4"></i>
                </div>
                <div>
                  <h4 className="card-title mb-0 text-dark">Our Mission</h4>
                  <div className="bg-primary mt-2" style={{width: '40px', height: '3px'}}></div>
                </div>
              </div>
              <p className="card-text text-muted mb-0">{about?.mission}</p>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="card border-0 shadow-sm h-100 hover-lift">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <div className="bg-info bg-opacity-10 p-3 rounded-3 me-3">
                  <i className="fas fa-eye text-info fs-4"></i>
                </div>
                <div>
                  <h4 className="card-title mb-0 text-dark">Our Vision</h4>
                  <div className="bg-info mt-2" style={{width: '40px', height: '3px'}}></div>
                </div>
              </div>
              <p className="card-text text-muted mb-0">{about?.vision}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Story Section */}
      {/*<div className="row mb-5">
        <div className="col-12">
          <div className="card border-0 bg-light-subtle">
            <div className="card-body p-4">
              <h3 className="text-center mb-3 text-dark">Our Story</h3>
              <p className="text-muted text-center mb-0" style={{lineHeight: '1.8', fontSize: '1.1rem'}}>
                {about?.story}
              </p>
            </div>
          </div>
        </div>
      </div>*/}

      {/* Founder Section */}
      {founder && (
        <div className="row my-5 ">
          <div className="col-12">
            {/*<div className="text-center mb-4">
              <h2 className="fw-bold text-dark">Our Founder</h2>
              <p className="text-muted">The visionary behind our success</p>
            </div>*/}
            <div className="card border-0 shadow-lg">
              <div className="card-body p-4">
                <div className="row align-items-center">
                  <div className="col-md-3 text-center">
                    <div className="founder-image mx-auto mb-3 mb-md-0">
                      <img 
                        src={founder.image} 
                        className="rounded-circle shadow"
                        alt={founder.name}
                        style={{
                          width: '180px',
                          height: '180px',
                          objectFit: 'cover',
                          border: '4px solid #fff',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-md-9">
                    <h3 className="fw-bold text-dark mb-2">{founder.name}</h3>
                    <div className="text-primary py-1 d-inline-block mb-3">
                      Founder & CEO
                    </div>
                    <p className="text-muted mb-3" style={{fontSize: '1.1rem', lineHeight: '1.6'}}>
                      "{founder.bio}"
                    </p>
                    <div className="border-start border-3 border-primary ps-3">
                      <p className="text-muted mb-0 fst-italic">
                        "Driving innovation and excellence in everything we do."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Section */}
      {otherTeamMembers.length > 0 && (
        <div className="row">
          <div className="col-12 text-center mb-5 mt-5">
            <h2 className="fw-bold text-dark">Meet Our Team</h2>
          </div>
          
          {otherTeamMembers.map(member => (
            <div className="col-lg-3 col-md-3 col-sm-6 mb-5" key={member.id}>
              <div className="card border-0 shadow-sm h-100 team-card-hover position-relative overflow-hidden">
                {/* Profile Image with Gradient Overlay */}
                <div className="team-image-container position-relative">
                  <img 
                    src={member.image} 
                    className="team-member-img"
                    alt={member.name}
                  />
                  <div className="position-absolute top-0 start-0 w-100 h-100 bg-gradient-overlay"></div>
                </div>
                
                {/* Content Section */}
                <div className="card-body p-3 text-center">
                  <h5 className="fw-bold text-dark mb-1">{member.name}</h5>
                  <p className="text-primary fw-semibold mb-2 small">{member.position}</p>
                  {/*<p className="text-muted small mb-3 line-clamp-3">{member.bio}</p>*/}
                </div>
                
                {/* Social Links with Better Styling */}
                <div className="card-footer bg-transparent border-0 text-center pb-3 pt-0">
                  <div className="d-flex justify-content-center gap-2">
                    <a href="#" className="btn btn-outline-primary btn-sm rounded-circle p-2 social-btn">
                      <i className="fab fa-linkedin-in"></i>
                    </a>
                    <a href="#" className="btn btn-outline-primary btn-sm rounded-circle p-2 social-btn">
                      <i className="fab fa-twitter"></i>
                    </a>
                    <a href="#" className="btn btn-outline-primary btn-sm rounded-circle p-2 social-btn">
                      <i className="fab fa-github"></i>
                    </a>
                  </div>
                </div>
                
                {/* Hover Effect Border */}
                <div className="card-hover-border"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA Section */}
      {/*<div className="row mt-5">
        <div className="col-12">
          <div className="card border-0 bg-primary text-white">
            <div className="card-body p-4 text-center">
              <h3 className="mb-3">Ready to work with us?</h3>
              <p className="mb-4 opacity-75">Let's create something amazing together</p>
              <button className="btn btn-light px-4 py-2 fw-semibold rounded-pill">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>*/}

    </div>
  );
}