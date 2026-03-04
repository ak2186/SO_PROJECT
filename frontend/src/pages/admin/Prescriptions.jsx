import { useState, useEffect } from "react";
import { prescriptionsAPI } from "../../utils/api";

const allPrescriptions = [
  { id: 1, patient: "Sarah Johnson", provider: "Dr. Mitchell", medication: "Atorvastatin 20mg", status: "active", issued: "Jan 15, 2026", refills: 3 },
  { id: 2, patient: "Michael Chen", provider: "Dr. Patel", medication: "Metformin 500mg", status: "active", issued: "Dec 20, 2025", refills: 5 },
  { id: 3, patient: "Emma Davis", provider: "Dr. Horowitz", medication: "Cetirizine 10mg", status: "active", issued: "Jan 28, 2026", refills: 2 },
  { id: 4, patient: "Robert Williams", provider: "Dr. Mitchell", medication: "Lisinopril 10mg", status: "expired", issued: "Nov 10, 2025", refills: 0 },
  { id: 5, patient: "Lisa Anderson", provider: "Dr. Patel", medication: "Levothyroxine 50mcg", status: "active", issued: "Jan 10, 2026", refills: 6 },
  { id: 6, patient: "David Martinez", provider: "Dr. Patel", medication: "Amoxicillin 250mg", status: "completed", issued: "Oct 5, 2025", refills: 0 },
];

export const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState(allPrescriptions);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // Fetch from backend
  useEffect(() => {
    prescriptionsAPI.getProviderPrescriptions()
      .then((data) => {
        if (data && Array.isArray(data.prescriptions) && data.prescriptions.length > 0) {
          const mapped = data.prescriptions.map((rx) => ({
            id: rx.id || rx._id,
            patient: rx.patient_name || rx.patient || "Patient",
            provider: rx.provider_name || rx.doctor || "Provider",
            medication: `${rx.medication_name || rx.name || "Medication"} ${rx.dosage || ""}`.trim(),
            status: rx.status || "active",
            issued: rx.prescribed_date ? new Date(rx.prescribed_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
            refills: rx.refills_remaining ?? rx.refills ?? 0,
          }));
          if (mapped.length > 0) setPrescriptions(mapped);
        }
      })
      .catch(() => { }); // fallback to mock data
  }, []);

  const filtered = prescriptions.filter(rx => {
    const matchSearch = rx.patient.toLowerCase().includes(search.toLowerCase()) || rx.medication.toLowerCase().includes(search.toLowerCase()) || rx.provider.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || rx.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: prescriptions.length,
    active: prescriptions.filter(r => r.status === "active").length,
    expired: prescriptions.filter(r => r.status === "expired").length,
    completed: prescriptions.filter(r => r.status === "completed").length,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
        .rx-row { transition: background 0.15s ease; }
        .rx-row:hover { background: #0f172a; }
        .search-input { background: #0f172a; border: 1px solid #1e293b; color: #f1f5f9; padding: 11px 16px 11px 42px; border-radius: 10px; font-size: 14px; outline: none; font-family: 'DM Sans', sans-serif; width: 280px; box-sizing: border-box; transition: border-color 0.2s; }
        .search-input:focus { border-color: #8b5cf6; }
        .search-input::placeholder { color: #334155; }
      `}</style>

      <div style={{ background: "#060d1a", minHeight: "100vh", padding: "40px 48px", fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header */}
        <div style={{ marginBottom: "36px", animation: "fadeUp 0.5s ease both" }}>
          <p style={{ color: "#8b5cf6", fontSize: "12px", fontWeight: "600", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 6px 0" }}>Admin Portal</p>
          <h1 style={{ color: "#f1f5f9", fontSize: "32px", fontWeight: "700", margin: 0, fontFamily: "'Playfair Display', serif", letterSpacing: "-0.5px" }}>All Prescriptions</h1>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px", animation: "fadeUp 0.5s ease 0.08s both" }}>
          {[
            { label: "Total", value: stats.total, color: "#8b5cf6" },
            { label: "Active", value: stats.active, color: "#10b981" },
            { label: "Expired", value: stats.expired, color: "#f59e0b" },
            { label: "Completed", value: stats.completed, color: "#64748b" },
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
            <input type="text" placeholder="Search patients, medications, providers..." className="search-input" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {[["all", "All"], ["active", "Active"], ["expired", "Expired"], ["completed", "Completed"]].map(([val, label]) => (
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
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.4fr 1fr 0.8fr 0.6fr 0.7fr", padding: "16px 24px", background: "#060d1a", borderBottom: "1px solid #1e293b" }}>
            {["Patient", "Medication", "Provider", "Issued", "Refills", "Status"].map(h => (
              <div key={h} style={{ color: "#64748b", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", color: "#334155", padding: "60px", fontSize: "16px" }}>No prescriptions found.</div>
          )}
          {filtered.map(rx => (
            <div key={rx.id} className="rx-row" style={{ display: "grid", gridTemplateColumns: "1.2fr 1.4fr 1fr 0.8fr 0.6fr 0.7fr", padding: "18px 24px", borderBottom: "1px solid #1e293b" }}>
              <div style={{ color: "#f1f5f9", fontSize: "14px", fontWeight: "600" }}>{rx.patient}</div>
              <div style={{ color: "#8b5cf6", fontSize: "14px", fontWeight: "600" }}>{rx.medication}</div>
              <div style={{ color: "#64748b", fontSize: "14px" }}>{rx.provider}</div>
              <div style={{ color: "#64748b", fontSize: "14px" }}>{rx.issued}</div>
              <div style={{ color: rx.refills === 0 ? "#f59e0b" : "#10b981", fontSize: "14px", fontWeight: "700" }}>{rx.refills}</div>
              <div>
                {rx.status === "active" && (
                  <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
                    Active
                  </span>
                )}
                {rx.status === "expired" && (
                  <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
                    Expired
                  </span>
                )}
                {rx.status === "completed" && (
                  <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: "rgba(100,116,139,0.12)", color: "#64748b", border: "1px solid rgba(100,116,139,0.3)" }}>
                    Completed
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
