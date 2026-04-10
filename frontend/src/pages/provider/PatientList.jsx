import { useState, useEffect } from "react";
import { permissionsAPI, biomarkersAPI } from "../../utils/api";
import { HealthReportModal } from "../../components/HealthReportModal";
import { useTranslation } from "react-i18next";

const defaultAvatarColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899"];

function getAvatarColor(index) {
  return defaultAvatarColors[index % defaultAvatarColors.length];
}

export const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [biomarkerData, setBiomarkerData] = useState(null);
  const [biomarkerLoading, setBiomarkerLoading] = useState(false);
  const [showReport, setShowReport] = useState(null);
  const { t } = useTranslation();

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setBiomarkerData(null);
    setBiomarkerLoading(true);
    biomarkersAPI.getPatientData(patient.id)
      .then((data) => setBiomarkerData(data))
      .catch(() => setBiomarkerData(null))
      .finally(() => setBiomarkerLoading(false));
  };

  useEffect(() => {
    permissionsAPI.getProviderPatients()
      .then((data) => {
        if (data && Array.isArray(data.patients)) {
          const fmtDate = (iso) => {
            if (!iso) return "";
            const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
            return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          };
          const mapped = data.patients.map((u, idx) => {
            const name = `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email;
            const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
            return {
              id: u._id,
              name,
              patientId: `ID: ${(u._id || "").slice(-4)}`,
              age: u.age || "",
              gender: u.gender || "",
              avatar: initials,
              condition: u.health_conditions || "",
              status: "Active",
              lastVisit: fmtDate(u.last_visit),
              nextAppointment: fmtDate(u.next_appointment),
            };
          });
          setPatients(mapped);
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
          background: var(--border-solid);
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

      <div className="page-responsive" style={{
        background: "var(--bg)",
        minHeight: "100vh",
        padding: "40px 48px",
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* Header */}
        <div style={{ marginBottom: "32px", animation: "fadeUp 0.6s ease both" }}>
          <h1 style={{
            color: "var(--text)",
            fontSize: "32px",
            fontWeight: "800",
            margin: "0 0 6px 0",
            letterSpacing: "-1px",
          }}>
            {t("patientList")}
          </h1>
          <p style={{ color: "var(--text-subtle)", fontSize: "15px", margin: 0 }}>
            {t("patientListDesc")}
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
            background: "var(--bg-3)",
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
              <div style={{ color: "var(--text-subtle)", fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>
                {t("totalPatients")}
              </div>
              <div style={{ color: "#3b82f6", fontSize: "28px", fontWeight: "800", letterSpacing: "-1px" }}>
                {stats.total}
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{
          marginBottom: "24px",
          animation: "fadeUp 0.6s ease 0.15s both",
        }}>
          <div style={{ position: "relative" }}>
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
                background: "var(--bg-3)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                color: "var(--text)",
                fontSize: "14px",
                outline: "none",
                fontFamily: "'DM Sans', sans-serif",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Patient Table */}
        <div style={{
          background: "var(--bg-3)",
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
            background: "var(--bg)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}>
            {[t("patient"), t("ageGender"), t("reason"), t("lastVisit"), t("nextAppointment"), t("actions")].map(
              (header) => (
                <div key={header} style={{
                  color: "var(--text-subtle)",
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
            <div style={{ textAlign: "center", color: "var(--text-subtle)", padding: "60px", fontSize: "16px" }}>{t("loadingPatients")}</div>
          )}
          {!loading && filteredPatients.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--border-mid)", padding: "60px", fontSize: "16px" }}>
              {t("noPatientsYet")}
            </div>
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
                  <div style={{ color: "var(--text)", fontSize: "14px", fontWeight: "700" }}>
                    {patient.name}
                  </div>
                  <div style={{ color: "var(--text-subtle)", fontSize: "12px" }}>
                    {patient.patientId}
                  </div>
                </div>
              </div>

              {/* Age/Gender */}
              <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                {patient.age ? `${patient.age} yrs` : "-"}<br />
                <span style={{ fontSize: "12px", color: "var(--text-subtle)" }}>{patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : "-"}</span>
              </div>

              {/* Reason */}
              <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                {patient.condition || "-"}
              </div>

              {/* Last Visit */}
              <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                {patient.lastVisit || "-"}
              </div>

              {/* Next Appointment */}
              <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                {patient.nextAppointment || "-"}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleViewPatient(patient)}
                  className="action-btn"
                  style={{
                    padding: "6px 14px",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    fontWeight: "600",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  👁️ {t("view")}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Patient Detail Modal */}
        {selectedPatient && (
          <div className="modal-overlay" onClick={() => setSelectedPatient(null)}>
            <div
              className="modal-responsive"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--bg-3)",
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
                    <h2 style={{ color: "var(--text)", fontSize: "24px", fontWeight: "800", margin: "0 0 4px 0" }}>
                      {selectedPatient.name}
                    </h2>
                    <p style={{ color: "var(--text-subtle)", fontSize: "14px", margin: 0 }}>
                      {selectedPatient.patientId} • {selectedPatient.age ? `${selectedPatient.age} t("yearsOld")` : ""} {selectedPatient.gender ? `• ${selectedPatient.gender === "M" ? "Male" : selectedPatient.gender === "F" ? "Female" : selectedPatient.gender}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-subtle)",
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
                <div style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>
                  {t("reason")}
                </div>
                <div style={{ color: "var(--text)", fontSize: "15px" }}>
                  {selectedPatient.condition || t("notSpecified")}
                </div>
              </div>

              {/* Visit Info */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "10px" }}>
                  <div style={{ color: "var(--text-subtle)", fontSize: "11px", marginBottom: "4px" }}>{t("lastVisit")}</div>
                  <div style={{ color: "var(--text)", fontSize: "16px", fontWeight: "800" }}>{selectedPatient.lastVisit || "-"}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "10px" }}>
                  <div style={{ color: "var(--text-subtle)", fontSize: "11px", marginBottom: "4px" }}>{t("nextAppointment")}</div>
                  <div style={{ color: "var(--text)", fontSize: "16px", fontWeight: "800" }}>{selectedPatient.nextAppointment || "-"}</div>
                </div>
              </div>

              {/* Biomarker Summary */}
              <div style={{ marginTop: "24px" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", marginBottom: "12px" }}>
                  {t("healthDataSummary")}
                </div>
                {biomarkerLoading && (
                  <div style={{ color: "var(--text-subtle)", fontSize: "14px", textAlign: "center", padding: "20px" }}>
                    {t("loadingHealthData")}
                  </div>
                )}
                {!biomarkerLoading && !biomarkerData && (
                  <div style={{ color: "var(--text-subtle)", fontSize: "14px", textAlign: "center", padding: "20px" }}>
                    {t("noHealthData")}
                  </div>
                )}
                {!biomarkerLoading && biomarkerData && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                    {[
                      { key: "heart_rate", label: t("heartRate"), unit: "bpm", icon: "❤️", color: "#ef4444" },
                      { key: "spo2", label: "SpO₂", unit: "%", icon: "🫁", color: "#3b82f6" },
                      { key: "steps", label: t("steps"), unit: "steps", icon: "👟", color: "#10b981" },
                      { key: "calories", label: t("calories"), unit: "kcal", icon: "🔥", color: "#f59e0b" },
                      { key: "sleep_hours", label: t("sleep"), unit: "hrs", icon: "🌙", color: "#8b5cf6" },
                    ].map(({ key, label, unit, icon, color }) => {
                      const reading = biomarkerData.current_readings?.[key];
                      return (
                        <div key={key} style={{
                          background: "var(--bg-2)",
                          borderRadius: "12px",
                          padding: "14px",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}>
                          <div style={{ fontSize: "20px" }}>{icon}</div>
                          <div>
                            <div style={{ color: "var(--text-subtle)", fontSize: "11px", fontWeight: "600", marginBottom: "2px" }}>
                              {label}
                            </div>
                            <div style={{ color: reading ? color : "var(--text-faint)", fontSize: "18px", fontWeight: "800" }}>
                              {reading ? `${Math.round(reading.value)} ${unit}` : "—"}
                            </div>
                            {reading?.alerts?.length > 0 && (
                              <div style={{ color: "#f59e0b", fontSize: "11px", marginTop: "2px" }}>
                                ⚠️ {reading.alerts[0]}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Generate Report Button */}
              <div style={{ marginTop: "24px" }}>
                <button
                  onClick={() => setShowReport(selectedPatient.id)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "none",
                    background: "linear-gradient(135deg, #1d4ed8, #0891b2)",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  📋 {t("generateReport")}
                </button>
              </div>
            </div>
          </div>
        )}

        {showReport && (
          <HealthReportModal
            patientId={showReport}
            onClose={() => setShowReport(null)}
          />
        )}
      </div>
    </>
  );
};