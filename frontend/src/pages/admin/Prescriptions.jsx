import { useState, useEffect } from "react";
import { adminAPI } from "../../utils/api";
import { useTranslation } from "react-i18next";

export const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const { t } = useTranslation();

  useEffect(() => {
    adminAPI.getAllPrescriptions({ limit: 200 })
      .then((data) => {
        const list = Array.isArray(data) ? data : data.prescriptions || [];
        const mapped = list.map((rx) => ({
          id: rx._id || rx.id,
          patient: rx.patient_name || "Patient",
          provider: rx.provider_name || "Provider",
          medication: `${rx.medication_name || "Medication"} ${rx.dosage || ""}`.trim(),
          status: rx.status || "active",
          issued: rx.created_at ? new Date(rx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
          refills: rx.refills_allowed != null ? (rx.refills_allowed - (rx.refills_used || 0)) : 0,
        }));
        setPrescriptions(mapped);
      })
      .catch(() => setPrescriptions([]))
      .finally(() => setLoading(false));
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
        .rx-row:hover { background: var(--bg-3); }
        .search-input { background: var(--bg-3); border: 1px solid var(--border-solid); color: var(--text); padding: 11px 16px 11px 42px; border-radius: 10px; font-size: 14px; outline: none; font-family: 'DM Sans', sans-serif; width: 280px; box-sizing: border-box; transition: border-color 0.2s; }
        .search-input:focus { border-color: #8b5cf6; }
        .search-input::placeholder { color: var(--border-mid); }
      `}</style>

      <div className="page-responsive" style={{ background: "var(--bg)", minHeight: "100vh", padding: "40px 48px", fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header */}
        <div style={{ marginBottom: "36px", animation: "fadeUp 0.5s ease both" }}>
          <p style={{ color: "#8b5cf6", fontSize: "12px", fontWeight: "600", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 6px 0" }}>{t("adminPortal")}</p>
          <h1 style={{ color: "var(--text)", fontSize: "32px", fontWeight: "700", margin: 0, fontFamily: "'Playfair Display', serif", letterSpacing: "-0.5px" }}>{t("allPrescriptions")}</h1>
        </div>

        {/* Stats */}
        <div className="stats-responsive" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px", animation: "fadeUp 0.5s ease 0.08s both" }}>
          {[
            { label: t("total"), value: stats.total, color: "#8b5cf6" },
            { label: t("activeStatus"), value: stats.active, color: "#10b981" },
            { label: t("expired"), value: stats.expired, color: "#f59e0b" },
            { label: t("completed"), value: stats.completed, color: "#64748b" },
          ].map((s, i) => (
            <div key={i} style={{ background: "var(--bg-3)", border: "1px solid var(--border-solid)", borderRadius: "14px", padding: "20px 24px" }}>
              <div style={{ color: s.color, fontSize: "28px", fontWeight: "700", marginBottom: "4px" }}>{s.value}</div>
              <div style={{ color: "var(--text-subtle)", fontSize: "13px", fontWeight: "500" }}>{s.label}</div>
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
            {[["all", t("all")], ["active", t("activeStatus")], ["expired", t("expired")], ["completed", t("completed")]].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                style={{ padding: "8px 18px", borderRadius: "8px", border: filter === val ? "none" : "1px solid var(--border-solid)", fontWeight: "600", fontSize: "13px", cursor: "pointer", transition: "all 0.15s ease", fontFamily: "'DM Sans',sans-serif", background: filter === val ? "#8b5cf6" : "var(--bg-3)", color: filter === val ? "#fff" : "var(--text-subtle)" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: "var(--bg-3)", border: "1px solid var(--border-solid)", borderRadius: "14px", overflow: "hidden", animation: "fadeUp 0.5s ease 0.16s both" }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.4fr 1fr 0.8fr 0.6fr 0.7fr", padding: "16px 24px", background: "var(--bg)", borderBottom: "1px solid var(--border-solid)" }}>
            {[t("patient"), t("medication"), t("provider"), t("issued"), t("refills"), t("status")].map(h => (
              <div key={h} style={{ color: "var(--text-subtle)", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {loading && (
            <div style={{ textAlign: "center", color: "var(--text-subtle)", padding: "60px", fontSize: "15px" }}>{t("loadingPrescriptions")}</div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--border-mid)", padding: "60px", fontSize: "16px" }}>{t("noPrescriptionsFound")}</div>
          )}
          {filtered.map(rx => (
            <div key={rx.id} className="rx-row" style={{ display: "grid", gridTemplateColumns: "1.2fr 1.4fr 1fr 0.8fr 0.6fr 0.7fr", padding: "18px 24px", borderBottom: "1px solid var(--border-solid)" }}>
              <div style={{ color: "var(--text)", fontSize: "14px", fontWeight: "600" }}>{rx.patient}</div>
              <div style={{ color: "#8b5cf6", fontSize: "14px", fontWeight: "600" }}>{rx.medication}</div>
              <div style={{ color: "var(--text-subtle)", fontSize: "14px" }}>{rx.provider}</div>
              <div style={{ color: "var(--text-subtle)", fontSize: "14px" }}>{rx.issued}</div>
              <div style={{ color: rx.refills === 0 ? "#f59e0b" : "#10b981", fontSize: "14px", fontWeight: "700" }}>{rx.refills}</div>
              <div>
                {rx.status === "active" && (
                  <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
                    {t("activeStatus")}
                  </span>
                )}
                {rx.status === "expired" && (
                  <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
                    {t("expired")}
                  </span>
                )}
                {rx.status === "completed" && (
                  <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: "rgba(100,116,139,0.12)", color: "#64748b", border: "1px solid rgba(100,116,139,0.3)" }}>
                    {t("completed")}
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
