import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { notificationsAPI } from "../utils/api";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = () => {
      notificationsAPI.getAll().then(data => {
        if (data?.notifications) setNotifications(data.notifications);
      }).catch(() => {});
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleMarkAllRead = () => {
    notificationsAPI.markAllRead().then(() => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }).catch(() => {});
  };

  const handleMarkRead = (id) => {
    notificationsAPI.markRead(id).then(() => {
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    }).catch(() => {});
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case "appointment": return "📅";
      case "prescription": return "💊";
      case "goal": return "🎯";
      case "provider_message": return "👨‍⚕️";
      default: return "🔔";
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (!user) return null;

  const basePath = `/${user.role}`;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getRoleBadgeColor = () => {
    switch (user.role) {
      case "patient":
        return "#3b82f6";
      case "provider":
        return "#10b981";
      case "admin":
        return "#8b5cf6";
      default:
        return "#64748b";
    }
  };

  return (
    <nav
      style={{
        background: "#0b1220",
        borderBottom: "1px solid #1e293b",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* Logo */}
        <Link
          to={basePath}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <img
            src="/src/assets/logo.png"
            alt="HEALIX"
            style={{ width: "32px", height: "32px" }}
          />
          <span
            style={{
              color: "#f1f5f9",
              fontWeight: "700",
              fontSize: "18px",
              letterSpacing: "-0.3px",
            }}
          >
            HEALIX
          </span>
        </Link>

        {/* Nav Links */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {user?.role === "patient" && [
            { label: "Dashboard", path: basePath },
            { label: "Vitals", path: `${basePath}/vitals` },
            { label: "Goals", path: `${basePath}/goals` },
            { label: "Appointments", path: `${basePath}/appointments` },
            { label: "Prescriptions", path: `${basePath}/prescriptions` },
            { label: "Assistant", path: `${basePath}/assistant` },
            { label: "Settings", path: `${basePath}/settings` },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.path}
              style={{
                color: "#94a3b8",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500",
                padding: "6px 12px",
                borderRadius: "6px",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.color = "#f1f5f9";
                e.target.style.background = "#1e293b";
              }}
              onMouseLeave={(e) => {
                e.target.style.color = "#94a3b8";
                e.target.style.background = "transparent";
              }}
            >
              {item.label}
            </Link>
          ))}

          {user?.role === "provider" && [
            { label: "Patients", path: `${basePath}/patients` },
            { label: "Appointments", path: `${basePath}/appointments` },
            { label: "Prescriptions", path: `${basePath}/prescriptions` },
            { label: "Settings", path: `${basePath}/settings` },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.path}
              style={{
                color: "#94a3b8",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500",
                padding: "6px 12px",
                borderRadius: "6px",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.color = "#f1f5f9";
                e.target.style.background = "#1e293b";
              }}
              onMouseLeave={(e) => {
                e.target.style.color = "#94a3b8";
                e.target.style.background = "transparent";
              }}
            >
              {item.label}
            </Link>
          ))}

          {user?.role === "admin" && [
            { label: "User Management", path: basePath },
            { label: "Appointments", path: `${basePath}/appointments` },
            { label: "Prescriptions", path: `${basePath}/prescriptions` },
            { label: "Settings", path: `${basePath}/settings` },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.path}
              style={{
                color: "#94a3b8",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500",
                padding: "6px 12px",
                borderRadius: "6px",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.color = "#f1f5f9";
                e.target.style.background = "#1e293b";
              }}
              onMouseLeave={(e) => {
                e.target.style.color = "#94a3b8";
                e.target.style.background = "transparent";
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Role Badge */}
          <div
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              background: `${getRoleBadgeColor()}22`,
              border: `1px solid ${getRoleBadgeColor()}44`,
              color: getRoleBadgeColor(),
              fontSize: "12px",
              fontWeight: "700",
              textTransform: "capitalize",
            }}
          >
            {user.role}
          </div>

          {/* Notification Bell */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              onClick={() => setShowNotifs(prev => !prev)}
              style={{
                background: showNotifs ? "#1e293b" : "transparent",
                border: "1px solid #334155",
                color: "#94a3b8",
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "18px",
                cursor: "pointer",
                position: "relative",
                lineHeight: 1,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.color = "#f1f5f9"; }}
              onMouseLeave={(e) => { if (!showNotifs) { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.color = "#94a3b8"; } }}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: "-4px", right: "-4px",
                  background: "#ef4444", color: "#fff", fontSize: "10px", fontWeight: "800",
                  width: "18px", height: "18px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid #0b1220",
                }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifs && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                width: "360px", maxHeight: "440px",
                background: "#0f172a", border: "1px solid #1e293b", borderRadius: "12px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                overflow: "hidden", zIndex: 200,
              }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #1e293b" }}>
                  <span style={{ color: "#f1f5f9", fontWeight: "700", fontSize: "14px" }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead}
                      style={{ background: "none", border: "none", color: "#3b82f6", fontSize: "12px", fontWeight: "600", cursor: "pointer", padding: 0 }}>
                      Mark all read
                    </button>
                  )}
                </div>

                {/* List */}
                <div style={{ maxHeight: "380px", overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "40px 16px", textAlign: "center", color: "#475569", fontSize: "14px" }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n._id}
                        onClick={() => !n.read && handleMarkRead(n._id)}
                        style={{
                          display: "flex", gap: "12px", padding: "12px 16px",
                          borderBottom: "1px solid #1e293b",
                          background: n.read ? "transparent" : "rgba(59,130,246,0.05)",
                          cursor: n.read ? "default" : "pointer",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => { if (!n.read) e.currentTarget.style.background = "rgba(59,130,246,0.1)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = n.read ? "transparent" : "rgba(59,130,246,0.05)"; }}
                      >
                        <span style={{ fontSize: "20px", flexShrink: 0, marginTop: "2px" }}>{getNotifIcon(n.type)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: n.read ? "#94a3b8" : "#f1f5f9", fontSize: "13px", fontWeight: n.read ? "500" : "600", marginBottom: "2px" }}>{n.title}</div>
                          <div style={{ color: "#64748b", fontSize: "12px", lineHeight: "1.4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.message}</div>
                          <div style={{ color: "#475569", fontSize: "11px", marginTop: "4px" }}>{timeAgo(n.created_at)}</div>
                        </div>
                        {!n.read && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6", flexShrink: 0, marginTop: "6px" }} />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              background: "transparent",
              border: "1px solid #334155",
              color: "#94a3b8",
              padding: "6px 16px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "#ef4444";
              e.target.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "#334155";
              e.target.style.color = "#94a3b8";
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};