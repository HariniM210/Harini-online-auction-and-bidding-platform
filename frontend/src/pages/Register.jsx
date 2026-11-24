
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthLayout from "../components/auth/AuthLayout";
import "../styles/auth.css";

const API_BASE_URL = "http://localhost:5000/api";

const Register = () => {
  const navigate = useNavigate();

  const [values, setValues] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setNotice("");
  };

  const validate = () => {
    const newErrors = {};

    if (!values.fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    } else if (values.fullName.trim().length > 255) {
      newErrors.fullName = "Full name is too long.";
    }

    if (!values.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        values.email.trim()
      )
    ) {
      newErrors.email = "Enter a valid email address.";
    } else if (values.email.trim().length > 255) {
      newErrors.email = "Email address is too long.";
    }

    if (!values.phone.trim()) {
      newErrors.phone = "Mobile number is required.";
    } else if (!/^[6-9]\d{9}$/.test(values.phone.trim())) {
      newErrors.phone =
        "Enter a valid 10-digit Indian mobile number.";
    }

    if (!values.password) {
      newErrors.password = "Password is required.";
    } else if (values.password.length < 8) {
      newErrors.password =
        "Password must contain at least 8 characters.";
    } else if (
      new TextEncoder().encode(values.password).length > 72
    ) {
      newErrors.password = "Password must not exceed 72 bytes.";
    }

    if (!values.confirmPassword) {
      newErrors.confirmPassword = "Confirm your password.";
    } else if (values.password !== values.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setNotice("");

    if (!validate()) return;

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/register`,
        {
          full_name: values.fullName.trim(),
          email: values.email.trim().toLowerCase(),
          mobile_number: `+91${values.phone.trim()}`,
          password: values.password,
        },
        {
          timeout: 15000,
        }
      );

      if (
        response.status === 201 &&
        response.data.status === "success"
      ) {
        navigate("/login", {
          replace: true,
          state: {
            message:
              "Account created successfully! Please sign in.",
          },
        });
      } else {
        setNotice("Registration could not be confirmed.");
      }
    } catch (error) {
      if (!error.response) {
        setNotice(
          "Unable to connect to the server. Please try again."
        );
      } else if (error.response.status === 409) {
        setErrors((prev) => ({
          ...prev,
          email: "This email address is already registered.",
        }));
      } else {
        setNotice(
          error.response.data?.message ||
            "Registration failed. Please try again."
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

  const toggleStyle = {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: "#7C3AED",
    cursor: "pointer",
    fontSize: "12px",
  };

  return (
    <AuthLayout register>
      <h2 className="auth-heading">Create Account</h2>

      <p className="auth-subtitle">
        Join AuctionVerse and discover something unique.
      </p>

      <form
        className="auth-form"
        onSubmit={handleSubmit}
        noValidate
        style={{ display: "grid", gap: "16px" }}
      >
        <div>
          <label htmlFor="fullName" style={labelStyle}>
            Full name
          </label>

          <input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="John Doe"
            value={values.fullName}
            onChange={handleChange}
            autoComplete="name"
            style={inputStyle}
            required
          />

          {errors.fullName && (
            <p style={errorStyle}>{errors.fullName}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" style={labelStyle}>
            Email address
          </label>

          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={handleChange}
            autoComplete="email"
            style={inputStyle}
            required
          />

          {errors.email && (
            <p style={errorStyle}>{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" style={labelStyle}>
            Mobile number
          </label>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                padding: "12px",
                background: "#F3E8FF",
                color: "#5B21B6",
                fontWeight: "500",
              }}
            >
              +91
            </span>

            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              placeholder="9876543210"
              maxLength={10}
              value={values.phone}
              onChange={handleChange}
              autoComplete="tel-national"
              style={{
                ...inputStyle,
                border: "none",
                borderRadius: 0,
                minWidth: 0,
              }}
              required
            />
          </div>

          {errors.phone && (
            <p style={errorStyle}>{errors.phone}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" style={labelStyle}>
            Password
          </label>

          <div style={{ position: "relative" }}>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={values.password}
              onChange={handleChange}
              autoComplete="new-password"
              style={{ ...inputStyle, paddingRight: "65px" }}
              required
            />

            <button
              type="button"
              style={toggleStyle}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {errors.password && (
            <p style={errorStyle}>{errors.password}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            style={labelStyle}
          >
            Confirm password
          </label>

          <div style={{ position: "relative" }}>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              value={values.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              style={{ ...inputStyle, paddingRight: "65px" }}
              required
            />

            <button
              type="button"
              style={toggleStyle}
              aria-pressed={showConfirmPassword}
              onClick={() =>
                setShowConfirmPassword((prev) => !prev)
              }
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>

          {errors.confirmPassword && (
            <p style={errorStyle}>
              {errors.confirmPassword}
            </p>
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
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <p
          style={{
            textAlign: "center",
            fontSize: "14px",
            color: "#6B7280",
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "#7C3AED",
              fontWeight: "600",
            }}
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;
