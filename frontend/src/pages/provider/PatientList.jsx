import { useState, useEffect } from "react";
import { appointmentsAPI } from "../../utils/api";

const defaultAvatarColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899"];

function getAvatarColor(index) {
  return defaultAvatarColors[index % defaultAvatarColors.length];
}

export const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  // Derive patient list from provider's appointments
  useEffect(() => {
    appointmentsAPI.getProviderAppointments({ limit: 200 })
      .then((data) => {
        if (data && Array.isArray(data.appointments)) {
          // Deduplicate patients by patient_id
          const patientMap = new Map();
          data.appointments.forEach((a) => {
            const pid = a.patient_id;
            const name = a.patient_name || "Patient";
            if (!patientMap.has(pid)) {
              const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
              patientMap.set(pid, {
                id: pid,
                name,
                patientId: `ID: ${(pid || "").slice(-4)}`,
                age: a.patient_age || "",
                gender: a.patient_gender || "",
                avatar: initials,
                condition: a.reason || a.notes || "",
                status: "Stable",
                lastVisit: a.appointment_date ? new Date(a.appointment_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
                nextAppointment: "",
                appointments: [a],
              });
            } else {
              patientMap.get(pid).appointments.push(a);
              // Update condition with latest reason
              if (a.reason) patientMap.get(pid).condition = a.reason;
            }
          });

          // Compute next appointment for each patient
          const now = new Date();
          patientMap.forEach((p) => {
            const upcoming = p.appointments
              .filter(a => a.appointment_date && new Date(a.appointment_date) > now && a.status !== "cancelled")
              .sort((x, y) => new Date(x.appointment_date) - new Date(y.appointment_date));
            if (upcoming.length > 0) {
              p.nextAppointment = new Date(upcoming[0].appointment_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            }
            const pastAppts = p.appointments
              .filter(a => a.appointment_date && new Date(a.appointment_date) <= now)
              .sort((x, y) => new Date(y.appointment_date) - new Date(x.appointment_date));
            if (pastAppts.length > 0) {
              p.lastVisit = new Date(pastAppts[0].appointment_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            }
            delete p.appointments;
          });

          setPatients(Array.from(patientMap.values()));
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: patients.length,
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
          gridTemplateColumns: "repeat(1, 1fr)",
          gap: "20px",
          marginBottom: "32px",
          animation: "fadeUp 0.6s ease 0.1s both",
        }}>
          <div style={{
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
              background: "#3b82f622",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}>
              👥
            </div>
            <div>
              <div style={{ color: "#64748b", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>
                Total Patients
              </div>
              <div style={{ color: "#3b82f6", fontSize: "28px", fontWeight: "800", letterSpacing: "-1px" }}>
                {stats.total}
              </div>
            </div>
          </div>
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
            gridTemplateColumns: "2fr 1fr 2fr 1.5fr 1.5fr 0.8fr",
            padding: "16px 24px",
            background: "#060d1a",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}>
            {["Patient", "Age/Gender", "Reason", "Last Visit", "Next Appointment", "Actions"].map(
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
          {loading && (
            <div style={{ textAlign: "center", color: "#64748b", padding: "60px", fontSize: "16px" }}>Loading patients...</div>
          )}
          {!loading && filteredPatients.length === 0 && (
            <div style={{ textAlign: "center", color: "#334155", padding: "60px", fontSize: "16px" }}>No patients found. Patients appear here once they book an appointment with you.</div>
          )}
          {filteredPatients.map((patient, idx) => (
            <div
              key={patient.id}
              className="patient-row"
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 2fr 1.5fr 1.5fr 0.8fr",
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
                  background: getAvatarColor(idx),
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
                {patient.age ? `${patient.age} yrs` : "-"}<br />
                <span style={{ fontSize: "12px", color: "#64748b" }}>{patient.gender === "M" ? "Male" : patient.gender === "F" ? "Female" : patient.gender || "-"}</span>
              </div>

              {/* Reason */}
              <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                {patient.condition || "-"}
              </div>

              {/* Last Visit */}
              <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                {patient.lastVisit || "-"}
              </div>

              {/* Next Appointment */}
              <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                {patient.nextAppointment || "-"}
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
                    background: getAvatarColor(0),
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
                      {selectedPatient.patientId} • {selectedPatient.age ? `${selectedPatient.age} years old` : ""} {selectedPatient.gender ? `• ${selectedPatient.gender === "M" ? "Male" : selectedPatient.gender === "F" ? "Female" : selectedPatient.gender}` : ""}
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

              {/* Reason */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>
                  Reason
                </div>
                <div style={{ color: "#f1f5f9", fontSize: "15px" }}>
                  {selectedPatient.condition || "Not specified"}
                </div>
              </div>

              {/* Visit Info */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "10px" }}>
                  <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "4px" }}>Last Visit</div>
                  <div style={{ color: "#f1f5f9", fontSize: "16px", fontWeight: "800" }}>{selectedPatient.lastVisit || "-"}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "10px" }}>
                  <div style={{ color: "#64748b", fontSize: "11px", marginBottom: "4px" }}>Next Appointment</div>
                  <div style={{ color: "#f1f5f9", fontSize: "16px", fontWeight: "800" }}>{selectedPatient.nextAppointment || "-"}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};