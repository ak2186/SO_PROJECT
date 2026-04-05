import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [signupForm, setSignupForm] = useState({ first_name: "", last_name: "", email: "", password: "", date_of_birth: "", gender: "" });
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      setLoginError("Please enter email and password.");
      return;
    }
    setLoginError("");
    setLoginLoading(true);
    try {
      const user = await login(loginForm.email, loginForm.password);
      if (user.role === "admin") {
        navigate("/admin");
      } else if (!user.profile_completed) {
        navigate("/landing", { state: { newUser: true } });
      } else {
        navigate("/landing");
      }
    } catch (err) {
      setLoginError(err.message || "Login failed. Check your credentials.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!signupForm.first_name || !signupForm.last_name || !signupForm.email || !signupForm.password || !signupForm.date_of_birth || !signupForm.gender) {
      setSignupError("Please fill all fields.");
      return;
    }
    if (signupForm.password.length < 8) {
      setSignupError("Password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(signupForm.password)) {
      setSignupError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[a-z]/.test(signupForm.password)) {
      setSignupError("Password must contain at least one lowercase letter.");
      return;
    }
    if (!/\d/.test(signupForm.password)) {
      setSignupError("Password must contain at least one number.");
      return;
    }
    setSignupError("");
    setSignupSuccess(false);
    setSignupLoading(true);
    try {
      await register({
        first_name: signupForm.first_name,
        last_name: signupForm.last_name,
        email: signupForm.email,
        password: signupForm.password,
        date_of_birth: signupForm.date_of_birth,
        gender: signupForm.gender,
        role: "patient",
      });
      setSignupSuccess(true);
      setTimeout(() => {
        setMode("login");
      }, 1500);
    } catch (err) {
      setSignupError(err.message || "Registration failed.");
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <style>{`
        .auth-page {
          --bg: #f3f7ff;
          --panel: #ffffff;
          --text: #0f172a;
          --muted: #64748b;
          --line: #d5deee;
          --input-bg: #f8fbff;
          --primary: #1d4ed8;
          --primary-2: #0891b2;
          --danger-bg: rgba(239, 68, 68, 0.08);
          --danger-line: rgba(239, 68, 68, 0.25);
          --danger-text: #dc2626;
          --success-bg: rgba(16, 185, 129, 0.1);
          --success-line: rgba(16, 185, 129, 0.3);
          --success-text: #047857;
          min-height: 100vh;
          background:
            radial-gradient(circle at 15% 20%, rgba(29, 78, 216, 0.08), transparent 35%),
            radial-gradient(circle at 85% 80%, rgba(8, 145, 178, 0.1), transparent 40%),
            var(--bg);
          display: grid;
          grid-template-columns: minmax(320px, 1fr) 560px;
          overflow: hidden;
          font-family: "DM Sans", sans-serif;
        }

        .auth-brand {
          position: relative;
          padding: 48px;
          display: flex;
          align-items: stretch;
          justify-content: center;
          overflow: hidden;
          color: #eff6ff;
          background: linear-gradient(150deg, #0b1e52 0%, #13307d 35%, #0f766e 100%);
        }

        .auth-brand-iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
          pointer-events: none;
          z-index: 0;
          opacity: 0.96;
        }

        .auth-brand-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(to right, rgba(11, 30, 82, 0.36), rgba(11, 30, 82, 0.14)),
            linear-gradient(to bottom, rgba(5, 12, 36, 0.42), rgba(5, 12, 36, 0.1) 36%, rgba(5, 12, 36, 0.46));
          z-index: 1;
        }

        .auth-brand::before,
        .auth-brand::after {
          content: "";
          position: absolute;
          border-radius: 999px;
          filter: blur(2px);
          opacity: 0.5;
          transition: transform 0.5s ease-in-out, opacity 0.5s ease-in-out;
        }

        .auth-brand::before {
          width: 240px;
          height: 240px;
          top: -40px;
          right: 12%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.22), transparent 70%);
          transform: translateY(0px);
        }

        .auth-brand::after {
          width: 280px;
          height: 280px;
          bottom: -70px;
          left: 6%;
          background: radial-gradient(circle, rgba(153, 246, 228, 0.24), transparent 70%);
          transform: translateY(0px);
        }

        .auth-brand.signup::before { transform: translateY(24px); opacity: 0.35; }
        .auth-brand.signup::after { transform: translateY(-20px); opacity: 0.6; }

        .auth-brand-content {
          position: relative;
          z-index: 2;
          width: min(520px, 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 24px;
        }

        .brand-mark {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 12px;
          font-weight: 700;
          opacity: 0.9;
        }

        .brand-logo {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(191, 219, 254, 0.9));
          color: #1e3a8a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 13px;
        }

        .brand-title {
          margin: 0;
          font-size: clamp(34px, 4.4vw, 56px);
          line-height: 1.06;
          letter-spacing: -0.02em;
          transition: transform 0.5s ease-in-out, opacity 0.5s ease-in-out;
        }

        .brand-copy {
          margin: 0;
          max-width: 38ch;
          color: rgba(239, 246, 255, 0.84);
          font-size: 16px;
          line-height: 1.6;
          transition: transform 0.5s ease-in-out, opacity 0.5s ease-in-out;
        }

        .brand-title.shift,
        .brand-copy.shift {
          transform: translateX(10px);
          opacity: 0.82;
        }

        .auth-shell {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 36px;
          border-left: 1px solid var(--line);
        }

        .auth-viewport {
          width: min(480px, 100%);
          overflow: hidden;
          border-radius: 22px;
          background: var(--panel);
          border: 1px solid #e6ebf5;
          box-shadow: 0 24px 60px rgba(30, 64, 175, 0.14);
        }

        .auth-track {
          width: 200%;
          display: flex;
          transform: translateX(0%);
          transition: transform 0.5s ease-in-out;
        }

        .auth-track.signup {
          transform: translateX(-50%);
        }

        .auth-panel {
          width: 50%;
          padding: 32px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }

        .auth-panel form {
          width: 100%;
          text-align: left;
        }

        .auth-headline {
          margin: 0;
          font-size: 28px;
          letter-spacing: -0.02em;
          color: var(--text);
        }

        .auth-sub {
          margin: 8px 0 22px;
          color: var(--muted);
          font-size: 14px;
        }

        .auth-alert {
          border-radius: 10px;
          padding: 10px 12px;
          margin-bottom: 14px;
          font-size: 13px;
          border: 1px solid;
        }

        .auth-alert.error {
          background: var(--danger-bg);
          border-color: var(--danger-line);
          color: var(--danger-text);
        }

        .auth-alert.success {
          background: var(--success-bg);
          border-color: var(--success-line);
          color: var(--success-text);
        }

        .auth-grid-two {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .auth-field {
          margin-bottom: 10px;
        }

        .auth-label {
          display: block;
          margin-bottom: 6px;
          color: var(--muted);
          font-size: 12px;
          letter-spacing: 0.05em;
          font-weight: 700;
          text-transform: uppercase;
        }

        .auth-input {
          width: 100%;
          border-radius: 10px;
          border: 1px solid #cfd9eb;
          background: var(--input-bg);
          color: var(--text);
          padding: 12px 13px;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          font-family: "DM Sans", sans-serif;
        }

        .auth-input:focus {
          border-color: rgba(29, 78, 216, 0.65);
          box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.13);
        }

        .auth-button {
          width: 100%;
          margin-top: 8px;
          border: none;
          border-radius: 10px;
          padding: 12px;
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          background: linear-gradient(135deg, var(--primary), var(--primary-2));
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .auth-button:hover { transform: translateY(-1px); }
        .auth-button:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

        .auth-toggle {
          margin-top: 18px;
          text-align: center;
          color: var(--muted);
          font-size: 13px;
        }

        .auth-link {
          margin-left: 6px;
          border: none;
          background: none;
          cursor: pointer;
          color: #1d4ed8;
          font-weight: 700;
          padding: 0;
          font-size: 13px;
        }

        @media (max-width: 960px) {
          .auth-page {
            grid-template-columns: 1fr;
            background: #f7faff;
          }

          .auth-brand {
            min-height: 240px;
            padding: 28px;
          }

          .auth-shell {
            padding: 18px;
            border-left: none;
          }

          .auth-viewport {
            width: min(540px, 100%);
          }

          .auth-track,
          .auth-track.signup {
            width: 100%;
            display: grid;
            transform: none;
          }

          .auth-panel {
            width: 100%;
            grid-area: 1 / 1;
            transition: opacity 0.5s ease-in-out;
          }

          .auth-panel.login {
            opacity: 1;
            pointer-events: auto;
          }

          .auth-panel.signup {
            opacity: 0;
            pointer-events: none;
          }

          .auth-track.signup .auth-panel.login {
            opacity: 0;
            pointer-events: none;
          }

          .auth-track.signup .auth-panel.signup {
            opacity: 1;
            pointer-events: auto;
          }
        }

        @media (max-width: 520px) {
          .auth-panel { padding: 24px 20px; }
          .auth-grid-two { grid-template-columns: 1fr; }
        }
      `}</style>

      <section className={`auth-brand ${mode === "signup" ? "signup" : ""}`}>
        <iframe
          className="auth-brand-iframe"
          src="https://my.spline.design/dnaparticles-H9a9B1mCrxLMHtp0t6jwEYbt/"
          title="Healix DNA background"
        />
        <div className="auth-brand-overlay" />
        <div className="auth-brand-content">
          <span className="brand-mark">
            <span className="brand-logo">Hx</span>
            Healix
          </span>

          <h1 className={`brand-title ${mode === "signup" ? "shift" : ""}`}>
            {mode === "signup" ? "Build Better Health Habits" : "Welcome Back to Healix"}
          </h1>
          <p className={`brand-copy ${mode === "signup" ? "shift" : ""}`}>
            {mode === "signup"
              ? "Create your account and start tracking goals, vitals, appointments, and personalized care insights in one place."
              : "Continue your care journey with real-time vitals, personalized goals, and connected provider support."}
          </p>
        </div>
      </section>

      <section className="auth-shell">
        <div className="auth-viewport">
          <div className={`auth-track ${mode === "signup" ? "signup" : ""}`}>
            <div className="auth-panel login">
              <h2 className="auth-headline">Sign In</h2>
              <p className="auth-sub">Track your health journey with HEALIX</p>

              {loginError && <div className="auth-alert error">{loginError}</div>}

              <form onSubmit={handleLogin}>
                <div className="auth-field">
                  <label className="auth-label">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="auth-input"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="auth-input"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                  />
                </div>

                <button type="submit" className="auth-button" disabled={loginLoading}>
                  {loginLoading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="auth-toggle">
                Don&apos;t have an account?
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => {
                    setSignupError("");
                    setSignupSuccess(false);
                    setMode("signup");
                  }}
                >
                  Sign Up
                </button>
              </div>
            </div>

            <div className="auth-panel signup">
              <h2 className="auth-headline">Create Account</h2>
              <p className="auth-sub">Start your health journey with HEALIX</p>

              {signupError && <div className="auth-alert error">{signupError}</div>}
              {signupSuccess && (
                <div className="auth-alert success">Account created! Switching to sign in...</div>
              )}

              <form onSubmit={handleSignup}>
                <div className="auth-grid-two">
                  <div className="auth-field">
                    <label className="auth-label">First Name</label>
                    <input
                      type="text"
                      placeholder="First Name"
                      className="auth-input"
                      value={signupForm.first_name}
                      onChange={(e) => setSignupForm((f) => ({ ...f, first_name: e.target.value }))}
                    />
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Last Name</label>
                    <input
                      type="text"
                      placeholder="Last Name"
                      className="auth-input"
                      value={signupForm.last_name}
                      onChange={(e) => setSignupForm((f) => ({ ...f, last_name: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="auth-grid-two">
                  <div className="auth-field">
                    <label className="auth-label">Date of Birth</label>
                    <input
                      type="date"
                      className="auth-input"
                      value={signupForm.date_of_birth}
                      onChange={(e) => setSignupForm((f) => ({ ...f, date_of_birth: e.target.value }))}
                    />
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Gender</label>
                    <select
                      className="auth-input"
                      value={signupForm.gender}
                      onChange={(e) => setSignupForm((f) => ({ ...f, gender: e.target.value }))}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="auth-input"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label">Password</label>
                  <input
                    type="password"
                    placeholder="Password (min 8 chars, 1 upper, 1 lower, 1 number)"
                    className="auth-input"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm((f) => ({ ...f, password: e.target.value }))}
                  />
                </div>

                <button type="submit" className="auth-button" disabled={signupLoading}>
                  {signupLoading ? "Creating Account..." : "Create Account"}
                </button>
              </form>

              <div className="auth-toggle">
                Already have an account?
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => {
                    setLoginError("");
                    setMode("login");
                  }}
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
