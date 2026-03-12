import { useState, useEffect } from "react";
import { appointmentsAPI } from "../../utils/api";

const defaultAvatarColors = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];

export const Appointments = () => {
  const [tab, setTab] = useState("today");
  const [appts, setAppts] = useState({ today: [], upcoming: [] });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch provider appointments from backend
  useEffect(() => {
    appointmentsAPI.getProviderAppointments({ limit: 100 })
      .then((data) => {
        if (data && Array.isArray(data.appointments)) {
          const today = new Date().toDateString();
          const mapped = data.appointments
            .filter(a => a.status !== "cancelled")
            .map((a, idx) => ({
              id: a._id || a.id,
              patient: a.patient_name || "Patient",
              age: a.patient_age || "",
              time: a.appointment_date ? new Date(a.appointment_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "",
              date: a.appointment_date ? new Date(a.appointment_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
              reason: a.reason || a.notes || "",
              status: a.status || "pending",
              avatar: (a.patient_name || "PT").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
              _color: defaultAvatarColors[idx % defaultAvatarColors.length],
            }));
          const todayList = mapped.filter(a => a.date && new Date(a.date).toDateString() === today);
          const upcomingList = mapped.filter(a => !a.date || new Date(a.date).toDateString() !== today);
          setAppts({ today: todayList, upcoming: upcomingList });
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async (id) => {
    try {
      await appointmentsAPI.confirm(id);
    } catch { }
    setAppts(prev => ({
      ...prev,
      [tab]: prev[tab].map(a => a.id === id ? { ...a, status: "confirmed" } : a)
    }));
    showToast("Appointment confirmed!");
  };

  const handleCancel = async (id) => {
    try {
      await appointmentsAPI.cancel(id);
    } catch { }
    setAppts(prev => ({
      ...prev,
      [tab]: prev[tab].filter(a => a.id !== id)
    }));
    showToast("Appointment cancelled.");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
        @keyframes toastIn { from { opacity:0; transform:translateY(20px);} to { opacity:1; transform:translateY(0);} }
        .appt-card { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .appt-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.35) !important; }
        .action-btn { transition: all 0.15s ease; cursor: pointer; }
        .action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
      `}</style>

      <div style={{ background: "#060d1a", minHeight: "100vh", padding: "40px 48px", fontFamily: "'DM Sans', sans-serif" }}>

        {/* Toast */}
        {toast && (
          <div style={{ position: "fixed", bottom: "32px", right: "32px", zIndex: 2000, background: "#10b981", color: "#fff", padding: "12px 24px", borderRadius: "10px", fontWeight: "600", fontSize: "14px", animation: "toastIn 0.3s ease", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
            {toast}
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: "36px", animation: "fadeUp 0.5s ease both" }}>
          <p style={{ color: "#10b981", fontSize: "12px", fontWeight: "600", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 6px 0" }}>Provider Portal</p>
          <h1 style={{ color: "#f1f5f9", fontSize: "32px", fontWeight: "700", margin: 0, fontFamily: "'Playfair Display', serif", letterSpacing: "-0.5px" }}>Patient Appointments</h1>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px", animation: "fadeUp 0.5s ease 0.08s both" }}>
          {[
            { label: "Today's Appointments", value: appts.today.length, color: "#10b981" },
            { label: "Pending Approval", value: [...appts.today, ...appts.upcoming].filter(a => a.status === "pending").length, color: "#f59e0b" },
            { label: "Upcoming This Week", value: appts.upcoming.length, color: "#06b6d4" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", padding: "20px 24px" }}>
              <div style={{ color: s.color, fontSize: "28px", fontWeight: "700", marginBottom: "4px" }}>{s.value}</div>
              <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "500" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "28px", background: "#0f172a", padding: "4px", borderRadius: "10px", width: "fit-content", animation: "fadeUp 0.5s ease 0.1s both" }}>
          {["today", "upcoming"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "8px 24px", borderRadius: "8px", border: "none", fontWeight: "600", fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", background: tab === t ? "#10b981" : "transparent", color: tab === t ? "#fff" : "#64748b", transition: "all 0.18s ease" }}>
              {t === "today" ? "Today" : "Upcoming"}
            </button>
          ))}
        </div>

        {/* Appointments List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {loading && (
            <div style={{ textAlign: "center", color: "#64748b", padding: "60px", fontSize: "16px" }}>Loading appointments...</div>
          )}
          {!loading && appts[tab].length === 0 && (
            <div style={{ textAlign: "center", color: "#334155", padding: "60px", fontSize: "16px" }}>No {tab === "today" ? "today's" : "upcoming"} appointments.</div>
          )}
          {appts[tab].map((a, i) => (
            <div key={a.id} className="appt-card" style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", padding: "24px", display: "flex", alignItems: "center", gap: "20px", animation: `fadeUp 0.4s ease ${i * 0.08}s both`, boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: a._color || "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "16px", color: "#fff", flexShrink: 0 }}>
                {a.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px", flexWrap: "wrap" }}>
                  <span style={{ color: "#f1f5f9", fontWeight: "700", fontSize: "16px" }}>{a.patient}</span>
                  <span style={{ color: "#64748b", fontSize: "13px" }}>Age {a.age}</span>
                  {a.status === "pending" && (
                    <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
                      Pending Approval
                    </span>
                  )}
                </div>
                <div style={{ color: "#10b981", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>{a.reason}</div>
                <div style={{ display: "flex", gap: "20px" }}>
                  {tab === "upcoming" && <span style={{ color: "#64748b", fontSize: "13px" }}>📅 {a.date}</span>}
                  <span style={{ color: "#64748b", fontSize: "13px" }}>🕐 {a.time}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
                {a.status === "pending" && (
                  <button onClick={() => handleApprove(a.id)} className="action-btn"
                    style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#10b981", color: "#fff", fontSize: "13px", fontWeight: "600", fontFamily: "'DM Sans',sans-serif" }}>
                    Approve
                  </button>
                )}
                <button onClick={() => handleCancel(a.id)} className="action-btn"
                  style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid #ef4444", background: "transparent", color: "#ef4444", fontSize: "13px", fontWeight: "600", fontFamily: "'DM Sans',sans-serif" }}>
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
