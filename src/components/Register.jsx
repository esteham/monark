import React, { useState } from "react";
import { registerUser } from "../api/client";
import { useNavigate } from "react-router-dom";

export default function Register() {
    const [form, setForm] = useState({ name:"", email:"", password:"", password_confirmation:"" });
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        const formData = new FormData();
        Object.keys(form).forEach(key => formData.append(key, form[key]));

        const data = await registerUser(formData);

        if (data.status === "success") {
            setMessage("Registration successful! Redirecting to login...");
            setTimeout(() => {
                navigate("/login");
            }, 2500);
        } else {
            setMessage(data.message || "Something went wrong!");
        }

        setLoading(false);
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="container-fluid">
                <div className="row justify-content-center">
                    <div className="col-xl-5 col-lg-4 col-md-5 col-sm-8">
                        <div className="card border-0 shadow-lg rounded-4">
                            <div className="card-body p-5">
                                {/* Logo/Brand Section */}
                                <div className="text-center mb-5">
                                    <h2 className="fw-bold text-dark">Create Account</h2>
                                    {/*<p className="text-muted">Register a new account</p>*/}
                                </div>

                                {/* Message Alert */}
                                {message && (
                                    <div className={`alert ${message.includes('successful') ? 'alert-success' : 'alert-info'} rounded-2 mb-4`}>
                                        {message}
                                    </div>
                                )}

                                {/* Register Form */}
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <input
                                            name="name"
                                            type="text"
                                            className="form-control form-control-lg rounded-2 border-0 bg-light"
                                            onChange={handleChange}
                                            placeholder="Full Name"
                                            required
                                            style={{padding: '12px 16px'}}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <input
                                            name="email"
                                            type="email"
                                            className="form-control form-control-lg rounded-2 border-0 bg-light"
                                            onChange={handleChange}
                                            placeholder="Email"
                                            required
                                            style={{padding: '12px 16px'}}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <input
                                            name="password"
                                            type="password"
                                            className="form-control form-control-lg rounded-2 border-0 bg-light"
                                            onChange={handleChange}
                                            placeholder="Password"
                                            required
                                            style={{padding: '12px 16px'}}
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <input
                                            name="password_confirmation"
                                            type="password"
                                            className="form-control form-control-lg rounded-2 border-0 bg-light"
                                            onChange={handleChange}
                                            placeholder="Confirm Password"
                                            required
                                            style={{padding: '12px 16px'}}
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary btn-lg w-100 rounded-2 fw-semibold py-2"
                                        disabled={loading}
                                        style={{
                                            background: 'linear-gradient(45deg, #3b82f6, #1d4ed8)',
                                            border: 'none',
                                            fontSize: '1.1rem'
                                        }}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Registering...
                                            </>
                                        ) : (
                                            'Register'
                                        )}
                                    </button>
                                </form>

                                {/* Additional Links */}
                                <div className="text-center mt-4">
                                    <p className="text-muted mb-2">
                                        Already have an account? 
                                        <a href="/login" className="text-primary fw-semibold text-decoration-none ms-1">
                                            Sign In
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center mt-4">
                            <p className="text-muted small">
                                &copy; {new Date().getFullYear()} MONARK. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
