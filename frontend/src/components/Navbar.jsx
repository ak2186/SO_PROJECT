import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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