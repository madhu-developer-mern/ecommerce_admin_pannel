import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import io from "socket.io-client";
import { AuthProvider } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductsDetails from "./pages/ProductsDetails";
import Orders from "./pages/Orders";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOTP from "./pages/VerifyOTP";
import ResetPassword from "./pages/ResetPassword";
import { API_BASE_URL } from "./config/api";

function AdminLayout({ socket }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (!socket) return;

    socket.on("analytics_update", (data) => {
      setAnalytics(data);
    });

    socket.emit("request_analytics");

    return () => {
      socket.off("analytics_update");
    };
  }, [socket]);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} />
      <div className="flex flex-1 flex-col">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/dashboard" element={<Dashboard analytics={analytics} socket={socket} />} />
            <Route path="/products" element={<Products socket={socket} />} />
            <Route path="/products-details" element={<ProductsDetails />} />
            <Route path="/orders" element={<Orders socket={socket} />} />
            <Route path="/analytics" element={<Analytics socket={socket} />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function AppEnhanced() {
  const [socket, setSocket] = useState(null);

  // Debug: show which API base URL the client will use
  useEffect(() => {
    console.log("Client API_BASE_URL:", API_BASE_URL);
  }, []);

  useEffect(() => {
    const newSocket = io(API_BASE_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on("connect", () => {
      console.log("✅ Connected to server");
      newSocket.emit("request_analytics");
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AdminLayout socket={socket} />
              </ProtectedRoute>
            }
          />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default AppEnhanced;
