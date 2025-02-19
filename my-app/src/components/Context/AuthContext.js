import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { message } from "antd";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLogout, setIsLogout] = useState(false);
  const navigate = useNavigate();

  // Create a separate instance for token refreshing
  const refreshApi = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
    withCredentials: true,
  });

  const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
    withCredentials: true,
  });

  let isRefreshing = false;
  let failedQueue = [];

  const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });

    failedQueue = [];
  };

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              return api(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        return new Promise((resolve, reject) => {
          refreshToken()
            .then(() => {
              processQueue(null);
              resolve(api(originalRequest));
            })
            .catch((err) => {
              processQueue(err, null);
              reject(err);
            })
            .finally(() => {
              isRefreshing = false;
            });
        });
      }

      return Promise.reject(error);
    }
  );

  const refreshToken = async () => {
    try {
      await refreshApi.post("/refresh");
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
      throw error;
    }
  };

  const login = async (googleToken) => {
    try {
      const response = await api.post("/login", { token: googleToken });
      setIsAuthenticated(true);
      setUser(response.data.user);
      navigate("/home");
    } catch (error) {
      message.error(error.response?.data?.message ?? "Login failed");
    }
  };

  const logout = async () => { 
    try {
      setIsLogout(true);
      await api.post("/logout");
    } catch (error) {
      setIsLogout(false);
      message.error(error.response?.data?.message ?? "Logout failed");
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      navigate("/");
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get("/check");
        setIsAuthenticated(response.data.isAuthenticated);
        setUser(response.data.user);
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, logout, api, loading, isLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext) || {};
