import React, { useState } from "react";
import { resetPassword } from "../api/client";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    password: "",
    password_confirmation: ""
  });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!token || !email) {
    setMessage("Invalid reset link");
    setIsError(true);
    return;
  }

  setIsLoading(true);
  setMessage("");
  setIsError(false);

  try {
    const resetData = {
      token,
      email,
      password: form.password,
      password_confirmation: form.password_confirmation
    };

    const data = await resetPassword(resetData);
    
    if (data.success) {
      setMessage("Password reset successfully! Redirecting to login...");
      setIsError(false);
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } else {
      setMessage(data.message || "Failed to reset password");
      setIsError(true);
    }
  } catch (error) {
    console.error('Reset password error:', error);
    
    // Specific error handling
    if (error.message?.includes('Invalid or expired')) {
      setMessage("This reset link is invalid or has expired. Please request a new password reset.");
    } else if (error.message?.includes('Password must be')) {
      setMessage("Password must be at least 8 characters long.");
    } else if (error.message?.includes('confirmation does not match')) {
      setMessage("Password confirmation does not match. Please try again.");
    } else {
      setMessage(error.message || "An error occurred. Please try again.");
    }
    setIsError(true);
  }

  setIsLoading(false);
};

  if (!token || !email) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="container text-center">
          <div className="alert alert-danger">
            <h4>Invalid Reset Link</h4>
            <p>The password reset link is invalid or has expired.</p>
            <a href="/forgot-password" className="btn btn-primary">
              Request New Link
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-xl-4 col-lg-4 col-md-5 col-sm-8">
            <div className="card border-0 shadow-lg rounded-4">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold text-dark">Reset Password</h2>
                  <p className="text-muted mt-2">
                    Enter your new password
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

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <input
                      name="password"
                      type="password"
                      className="form-control form-control-lg rounded-2 border-0 bg-light"
                      onChange={handleChange}
                      placeholder="New Password"
                      required
                      minLength="8"
                      value={form.password}
                      style={{ padding: "12px 16px" }}
                    />
                    <div className="form-text">Password must be at least 8 characters</div>
                  </div>
                  <div className="mb-4">
                    <input
                      name="password_confirmation"
                      type="password"
                      className="form-control form-control-lg rounded-2 border-0 bg-light"
                      onChange={handleChange}
                      placeholder="Confirm New Password"
                      required
                      value={form.password_confirmation}
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
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </form>

                {/* Back to Login */}
                <div className="text-center mt-4">
                  <p className="text-muted mb-0">
                    <a
                      href="/login"
                      className="text-primary fw-semibold text-decoration-none"
                    >
                      Back to Sign in
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