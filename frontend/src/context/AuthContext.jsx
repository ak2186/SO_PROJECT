import { createContext, useContext, useState, useEffect } from "react";
import { authAPI, setToken, removeToken, getToken, googleFitAPI } from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-sync Google Fit data silently
  const syncGoogleFitSilently = async () => {
    const isConnected = localStorage.getItem("healix_gfit_connected");
    if (isConnected === "true") {
      try {
        await googleFitAPI.sync();
        localStorage.setItem("healix_gfit_last_sync", new Date().toLocaleString());
        console.log("[HEALIX] Google Fit data synced on login");
      } catch {
        console.log("[HEALIX] Google Fit sync skipped (not connected or error)");
      }
    }
  };

  // On mount, check if we have a stored token and fetch user profile
  useEffect(() => {
    const token = getToken();
    if (token) {
      authAPI
        .me()
        .then((userData) => {
          const userObj = {
            id: userData.id,
            role: userData.role,
            name: `${userData.first_name} ${userData.last_name}`,
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            age: userData.age,
            gender: userData.gender,
            health_conditions: userData.health_conditions,
          };
          setUser(userObj);
          // Auto-sync Google Fit for patients
          if (userData.role === "patient") {
            syncGoogleFitSilently();
          }
        })
        .catch(() => {
          removeToken();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Login with email + password against the backend
   * Returns the user object on success, throws on failure
   */
  const login = async (email, password) => {
    const tokenData = await authAPI.login(email, password);
    setToken(tokenData.access_token);

    // Fetch user profile after login
    const userData = await authAPI.me();
    const userObj = {
      id: userData.id,
      role: userData.role,
      name: `${userData.first_name} ${userData.last_name}`,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      age: userData.age,
      gender: userData.gender,
      health_conditions: userData.health_conditions,
    };
    setUser(userObj);

    // Auto-sync Google Fit for patients on login
    if (userObj.role === "patient") {
      syncGoogleFitSilently();
    }

    return userObj;
  };

  /**
   * Register a new user
   */
  const register = async (userData) => {
    const created = await authAPI.register(userData);
    return created;
  };

  /**
   * Logout — clear token and user state
   */
  const logout = () => {
    authAPI.logout().catch(() => { });
    removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
