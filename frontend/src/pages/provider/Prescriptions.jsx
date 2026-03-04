import { useState, useEffect } from "react";
import { prescriptionsAPI } from "../../utils/api";

const initialRequests = [
  { id: 1, patient: "Sarah Johnson", medication: "Atorvastatin 20mg", currentRefills: 3, requestedDate: "Feb 18, 2026", status: "pending", avatar: "SJ" },
  { id: 2, patient: "Robert Williams", medication: "Metformin 500mg", currentRefills: 5, requestedDate: "Feb 17, 2026", status: "pending", avatar: "RW" },
  { id: 3, patient: "Emma Davis", medication: "Lisinopril 10mg", currentRefills: 0, requestedDate: "Feb 16, 2026", status: "approved", avatar: "ED" },
];

const activePrescriptions = [
  { id: 4, patient: "Michael Chen", medication: "Amlodipine 5mg", dosage: "Once daily", refills: 4, issued: "Jan 20, 2026", avatar: "MC" },
  { id: 5, patient: "Lisa Anderson", medication: "Levothyroxine 50mcg", dosage: "Once daily", refills: 6, issued: "Jan 10, 2026", avatar: "LA" },
  { id: 6, patient: "David Martinez", medication: "Omeprazole 20mg", dosage: "Once daily before meals", refills: 3, issued: "Feb 5, 2026", avatar: "DM" },
];

const avatarColors = { SJ: "#10b981", MC: "#3b82f6", ED: "#f59e0b", RW: "#8b5cf6", LA: "#06b6d4", DM: "#ec4899" };

export const Prescriptions = () => {
  const [requests, setRequests] = useState(initialRequests);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("pending");
  const [toast, setToast] = useState(null);

  // Fetch provider prescriptions from backend
  useEffect(() => {
    prescriptionsAPI.getProviderPrescriptions()
      .then((data) => {
        if (data && Array.isArray(data.prescriptions) && data.prescriptions.length > 0) {
          const mapped = data.prescriptions.map((rx) => ({
            id: rx.id || rx._id,
            patient: rx.patient_name || rx.patient || "Patient",
            medication: `${rx.medication_name || rx.name || "Medication"} ${rx.dosage || ""}`.trim(),
            currentRefills: rx.refills_remaining ?? rx.refillsLeft ?? 0,
            requestedDate: rx.requested_date ? new Date(rx.requested_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
            status: rx.status || "pending",
            avatar: (rx.patient_name || rx.patient || "PT").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
          }));
          if (mapped.length > 0) setRequests(mapped);
        }
      })
      .catch(() => { }); // fallback to mock data
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = (id) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "approved" } : r));
    showToast("Refill request approved!");
  };

  const handleDeny = (id) => {
    setRequests(prev => prev.filter(r => r.id !== id));
    showToast("Refill request denied.");
  };

  const filtered = requests.filter(r => {
    const matchSearch = r.patient.toLowerCase().includes(search.toLowerCase()) || r.medication.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || r.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
        @keyframes toastIn { from { opacity:0; transform:translateY(20px);} to { opacity:1; transform:translateY(0);} }
        .rx-card { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .rx-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.35) !important; }
        .action-btn { transition: all 0.15s ease; cursor: pointer; }
        .action-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .search-input { background: #0f172a; border: 1px solid #1e293b; color: #f1f5f9; padding: 11px 16px 11px 42px; border-radius: 10px; font-size: 14px; outline: none; font-family: 'DM Sans', sans-serif; width: 280px; box-sizing: border-box; transition: border-color 0.2s; }
        .search-input:focus { border-color: #10b981; }
        .search-input::placeholder { color: #334155; }
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
          <h1 style={{ color: "#f1f5f9", fontSize: "32px", fontWeight: "700", margin: 0, fontFamily: "'Playfair Display', serif", letterSpacing: "-0.5px" }}>Prescription Management</h1>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px", animation: "fadeUp 0.5s ease 0.08s both" }}>
          {[
            { label: "Pending Refill Requests", value: requests.filter(r => r.status === "pending").length, color: "#f59e0b" },
            { label: "Approved Today", value: requests.filter(r => r.status === "approved").length, color: "#10b981" },
            { label: "Active Prescriptions", value: activePrescriptions.length, color: "#06b6d4" },
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
            <input type="text" placeholder="Search patients or medications..." className="search-input" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {[["all", "All"], ["pending", "Pending"], ["approved", "Approved"]].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                style={{ padding: "8px 18px", borderRadius: "8px", border: filter === val ? "none" : "1px solid #1e293b", fontWeight: "600", fontSize: "13px", cursor: "pointer", transition: "all 0.15s ease", fontFamily: "'DM Sans',sans-serif", background: filter === val ? "#10b981" : "#0f172a", color: filter === val ? "#fff" : "#64748b" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Refill Requests */}
        <h2 style={{ color: "#f1f5f9", fontSize: "18px", fontWeight: "700", marginBottom: "16px", animation: "fadeUp 0.5s ease 0.16s both" }}>Refill Requests</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "40px" }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", color: "#334155", padding: "40px", fontSize: "16px" }}>No refill requests found.</div>
          )}
          {filtered.map((r, i) => (
            <div key={r.id} className="rx-card" style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", padding: "24px", display: "flex", alignItems: "center", gap: "20px", animation: `fadeUp 0.4s ease ${0.16 + i * 0.06}s both`, boxShadow: "0 2px 12px rgba(0,0,0,0.2)", opacity: r.status === "approved" ? 0.6 : 1 }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: avatarColors[r.avatar] || "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "16px", color: "#fff", flexShrink: 0 }}>
                {r.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#f1f5f9", fontWeight: "700", fontSize: "16px", marginBottom: "4px" }}>{r.patient}</div>
                <div style={{ color: "#10b981", fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>{r.medication}</div>
                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                  <span style={{ color: "#64748b", fontSize: "13px" }}>📅 Requested {r.requestedDate}</span>
                  <span style={{ color: "#64748b", fontSize: "13px" }}>Current refills: {r.currentRefills}</span>
                </div>
              </div>
              {r.status === "pending" ? (
                <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
                  <button onClick={() => handleApprove(r.id)} className="action-btn"
                    style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#10b981", color: "#fff", fontSize: "13px", fontWeight: "600", fontFamily: "'DM Sans',sans-serif" }}>
                    Approve
                  </button>
                  <button onClick={() => handleDeny(r.id)} className="action-btn"
                    style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid #ef4444", background: "transparent", color: "#ef4444", fontSize: "13px", fontWeight: "600", fontFamily: "'DM Sans',sans-serif" }}>
                    Deny
                  </button>
                </div>
              ) : (
                <span style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
                  Approved
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Active Prescriptions */}
        <h2 style={{ color: "#f1f5f9", fontSize: "18px", fontWeight: "700", marginBottom: "16px" }}>Active Prescriptions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
          {activePrescriptions.map((p, i) => (
            <div key={p.id} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: avatarColors[p.avatar] || "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px", color: "#fff" }}>
                  {p.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#f1f5f9", fontWeight: "700", fontSize: "14px" }}>{p.patient}</div>
                  <div style={{ color: "#64748b", fontSize: "12px" }}>Issued {p.issued}</div>
                </div>
              </div>
              <div style={{ color: "#10b981", fontSize: "15px", fontWeight: "600", marginBottom: "6px" }}>{p.medication}</div>
              <div style={{ color: "#64748b", fontSize: "13px", marginBottom: "10px" }}>{p.dosage}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#64748b", fontSize: "12px" }}>Refills left</span>
                <span style={{ color: "#10b981", fontWeight: "700", fontSize: "14px" }}>{p.refills}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
