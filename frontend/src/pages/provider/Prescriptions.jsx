import { useState, useEffect } from "react";
import { prescriptionsAPI } from "../../utils/api";

const defaultAvatarColors = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899"];

export const Prescriptions = () => {
  const [requests, setRequests] = useState([]);
  const [activePrescriptions, setActivePrescriptions] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("pending");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch provider prescriptions from backend
  useEffect(() => {
    prescriptionsAPI.getProviderPrescriptions({ limit: 100 })
      .then((data) => {
        if (data && Array.isArray(data.prescriptions)) {
          // Separate prescriptions with pending refill requests vs active prescriptions
          const refillReqs = [];
          const active = [];

          data.prescriptions.forEach((rx, idx) => {
            const avatar = (rx.patient_name || "PT").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            const color = defaultAvatarColors[idx % defaultAvatarColors.length];

            // Extract pending refill requests
            if (rx.refill_requests && rx.refill_requests.length > 0) {
              rx.refill_requests.forEach((rr) => {
                refillReqs.push({
                  id: rr.id,
                  prescriptionId: rx._id || rx.id,
                  patient: rx.patient_name || "Patient",
                  medication: `${rx.medication_name || "Medication"} ${rx.dosage || ""}`.trim(),
                  currentRefills: (rx.refills_allowed ?? 0) - (rx.refills_used ?? 0),
                  requestedDate: rr.requested_at ? new Date(rr.requested_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
                  status: rr.status || "pending",
                  avatar,
                  _color: color,
                });
              });
            }

            // Add to active prescriptions list
            if (rx.status === "active") {
              active.push({
                id: rx._id || rx.id,
                patient: rx.patient_name || "Patient",
                medication: `${rx.medication_name || "Medication"} ${rx.dosage || ""}`.trim(),
                dosage: rx.frequency || "",
                refills: (rx.refills_allowed ?? 0) - (rx.refills_used ?? 0),
                issued: rx.created_at ? new Date(rx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
                avatar,
                _color: color,
              });
            }
          });

          setRequests(refillReqs);
          setActivePrescriptions(active);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async (r) => {
    try {
      await prescriptionsAPI.handleRefill(r.prescriptionId, r.id, { action: "approved" });
      setRequests(prev => prev.map(req => req.id === r.id ? { ...req, status: "approved" } : req));
      showToast("Refill request approved!");
    } catch {
      showToast("Failed to approve refill.");
    }
  };

  const handleDeny = async (r) => {
    try {
      await prescriptionsAPI.handleRefill(r.prescriptionId, r.id, { action: "denied" });
      setRequests(prev => prev.filter(req => req.id !== r.id));
      showToast("Refill request denied.");
    } catch {
      showToast("Failed to deny refill.");
    }
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
          {filtered.length === 0 && !loading && (
            <div style={{ textAlign: "center", color: "#334155", padding: "40px", fontSize: "16px" }}>No refill requests found.</div>
          )}
          {loading && (
            <div style={{ textAlign: "center", color: "#64748b", padding: "40px", fontSize: "16px" }}>Loading...</div>
          )}
          {filtered.map((r, i) => (
            <div key={r.id} className="rx-card" style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", padding: "24px", display: "flex", alignItems: "center", gap: "20px", animation: `fadeUp 0.4s ease ${0.16 + i * 0.06}s both`, boxShadow: "0 2px 12px rgba(0,0,0,0.2)", opacity: r.status === "approved" ? 0.6 : 1 }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: r._color || "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "16px", color: "#fff", flexShrink: 0 }}>
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
                  <button onClick={() => handleApprove(r)} className="action-btn"
                    style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#10b981", color: "#fff", fontSize: "13px", fontWeight: "600", fontFamily: "'DM Sans',sans-serif" }}>
                    Approve
                  </button>
                  <button onClick={() => handleDeny(r)} className="action-btn"
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
          {activePrescriptions.length === 0 && !loading && (
            <div style={{ textAlign: "center", color: "#334155", padding: "40px", fontSize: "16px" }}>No active prescriptions.</div>
          )}
          {activePrescriptions.map((p, i) => (
            <div key={p.id} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "14px", padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: p._color || "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px", color: "#fff" }}>
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
