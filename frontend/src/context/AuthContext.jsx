import { createContext, useContext, useState, useEffect } from "react";
import { authAPI, setToken, removeToken, getToken, googleFitAPI, chatAPI } from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-sync Google Fit data silently
  const syncGoogleFitSilently = async (userId) => {
    const isConnected = localStorage.getItem(`healix_gfit_connected_${userId}`);
    if (isConnected === "true") {
      try {
        await googleFitAPI.sync();
        localStorage.setItem(`healix_gfit_last_sync_${userId}`, new Date().toLocaleString());
        console.log("[HEALIX] Google Fit data synced on login");
      } catch {
        console.log("[HEALIX] Google Fit sync skipped (not connected or error)");
      }
    }
  };

  const buildUserObj = (userData) => ({
    id: userData.id,
    role: userData.role,
    name: `${userData.first_name} ${userData.last_name}`,
    email: userData.email,
    first_name: userData.first_name,
    last_name: userData.last_name,
    age: userData.age,
    gender: userData.gender,
    date_of_birth: userData.date_of_birth,
    health_conditions: userData.health_conditions,
    blood_type: userData.blood_type,
    height: userData.height,
    weight: userData.weight,
    phone_number: userData.phone_number,
    medical_insurance: userData.medical_insurance,
    emergency_contact_name: userData.emergency_contact_name,
    emergency_contact_phone: userData.emergency_contact_phone,
    emergency_contact_relationship: userData.emergency_contact_relationship,
    allergies: userData.allergies,
    family_history: userData.family_history,
    medications: userData.medications,
    supplements: userData.supplements,
    smoking_status: userData.smoking_status,
    alcohol_frequency: userData.alcohol_frequency,
    exercise_frequency: userData.exercise_frequency,
    sleep_habit: userData.sleep_habit,
    dietary_preference: userData.dietary_preference,
    occupation: userData.occupation,
    profile_completed: userData.profile_completed,
  });

  // On mount, check if we have a stored token and fetch user profile
  useEffect(() => {
    const token = getToken();
    if (token) {
      authAPI
        .me()
        .then((userData) => {
          const userObj = buildUserObj(userData);
          setUser(userObj);
          // Auto-sync Google Fit for patients
          if (userData.role === "patient") {
            syncGoogleFitSilently(userData.id);
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
    const userObj = buildUserObj(userData);
    setUser(userObj);

    // For patients: clear old chat history and sync Google Fit on login
    if (userObj.role === "patient") {
      chatAPI.clearHistory().catch(() => {});
      syncGoogleFitSilently(userObj.id);
    }

    return userObj;
  };

  /**
   * Refresh user data from the backend
   */
  const refreshUser = async () => {
    const userData = await authAPI.me();
    const userObj = buildUserObj(userData);
    setUser(userObj);
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
    <AuthContext.Provider value={{ user, login, logout, register, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
