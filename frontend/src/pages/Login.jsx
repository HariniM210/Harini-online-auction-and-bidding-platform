
import { useState } from "react";
import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/auth/AuthLayout";
import "../styles/auth.css";

const API_BASE_URL = "http://localhost:5000/api";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");

  const [success, setSuccess] = useState(
    location.state?.message || ""
  );


  const validate = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setNotice("");
    setSuccess("");

    if (!validate()) return;

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        {
          email: email.trim().toLowerCase(),
          password,
        },
        {
          timeout: 15000,
        }
      );

      const user = response.data?.data?.user;
      const token = response.data?.data?.token;

      if (
        response.status === 200 &&
        response.data.status === "success" &&
        user &&
        token
      ) {
        login(user, token);
        navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
      } else {
        setNotice("Authentication could not be confirmed.");
      }
    } catch (error) {
      if (!error.response) {
        setNotice(
          "Unable to connect to the server. Please try again."
        );
      } else if (error.response.status === 401) {
        setNotice(
          error.response.data?.message ||
            "Invalid email or password."
        );
      } else {
        setNotice(
          error.response.data?.message ||
            "Login failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    fontSize: "14px",
    boxSizing: "border-box",
    backgroundColor: "#FFFFFF",
    color: "#171433",
  };

  const labelStyle = {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "6px",
    color: "#374151",
  };

  const errorStyle = {
    color: "#DC2626",
    fontSize: "12px",
    marginTop: "5px",
  };

  return (
    <AuthLayout>
      <h2 className="auth-heading">Welcome Back</h2>

      <p className="auth-subtitle">
        Sign in to your AuctionVerse account.
      </p>

      {success && (
        <div
          role="status"
          style={{
            backgroundColor: "#F0FDF4",
            border: "1px solid #BBF7D0",
            color: "#166534",
            padding: "12px",
            borderRadius: "8px",
            fontSize: "14px",
            marginBottom: "16px",
          }}
        >
          {success}
        </div>
      )}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
          noValidate
          style={{ display: "grid", gap: "16px" }}
        >
          <div>
            <label htmlFor="email" style={labelStyle}>
              Email address
            </label>

            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({
                  ...prev,
                  email: "",
                }));
                setNotice("");
              }}
              autoComplete="email"
              style={inputStyle}
              required
            />

            {errors.email && (
              <p style={errorStyle}>{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" style={labelStyle}>
              Password
            </label>

            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    password: "",
                  }));
                  setNotice("");
                }}
                autoComplete="current-password"
                style={{
                  ...inputStyle,
                  paddingRight: "65px",
                }}
                required
              />

              <button
                type="button"
                aria-pressed={showPassword}
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  color: "#7C3AED",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {errors.password && (
              <p style={errorStyle}>{errors.password}</p>
            )}
          </div>

          {notice && (
            <p role="alert" style={errorStyle}>
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              background:
                "linear-gradient(135deg, #7C3AED, #5B21B6)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <p
            style={{
              textAlign: "center",
              fontSize: "14px",
              color: "#6B7280",
            }}
          >
            Don't have an account?{" "}
            <Link
              to="/register"
              style={{
                color: "#7C3AED",
                fontWeight: "600",
              }}
            >
              Sign up
            </Link>
          </p>
        </form>
    </AuthLayout>
  );
};

export default Login;