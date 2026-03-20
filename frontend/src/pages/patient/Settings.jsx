import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { googleFitAPI, authAPI } from "../../utils/api";

export const Settings = () => {
  const { user, refreshUser } = useAuth();
  const [personal, setPersonal] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    phone_number: user?.phone_number || "",
    date_of_birth: user?.date_of_birth || "",
    gender: user?.gender || "",
    age: user?.age ?? "",
    health_conditions: user?.health_conditions || "",
    blood_type: user?.blood_type || "",
    height: user?.height ?? "",
    weight: user?.weight ?? "",
    medical_insurance: user?.medical_insurance || "",
    emergency_contact_name: user?.emergency_contact_name || "",
    emergency_contact_phone: user?.emergency_contact_phone || "",
    emergency_contact_relationship: user?.emergency_contact_relationship || "",
  });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [activeSection, setActiveSection] = useState("personal");
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Google Fit state
  const [gfitConnected, setGfitConnected] = useState(false);
  const [gfitSyncing, setGfitSyncing] = useState(false);
  const [gfitLastSync, setGfitLastSync] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("healix_gfit_connected");
    if (stored === "true") {
      setGfitConnected(true);
      const lastSync = localStorage.getItem("healix_gfit_last_sync");
      if (lastSync) setGfitLastSync(lastSync);
    }

    // Listen for postMessage from Google OAuth popup callback
    const handleMessage = (event) => {
      if (event.data?.type === "GFIT_CONNECTED") {
        localStorage.setItem("healix_gfit_connected", "true");
        setGfitConnected(true);
        showToast("Google Fit connected! Click 'Sync Now' to pull your data.");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePersonalSave = async () => {
    const e = {};
    if (!personal.first_name.trim()) e.first_name = "First name is required";
    if (!personal.last_name.trim()) e.last_name = "Last name is required";
    if (!personal.email.includes("@")) e.email = "Valid email required";
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setSaving(true);

    try {
      // Build update payload — only send non-empty values
      const payload = {};
      payload.first_name = personal.first_name.trim();
      payload.last_name = personal.last_name.trim();
      payload.email = personal.email.trim();
      if (personal.phone_number) payload.phone_number = personal.phone_number.trim();
      if (personal.date_of_birth) payload.date_of_birth = personal.date_of_birth;
      if (personal.gender) payload.gender = personal.gender;
      if (personal.age !== "" && personal.age !== null) payload.age = Number(personal.age);
      if (personal.health_conditions) payload.health_conditions = personal.health_conditions.trim();
      if (personal.blood_type) payload.blood_type = personal.blood_type;
      if (personal.height !== "" && personal.height !== null) payload.height = Number(personal.height);
      if (personal.weight !== "" && personal.weight !== null) payload.weight = Number(personal.weight);
      if (personal.medical_insurance) payload.medical_insurance = personal.medical_insurance.trim();
      if (personal.emergency_contact_name) payload.emergency_contact_name = personal.emergency_contact_name.trim();
      if (personal.emergency_contact_phone) payload.emergency_contact_phone = personal.emergency_contact_phone.trim();
      if (personal.emergency_contact_relationship) payload.emergency_contact_relationship = personal.emergency_contact_relationship.trim();

      await authAPI.updateProfile(payload);
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      showToast("Personal details updated!");
    } catch (err) {
      showToast(err.message || "Failed to save changes", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = () => {
    const e = {};
    if (!passwords.current) e.current = "Enter your current password";
    if (passwords.newPass.length < 8) e.newPass = "Password must be at least 8 characters";
    if (passwords.newPass !== passwords.confirm) e.confirm = "Passwords do not match";
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setPasswords({ current: "", newPass: "", confirm: "" });
    showToast("Password changed successfully!");
  };

  const handleGfitConnect = async () => {
    try {
      const data = await googleFitAPI.connect();
      if (data?.auth_url) {
        window.open(data.auth_url, "_blank", "width=500,height=600");
        showToast("Complete sign-in in the popup window, then click 'Sync Now'");
        localStorage.setItem("healix_gfit_connected", "true");
        setGfitConnected(true);
      }
    } catch (err) {
      showToast(err.message || "Failed to connect Google Fit", "error");
    }
  };

  const handleGfitSync = async () => {
    setGfitSyncing(true);
    try {
      const result = await googleFitAPI.sync();
      const now = new Date().toLocaleString();
      setGfitLastSync(now);
      localStorage.setItem("healix_gfit_last_sync", now);
      localStorage.setItem("healix_gfit_connected", "true");
      setGfitConnected(true);

      const synced = Object.keys(result?.synced_data || {});
      const syncErrors = result?.errors || [];
      let msg = synced.length ? `Synced: ${synced.join(", ")}` : "No new data found";
      if (syncErrors.length) msg += ` | Skipped: ${syncErrors.length}`;
      showToast(msg);
    } catch (err) {
      const msg = err.message || "Sync failed";
      if (msg.includes("not connected") || msg.includes("expired") || msg.includes("reconnect")) {
        setGfitConnected(false);
        localStorage.removeItem("healix_gfit_connected");
        showToast("Google Fit session expired. Please reconnect.", "error");
      } else {
        showToast(msg, "error");
      }
    } finally {
      setGfitSyncing(false);
    }
  };

  const handleGfitDisconnect = () => {
    localStorage.removeItem("healix_gfit_connected");
    localStorage.removeItem("healix_gfit_last_sync");
    setGfitConnected(false);
    setGfitLastSync(null);
    showToast("Google Fit disconnected");
  };

  const sections = [
    { id: "personal", label: "Personal Details", icon: "👤" },
    { id: "password", label: "Change Password", icon: "🔒" },
    { id: "integrations", label: "Integrations", icon: "🔗" },
  ];

  const labelStyle = { display: "block", color: "#64748b", fontSize: "12px", fontWeight: "600", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" };

  const inputStyle = (err) => ({
    width: "100%",
    padding: "12px 14px",
    border: `1px solid ${err ? "#ef4444" : "#1e293b"}`,
    borderRadius: "10px",
    background: "#060d1a",
    color: "#f1f5f9",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.2s",
  });

  const selectStyle = {
    ...inputStyle(false),
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    paddingRight: "36px",
  };

  const sectionDivider = (title) => (
    <div style={{ gridColumn: "1/-1", marginTop: "12px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "12px" }}>
      <span style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "700", whiteSpace: "nowrap" }}>{title}</span>
      <div style={{ flex: 1, height: "1px", background: "#1e293b" }} />
    </div>
  );

  const displayName = `${personal.first_name} ${personal.last_name}`.trim();
  const initials = [personal.first_name, personal.last_name].filter(Boolean).map(n => n[0]).join("").slice(0, 2) || "?";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
        @keyframes toastIn { from { opacity:0; transform:translateY(20px);} to { opacity:1; transform:translateY(0);} }
        @keyframes checkIn { from { transform:scale(0);} to { transform:scale(1);} }
        .settings-input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .settings-input::placeholder { color: #334155; }
        .nav-item { transition: all 0.15s ease; cursor: pointer; }
        .nav-item:hover { background: #0f172a; }
        .save-btn { transition: all 0.2s ease; cursor: pointer; }
        .save-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(59,130,246,0.35); }
      `}</style>

      <div style={{ background: "#060d1a", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>

        {/* Toast */}
        {toast && (
          <div style={{ position: "fixed", bottom: "32px", right: "32px", zIndex: 2000, background: toast.type === "error" ? "#ef4444" : "#10b981", color: "#fff", padding: "12px 24px", borderRadius: "10px", fontWeight: "600", fontSize: "14px", animation: "toastIn 0.3s ease", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
            {toast.msg}
          </div>
        )}

        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 48px" }}>

          {/* Header */}
          <div style={{ marginBottom: "40px", animation: "fadeUp 0.5s ease both" }}>
            <p style={{ color: "#8b5cf6", fontSize: "12px", fontWeight: "600", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 6px 0" }}>Account</p>
            <h1 style={{ color: "#f1f5f9", fontSize: "32px", fontWeight: "700", margin: 0, fontFamily: "'Playfair Display', serif", letterSpacing: "-0.5px" }}>Settings</h1>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "28px", animation: "fadeUp 0.5s ease 0.1s both" }}>

            {/* Sidebar Nav */}
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", padding: "12px", height: "fit-content" }}>
              {sections.map(s => (
                <div key={s.id} className="nav-item" onClick={() => { setActiveSection(s.id); setErrors({}); }}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "10px", marginBottom: "4px", background: activeSection === s.id ? "#1e293b" : "transparent" }}>
                  <span style={{ fontSize: "18px" }}>{s.icon}</span>
                  <span style={{ color: activeSection === s.id ? "#f1f5f9" : "#64748b", fontWeight: "600", fontSize: "14px" }}>{s.label}</span>
                  {activeSection === s.id && <div style={{ marginLeft: "auto", width: "6px", height: "6px", borderRadius: "50%", background: "#3b82f6" }} />}
                </div>
              ))}
            </div>

            {/* Content Panel */}
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", padding: "32px" }}>

              {/* ── Personal Details ── */}
              {activeSection === "personal" && (
                <div>
                  <div style={{ marginBottom: "28px" }}>
                    <h2 style={{ color: "#f1f5f9", fontSize: "20px", fontWeight: "700", margin: "0 0 4px 0" }}>Personal Details</h2>
                    <p style={{ color: "#475569", fontSize: "14px", margin: 0 }}>Update your profile information, health details, and emergency contacts.</p>
                  </div>

                  {/* Avatar */}
                  <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px", padding: "20px", background: "#060d1a", borderRadius: "12px", border: "1px solid #1e293b" }}>
                    <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "22px", color: "#fff", flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ color: "#f1f5f9", fontWeight: "700", fontSize: "16px" }}>{displayName || "Your Name"}</div>
                      <div style={{ color: "#475569", fontSize: "13px" }}>Patient Account</div>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

                    {/* First Name */}
                    <div>
                      <label style={labelStyle}>First Name</label>
                      <input type="text" className="settings-input" style={inputStyle(errors.first_name)} value={personal.first_name}
                        onChange={e => setPersonal(p => ({ ...p, first_name: e.target.value }))} placeholder="First name" />
                      {errors.first_name && <p style={{ color: "#ef4444", fontSize: "12px", margin: "4px 0 0 0" }}>{errors.first_name}</p>}
                    </div>

                    {/* Last Name */}
                    <div>
                      <label style={labelStyle}>Last Name</label>
                      <input type="text" className="settings-input" style={inputStyle(errors.last_name)} value={personal.last_name}
                        onChange={e => setPersonal(p => ({ ...p, last_name: e.target.value }))} placeholder="Last name" />
                      {errors.last_name && <p style={{ color: "#ef4444", fontSize: "12px", margin: "4px 0 0 0" }}>{errors.last_name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label style={labelStyle}>Email Address</label>
                      <input type="email" className="settings-input" style={inputStyle(errors.email)} value={personal.email}
                        onChange={e => setPersonal(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" />
                      {errors.email && <p style={{ color: "#ef4444", fontSize: "12px", margin: "4px 0 0 0" }}>{errors.email}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                      <label style={labelStyle}>Phone Number</label>
                      <input type="tel" className="settings-input" style={inputStyle(false)} value={personal.phone_number}
                        onChange={e => setPersonal(p => ({ ...p, phone_number: e.target.value }))} placeholder="+1 234 567 8900" />
                    </div>

                    {/* DOB */}
                    <div>
                      <label style={labelStyle}>Date of Birth</label>
                      <input type="date" className="settings-input" style={{ ...inputStyle(false), colorScheme: "dark" }} value={personal.date_of_birth}
                        onChange={e => setPersonal(p => ({ ...p, date_of_birth: e.target.value }))} />
                    </div>

                    {/* Gender */}
                    <div>
                      <label style={labelStyle}>Gender</label>
                      <select className="settings-input" style={selectStyle} value={personal.gender}
                        onChange={e => setPersonal(p => ({ ...p, gender: e.target.value }))}>
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>

                    {/* Age */}
                    <div>
                      <label style={labelStyle}>Age</label>
                      <input type="number" className="settings-input" style={inputStyle(false)} value={personal.age}
                        onChange={e => setPersonal(p => ({ ...p, age: e.target.value }))} placeholder="e.g. 25" min="0" max="150" />
                    </div>

                    {/* Health Conditions */}
                    <div>
                      <label style={labelStyle}>Health Conditions</label>
                      <input type="text" className="settings-input" style={inputStyle(false)} value={personal.health_conditions}
                        onChange={e => setPersonal(p => ({ ...p, health_conditions: e.target.value }))} placeholder="e.g. Asthma, Diabetes" />
                    </div>

                    {sectionDivider("Health Information")}

                    {/* Blood Type */}
                    <div>
                      <label style={labelStyle}>Blood Type</label>
                      <select className="settings-input" style={selectStyle} value={personal.blood_type}
                        onChange={e => setPersonal(p => ({ ...p, blood_type: e.target.value }))}>
                        <option value="">Select blood type</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>

                    {/* Height */}
                    <div>
                      <label style={labelStyle}>Height (cm)</label>
                      <input type="number" className="settings-input" style={inputStyle(false)} value={personal.height}
                        onChange={e => setPersonal(p => ({ ...p, height: e.target.value }))} placeholder="e.g. 175" min="0" step="0.1" />
                    </div>

                    {/* Weight */}
                    <div>
                      <label style={labelStyle}>Weight (kg)</label>
                      <input type="number" className="settings-input" style={inputStyle(false)} value={personal.weight}
                        onChange={e => setPersonal(p => ({ ...p, weight: e.target.value }))} placeholder="e.g. 70" min="0" step="0.1" />
                    </div>

                    {/* Medical Insurance */}
                    <div>
                      <label style={labelStyle}>Medical Insurance</label>
                      <input type="text" className="settings-input" style={inputStyle(false)} value={personal.medical_insurance}
                        onChange={e => setPersonal(p => ({ ...p, medical_insurance: e.target.value }))} placeholder="Insurance provider" />
                    </div>

                    {sectionDivider("Emergency Contact")}

                    {/* Emergency Contact Name */}
                    <div>
                      <label style={labelStyle}>Contact Name</label>
                      <input type="text" className="settings-input" style={inputStyle(false)} value={personal.emergency_contact_name}
                        onChange={e => setPersonal(p => ({ ...p, emergency_contact_name: e.target.value }))} placeholder="Full name" />
                    </div>

                    {/* Emergency Contact Phone */}
                    <div>
                      <label style={labelStyle}>Contact Phone</label>
                      <input type="tel" className="settings-input" style={inputStyle(false)} value={personal.emergency_contact_phone}
                        onChange={e => setPersonal(p => ({ ...p, emergency_contact_phone: e.target.value }))} placeholder="+1 234 567 8900" />
                    </div>

                    {/* Emergency Contact Relationship */}
                    <div>
                      <label style={labelStyle}>Relationship</label>
                      <select className="settings-input" style={selectStyle} value={personal.emergency_contact_relationship}
                        onChange={e => setPersonal(p => ({ ...p, emergency_contact_relationship: e.target.value }))}>
                        <option value="">Select relationship</option>
                        <option value="Parent">Parent</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Child">Child</option>
                        <option value="Friend">Friend</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: "28px", display: "flex", justifyContent: "flex-end" }}>
                    <button className="save-btn" onClick={handlePersonalSave} disabled={saving}
                      style={{ padding: "12px 32px", borderRadius: "10px", border: "none", background: saving ? "#1e40af" : "#3b82f6", color: "#fff", fontWeight: "700", fontSize: "14px", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: "8px", opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}>
                      {saving ? "Saving..." : saved ? <span style={{ animation: "checkIn 0.3s ease" }}>Saved!</span> : "Save Changes"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Integrations ── */}
              {activeSection === "integrations" && (
                <div>
                  <h2 style={{ color: "#f1f5f9", fontSize: "20px", fontWeight: "700", margin: "0 0 4px 0" }}>Integrations</h2>
                  <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 28px 0" }}>Connect external services to sync your health data automatically.</p>

                  {/* Google Fit Card */}
                  <div style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "16px",
                    padding: "28px",
                    marginBottom: "20px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                      <div style={{
                        width: "52px", height: "52px", borderRadius: "14px",
                        background: gfitConnected ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px",
                      }}>
                        ❤️
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#f1f5f9", fontWeight: "700", fontSize: "16px" }}>Google Fit</div>
                        <div style={{ color: "#64748b", fontSize: "13px", marginTop: "2px" }}>
                          Sync heart rate, SpO₂, steps, and calories from Google Fit
                        </div>
                      </div>
                      <div style={{
                        padding: "6px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
                        background: gfitConnected ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                        color: gfitConnected ? "#10b981" : "#ef4444",
                        border: `1px solid ${gfitConnected ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                      }}>
                        {gfitConnected ? "Connected" : "Not Connected"}
                      </div>
                    </div>

                    {gfitLastSync && (
                      <p style={{ color: "#64748b", fontSize: "12px", margin: "0 0 16px 0" }}>
                        Last synced: {gfitLastSync}
                      </p>
                    )}

                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      {!gfitConnected && (
                        <button onClick={handleGfitConnect} style={{
                          padding: "10px 24px", borderRadius: "10px", border: "none",
                          background: "#3b82f6", color: "#fff", fontWeight: "700", fontSize: "13px",
                          fontFamily: "'DM Sans',sans-serif", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: "8px",
                        }}>
                          Connect Google Fit
                        </button>
                      )}
                      <button onClick={handleGfitSync} disabled={gfitSyncing} style={{
                        padding: "10px 24px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)",
                        background: gfitSyncing ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
                        color: "#f1f5f9", fontWeight: "700", fontSize: "13px",
                        fontFamily: "'DM Sans',sans-serif",
                        cursor: gfitSyncing ? "not-allowed" : "pointer",
                        opacity: gfitSyncing ? 0.6 : 1,
                        display: "flex", alignItems: "center", gap: "8px",
                      }}>
                        {gfitSyncing ? "Syncing..." : "Sync Now"}
                      </button>
                      {gfitConnected && (
                        <button onClick={handleGfitDisconnect} style={{
                          padding: "10px 24px", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.3)",
                          background: "rgba(239,68,68,0.1)", color: "#ef4444", fontWeight: "700", fontSize: "13px",
                          fontFamily: "'DM Sans',sans-serif", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: "8px",
                        }}>
                          Disconnect
                        </button>
                      )}
                    </div>

                    <div style={{
                      marginTop: "20px", padding: "16px", borderRadius: "10px",
                      background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)",
                    }}>
                      <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0, lineHeight: "1.6" }}>
                        <strong style={{ color: "#f1f5f9" }}>How it works:</strong> Click "Connect Google Fit" to authorize access to your health data.
                        Once connected, your data will automatically sync each time you log in. You can also manually sync anytime.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Change Password ── */}
              {activeSection === "password" && (
                <div>
                  <div style={{ marginBottom: "28px" }}>
                    <h2 style={{ color: "#f1f5f9", fontSize: "20px", fontWeight: "700", margin: "0 0 4px 0" }}>Change Password</h2>
                    <p style={{ color: "#475569", fontSize: "14px", margin: 0 }}>Choose a strong password with at least 8 characters.</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {/* Current */}
                    <div>
                      <label style={labelStyle}>Current Password</label>
                      <input type="password" className="settings-input" style={inputStyle(errors.current)} value={passwords.current}
                        onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} placeholder="••••••••" />
                      {errors.current && <p style={{ color: "#ef4444", fontSize: "12px", margin: "4px 0 0 0" }}>{errors.current}</p>}
                    </div>

                    {/* New */}
                    <div>
                      <label style={labelStyle}>New Password</label>
                      <input type="password" className="settings-input" style={inputStyle(errors.newPass)} value={passwords.newPass}
                        onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))} placeholder="At least 8 characters" />
                      {errors.newPass && <p style={{ color: "#ef4444", fontSize: "12px", margin: "4px 0 0 0" }}>{errors.newPass}</p>}

                      {/* Strength bar */}
                      {passwords.newPass.length > 0 && (
                        <div style={{ marginTop: "10px" }}>
                          <div style={{ height: "4px", background: "#1e293b", borderRadius: "99px", overflow: "hidden" }}>
                            <div style={{
                              height: "100%", borderRadius: "99px", transition: "all 0.3s ease",
                              width: passwords.newPass.length < 6 ? "25%" : passwords.newPass.length < 10 ? "55%" : "100%",
                              background: passwords.newPass.length < 6 ? "#ef4444" : passwords.newPass.length < 10 ? "#f59e0b" : "#10b981"
                            }} />
                          </div>
                          <p style={{ color: passwords.newPass.length < 6 ? "#ef4444" : passwords.newPass.length < 10 ? "#f59e0b" : "#10b981", fontSize: "12px", margin: "4px 0 0 0", fontWeight: "600" }}>
                            {passwords.newPass.length < 6 ? "Weak" : passwords.newPass.length < 10 ? "Fair" : "Strong"}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Confirm */}
                    <div>
                      <label style={labelStyle}>Confirm New Password</label>
                      <input type="password" className="settings-input" style={inputStyle(errors.confirm)} value={passwords.confirm}
                        onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat new password" />
                      {errors.confirm && <p style={{ color: "#ef4444", fontSize: "12px", margin: "4px 0 0 0" }}>{errors.confirm}</p>}
                    </div>
                  </div>

                  <div style={{ marginTop: "28px", display: "flex", justifyContent: "flex-end" }}>
                    <button className="save-btn" onClick={handlePasswordSave}
                      style={{ padding: "12px 32px", borderRadius: "10px", border: "none", background: "#8b5cf6", color: "#fff", fontWeight: "700", fontSize: "14px", fontFamily: "'DM Sans',sans-serif" }}>
                      Update Password
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
