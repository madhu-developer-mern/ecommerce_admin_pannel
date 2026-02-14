import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const navigate = useNavigate();
  const { signup, loading, error } = useAuth();
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    setFormError("");
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setFormError("Please fill in all fields");
      return false;
    }

    if (formData.name.length < 2) {
      setFormError("Name must be at least 2 characters");
      return false;
    }

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setFormError("Please enter a valid email address");
      return false;
    }

    if (formData.password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await signup(
      formData.name,
      formData.email,
      formData.password,
      formData.confirmPassword
    );

    if (result.success) {
      navigate("/dashboard");
    } else {
      setFormError(result.error || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-auth flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="https://res.cloudinary.com/dzdcizyyv/image/upload/v1770311958/Gemini_Generated_Image_awod6awod6awod6a_tjqu88.png"
                alt="Logo"
                className="auth-logo rounded-full bg-white p-2 shadow-sm"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
            <p className="text-gray-500">Register as an admin user</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--auth-accent)] focus:border-transparent outline-none transition"
                disabled={loading}
              />
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--auth-accent)] focus:border-transparent outline-none transition"
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                disabled={loading}
              />
            </div>

            {/* Error Messages */}
            {(formError || error) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {formError || error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--auth-accent)] hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
