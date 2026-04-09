import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { authAPI } from "../../utils/api";
import LanguageSwitcher from "../../components/LanguageSwitcher";

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
  const { t } = useTranslation();

  // Forgot password state
  const [forgotStep, setForgotStep] = useState(1); // 1=email, 2=otp, 3=new password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState(["", "", "", "", "", ""]);
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotConfirmPass, setForgotConfirmPass] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  const getPassStrength = (p) => {
    if (!p) return { width: "0%", color: "#e2e8f0", label: "" };
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const map = [
      { width: "0%",   color: "#e2e8f0", label: "" },
      { width: "25%",  color: "#ef4444", label: t("weakPass") },
      { width: "50%",  color: "#f97316", label: t("fairPass") },
      { width: "75%",  color: "#eab308", label: t("goodPass") },
      { width: "100%", color: "#10b981", label: t("strongPass") },
    ];
    return map[Math.min(score, 4)];
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      setLoginError(t("enterEmailPassword"));
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
      setLoginError(err.message || t("loginFailed"));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!signupForm.first_name || !signupForm.last_name || !signupForm.email || !signupForm.password || !signupForm.date_of_birth || !signupForm.gender) {
      setSignupError(t("fillAllFields"));
      return;
    }
    if (signupForm.password.length < 8) {
      setSignupError(t("passMin8"));
      return;
    }
    if (!/[A-Z]/.test(signupForm.password)) {
      setSignupError(t("passUppercase"));
      return;
    }
    if (!/[a-z]/.test(signupForm.password)) {
      setSignupError(t("passLowercase"));
      return;
    }
    if (!/\d/.test(signupForm.password)) {
      setSignupError(t("passNumber"));
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
      setSignupError(err.message || t("registrationFailed"));
    } finally {
      setSignupLoading(false);
    }
  };

  // ── Forgot password handlers ──

  const handleForgotSendOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail) { setForgotError(t("enterEmail") || "Please enter your email"); return; }
    setForgotError(""); setForgotSuccess(""); setForgotLoading(true);
    try {
      const res = await authAPI.forgotPassword(forgotEmail);
      setForgotSuccess(res.message);
      setResendTimer(60);
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.message || "Failed to send code");
    } finally { setForgotLoading(false); }
  };

  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const next = [...forgotOtp];
    next[index] = value;
    setForgotOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !forgotOtp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...forgotOtp];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || "";
    setForgotOtp(next);
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs.current[focusIdx]?.focus();
  };

  const handleForgotVerifyOtp = async (e) => {
    e.preventDefault();
    const code = forgotOtp.join("");
    if (code.length !== 6) { setForgotError("Please enter the full 6-digit code"); return; }
    setForgotError(""); setForgotSuccess(""); setForgotLoading(true);
    try {
      const res = await authAPI.verifyOtp(forgotEmail, code);
      setResetToken(res.reset_token);
      setForgotSuccess(res.message);
      setForgotStep(3);
    } catch (err) {
      setForgotError(err.message || "Invalid code");
    } finally { setForgotLoading(false); }
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    if (forgotNewPass.length < 8) { setForgotError("Password must be at least 8 characters"); return; }
    if (forgotNewPass !== forgotConfirmPass) { setForgotError("Passwords do not match"); return; }
    setForgotError(""); setForgotSuccess(""); setForgotLoading(true);
    try {
      const res = await authAPI.resetPassword(resetToken, forgotNewPass);
      setForgotSuccess(res.message);
      setTimeout(() => {
        setMode("login");
        setForgotStep(1); setForgotEmail(""); setForgotOtp(["","","","","",""]); setForgotNewPass(""); setForgotConfirmPass(""); setForgotError(""); setForgotSuccess(""); setResetToken("");
      }, 2000);
    } catch (err) {
      setForgotError(err.message || "Reset failed");
    } finally { setForgotLoading(false); }
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
          position: relative;
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

        [dir="rtl"] .auth-track.signup {
          transform: translateX(50%);
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

        .auth-forgot-overlay {
          position: absolute;
          inset: 0;
          background: var(--panel);
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 22px;
          padding: 32px;
          box-sizing: border-box;
          animation: forgotFadeIn 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes forgotFadeIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .forgot-inner {
          width: 100%;
          max-width: 360px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .forgot-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(29,78,216,0.1), rgba(8,145,178,0.1));
          border: 1.5px solid rgba(29,78,216,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          font-size: 28px;
        }

        .forgot-steps {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 22px;
        }

        .forgot-step-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #d5deee;
          transition: all 0.3s ease;
        }

        .forgot-step-dot.active {
          width: 24px;
          background: linear-gradient(90deg, #1d4ed8, #0891b2);
        }

        .forgot-step-dot.done {
          background: #10b981;
        }

        .forgot-headline {
          margin: 0 0 6px;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text);
        }

        .forgot-sub {
          margin: 0 0 22px;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.55;
          max-width: 28ch;
        }

        .forgot-sub strong {
          color: var(--text);
          font-weight: 600;
        }

        .forgot-form {
          width: 100%;
          text-align: left;
        }

        .otp-container {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-bottom: 20px;
        }

        .otp-box {
          width: 46px;
          height: 54px;
          border-radius: 12px;
          border: 1.5px solid #cfd9eb;
          background: var(--input-bg);
          color: var(--text);
          font-size: 22px;
          font-weight: 700;
          text-align: center;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          font-family: "DM Sans", monospace;
          caret-color: #1d4ed8;
        }

        .otp-box:focus {
          border-color: rgba(29, 78, 216, 0.65);
          box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.13);
          background: #fff;
        }

        .otp-box.filled {
          border-color: rgba(16, 185, 129, 0.5);
          background: rgba(16, 185, 129, 0.04);
        }

        .pass-strength {
          height: 3px;
          border-radius: 999px;
          background: #e2e8f0;
          margin: -4px 0 10px;
          overflow: hidden;
        }

        .pass-strength-bar {
          height: 100%;
          border-radius: 999px;
          transition: width 0.3s ease, background 0.3s ease;
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
      <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 10 }}>
        <LanguageSwitcher />
      </div>
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
            {mode === "signup" ? t("buildBetterHabits") : t("welcomeBack")}
          </h1>
          <p className={`brand-copy ${mode === "signup" ? "shift" : ""}`}>
            {mode === "signup" ? t("signupBrandDesc") : t("loginBrandDesc")}
          </p>
        </div>
      </section>

      <section className="auth-shell">
        <div className="auth-viewport">
          <div className={`auth-track ${mode === "signup" ? "signup" : ""}`}>
            <div className="auth-panel login">
              <h2 className="auth-headline">{t("signIn")}</h2>
              <p className="auth-sub">{t("signInSub")}</p>

              {loginError && <div className="auth-alert error">{loginError}</div>}

              <form onSubmit={handleLogin}>
                <div className="auth-field">
                  <label className="auth-label">{t("email")}</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="auth-input"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label">{t("password")}</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="auth-input"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                  />
                </div>

                <button type="submit" className="auth-button" disabled={loginLoading}>
                  {loginLoading ? t("signingIn") : t("signIn")}
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: "10px" }}>
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => {
                    setForgotError(""); setForgotSuccess(""); setForgotStep(1);
                    setForgotEmail(""); setForgotOtp(["","","","","",""]);
                    setMode("forgot");
                  }}
                  style={{ fontSize: "13px" }}
                >
                  {t("forgotPassword")}
                </button>
              </div>

              <div className="auth-toggle">
                {t("noAccount")}
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => {
                    setSignupError("");
                    setSignupSuccess(false);
                    setMode("signup");
                  }}
                >
                  {t("signUp")}
                </button>
              </div>
            </div>

            <div className="auth-panel signup">
              <h2 className="auth-headline">{t("createAccount")}</h2>
              <p className="auth-sub">{t("signUpSub")}</p>

              {signupError && <div className="auth-alert error">{signupError}</div>}
              {signupSuccess && (
                <div className="auth-alert success">{t("accountCreated")}</div>
              )}

              <form onSubmit={handleSignup}>
                <div className="auth-grid-two">
                  <div className="auth-field">
                    <label className="auth-label">{t("firstName")}</label>
                    <input
                      type="text"
                      placeholder="First Name"
                      className="auth-input"
                      value={signupForm.first_name}
                      onChange={(e) => setSignupForm((f) => ({ ...f, first_name: e.target.value }))}
                    />
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">{t("lastName")}</label>
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
                    <label className="auth-label">{t("dateOfBirth")}</label>
                    <input
                      type="date"
                      className="auth-input"
                      value={signupForm.date_of_birth}
                      onChange={(e) => setSignupForm((f) => ({ ...f, date_of_birth: e.target.value }))}
                    />
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">{t("gender")}</label>
                    <select
                      className="auth-input"
                      value={signupForm.gender}
                      onChange={(e) => setSignupForm((f) => ({ ...f, gender: e.target.value }))}
                    >
                      <option value="">{t("selectGender")}</option>
                      <option value="male">{t("male")}</option>
                      <option value="female">{t("female")}</option>
                      <option value="other">{t("other")}</option>
                      <option value="prefer_not_to_say">{t("preferNotToSay")}</option>
                    </select>
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label">{t("email")}</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="auth-input"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label">{t("password")}</label>
                  <input
                    type="password"
                    placeholder="Password (min 8 chars, 1 upper, 1 lower, 1 number)"
                    className="auth-input"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm((f) => ({ ...f, password: e.target.value }))}
                  />
                </div>

                <button type="submit" className="auth-button" disabled={signupLoading}>
                  {signupLoading ? t("creatingAccount") : t("createAccount")}
                </button>
              </form>

              <div className="auth-toggle">
                {t("haveAccount")}
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => {
                    setLoginError("");
                    setMode("login");
                  }}
                >
                  {t("signIn")}
                </button>
              </div>
            </div>
          </div>

          {/* ── Forgot Password Overlay ── */}
          {mode === "forgot" && (
            <div className="auth-forgot-overlay">
              <div className="forgot-inner">

                {/* Icon */}
                <div className="forgot-icon-wrap">
                  {forgotStep === 1 && "✉️"}
                  {forgotStep === 2 && "🔐"}
                  {forgotStep === 3 && "🔒"}
                </div>

                {/* Step dots */}
                <div className="forgot-steps">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`forgot-step-dot ${forgotStep === s ? "active" : forgotStep > s ? "done" : ""}`}
                    />
                  ))}
                </div>

                {/* Heading */}
                <h2 className="forgot-headline">
                  {forgotStep === 1 && t("forgotHeading1")}
                  {forgotStep === 2 && t("forgotHeading2")}
                  {forgotStep === 3 && t("forgotHeading3")}
                </h2>

                <p className="forgot-sub">
                  {forgotStep === 1 && t("forgotSub1")}
                  {forgotStep === 2 && (<>{t("codeSentTo")} <strong>{forgotEmail}</strong>{t("enterBelow")}</>)}
                  {forgotStep === 3 && t("forgotSub3")}
                </p>

                {forgotError && <div className="auth-alert error" style={{ width: "100%", boxSizing: "border-box", marginBottom: "14px" }}>{forgotError}</div>}
                {forgotSuccess && forgotStep !== 2 && <div className="auth-alert success" style={{ width: "100%", boxSizing: "border-box", marginBottom: "14px" }}>{forgotSuccess}</div>}

                {/* Step 1: Email */}
                {forgotStep === 1 && (
                  <form className="forgot-form" onSubmit={handleForgotSendOtp}>
                    <div className="auth-field">
                      <label className="auth-label">{t("emailAddress")}</label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        className="auth-input"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <button type="submit" className="auth-button" disabled={forgotLoading}>
                      {forgotLoading ? t("sending") : t("sendResetCode")}
                    </button>
                  </form>
                )}

                {/* Step 2: OTP */}
                {forgotStep === 2 && (
                  <form className="forgot-form" onSubmit={handleForgotVerifyOtp}>
                    <div className="otp-container" onPaste={handleOtpPaste}>
                      {forgotOtp.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => (otpRefs.current[i] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          className={`otp-box${digit ? " filled" : ""}`}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          autoFocus={i === 0}
                        />
                      ))}
                    </div>
                    <button
                      type="submit"
                      className="auth-button"
                      disabled={forgotLoading || forgotOtp.join("").length !== 6}
                    >
                      {forgotLoading ? t("verifying") : t("verifyCode")}
                    </button>
                    <div style={{ textAlign: "center", marginTop: "14px", fontSize: "13px", color: "var(--muted)" }}>
                      {resendTimer > 0 ? (
                        <>{t("resendIn")} <strong style={{ color: "var(--text)" }}>{resendTimer}s</strong></>
                      ) : (
                        <button
                          type="button"
                          className="auth-link"
                          onClick={() => {
                            setForgotOtp(["", "", "", "", "", ""]);
                            setForgotError("");
                            setForgotSuccess("");
                            setForgotStep(1);
                          }}
                        >
                          {t("resendCode")}
                        </button>
                      )}
                    </div>
                  </form>
                )}

                {/* Step 3: New Password */}
                {forgotStep === 3 && (
                  <form className="forgot-form" onSubmit={handleForgotReset}>
                    <div className="auth-field">
                      <label className="auth-label">{t("newPasswordLabel")}</label>
                      <input
                        type="password"
                        placeholder={t("minChars")}
                        className="auth-input"
                        value={forgotNewPass}
                        onChange={(e) => setForgotNewPass(e.target.value)}
                        autoFocus
                      />
                      {forgotNewPass && (() => {
                        const s = getPassStrength(forgotNewPass);
                        return (
                          <div style={{ marginTop: "6px" }}>
                            <div className="pass-strength">
                              <div className="pass-strength-bar" style={{ width: s.width, background: s.color }} />
                            </div>
                            <div style={{ fontSize: "11px", color: s.color, fontWeight: 600, textAlign: "right" }}>{s.label}</div>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">{t("confirmPasswordLabel")}</label>
                      <input
                        type="password"
                        placeholder={t("reEnterPassword")}
                        className="auth-input"
                        value={forgotConfirmPass}
                        onChange={(e) => setForgotConfirmPass(e.target.value)}
                        style={forgotConfirmPass && forgotConfirmPass !== forgotNewPass ? { borderColor: "rgba(239,68,68,0.6)" } : {}}
                      />
                    </div>
                    <button type="submit" className="auth-button" disabled={forgotLoading}>
                      {forgotLoading ? t("resetting") : t("resetPasswordBtn")}
                    </button>
                  </form>
                )}

                <div style={{ marginTop: "18px" }}>
                  <button
                    type="button"
                    className="auth-link"
                    style={{ fontSize: "13px", color: "var(--muted)", fontWeight: 500 }}
                    onClick={() => { setMode("login"); setForgotError(""); setForgotSuccess(""); }}
                  >
                    {t("backToSignIn")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
