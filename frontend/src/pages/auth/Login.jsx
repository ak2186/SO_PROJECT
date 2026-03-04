import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please enter email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (email, password) => {
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.message || "Demo login failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: "'DM Sans', sans-serif",
        background: "#f8f9ff",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .login-input {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 10px;
          background: rgba(255,255,255,0.8);
          color: #1e293b;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .login-input:focus {
          border-color: rgba(59,130,246,0.5) !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1) !important;
        }
        .login-input::placeholder { color: #94a3b8; }

        .role-btn {
          width: 100%;
          padding: 11px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .role-btn:hover {
          transform: translateY(-2px);
        }

        /* hide Spline watermark area */
        .spline-wrap iframe {
          border: none;
        }
      `}</style>

      {/* ── LEFT PANEL — Spline DNA full height ── */}
      <div
        className="spline-wrap"
        style={{
          flex: "1",
          position: "relative",
          overflow: "hidden",
          animation: "fadeIn 1s ease both",
        }}
      >
        <iframe
          src="https://my.spline.design/dnaparticles-H9a9B1mCrxLMHtp0t6jwEYbt/"
          frameBorder="0"
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />

        {/* subtle right-side vignette */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "120px",
            height: "100%",
            background: "linear-gradient(to right, transparent, #f8f9ff)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />

        {/* top + bottom dark fades */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "180px",
          background: "linear-gradient(to bottom, #f8f9ff, transparent)",
          pointerEvents: "none", zIndex: 2,
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "180px",
          background: "linear-gradient(to top, #f8f9ff, transparent)",
          pointerEvents: "none", zIndex: 2,
        }} />

        {/* ── HEALIX centered text overlay ── */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 4,
            textAlign: "center",
            pointerEvents: "none",
            animation: "textReveal 1.8s cubic-bezier(0.16,1,0.3,1) 0.3s both",
          }}
        >
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;600&display=swap');

            @keyframes textReveal {
              from {
                opacity: 0;
                transform: translate(-50%, -44%);
                letter-spacing: 28px;
              }
              to {
                opacity: 1;
                transform: translate(-50%, -50%);
                letter-spacing: 14px;
              }
            }

            @keyframes shimmer {
              0%   { background-position: -400px center; }
              100% { background-position: 400px center; }
            }

            .healix-title {
              font-family: 'Cormorant Garamond', serif;
              font-size: 80px;
              font-weight: 600;
              letter-spacing: 14px;
              text-transform: uppercase;
              background: linear-gradient(
                90deg,
                #1a1a2e 0%,
                #16213e 30%,
                #2d4a8a 55%,
                #16213e 70%,
                #1a1a2e 100%
              );
              background-size: 400px 100%;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              animation: shimmer 4s ease-in-out 2s infinite;
              margin: 0;
              line-height: 1;
              text-shadow: none;
              filter: drop-shadow(0 2px 16px rgba(30,60,180,0.18));
            }

            .healix-tagline {
              font-family: 'DM Sans', sans-serif;
              font-size: 11px;
              font-weight: 700;
              letter-spacing: 5px;
              text-transform: uppercase;
              color: rgba(20, 30, 80, 0.7);
              margin-top: 14px;
              animation: fadeUp 1s ease 1.2s both;
            }

            .healix-line {
              width: 60px;
              height: 2px;
              background: linear-gradient(to right, transparent, rgba(30,80,200,0.5), transparent);
              margin: 12px auto 0;
              animation: fadeIn 1s ease 1.5s both;
            }
          `}</style>

          <h1 className="healix-title">Healix</h1>
          <div className="healix-line" />

          <p className="healix-tagline">Your Health. Visualized</p>
        </div>

      </div>

      {/* ── RIGHT PANEL — Login card ── */}
      <div
        style={{
          width: "460px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 48px",
          background: "#f8f9ff",
          borderLeft: "1px solid rgba(0,0,0,0.06)",
          animation: "slideInRight 0.7s cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        <div style={{ width: "100%" }}>

          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "40px",
              animation: "fadeUp 0.5s ease 0.2s both",
            }}
          >
            <img
              src="/src/assets/logo.png"
              alt="HEALIX logo"
              style={{ width: "36px", height: "36px", objectFit: "contain" }}
            />
            <span
              style={{
                color: "#1C398E",
                fontWeight: "700",
                fontSize: "18px",
                letterSpacing: "-0.3px",
              }}
            >
              HEALIX
            </span>
          </div>

          {/* Heading */}
          <h2
            style={{
              fontSize: "26px",
              fontWeight: "700",
              color: "#0f172a",
              margin: "0 0 6px 0",
              letterSpacing: "-0.5px",
              animation: "fadeUp 0.5s ease 0.28s both",
            }}
          >
            Welcome Back
          </h2>
          <p
            style={{
              color: "#64748b",
              fontSize: "14px",
              margin: "0 0 32px 0",
              animation: "fadeUp 0.5s ease 0.33s both",
            }}
          >
            Track your health journey with HEALIX
          </p>

          {/* Error Message */}
          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px", animation: "fadeUp 0.3s ease both" }}>
              <span style={{ color: "#f87171", fontSize: "13px", fontWeight: "500" }}>{error}</span>
            </div>
          )}

          {/* Email */}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "12px", animation: "fadeUp 0.5s ease 0.38s both" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#94a3b8",
                  marginBottom: "6px",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="login-input"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "20px", animation: "fadeUp 0.5s ease 0.43s both" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#94a3b8",
                  marginBottom: "6px",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="login-input"
                value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                color: "#fff",
                fontWeight: "700",
                fontSize: "15px",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                opacity: loading ? 0.7 : 1,
                marginBottom: "8px",
                animation: "fadeUp 0.5s ease 0.46s both",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
              animation: "fadeUp 0.5s ease 0.46s both",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "rgba(0,0,0,0.08)" }} />
            <span style={{ fontSize: "11px", color: "#cbd5e1", fontWeight: "600", letterSpacing: "1px" }}>
              DEMO ACCESS
            </span>
            <div style={{ flex: 1, height: "1px", background: "rgba(0,0,0,0.08)" }} />
          </div>

          {/* Demo Role buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", animation: "fadeUp 0.5s ease 0.5s both" }}>
            <button
              className="role-btn"
              disabled={loading}
              onClick={() => handleDemoLogin("patient@healix.com", "Patient123!")}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#2563eb";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(59,130,246,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#1d4ed8";
                e.currentTarget.style.boxShadow = "none";
              }}
              style={{
                background: "#1d4ed8",
                color: "#fff",
                border: "none",
                opacity: loading ? 0.6 : 1,
              }}
            >
              Demo: Patient
            </button>

            <button
              className="role-btn"
              disabled={loading}
              onClick={() => handleDemoLogin("provider@healix.com", "Provider123!")}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#10b981";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(16,185,129,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#059669";
                e.currentTarget.style.boxShadow = "none";
              }}
              style={{
                background: "#059669",
                color: "#fff",
                border: "none",
                opacity: loading ? 0.6 : 1,
              }}
            >
              Demo: Provider
            </button>

            <button
              className="role-btn"
              disabled={loading}
              onClick={() => handleDemoLogin("admin@healix.com", "Admin123!")}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.boxShadow = "none";
              }}
              style={{
                background: "transparent",
                color: "#94a3b8",
                border: "1px solid rgba(255,255,255,0.08)",
                opacity: loading ? 0.6 : 1,
              }}
            >
              Demo: Admin
            </button>
          </div>

          <p
            style={{
              textAlign: "center",
              marginTop: "24px",
              fontSize: "13px",
              color: "#94a3b8",
              animation: "fadeUp 0.5s ease 0.55s both",
            }}
          >
            Don't have an account?{" "}
            <a href="/signup" style={{ color: "#3b82f6", textDecoration: "none", fontWeight: "600" }}>
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
