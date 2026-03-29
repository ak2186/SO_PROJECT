import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { notificationsAPI } from "../utils/api";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

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
      case "patient":  return "#3b82f6";
      case "provider": return "#10b981";
      case "admin":    return "#8b5cf6";
      default:         return "#64748b";
    }
  };

  const isActive = (path) => {
    if (path === basePath) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const navLinks = {
    patient: [
      { label: "Dashboard",     path: basePath },
      { label: "Vitals",        path: `${basePath}/vitals` },
      { label: "Goals",         path: `${basePath}/goals` },
      { label: "Appointments",  path: `${basePath}/appointments` },
      { label: "Prescriptions", path: `${basePath}/prescriptions` },
      { label: "Assistant",     path: `${basePath}/assistant` },
      { label: "Settings",      path: `${basePath}/settings` },
    ],
    provider: [
      { label: "Patients",      path: `${basePath}/patients` },
      { label: "Appointments",  path: `${basePath}/appointments` },
      { label: "Prescriptions", path: `${basePath}/prescriptions` },
      { label: "Settings",      path: `${basePath}/settings` },
    ],
    admin: [
      { label: "User Management", path: basePath },
      { label: "Appointments",    path: `${basePath}/appointments` },
      { label: "Prescriptions",   path: `${basePath}/prescriptions` },
      { label: "Settings",        path: `${basePath}/settings` },
    ],
  };

  const links = navLinks[user.role] || [];
  const accentColor = getRoleBadgeColor();

  return (
    <>
      <style>{`
        @keyframes pulse-badge {
          0%, 100% { transform: scale(1);    box-shadow: 0 0 0 0   rgba(239,68,68,0.6); }
          50%       { transform: scale(1.18); box-shadow: 0 0 0 5px rgba(239,68,68,0);   }
        }
        .nav-link {
          color: var(--text-muted);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 7px;
          transition: color 0.15s ease, background 0.15s ease;
          position: relative;
        }
        .nav-link:hover {
          color: var(--text);
          background: var(--surface-2);
        }
        .nav-link.active {
          color: var(--text);
          background: var(--surface-3);
          font-weight: 600;
        }
        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 2px;
          border-radius: 2px 2px 0 0;
          background: ${accentColor};
        }
        .notif-badge {
          position: absolute;
          top: -4px; right: -4px;
          background: #ef4444;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          width: 18px; height: 18px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid rgba(6,13,26,0.9);
          animation: pulse-badge 2s ease-in-out infinite;
        }
        .logout-btn {
          background: transparent;
          border: 1px solid var(--border-mid);
          color: var(--text-muted);
          padding: 6px 16px;
          border-radius: 7px;
          font-size: 14px;
          font-weight: 600;
          font-family: "DM Sans", sans-serif;
          cursor: pointer;
          transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
        }
        .logout-btn:hover {
          border-color: var(--danger);
          color: var(--danger);
          background: rgba(239,68,68,0.06);
        }
        .bell-btn {
          background: transparent;
          border: 1px solid var(--border-mid);
          color: var(--text-muted);
          padding: 6px 10px;
          border-radius: 7px;
          font-size: 18px;
          cursor: pointer;
          position: relative;
          line-height: 1;
          transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
        }
        .bell-btn:hover, .bell-btn.open {
          border-color: var(--primary);
          color: var(--text);
          background: rgba(59,130,246,0.08);
        }
        .notif-row:hover {
          background: rgba(59,130,246,0.1) !important;
        }
      `}</style>

      <nav
        style={{
          background: "var(--nav-bg)",
          borderBottom: "1px solid var(--border)",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.3)",
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
            style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
          >
            <img src="/src/assets/logo.png" alt="HEALIX" style={{ width: "32px", height: "32px" }} />
            <span style={{
              background: "linear-gradient(135deg, #f1f5f9, #94a3b8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: "700",
              fontSize: "18px",
              letterSpacing: "-0.3px",
            }}>
              HEALIX
            </span>
          </Link>

          {/* Nav Links */}
          <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            {links.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={`nav-link${isActive(item.path) ? " active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Role Badge */}
            <div style={{
              padding: "5px 11px",
              borderRadius: "20px",
              background: `${accentColor}18`,
              border: `1px solid ${accentColor}35`,
              color: accentColor,
              fontSize: "11px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}>
              {user.role}
            </div>

            {/* Notification Bell */}
            <div ref={notifRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotifs(prev => !prev)}
                className={`bell-btn${showNotifs ? " open" : ""}`}
              >
                🔔
                {unreadCount > 0 && (
                  <span className="notif-badge">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifs && (
                <div style={{
                  position: "absolute", top: "calc(100% + 10px)", right: 0,
                  width: "360px", maxHeight: "440px",
                  background: "var(--bg-3)",
                  border: "1px solid var(--border-2)",
                  borderRadius: "14px",
                  boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
                  overflow: "hidden", zIndex: 200,
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                }}>
                  {/* Header */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 16px",
                    borderBottom: "1px solid var(--border)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "#f1f5f9", fontWeight: "700", fontSize: "14px" }}>Notifications</span>
                      {unreadCount > 0 && (
                        <span style={{
                          background: "rgba(59,130,246,0.15)",
                          color: "#3b82f6",
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "1px 7px",
                          borderRadius: "20px",
                          border: "1px solid rgba(59,130,246,0.25)",
                        }}>
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} style={{
                        background: "none", border: "none",
                        color: "#3b82f6", fontSize: "12px", fontWeight: "600",
                        cursor: "pointer", padding: 0,
                        fontFamily: "DM Sans, sans-serif",
                      }}>
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div style={{ maxHeight: "380px", overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "48px 16px", textAlign: "center" }}>
                        <div style={{ fontSize: "32px", marginBottom: "10px" }}>🔕</div>
                        <div style={{ color: "#f1f5f9", fontWeight: "600", fontSize: "14px", marginBottom: "4px" }}>
                          You're all caught up
                        </div>
                        <div style={{ color: "#475569", fontSize: "13px" }}>No notifications yet</div>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          className="notif-row"
                          onClick={() => !n.read && handleMarkRead(n._id)}
                          style={{
                            display: "flex", gap: "12px", padding: "12px 16px",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                            background: n.read ? "transparent" : "rgba(59,130,246,0.06)",
                            cursor: n.read ? "default" : "pointer",
                            transition: "background 0.15s ease",
                          }}
                        >
                          <span style={{ fontSize: "20px", flexShrink: 0, marginTop: "2px" }}>
                            {getNotifIcon(n.type)}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              color: n.read ? "#94a3b8" : "#f1f5f9",
                              fontSize: "13px",
                              fontWeight: n.read ? "500" : "600",
                              marginBottom: "2px",
                            }}>
                              {n.title}
                            </div>
                            <div style={{
                              color: "#64748b", fontSize: "12px", lineHeight: "1.4",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {n.message}
                            </div>
                            <div style={{ color: "#475569", fontSize: "11px", marginTop: "4px" }}>
                              {timeAgo(n.created_at)}
                            </div>
                          </div>
                          {!n.read && (
                            <span style={{
                              width: "7px", height: "7px", borderRadius: "50%",
                              background: "#3b82f6", flexShrink: 0, marginTop: "6px",
                            }} />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              style={{
                background: "transparent",
                border: "1px solid var(--border-mid)",
                color: "var(--text-muted)",
                padding: "6px 10px",
                borderRadius: "7px",
                fontSize: "16px",
                cursor: "pointer",
                lineHeight: 1,
                transition: "border-color 0.15s ease, background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.background = "rgba(59,130,246,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-mid)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              {isDark ? "☀️" : "🌙"}
            </button>

            {/* Logout Button */}
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};
