import { useState, useEffect } from "react";
import { adminAPI, appointmentsAPI } from "../../utils/api";

export const Appointments = () => {
  const [appts, setAppts] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch all appointments via admin endpoint
  useEffect(() => {
    adminAPI.getAllAppointments({ limit: 200 })
      .then((data) => {
        if (data && Array.isArray(data.appointments)) {
          const mapped = data.appointments.map((a) => ({
            id: a._id || a.id,
            patient: a.patient_name || "Patient",
            provider: a.provider_name || "Provider",
            date: a.appointment_date ? new Date(a.appointment_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
            time: a.appointment_date ? new Date(a.appointment_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "",
            status: a.status || "pending",
            department: a.department || "",
          }));
          setAppts(mapped);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCancel = async (id) => {
    try {
      await appointmentsAPI.cancel(id);
    } catch { }
    setAppts(prev => prev.map(a => a.id === id ? { ...a, status: "cancelled" } : a));
    showToast("Appointment cancelled by admin.");
  };

  const filtered = appts.filter(a => {
    const matchSearch = a.patient.toLowerCase().includes(search.toLowerCase()) || a.provider.toLowerCase().includes(search.toLowerCase()) || a.department.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || a.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: appts.length,
    confirmed: appts.filter(a => a.status === "confirmed").length,
    pending: appts.filter(a => a.status === "pending").length,
    cancelled: appts.filter(a => a.status === "cancelled").length,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
        @keyframes toastIn { from { opacity:0; transform:translateY(20px);} to { opacity:1; transform:translateY(0);} }
        .appt-row { transition: background 0.15s ease; }
        .appt-row:hover { background: #0f172a; }
        .search-input { background: #0f172a; border: 1px solid #1e293b; color: #f1f5f9; padding: 11px 16px 11px 42px; border-radius: 10px; font-size: 14px; outline: none; font-family: 'DM Sans', sans-serif; width: 280px; box-sizing: border-box; transition: border-color 0.2s; }
        .search-input:focus { border-color: #8b5cf6; }
        .search-input::placeholder { color: #334155; }
      `}</style>

      <div style={{ background: "#060d1a", minHeight: "100vh", padding: "40px 48px", fontFamily: "'DM Sans', sans-serif" }}>

        {/* Toast */}
        {toast && (
          <div style={{ position: "fixed", bottom: "32px", right: "32px", zIndex: 2000, background: "#8b5cf6", color: "#fff", padding: "12px 24px", borderRadius: "10px", fontWeight: "600", fontSize: "14px", animation: "toastIn 0.3s ease", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
            {toast}
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: "36px", animation: "fadeUp 0.5s ease both" }}>
          <p style={{ color: "#8b5cf6", fontSize: "12px", fontWeight: "600", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 6px 0" }}>Admin Portal</p>
          <h1 style={{ color: "#f1f5f9", fontSize: "32px", fontWeight: "700", margin: 0, fontFamily: "'Playfair Display', serif", letterSpacing: "-0.5px" }}>All Appointments</h1>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px", animation: "fadeUp 0.5s ease 0.08s both" }}>
          {[
            { label: "Total", value: stats.total, color: "#8b5cf6" },
            { label: "Confirmed", value: stats.confirmed, color: "#10b981" },
            { label: "Pending", value: stats.pending, color: "#f59e0b" },
            { label: "Cancelled", value: stats.cancelled, color: "#ef4444" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", padding: "20px 24px" }}>
              <div style={{ color: s.color, fontSize: "28px", fontWeight: "700", marginBottom: "4px" }}>{s.value}</div>
              <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "500" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", animation: "fadeUp 0.5s ease 0.12s both" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", pointerEvents: "none" }}>🔍</span>
            <input type="text" placeholder="Search patients, providers, departments..." className="search-input" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {[["all", "All"], ["confirmed", "Confirmed"], ["pending", "Pending"], ["cancelled", "Cancelled"]].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                style={{ padding: "8px 18px", borderRadius: "8px", border: filter === val ? "none" : "1px solid #1e293b", fontWeight: "600", fontSize: "13px", cursor: "pointer", transition: "all 0.15s ease", fontFamily: "'DM Sans',sans-serif", background: filter === val ? "#8b5cf6" : "#0f172a", color: filter === val ? "#fff" : "#64748b" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", overflow: "hidden", animation: "fadeUp 0.5s ease 0.16s both" }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 0.8fr 0.8fr 0.6fr", padding: "16px 24px", background: "#060d1a", borderBottom: "1px solid #1e293b" }}>
            {["Patient", "Provider", "Department", "Date", "Time", "Status"].map(h => (
              <div key={h} style={{ color: "#64748b", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {loading && (
            <div style={{ textAlign: "center", color: "#64748b", padding: "60px", fontSize: "16px" }}>Loading appointments...</div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", color: "#334155", padding: "60px", fontSize: "16px" }}>No appointments found.</div>
          )}
          {filtered.map(a => (
            <div key={a.id} className="appt-row" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 0.8fr 0.8fr 0.6fr", padding: "18px 24px", borderBottom: "1px solid #1e293b" }}>
              <div style={{ color: "#f1f5f9", fontSize: "14px", fontWeight: "600" }}>{a.patient}</div>
              <div style={{ color: "#8b5cf6", fontSize: "14px", fontWeight: "600" }}>{a.provider}</div>
              <div style={{ color: "#64748b", fontSize: "14px" }}>{a.department}</div>
              <div style={{ color: "#64748b", fontSize: "14px" }}>{a.date}</div>
              <div style={{ color: "#64748b", fontSize: "14px" }}>{a.time}</div>
              <div>
                {a.status === "confirmed" && (
                  <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
                    Confirmed
                  </span>
                )}
                {a.status === "pending" && (
                  <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
                    Pending
                  </span>
                )}
                {a.status === "cancelled" && (
                  <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                    Cancelled
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
