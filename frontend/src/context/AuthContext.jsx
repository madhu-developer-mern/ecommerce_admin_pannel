import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { API_URL } from "../config/api";

export const AuthContext = createContext();

const API_BASE_URL = API_URL;

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [accessToken, setAccessToken] = useState(localStorage.getItem("adminAccessToken"));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("adminRefreshToken"));
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);
  const refreshTokenTimeoutRef = useRef(null);

  // Set up axios default headers
  useEffect(() => {
    if (accessToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [accessToken]);

  // Setup axios interceptor for token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized responses
        if (
          error.response?.status === 401 &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;

          // If token is expired and we have refresh token, try to refresh
          if (
            error.response?.data?.code === "TOKEN_EXPIRED" &&
            refreshToken
          ) {
            try {
              console.log("Interceptor: Attempting token refresh...");
              const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
                refreshToken
              });

              const newAccessToken = response.data.accessToken;
              localStorage.setItem("adminAccessToken", newAccessToken);
              setAccessToken(newAccessToken);
              axios.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;

              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return axios(originalRequest);
            } catch (refreshError) {
              // Refresh failed - logout user
              console.error("Interceptor: Token refresh failed, logging out...");
              localStorage.removeItem("adminAccessToken");
              localStorage.removeItem("adminRefreshToken");
              localStorage.removeItem("adminEmail");
              setAccessToken(null);
              setRefreshToken(null);
              setAdmin(null);
              delete axios.defaults.headers.common["Authorization"];
              return Promise.reject(refreshError);
            }
          }
        }

        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, [refreshToken]);

  // Auto-refresh token before expiration (30 min = 1800 seconds)
  const scheduleTokenRefresh = useCallback((delayMs = 29 * 60 * 1000) => {
    if (refreshTokenTimeoutRef.current) {
      clearTimeout(refreshTokenTimeoutRef.current);
    }

    refreshTokenTimeoutRef.current = setTimeout(async () => {
      if (!refreshToken) return;

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken
        });

        const newAccessToken = response.data.accessToken;
        localStorage.setItem("adminAccessToken", newAccessToken);
        setAccessToken(newAccessToken);
        axios.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;

        // Schedule next refresh
        scheduleTokenRefresh();
      } catch (err) {
        console.error("Token refresh failed:", err);
      }
    }, delayMs);
  }, [refreshToken]);

  // Restore user session from localStorage on mount (without verifying)
  useEffect(() => {
    const init = async () => {
      if (accessToken && refreshToken) {
        // Restore session from localStorage without making API calls
        // Interceptor will handle token refresh if needed
        scheduleTokenRefresh();

        // Verify in background, but keep an initializing flag so ProtectedRoute
        // doesn't redirect to login immediately while we restore session.
        await verifyTokenInBackground();
      }

      setInitializing(false);
    };

    init();
  }, []);

  // Verify token in background (doesn't logout on failure)
  const verifyTokenInBackground = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/verify`);
      setAdmin(response.data.admin);
      setError(null);
    } catch (err) {
      console.log("Background verification pending token refresh...");
      // Don't logout, let interceptor handle refresh on next API call
    }
  }, []);

  const verifyToken = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/verify`);
      setAdmin(response.data.admin);
      setError(null);
    } catch (err) {
      console.error("Token verification failed:", err);
      localStorage.removeItem("adminAccessToken");
      localStorage.removeItem("adminRefreshToken");
      localStorage.removeItem("adminEmail");
      setAccessToken(null);
      setRefreshToken(null);
      setAdmin(null);
    }
  }, []);

  const signup = async (name, email, password, confirmPassword) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signup`, {
        name,
        email,
        password,
        confirmPassword
      });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken, admin: adminData } = response.data;
      localStorage.setItem("adminAccessToken", newAccessToken);
      localStorage.setItem("adminRefreshToken", newRefreshToken);
      localStorage.setItem("adminEmail", adminData.email);
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      setAdmin(adminData);
      scheduleTokenRefresh();

      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Signup failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken, admin: adminData } = response.data;
      localStorage.setItem("adminAccessToken", newAccessToken);
      localStorage.setItem("adminRefreshToken", newRefreshToken);
      localStorage.setItem("adminEmail", adminData.email);
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      setAdmin(adminData);
      scheduleTokenRefresh();

      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Login failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`, { refreshToken });
    } catch (err) {
      console.error("Logout API call failed:", err);
    }

    if (refreshTokenTimeoutRef.current) {
      clearTimeout(refreshTokenTimeoutRef.current);
    }

    localStorage.removeItem("adminAccessToken");
    localStorage.removeItem("adminRefreshToken");
    localStorage.removeItem("adminEmail");
    setAccessToken(null);
    setRefreshToken(null);
    setAdmin(null);
    setError(null);
    delete axios.defaults.headers.common["Authorization"];
  };

  const value = {
    admin,
    accessToken,
    refreshToken,
    loading,
    initializing,
    error,
    signup,
    login,
    logout,
    isAuthenticated: !!accessToken && !!admin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
