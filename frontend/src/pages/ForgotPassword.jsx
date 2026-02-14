import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/forgot-password`,
        { email }
      );

      setSuccess(response.data.message);
      // Redirect to OTP verification after 2 seconds
      setTimeout(() => {
        navigate("/verify-otp", { state: { email } });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-auth flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-4 rounded-full">
                <Mail className="text-blue-600" size={32} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Forgot Password?</h1>
            <p className="text-gray-500">Enter your email address and we'll send you an OTP</p>
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
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="admin@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              <ArrowLeft size={18} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
