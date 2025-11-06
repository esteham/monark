// src/pages/Login.jsx
import React, { useState, useContext } from "react";
import { loginUser } from "../api/client";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      setMessage("");
      setIsError(false);

      const data = await loginUser(form);

      if (data.access_token && data.user) {
        // Successful login
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        setMessage("Login successful! Redirecting...");
        setIsError(false);

        setTimeout(() => {
          if (data.user.role === "admin") navigate("/admin");
          else if (data.user.role === "manager") navigate("/manager");
          else if (data.user.role === "mechanic") navigate("/mechanic/dashboard");
          else navigate("/dashboard");
        }, 1000);
      } else {
        // Show friendly error message
        setMessage(data.message || "Login failed");
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
                <div className="text-center mb-5">
                  <h2 className="fw-bold text-dark">Sign in</h2>
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

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <input
                      name="email"
                      type="email"
                      className="form-control form-control-lg rounded-2 border-0 bg-light"
                      onChange={handleChange}
                      placeholder="Email"
                      required
                      value={form.email}
                      style={{ padding: "12px 16px" }}
                    />
                  </div>
                  <div className="mb-4">
                    <input
                      name="password"
                      type="password"
                      className="form-control form-control-lg rounded-2 border-0 bg-light"
                      onChange={handleChange}
                      placeholder="Password"
                      required
                      value={form.password}
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
                        Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>

                {/* Additional Links */}
                <div className="text-center mt-4">
                  <p className="text-muted mb-2">
                    Don't have an account?{" "}
                    <a
                      href="/register"
                      className="text-primary fw-semibold text-decoration-none ms-1"
                    >
                      Create account
                    </a>
                  </p>
                  <a href="/forgot-password" className="text-muted small text-decoration-none">
  Forgot password?
</a>
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