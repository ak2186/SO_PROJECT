import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { notificationsAPI } from "../utils/api";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

export const MobileNav = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [showMore, setShowMore] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.floor((now - d) / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  useEffect(() => {
    if (!user) return;
    notificationsAPI
      .getAll()
      .then((data) => {
        if (data?.notifications) setNotifications(data.notifications);
      })
      .catch(() => {});
    const interval = setInterval(() => {
      notificationsAPI
        .getAll()
        .then((data) => {
          if (data?.notifications) setNotifications(data.notifications);
        })
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  const basePath = `/${user.role}`;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Primary tabs shown in bottom bar (max 4-5 items)
  const tabConfig = {
    patient: [
      { label: t("home"), icon: "🏠", path: basePath },
      { label: t("vitals"), icon: "❤️", path: `${basePath}/vitals` },
      { label: t("appts"), icon: "📅", path: `${basePath}/appointments` },
      { label: t("chat"), icon: "💬", path: `${basePath}/assistant` },
      { label: t("more"), icon: "☰", path: "__more__" },
    ],
    provider: [
      { label: t("patients"), icon: "👥", path: `${basePath}/patients` },
      { label: t("appts"), icon: "📅", path: `${basePath}/appointments` },
      { label: t("rx"), icon: "💊", path: `${basePath}/prescriptions` },
      { label: t("more"), icon: "☰", path: "__more__" },
    ],
    admin: [
      { label: t("users"), icon: "👥", path: basePath },
      { label: t("appts"), icon: "📅", path: `${basePath}/appointments` },
      { label: t("rx"), icon: "💊", path: `${basePath}/prescriptions` },
      { label: t("more"), icon: "☰", path: "__more__" },
    ],
  };

  // Extra links in the "More" sheet
  const moreConfig = {
    patient: [
      { label: t("goals"), icon: "🎯", path: `${basePath}/goals` },
      { label: t("prescriptions"), icon: "💊", path: `${basePath}/prescriptions` },
      { label: t("settings"), icon: "⚙️", path: `${basePath}/settings` },
    ],
    provider: [
      { label: t("settings"), icon: "⚙️", path: `${basePath}/settings` },
    ],
    admin: [
      { label: t("settings"), icon: "⚙️", path: `${basePath}/settings` },
    ],
  };

  const tabs = tabConfig[user.role] || [];
  const moreLinks = moreConfig[user.role] || [];

  const isActive = (path) => {
    if (path === "__more__") return showMore;
    if (path === basePath) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const accentColor =
    user.role === "patient"
      ? "#3b82f6"
      : user.role === "provider"
      ? "#10b981"
      : "#8b5cf6";

  return (
    <>
      <style>{`
        .mobile-bottom-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: var(--nav-bg);
          border-top: 1px solid var(--border);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: space-around;
          z-index: 100;
          padding: 0 4px;
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .mob-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          flex: 1;
          padding: 6px 0;
          text-decoration: none;
          border: none;
          background: transparent;
          cursor: pointer;
          position: relative;
          -webkit-tap-highlight-color: transparent;
        }
        .mob-tab-icon {
          font-size: 20px;
          line-height: 1;
        }
        .mob-tab-label {
          font-size: 10px;
          font-weight: 600;
          font-family: "DM Sans", sans-serif;
        }
        .mob-tab-inactive .mob-tab-label { color: var(--text-subtle); }
        .mob-tab-active .mob-tab-icon { transform: scale(1.1); }
        .mob-notif-dot {
          position: absolute;
          top: 4px;
          right: calc(50% - 16px);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          border: 2px solid var(--nav-bg);
        }
        .mob-more-sheet {
          position: fixed;
          bottom: 64px;
          left: 0;
          right: 0;
          background: var(--bg-2);
          border-top: 1px solid var(--border-2);
          border-radius: 18px 18px 0 0;
          padding: 12px 16px;
          padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
          z-index: 99;
          animation: slideUpSheet 0.25s ease;
          box-shadow: 0 -8px 32px rgba(0,0,0,0.4);
        }
        .mob-more-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.3);
          z-index: 98;
          animation: fadeIn 0.2s ease;
        }
        @keyframes slideUpSheet {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .mob-more-link {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 12px;
          border-radius: 12px;
          text-decoration: none;
          transition: background 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .mob-more-link:active {
          background: var(--surface-3);
        }
        .mob-more-icon {
          font-size: 20px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: var(--surface-2);
        }
        .mob-more-label {
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
          font-family: "DM Sans", sans-serif;
        }
        .mob-more-divider {
          height: 1px;
          background: var(--border);
          margin: 4px 0;
        }
        .mob-topbar {
          position: sticky;
          top: 0;
          z-index: 90;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: var(--nav-bg);
          border-bottom: 1px solid var(--border);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
      `}</style>

      {/* Top bar — logo + notifications */}
      <div className="mob-topbar">
        <Link to={basePath} style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
          <img src="/src/assets/logo.png" alt="HEALIX" style={{ width: "26px", height: "26px" }} />
          <span
            style={{
              background: "linear-gradient(135deg, #f1f5f9, #94a3b8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: "700",
              fontSize: "16px",
            }}
          >
            HEALIX
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Role badge */}
          <span
            style={{
              padding: "3px 9px",
              borderRadius: "20px",
              background: `${accentColor}18`,
              border: `1px solid ${accentColor}35`,
              color: accentColor,
              fontSize: "10px",
              fontWeight: "700",
              textTransform: "uppercase",
            }}
          >
            {user.role}
          </span>

          {/* Language Switcher */}
          <LanguageSwitcher />
          
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{
              background: "transparent",
              border: "1px solid var(--border-mid)",
              borderRadius: "7px",
              padding: "4px 8px",
              fontSize: "14px",
              cursor: "pointer",
              lineHeight: 1,
              color: "var(--text-muted)",
            }}
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          {/* Notification bell */}
          <button
            onClick={() => { setShowNotifs((p) => !p); setShowMore(false); }}
            style={{
              background: "transparent",
              border: "1px solid var(--border-mid)",
              borderRadius: "7px",
              padding: "4px 8px",
              fontSize: "14px",
              cursor: "pointer",
              lineHeight: 1,
              position: "relative",
              color: "var(--text-muted)",
            }}
          >
            🔔
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  background: "#ef4444",
                  color: "#fff",
                  fontSize: "8px",
                  fontWeight: "800",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid var(--nav-bg)",
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notification Panel */}
      {showNotifs && (
        <>
          <div className="mob-more-overlay" onClick={() => setShowNotifs(false)} />
          <div
            style={{
              position: "fixed",
              bottom: "64px",
              left: "8px",
              right: "8px",
              maxHeight: "60vh",
              background: "var(--bg-2)",
              border: "1px solid var(--border-2)",
              borderRadius: "14px",
              overflow: "hidden",
              zIndex: 99,
              animation: "slideUpSheet 0.25s ease",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
              <span style={{ color: "var(--text)", fontWeight: "700", fontSize: "15px", fontFamily: "'DM Sans', sans-serif" }}>
                {t("notifications")} {unreadCount > 0 && <span style={{ color: accentColor, fontSize: "12px" }}>({unreadCount} {t("new")})</span>}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={{ background: "none", border: "none", color: accentColor, fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                >
                  {t("markAllRead")}
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ overflowY: "auto", maxHeight: "calc(60vh - 50px)" }}>
              {notifications.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-subtle)", fontSize: "13px" }}>
                  🔔 {t("noNotifications")}
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n._id}
                    onClick={() => !n.read && handleMarkRead(n._id)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--border)",
                      opacity: n.read ? 0.5 : 1,
                      cursor: n.read ? "default" : "pointer",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "var(--text)", fontSize: "13px", fontWeight: "600" }}>{n.title}</div>
                      <div style={{ color: "var(--text-subtle)", fontSize: "12px", marginTop: "2px", lineHeight: 1.3 }}>{n.message}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                      <span style={{ color: "var(--text-faint)", fontSize: "10px", whiteSpace: "nowrap" }}>{formatTime(n.created_at)}</span>
                      {!n.read && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: accentColor, flexShrink: 0 }} />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Bottom Tab Bar */}
      <div className="mobile-bottom-bar">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          if (tab.path === "__more__") {
            return (
              <button
                key="more"
                className={`mob-tab ${active ? "mob-tab-active" : "mob-tab-inactive"}`}
                onClick={() => { setShowMore((p) => !p); setShowNotifs(false); }}
              >
                <span className="mob-tab-icon">{tab.icon}</span>
                <span className="mob-tab-label" style={{ color: active ? accentColor : undefined }}>
                  {tab.label}
                </span>
              </button>
            );
          }
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`mob-tab ${active ? "mob-tab-active" : "mob-tab-inactive"}`}
              onClick={() => { setShowMore(false); setShowNotifs(false); }}
            >
              <span className="mob-tab-icon">{tab.icon}</span>
              <span className="mob-tab-label" style={{ color: active ? accentColor : undefined }}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* "More" Bottom Sheet */}
      {showMore && (
        <>
          <div className="mob-more-overlay" onClick={() => setShowMore(false)} />
          <div className="mob-more-sheet">
            {/* Extra nav links */}
            {moreLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="mob-more-link"
                onClick={() => setShowMore(false)}
              >
                <span className="mob-more-icon">{link.icon}</span>
                <span className="mob-more-label">{link.label}</span>
              </Link>
            ))}

            <div className="mob-more-divider" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="mob-more-link"
              style={{ width: "100%", border: "none", background: "transparent", cursor: "pointer" }}
            >
              <span className="mob-more-icon" style={{ background: "rgba(239,68,68,0.12)" }}>🚪</span>
              <span className="mob-more-label" style={{ color: "#ef4444" }}>{t("logout")}</span>
            </button>
          </div>
        </>
      )}
    </>
  );
};
