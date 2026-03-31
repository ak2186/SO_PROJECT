import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../utils/api";

const TOTAL_STEPS = 5;

const emptyMedRow = () => ({ name: "", dosage: "", frequency: "Daily" });

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];
const RELATIONSHIPS = ["Spouse", "Parent", "Sibling", "Child", "Friend", "Other"];
const FREQUENCIES = ["Daily", "Twice daily", "Weekly", "As needed"];

const SMOKING_OPTS = ["Never", "Former smoker", "Current smoker"];
const ALCOHOL_OPTS = ["Never", "Occasional", "Moderate", "Heavy"];
const EXERCISE_OPTS = ["Sedentary", "Light (1-2x/week)", "Moderate (3-4x/week)", "Active (5+/week)", "Very Active (daily)"];
const SLEEP_OPTS = ["Less than 5h", "5-6h", "6-7h", "7-8h", "More than 8h"];
const DIET_OPTS = ["No preference", "Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Other"];

export const ProfileSetup = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [s1, setS1] = useState({
    blood_type: "",
    height: "",
    weight: "",
    date_of_birth: "",
    gender: "",
  });

  // Step 2
  const [s2, setS2] = useState({
    health_conditions: "",
    allergies: "",
    family_history: "",
  });

  // Step 3
  const [medications, setMedications] = useState([emptyMedRow()]);
  const [supplements, setSupplements] = useState([emptyMedRow()]);

  // Step 4
  const [s4, setS4] = useState({
    smoking_status: "",
    alcohol_frequency: "",
    exercise_frequency: "",
    sleep_habit: "",
    dietary_preference: "",
  });

  // Step 5
  const [s5, setS5] = useState({
    phone_number: "",
    medical_insurance: "",
    occupation: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
  });

  const setField = (setter) => (field) => (e) =>
    setter((prev) => ({ ...prev, [field]: e.target.value }));

  const setS1F = setField(setS1);
  const setS2F = setField(setS2);
  const setS5F = setField(setS5);

  // Med/Supplement list helpers
  const updateListRow = (setter, idx, field, value) =>
    setter((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  const addListRow = (setter) => setter((rows) => [...rows, emptyMedRow()]);
  const removeListRow = (setter, idx) =>
    setter((rows) => (rows.length === 1 ? rows : rows.filter((_, i) => i !== idx)));

  const radioSet = (setter, field, value) =>
    setter((prev) => ({ ...prev, [field]: value }));

  const handleNext = () => {
    setError("");
    if (step === 5) {
      handleSubmit();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setError("");
    setStep((s) => s - 1);
  };

  const handleSkip = async () => {
    try {
      await authAPI.updateProfile({ profile_completed: true });
      await refreshUser();
      navigate("/patient");
    } catch {
      navigate("/patient");
    }
  };

  const handleSubmit = async () => {
    if (!s5.phone_number || !s5.emergency_contact_name || !s5.emergency_contact_phone) {
      setError("Please fill in Phone Number and Emergency Contact Name and Phone.");
      return;
    }
    setError("");
    setLoading(true);

    const cleanMeds = medications.filter((m) => m.name.trim() !== "");
    const cleanSupps = supplements.filter((s) => s.name.trim() !== "");

    try {
      await authAPI.updateProfile({
        blood_type: s1.blood_type || null,
        height: s1.height ? parseFloat(s1.height) : null,
        weight: s1.weight ? parseFloat(s1.weight) : null,
        date_of_birth: s1.date_of_birth || null,
        gender: s1.gender || null,
        health_conditions: s2.health_conditions || null,
        allergies: s2.allergies || null,
        family_history: s2.family_history || null,
        medications: cleanMeds,
        supplements: cleanSupps,
        smoking_status: s4.smoking_status || null,
        alcohol_frequency: s4.alcohol_frequency || null,
        exercise_frequency: s4.exercise_frequency || null,
        sleep_habit: s4.sleep_habit || null,
        dietary_preference: s4.dietary_preference || null,
        phone_number: s5.phone_number,
        medical_insurance: s5.medical_insurance || null,
        occupation: s5.occupation || null,
        emergency_contact_name: s5.emergency_contact_name,
        emergency_contact_phone: s5.emergency_contact_phone,
        emergency_contact_relationship: s5.emergency_contact_relationship || null,
        profile_completed: true,
      });
      await refreshUser();
      navigate("/patient");
    } catch (err) {
      if (err.status === 401) {
        navigate("/login");
        return;
      }
      setError(err.message || "Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = [
    "Basic Health Info",
    "Medical History",
    "Medications & Supplements",
    "Lifestyle",
    "Contact & Emergency",
  ];

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .ps-input {
          width: 100%;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: var(--text, #e2e8f0);
          padding: 12px 14px;
          font-size: 14px;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          transition: border-color .2s, box-shadow .2s;
        }
        .ps-input:focus {
          border-color: rgba(59,130,246,0.6);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
        }
        .ps-select { appearance: none; cursor: pointer; }
        .ps-textarea { resize: vertical; min-height: 80px; }
        .ps-pill {
          display: inline-flex;
          align-items: center;
          padding: 8px 14px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: var(--text-muted, #94a3b8);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all .2s;
          white-space: nowrap;
          user-select: none;
        }
        .ps-pill:hover {
          border-color: rgba(59,130,246,0.4);
          color: var(--text, #e2e8f0);
        }
        .ps-pill.selected {
          background: rgba(59,130,246,0.25);
          border-color: rgba(59,130,246,0.7);
          color: #93c5fd;
          font-weight: 600;
        }
        .ps-add-btn {
          width: 100%;
          padding: 10px;
          border-radius: 10px;
          border: 1px dashed rgba(255,255,255,0.18);
          background: transparent;
          color: var(--text-muted, #94a3b8);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: border-color .2s, color .2s;
          margin-top: 8px;
        }
        .ps-add-btn:hover {
          border-color: rgba(59,130,246,0.5);
          color: #93c5fd;
        }
        .ps-remove-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          min-width: 34px;
          border-radius: 8px;
          border: 1px solid rgba(239,68,68,0.25);
          background: rgba(239,68,68,0.08);
          color: #f87171;
          font-size: 16px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background .2s;
          align-self: flex-end;
          margin-bottom: 1px;
        }
        .ps-remove-btn:hover { background: rgba(239,68,68,0.18); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .step-anim { animation: fadeUp .35s ease both; }
      `}</style>

      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconWrap}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <h1 style={styles.title}>Complete Your Profile</h1>
            <p style={styles.subtitle}>
              Hi {user?.first_name || "there"}! Step {step} of {TOTAL_STEPS} — {stepTitles[step - 1]}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={styles.progressWrap}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => {
            const n = i + 1;
            const isCompleted = n < step;
            const isActive = n === step;
            return (
              <div key={n} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div
                  style={{
                    ...styles.progressDot,
                    ...(isCompleted ? styles.progressDotDone : {}),
                    ...(isActive ? styles.progressDotActive : {}),
                  }}
                >
                  {isCompleted ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span style={{ fontSize: "11px", fontWeight: "700", color: isActive ? "#fff" : "rgba(255,255,255,0.3)" }}>{n}</span>
                  )}
                </div>
                {i < TOTAL_STEPS - 1 && (
                  <div style={{
                    flex: 1,
                    height: "2px",
                    background: isCompleted ? "#22c55e" : "rgba(255,255,255,0.08)",
                    margin: "0 4px",
                    borderRadius: "1px",
                    transition: "background .3s",
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && <div style={styles.error}>{error}</div>}

        {/* Steps */}
        <div className="step-anim" key={step}>
          {step === 1 && (
            <StepBasicHealth s1={s1} setS1F={setS1F} />
          )}
          {step === 2 && (
            <StepMedHistory s2={s2} setS2F={setS2F} />
          )}
          {step === 3 && (
            <StepMedications
              medications={medications}
              supplements={supplements}
              updateMed={(idx, field, val) => updateListRow(setMedications, idx, field, val)}
              addMed={() => addListRow(setMedications)}
              removeMed={(idx) => removeListRow(setMedications, idx)}
              updateSupp={(idx, field, val) => updateListRow(setSupplements, idx, field, val)}
              addSupp={() => addListRow(setSupplements)}
              removeSupp={(idx) => removeListRow(setSupplements, idx)}
            />
          )}
          {step === 4 && (
            <StepLifestyle s4={s4} radioSet={(field, val) => radioSet(setS4, field, val)} />
          )}
          {step === 5 && (
            <StepContact s5={s5} setS5F={setS5F} />
          )}
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {step === 1 && (
              <button type="button" onClick={handleSkip} style={styles.skipLink}>
                Skip for now
              </button>
            )}
            {step > 1 && (
              <button type="button" onClick={handleBack} style={styles.backBtn}>
                Back
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleNext}
            disabled={loading}
            style={styles.nextBtn}
          >
            {loading ? "Saving..." : step === TOTAL_STEPS ? "Save & Continue" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Step Components ─────────────────────────────────────────────────────── */

const SectionLabel = ({ children }) => (
  <div style={{
    color: "var(--text-muted, #94a3b8)",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.09em",
    marginBottom: "12px",
    marginTop: "4px",
  }}>
    {children}
  </div>
);

const Label = ({ children }) => (
  <label style={{
    display: "block",
    color: "var(--text-muted, #94a3b8)",
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "6px",
  }}>
    {children}
  </label>
);

const PillGroup = ({ options, selected, onSelect }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
    {options.map((opt) => (
      <button
        key={opt}
        type="button"
        className={`ps-pill${selected === opt ? " selected" : ""}`}
        onClick={() => onSelect(opt)}
      >
        {selected === opt && (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ marginRight: "5px" }}>
            <path d="M2 6l3 3 5-5" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {opt}
      </button>
    ))}
  </div>
);

function StepBasicHealth({ s1, setS1F }) {
  return (
    <div>
      <SectionLabel>Basic Health Information</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "14px" }}>
        <div>
          <Label>Blood Type</Label>
          <select className="ps-input ps-select" value={s1.blood_type} onChange={setS1F("blood_type")}>
            <option value="">Select</option>
            {BLOOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <Label>Height (cm)</Label>
          <input className="ps-input" type="number" placeholder="e.g. 175" value={s1.height} onChange={setS1F("height")} />
        </div>
        <div>
          <Label>Weight (kg)</Label>
          <input className="ps-input" type="number" placeholder="e.g. 70" value={s1.weight} onChange={setS1F("weight")} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <div>
          <Label>Date of Birth</Label>
          <input className="ps-input" type="date" value={s1.date_of_birth} onChange={setS1F("date_of_birth")} />
        </div>
        <div>
          <Label>Gender</Label>
          <select className="ps-input ps-select" value={s1.gender} onChange={setS1F("gender")}>
            <option value="">Select</option>
            {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function StepMedHistory({ s2, setS2F }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <SectionLabel>Medical History</SectionLabel>
      <div>
        <Label>Health Conditions</Label>
        <textarea
          className="ps-input ps-textarea"
          placeholder="e.g. Diabetes, Asthma, Hypertension"
          value={s2.health_conditions}
          onChange={setS2F("health_conditions")}
        />
        <div style={styles.hint}>Comma-separated list</div>
      </div>
      <div>
        <Label>Allergies</Label>
        <textarea
          className="ps-input ps-textarea"
          placeholder="e.g. Penicillin, Peanuts, Latex"
          value={s2.allergies}
          onChange={setS2F("allergies")}
        />
        <div style={styles.hint}>Comma-separated list</div>
      </div>
      <div>
        <Label>Family Medical History</Label>
        <textarea
          className="ps-input ps-textarea"
          placeholder="e.g. Father - Heart Disease, Mother - Diabetes"
          value={s2.family_history}
          onChange={setS2F("family_history")}
        />
      </div>
    </div>
  );
}

function DynamicMedList({ title, rows, onUpdate, onAdd, onRemove }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <SectionLabel>{title}</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {rows.map((row, idx) => (
          <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <div style={{ flex: 2 }}>
              {idx === 0 && <Label>Name</Label>}
              <input
                className="ps-input"
                type="text"
                placeholder="e.g. Metformin"
                value={row.name}
                onChange={(e) => onUpdate(idx, "name", e.target.value)}
              />
            </div>
            <div style={{ flex: 1.2 }}>
              {idx === 0 && <Label>Dosage</Label>}
              <input
                className="ps-input"
                type="text"
                placeholder="e.g. 500mg"
                value={row.dosage}
                onChange={(e) => onUpdate(idx, "dosage", e.target.value)}
              />
            </div>
            <div style={{ flex: 1.3 }}>
              {idx === 0 && <Label>Frequency</Label>}
              <select
                className="ps-input ps-select"
                value={row.frequency}
                onChange={(e) => onUpdate(idx, "frequency", e.target.value)}
              >
                {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <button
              type="button"
              className="ps-remove-btn"
              onClick={() => onRemove(idx)}
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="ps-add-btn" onClick={onAdd}>
        + Add {title.includes("Med") ? "Medication" : "Supplement"}
      </button>
    </div>
  );
}

function StepMedications({ medications, supplements, updateMed, addMed, removeMed, updateSupp, addSupp, removeSupp }) {
  return (
    <div>
      <DynamicMedList
        title="Medications"
        rows={medications}
        onUpdate={updateMed}
        onAdd={addMed}
        onRemove={removeMed}
      />
      <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "4px 0 20px" }} />
      <DynamicMedList
        title="Supplements"
        rows={supplements}
        onUpdate={updateSupp}
        onAdd={addSupp}
        onRemove={removeSupp}
      />
    </div>
  );
}

function StepLifestyle({ s4, radioSet }) {
  const row = (label, field, options) => (
    <div style={{ marginBottom: "20px" }}>
      <Label>{label}</Label>
      <PillGroup options={options} selected={s4[field]} onSelect={(v) => radioSet(field, v)} />
    </div>
  );
  return (
    <div>
      <SectionLabel>Lifestyle & Habits</SectionLabel>
      {row("Smoking Status", "smoking_status", SMOKING_OPTS)}
      {row("Alcohol Consumption", "alcohol_frequency", ALCOHOL_OPTS)}
      {row("Exercise Frequency", "exercise_frequency", EXERCISE_OPTS)}
      {row("Typical Sleep Duration", "sleep_habit", SLEEP_OPTS)}
      {row("Dietary Preference", "dietary_preference", DIET_OPTS)}
    </div>
  );
}

function StepContact({ s5, setS5F }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div>
        <SectionLabel>Contact & Insurance</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
          <div>
            <Label>Phone Number *</Label>
            <input className="ps-input" type="tel" placeholder="+1 (555) 000-0000" value={s5.phone_number} onChange={setS5F("phone_number")} />
          </div>
          <div>
            <Label>Medical Insurance</Label>
            <input className="ps-input" type="text" placeholder="e.g. Blue Cross Blue Shield" value={s5.medical_insurance} onChange={setS5F("medical_insurance")} />
          </div>
          <div>
            <Label>Occupation</Label>
            <input className="ps-input" type="text" placeholder="e.g. Software Engineer" value={s5.occupation} onChange={setS5F("occupation")} />
          </div>
        </div>
      </div>
      <div>
        <SectionLabel>Emergency Contact</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
          <div>
            <Label>Name *</Label>
            <input className="ps-input" type="text" placeholder="Contact name" value={s5.emergency_contact_name} onChange={setS5F("emergency_contact_name")} />
          </div>
          <div>
            <Label>Phone *</Label>
            <input className="ps-input" type="tel" placeholder="+1 (555) 000-0000" value={s5.emergency_contact_phone} onChange={setS5F("emergency_contact_phone")} />
          </div>
          <div>
            <Label>Relationship</Label>
            <select className="ps-input ps-select" value={s5.emergency_contact_relationship} onChange={setS5F("emergency_contact_relationship")}>
              <option value="">Select</option>
              {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #060d1a 0%, #0f172a 50%, #0c1929 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    width: "min(740px, 100%)",
    background: "var(--bg-3, #0a1628)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "24px",
    padding: "36px 40px 32px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "28px",
  },
  iconWrap: {
    width: "56px",
    height: "56px",
    minWidth: "56px",
    borderRadius: "14px",
    background: "rgba(59,130,246,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "var(--text, #e2e8f0)",
    fontSize: "24px",
    fontWeight: "800",
    margin: "0 0 4px 0",
    letterSpacing: "-0.4px",
  },
  subtitle: {
    color: "var(--text-subtle, #64748b)",
    fontSize: "14px",
    margin: 0,
    lineHeight: 1.5,
  },
  progressWrap: {
    display: "flex",
    alignItems: "center",
    marginBottom: "28px",
    padding: "0 2px",
  },
  progressDot: {
    width: "30px",
    height: "30px",
    minWidth: "30px",
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all .3s",
  },
  progressDotActive: {
    border: "2px solid #3b82f6",
    background: "#3b82f6",
    boxShadow: "0 0 0 4px rgba(59,130,246,0.2)",
  },
  progressDotDone: {
    border: "2px solid #22c55e",
    background: "#22c55e",
  },
  error: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.25)",
    color: "#ef4444",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "13px",
    marginBottom: "18px",
  },
  hint: {
    color: "rgba(148,163,184,0.6)",
    fontSize: "11px",
    marginTop: "4px",
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "32px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    paddingTop: "24px",
  },
  skipLink: {
    background: "none",
    border: "none",
    color: "var(--text-muted, #94a3b8)",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    padding: "0",
    textDecoration: "underline",
    textDecorationColor: "rgba(148,163,184,0.4)",
    textUnderlineOffset: "3px",
  },
  backBtn: {
    padding: "11px 22px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color: "var(--text-muted, #94a3b8)",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color .2s, color .2s",
  },
  nextBtn: {
    padding: "11px 28px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #1d4ed8, #0891b2)",
    color: "#fff",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
    transition: "opacity .2s",
  },
};
