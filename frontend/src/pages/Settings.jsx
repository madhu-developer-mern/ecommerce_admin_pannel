import { Bell, Lock, Moon, Globe, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

export default function Settings() {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showSendOTP, setShowSendOTP] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [otpData, setOtpData] = useState({
    otp: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOTPChange = (e) => {
    const { name, value } = e.target;
    setOtpData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDirectPasswordChange = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      setMessage("All fields are required");
      setMessageType("error");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage("New passwords do not match");
      setMessageType("error");
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage("Password must be at least 6 characters");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/auth/change-password`,
        {
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessage("Password changed successfully!");
      setMessageType("success");
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setShowChangePassword(false);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to change password");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setMessage("");
    setMessageType("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const adminEmail = localStorage.getItem("adminEmail");

      await axios.post(
        `${API_BASE_URL}/api/auth/forgot-password`,
        { email: adminEmail }
      );

      setMessage("OTP sent to your email!");
      setMessageType("success");
      setShowSendOTP(false);
      setShowPasswordFields(true);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to send OTP");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTPAndChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!otpData.otp || !otpData.newPassword || !otpData.confirmPassword) {
      setMessage("All fields are required");
      setMessageType("error");
      return;
    }

    if (otpData.newPassword !== otpData.confirmPassword) {
      setMessage("New passwords do not match");
      setMessageType("error");
      return;
    }

    if (otpData.newPassword.length < 6) {
      setMessage("Password must be at least 6 characters");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const adminEmail = localStorage.getItem("adminEmail");
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        email: adminEmail,
        otp: otpData.otp,
        newPassword: otpData.newPassword,
        confirmPassword: otpData.confirmPassword
      });

      setMessage("Password changed successfully!");
      setMessageType("success");
      setOtpData({ otp: "", newPassword: "", confirmPassword: "" });
      setShowChangePassword(false);
      setShowPasswordFields(false);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to change password");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisiblity = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-1">Manage your admin panel preferences</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            messageType === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Notification Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Bell size={20} className="text-blue-500" />
              <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: "Email notifications", desc: "Receive updates via email" },
                { label: "Order alerts", desc: "Get notified on new orders" },
                { label: "Low stock alerts", desc: "Alert when products run low" },
                { label: "Marketing emails", desc: "Promotional campaigns" }
              ].map((setting, i) => (
                <label key={i} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <div>
                    <p className="font-medium text-gray-900">{setting.label}</p>
                    <p className="text-xs text-gray-600">{setting.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Lock size={20} className="text-green-500" />
              <h3 className="text-lg font-bold text-gray-900">Security</h3>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setShowChangePassword(!showChangePassword)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="text-left">
                  <p className="font-medium text-gray-900">Change Password</p>
                  <p className="text-xs text-gray-600">Update your password securely</p>
                </div>
                <span className="text-blue-600 font-medium text-sm">
                  {showChangePassword ? "Close →" : "Change →"}
                </span>
              </button>

              {/* Change Password Form */}
              {showChangePassword && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => {
                        setShowSendOTP(false);
                        setShowPasswordFields(false);
                        setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg font-medium transition ${
                        !showSendOTP
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      Direct Change
                    </button>
                    <button
                      onClick={() => {
                        setShowSendOTP(true);
                        setOtpData({ otp: "", newPassword: "", confirmPassword: "" });
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg font-medium transition ${
                        showSendOTP
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      Change via OTP
                    </button>
                  </div>

                  {/* Direct Change Password */}
                  {!showSendOTP && (
                    <form onSubmit={handleDirectPasswordChange} className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Old Password</label>
                        <div className="relative">
                          <input
                            type={showPasswords.oldPassword ? "text" : "password"}
                            name="oldPassword"
                            value={formData.oldPassword}
                            onChange={handlePasswordChange}
                            placeholder="Enter old password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisiblity("oldPassword")}
                            className="absolute right-3 top-2.5 text-gray-500"
                          >
                            {showPasswords.oldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <div className="relative">
                          <input
                            type={showPasswords.newPassword ? "text" : "password"}
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handlePasswordChange}
                            placeholder="Enter new password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisiblity("newPassword")}
                            className="absolute right-3 top-2.5 text-gray-500"
                          >
                            {showPasswords.newPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handlePasswordChange}
                            placeholder="Confirm new password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisiblity("confirmPassword")}
                            className="absolute right-3 top-2.5 text-gray-500"
                          >
                            {showPasswords.confirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium transition"
                        >
                          {loading ? "Changing..." : "Change Password"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowChangePassword(false)}
                          className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 font-medium transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* OTP Change Password */}
                  {showSendOTP && !showPasswordFields && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700">Send OTP to your registered email address</p>
                      <button
                        onClick={handleSendOTP}
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-green-400 font-medium transition"
                      >
                        {loading ? "Sending..." : "Send OTP to Email"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowChangePassword(false)}
                        className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 font-medium transition"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* OTP Verification and Password Fields */}
                  {showPasswordFields && (
                    <form onSubmit={handleVerifyOTPAndChangePassword} className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                        <input
                          type="text"
                          name="otp"
                          value={otpData.otp}
                          onChange={handleOTPChange}
                          placeholder="6-digit OTP"
                          maxLength="6"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <div className="relative">
                          <input
                            type={showPasswords.otpNewPassword ? "text" : "password"}
                            name="newPassword"
                            value={otpData.newPassword}
                            onChange={handleOTPChange}
                            placeholder="Enter new password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisiblity("otpNewPassword")}
                            className="absolute right-3 top-2.5 text-gray-500"
                          >
                            {showPasswords.otpNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <div className="relative">
                          <input
                            type={showPasswords.otpConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={otpData.confirmPassword}
                            onChange={handleOTPChange}
                            placeholder="Confirm new password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => togglePasswordVisiblity("otpConfirmPassword")}
                            className="absolute right-3 top-2.5 text-gray-500"
                          >
                            {showPasswords.otpConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-green-400 font-medium transition"
                        >
                          {loading ? "Verifying..." : "Verify & Change Password"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowChangePassword(false);
                            setShowPasswordFields(false);
                          }}
                          className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 font-medium transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Display Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Moon size={20} className="text-purple-500" />
              <h3 className="text-lg font-bold text-gray-900">Display</h3>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900">Dark Mode</p>
                  <p className="text-xs text-gray-600">Coming soon</p>
                </div>
                <input type="checkbox" className="w-4 h-4" disabled />
              </label>
              <div className="p-3 border-t border-gray-200 pt-3">
                <p className="font-medium text-gray-900 mb-2">Language</p>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>Hindi</option>
                </select>
              </div>
            </div>
          </div>

          {/* API Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Globe size={20} className="text-orange-500" />
              <h3 className="text-lg font-bold text-gray-900">API & Integrations</h3>
            </div>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-900 transition">
                Generate API Key
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-900 transition">
                Manage Webhooks
              </button>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm h-fit">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h3>
          <div className="space-y-2">
            {[
              { name: "Documentation", href: "#" },
              { name: "API Docs", href: "#" },
              { name: "Support", href: "#" },
              { name: "Contact Us", href: "#" },
              { name: "About", href: "#" }
            ].map((link, i) => (
              <a
                key={i}
                href={link.href}
                className="block px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition font-medium"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          💡 <strong>Tip:</strong> Regular backups are recommended. Enable automatic backups in security settings.
        </p>
      </div>
    </div>
  );
}
