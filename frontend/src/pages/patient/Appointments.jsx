import { useState, useEffect } from "react";
import { appointmentsAPI } from "../../utils/api";

export const Appointments = () => {
  const [tab, setTab] = useState("upcoming");
  const [showModal, setShowModal] = useState(false);
  const [cancelId, setCancelId] = useState(null);
  const [appts, setAppts] = useState([]);
  const [pastAppts, setPastAppts] = useState([]);
  const [providers, setProviders] = useState([]);
  const [form, setForm] = useState({ provider_id: "", date: "", time: "", reason: "" });
  const [showSchedule, setShowSchedule] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch appointments from backend
  useEffect(() => {
    appointmentsAPI.getMyAppointments()
      .then((data) => {
        if (data && Array.isArray(data.appointments)) {
          const mapped = data.appointments.map((a) => ({
            id: a._id || a.id,
            doctor: a.provider_name || "Doctor",
            specialty: a.specialty || "",
            date: a.appointment_date ? new Date(a.appointment_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
            time: a.appointment_date ? new Date(a.appointment_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "",
            location: a.location || "",
            status: a.status || "pending",
            reason: a.reason || "",
            avatar: (a.provider_name || "DR").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
          }));
          const active = mapped.filter(a => !["completed", "cancelled"].includes(a.status?.toLowerCase()));
          const done = mapped.filter(a => ["completed", "cancelled"].includes(a.status?.toLowerCase()));
          setAppts(active);
          setPastAppts(done.map(a => ({ ...a, status: a.status.charAt(0).toUpperCase() + a.status.slice(1) })));
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  // Fetch providers for booking
  useEffect(() => {
    appointmentsAPI.getProviders()
      .then((data) => {
        if (data && Array.isArray(data.providers)) {
          setProviders(data.providers);
        }
      })
      .catch(() => { });
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCancel = (id) => { setCancelId(id); setShowModal(true); };
  const confirmCancel = async () => {
    try {
      await appointmentsAPI.cancel(cancelId);
      setAppts((prev) => prev.filter((a) => a.id !== cancelId));
      showToast("Appointment cancelled.");
    } catch {
      showToast("Failed to cancel appointment.", "error");
    }
    setShowModal(false);
  };

  const handleSchedule = async () => {
    if (!form.provider_id || !form.date || !form.time) return showToast("Please select a provider, date and time.", "error");
    const dateTime = new Date(`${form.date}T${form.time}`);
    try {
      const result = await appointmentsAPI.book({
        provider_id: form.provider_id,
        appointment_date: dateTime.toISOString(),
        reason: form.reason || null,
      });
      const provider = providers.find(p => (p._id || p.id) === form.provider_id);
      const providerName = provider ? `${provider.first_name} ${provider.last_name}` : "Doctor";
      const newAppt = {
        id: result.appointment?._id || result.appointment?.id || Date.now(),
        doctor: providerName,
        specialty: provider?.specialty || "",
        date: dateTime.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time: dateTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
        status: "pending",
        reason: form.reason,
        avatar: providerName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
      };
      setAppts((prev) => [...prev, newAppt]);
      showToast("Appointment scheduled!");
    } catch (err) {
      showToast(err.message || "Failed to schedule appointment.", "error");
    }
    setShowSchedule(false);
    setForm({ provider_id: "", date: "", time: "", reason: "" });
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
        .schedule-input { width:100%; padding:10px 12px; border:1px solid var(--border-solid); border-radius:8px; background:var(--bg-3); color:var(--text); font-size:14px; outline:none; box-sizing:border-box; font-family:'DM Sans',sans-serif; }
        .schedule-input:focus { border-color:#3b82f6; }
        .schedule-input::placeholder { color:var(--text-faint); }
      `}</style>

      <div style={{ background: "var(--bg)", minHeight: "100vh", padding: "40px 48px", fontFamily: "'DM Sans', sans-serif" }}>

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
            <h1 style={{ color: "var(--text)", fontSize: "32px", fontWeight: "700", margin: 0, fontFamily: "'Playfair Display', serif", letterSpacing: "-0.5px" }}>Appointments</h1>
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
        <div style={{ display: "flex", gap: "4px", marginBottom: "28px", background: "var(--bg-3)", padding: "4px", borderRadius: "10px", width: "fit-content", animation: "fadeUp 0.5s ease 0.1s both" }}>
          {["upcoming", "past"].map(t => (
            <button key={t} className="tab-btn" onClick={() => setTab(t)}
              style={{ padding: "8px 24px", borderRadius: "8px", border: "none", fontWeight: "600", fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", background: tab === t ? "#3b82f6" : "transparent", color: tab === t ? "#fff" : "var(--text-subtle)" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Upcoming Appointments */}
        {tab === "upcoming" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {appts.length === 0 && !loading && (
              <div style={{ textAlign: "center", color: "var(--border-mid)", padding: "60px", fontSize: "16px" }}>No upcoming appointments.</div>
            )}
            {loading && (
              <div style={{ textAlign: "center", color: "var(--text-subtle)", padding: "60px", fontSize: "16px" }}>Loading appointments...</div>
            )}
            {appts.map((a, i) => (
              <div key={a.id} className="appt-card" style={{ background: "var(--bg-3)", border: "1px solid var(--border-solid)", borderRadius: "14px", padding: "24px", display: "flex", alignItems: "center", gap: "20px", animation: `fadeUp 0.4s ease ${i * 0.08}s both`, boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "16px", color: "#fff", flexShrink: 0 }}>
                  {a.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "var(--text)", fontWeight: "700", fontSize: "16px", marginBottom: "4px" }}>{a.doctor}</div>
                  <div style={{ color: "#3b82f6", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>{a.specialty}</div>
                  <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                    <span style={{ color: "var(--text-subtle)", fontSize: "13px" }}>📅 {a.date}</span>
                    <span style={{ color: "var(--text-subtle)", fontSize: "13px" }}>🕐 {a.time}</span>
                    {a.location && <span style={{ color: "var(--text-subtle)", fontSize: "13px" }}>📍 {a.location}</span>}
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
              <div key={a.id} className="appt-card" style={{ background: "var(--bg-3)", border: "1px solid var(--border-solid)", borderRadius: "14px", padding: "24px", display: "flex", alignItems: "center", gap: "20px", animation: `fadeUp 0.4s ease ${i * 0.08}s both`, opacity: 0.85, boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "#475569", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "16px", color: "#fff", flexShrink: 0 }}>
                  {a.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "var(--text)", fontWeight: "700", fontSize: "16px", marginBottom: "4px" }}>{a.doctor}</div>
                  <div style={{ color: "var(--text-subtle)", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>{a.specialty}</div>
                  <div style={{ display: "flex", gap: "20px" }}>
                    <span style={{ color: "var(--text-faint)", fontSize: "13px" }}>📅 {a.date}</span>
                    <span style={{ color: "var(--text-faint)", fontSize: "13px" }}>🕐 {a.time}</span>
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
            <div style={{ background: "var(--bg-3)", border: "1px solid var(--border-solid)", borderRadius: "16px", padding: "36px", width: "380px", textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
              <h3 style={{ color: "var(--text)", fontSize: "20px", fontWeight: "700", margin: "0 0 10px 0" }}>Cancel Appointment?</h3>
              <p style={{ color: "var(--text-subtle)", fontSize: "14px", margin: "0 0 28px 0" }}>This action cannot be undone. The appointment will be permanently removed.</p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button onClick={() => setShowModal(false)} style={{ padding: "10px 24px", borderRadius: "8px", border: "1px solid var(--border-solid)", background: "transparent", color: "var(--text-muted)", fontWeight: "600", fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Keep It</button>
                <button onClick={confirmCancel} style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "#ef4444", color: "#fff", fontWeight: "600", fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Yes, Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        {showSchedule && (
          <div className="modal-overlay">
            <div style={{ background: "var(--bg-3)", border: "1px solid var(--border-solid)", borderRadius: "16px", padding: "36px", width: "540px", maxHeight: "85vh", overflowY: "auto" }}>
              <h3 style={{ color: "var(--text)", fontSize: "20px", fontWeight: "700", margin: "0 0 20px 0" }}>Schedule Appointment</h3>

              {/* Doctor Selection Cards */}
              <label style={{ display: "block", color: "var(--text-subtle)", fontSize: "12px", fontWeight: "600", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Select Doctor *</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px", maxHeight: "240px", overflowY: "auto", paddingRight: "4px" }}>
                {providers.map(pr => {
                  const prId = pr._id || pr.id;
                  const selected = form.provider_id === prId;
                  const initials = `${pr.first_name?.[0] || ""}${pr.last_name?.[0] || ""}`.toUpperCase();
                  return (
                    <div key={prId} onClick={() => setForm(p => ({ ...p, provider_id: prId }))}
                      style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", borderRadius: "12px", border: `1px solid ${selected ? "#3b82f6" : "var(--border-solid)"}`, background: selected ? "rgba(59,130,246,0.08)" : "var(--bg)", cursor: "pointer", transition: "all 0.15s ease" }}>
                      <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: selected ? "#3b82f6" : "var(--border-solid)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px", color: "#fff", flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: "var(--text)", fontWeight: "700", fontSize: "14px" }}>Dr. {pr.first_name} {pr.last_name}</div>
                        {pr.specialty && <div style={{ color: "#3b82f6", fontSize: "12px", fontWeight: "600", marginTop: "2px" }}>{pr.specialty}</div>}
                        <div style={{ display: "flex", gap: "12px", marginTop: "4px", flexWrap: "wrap" }}>
                          {pr.available_hours && <span style={{ color: "var(--text-subtle)", fontSize: "11px" }}>🕐 {pr.available_hours}</span>}
                          {pr.working_days && <span style={{ color: "var(--text-subtle)", fontSize: "11px" }}>📅 {pr.working_days}</span>}
                        </div>
                      </div>
                      {selected && <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#fff", flexShrink: 0 }}>✓</div>}
                    </div>
                  );
                })}
                {providers.length === 0 && <div style={{ color: "var(--text-faint)", fontSize: "13px", padding: "20px", textAlign: "center" }}>No providers available.</div>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", color: "var(--text-subtle)", fontSize: "12px", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Date *</label>
                  <input type="date" className="schedule-input" style={{ colorScheme: "dark" }} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: "block", color: "var(--text-subtle)", fontSize: "12px", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Time *</label>
                  <input type="time" className="schedule-input" style={{ colorScheme: "dark" }} value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", color: "var(--text-subtle)", fontSize: "12px", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Reason</label>
                <input type="text" placeholder="e.g. Annual checkup" className="schedule-input" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                <button onClick={() => setShowSchedule(false)} style={{ flex: 1, padding: "11px", borderRadius: "8px", border: "1px solid var(--border-solid)", background: "transparent", color: "var(--text-muted)", fontWeight: "600", fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
                <button onClick={handleSchedule} style={{ flex: 1, padding: "11px", borderRadius: "8px", border: "none", background: "#3b82f6", color: "#fff", fontWeight: "600", fontSize: "14px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
