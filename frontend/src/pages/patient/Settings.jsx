import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export const Settings = () => {
  const { user } = useAuth();
  const [personal, setPersonal] = useState({ 
    name: user?.name || "Your Name", 
    email: user?.email || "you@example.com", 
    phone: "+44 7911 123456", 
    dob: "1999-03-14" 
  });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [activeSection, setActiveSection] = useState("personal");
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePersonalSave = () => {
    const e = {};
    if (!personal.name.trim()) e.name = "Name is required";
    if (!personal.email.includes("@")) e.email = "Valid email required";
    if (personal.phone && personal.phone.length < 8) e.phone = "Enter a valid phone number";
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    showToast("Personal details updated!");
  };

  const handlePasswordSave = () => {
    const e = {};
    if (!passwords.current) e.current = "Enter your current password";
    if (passwords.newPass.length < 8) e.newPass = "Password must be at least 8 characters";
    if (passwords.newPass !== passwords.confirm) e.confirm = "Passwords do not match";
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setPasswords({ current:"", newPass:"", confirm:"" });
    showToast("Password changed successfully!");
  };

  const sections = [
    { id:"personal", label:"Personal Details", icon:"👤" },
    { id:"password", label:"Change Password", icon:"🔒" },
  ];

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

      <div style={{ background:"#060d1a", minHeight:"100vh", fontFamily:"'DM Sans', sans-serif" }}>

        {/* Toast */}
        {toast && (
          <div style={{ position:"fixed", bottom:"32px", right:"32px", zIndex:2000, background: toast.type==="error" ? "#ef4444" : "#10b981", color:"#fff", padding:"12px 24px", borderRadius:"10px", fontWeight:"600", fontSize:"14px", animation:"toastIn 0.3s ease", boxShadow:"0 8px 24px rgba(0,0,0,0.3)" }}>
            {toast.msg}
          </div>
        )}

        <div style={{ maxWidth:"960px", margin:"0 auto", padding:"40px 48px" }}>

          {/* Header */}
          <div style={{ marginBottom:"40px", animation:"fadeUp 0.5s ease both" }}>
            <p style={{ color:"#8b5cf6", fontSize:"12px", fontWeight:"600", letterSpacing:"2px", textTransform:"uppercase", margin:"0 0 6px 0" }}>Account</p>
            <h1 style={{ color:"#f1f5f9", fontSize:"32px", fontWeight:"700", margin:0, fontFamily:"'Playfair Display', serif", letterSpacing:"-0.5px" }}>Settings</h1>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:"28px", animation:"fadeUp 0.5s ease 0.1s both" }}>

            {/* Sidebar Nav */}
            <div style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:"14px", padding:"12px", height:"fit-content" }}>
              {sections.map(s => (
                <div key={s.id} className="nav-item" onClick={() => { setActiveSection(s.id); setErrors({}); }}
                  style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px 14px", borderRadius:"10px", marginBottom:"4px", background: activeSection===s.id ? "#1e293b" : "transparent" }}>
                  <span style={{ fontSize:"18px" }}>{s.icon}</span>
                  <span style={{ color: activeSection===s.id ? "#f1f5f9" : "#64748b", fontWeight:"600", fontSize:"14px" }}>{s.label}</span>
                  {activeSection===s.id && <div style={{ marginLeft:"auto", width:"6px", height:"6px", borderRadius:"50%", background:"#3b82f6" }} />}
                </div>
              ))}
            </div>

            {/* Content Panel */}
            <div style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:"14px", padding:"32px" }}>

              {/* ── Personal Details ── */}
              {activeSection === "personal" && (
                <div>
                  <div style={{ marginBottom:"28px" }}>
                    <h2 style={{ color:"#f1f5f9", fontSize:"20px", fontWeight:"700", margin:"0 0 4px 0" }}>Personal Details</h2>
                    <p style={{ color:"#475569", fontSize:"14px", margin:0 }}>Update your name, email, phone and date of birth.</p>
                  </div>

                  {/* Avatar */}
                  <div style={{ display:"flex", alignItems:"center", gap:"20px", marginBottom:"32px", padding:"20px", background:"#060d1a", borderRadius:"12px", border:"1px solid #1e293b" }}>
                    <div style={{ width:"64px", height:"64px", borderRadius:"16px", background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"700", fontSize:"22px", color:"#fff", flexShrink:0 }}>
                      {personal.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                    </div>
                    <div>
                      <div style={{ color:"#f1f5f9", fontWeight:"700", fontSize:"16px" }}>{personal.name || "Your Name"}</div>
                      <div style={{ color:"#475569", fontSize:"13px" }}>Patient Account</div>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>
                    {/* Full Name */}
                    <div style={{ gridColumn:"1/-1" }}>
                      <label style={{ display:"block", color:"#64748b", fontSize:"12px", fontWeight:"600", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>Full Name</label>
                      <input type="text" className="settings-input" style={inputStyle(errors.name)} value={personal.name}
                        onChange={e => setPersonal(p=>({...p,name:e.target.value}))} placeholder="Your full name" />
                      {errors.name && <p style={{ color:"#ef4444", fontSize:"12px", margin:"4px 0 0 0" }}>{errors.name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label style={{ display:"block", color:"#64748b", fontSize:"12px", fontWeight:"600", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>Email Address</label>
                      <input type="email" className="settings-input" style={inputStyle(errors.email)} value={personal.email}
                        onChange={e => setPersonal(p=>({...p,email:e.target.value}))} placeholder="you@example.com" />
                      {errors.email && <p style={{ color:"#ef4444", fontSize:"12px", margin:"4px 0 0 0" }}>{errors.email}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                      <label style={{ display:"block", color:"#64748b", fontSize:"12px", fontWeight:"600", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>Phone Number</label>
                      <input type="tel" className="settings-input" style={inputStyle(errors.phone)} value={personal.phone}
                        onChange={e => setPersonal(p=>({...p,phone:e.target.value}))} placeholder="+44 7911 000000" />
                      {errors.phone && <p style={{ color:"#ef4444", fontSize:"12px", margin:"4px 0 0 0" }}>{errors.phone}</p>}
                    </div>

                    {/* DOB */}
                    <div>
                      <label style={{ display:"block", color:"#64748b", fontSize:"12px", fontWeight:"600", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>Date of Birth</label>
                      <input type="date" className="settings-input" style={{ ...inputStyle(false), colorScheme:"dark" }} value={personal.dob}
                        onChange={e => setPersonal(p=>({...p,dob:e.target.value}))} />
                    </div>
                  </div>

                  <div style={{ marginTop:"28px", display:"flex", justifyContent:"flex-end" }}>
                    <button className="save-btn" onClick={handlePersonalSave}
                      style={{ padding:"12px 32px", borderRadius:"10px", border:"none", background:"#3b82f6", color:"#fff", fontWeight:"700", fontSize:"14px", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", gap:"8px" }}>
                      {saved ? <span style={{ animation:"checkIn 0.3s ease" }}>✓ Saved!</span> : "Save Changes"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Change Password ── */}
              {activeSection === "password" && (
                <div>
                  <div style={{ marginBottom:"28px" }}>
                    <h2 style={{ color:"#f1f5f9", fontSize:"20px", fontWeight:"700", margin:"0 0 4px 0" }}>Change Password</h2>
                    <p style={{ color:"#475569", fontSize:"14px", margin:0 }}>Choose a strong password with at least 8 characters.</p>
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
                    {/* Current */}
                    <div>
                      <label style={{ display:"block", color:"#64748b", fontSize:"12px", fontWeight:"600", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>Current Password</label>
                      <input type="password" className="settings-input" style={inputStyle(errors.current)} value={passwords.current}
                        onChange={e => setPasswords(p=>({...p,current:e.target.value}))} placeholder="••••••••" />
                      {errors.current && <p style={{ color:"#ef4444", fontSize:"12px", margin:"4px 0 0 0" }}>{errors.current}</p>}
                    </div>

                    {/* New */}
                    <div>
                      <label style={{ display:"block", color:"#64748b", fontSize:"12px", fontWeight:"600", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>New Password</label>
                      <input type="password" className="settings-input" style={inputStyle(errors.newPass)} value={passwords.newPass}
                        onChange={e => setPasswords(p=>({...p,newPass:e.target.value}))} placeholder="At least 8 characters" />
                      {errors.newPass && <p style={{ color:"#ef4444", fontSize:"12px", margin:"4px 0 0 0" }}>{errors.newPass}</p>}

                      {/* Strength bar */}
                      {passwords.newPass.length > 0 && (
                        <div style={{ marginTop:"10px" }}>
                          <div style={{ height:"4px", background:"#1e293b", borderRadius:"99px", overflow:"hidden" }}>
                            <div style={{ height:"100%", borderRadius:"99px", transition:"all 0.3s ease",
                              width: passwords.newPass.length < 6 ? "25%" : passwords.newPass.length < 10 ? "55%" : "100%",
                              background: passwords.newPass.length < 6 ? "#ef4444" : passwords.newPass.length < 10 ? "#f59e0b" : "#10b981"
                            }} />
                          </div>
                          <p style={{ color: passwords.newPass.length < 6 ? "#ef4444" : passwords.newPass.length < 10 ? "#f59e0b" : "#10b981", fontSize:"12px", margin:"4px 0 0 0", fontWeight:"600" }}>
                            {passwords.newPass.length < 6 ? "Weak" : passwords.newPass.length < 10 ? "Fair" : "Strong"}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Confirm */}
                    <div>
                      <label style={{ display:"block", color:"#64748b", fontSize:"12px", fontWeight:"600", marginBottom:"8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>Confirm New Password</label>
                      <input type="password" className="settings-input" style={inputStyle(errors.confirm)} value={passwords.confirm}
                        onChange={e => setPasswords(p=>({...p,confirm:e.target.value}))} placeholder="Repeat new password" />
                      {errors.confirm && <p style={{ color:"#ef4444", fontSize:"12px", margin:"4px 0 0 0" }}>{errors.confirm}</p>}
                    </div>
                  </div>

                  <div style={{ marginTop:"28px", display:"flex", justifyContent:"flex-end" }}>
                    <button className="save-btn" onClick={handlePasswordSave}
                      style={{ padding:"12px 32px", borderRadius:"10px", border:"none", background:"#8b5cf6", color:"#fff", fontWeight:"700", fontSize:"14px", fontFamily:"'DM Sans',sans-serif" }}>
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
