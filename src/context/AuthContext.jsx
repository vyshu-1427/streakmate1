// AuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";

axios.defaults.baseURL = "http://localhost:5003";

const setAuthTokenHeader = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log("Axios default header set with token:", token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    console.log("Axios default header removed");
  }
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    try {
      console.log("Fetching user from /api/auth/me");
      const response = await axios.get("/api/auth/me");
      console.log("fetchUser response:", response.data);
      setUser(response.data);
      setIsAuthenticated(true);
      setError(null);
      return true;
    } catch (err) {
      console.error("Auth error during fetchUser:", err.response?.data || err.message);
      setUser(null);
      setIsAuthenticated(false);
      setAuthTokenHeader(null);
      localStorage.removeItem("token");
      setError(err.response?.data?.message || "Failed to fetch user");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (token) => {
    if (token) {
      console.log("Login: Setting token and fetching user");
      localStorage.setItem("token", token);
      setAuthTokenHeader(token);
      const success = await fetchUser();
      return success;
    }
    setError("No token provided");
    return false;
  }, [fetchUser]);

  const logout = useCallback(() => {
    console.log("Logging out");
    localStorage.removeItem("token");
    setAuthTokenHeader(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Initial load: Token found:", !!token);
    if (token) {
      setAuthTokenHeader(token);
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        loading,
        error,
        fetchUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Named export for useAuth
export const useAuth = () => useContext(AuthContext);