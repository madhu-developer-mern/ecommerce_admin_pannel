import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.password) {
      setFormError("Please fill in all fields");
      return;
    }

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setFormError(result.error || "Login failed");
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Login</h1>
            <p className="text-gray-500">Access your e-commerce dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--auth-accent)] focus:border-transparent outline-none transition"
                disabled={loading}
              />
            </div>

            {/* Error Messages */}
            {(formError || error) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {formError || error}
              </div>
            )}

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--auth-accent)] hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up here
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-gray-600 font-medium mb-2">Demo Credentials (for testing):</p>
            <p className="text-xs text-gray-600">Email: demo@admin.com</p>
            <p className="text-xs text-gray-600">Password: demo123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
