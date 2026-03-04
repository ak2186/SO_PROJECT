import { useState, useEffect } from "react";
import { appointmentsAPI } from "../../utils/api";

const mockPatients = [
  {
    id: 1,
    name: "Robert Johnson",
    patientId: "ID: 0001",
    age: 58,
    gender: "M",
    avatar: "RJ",
    condition: "Hypertension, Type 2 Diabetes",
    status: "Stable",
    heartRate: "72 BPM",
    bloodPressure: "128/82",
    glucose: "142 mg/dL",
    lastVisit: "Oct 25, 2025",
    nextAppointment: "Nov 8, 2025",
    progress: { current: 78, previous: 65, trend: "up" },
  },
  {
    id: 2,
    name: "James Wilson",
    patientId: "ID: 0002",
    age: 62,
    gender: "M",
    avatar: "JW",
    condition: "Heart Disease",
    status: "Stable",
    heartRate: "88 BPM",
    bloodPressure: "118/78",
    glucose: "95 mg/dL",
    lastVisit: "Oct 20, 2025",
    nextAppointment: "Nov 15, 2025",
    progress: { current: 82, previous: 79, trend: "up" },
  },
  {
    id: 3,
    name: "Sarah Mitchell",
    patientId: "ID: 0003",
    age: 45,
    gender: "F",
    avatar: "SM",
    condition: "Asthma",
    status: "Monitor",
    heartRate: "76 BPM",
    bloodPressure: "122/80",
    glucose: "88 mg/dL",
    lastVisit: "Oct 18, 2025",
    nextAppointment: "Nov 12, 2025",
    progress: { current: 71, previous: 75, trend: "down" },
  },
  {
    id: 4,
    name: "Emma Davis",
    patientId: "ID: 0004",
    age: 39,
    gender: "F",
    avatar: "ED",
    condition: "Migraine",
    status: "Stable",
    heartRate: "68 BPM",
    bloodPressure: "115/75",
    glucose: "92 mg/dL",
    lastVisit: "Oct 22, 2025",
    nextAppointment: "Nov 20, 2025",
    progress: { current: 85, previous: 82, trend: "up" },
  },
];

const defaultAvatarColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899"];

function getAvatarColor(avatar, index) {
  const predefined = { RJ: "#3b82f6", JW: "#10b981", SM: "#f59e0b", ED: "#8b5cf6" };
  return predefined[avatar] || defaultAvatarColors[index % defaultAvatarColors.length];
}

export const PatientList = () => {
  const [patients, setPatients] = useState(mockPatients);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Derive patient list from provider's appointments
  useEffect(() => {
    appointmentsAPI.getProviderAppointments({ limit: 100 })
      .then((data) => {
        if (data && Array.isArray(data.appointments) && data.appointments.length > 0) {
          // Deduplicate patients by name
          const patientMap = new Map();
          data.appointments.forEach((a) => {
            const name = a.patient_name || a.patient || "Patient";
            if (!patientMap.has(name)) {
              const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
              patientMap.set(name, {
                id: a.patient_id || a.id || a._id,
                name,
                patientId: `ID: ${(a.patient_id || a._id || "").slice(-4)}`,
                age: a.patient_age || "",
                gender: a.patient_gender || "",
                avatar: initials,
                condition: a.reason || a.notes || "",
                status: "Stable",
                heartRate: "-",
                bloodPressure: "-",
                glucose: "-",
                lastVisit: a.date ? new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
                nextAppointment: "",
                progress: { current: 75, previous: 70, trend: "up" },
              });
            }
          });
          if (patientMap.size > 0) {
            setPatients(Array.from(patientMap.values()));
          }
        }
      })
      .catch(() => { }); // fallback to mock
  }, []);

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: patients.length,
    stable: patients.filter((p) => p.status === "Stable").length,
    needsAttention: patients.filter((p) => p.status === "Monitor").length,
    activeAlerts: 0,
  };

  const ProgressGraph = ({ current, previous, trend }) => {
    const months = ["Last Month", "This Month"];
    const values = [previous, current];
    const maxValue = Math.max(...values) + 10;

    return (
      <div style={{ padding: "20px", background: "rgba(0,0,0,0.2)", borderRadius: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" }}>
            Health Progress
          </span>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 12px",
            borderRadius: "20px",
            background: trend === "up" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
            border: trend === "up" ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(239,68,68,0.3)",
          }}>
            <span style={{ fontSize: "12px" }}>{trend === "up" ? "📈" : "📉"}</span>
            <span style={{
              color: trend === "up" ? "#10b981" : "#ef4444",
              fontSize: "11px",
              fontWeight: "700",
            }}>
              {trend === "up" ? "Improving" : "Declining"}
            </span>
          </div>
        </div>

        <div style={{ height: "120px", display: "flex", alignItems: "flex-end", gap: "40px", padding: "10px 0" }}>
          {values.map((val, i) => {
            const heightPct = (val / maxValue) * 100;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ color: "#f1f5f9", fontSize: "18px", fontWeight: "800", marginBottom: "6px" }}>
                    {val}%
                  </span>
                  <div style={{
                    width: "80%",
                    height: `${heightPct}px`,
                    background: i === 0 ? "linear-gradient(to top, #64748b, #94a3b8)" : "linear-gradient(to top, #10b981, #34d399)",
                    borderRadius: "8px 8px 0 0",
                    minHeight: "40px",
                    boxShadow: i === 1 ? "0 0 20px rgba(16,185,129,0.4)" : "none",
                  }} />
                </div>
                <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "600", textAlign: "center" }}>
                  {months[i]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .patient-row {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .patient-row:hover {
          background: #1e293b;
        }
        .action-btn {
          transition: all 0.15s ease;
          cursor: pointer;
        }
        .action-btn:hover {
          opacity: 0.8;
          transform: translateY(-1px);
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <div style={{
        background: "#060d1a",
        minHeight: "100vh",
        padding: "40px 48px",
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* Header */}
        <div style={{ marginBottom: "32px", animation: "fadeUp 0.6s ease both" }}>
          <h1 style={{
            color: "#f1f5f9",
            fontSize: "32px",
            fontWeight: "800",
            margin: "0 0 6px 0",
            letterSpacing: "-1px",
          }}>
            Patient List
          </h1>
          <p style={{ color: "#64748b", fontSize: "15px", margin: 0 }}>
            Manage and monitor your patients
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginBottom: "32px",
          animation: "fadeUp 0.6s ease 0.1s both",
        }}>
          {[
            { label: "Total Patients", value: stats.total, icon: "👥", color: "#3b82f6" },
            { label: "Stable", value: stats.stable, icon: "✓", color: "#10b981" },
            { label: "Needs Attention", value: stats.needsAttention, icon: "⚠️", color: "#f59e0b" },
            { label: "Active Alerts", value: stats.activeAlerts, icon: "🔔", color: "#ef4444" },
          ].map((stat, i) => (
            <div key={i} style={{
              background: "#0f172a",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: `${stat.color}22`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ color: "#64748b", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>
                  {stat.label}
                </div>
                <div style={{ color: stat.color, fontSize: "28px", fontWeight: "800", letterSpacing: "-1px" }}>
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          animation: "fadeUp 0.6s ease 0.15s both",
        }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "16px",
            }}>
              🔍
            </span>
            <input
              type="text"
              placeholder="Search patients by name, condition, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px 12px 42px",
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                color: "#f1f5f9",
                fontSize: "14px",
                outline: "none",
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
          </div>
          <button className="action-btn" style={{
            padding: "12px 24px",
            background: "#10b981",
            border: "none",
            borderRadius: "12px",
            color: "#fff",
            fontSize: "14px",
            fontWeight: "700",
            fontFamily: "'DM Sans', sans-serif",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            👤 Add New Patient
          </button>
        </div>

        {/* Patient Table */}
        <div style={{
          background: "#0f172a",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          overflow: "hidden",
          animation: "fadeUp 0.6s ease 0.2s both",
        }}>
          {/* Table Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 2fr 1fr 1.5fr 1.5fr 1.5fr 0.8fr",
            padding: "16px 24px",
            background: "#060d1a",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}>
            {["Patient", "Age/Gender", "Condition", "Status", "Key Vitals", "Last Visit", "Next Appointment", "Actions"].map(
              (header) => (
                <div key={header} style={{
                  color: "#64748b",
                  fontSize: "11px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}>
                  {header}
                </div>
              )
            )}
          </div>

          {/* Table Rows */}
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="patient-row"
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 2fr 1fr 1.5fr 1.5fr 1.5fr 0.8fr",
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                alignItems: "center",
              }}
            >
              {/* Patient */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: getAvatarColor(patient.avatar, 0),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#fff",
                }}>
                  {patient.avatar}
                </div>
                <div>
                  <div style={{ color: "#f1f5f9", fontSize: "14px", fontWeight: "700" }}>
                    {patient.name}
                  </div>
                  <div style={{ color: "#64748b", fontSize: "12px" }}>
                    {patient.patientId}
                  </div>
                </div>
              </div>

              {/* Age/Gender */}
              <div style={{ color: "#94a3b8", fontSize: "14px" }}>
                {patient.age} yrs<br />
                <span style={{ fontSize: "12px", color: "#64748b" }}>{patient.gender === "M" ? "Male" : "Female"}</span>
              </div>

              {/* Condition */}
              <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                {patient.condition}
              </div>

              {/* Status */}
              <div>
                <span style={{
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: "700",
                  background: patient.status === "Stable" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                  color: patient.status === "Stable" ? "#10b981" : "#f59e0b",
                  border: patient.status === "Stable" ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(245,158,11,0.3)",
                }}>
                  {patient.status}
                </span>
              </div>

              {/* Key Vitals */}
              <div style={{ fontSize: "12px" }}>
                <div style={{ color: "#94a3b8", marginBottom: "2px" }}>
                  ❤️ {patient.heartRate}
                </div>
                <div style={{ color: "#94a3b8", marginBottom: "2px" }}>
                  🩸 {patient.bloodPressure}
                </div>
                <div style={{ color: "#94a3b8" }}>
                  🍬 {patient.glucose}
                </div>
              </div>

              {/* Last Visit */}
              <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                {patient.lastVisit}
              </div>

              {/* Next Appointment */}
              <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                {patient.nextAppointment}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setSelectedPatient(patient)}
                  className="action-btn"
                  style={{
                    padding: "6px 14px",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#94a3b8",
                    fontSize: "12px",
                    fontWeight: "600",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  👁️ View
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Patient Detail Modal */}
        {selectedPatient && (
          <div className="modal-overlay" onClick={() => setSelectedPatient(null)}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "20px",
                padding: "32px",
                width: "600px",
                maxHeight: "80vh",
                overflow: "auto",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "16px",
                    background: getAvatarColor(selectedPatient.avatar, 0),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#fff",
                  }}>
                    {selectedPatient.avatar}
                  </div>
                  <div>
                    <h2 style={{ color: "#f1f5f9", fontSize: "24px", fontWeight: "800", margin: "0 0 4px 0" }}>
                      {selectedPatient.name}
                    </h2>
                    <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
                      {selectedPatient.patientId} • {selectedPatient.age} years old • {selectedPatient.gender === "M" ? "Male" : "Female"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#64748b",
                    fontSize: "24px",
                    cursor: "pointer",
                    padding: "0",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Condition */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>
                  Condition
                </div>
                <div style={{ color: "#f1f5f9", fontSize: "15px" }}>
                  {selectedPatient.condition}
                </div>
              </div>

              {/* Progress Graph */}
              <ProgressGraph
                current={selectedPatient.progress.current}
                previous={selectedPatient.progress.previous}
                trend={selectedPatient.progress.trend}
              />

              {/* Vitals */}
              <div style={{ marginTop: "24px" }}>
                <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", marginBottom: "12px" }}>
                  Current Vitals
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "10px" }}>
                    <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "4px" }}>Heart Rate</div>
                    <div style={{ color: "#f1f5f9", fontSize: "16px", fontWeight: "800" }}>{selectedPatient.heartRate}</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "10px" }}>
                    <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "4px" }}>Blood Pressure</div>
                    <div style={{ color: "#f1f5f9", fontSize: "16px", fontWeight: "800" }}>{selectedPatient.bloodPressure}</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "10px" }}>
                    <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "4px" }}>Glucose</div>
                    <div style={{ color: "#f1f5f9", fontSize: "16px", fontWeight: "800" }}>{selectedPatient.glucose}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};