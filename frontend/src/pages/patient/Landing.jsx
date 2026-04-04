import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { notificationsAPI, googleFitAPI } from "../../utils/api";

export const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isNewUser = location.state?.newUser === true;
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  // For new patients, auto-redirect to profile setup after a brief welcome
  useEffect(() => {
    if (isNewUser && user?.role === "patient" && !user?.profile_completed) {
      const timer = setTimeout(() => navigate("/profile-setup"), 4000);
      return () => clearTimeout(timer);
    }
  }, [isNewUser, user, navigate]);

  // Silently sync Google Fit in background so Dashboard has fresh data
  useEffect(() => {
    if (
      user?.role === "patient" &&
      localStorage.getItem(`healix_gfit_connected_${user.id}`) === "true"
    ) {
      googleFitAPI
        .sync()
        .then(() => {
          localStorage.setItem(`healix_gfit_last_sync_${user.id}`, new Date().toLocaleString());
          console.log("[HEALIX] Google Fit synced from Landing page");
        })
        .catch(() => {
          console.log("[HEALIX] Google Fit sync skipped on Landing");
        });
    }
  }, [user]);

  useEffect(() => {
    notificationsAPI
      .getAll()
      .then((data) => {
        const list = data?.notifications ?? data;
        if (Array.isArray(list)) setNotifications(list);
      })
      .catch(() => {})
      .finally(() => setLoadingNotifs(false));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case "appointment": return { icon: "📅", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" };
      case "prescription": return { icon: "💊", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" };
      case "goal": return { icon: "🎯", color: "#10b981", bg: "rgba(16,185,129,0.12)" };
      case "provider_message": return { icon: "👨‍⚕️", color: "#0891b2", bg: "rgba(8,145,178,0.12)" };
      default: return { icon: "🔔", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

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

  const quickLinks = user?.role === "patient"
    ? [
        { label: "Dashboard", path: "/patient", icon: "📊", desc: "View your health overview" },
        { label: "Vitals", path: "/patient/vitals", icon: "❤️", desc: "Check your vital signs" },
        { label: "Appointments", path: "/patient/appointments", icon: "📅", desc: "Manage appointments" },
        { label: "Goals", path: "/patient/goals", icon: "🎯", desc: "Track your progress" },
        { label: "Prescriptions", path: "/patient/prescriptions", icon: "💊", desc: "View medications" },
        { label: "AI Assistant", path: "/patient/assistant", icon: "🤖", desc: "Get health insights" },
      ]
    : user?.role === "provider"
    ? [
        { label: "Patients", path: "/provider/patients", icon: "👥", desc: "View patient list" },
        { label: "Appointments", path: "/provider/appointments", icon: "📅", desc: "Manage schedule" },
        { label: "Prescriptions", path: "/provider/prescriptions", icon: "💊", desc: "Manage prescriptions" },
        { label: "Settings", path: "/provider/settings", icon: "⚙️", desc: "Account settings" },
      ]
    : [
        { label: "Users", path: "/admin", icon: "👥", desc: "Manage users" },
        { label: "Appointments", path: "/admin/appointments", icon: "📅", desc: "All appointments" },
        { label: "Prescriptions", path: "/admin/prescriptions", icon: "💊", desc: "All prescriptions" },
        { label: "Settings", path: "/admin/settings", icon: "⚙️", desc: "System settings" },
      ];

  return (
    <div className="page-responsive" style={styles.page}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .ql-card { transition: all .2s ease; cursor: pointer; }
        .ql-card:hover { transform: translateY(-3px); border-color: rgba(59,130,246,0.3) !important; box-shadow: 0 8px 32px rgba(59,130,246,0.1); }
        .notif-item { transition: all .2s ease; }
        .notif-item:hover { background: rgba(255,255,255,0.03); }
      `}</style>

      {/* Hero Section */}
      <div style={{ animation: "fadeUp .5s ease both", marginBottom: "36px" }}>
        <div style={styles.greetingRow}>
          <div>
            <p style={styles.greetingSmall}>{getGreeting()},</p>
            <h1 style={styles.greetingName}>{user?.first_name || "User"}</h1>
          </div>
          <div style={styles.dateBadge}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>
        <p style={styles.welcomeMsg}>
          Welcome to Healix — your personal health companion. Here's what's new for you today.
        </p>
      </div>

      {/* New User Profile Setup Banner */}
      {isNewUser && user?.role === "patient" && !user?.profile_completed && (
        <div style={{ animation: "fadeUp .5s ease .05s both", marginBottom: "24px", padding: "20px 24px", background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(8,145,178,0.12))", border: "1px solid rgba(59,130,246,0.25)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontSize: "28px" }}>👋</span>
            <div>
              <div style={{ color: "var(--text)", fontSize: "15px", fontWeight: "700" }}>Complete your profile</div>
              <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>You'll be redirected to set up your health profile in a moment...</div>
            </div>
          </div>
          <button
            onClick={() => navigate("/profile-setup")}
            style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#3b82f6", color: "#fff", fontWeight: "700", fontSize: "13px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}
          >
            Set Up Now
          </button>
        </div>
      )}

      {/* Notifications */}
      <div style={{ animation: "fadeUp .5s ease .1s both", marginBottom: "36px" }}>
        <div style={styles.sectionHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={styles.sectionTitle}>Notifications</h2>
            {unreadCount > 0 && (
              <span style={styles.badge}>{unreadCount} new</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} style={styles.markAllBtn}>
              Mark all read
            </button>
          )}
        </div>

        <div style={styles.notifCard}>
          {loadingNotifs ? (
            <div style={styles.notifEmpty}>Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div style={styles.notifEmpty}>
              <span style={{ fontSize: "32px", marginBottom: "8px", display: "block" }}>🔔</span>
              You're all caught up! No new notifications.
            </div>
          ) : (
            notifications.slice(0, 8).map((n) => {
              const { icon, color, bg } = getNotifIcon(n.type);
              return (
                <div
                  key={n._id}
                  className="notif-item"
                  onClick={() => !n.read && handleMarkRead(n._id)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                    padding: "16px 20px",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    cursor: n.read ? "default" : "pointer",
                    opacity: n.read ? 0.6 : 1,
                  }}
                >
                  <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                      <span style={{ color: "var(--text)", fontSize: "14px", fontWeight: "700" }}>{n.title}</span>
                      {!n.read && <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: color, flexShrink: 0 }} />}
                    </div>
                    <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0, lineHeight: 1.4 }}>{n.message}</p>
                  </div>
                  <span style={{ color: "var(--text-faint)", fontSize: "12px", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {formatTime(n.created_at)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ animation: "fadeUp .5s ease .2s both" }}>
        <h2 style={{ ...styles.sectionTitle, marginBottom: "16px" }}>Quick Access</h2>
        <div style={styles.quickGrid}>
          {quickLinks.map((link) => (
            <div
              key={link.path}
              className="ql-card"
              onClick={() => navigate(link.path)}
              style={styles.quickCard}
            >
              <div style={styles.quickIcon}>{link.icon}</div>
              <div style={{ fontWeight: "700", color: "var(--text)", fontSize: "15px", marginBottom: "4px" }}>{link.label}</div>
              <div style={{ color: "var(--text-subtle)", fontSize: "12px" }}>{link.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    background: "var(--bg)",
    minHeight: "100vh",
    padding: "40px 48px",
    fontFamily: "'DM Sans', sans-serif",
  },
  greetingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greetingSmall: {
    color: "var(--text-subtle)",
    fontSize: "16px",
    margin: "0 0 4px 0",
    fontWeight: "500",
  },
  greetingName: {
    color: "var(--text)",
    fontSize: "40px",
    fontWeight: "800",
    margin: 0,
    letterSpacing: "-1.5px",
    background: "linear-gradient(135deg, #f1f5f9 0%, #3b82f6 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  dateBadge: {
    padding: "8px 16px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "var(--text-muted)",
    fontSize: "13px",
    fontWeight: "600",
  },
  welcomeMsg: {
    color: "var(--text-subtle)",
    fontSize: "15px",
    margin: "12px 0 0 0",
    maxWidth: "600px",
    lineHeight: 1.6,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  sectionTitle: {
    color: "var(--text)",
    fontSize: "20px",
    fontWeight: "800",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  badge: {
    padding: "3px 10px",
    borderRadius: "20px",
    background: "rgba(59,130,246,0.15)",
    color: "#3b82f6",
    fontSize: "11px",
    fontWeight: "700",
    border: "1px solid rgba(59,130,246,0.3)",
  },
  markAllBtn: {
    background: "none",
    border: "none",
    color: "#3b82f6",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  notifCard: {
    background: "var(--bg-3)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    overflow: "hidden",
  },
  notifEmpty: {
    padding: "40px 20px",
    textAlign: "center",
    color: "var(--text-subtle)",
    fontSize: "14px",
  },
  quickGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "14px",
  },
  quickCard: {
    background: "var(--bg-3)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "20px",
  },
  quickIcon: {
    fontSize: "28px",
    marginBottom: "12px",
  },
};
