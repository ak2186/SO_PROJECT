import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../utils/api";

export const ProfileSetup = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    blood_type: "",
    height: "",
    weight: "",
    phone_number: "",
    medical_insurance: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.phone_number || !form.emergency_contact_name || !form.emergency_contact_phone) {
      setError("Please fill in at least Phone Number and Emergency Contact details.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authAPI.updateProfile({
        blood_type: form.blood_type || null,
        height: form.height ? parseFloat(form.height) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        phone_number: form.phone_number,
        medical_insurance: form.medical_insurance || null,
        emergency_contact_name: form.emergency_contact_name,
        emergency_contact_phone: form.emergency_contact_phone,
        emergency_contact_relationship: form.emergency_contact_relationship || null,
        profile_completed: true,
      });
      await refreshUser();
      navigate("/patient");
    } catch (err) {
      if (err.status === 401) {
        navigate("/login");
        return;
      }
      setError(err.message || "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await authAPI.updateProfile({ profile_completed: true });
      await refreshUser();
      navigate("/patient");
    } catch {
      navigate("/patient");
    }
  };

  return (
    <div style={styles.page}>
      <style>{`
        .ps-input { width:100%; border-radius:10px; border:1px solid rgba(255,255,255,0.12); background:var(--bg-3); color:var(--text); padding:12px 14px; font-size:14px; outline:none; box-sizing:border-box; font-family:'DM Sans',sans-serif; transition:border-color .2s,box-shadow .2s; }
        .ps-input:focus { border-color:rgba(59,130,246,0.6); box-shadow:0 0 0 3px rgba(59,130,246,0.15); }
        .ps-select { appearance:none; cursor:pointer; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={styles.card}>
        <div style={{ animation: "fadeUp .6s ease both" }}>
          <div style={styles.iconWrap}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <h1 style={styles.title}>Complete Your Profile</h1>
          <p style={styles.subtitle}>
            Hi {user?.first_name}! Help us personalize your care by filling in a few details.
          </p>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={styles.section}>
              <div style={styles.sectionLabel}>Health Information</div>
              <div style={styles.grid3}>
                <div>
                  <label style={styles.label}>Blood Type</label>
                  <select className="ps-input ps-select" value={form.blood_type} onChange={set("blood_type")}>
                    <option value="">Select</option>
                    {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Height (cm)</label>
                  <input className="ps-input" type="number" placeholder="e.g. 175" value={form.height} onChange={set("height")} />
                </div>
                <div>
                  <label style={styles.label}>Weight (kg)</label>
                  <input className="ps-input" type="number" placeholder="e.g. 70" value={form.weight} onChange={set("weight")} />
                </div>
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionLabel}>Contact & Insurance</div>
              <div style={styles.grid2}>
                <div>
                  <label style={styles.label}>Phone Number *</label>
                  <input className="ps-input" type="tel" placeholder="+1 (555) 000-0000" value={form.phone_number} onChange={set("phone_number")} />
                </div>
                <div>
                  <label style={styles.label}>Medical Insurance</label>
                  <input className="ps-input" type="text" placeholder="e.g. Blue Cross Blue Shield" value={form.medical_insurance} onChange={set("medical_insurance")} />
                </div>
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionLabel}>Emergency Contact</div>
              <div style={styles.grid3}>
                <div>
                  <label style={styles.label}>Name *</label>
                  <input className="ps-input" type="text" placeholder="Contact name" value={form.emergency_contact_name} onChange={set("emergency_contact_name")} />
                </div>
                <div>
                  <label style={styles.label}>Phone *</label>
                  <input className="ps-input" type="tel" placeholder="+1 (555) 000-0000" value={form.emergency_contact_phone} onChange={set("emergency_contact_phone")} />
                </div>
                <div>
                  <label style={styles.label}>Relationship</label>
                  <select className="ps-input ps-select" value={form.emergency_contact_relationship} onChange={set("emergency_contact_relationship")}>
                    <option value="">Select</option>
                    {["Spouse","Parent","Sibling","Child","Friend","Other"].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div style={styles.actions}>
              <button type="button" onClick={handleSkip} style={styles.skipBtn}>
                Skip for now
              </button>
              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? "Saving..." : "Save & Continue"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #060d1a 0%, #0f172a 50%, #0c1929 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    width: "min(680px, 100%)",
    background: "#0a1628",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "40px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
  },
  iconWrap: {
    width: "64px",
    height: "64px",
    borderRadius: "16px",
    background: "rgba(59,130,246,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
  },
  title: {
    color: "var(--text)",
    fontSize: "28px",
    fontWeight: "800",
    margin: "0 0 8px 0",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    color: "var(--text-subtle)",
    fontSize: "15px",
    margin: "0 0 28px 0",
    lineHeight: 1.5,
  },
  error: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.25)",
    color: "#ef4444",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "13px",
    marginBottom: "18px",
  },
  section: {
    marginBottom: "24px",
  },
  sectionLabel: {
    color: "var(--text-muted)",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "12px",
  },
  label: {
    display: "block",
    color: "var(--text-muted)",
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "6px",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "14px",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "32px",
  },
  skipBtn: {
    padding: "12px 24px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color: "var(--text-muted)",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
  submitBtn: {
    padding: "12px 28px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #1d4ed8, #0891b2)",
    color: "#fff",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
};
