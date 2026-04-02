import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { notificationsAPI, gamificationAPI } from "../utils/api";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  const [gamification, setGamification] = useState(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [achieveDetails, setAchieveDetails] = useState(null);
  const [achieveTab, setAchieveTab] = useState("overview");

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
    if (!user || user.role !== "patient") return;
    gamificationAPI.getMe().then(data => {
      if (data) setGamification(data);
    }).catch(() => {});
  }, [user]);

  const openAchievements = () => {
    setShowAchievements(true);
    setAchieveTab("overview");
    gamificationAPI.getDetails().then(data => {
      if (data) {
        setAchieveDetails(data);
        setGamification(prev => prev ? { ...prev, xp: data.xp, level: data.level, level_name: data.level_name, xp_for_next_level: data.xp_for_next_level, streak_count: data.streak_count } : prev);
      }
    }).catch(() => {});
  };

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
    const utc = dateStr && !dateStr.endsWith("Z") ? dateStr + "Z" : dateStr;
    const diff = Date.now() - new Date(utc).getTime();
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
        .level-badge-btn:hover {
          background: rgba(99,102,241,0.12) !important;
        }
        .achieve-tab {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          font-family: "DM Sans", sans-serif;
          transition: background 0.15s, color 0.15s;
          color: var(--text-muted);
          background: transparent;
        }
        .achieve-tab:hover {
          background: var(--surface-2);
          color: var(--text);
        }
        .achieve-tab.active {
          background: rgba(99,102,241,0.15);
          color: #6366f1;
        }
        .achieve-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
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
            {/* Level Badge (patients only) */}
            {user.role === "patient" && gamification && (
              <button
                onClick={openAchievements}
                title="View Achievements"
                className="level-badge-btn"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "3px 10px 3px 3px",
                  borderRadius: "20px",
                  transition: "background 0.15s ease",
                }}
              >
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: `conic-gradient(#6366f1 ${Math.min((gamification.xp / gamification.xp_for_next_level) * 100, 100)}%, var(--border-solid) 0%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: "var(--nav-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <span style={{ fontWeight: "800", fontSize: "11px", color: "var(--text)", lineHeight: 1 }}>
                      {gamification.level}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)" }}>
                  {gamification.level_name}
                </span>
              </button>
            )}

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

      {/* Achievements Modal */}
      {showAchievements && (
        <div className="achieve-overlay" onClick={() => setShowAchievements(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--border-2)",
              borderRadius: "20px",
              width: "600px",
              maxWidth: "92vw",
              maxHeight: "85vh",
              overflow: "hidden",
              boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
              animation: "slideUp 0.3s ease",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: "24px 28px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "var(--text)" }}>
                Achievements
              </h2>
              <button
                onClick={() => setShowAchievements(false)}
                style={{
                  background: "var(--surface-2)",
                  border: "none",
                  color: "var(--text-muted)",
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  fontSize: "18px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div style={{ padding: "16px 28px 0", display: "flex", gap: "4px" }}>
              {[
                { id: "overview", label: "Overview" },
                { id: "badges", label: "Badges" },
                { id: "xp", label: "XP Guide" },
                { id: "challenges", label: "Challenges" },
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`achieve-tab${achieveTab === tab.id ? " active" : ""}`}
                  onClick={() => setAchieveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ padding: "20px 28px 28px", overflowY: "auto", flex: 1 }}>
              {!achieveDetails ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-subtle)" }}>Loading...</div>
              ) : (
                <>
                  {/* Overview Tab */}
                  {achieveTab === "overview" && (
                    <div>
                      {/* Level Card */}
                      <div style={{
                        background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))",
                        border: "1px solid rgba(99,102,241,0.2)",
                        borderRadius: "16px",
                        padding: "24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        marginBottom: "20px",
                      }}>
                        <div style={{
                          width: "72px",
                          height: "72px",
                          borderRadius: "50%",
                          background: `conic-gradient(#6366f1 ${Math.min((achieveDetails.xp / achieveDetails.xp_for_next_level) * 100, 100)}%, var(--border-solid) 0%)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <div style={{
                            width: "58px",
                            height: "58px",
                            borderRadius: "50%",
                            background: "var(--bg-2)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                            <span style={{ fontWeight: "800", fontSize: "22px", color: "var(--text)", lineHeight: 1 }}>
                              {achieveDetails.level}
                            </span>
                            <span style={{ fontSize: "8px", fontWeight: "700", color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              {achieveDetails.level_name}
                            </span>
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--text)", marginBottom: "4px" }}>
                            Level {achieveDetails.level} — {achieveDetails.level_name}
                          </div>
                          <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" }}>
                            {achieveDetails.xp} / {achieveDetails.xp_for_next_level} XP
                            {achieveDetails.level < achieveDetails.all_levels.length && (
                              <span> · Next: {achieveDetails.all_levels[achieveDetails.level]?.name}</span>
                            )}
                          </div>
                          <div style={{
                            height: "6px",
                            borderRadius: "3px",
                            background: "var(--border-solid)",
                            overflow: "hidden",
                          }}>
                            <div style={{
                              height: "100%",
                              borderRadius: "3px",
                              background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                              width: `${Math.min((achieveDetails.xp / achieveDetails.xp_for_next_level) * 100, 100)}%`,
                              transition: "width 0.5s ease",
                            }} />
                          </div>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
                        <div style={{
                          background: "var(--bg-3)",
                          borderRadius: "12px",
                          padding: "16px",
                          textAlign: "center",
                          border: "1px solid var(--border)",
                        }}>
                          <div style={{ fontSize: "24px", fontWeight: "800", color: "#6366f1" }}>{achieveDetails.xp}</div>
                          <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-subtle)", textTransform: "uppercase" }}>Total XP</div>
                        </div>
                        <div style={{
                          background: "var(--bg-3)",
                          borderRadius: "12px",
                          padding: "16px",
                          textAlign: "center",
                          border: "1px solid var(--border)",
                        }}>
                          <div style={{ fontSize: "24px", fontWeight: "800", color: "#f59e0b" }}>
                            {achieveDetails.streak_count}
                          </div>
                          <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-subtle)", textTransform: "uppercase" }}>Day Streak</div>
                        </div>
                        <div style={{
                          background: "var(--bg-3)",
                          borderRadius: "12px",
                          padding: "16px",
                          textAlign: "center",
                          border: "1px solid var(--border)",
                        }}>
                          <div style={{ fontSize: "24px", fontWeight: "800", color: "#10b981" }}>
                            {achieveDetails.badges.filter(b => b.earned).length}/{achieveDetails.badges.length}
                          </div>
                          <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-subtle)", textTransform: "uppercase" }}>Badges</div>
                        </div>
                      </div>

                      {/* Levels Roadmap */}
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text)", marginBottom: "10px" }}>Level Roadmap</div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {achieveDetails.all_levels.map(l => (
                          <div key={l.level} style={{
                            padding: "8px 14px",
                            borderRadius: "10px",
                            background: achieveDetails.level >= l.level ? "rgba(99,102,241,0.15)" : "var(--bg-3)",
                            border: `1px solid ${achieveDetails.level >= l.level ? "rgba(99,102,241,0.3)" : "var(--border)"}`,
                            opacity: achieveDetails.level >= l.level ? 1 : 0.5,
                          }}>
                            <div style={{ fontSize: "12px", fontWeight: "700", color: achieveDetails.level >= l.level ? "#6366f1" : "var(--text-muted)" }}>
                              Lv.{l.level} {l.name}
                            </div>
                            <div style={{ fontSize: "10px", color: "var(--text-subtle)" }}>{l.xp_required} XP</div>
                          </div>
                        ))}
                      </div>

                      {/* Recent Activity */}
                      {achieveDetails.recent_activity.length > 0 && (
                        <div style={{ marginTop: "20px" }}>
                          <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text)", marginBottom: "10px" }}>Recent Activity</div>
                          {achieveDetails.recent_activity.slice(0, 8).map((a, i) => (
                            <div key={i} style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "8px 0",
                              borderBottom: "1px solid var(--border)",
                              fontSize: "13px",
                            }}>
                              <span style={{ color: "var(--text-muted)" }}>
                                {achieveDetails.xp_guide.find(g => g.action === a.action)?.label || a.action}
                              </span>
                              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                <span style={{ color: "#6366f1", fontWeight: "700" }}>+{a.xp} XP</span>
                                <span style={{ color: "var(--text-subtle)", fontSize: "11px" }}>{a.date}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Badges Tab */}
                  {achieveTab === "badges" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                      {achieveDetails.badges.map(b => (
                        <div key={b.id} style={{
                          background: b.earned ? "rgba(99,102,241,0.08)" : "var(--bg-3)",
                          border: `1px solid ${b.earned ? "rgba(99,102,241,0.2)" : "var(--border)"}`,
                          borderRadius: "14px",
                          padding: "16px",
                          opacity: b.earned ? 1 : 0.45,
                          transition: "opacity 0.2s",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                            <span style={{ fontSize: "24px" }}>{b.emoji}</span>
                            <div>
                              <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text)" }}>{b.name}</div>
                              <div style={{ fontSize: "11px", color: "var(--text-subtle)" }}>
                                {b.earned ? `Earned ${b.earned_at ? new Date(b.earned_at).toLocaleDateString() : ""}` : "Not earned yet"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* XP Guide Tab */}
                  {achieveTab === "xp" && (
                    <div>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                        Earn XP by completing daily health activities. Each action can be rewarded once per day.
                      </div>
                      {achieveDetails.xp_guide.map(g => (
                        <div key={g.action} style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 14px",
                          borderRadius: "10px",
                          background: "var(--bg-3)",
                          border: "1px solid var(--border)",
                          marginBottom: "8px",
                        }}>
                          <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>{g.label}</span>
                          <span style={{
                            background: "rgba(99,102,241,0.12)",
                            color: "#6366f1",
                            fontWeight: "700",
                            fontSize: "13px",
                            padding: "3px 10px",
                            borderRadius: "20px",
                          }}>
                            +{g.xp} XP
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Challenges Tab */}
                  {achieveTab === "challenges" && (
                    <div>
                      {/* Today's Challenge */}
                      {achieveDetails.challenge && (
                        <div style={{
                          background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.06))",
                          border: "1px solid rgba(245,158,11,0.25)",
                          borderRadius: "14px",
                          padding: "18px",
                          marginBottom: "20px",
                        }}>
                          <div style={{ fontSize: "11px", fontWeight: "700", color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                            Today's Challenge {achieveDetails.challenge.completed ? "✅" : ""}
                          </div>
                          <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--text)", marginBottom: "4px" }}>
                            {achieveDetails.challenge.title}
                          </div>
                          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                            {achieveDetails.challenge.description} · <span style={{ color: "#6366f1", fontWeight: "600" }}>+{achieveDetails.challenge.xp_reward} XP</span>
                          </div>
                        </div>
                      )}

                      <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text)", marginBottom: "10px" }}>All Challenges</div>
                      <div style={{ fontSize: "12px", color: "var(--text-subtle)", marginBottom: "12px" }}>
                        A new challenge is selected each day from this pool.
                      </div>
                      {achieveDetails.challenges.map(c => (
                        <div key={c.id} style={{
                          padding: "10px 14px",
                          borderRadius: "10px",
                          background: "var(--bg-3)",
                          border: "1px solid var(--border)",
                          marginBottom: "8px",
                        }}>
                          <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text)" }}>{c.title}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{c.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
