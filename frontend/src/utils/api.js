/**
 * API utility for HEALIX frontend
 * Handles all HTTP requests to the FastAPI backend with JWT auth
 */

const API_BASE = "/api";

/**
 * Get the stored JWT token
 */
export const getToken = () => localStorage.getItem("healix_token");

/**
 * Store the JWT token
 */
export const setToken = (token) => localStorage.setItem("healix_token", token);

/**
 * Remove the stored JWT token
 */
export const removeToken = () => {
    localStorage.removeItem("healix_token");
    localStorage.removeItem("healix_refresh_token");
};

/**
 * Get/set refresh token
 */
export const getRefreshToken = () => localStorage.getItem("healix_refresh_token");
export const setRefreshToken = (token) => localStorage.setItem("healix_refresh_token", token);

/**
 * Try to refresh the access token using the stored refresh token.
 * Returns true if successful, false otherwise.
 */
let isRefreshing = false;
let refreshPromise = null;

async function tryRefreshToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    // Deduplicate: if a refresh is already in-flight, wait for it
    if (isRefreshing) return refreshPromise;

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            const res = await fetch(`${API_BASE}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });
            if (!res.ok) {
                removeToken();
                return false;
            }
            const data = await res.json();
            setToken(data.access_token);
            if (data.refresh_token) setRefreshToken(data.refresh_token);
            return true;
        } catch {
            removeToken();
            return false;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();
    return refreshPromise;
}

/**
 * Core fetch wrapper with auth headers, auto-refresh on 401, and error handling
 */
async function request(endpoint, options = {}, _retried = false) {
    const token = getToken();
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    // On 401, try to refresh the token once (skip for login/refresh endpoints)
    if (res.status === 401 && !_retried && endpoint !== "/auth/login" && endpoint !== "/auth/refresh") {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
            return request(endpoint, options, true);
        }
        // Refresh failed — clear everything
        removeToken();
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
        let message = `Request failed (${res.status})`;
        const detail = data?.detail;
        if (typeof detail === "string") {
            message = detail;
        } else if (Array.isArray(detail) && detail.length > 0) {
            // Pydantic validation errors: [{loc: [...], msg: "..."}, ...]
            message = detail.map((e) => e.msg || String(e)).join(". ");
        } else if (data?.message) {
            message = data.message;
        }
        const error = new Error(message);
        error.status = res.status;
        error.data = data;
        throw error;
    }

    return data;
}

// ─── Auth ───────────────────────────────────────────────
export const authAPI = {
    login: (email, password) =>
        request("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        }),

    register: (userData) =>
        request("/auth/register", {
            method: "POST",
            body: JSON.stringify(userData),
        }),

    me: () => request("/auth/me"),

    logout: () =>
        request("/auth/logout", { method: "POST" }).catch(() => { }),

    updateProfile: (data) =>
        request("/auth/profile", {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    changePassword: (currentPassword, newPassword) =>
        request("/auth/change-password", {
            method: "POST",
            body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
        }),
};

// ─── Appointments ───────────────────────────────────────
export const appointmentsAPI = {
    // List available providers (for booking)
    getProviders: () => request("/appointments/providers"),

    // Patient: get my appointments
    getMyAppointments: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/appointments/my${query ? `?${query}` : ""}`);
    },

    // Provider: get provider appointments
    getProviderAppointments: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/appointments/provider${query ? `?${query}` : ""}`);
    },

    // Book a new appointment (patient)
    book: (data) =>
        request("/appointments", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    // Cancel an appointment
    cancel: (id) =>
        request(`/appointments/${id}/cancel`, { method: "PATCH" }),

    // Confirm an appointment (provider)
    confirm: (id) =>
        request(`/appointments/${id}/confirm`, { method: "PATCH" }),
};

// ─── Prescriptions ──────────────────────────────────────
export const prescriptionsAPI = {
    // Patient: get my prescriptions
    getMyPrescriptions: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/prescriptions/my${query ? `?${query}` : ""}`);
    },

    // Provider: get provider prescriptions
    getProviderPrescriptions: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/prescriptions/provider${query ? `?${query}` : ""}`);
    },

    // Create a prescription (provider)
    create: (data) =>
        request("/prescriptions", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    // Patient: add own medication
    addSelf: (data) =>
        request("/prescriptions/self", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    // Request a refill (patient)
    requestRefill: (prescriptionId) =>
        request(`/prescriptions/${prescriptionId}/refill`, { method: "POST" }),

    // Approve/deny refill (provider)
    handleRefill: (prescriptionId, refillId, data) =>
        request(`/prescriptions/${prescriptionId}/refill/${refillId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),
};

// ─── Chat (AI Assistant) ────────────────────────────────
export const chatAPI = {
    send: (message) =>
        request("/chat", {
            method: "POST",
            body: JSON.stringify({ message }),
        }),

    getHistory: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/chat/history${query ? `?${query}` : ""}`);
    },

    clearHistory: () =>
        request("/chat/history", { method: "DELETE" }),
};

// ─── Biomarkers ─────────────────────────────────────────
export const biomarkersAPI = {
    getCurrent: () => request("/biomarkers/current"),

    getHistory: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/biomarkers/history${query ? `?${query}` : ""}`);
    },

    getAlerts: () => request("/biomarkers/alerts"),

    record: (data) =>
        request("/biomarkers", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    getPatientData: (patientId) => request(`/biomarkers/patient/${patientId}`),

    getReportPdf: async () => {
        const token = getToken();
        const res = await fetch(`${API_BASE}/biomarkers/report/pdf`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to generate report");
        return res.blob();
    },

    getPatientReportPdf: async (patientId) => {
        const token = getToken();
        const res = await fetch(`${API_BASE}/biomarkers/report/pdf/${patientId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to generate report");
        return res.blob();
    },
};

// ─── Google Fit ─────────────────────────────────────────
export const googleFitAPI = {
    connect: () => request("/googlefit/connect"),

    sync: () => {
        const tzMin = new Date().getTimezoneOffset(); // e.g. -330 for IST
        return request(`/googlefit/sync?tz_offset=${tzMin}`, { method: "POST" });
    },

    today: () => {
        const tzMin = new Date().getTimezoneOffset();
        return request(`/googlefit/today?tz_offset=${tzMin}`);
    },

    week: () => {
        const tzMin = new Date().getTimezoneOffset();
        return request(`/googlefit/week?tz_offset=${tzMin}`);
    },
};

// ─── Admin ──────────────────────────────────────────────
export const adminAPI = {
    getUsers: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/admin/users${query ? `?${query}` : ""}`);
    },

    deleteUser: (userId) =>
        request(`/admin/users/${userId}`, { method: "DELETE" }),

    changeRole: (userId, role) =>
        request(`/admin/users/${userId}/role?new_role=${encodeURIComponent(role)}`, {
            method: "PATCH",
        }),

    createProvider: (data) =>
        request("/admin/users/provider", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    getAuditLogs: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/admin/audit-logs${query ? `?${query}` : ""}`);
    },

    getAllAppointments: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/admin/appointments${query ? `?${query}` : ""}`);
    },

    getAllPrescriptions: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/admin/prescriptions${query ? `?${query}` : ""}`);
    },
};

// ─── Notifications ─────────────────────────────────────
export const notificationsAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/notifications${query ? `?${query}` : ""}`);
    },

    markRead: (notificationId) =>
        request(`/notifications/${notificationId}/read`, { method: "PATCH" }),

    markAllRead: () =>
        request("/notifications/read-all", { method: "PATCH" }),
};

// ─── Permissions ─────────────────────────────────────────
export const permissionsAPI = {
    getMyRequests: () => request("/permissions/my"),
    respond: (permissionId, action) =>
        request(`/permissions/${permissionId}?action=${encodeURIComponent(action)}`, { method: "PATCH" }),
    getProviderPatients: () => request("/permissions/patients"),
};

// ─── Gamification ─────────────────────────────────────
export const gamificationAPI = {
    getMe: () => request("/gamification/me"),

    getDetails: () => request("/gamification/details"),

    awardXP: (action) =>
        request("/gamification/xp", {
            method: "POST",
            body: JSON.stringify({ action }),
        }),

    completeChallenge: () =>
        request("/gamification/challenge/complete", { method: "POST" }),
};
