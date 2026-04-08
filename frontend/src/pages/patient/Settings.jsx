import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { googleFitAPI, authAPI } from "../../utils/api";
import { AvatarCustomizer } from "../../components/AvatarCustomizer";
import { useTranslation } from "react-i18next";


export const Settings = () => {
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const [showAvatarCustomizer, setShowAvatarCustomizer] = useState(false);
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

  // Medical History state
  const [medHistory, setMedHistory] = useState({
    health_conditions: user?.health_conditions || "",
    allergies: user?.allergies || "",
    family_history: user?.family_history || "",
  });

  // Medications & Lifestyle state
  const [medications, setMedications] = useState(
    Array.isArray(user?.medications) && user.medications.length > 0
      ? user.medications
      : []
  );
  const [supplements, setSupplements] = useState(
    Array.isArray(user?.supplements) && user.supplements.length > 0
      ? user.supplements
      : []
  );
  const [lifestyle, setLifestyle] = useState({
    smoking_status: user?.smoking_status || "",
    alcohol_frequency: user?.alcohol_frequency || "",
    exercise_frequency: user?.exercise_frequency || "",
    sleep_habit: user?.sleep_habit || "",
    dietary_preference: user?.dietary_preference || "",
    occupation: user?.occupation || "",
  });

  // Google Fit state
  const [gfitConnected, setGfitConnected] = useState(false);
  const [gfitSyncing, setGfitSyncing] = useState(false);
  const [gfitLastSync, setGfitLastSync] = useState(null);

  const uid = user?.id;

  useEffect(() => {
    if (!uid) return;
    const stored = localStorage.getItem(`healix_gfit_connected_${uid}`);
    if (stored === "true") {
      setGfitConnected(true);
      const lastSync = localStorage.getItem(`healix_gfit_last_sync_${uid}`);
      if (lastSync) setGfitLastSync(lastSync);
    }

    // Listen for postMessage from Google OAuth popup callback
    const handleMessage = (event) => {
      if (event.data?.type === "GFIT_CONNECTED") {
        localStorage.setItem(`healix_gfit_connected_${uid}`, "true");
        setGfitConnected(true);
        showToast(t("gfitConnectedMsg"));
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [uid]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePersonalSave = async () => {
    const e = {};
    if (!personal.first_name.trim()) e.first_name = t("firstNameRequired");
    if (!personal.last_name.trim()) e.last_name = t("lastNameRequired");
    if (!personal.email.includes("@")) e.email = t("validEmailRequired");
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
      showToast(t("personalUpdated"));
    } catch (err) {
      showToast(err.message || t("failedToSave"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleMedHistorySave = async () => {
    setSaving(true);
    try {
      const payload = {
        health_conditions: medHistory.health_conditions.trim(),
        allergies: medHistory.allergies.trim(),
        family_history: medHistory.family_history.trim(),
      };
      await authAPI.updateProfile(payload);
      await refreshUser();
      showToast(t("medHistoryUpdated"));
    } catch (err) {
      showToast(err.message || "Failed to save changes", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLifestyleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        medications,
        supplements,
        smoking_status: lifestyle.smoking_status,
        alcohol_frequency: lifestyle.alcohol_frequency,
        exercise_frequency: lifestyle.exercise_frequency,
        sleep_habit: lifestyle.sleep_habit,
        dietary_preference: lifestyle.dietary_preference,
        occupation: lifestyle.occupation.trim(),
      };
      await authAPI.updateProfile(payload);
      await refreshUser();
      showToast(t("lifestyleUpdated"));
    } catch (err) {
      showToast(err.message || t("failedToSave"), "error");
    } finally {
      setSaving(false);
    }
  };

  const addMedication = () => setMedications(prev => [...prev, { name: "", dosage: "", frequency: "" }]);
  const removeMedication = (i) => setMedications(prev => prev.filter((_, idx) => idx !== i));
  const updateMedication = (i, field, value) => setMedications(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));

  const addSupplement = () => setSupplements(prev => [...prev, { name: "", dosage: "", frequency: "" }]);
  const removeSupplement = (i) => setSupplements(prev => prev.filter((_, idx) => idx !== i));
  const updateSupplement = (i, field, value) => setSupplements(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  const handlePasswordSave = async () => {
    const e = {};
    if (!passwords.current) e.current = t("enterCurrentPassword");
    if (passwords.newPass.length < 8) e.newPass = t("passMin8");
    if (passwords.newPass !== passwords.confirm) e.confirm = t("passwordsNoMatch");
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    try {
      await authAPI.changePassword(passwords.current, passwords.newPass);
      setPasswords({ current: "", newPass: "", confirm: "" });
      showToast(t("passwordChanged"));
    } catch (err) {
      setErrors({ current: err.message || t("failedToChangePassword") });
    }
  };

  const handleGfitConnect = async () => {
    try {
      const data = await googleFitAPI.connect();
      if (data?.auth_url) {
        window.open(data.auth_url, "_blank", "width=500,height=600");
        showToast(t("gfitCompleteSignIn"));
        localStorage.setItem(`healix_gfit_connected_${uid}`, "true");
        setGfitConnected(true);
      }
    } catch (err) {
      showToast(err.message || t("gfitFailedConnect"), "error");
    }
  };

  const handleGfitSync = async () => {
    setGfitSyncing(true);
    try {
      const result = await googleFitAPI.sync();
      const now = new Date().toLocaleString();
      setGfitLastSync(now);
      localStorage.setItem(`healix_gfit_last_sync_${uid}`, now);
      localStorage.setItem(`healix_gfit_connected_${uid}`, "true");
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
        localStorage.removeItem(`healix_gfit_connected_${uid}`);
        showToast(t("gfitExpired"), "error");
      } else {
        showToast(msg, "error");
      }
    } finally {
      setGfitSyncing(false);
    }
  };

  const handleGfitDisconnect = () => {
    localStorage.removeItem(`healix_gfit_connected_${uid}`);
    localStorage.removeItem(`healix_gfit_last_sync_${uid}`);
    setGfitConnected(false);
    setGfitLastSync(null);
    showToast(t("gfitDisconnected"));
  };

  const sections = [
    { id: "personal", label: t("personalDetails"), icon: "👤" },
    { id: "medhistory", label: t("medicalHistory"), icon: "🩺" },
    { id: "lifestyle", label: t("medsAndLifestyle"), icon: "💊" },
    { id: "password", label: t("changePassword"), icon: "🔒" },
    { id: "integrations", label: t("integrations"), icon: "🔗" },
  ];

  const labelStyle = { display: "block", color: "var(--text-subtle)", fontSize: "12px", fontWeight: "600", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" };

  const inputStyle = (err) => ({
    width: "100%",
    padding: "12px 14px",
    border: `1px solid ${err ? "#ef4444" : "var(--border-solid)"}`,
    borderRadius: "10px",
    background: "var(--bg)",
    color: "var(--text)",
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
      <span style={{ color: "var(--text-muted)", fontSize: "13px", fontWeight: "700", whiteSpace: "nowrap" }}>{title}</span>
      <div style={{ flex: 1, height: "1px", background: "var(--border-solid)" }} />
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
        .settings-input::placeholder { color: var(--border-mid); }
        .nav-item { transition: all 0.15s ease; cursor: pointer; }
        .nav-item:hover { background: var(--bg-3); }
        .save-btn { transition: all 0.2s ease; cursor: pointer; }
        .save-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(59,130,246,0.35); }
      `}</style>

      
      <div style={{ background: "var(--bg)", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
        
        {/* Toast */}
        {toast && (
          <div style={{ position: "fixed", bottom: "32px", right: "32px", zIndex: 2000, background: toast.type === "error" ? "#ef4444" : "#10b981", color: "#fff", padding: "12px 24px", borderRadius: "10px", fontWeight: "600", fontSize: "14px", animation: "toastIn 0.3s ease", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
            {toast.msg}
          </div>
        )}

        <div className="settings-responsive" style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 48px" }}>

          {/* Header */}
          <div style={{ marginBottom: "40px", animation: "fadeUp 0.5s ease both" }}>{t("account")}
            <p style={{ color: "#8b5cf6", fontSize: "12px", fontWeight: "600", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 6px 0" }}></p>
            <h1 style={{ color: "var(--text)", fontSize: "32px", fontWeight: "700", margin: 0, fontFamily: "'Playfair Display', serif", letterSpacing: "-0.5px" }}>{t("settings")}</h1>
          </div>

          <div className="form-grid-responsive" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "28px", animation: "fadeUp 0.5s ease 0.1s both" }}>

            {/* Sidebar Nav */}
            <div style={{ background: "var(--bg-3)", border: "1px solid var(--border-solid)", borderRadius: "14px", padding: "12px", height: "fit-content" }}>
              {sections.map(s => (
                <div key={s.id} className="nav-item" onClick={() => { setActiveSection(s.id); setErrors({}); }}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "10px", marginBottom: "4px", background: activeSection === s.id ? "var(--border-solid)" : "transparent" }}>
                  <span style={{ fontSize: "18px" }}>{s.icon}</span>
                  <span style={{ color: activeSection === s.id ? "var(--text)" : "var(--text-subtle)", fontWeight: "600", fontSize: "14px" }}>{s.label}</span>
                  {activeSection === s.id && <div style={{ marginLeft: "auto", width: "6px", height: "6px", borderRadius: "50%", background: "#3b82f6" }} />}
                </div>
              ))}
            </div>

            {/* Content Panel */}
            <div style={{ background: "var(--bg-3)", border: "1px solid var(--border-solid)", borderRadius: "14px", padding: "32px" }}>

              {/* ── Personal Details ── */}
              {activeSection === "personal" && (
                <div>
                  <div style={{ marginBottom: "28px" }}>
                    <h2 style={{ color: "var(--text)", fontSize: "20px", fontWeight: "700", margin: "0 0 4px 0" }}>{t("personalDetails")}</h2>
                    <p style={{ color: "var(--text-faint)", fontSize: "14px", margin: 0 }}>{t("personalDetailsDesc")}</p>
                  </div>

                  {/* Avatar Section */}
<div style={{ marginBottom: "32px" }}>
  <h3>{t("customizeAvatar")}</h3>

  {showAvatarCustomizer ? (
    <AvatarCustomizer
      onSave={() => {
        setShowAvatarCustomizer(false);
        refreshUser(); // better than reload
      }}
    />
  ) : (
    <div style={{ display: "flex", alignItems: "center", gap: "20px", padding: "20px", background: "var(--bg)", borderRadius: "12px", border: "1px solid var(--border-solid)" }}>
      
      {/* Avatar Preview */}
      <div style={{
        width: "64px",
        height: "64px",
        borderRadius: "16px",
        background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "700",
        fontSize: "22px",
        color: "#fff"
      }}>
        {initials}
      </div>

      {/* Info */}
      <div>
        <div style={{ fontWeight: "700" }}>{displayName}</div>
        <div style={{ fontSize: "13px", color: "var(--text-faint)" }}>{t("patientAccount")}</div>
      </div>

      {/* Button */}
      <button
        onClick={() => setShowAvatarCustomizer(true)}
        style={{
          marginLeft: "auto",
          padding: "10px 16px",
          borderRadius: "10px",
          border: "none",
          background: "#3b82f6",
          color: "#fff",
          cursor: "pointer"
        }}
      >
        {t("editAvatar")}
      </button>
    </div>
  )}
</div>

                  {/* Form Fields */}
                  <div className="form-grid-responsive" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

                    {/* First Name */}
                    <div>
                      <label style={labelStyle}>{t("firstName")}</label>
                      <input type="text" className="settings-input" style={inputStyle(errors.first_name)} value={personal.first_name}
                        onChange={e => setPersonal(p => ({ ...p, first_name: e.target.value }))} placeholder="First name" />
                      {errors.first_name && <p style={{ color: "#ef4444", fontSize: "12px", margin: "4px 0 0 0" }}>{errors.first_name}</p>}
                    </div>

                    {/* Last Name */}
                    <div>
                      <label style={labelStyle}>{t("lastName")}</label>
                      <input type="text" className="settings-input" style={inputStyle(errors.last_name)} value={personal.last_name}
                        onChange={e => setPersonal(p => ({ ...p, last_name: e.target.value }))} placeholder="Last name" />
                      {errors.last_name && <p style={{ color: "#ef4444", fontSize: "12px", margin: "4px 0 0 0" }}>{errors.last_name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label style={labelStyle}>{t("emailAddress")}</label>
                      <input type="email" className="settings-input" style={inputStyle(errors.email)} value={personal.email}
                        onChange={e => setPersonal(p => ({ ...p, email: e.target.value }))} placeholder="you@example.com" />
                      {errors.email && <p style={{ color: "#ef4444", fontSize: "12px", margin: "4px 0 0 0" }}>{errors.email}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                      <label style={labelStyle}>{t("phoneNumber")}</label>
                      <input type="tel" className="settings-input" style={inputStyle(false)} value={personal.phone_number}
                        onChange={e => setPersonal(p => ({ ...p, phone_number: e.target.value }))} placeholder="+1 234 567 8900" />
                    </div>

                    {/* DOB */}
                    <div>
                      <label style={labelStyle}>{t("dateOfBirth")}</label>
                      <input type="date" className="settings-input" style={{ ...inputStyle(false), colorScheme: "dark" }} value={personal.date_of_birth}
                        onChange={e => setPersonal(p => ({ ...p, date_of_birth: e.target.value }))} />
                    </div>

                    {/* Gender */}
                    <div>
                      <label style={labelStyle}>{t("gender")}</label>
                      <select className="settings-input" style={selectStyle} value={personal.gender}
                        onChange={e => setPersonal(p => ({ ...p, gender: e.target.value }))}>
                        <option value="">{t("selectGender")}</option>
                        <option value="Male">{t("male")}</option>
                        <option value="Female">{t("female")}</option>
                        <option value="Other">{t("other")}</option>
                        <option value="Prefer not to say">{t("preferNotToSay")}</option>
                      </select>
                    </div>

                    {/* Age */}
                    <div>
                      <label style={labelStyle}>{t("age")}</label>
                      <input type="number" className="settings-input" style={inputStyle(false)} value={personal.age}
                        onChange={e => setPersonal(p => ({ ...p, age: e.target.value }))} placeholder="e.g. 25" min="0" max="150" />
                    </div>

                    {/* Health Conditions */}
                    <div>
                      <label style={labelStyle}>{t("healthConditions")}</label>
                      <input type="text" className="settings-input" style={inputStyle(false)} value={personal.health_conditions}
                        onChange={e => setPersonal(p => ({ ...p, health_conditions: e.target.value }))} placeholder="e.g. Asthma, Diabetes" />
                    </div>

                    {sectionDivider(t("healthInformation"))}

                    {/* Blood Type */}
                    <div>
                      <label style={labelStyle}>{t("bloodType")}</label>
                      <select className="settings-input" style={selectStyle} value={personal.blood_type}
                        onChange={e => setPersonal(p => ({ ...p, blood_type: e.target.value }))}>
                        <option value="">{t("selectBloodType")}</option>
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
                      <label style={labelStyle}>{t("heightCm")}</label>
                      <input type="number" className="settings-input" style={inputStyle(false)} value={personal.height}
                        onChange={e => setPersonal(p => ({ ...p, height: e.target.value }))} placeholder="e.g. 175" min="0" step="0.1" />
                    </div>

                    {/* Weight */}
                    <div>
                      <label style={labelStyle}>{t("weightKg")}</label>
                      <input type="number" className="settings-input" style={inputStyle(false)} value={personal.weight}
                        onChange={e => setPersonal(p => ({ ...p, weight: e.target.value }))} placeholder="e.g. 70" min="0" step="0.1" />
                    </div>

                    {/* Medical Insurance */}
                    <div>
                      <label style={labelStyle}>{t("medicalInsurance")}</label>
                      <input type="text" className="settings-input" style={inputStyle(false)} value={personal.medical_insurance}
                        onChange={e => setPersonal(p => ({ ...p, medical_insurance: e.target.value }))} placeholder="Insurance provider" />
                    </div>

                    {sectionDivider(t("emergencyContact"))}

                    {/* Emergency Contact Name */}
                    <div>
                      <label style={labelStyle}>{t("contactName")}</label>
                      <input type="text" className="settings-input" style={inputStyle(false)} value={personal.emergency_contact_name}
                        onChange={e => setPersonal(p => ({ ...p, emergency_contact_name: e.target.value }))} placeholder="Full name" />
                    </div>

                    {/* Emergency Contact Phone */}
                    <div>
                      <label style={labelStyle}>{t("contactPhone")}</label>
                      <input type="tel" className="settings-input" style={inputStyle(false)} value={personal.emergency_contact_phone}
                        onChange={e => setPersonal(p => ({ ...p, emergency_contact_phone: e.target.value }))} placeholder="+1 234 567 8900" />
                    </div>

                    {/* Emergency Contact Relationship */}
                    <div>
                      <label style={labelStyle}>{t("relationship")}</label>
                      <select className="settings-input" style={selectStyle} value={personal.emergency_contact_relationship}
                        onChange={e => setPersonal(p => ({ ...p, emergency_contact_relationship: e.target.value }))}>
                        <option value="">{t("selectRelationship")}</option>
                        <option value="Parent">{t("parent")}</option>
                        <option value="Spouse">{t("spouse")}</option>
                        <option value="Sibling">{t("sibling")}</option>
                        <option value="Child">{t("child")}</option>
                        <option value="Friend">{t("friend")}</option>
                        <option value="Other">{t("Other")}</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: "28px", display: "flex", justifyContent: "flex-end" }}>
                    <button className="save-btn" onClick={handlePersonalSave} disabled={saving}
                      style={{ padding: "12px 32px", borderRadius: "10px", border: "none", background: saving ? "#1e40af" : "#3b82f6", color: "#fff", fontWeight: "700", fontSize: "14px", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: "8px", opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}>
                      {saving ? t("saving") : saved ? <span style={{ animation: "checkIn 0.3s ease" }}>{t("saved")}</span> : t("saveChanges")}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Medical History ── */}
              {activeSection === "medhistory" && (
                <div>
                  <div style={{ marginBottom: "28px" }}>
                    <h2 style={{ color: "var(--text)", fontSize: "20px", fontWeight: "700", margin: "0 0 4px 0" }}>{t("medicalHistory")}</h2>
                    <p style={{ color: "var(--text-faint)", fontSize: "14px", margin: 0 }}>{t("medicalHistoryDesc")}</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {/* Health Conditions */}
                    <div>
                      <label style={labelStyle}>{t("healthConditions")}</label>
                      <textarea className="settings-input" rows={3}
                        style={{ ...inputStyle(false), resize: "vertical", minHeight: "80px" }}
                        value={medHistory.health_conditions}
                        onChange={e => setMedHistory(p => ({ ...p, health_conditions: e.target.value }))}
                        placeholder="e.g. Asthma, Type 2 Diabetes, Hypertension" />
                    </div>

                    {/* Allergies */}
                    <div>
                      <label style={labelStyle}>{t("allergies")}</label>
                      <textarea className="settings-input" rows={3}
                        style={{ ...inputStyle(false), resize: "vertical", minHeight: "80px" }}
                        value={medHistory.allergies}
                        onChange={e => setMedHistory(p => ({ ...p, allergies: e.target.value }))}
                        placeholder="e.g. Penicillin, Peanuts, Latex" />
                    </div>

                    {/* Family History */}
                    <div>
                      <label style={labelStyle}>{t("familyHistory")}</label>
                      <textarea className="settings-input" rows={3}
                        style={{ ...inputStyle(false), resize: "vertical", minHeight: "80px" }}
                        value={medHistory.family_history}
                        onChange={e => setMedHistory(p => ({ ...p, family_history: e.target.value }))}
                        placeholder="e.g. Father: heart disease, Mother: breast cancer" />
                    </div>
                  </div>

                  <div style={{ marginTop: "28px", display: "flex", justifyContent: "flex-end" }}>
                    <button className="save-btn" onClick={handleMedHistorySave} disabled={saving}
                      style={{ padding: "12px 32px", borderRadius: "10px", border: "none", background: saving ? "#1e40af" : "#3b82f6", color: "#fff", fontWeight: "700", fontSize: "14px", fontFamily: "'DM Sans',sans-serif", opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}>
                      {saving ? "Saving..." : t("saveChanges")}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Medications & Lifestyle ── */}
              {activeSection === "lifestyle" && (
                <div>
                  <div style={{ marginBottom: "28px" }}>
                    <h2 style={{ color: "var(--text)", fontSize: "20px", fontWeight: "700", margin: "0 0 4px 0" }}>{t("medsAndLifestyle")}</h2>
                    <p style={{ color: "var(--text-faint)", fontSize: "14px", margin: 0 }}>{t("medsAndLifestyleDesc")}</p>
                  </div>

                  {/* Medications */}
                  <div style={{ marginBottom: "28px" }}>
                    {sectionDivider(t("medicationsLabel"))}
                    {medications.map((med, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "12px", marginTop: "12px", alignItems: "end" }}>
                        <div>
                          {i === 0 && <label style={labelStyle}>{t("name")}</label>}
                          <input type="text" className="settings-input" style={inputStyle(false)} value={med.name}
                            onChange={e => updateMedication(i, "name", e.target.value)} placeholder="Medication name" />
                        </div>
                        <div>
                          {i === 0 && <label style={labelStyle}>{t("dosage")}</label>}
                          <input type="text" className="settings-input" style={inputStyle(false)} value={med.dosage}
                            onChange={e => updateMedication(i, "dosage", e.target.value)} placeholder="e.g. 10mg" />
                        </div>
                        <div>
                          {i === 0 && <label style={labelStyle}>{t("frequency")}</label>}
                          <select className="settings-input" style={selectStyle} value={med.frequency}
                            onChange={e => updateMedication(i, "frequency", e.target.value)}>
                            <option value="">{t("selectFrequency")}</option>
                            <option value="Once daily">{t("onceDaily")}</option>
                            <option value="Twice daily">{t("twiceDaily")}</option>
                            <option value="Three times daily">{t("threeTimesDaily")}</option>
                            <option value="As needed">{t("asNeeded")}</option>
                            <option value="Weekly">{t("weekly")}</option>
                          </select>
                        </div>
                        <button onClick={() => removeMedication(i)}
                          style={{ padding: "11px 14px", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#ef4444", fontWeight: "700", fontSize: "16px", cursor: "pointer", lineHeight: 1 }}>
                          ×
                        </button>
                      </div>
                    ))}
                    <button onClick={addMedication}
                      style={{ marginTop: "12px", padding: "9px 20px", borderRadius: "10px", border: "1px dashed var(--border-solid)", background: "transparent", color: "var(--text-subtle)", fontWeight: "600", fontSize: "13px", fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }}>
                      + {t("addMedication")}
                    </button>
                  </div>

                  {/* Supplements */}
                  <div style={{ marginBottom: "28px" }}>
                    {sectionDivider(t("supplementsLabel"))}
                    {supplements.map((sup, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "12px", marginTop: "12px", alignItems: "end" }}>
                        <div>
                          {i === 0 && <label style={labelStyle}>Name</label>}
                          <input type="text" className="settings-input" style={inputStyle(false)} value={sup.name}
                            onChange={e => updateSupplement(i, "name", e.target.value)} placeholder="Supplement name" />
                        </div>
                        <div>
                          {i === 0 && <label style={labelStyle}>Dosage</label>}
                          <input type="text" className="settings-input" style={inputStyle(false)} value={sup.dosage}
                            onChange={e => updateSupplement(i, "dosage", e.target.value)} placeholder="e.g. 500mg" />
                        </div>
                        <div>
                          {i === 0 && <label style={labelStyle}>Frequency</label>}
                          <select className="settings-input" style={selectStyle} value={sup.frequency}
                            onChange={e => updateSupplement(i, "frequency", e.target.value)}>
                            <option value="">{t("selectFrequency")}</option>
                            <option value="Once daily">Once daily</option>
                            <option value="Twice daily">Twice daily</option>
                            <option value="Three times daily">Three times daily</option>
                            <option value="As needed">As needed</option>
                            <option value="Weekly">Weekly</option>
                          </select>
                        </div>
                        <button onClick={() => removeSupplement(i)}
                          style={{ padding: "11px 14px", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#ef4444", fontWeight: "700", fontSize: "16px", cursor: "pointer", lineHeight: 1 }}>
                          ×
                        </button>
                      </div>
                    ))}
                    <button onClick={addSupplement}
                      style={{ marginTop: "12px", padding: "9px 20px", borderRadius: "10px", border: "1px dashed var(--border-solid)", background: "transparent", color: "var(--text-subtle)", fontWeight: "600", fontSize: "13px", fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }}>
                      + {t("addSupplement")}
                    </button>
                  </div>

                  {/* Lifestyle Fields */}
                  <div className="form-grid-responsive" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    {sectionDivider(t("lifestyleLabel"))}

                    {/* Smoking */}
                    <div>
                      <label style={labelStyle}>{t("smokingStatus")}</label>
                      <select className="settings-input" style={selectStyle} value={lifestyle.smoking_status}
                        onChange={e => setLifestyle(p => ({ ...p, smoking_status: e.target.value }))}>
                        <option value="">{t("selectStatus")}</option>
                        <option value="Never">{t("never")}</option>
                        <option value="Former smoker">{t("formerSmoker")}</option>
                        <option value="Current smoker">{t("currentSmoker")}</option>
                      </select>
                    </div>

                    {/* Alcohol */}
                    <div>
                      <label style={labelStyle}>{t("alcoholFrequency")}</label>
                      <select className="settings-input" style={selectStyle} value={lifestyle.alcohol_frequency}
                        onChange={e => setLifestyle(p => ({ ...p, alcohol_frequency: e.target.value }))}>
                        <option value="">{t("selectFrequency")}</option>
                        <option value="Never">{t("never")}</option>
                        <option value="Occasional">{t("occasional")}</option>
                        <option value="Moderate">{t("moderate")}</option>
                        <option value="Heavy">{t("heavy")}</option>
                      </select>
                    </div>

                    {/* Exercise */}
                    <div>
                      <label style={labelStyle}>{t("exerciseFrequency")}</label>
                      <select className="settings-input" style={selectStyle} value={lifestyle.exercise_frequency}
                        onChange={e => setLifestyle(p => ({ ...p, exercise_frequency: e.target.value }))}>
                        <option value="">{t("selectFrequency")}</option>
                        <option value="Sedentary">{t("sedentary")}</option>
                        <option value="Light">{t("light")}</option>
                        <option value="Moderate">{t("moderate")}</option>
                        <option value="Active">{t("active")}</option>
                        <option value="Very Active">{t("veryActive")}</option>
                      </select>
                    </div>

                    {/* Sleep */}
                    <div>
                      <label style={labelStyle}>{t("typicalSleep")}</label>
                      <select className="settings-input" style={selectStyle} value={lifestyle.sleep_habit}
                        onChange={e => setLifestyle(p => ({ ...p, sleep_habit: e.target.value }))}>
                        <option value="">{t("selectSleepDuration")}</option>
                        <option value="Less than 5h">Less than 5h</option>
                        <option value="5-6h">5-6h</option>
                        <option value="6-7h">6-7h</option>
                        <option value="7-8h">7-8h</option>
                        <option value="More than 8h">More than 8h</option>
                      </select>
                    </div>

                    {/* Dietary */}
                    <div>
                      <label style={labelStyle}>{t("dietaryPreference")}</label>
                      <select className="settings-input" style={selectStyle} value={lifestyle.dietary_preference}
                        onChange={e => setLifestyle(p => ({ ...p, dietary_preference: e.target.value }))}>
                        <option value="">{t("selectPreference")}</option>
                        <option value="No preference">{t("noPreference")}</option>
                        <option value="Vegetarian">{t("vegetarian")}</option>
                        <option value="Vegan">{t("vegan")}</option>
                        <option value="Halal">{t("halal")}</option>
                        <option value="Kosher">{t("kosher")}</option>
                        <option value="Gluten-free">{t("glutenFree")}</option>
                        <option value="Other">{t("Other")}</option>
                      </select>
                    </div>

                    {/* Occupation */}
                    <div>
                      <label style={labelStyle}>{t("occupation")}</label>
                      <input type="text" className="settings-input" style={inputStyle(false)} value={lifestyle.occupation}
                        onChange={e => setLifestyle(p => ({ ...p, occupation: e.target.value }))} placeholder="e.g. Software Engineer" />
                    </div>
                  </div>

                  <div style={{ marginTop: "28px", display: "flex", justifyContent: "flex-end" }}>
                    <button className="save-btn" onClick={handleLifestyleSave} disabled={saving}
                      style={{ padding: "12px 32px", borderRadius: "10px", border: "none", background: saving ? "#1e40af" : "#3b82f6", color: "#fff", fontWeight: "700", fontSize: "14px", fontFamily: "'DM Sans',sans-serif", opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}>
                      {saving ? t("saving") : t("saveChanges")}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Integrations ── */}
              {activeSection === "integrations" && (
                <div>
                  <h2 style={{ color: "var(--text)", fontSize: "20px", fontWeight: "700", margin: "0 0 4px 0" }}>{t("integrations")}</h2>
                  <p style={{ color: "var(--text-subtle)", fontSize: "13px", margin: "0 0 28px 0" }}>{t("integrationsDesc")}</p>

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
                        <div style={{ color: "var(--text)", fontWeight: "700", fontSize: "16px" }}>{t("googleFit")}</div>
                        <div style={{ color: "var(--text-subtle)", fontSize: "13px", marginTop: "2px" }}>
                          {t("googleFitDesc")}
                        </div>
                      </div>
                      <div style={{
                        padding: "6px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: "700",
                        background: gfitConnected ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                        color: gfitConnected ? "#10b981" : "#ef4444",
                        border: `1px solid ${gfitConnected ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                      }}>
                        {gfitConnected ? t("connected") : t("notConnected")}
                      </div>
                    </div>

                    {gfitLastSync && (
                      <p style={{ color: "var(--text-subtle)", fontSize: "12px", margin: "0 0 16px 0" }}>
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
                          {t("connectGoogleFitBtn")}
                        </button>
                      )}
                      <button onClick={handleGfitSync} disabled={gfitSyncing} style={{
                        padding: "10px 24px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)",
                        background: gfitSyncing ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
                        color: "var(--text)", fontWeight: "700", fontSize: "13px",
                        fontFamily: "'DM Sans',sans-serif",
                        cursor: gfitSyncing ? "not-allowed" : "pointer",
                        opacity: gfitSyncing ? 0.6 : 1,
                        display: "flex", alignItems: "center", gap: "8px",
                      }}>
                        {gfitSyncing ? t("syncing") : t("syncNow")}
                      </button>
                      {gfitConnected && (
                        <button onClick={handleGfitDisconnect} style={{
                          padding: "10px 24px", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.3)",
                          background: "rgba(239,68,68,0.1)", color: "#ef4444", fontWeight: "700", fontSize: "13px",
                          fontFamily: "'DM Sans',sans-serif", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: "8px",
                        }}>
                          {t("disconnect")}
                        </button>
                      )}
                    </div>

                    <div style={{
                      marginTop: "20px", padding: "16px", borderRadius: "10px",
                      background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)",
                    }}>
                      <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: 0, lineHeight: "1.6" }}>
                        <strong style={{ color: "var(--text)" }}>{t("howItWorks")}</strong> {t("howItWorksDesc")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Change Password ── */}
              {activeSection === "password" && (
                <div>
                  <div style={{ marginBottom: "28px" }}>
                    <h2 style={{ color: "var(--text)", fontSize: "20px", fontWeight: "700", margin: "0 0 4px 0" }}>{t("changePassword")}</h2>
                    <p style={{ color: "var(--text-faint)", fontSize: "14px", margin: 0 }}>{t("changePasswordDesc")}</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {/* Current */}
                    <div>
                      <label style={labelStyle}>{t("currentPassword")}</label>
                      <input type="password" className="settings-input" style={inputStyle(errors.current)} value={passwords.current}
                        onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} placeholder="••••••••" />
                      {errors.current && <p style={{ color: "#ef4444", fontSize: "12px", margin: "4px 0 0 0" }}>{errors.current}</p>}
                    </div>

                    {/* New */}
                    <div>
                      <label style={labelStyle}>{t("newPassword")}</label>
                      <input type="password" className="settings-input" style={inputStyle(errors.newPass)} value={passwords.newPass}
                        onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))} placeholder="At least 8 characters" />
                      {errors.newPass && <p style={{ color: "#ef4444", fontSize: "12px", margin: "4px 0 0 0" }}>{errors.newPass}</p>}

                      {/* Strength bar */}
                      {passwords.newPass.length > 0 && (
                        <div style={{ marginTop: "10px" }}>
                          <div style={{ height: "4px", background: "var(--border-solid)", borderRadius: "99px", overflow: "hidden" }}>
                            <div style={{
                              height: "100%", borderRadius: "99px", transition: "all 0.3s ease",
                              width: passwords.newPass.length < 6 ? "25%" : passwords.newPass.length < 10 ? "55%" : "100%",
                              background: passwords.newPass.length < 6 ? "#ef4444" : passwords.newPass.length < 10 ? "#f59e0b" : "#10b981"
                            }} />
                          </div>
                          <p style={{ color: passwords.newPass.length < 6 ? "#ef4444" : passwords.newPass.length < 10 ? "#f59e0b" : "#10b981", fontSize: "12px", margin: "4px 0 0 0", fontWeight: "600" }}>
                            {passwords.newPass.length < 6 ? t("weak") : passwords.newPass.length < 10 ? t("fair") : t("strong")}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Confirm */}
                    <div>
                      <label style={labelStyle}>{t("confirmNewPassword")}</label>
                      <input type="password" className="settings-input" style={inputStyle(errors.confirm)} value={passwords.confirm}
                        onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat new password" />
                      {errors.confirm && <p style={{ color: "#ef4444", fontSize: "12px", margin: "4px 0 0 0" }}>{errors.confirm}</p>}
                    </div>
                  </div>

                  <div style={{ marginTop: "28px", display: "flex", justifyContent: "flex-end" }}>
                    <button className="save-btn" onClick={handlePasswordSave}
                      style={{ padding: "12px 32px", borderRadius: "10px", border: "none", background: "#8b5cf6", color: "#fff", fontWeight: "700", fontSize: "14px", fontFamily: "'DM Sans',sans-serif" }}>
                      {t("updatePassword")}
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
