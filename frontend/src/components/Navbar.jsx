import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();



  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const basePath =
    user?.role === "patient"
      ? "/patient"
      : user?.role === "provider"
        ? "/provider"
        : "/admin";

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        height: "64px",
        background: "#0f172a",
        borderBottom: "1px solid #1e293b",
        fontFamily: "'DM Sans', sans-serif",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Brand */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          cursor: "pointer",
        }}
        className="healix-logo"
        onClick={() => window.location.reload()}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "800",
            fontSize: "14px",
            color: "#fff",
            letterSpacing: "-0.5px",
          }}
        >
          Hx
        </div>
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
      </div>

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

        {(user?.role === "provider" || user?.role === "admin") && [
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

      {/* Role badge + Logout */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span
          style={{
            fontSize: "12px",
            fontWeight: "600",
            padding: "3px 10px",
            borderRadius: "20px",
            textTransform: "capitalize",
            background:
              user?.role === "patient"
                ? "rgba(59,130,246,0.15)"
                : user?.role === "provider"
                  ? "rgba(16,185,129,0.15)"
                  : "rgba(148,163,184,0.15)",
            color:
              user?.role === "patient"
                ? "#60a5fa"
                : user?.role === "provider"
                  ? "#34d399"
                  : "#94a3b8",
            border:
              user?.role === "patient"
                ? "1px solid rgba(59,130,246,0.3)"
                : user?.role === "provider"
                  ? "1px solid rgba(16,185,129,0.3)"
                  : "1px solid rgba(148,163,184,0.3)",
          }}
        >
          {user?.role}
        </span>
        <button
          onClick={handleLogout}
          style={{
            fontSize: "13px",
            fontWeight: "600",
            padding: "7px 16px",
            borderRadius: "7px",
            border: "1px solid #334155",
            background: "transparent",
            color: "#94a3b8",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#ef4444";
            e.target.style.borderColor = "#ef4444";
            e.target.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "transparent";
            e.target.style.borderColor = "#334155";
            e.target.style.color = "#94a3b8";
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};
