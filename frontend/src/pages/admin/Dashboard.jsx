import { useState, useEffect } from "react";
import { adminAPI } from "../../utils/api";

const mockUsers = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "Patient", joinDate: "Sep 15, 2024", status: "Active", avatar: "JD" },
  { id: 2, name: "Dr. Sarah Mitchell", email: "sarah@hospital.com", role: "Healthcare Provider", joinDate: "Sep 10, 2024", status: "Active", avatar: "SM" },
  { id: 3, name: "Robert Johnson", email: "robert@example.com", role: "Patient", joinDate: "Oct 25, 2024", status: "Active", avatar: "RJ" },
  { id: 4, name: "Dr. Michael Chen", email: "mchen@clinic.com", role: "Healthcare Provider", joinDate: "Aug 5, 2024", status: "Active", avatar: "MC" },
  { id: 5, name: "James Wilson", email: "james@example.com", role: "Patient", joinDate: "Nov 1, 2024", status: "Active", avatar: "JW" },
];

const avatarColors = {
  JD: "#3b82f6",
  SM: "#10b981",
  RJ: "#f59e0b",
  MC: "#8b5cf6",
  JW: "#ef4444",
};

export const AdminDashboard = () => {
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRevokeModal, setShowRevokeModal] = useState(null);
  const [showCreateProvider, setShowCreateProvider] = useState(false);
  const [providerForm, setProviderForm] = useState({ first_name: "", last_name: "", email: "", password: "", gender: "" });
  const [providerError, setProviderError] = useState("");
  const [providerLoading, setProviderLoading] = useState(false);

  // Fetch users from backend
  useEffect(() => {
    adminAPI.getUsers({ limit: 100 })
      .then((data) => {
        if (data && Array.isArray(data.users) && data.users.length > 0) {
          const mapped = data.users.map((u) => {
            const name = `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email;
            const roleLabel = u.role === "provider" ? "Healthcare Provider" : u.role === "admin" ? "Admin" : "Patient";
            const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            return {
              id: u._id || u.id,
              name,
              email: u.email,
              role: roleLabel,
              backendRole: u.role,
              joinDate: u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
              status: u.status || "Active",
              avatar: initials,
            };
          });
          setUsers(mapped);
        }
      })
      .catch(() => { }); // fallback to mock
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalUsers: users.length,
    healthcareProviders: users.filter((u) => u.role === "Healthcare Provider").length,
    patients: users.filter((u) => u.role === "Patient").length,
  };

  const handleGrantProvider = async (userId) => {
    try {
      await adminAPI.changeRole(userId, "provider");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: "Healthcare Provider", backendRole: "provider" } : u
        )
      );
    } catch {
      alert("Failed to grant provider access");
    }
    setSelectedUser(null);
  };

  const handleRevokeProvider = async (userId) => {
    try {
      await adminAPI.changeRole(userId, "patient");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: "Patient", backendRole: "patient" } : u
        )
      );
    } catch {
      alert("Failed to revoke provider access");
    }
    setShowRevokeModal(null);
  };

  const handleCreateProvider = async (e) => {
    e.preventDefault();
    if (!providerForm.first_name || !providerForm.last_name || !providerForm.email || !providerForm.password) {
      setProviderError("Please fill all required fields.");
      return;
    }
    setProviderError("");
    setProviderLoading(true);
    try {
      const result = await adminAPI.createProvider(providerForm);
      const p = result.provider;
      const name = `${p.first_name} ${p.last_name}`;
      const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
      setUsers((prev) => [
        {
          id: p._id,
          name,
          email: p.email,
          role: "Healthcare Provider",
          backendRole: "provider",
          joinDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          status: "Active",
          avatar: initials,
        },
        ...prev,
      ]);
      setShowCreateProvider(false);
      setProviderForm({ first_name: "", last_name: "", email: "", password: "", gender: "" });
    } catch (err) {
      setProviderError(err.message || "Failed to create provider.");
    } finally {
      setProviderLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .user-row {
          transition: all 0.2s ease;
        }
        .user-row:hover {
          background: #1e293b;
        }
        .action-btn {
          transition: all 0.15s ease;
          cursor: pointer;
        }
        .action-btn:hover {
          opacity: 0.8;
          transform: translateY(-1px);
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <div style={{
        background: "#060d1a",
        minHeight: "100vh",
        padding: "40px 48px",
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* Header */}
        <div style={{ marginBottom: "32px", animation: "fadeUp 0.6s ease both", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{
              color: "#f1f5f9",
              fontSize: "32px",
              fontWeight: "800",
              margin: "0 0 6px 0",
              letterSpacing: "-1px",
            }}>
              Admin Dashboard
            </h1>
            <p style={{ color: "#64748b", fontSize: "15px", margin: 0 }}>
              Manage users and account privileges
            </p>
          </div>
          <button
            onClick={() => { setShowCreateProvider(true); setProviderError(""); }}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              background: "linear-gradient(135deg, #1d4ed8, #0891b2)",
              color: "#fff",
              fontWeight: "700",
              fontSize: "14px",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            + Create Provider
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginBottom: "32px",
          animation: "fadeUp 0.6s ease 0.1s both",
        }}>
          {[
            { label: "Total Users", value: stats.totalUsers, icon: "👥", color: "#3b82f6" },
            { label: "Healthcare Providers", value: stats.healthcareProviders, icon: "👨‍⚕️", color: "#10b981" },
            { label: "Patients", value: stats.patients, icon: "🏥", color: "#8b5cf6" },
          ].map((stat, i) => (
            <div key={i} style={{
              background: "#0f172a",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "24px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}>
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                background: `${stat.color}22`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
              }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                  {stat.label}
                </div>
                <div style={{ color: stat.color, fontSize: "32px", fontWeight: "800", letterSpacing: "-1.5px" }}>
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{
          marginBottom: "24px",
          animation: "fadeUp 0.6s ease 0.15s both",
        }}>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "16px",
            }}>
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px 14px 42px",
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                color: "#f1f5f9",
                fontSize: "14px",
                outline: "none",
                fontFamily: "'DM Sans', sans-serif",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* User List Header */}
        <div style={{
          color: "#f1f5f9",
          fontSize: "18px",
          fontWeight: "700",
          marginBottom: "16px",
          animation: "fadeUp 0.6s ease 0.2s both",
        }}>
          All Users
        </div>

        {/* Users Table */}
        <div style={{
          background: "#0f172a",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          overflow: "hidden",
          animation: "fadeUp 0.6s ease 0.25s both",
        }}>
          {/* Table Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 2.5fr 1.5fr 1.5fr 1fr 1.2fr",
            padding: "16px 24px",
            background: "#060d1a",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}>
            {["User", "Email", "Role", "Join Date", "Status", "Actions"].map((header) => (
              <div key={header} style={{
                color: "#64748b",
                fontSize: "11px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}>
                {header}
              </div>
            ))}
          </div>

          {/* Table Rows */}
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="user-row"
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 2.5fr 1.5fr 1.5fr 1fr 1.2fr",
                padding: "18px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                alignItems: "center",
              }}
            >
              {/* User */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: avatarColors[user.avatar] || "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#fff",
                }}>
                  {user.avatar}
                </div>
                <div style={{ color: "#f1f5f9", fontSize: "14px", fontWeight: "700" }}>
                  {user.name}
                </div>
              </div>

              {/* Email */}
              <div style={{ color: "#94a3b8", fontSize: "14px" }}>
                {user.email}
              </div>

              {/* Role */}
              <div>
                <span style={{
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: "700",
                  background: user.role === "Healthcare Provider" ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)",
                  color: user.role === "Healthcare Provider" ? "#10b981" : "#3b82f6",
                  border: user.role === "Healthcare Provider" ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(59,130,246,0.3)",
                }}>
                  👤 {user.role}
                </span>
              </div>

              {/* Join Date */}
              <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                {user.joinDate}
              </div>

              {/* Status */}
              <div>
                <span style={{
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: "700",
                  background: "rgba(16,185,129,0.15)",
                  color: "#10b981",
                  border: "1px solid rgba(16,185,129,0.3)",
                }}>
                  Active
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "8px" }}>
                {user.role === "Patient" ? (
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="action-btn"
                    style={{
                      padding: "6px 12px",
                      background: "transparent",
                      border: "1px solid rgba(16,185,129,0.3)",
                      borderRadius: "8px",
                      color: "#10b981",
                      fontSize: "12px",
                      fontWeight: "600",
                      fontFamily: "'DM Sans', sans-serif",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    👨‍⚕️ Grant Provider
                  </button>
                ) : (
                  <button
                    onClick={() => setShowRevokeModal(user)}
                    className="action-btn"
                    style={{
                      padding: "6px 12px",
                      background: "transparent",
                      border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: "8px",
                      color: "#ef4444",
                      fontSize: "12px",
                      fontWeight: "600",
                      fontFamily: "'DM Sans', sans-serif",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    🚫 Revoke Provider
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Grant Provider Modal */}
        {selectedUser && (
          <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "20px",
                padding: "32px",
                width: "440px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>👨‍⚕️</div>
              <h2 style={{ color: "#f1f5f9", fontSize: "24px", fontWeight: "800", margin: "0 0 12px 0" }}>
                Grant Provider Access
              </h2>
              <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 24px 0", lineHeight: 1.6 }}>
                Are you sure you want to grant Healthcare Provider privileges to <strong style={{ color: "#f1f5f9" }}>{selectedUser.name}</strong>?
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button
                  onClick={() => setSelectedUser(null)}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent",
                    color: "#94a3b8",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleGrantProvider(selectedUser.id)}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#10b981",
                    color: "#fff",
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Confirm Grant
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Provider Modal */}
        {showCreateProvider && (
          <div className="modal-overlay" onClick={() => setShowCreateProvider(false)}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "20px",
                padding: "32px",
                width: "480px",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px", textAlign: "center" }}>👨‍⚕️</div>
              <h2 style={{ color: "#f1f5f9", fontSize: "24px", fontWeight: "800", margin: "0 0 8px 0", textAlign: "center" }}>
                Create Provider Account
              </h2>
              <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 24px 0", textAlign: "center" }}>
                Create a new healthcare provider account
              </p>

              {providerError && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", marginBottom: "16px" }}>
                  {providerError}
                </div>
              )}

              <form onSubmit={handleCreateProvider}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: "700", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>First Name *</label>
                    <input
                      type="text"
                      placeholder="First Name"
                      value={providerForm.first_name}
                      onChange={(e) => setProviderForm(f => ({ ...f, first_name: e.target.value }))}
                      style={{ width: "100%", padding: "10px 12px", background: "#060d1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: "700", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Last Name *</label>
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={providerForm.last_name}
                      onChange={(e) => setProviderForm(f => ({ ...f, last_name: e.target.value }))}
                      style={{ width: "100%", padding: "10px 12px", background: "#060d1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif" }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: "700", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email *</label>
                  <input
                    type="email"
                    placeholder="provider@hospital.com"
                    value={providerForm.email}
                    onChange={(e) => setProviderForm(f => ({ ...f, email: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", background: "#060d1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: "700", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Password *</label>
                    <input
                      type="password"
                      placeholder="Min 8 chars"
                      value={providerForm.password}
                      onChange={(e) => setProviderForm(f => ({ ...f, password: e.target.value }))}
                      style={{ width: "100%", padding: "10px 12px", background: "#060d1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", color: "#94a3b8", fontSize: "12px", fontWeight: "700", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Gender</label>
                    <select
                      value={providerForm.gender}
                      onChange={(e) => setProviderForm(f => ({ ...f, gender: e.target.value }))}
                      style={{ width: "100%", padding: "10px 12px", background: "#060d1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f1f5f9", fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif", appearance: "none" }}
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateProvider(false)}
                    style={{ padding: "10px 24px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94a3b8", fontWeight: "600", fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={providerLoading}
                    style={{ padding: "10px 24px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #1d4ed8, #0891b2)", color: "#fff", fontWeight: "700", fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", opacity: providerLoading ? 0.7 : 1 }}
                  >
                    {providerLoading ? "Creating..." : "Create Provider"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Revoke Provider Modal */}
        {showRevokeModal && (
          <div className="modal-overlay" onClick={() => setShowRevokeModal(null)}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "20px",
                padding: "32px",
                width: "440px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
              <h2 style={{ color: "#f1f5f9", fontSize: "24px", fontWeight: "800", margin: "0 0 12px 0" }}>
                Revoke Provider Access
              </h2>
              <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 24px 0", lineHeight: 1.6 }}>
                Are you sure you want to revoke Healthcare Provider privileges from <strong style={{ color: "#f1f5f9" }}>{showRevokeModal.name}</strong>?
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button
                  onClick={() => setShowRevokeModal(null)}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "transparent",
                    color: "#94a3b8",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRevokeProvider(showRevokeModal.id)}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#ef4444",
                    color: "#fff",
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Confirm Revoke
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};