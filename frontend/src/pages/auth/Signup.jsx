import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AvatarCustomizer } from "../../components/AvatarCustomizer";
import { useTranslation } from "react-i18next";

export const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false); // kept (not removed)
  const [step, setStep] = useState(1); // ✅ NEW
  const { t } = useTranslation();

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      setError(t("fillAllFields"));
      return;
    }
    if (form.password.length < 8) {
      setError(t("passMin8"));
      return;
    }
    if (!/[A-Z]/.test(form.password)) {
      setError(t("passUppercase"));
      return;
    }
    if (!/[a-z]/.test(form.password)) {
      setError(t("passLowercase"));
      return;
    }
    if (!/\d/.test(form.password)) {
      setError(t("passNumber"));
      return;
    }

    setError("");
    setLoading(true);

    try {
      await register({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        role: "patient",
      });

      setSuccess(true); // kept
      setStep(2); // 

    } catch (err) {
      setError(err.message || t("registrationFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ✅ STEP 1: SIGNUP */}
      {step === 1 && (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0f172a",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              padding: "40px",
              borderRadius: "16px",
              width: "400px",
              boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
            }}
          >
            {/* Logo */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "28px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "9px",
                  background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "14px",
                  color: "#fff",
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

            <h2
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#f1f5f9",
                margin: "0 0 6px 0",
                letterSpacing: "-0.4px",
              }}
            >
              {t("createAccount")}
            </h2>

            <p
              style={{
                color: "#64748b",
                fontSize: "14px",
                margin: "0 0 28px 0",
              }}
            >
              {t("signUpSub")}
            </p>

            {/* Error / Success messages */}
            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                }}
              >
                <span style={{ color: "#f87171", fontSize: "13px" }}>
                  {error}
                </span>
              </div>
            )}

            {success && (
              <div
                style={{
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                }}
              >
                <span style={{ color: "#34d399", fontSize: "13px" }}>
                  {t("accountCreatedAvatar")}
                </span>
              </div>
            )}

            <form onSubmit={handleSignup}>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <input
                  type="text"
                  placeholder="First Name"
                  value={form.first_name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      first_name: e.target.value,
                    }))
                  }
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    background: "#0f172a",
                    color: "#f1f5f9",
                  }}
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={form.last_name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      last_name: e.target.value,
                    }))
                  }
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    background: "#0f172a",
                    color: "#f1f5f9",
                  }}
                />
              </div>

              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                style={{
                  width: "100%",
                  marginBottom: "12px",
                  padding: "12px 14px",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  background: "#0f172a",
                  color: "#f1f5f9",
                }}
              />

              <input
                type="password"
                placeholder="Password (min 8 chars, 1 upper, 1 lower, 1 number)"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                style={{
                  width: "100%",
                  marginBottom: "24px",
                  padding: "12px 14px",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  background: "#0f172a",
                  color: "#f1f5f9",
                }}
              />

              <button type="submit" disabled={loading}>
                {loading ? t("creatingAccount") : t("createAccount")}
              </button>
            </form>

            <p
              style={{
                textAlign: "center",
                marginTop: "20px",
                fontSize: "13px",
                color: "#64748b",
              }}
            >
              t("haveAccount")}{" "}
              <a href="/login" style={{ color: "#60a5fa" }}>
                {t("signIn")}
              </a>
            </p>
          </div>
        </div>
      )}

      {/* ✅ STEP 2: AVATAR */}
      {step === 2 && (
        <AvatarCustomizer
          onSave={(avatarData) => {
            navigate("/patient");
          }}
        />
      )}
    </>
  );
};