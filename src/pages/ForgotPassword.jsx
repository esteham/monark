import React, { useState } from "react";
import { forgotPassword } from "../api/client";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const data = await forgotPassword(email);
      
      if (data.success) {
        setMessage("Password reset link has been sent to your email!");
        setIsError(false);
        setEmailSent(true);
      } else {
        setMessage(data.message || "Failed to send reset link");
        setIsError(true);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      // Handle validation errors
      if (error.errors && error.errors.email) {
        setMessage(error.errors.email[0]);
      } else {
        setMessage(error.message || "An error occurred. Please try again.");
      }
      setIsError(true);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-xl-4 col-lg-4 col-md-5 col-sm-8">
            <div className="card border-0 shadow-lg rounded-4">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold text-dark">Forgot Password</h2>
                  <p className="text-muted mt-2">
                    {emailSent 
                      ? "Check your email for reset instructions" 
                      : "Enter your email to receive a password reset link"
                    }
                  </p>
                </div>

                {/* Message Alert */}
                {message && (
                  <div
                    className={`alert mb-4 rounded-2 ${
                      isError ? "alert-danger" : "alert-success"
                    }`}
                  >
                    {message}
                  </div>
                )}

                {!emailSent ? (
                  // Request Reset Form
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <input
                        type="email"
                        className="form-control form-control-lg rounded-2 border-0 bg-light"
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        value={email}
                        style={{ padding: "12px 16px" }}
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg w-100 rounded-2 fw-semibold py-2"
                      disabled={isLoading}
                      style={{
                        background: "linear-gradient(45deg, #3b82f6, #1d4ed8)",
                        border: "none",
                        fontSize: "1.1rem",
                      }}
                    >
                      {isLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          ></span>
                          Sending...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </button>
                  </form>
                ) : (
                  // Success Message
                  <div className="text-center">
                    <div className="mb-4">
                      <i className="fas fa-check-circle text-success fa-3x mb-3"></i>
                      <p className="text-muted">
                        We've sent password reset instructions to your email address.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEmailSent(false);
                        setEmail("");
                        setMessage("");
                      }}
                      className="btn btn-outline-primary btn-lg w-100 rounded-2 fw-semibold py-2"
                    >
                      Try Another Email
                    </button>
                  </div>
                )}

                {/* Back to Login */}
                <div className="text-center mt-4">
                  <p className="text-muted mb-0">
                    Remember your password?{" "}
                    <Link
                      to="/login"
                      className="text-primary fw-semibold text-decoration-none ms-1"
                    >
                      Back to Sign in
                    </Link>
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