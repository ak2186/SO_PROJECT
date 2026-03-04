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
export const removeToken = () => localStorage.removeItem("healix_token");

/**
 * Core fetch wrapper with auth headers and error handling
 */
async function request(endpoint, options = {}) {
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

    // If unauthorized, clear token
    if (res.status === 401) {
        removeToken();
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
        const error = new Error(data?.detail || data?.message || `Request failed (${res.status})`);
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
};

// ─── Appointments ───────────────────────────────────────
export const appointmentsAPI = {
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
};
