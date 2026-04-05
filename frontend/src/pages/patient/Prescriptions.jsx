import { useState, useEffect } from "react";
import { prescriptionsAPI, notificationsAPI } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

const categoryColors = {
  Cardiovascular: { bg: "rgba(59,130,246,0.12)", text: "#60a5fa", border: "rgba(59,130,246,0.25)" },
  Diabetes: { bg: "rgba(16,185,129,0.12)", text: "#34d399", border: "rgba(16,185,129,0.25)" },
  "Blood Pressure": { bg: "rgba(245,158,11,0.12)", text: "#fbbf24", border: "rgba(245,158,11,0.25)" },
  Antibiotic: { bg: "rgba(239,68,68,0.12)", text: "#f87171", border: "rgba(239,68,68,0.25)" },
  Allergy: { bg: "rgba(139,92,246,0.12)", text: "#a78bfa", border: "rgba(139,92,246,0.25)" },
  General: { bg: "rgba(100,116,139,0.12)", text: "#94a3b8", border: "rgba(100,116,139,0.25)" },
};

export const Prescriptions = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [refillRequested, setRefillRequested] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ medication_name: "", dosage: "", frequency: "", duration: "", notes: "" });
  const [addSaving, setAddSaving] = useState(false);
  const [takenToday, setTakenToday] = useState(() => {
    try {
      const key = `healix_med_taken_${new Date().toISOString().split("T")[0]}`;
      return JSON.parse(localStorage.getItem(key) || "{}");
    } catch { return {}; }
  });

  useEffect(() => { fetchPrescriptions(); }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRefill = async (id) => {
    try {
      await prescriptionsAPI.requestRefill(id);
    } catch { }
    setRefillRequested(p => ({ ...p, [id]: true }));
    showToast("Refill request sent to your doctor!");
  };

  const fetchPrescriptions = () => {
    prescriptionsAPI.getMyPrescriptions()
      .then((data) => {
        if (data && Array.isArray(data.prescriptions)) {
          const mapped = data.prescriptions.map((rx) => ({
            id: rx._id || rx.id,
            name: rx.medication_name || "Medication",
            dosage: rx.dosage || "",
            frequency: rx.frequency || "",
            refillsLeft: (rx.refills_allowed ?? 0) - (rx.refills_used ?? 0),
            quantityLeft: rx.quantity_remaining ?? 0,
            totalQuantity: rx.total_quantity ?? 30,
            doctor: rx.provider_name || "",
            prescribed: rx.created_at ? new Date(rx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
            category: rx.category || "General",
            active: rx.status === "active",
            duration: rx.duration || "",
            source: rx.source || "",
            refillsAllowed: rx.refills_allowed ?? 0,
          }));
          setPrescriptions(mapped);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  const handleAddMedication = async () => {
    if (!addForm.medication_name || !addForm.dosage || !addForm.frequency) {
      showToast("Please fill in medication name, dosage, and frequency.", "error");
      return;
    }
    setAddSaving(true);
    try {
      await prescriptionsAPI.addSelf(addForm);
      showToast("Medication added successfully!");
      setShowAddModal(false);
      setAddForm({ medication_name: "", dosage: "", frequency: "", duration: "", notes: "" });
      setLoading(true);
      fetchPrescriptions();
    } catch (err) {
      showToast(err.message || "Failed to add medication.", "error");
    } finally {
      setAddSaving(false);
    }
  };

  const toggleTaken = (rxId) => {
    const todayKey = `healix_med_taken_${new Date().toISOString().split("T")[0]}`;
    setTakenToday((prev) => {
      const next = { ...prev, [rxId]: !prev[rxId] };
      localStorage.setItem(todayKey, JSON.stringify(next));
      return next;
    });
  };

  // Send medication reminder notifications for active prescriptions
  useEffect(() => {
    if (!user?.id) return;
    const reminderKey = `healix_med_reminder_${user.id}_${new Date().toISOString().split("T")[0]}`;
    if (localStorage.getItem(reminderKey)) return; // already sent today

    const activeMeds = prescriptions.filter((rx) => rx.active);
    if (activeMeds.length === 0) return;

    const names = activeMeds.slice(0, 3).map((rx) => rx.name).join(", ");
    const extra = activeMeds.length > 3 ? ` and ${activeMeds.length - 3} more` : "";
    notificationsAPI.create({
      title: "Medication Reminder",
      message: `Don't forget to take your medications today: ${names}${extra}`,
      type: "prescription",
    }).then(() => {
      localStorage.setItem(reminderKey, "1");
    }).catch(() => {});
  }, [prescriptions, user]);

  const handleDownload = (rx) => {
    const lines = [
      "HEALIX — Prescription",
      "═".repeat(40),
      "",
      `Patient    : ${user?.first_name || ""} ${user?.last_name || ""}`.trim(),
      `Prescribed : ${rx.prescribed}`,
      `Doctor     : ${rx.doctor}`,
      "",
      "─".repeat(40),
      `Medication : ${rx.name}`,
      `Dosage     : ${rx.dosage}`,
      `Frequency  : ${rx.frequency}`,
      rx.duration ? `Duration   : ${rx.duration}` : null,
      rx.refillsAllowed > 0 ? `Refills    : ${rx.refillsLeft} of ${rx.refillsAllowed} remaining` : null,
      "─".repeat(40),
      "",
      `Generated by HEALIX on ${new Date().toLocaleDateString()}`,
    ].filter(Boolean).join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${rx.name}_prescription.txt`; a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${rx.name} prescription.`);
  };

  const filtered = prescriptions.filter(rx => {
    const matchSearch = rx.name.toLowerCase().includes(search.toLowerCase()) || rx.category.toLowerCase().includes(search.toLowerCase()) || rx.doctor.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "active" && rx.active) || (filter === "inactive" && !rx.active) || (filter === "refill" && rx.source !== "self" && rx.refillsAllowed > 0 && rx.refillsLeft === 0 && rx.active);
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
        .rx-btn { transition: all 0.15s ease; cursor: pointer; }
        .rx-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .search-input { background: var(--bg-3); border: 1px solid var(--border-solid); color: var(--text); padding: 11px 16px 11px 42px; border-radius: 10px; font-size: 14px; outline: none; font-family: 'DM Sans', sans-serif; width: 280px; box-sizing: border-box; transition: border-color 0.2s; }
        .search-input:focus { border-color: #3b82f6; }
        .search-input::placeholder { color: var(--border-mid); }
        .filter-btn { padding: 8px 18px; border-radius: 8px; border: none; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.15s ease; font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="page-responsive" style={{ background: "var(--bg)", minHeight: "100vh", padding: "40px 48px", fontFamily: "'DM Sans', sans-serif" }}>

        {/* Toast */}
        {toast && (
          <div style={{ position: "fixed", bottom: "32px", right: "32px", zIndex: 2000, background: toast.type === "error" ? "#ef4444" : "#10b981", color: "#fff", padding: "12px 24px", borderRadius: "10px", fontWeight: "600", fontSize: "14px", animation: "toastIn 0.3s ease", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: "36px", animation: "fadeUp 0.5s ease both" }}>
          <p style={{ color: "#10b981", fontSize: "12px", fontWeight: "600", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 6px 0" }}>Healthcare</p>
          <h1 style={{ color: "var(--text)", fontSize: "32px", fontWeight: "700", margin: 0, fontFamily: "'Playfair Display', serif", letterSpacing: "-0.5px" }}>Prescriptions</h1>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px", animation: "fadeUp 0.5s ease 0.08s both" }}>
          {[
            { label: "Active Medicines", value: prescriptions.filter(r => r.active).length, color: "#3b82f6" },
            { label: "Refills Needed", value: prescriptions.filter(r => r.source !== "self" && r.refillsAllowed > 0 && r.refillsLeft === 0 && r.active).length, color: "#f59e0b" },
            { label: "Total Prescriptions", value: prescriptions.length, color: "#10b981" },
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
            <input type="text" placeholder="Search prescriptions..." className="search-input" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {[["all", "All"], ["active", "Active"], ["inactive", "Inactive"], ["refill", "Needs Refill"]].map(([val, label]) => (
              <button key={val} className="filter-btn" onClick={() => setFilter(val)}
                style={{ background: filter === val ? "#3b82f6" : "var(--bg-3)", color: filter === val ? "#fff" : "var(--text-subtle)", border: filter === val ? "none" : "1px solid var(--border-solid)" }}>
                {label}
              </button>
            ))}
          </div>
          <button className="rx-btn" onClick={() => setShowAddModal(true)}
            style={{ marginLeft: "auto", padding: "9px 20px", borderRadius: "8px", border: "none", background: "#10b981", color: "#fff", fontWeight: "700", fontSize: "13px", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap", letterSpacing: "0.3px" }}>
            + Add My Medication
          </button>
        </div>

        {/* Add Medication Modal */}
        {showAddModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
            <div className="modal-responsive" style={{ background: "var(--bg-3)", border: "1px solid var(--border-solid)", borderRadius: "16px", padding: "32px", width: "460px", maxWidth: "90vw", animation: "fadeUp 0.3s ease" }}>
              <h2 style={{ color: "var(--text)", fontSize: "20px", fontWeight: "700", margin: "0 0 6px 0" }}>Add Your Medication</h2>
              <p style={{ color: "var(--text-subtle)", fontSize: "13px", margin: "0 0 24px 0" }}>Add a medication you're already taking</p>

              {[
                { key: "medication_name", label: "Medication Name", placeholder: "e.g. Metformin", required: true },
                { key: "dosage", label: "Dosage", placeholder: "e.g. 500mg", required: true },
                { key: "frequency", label: "Frequency", placeholder: "e.g. Twice daily", required: true },
                { key: "duration", label: "Duration (optional)", placeholder: "e.g. 3 months" },
                { key: "notes", label: "Notes (optional)", placeholder: "Any additional notes" },
              ].map(({ key, label, placeholder, required }) => (
                <div key={key} style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", color: "var(--text-muted)", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                    {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
                  </label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={addForm[key]}
                    onChange={(e) => setAddForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: "100%", padding: "10px 14px", background: "var(--bg)", border: "1px solid var(--border-solid)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", outline: "none", fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box" }}
                  />
                </div>
              ))}

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button className="rx-btn" onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--border-solid)", background: "transparent", color: "var(--text-muted)", fontWeight: "600", fontSize: "14px", fontFamily: "'DM Sans',sans-serif" }}>
                  Cancel
                </button>
                <button className="rx-btn" onClick={handleAddMedication} disabled={addSaving}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: addSaving ? "var(--border-solid)" : "#10b981", color: addSaving ? "var(--text-subtle)" : "#fff", fontWeight: "700", fontSize: "14px", fontFamily: "'DM Sans',sans-serif" }}>
                  {addSaving ? "Adding..." : "Add Medication"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Prescription Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filtered.length === 0 && !loading && (
            <div style={{ textAlign: "center", color: "var(--border-mid)", padding: "60px", fontSize: "16px" }}>No prescriptions found.</div>
          )}
          {loading && (
            <div style={{ textAlign: "center", color: "var(--text-subtle)", padding: "60px", fontSize: "16px" }}>Loading prescriptions...</div>
          )}
          {filtered.map((rx, i) => {
            const cat = categoryColors[rx.category] || categoryColors.Antibiotic;
            const isSelf = rx.source === "self";
            const taken = !!takenToday[rx.id];
            return (
              <div key={rx.id} className="rx-card" style={{ background: "var(--bg-3)", border: `1px solid ${taken ? "rgba(16,185,129,0.3)" : "var(--border-solid)"}`, borderRadius: "14px", padding: "24px", animation: `fadeUp 0.4s ease ${i * 0.06}s both`, boxShadow: "0 2px 12px rgba(0,0,0,0.2)", opacity: rx.active ? 1 : 0.6 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
                  {/* Left */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <span style={{ color: "var(--text)", fontWeight: "700", fontSize: "18px" }}>{rx.name}</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "14px", fontWeight: "500" }}>{rx.dosage}</span>
                      <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: cat.bg, color: cat.text, border: `1px solid ${cat.border}`, letterSpacing: "0.3px" }}>{rx.category}</span>
                      {isSelf && <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.25)" }}>Self-added</span>}
                      {!rx.active && <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: "rgba(71,85,105,0.2)", color: "var(--text-subtle)", border: "1px solid var(--border-solid)" }}>Inactive</span>}
                      {taken && <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>✓ Taken today</span>}
                    </div>
                    <div style={{ color: "var(--text-subtle)", fontSize: "13px", marginBottom: "16px" }}>
                      {rx.frequency}{isSelf ? ` · Added on ${rx.prescribed}` : ` · Prescribed by ${rx.doctor} on ${rx.prescribed}`}
                    </div>

                    {/* Refills — only for provider-prescribed with refills enabled */}
                    {!isSelf && rx.refillsAllowed > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                        <span style={{ color: "var(--text-subtle)", fontSize: "13px" }}>Refills remaining:</span>
                        <span style={{ color: rx.refillsLeft === 0 ? "#ef4444" : "#10b981", fontWeight: "700", fontSize: "14px" }}>
                          {rx.refillsLeft === 0 ? "None — Refill needed" : rx.refillsLeft}
                        </span>
                      </div>
                    )}

                    {/* Duration if set */}
                    {rx.duration && (
                      <div style={{ color: "var(--text-subtle)", fontSize: "12px", marginTop: "6px" }}>
                        Duration: {rx.duration}
                      </div>
                    )}
                  </div>

                  {/* Right — Action buttons */}
                  {rx.active && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", flexShrink: 0 }}>
                      {/* Taken today toggle */}
                      <button className="rx-btn" onClick={() => toggleTaken(rx.id)}
                        style={{ padding: "9px 18px", borderRadius: "8px", border: "none", background: taken ? "#10b981" : "var(--bg)", color: taken ? "#fff" : "var(--text-muted)", fontWeight: "600", fontSize: "13px", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap", border: taken ? "none" : "1px solid var(--border-solid)" }}>
                        {taken ? "✓ Taken" : "Mark Taken"}
                      </button>

                      {/* Request Refill — only for provider-prescribed with refills enabled and refills left === 0 */}
                      {!isSelf && rx.refillsAllowed > 0 && rx.refillsLeft === 0 && (
                        <button className="rx-btn" onClick={() => handleRefill(rx.id)}
                          disabled={refillRequested[rx.id]}
                          style={{ padding: "9px 18px", borderRadius: "8px", border: "none", background: refillRequested[rx.id] ? "var(--border-solid)" : "#3b82f6", color: refillRequested[rx.id] ? "var(--text-subtle)" : "#fff", fontWeight: "600", fontSize: "13px", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" }}>
                          {refillRequested[rx.id] ? "✓ Requested" : "Request Refill"}
                        </button>
                      )}

                      {/* Download — only for provider-prescribed */}
                      {!isSelf && (
                        <button className="rx-btn" onClick={() => handleDownload(rx)}
                          style={{ padding: "9px 18px", borderRadius: "8px", border: "1px solid var(--border-solid)", background: "transparent", color: "var(--text-muted)", fontWeight: "600", fontSize: "13px", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" }}>
                          ↓ Download
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
