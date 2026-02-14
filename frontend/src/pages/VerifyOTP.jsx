import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/verify-otp`,
        { email, otp }
      );

      setSuccess(response.data.message);
      // Redirect to reset password after 2 seconds
      setTimeout(() => {
        navigate("/reset-password", { state: { email, otp } });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify OTP");
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
                <Shield className="text-blue-600" size={32} />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Verify OTP</h1>
            <p className="text-gray-500">Enter the 6-digit code sent to your email</p>
            <p className="text-sm text-gray-600 mt-2">{email}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* OTP Input */}
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                6-Digit OTP
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtp(value);
                  setError("");
                }}
                placeholder="000000"
                maxLength="6"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-center text-2xl font-bold tracking-widest"
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
              disabled={loading || otp.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-gray-600">
              💡 Didn't receive the OTP? Check your spam folder or request a new one.
            </p>
          </div>

          {/* Back to Forgot Password */}
          <div className="mt-6 text-center">
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              <ArrowLeft size={18} />
              Back to Forgot Password
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
