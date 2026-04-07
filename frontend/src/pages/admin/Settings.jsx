import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";

export const Settings = () => {
  const { user } = useAuth();
  const [personal, setPersonal] = useState({ 
    name: user?.name || "Admin User", 
    email: user?.email || "admin@healix.com", 
    phone: "+44 7911 555000", 
    role: "System Administrator" 
  });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [activeSection, setActiveSection] = useState("personal");
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const { t } = useTranslation();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePersonalSave = () => {
    const e = {};
    if (!personal.name.trim()) e.name = t("nameRequired");
    if (!personal.email.includes("@")) e.email = t("validEmailRequired");
    if (personal.phone && personal.phone.length < 8) e.phone = t("validPhoneRequired");
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    showToast(t("adminProfileUpdated"));
  };

  const handlePasswordSave = () => {
    const e = {};
    if (!passwords.current) e.current = t("enterCurrentPassword");
    if (passwords.newPass.length < 8) e.newPass = t("passMin8");
    if (passwords.newPass !== passwords.confirm) e.confirm = t("passwordsNoMatch");
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setPasswords({ current:"", newPass:"", confirm:"" });
    showToast(t("passwordChanged"));
  };

  const sections = [
    { id:"personal", label:t("adminProfile"), icon:"⚙️" },
    { id:"password", label:t("changePassword"), icon:"🔒" },
  ];

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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
        @keyframes toastIn { from { opacity:0; transform:translateY(20px);} to { opacity:1; transform:translateY(0);} }
        @keyframes checkIn { from { transform:scale(0);} to { transform:scale(1);} }
        .settings-input:focus { border-color: #8b5cf6 !important; box-shadow: 0 0 0 3px rgba(139,92,246,0.1); }
        .settings-input::placeholder { color: var(--border-mid); }
        .nav-item { transition: all 0.15s ease; cursor: pointer; }
        .nav-item:hover { background: var(--bg-3); }
        .save-btn { transition: all 0.2s ease; cursor: pointer; }
        .save-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(139,92,246,0.35); }
      `}</style>

      <div style={{ background:"var(--bg)", minHeight:"100vh", fontFamily:"'DM Sans', sans-serif" }}>

        {/* Toast */}
        {toast && (
          <div style={{ position:"fixed", bottom:"32px", right:"32px", zIndex:2000, background: toast.type==="error" ? "#ef4444" : "#8b5cf6", color:"#fff", padding:"12px 24px", borderRadius:"10px", fontWeight:"600", fontSize:"14px", animation:"toastIn 0.3s ease", boxShadow:"0 8px 24px rgba(0,0,0,0.3)" }}>
            {toast.msg}
          </div>
        )}

        <div className="settings-responsive" style={{ maxWidth:"960px", margin:"0 auto", padding:"40px 48px" }}>

          {/* Header */}
          <div style={{ marginBottom:"40px", animation:"fadeUp 0.5s ease both" }}>
            <p style={{ color:"#8b5cf6", fontSize:"12px", fontWeight:"600", letterSpacing:"2px", textTransform:"uppercase", margin:"0 0 6px 0" }}>Admin Portal</p>
            <h1 style={{ color:"var(--text)", fontSize:"32px", fontWeight:"700", margin:0, fontFamily:"'Playfair Display', serif", letterSpacing:"-0.5px" }}>Settings</h1>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:"28px", animation:"fadeUp 0.5s ease 0.1s both" }}>

            {/* Sidebar Nav */}
            <div style={{ background:"var(--bg-3)", border:"1px solid var(--border-solid)", borderRadius:"14px", padding:"12px", height:"fit-content" }}>
              {sections.map(s => (
                <div key={s.id} className="nav-item" onClick={() => { setActiveSection(s.id); setErrors({}); }}
                  style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px 14px", borderRadius:"10px", marginBottom:"4px", background: activeSection===s.id ? "var(--border-solid)" : "transparent" }}>
                  <span style={{ fontSize:"18px" }}>{s.icon}</span>
                  <span style={{ color: activeSection===s.id ? "var(--text)" : "var(--text-subtle)", fontWeight:"600", fontSize:"14px" }}>{s.label}</span>
                  {activeSection===s.id && <div style={{ marginLeft:"auto", width:"6px", height:"6px", borderRadius:"50%", background:"#8b5cf6" }} />}
                </div>
              ))}
            </div>

            {/* Content Panel */}
            <div style={{ background:"var(--bg-3)", border:"1px solid var(--border-solid)", borderRadius:"14px", padding:"32px" }}>

              {/* ── Admin Profile ── */}
              {activeSection === "personal" && (
                <div>
                  <div style={{ marginBottom:"28px" }}>
                    <h2 style={{ color:"var(--text)", fontSize:"20px", fontWeight:"700", margin:"0 0 4px 0" }}>{t("adminProfile")}</h2>
                    <p style={{ color:"var(--text-faint)", fontSize:"14px", margin:0 }}>{t("adminProfileDesc")}</p>
                  </div>

                  {/* Avatar */}
                  <div style={{ display:"flex", alignItems:"center", gap:"20px", marginBottom:"32px", padding:"20px", background:"var(--bg)", borderRadius:"12px", border:"1px solid var(--border-solid)" }}>
                    <div style={{ width:"64px", height:"64px", borderRadius:"16px", background:"linear-gradient(135deg,#8b5cf6,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"700", fontSize:"22px", color:"#fff", flexShrink:0 }}>
                      {personal.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                    </div>
                    <div>
                      <div style={{ color:"var(--text)", fontWeight:"700", fontSize:"16px" }}>{personal.name || t("yourName")}</div>
                      <div style={{ color:"#8b5cf6", fontSize:"13px", fontWeight:"600" }}>{personal.role}</div>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>
                    {/* Full Name */}
                    <div style={{ gridColumn:"1/-1" }}>
                      <label style={{ display:"block", color:"var(--text-subtle)", fontSize:"12px", fontWeight:"600", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>{t("fullName")}</label>
                      <input type="text" className="settings-input" style={inputStyle(errors.name)} value={personal.name}
                        onChange={e => setPersonal(p=>({...p,name:e.target.value}))} placeholder={t("yourFullName")} />
                      {errors.name && <p style={{ color:"#ef4444", fontSize:"12px", margin:"4px 0 0 0" }}>{errors.name}</p>}
                    </div>

                    {/* Role */}
                    <div>
                      <label style={{ display:"block", color:"var(--text-subtle)", fontSize:"12px", fontWeight:"600", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>{t("role")}</label>
                      <input type="text" className="settings-input" style={inputStyle(false)} value={personal.role}
                        onChange={e => setPersonal(p=>({...p,role:e.target.value}))} placeholder={t("egSystemAdmin")} />
                    </div>

                    {/* Email */}
                    <div>
                      <label style={{ display:"block", color:"var(--text-subtle)", fontSize:"12px", fontWeight:"600", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>{t("emailAddress")}</label>
                      <input type="email" className="settings-input" style={inputStyle(errors.email)} value={personal.email}
                        onChange={e => setPersonal(p=>({...p,email:e.target.value}))} placeholder="admin@healix.com" />
                      {errors.email && <p style={{ color:"#ef4444", fontSize:"12px", margin:"4px 0 0 0" }}>{errors.email}</p>}
                    </div>

                    {/* Phone */}
                    <div style={{ gridColumn:"1/-1" }}>
                      <label style={{ display:"block", color:"var(--text-subtle)", fontSize:"12px", fontWeight:"600", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>{t("phoneNumber")}</label>
                      <input type="tel" className="settings-input" style={inputStyle(errors.phone)} value={personal.phone}
                        onChange={e => setPersonal(p=>({...p,phone:e.target.value}))} placeholder="+44 7911 000000" />
                      {errors.phone && <p style={{ color:"#ef4444", fontSize:"12px", margin:"4px 0 0 0" }}>{errors.phone}</p>}
                    </div>
                  </div>

                  <div style={{ marginTop:"28px", display:"flex", justifyContent:"flex-end" }}>
                    <button className="save-btn" onClick={handlePersonalSave}
                      style={{ padding:"12px 32px", borderRadius:"10px", border:"none", background:"#8b5cf6", color:"#fff", fontWeight:"700", fontSize:"14px", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:"8px" }}>
                      {saved ? <span style={{ animation:"checkIn 0.3s ease" }}>✓ {t("saved")}</span> : t("saveChanges")}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Change Password (same structure as others) ── */}
              {activeSection === "password" && (
                <div>
                  <div style={{ marginBottom:"28px" }}>
                    <h2 style={{ color:"var(--text)", fontSize:"20px", fontWeight:"700", margin:"0 0 4px 0" }}>{t("changePassword")}</h2>
                    <p style={{ color:"var(--text-faint)", fontSize:"14px", margin:0 }}>{t("changePasswordDesc")}</p>
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
                    {/* Current */}
                    <div>
                      <label style={{ display:"block", color:"var(--text-subtle)", fontSize:"12px", fontWeight:"600", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>{t("currentPassword")}</label>
                      <input type="password" className="settings-input" style={inputStyle(errors.current)} value={passwords.current}
                        onChange={e => setPasswords(p=>({...p,current:e.target.value}))} placeholder="••••••••" />
                      {errors.current && <p style={{ color:"#ef4444", fontSize:"12px", margin:"4px 0 0 0" }}>{errors.current}</p>}
                    </div>

                    {/* New */}
                    <div>
                      <label style={{ display:"block", color:"var(--text-subtle)", fontSize:"12px", fontWeight:"600", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>{t("newPassword")}</label>
                      <input type="password" className="settings-input" style={inputStyle(errors.newPass)} value={passwords.newPass}
                        onChange={e => setPasswords(p=>({...p,newPass:e.target.value}))} placeholder="At least 8 characters" />
                      {errors.newPass && <p style={{ color:"#ef4444", fontSize:"12px", margin:"4px 0 0 0" }}>{errors.newPass}</p>}

                      {/* Strength bar */}
                      {passwords.newPass.length > 0 && (
                        <div style={{ marginTop:"10px" }}>
                          <div style={{ height:"4px", background:"var(--border-solid)", borderRadius:"99px", overflow:"hidden" }}>
                            <div style={{ height:"100%", borderRadius:"99px", transition:"all 0.3s ease",
                              width: passwords.newPass.length < 6 ? "25%" : passwords.newPass.length < 10 ? "55%" : "100%",
                              background: passwords.newPass.length < 6 ? "#ef4444" : passwords.newPass.length < 10 ? "#f59e0b" : "#10b981"
                            }} />
                          </div>
                          <p style={{ color: passwords.newPass.length < 6 ? "#ef4444" : passwords.newPass.length < 10 ? "#f59e0b" : "#10b981", fontSize:"12px", margin:"4px 0 0 0", fontWeight:"600" }}>
                            {passwords.newPass.length < 6 ? t("weak") : passwords.newPass.length < 10 ? t("fair") : t("strong")}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Confirm */}
                    <div>
                      <label style={{ display:"block", color:"var(--text-subtle)", fontSize:"12px", fontWeight:"600", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>{t("confirmNewPassword")}</label>
                      <input type="password" className="settings-input" style={inputStyle(errors.confirm)} value={passwords.confirm}
                        onChange={e => setPasswords(p=>({...p,confirm:e.target.value}))} placeholder="Repeat new password" />
                      {errors.confirm && <p style={{ color:"#ef4444", fontSize:"12px", margin:"4px 0 0 0" }}>{errors.confirm}</p>}
                    </div>
                  </div>

                  <div style={{ marginTop:"28px", display:"flex", justifyContent:"flex-end" }}>
                    <button className="save-btn" onClick={handlePasswordSave}
                      style={{ padding:"12px 32px", borderRadius:"10px", border:"none", background:"#8b5cf6", color:"#fff", fontWeight:"700", fontSize:"14px", fontFamily:"'DM Sans',sans-serif" }}>
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
