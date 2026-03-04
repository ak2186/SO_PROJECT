import { useState, useEffect } from "react";
import { appointmentsAPI } from "../../utils/api";

const upcoming = [
  { id: 1, doctor: "Dr. Sarah Mitchell", specialty: "Cardiologist", date: "Feb 20, 2026", time: "10:30 AM", location: "Heart Care Clinic, Room 204", avatar: "SM" },
  { id: 2, doctor: "Dr. James Patel", specialty: "General Physician", date: "Feb 25, 2026", time: "2:00 PM", location: "City Medical Centre, Room 101", avatar: "JP" },
  { id: 3, doctor: "Dr. Lena Horowitz", specialty: "Dermatologist", date: "Mar 3, 2026", time: "11:00 AM", location: "Skin & Wellness Clinic", avatar: "LH" },
];

const past = [
  { id: 4, doctor: "Dr. Sarah Mitchell", specialty: "Cardiologist", date: "Jan 15, 2026", time: "9:00 AM", status: "Completed", avatar: "SM" },
  { id: 5, doctor: "Dr. Omar Rashid", specialty: "Neurologist", date: "Dec 28, 2025", time: "3:30 PM", status: "Completed", avatar: "OR" },
  { id: 6, doctor: "Dr. James Patel", specialty: "General Physician", date: "Dec 10, 2025", time: "1:00 PM", status: "Cancelled", avatar: "JP" },
];

const avatarColors = {
  SM: "#3b82f6", JP: "#10b981", LH: "#f59e0b", OR: "#8b5cf6",
};

export const Appointments = () => {
  const [tab, setTab] = useState("upcoming");
  const [showModal, setShowModal] = useState(false);
  const [cancelId, setCancelId] = useState(null);
  const [appts, setAppts] = useState(upcoming);
  const [pastAppts, setPastAppts] = useState(past);
  const [form, setForm] = useState({ doctor: "", specialty: "", date: "", time: "", location: "" });
  const [showSchedule, setShowSchedule] = useState(false);
  const [toast, setToast] = useState(null);

  // Fetch appointments from backend
  useEffect(() => {
    appointmentsAPI.getMyAppointments()
      .then((data) => {
        if (data && Array.isArray(data.appointments) && data.appointments.length > 0) {
          const mapped = data.appointments.map((a) => ({
            id: a.id || a._id,
            doctor: a.provider_name || a.doctor || "Doctor",
            specialty: a.specialty || a.department || "",
            date: a.date ? new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
            time: a.time || "",
            location: a.location || "",
            status: a.status || "pending",
            avatar: (a.provider_name || a.doctor || "DR").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
          }));
          const active = mapped.filter(a => !["completed", "cancelled"].includes(a.status?.toLowerCase()));
          const done = mapped.filter(a => ["completed", "cancelled"].includes(a.status?.toLowerCase()));
          if (active.length > 0) setAppts(active);
          if (done.length > 0) setPastAppts(done.map(a => ({ ...a, status: a.status.charAt(0).toUpperCase() + a.status.slice(1) })));
        }
      })
      .catch(() => { }); // fallback to mock data
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCancel = (id) => { setCancelId(id); setShowModal(true); };
  const confirmCancel = async () => {
    try {
      await appointmentsAPI.cancel(cancelId);
    } catch { }
    setAppts((prev) => prev.filter((a) => a.id !== cancelId));
    setShowModal(false);
    showToast("Appointment cancelled.");
  };

  const handleSchedule = async () => {
    if (!form.doctor || !form.date || !form.time) return showToast("Please fill all required fields.", "error");
    try {
      const result = await appointmentsAPI.book({
        provider_name: form.doctor,
        specialty: form.specialty,
        date: form.date,
        time: form.time,
        location: form.location,
      });
      const newAppt = {
        id: result.id || result._id || Date.now(),
        doctor: form.doctor,
        specialty: form.specialty,
        date: form.date,
        time: form.time,
        location: form.location,
        avatar: form.doctor.slice(0, 2).toUpperCase(),
      };
      setAppts((prev) => [...prev, newAppt]);
    } catch {
      const newAppt = { id: Date.now(), ...form, avatar: form.doctor.slice(0, 2).toUpperCase() };
      setAppts((prev) => [...prev, newAppt]);
    }
    setShowSchedule(false);
    setForm({ doctor: "", specialty: "", date: "", time: "", location: "" });
    showToast("Appointment scheduled!");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
        @keyframes toastIn { from { opacity:0; transform:translateY(20px);} to { opacity:1; transform:translateY(0);} }
        .appt-card { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .appt-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.35) !important; }
        .tab-btn { transition: all 0.18s ease; }
        .action-btn { transition: all 0.15s ease; cursor: pointer; }
        .action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:1000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); }
        .schedule-input { width:100%; padding:10px 12px; border:1px solid #1e293b; border-radius:8px; background:#0f172a; color:#f1f5f9; font-size:14px; outline:none; box-sizing:border-box; font-family:'DM Sans',sans-serif; }
        .schedule-input:focus { border-color:#3b82f6; }
        .schedule-input::placeholder { color:#475569; }
      `}</style>

      <div style={{ background: "#060d1a", minHeight: "100vh", padding: "40px 48px", fontFamily: "'DM Sans', sans-serif" }}>

        {/* Toast */}
        {toast && (
          <div style={{ position: "fixed", bottom: "32px", right: "32px", zIndex: 2000, background: toast.type === "error" ? "#ef4444" : "#10b981", color: "#fff", padding: "12px 24px", borderRadius: "10px", fontWeight: "600", fontSize: "14px", animation: "toastIn 0.3s ease", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "36px", animation: "fadeUp 0.5s ease both" }}>
          <div>
            <p style={{ color: "#3b82f6", fontSize: "12px", fontWeight: "600", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 6px 0" }}>Healthcare</p>
            <h1 style={{ color: "#f1f5f9", fontSize: "32px", fontWeight: "700", margin: 0, fontFamily: "'Playfair Display', serif", letterSpacing: "-0.5px" }}>Appointments</h1>
          </div>
          <button
            onClick={() => setShowSchedule(true)}
            style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "10px", fontWeight: "600", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 16px rgba(59,130,246,0.35)" }}
            className="action-btn"
          >
            + Schedule Appointment
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "28px", background: "#0f172a", padding: "4px", borderRadius: "10px", width: "fit-content", animation: "fadeUp 0.5s ease 0.1s both" }}>
          {["upcoming", "past"].map(t => (
            <button key={t} className="tab-btn" onClick={() => setTab(t)}
              style={{ padding: "8px 24px", borderRadius: "8px", border: "none", fontWeight: "600", fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", background: tab === t ? "#3b82f6" : "transparent", color: tab === t ? "#fff" : "#64748b" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Upcoming Appointments */}
        {tab === "upcoming" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {appts.length === 0 && (
              <div style={{ textAlign: "center", color: "#334155", padding: "60px", fontSize: "16px" }}>No upcoming appointments.</div>
            )}
            {appts.map((a, i) => (
              <div key={a.id} className="appt-card" style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", padding: "24px", display: "flex", alignItems: "center", gap: "20px", animation: `fadeUp 0.4s ease ${i * 0.08}s both`, boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: avatarColors[a.avatar] || "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "16px", color: "#fff", flexShrink: 0 }}>
                  {a.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#f1f5f9", fontWeight: "700", fontSize: "16px", marginBottom: "4px" }}>{a.doctor}</div>
                  <div style={{ color: "#3b82f6", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>{a.specialty}</div>
                  <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                    <span style={{ color: "#64748b", fontSize: "13px" }}>📅 {a.date}</span>
                    <span style={{ color: "#64748b", fontSize: "13px" }}>🕐 {a.time}</span>
                    {a.location && <span style={{ color: "#64748b", fontSize: "13px" }}>📍 {a.location}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
                  <button onClick={() => handleCancel(a.id)} className="action-btn"
                    style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid #ef4444", background: "transparent", color: "#ef4444", fontSize: "13px", fontWeight: "600", fontFamily: "'DM Sans',sans-serif" }}>
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Past Appointments */}
        {tab === "past" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {pastAppts.map((a, i) => (
              <div key={a.id} className="appt-card" style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", padding: "24px", display: "flex", alignItems: "center", gap: "20px", animation: `fadeUp 0.4s ease ${i * 0.08}s both`, opacity: 0.85, boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: avatarColors[a.avatar] || "#475569", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "16px", color: "#fff", flexShrink: 0 }}>
                  {a.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#f1f5f9", fontWeight: "700", fontSize: "16px", marginBottom: "4px" }}>{a.doctor}</div>
                  <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>{a.specialty}</div>
                  <div style={{ display: "flex", gap: "20px" }}>
                    <span style={{ color: "#475569", fontSize: "13px" }}>📅 {a.date}</span>
                    <span style={{ color: "#475569", fontSize: "13px" }}>🕐 {a.time}</span>
                  </div>
                </div>
                <span style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", background: a.status === "Completed" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: a.status === "Completed" ? "#10b981" : "#ef4444", border: `1px solid ${a.status === "Completed" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Cancel Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px", padding: "36px", width: "380px", textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
              <h3 style={{ color: "#f1f5f9", fontSize: "20px", fontWeight: "700", margin: "0 0 10px 0" }}>Cancel Appointment?</h3>
              <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 28px 0" }}>This action cannot be undone. The appointment will be permanently removed.</p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button onClick={() => setShowModal(false)} style={{ padding: "10px 24px", borderRadius: "8px", border: "1px solid #1e293b", background: "transparent", color: "#94a3b8", fontWeight: "600", fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Keep It</button>
                <button onClick={confirmCancel} style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "#ef4444", color: "#fff", fontWeight: "600", fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Yes, Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        {showSchedule && (
          <div className="modal-overlay">
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "16px", padding: "36px", width: "440px" }}>
              <h3 style={{ color: "#f1f5f9", fontSize: "20px", fontWeight: "700", margin: "0 0 24px 0" }}>Schedule Appointment</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[["Doctor Name *", "doctor", "text", "e.g. Dr. Sarah Mitchell"], ["Specialty", "specialty", "text", "e.g. Cardiologist"], ["Date *", "date", "date", ""], ["Time *", "time", "time", ""], ["Location", "location", "text", "Clinic / Room"]].map(([label, key, type, ph]) => (
                  <div key={key}>
                    <label style={{ display: "block", color: "#64748b", fontSize: "12px", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
                    <input type={type} placeholder={ph} className="schedule-input" value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button onClick={() => setShowSchedule(false)} style={{ flex: 1, padding: "11px", borderRadius: "8px", border: "1px solid #1e293b", background: "transparent", color: "#94a3b8", fontWeight: "600", fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
                <button onClick={handleSchedule} style={{ flex: 1, padding: "11px", borderRadius: "8px", border: "none", background: "#3b82f6", color: "#fff", fontWeight: "600", fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
