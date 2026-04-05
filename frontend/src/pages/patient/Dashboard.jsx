import { useState, useEffect } from "react";
import { biomarkersAPI, googleFitAPI, permissionsAPI, appointmentsAPI, gamificationAPI } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { HealthAvatar } from "../../components/HealthAvatar";
import { useNavigate } from "react-router-dom";

export const PatientDashboard = () => {
  const { user } = useAuth();
  const [hrValue, setHrValue] = useState(null);
  const [spo2Value, setSpo2Value] = useState(null);
  const [stepsVal, setStepsVal] = useState(null);
  const [caloriesVal, setCaloriesVal] = useState(null);
  const [sleepVal, setSleepVal] = useState(null);
  const [stepsProgress, setStepsProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [permRequests, setPermRequests] = useState([]);
  const [permLoading, setPermLoading] = useState({});
  const navigate = useNavigate();

  const [weekData, setWeekData] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState({ avgHr: null, totalSteps: null, avgSleep: null });
  const [nextAppt, setNextAppt] = useState(null);
  const [gamification, setGamification] = useState(null);
  const [xpToast, setXpToast] = useState(null);

  const healthStatus = {
  warnings: [
    hrValue != null && hrValue > 100,
    spo2Value != null && spo2Value < 95,
    sleepVal != null && sleepVal < 7,
  ].filter(Boolean).length,
  hasData: hrValue != null || spo2Value != null || stepsVal != null,
};
    const [avatar, setAvatar] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('healix_avatar') || '{}');
    } catch {
      return {};
    }
  });

  // Read user's custom step goal from Goals page, default 10000
  const stepGoal = Number(localStorage.getItem(`healix_goal_steps_${user?.id}`)) || 10000;

  const fetchCurrentReadings = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    biomarkersAPI.getCurrent()
      .then((data) => {
        const r = data?.current_readings;
        if (!r) return;
        // Only show readings from today to avoid stale data
        const isToday = (reading) => {
          if (!reading?.recorded_at) return false;
          const dateStr = reading.recorded_at.endsWith("Z") ? reading.recorded_at : reading.recorded_at + "Z";
          return new Date(dateStr).toISOString().split("T")[0] === todayStr;
        };
        if (r.heart_rate && isToday(r.heart_rate)) setHrValue(Math.round(r.heart_rate.value));
        if (r.spo2 && isToday(r.spo2)) setSpo2Value(Math.round(r.spo2.value));
        if (r.steps && isToday(r.steps)) {
          const steps = Number(r.steps.value);
          setStepsVal(steps);
          setStepsProgress(Math.min(Math.round((steps / stepGoal) * 100), 100));
        }
        if (r.calories && isToday(r.calories)) setCaloriesVal(Math.round(r.calories.value));
        if (r.sleep_hours && isToday(r.sleep_hours)) setSleepVal(r.sleep_hours.value);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  const applyGfitData = (data) => {
    const d = data?.synced_data;
    if (!d) return;
    if (d.heart_rate != null) setHrValue(Math.round(d.heart_rate));
    if (d.spo2 != null) setSpo2Value(Math.round(d.spo2));
    if (d.steps != null) {
      setStepsVal(d.steps);
      setStepsProgress(Math.min(Math.round((d.steps / stepGoal) * 100), 100));
    }
    if (d.calories != null) setCaloriesVal(Math.round(d.calories));
    if (d.sleep_hours != null) setSleepVal(d.sleep_hours);
    setLoading(false);
  };

  useEffect(() => {
    fetchCurrentReadings();
    if (localStorage.getItem("healix_gfit_connected") === "true") {
      googleFitAPI.today()
        .then(applyGfitData)
        .catch(() => { });
    }
    permissionsAPI.getMyRequests()
      .then((data) => setPermRequests(Array.isArray(data) ? data : []))
      .catch(() => {});

    googleFitAPI.week()
      .then((data) => setWeekData(data))
      .catch(() => {});

    // Fetch biomarker history for the last 7 days to compute weekly summary
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    biomarkersAPI.getHistory({ date_from: weekAgo.toISOString(), limit: 100 })
      .then((data) => {
        const readings = data?.readings || [];
        if (readings.length === 0) return;
        const hrVals = readings.map(r => r.heart_rate).filter(v => v != null);
        const stepVals = readings.map(r => r.steps).filter(v => v != null);
        const sleepVals = readings.map(r => r.sleep_hours).filter(v => v != null);
        setWeeklySummary({
          avgHr: hrVals.length > 0 ? Math.round(hrVals.reduce((s, v) => s + v, 0) / hrVals.length) : null,
          avgSteps: stepVals.length > 0 ? Math.round(stepVals.reduce((s, v) => s + v, 0) / stepVals.length) : null,
          avgSleep: sleepVals.length > 0 ? +(sleepVals.reduce((s, v) => s + v, 0) / sleepVals.length).toFixed(1) : null,
        });
      })
      .catch(() => {});

    appointmentsAPI.getMyAppointments({ limit: 5, status: "confirmed" })
      .then((data) => {
        if (data?.appointments?.length) {
          const upcoming = data.appointments.find(a => new Date(a.appointment_date + "Z") > new Date());
          if (upcoming) setNextAppt(upcoming);
        }
      })
      .catch(() => {});

    gamificationAPI.getMe()
      .then((data) => setGamification(data))
      .catch(() => {});

    try {
      const stored = JSON.parse(localStorage.getItem('healix_avatar') || '{}');
      setAvatar(stored);
    } catch {
      // ignore
    }
  }, []);

  const handlePermission = (permissionId, action) => {
    setPermLoading((prev) => ({ ...prev, [permissionId]: true }));
    permissionsAPI.respond(permissionId, action)
      .then(() => setPermRequests((prev) => prev.filter((r) => r.id !== permissionId)))
      .catch(() => {})
      .finally(() => setPermLoading((prev) => ({ ...prev, [permissionId]: false })));
  };

  const showXpToast = (msg) => {
    setXpToast(msg);
    setTimeout(() => setXpToast(null), 3000);
  };

  // Compute weekly avg heart rate — prefer Google Fit, fallback to biomarker history
  const gfitHrReadings = weekData?.heart_rate?.filter(d => d.avg != null) ?? [];
  const gfitAvgHr = gfitHrReadings.length > 0
    ? Math.round(gfitHrReadings.reduce((s, d) => s + d.avg, 0) / gfitHrReadings.length)
    : null;
  const weeklyAvgHr = gfitAvgHr ?? weeklySummary.avgHr;

  // Compute weekly avg daily steps — prefer Google Fit, fallback to biomarker history
  const gfitStepDays = weekData?.steps?.filter(d => d.value > 0) ?? [];
  const gfitAvgSteps = gfitStepDays.length > 0
    ? Math.round(gfitStepDays.reduce((s, d) => s + d.value, 0) / gfitStepDays.length)
    : null;
  const weeklySteps = gfitAvgSteps ?? weeklySummary.avgSteps;

  // Compute weekly avg sleep — prefer Google Fit, fallback to biomarker history
  const gfitSleepReadings = weekData?.sleep?.filter(d => d.value > 0) ?? [];
  const gfitAvgSleep = gfitSleepReadings.length > 0
    ? +(gfitSleepReadings.reduce((s, d) => s + d.value, 0) / gfitSleepReadings.length).toFixed(1)
    : null;
  const weeklySleep = gfitAvgSleep ?? weeklySummary.avgSleep;

  // Build dynamic health insights
  const buildInsights = () => {
    const insights = [];
    const hasAnyData = hrValue != null || stepsVal != null || sleepVal != null || spo2Value != null || nextAppt != null;

    if (!hasAnyData) {
      insights.push({
        icon: "💡",
        type: "info",
        color: "#3b82f6",
        title: "No data yet",
        body: "Connect Google Fit in Settings to see your health insights",
      });
      return insights;
    }

    if (hrValue != null && hrValue > 100) {
      insights.push({
        icon: "⚠️",
        type: "warning",
        color: "#f59e0b",
        title: "Elevated Heart Rate",
        body: `Your heart rate is elevated at ${hrValue} BPM`,
      });
    }

    if (stepsVal != null && stepsVal >= stepGoal) {
      insights.push({
        icon: "🏆",
        type: "success",
        color: "#10b981",
        title: "Step Goal Achieved!",
        body: `You've walked ${stepsVal.toLocaleString()} steps today — goal of ${stepGoal.toLocaleString()} reached!`,
      });
    } else if (stepsVal != null && stepsVal > 0) {
      insights.push({
        icon: "👟",
        type: "info",
        color: "#3b82f6",
        title: "Keep Moving",
        body: `You're at ${stepsProgress}% of your ${stepGoal.toLocaleString()} step goal. Keep moving!`,
      });
    }

    if (sleepVal != null && sleepVal < 7) {
      insights.push({
        icon: "😴",
        type: "warning",
        color: "#f59e0b",
        title: "Low Sleep",
        body: `You only slept ${sleepVal}h. Try to get 7-8 hours tonight.`,
      });
    } else if (sleepVal != null && sleepVal >= 7) {
      insights.push({
        icon: "🌙",
        type: "success",
        color: "#10b981",
        title: "Great Sleep",
        body: `Great sleep last night — ${sleepVal} hours!`,
      });
    }

    if (spo2Value != null && spo2Value < 95) {
      insights.push({
        icon: "💧",
        type: "warning",
        color: "#ef4444",
        title: "Low Blood Oxygen",
        body: `Blood oxygen is low at ${spo2Value}%`,
      });
    }

    if (nextAppt) {
      const apptDate = new Date(nextAppt.appointment_date + "Z");
      const formatted = apptDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      insights.push({
        icon: "📅",
        type: "info",
        color: "#3b82f6",
        title: "Upcoming Appointment",
        body: `Upcoming: ${nextAppt.provider_name || "Your provider"} on ${formatted}`,
      });
    }

    return insights;
  };

  const insights = buildInsights();

  const healthCards = [
    {
      title: "Heart Rate",
      value: hrValue != null ? hrValue : "—",
      unit: "bpm",
      subtitle: hrValue != null ? "Current reading" : "No data yet",
      icon: "❤️",
      color: "#ef4444",
      gradient: "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.05) 100%)",
      glow: "0 0 60px rgba(239,68,68,0.4)",
      iconGlow: "drop-shadow(0 0 20px rgba(239,68,68,0.6))",
    },
    {
      title: "Blood Oxygen",
      value: spo2Value != null ? spo2Value : "—",
      unit: "%",
      subtitle: spo2Value != null ? "SpO₂ level" : "No data yet",
      icon: "💧",
      color: "#3b82f6",
      gradient: "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.05) 100%)",
      glow: "0 0 60px rgba(59,130,246,0.4)",
      iconGlow: "drop-shadow(0 0 20px rgba(59,130,246,0.6))",
    },
    {
      title: "Steps Today",
      value: stepsVal != null ? stepsVal.toLocaleString() : "—",
      unit: "steps",
      subtitle: stepsVal != null ? `${stepsProgress}% of goal` : "No data yet",
      progress: stepsVal != null ? stepsProgress : 0,
      icon: "👟",
      color: "#10b981",
      gradient: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.05) 100%)",
      glow: "0 0 60px rgba(16,185,129,0.4)",
      iconGlow: "drop-shadow(0 0 20px rgba(16,185,129,0.6))",
    },
    {
      title: "Calories Burned",
      value: caloriesVal != null ? caloriesVal.toLocaleString() : "—",
      unit: "kcal",
      subtitle: caloriesVal != null ? "Active energy" : "No data yet",
      icon: "🔥",
      color: "#f59e0b",
      gradient: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.05) 100%)",
      glow: "0 0 60px rgba(245,158,11,0.4)",
      iconGlow: "drop-shadow(0 0 20px rgba(245,158,11,0.6))",
    },
    {
      title: "Sleep",
      value: sleepVal != null ? sleepVal : "—",
      unit: "hrs",
      subtitle: sleepVal != null ? (sleepVal >= 7 ? "Good rest" : "Below recommended") : "No data yet",
      icon: "😴",
      color: "#8b5cf6",
      gradient: "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(109,40,217,0.05) 100%)",
      glow: "0 0 60px rgba(139,92,246,0.4)",
      iconGlow: "drop-shadow(0 0 20px rgba(139,92,246,0.6))",
    },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        @keyframes glow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.4); }
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.9; }
        }

        .health-card {
          position: relative;
          border: 1px solid var(--border-solid);
          border-radius: 28px;
          padding: 32px;
          backdrop-filter: blur(20px);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          overflow: hidden;
        }

        .health-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 28px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.5s ease;
        }

        .health-card:hover::before {
          opacity: 1;
        }

        .health-card:hover {
          transform: translateY(-12px) scale(1.02);
          box-shadow: 0 30px 80px rgba(0,0,0,0.5);
        }

        .icon-float {
          animation: float 4s ease-in-out infinite;
        }

        .value-glow {
          animation: glow 3s ease-in-out infinite;
        }

        .gradient-text {
          background: linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        [data-theme="light"] .gradient-text {
          background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .weekly-card {
          background: var(--bg-3);
          border: 1px solid var(--border-solid);
          border-radius: 20px;
          padding: 24px;
          transition: all 0.3s ease;
        }

        .weekly-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
        }

        .activity-card {
          background: var(--bg-3);
          border: 1px solid var(--border-solid);
          border-radius: 20px;
          padding: 32px;
        }

        .insight-card {
          border: 1px solid;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s ease;
        }

        .insight-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }
      `}</style>

      <div className="page-responsive" style={{
        background: "var(--bg)",
        minHeight: "100vh",
        padding: "40px 48px",
        fontFamily: "'DM Sans', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Animated background orbs */}
        <div style={{
          position: "fixed",
          top: "-300px",
          right: "-300px",
          width: "800px",
          height: "800px",
          background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
          animation: "pulse 10s ease-in-out infinite",
        }} />

        <div style={{
          position: "fixed",
          bottom: "-200px",
          left: "-200px",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
          animation: "pulse 12s ease-in-out infinite",
        }} />

        {/* Header */}
        <div style={{ marginBottom: "56px", animation: "fadeUp 0.8s ease both", position: "relative", zIndex: 1 }}>
          <p style={{
            color: "#3b82f6",
            fontSize: "13px",
            fontWeight: "800",
            letterSpacing: "3.5px",
            textTransform: "uppercase",
            margin: "0 0 14px 0",
            opacity: 0.95,
          }}>
            Health Dashboard
          </p>
          <h1 className="gradient-text" style={{
            fontSize: "56px",
            fontWeight: "900",
            margin: "0 0 10px 0",
            letterSpacing: "-2px",
            lineHeight: 1.1,
          }}>
            Welcome Back
          </h1>
          <p style={{
            color: "var(--text-subtle)",
            fontSize: "18px",
            margin: 0,
            fontWeight: "500",
          }}>
            Your health metrics at a glance ✨
          </p>
        </div>

        {/* Health Avatar */}
          <div style={{
            marginBottom: "48px",
            animation: "fadeUp 0.8s ease 0.1s both",
            position: "relative",
            zIndex: 1,
            }}>
          <div style={{
            background: "var(--bg-3)",
            border: "1px solid var(--border-solid)",
            borderRadius: "24px",
            padding: "32px",
            display: "flex",
            alignItems: "center",
            gap: "32px",
            flexWrap: "wrap",
            }}>
              <HealthAvatar
  gender={avatar.gender || 'male'}
  skinTone={avatar.skinTone || '#f7c9a5'}
  hairColor={avatar.hairColor || '#2e2935'}
  hairStyle={avatar.hairStyle || 'short'}
  eyeColor={avatar.eyeColor || '#2880d8'}
  healthStatus={healthStatus}
  size={180}
/>
    
              <div style={{ flex: 1, minWidth: "250px" }}>
                <h3 style={{ color: "var(--text)", fontSize: "20px", fontWeight: "700", margin: "0 0 8px 0" }}>
                  Your Health Buddy
                  </h3>
                
                <p style={{ color: "var(--text-subtle)", fontSize: "15px", margin: "0 0 16px 0", lineHeight: "1.6" }}>
                  {healthStatus.warnings === 0 && healthStatus.hasData && "Everything looks great! Your avatar is happy and healthy. Keep up the good work! 🎉"}
                  {healthStatus.warnings >= 3 && "Your avatar is worried. Multiple health metrics need attention. Please review your vitals."}
                  {healthStatus.warnings >= 1 && healthStatus.warnings < 3 && "Your avatar is a bit concerned. Some health metrics could be better."}
                  {!healthStatus.hasData && "Your avatar is waiting for health data. Connect Google Fit to get started!"}
                 </p>
      
                <button
                onClick={() => navigate('/patient/settings')}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-solid)",
                  background: "transparent",
                  color: "var(--text)",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
      >
        Customize Avatar
      </button>
    </div>
  </div>
</div>

        {/* Permission Requests */}
        {permRequests.length > 0 && (
          <div style={{ marginBottom: "32px", position: "relative", zIndex: 1 }}>
            {permRequests.map((req) => (
              <div key={req.id} style={{
                background: "var(--bg-3)",
                border: "1px solid #f59e0b44",
                borderRadius: "16px",
                padding: "20px 24px",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "12px",
                    background: "#f59e0b22", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "22px", flexShrink: 0,
                  }}>
                    🩺
                  </div>
                  <div>
                    <div style={{ color: "var(--text)", fontSize: "15px", fontWeight: "700", marginBottom: "2px" }}>
                      {req.provider_name || "A doctor"} is requesting access to your health data
                    </div>
                    <div style={{ color: "var(--text-subtle)", fontSize: "13px" }}>
                      {req.provider_specialty ? `${req.provider_specialty} · ` : ""}
                      Granting access lets this doctor view your biomarker history and readings.
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
                  <button
                    disabled={!!permLoading[req.id]}
                    onClick={() => handlePermission(req.id, "denied")}
                    style={{
                      padding: "8px 18px", background: "transparent",
                      border: "1px solid #ef444466", borderRadius: "10px",
                      color: "#ef4444", fontSize: "13px", fontWeight: "700",
                      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                      opacity: permLoading[req.id] ? 0.5 : 1,
                    }}
                  >
                    Deny
                  </button>
                  <button
                    disabled={!!permLoading[req.id]}
                    onClick={() => handlePermission(req.id, "granted")}
                    style={{
                      padding: "8px 18px", background: "#10b981",
                      border: "none", borderRadius: "10px",
                      color: "#fff", fontSize: "13px", fontWeight: "700",
                      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                      opacity: permLoading[req.id] ? 0.5 : 1,
                    }}
                  >
                    {permLoading[req.id] ? "Saving…" : "Grant Access"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gamification Hub */}
        {gamification && (
          <div style={{
            marginBottom: "32px",
            position: "relative",
            zIndex: 1,
            background: "var(--bg-3)",
            border: "1px solid var(--border-solid)",
            borderRadius: "24px",
            padding: "28px",
            animation: "fadeUp 0.8s ease 0.1s both",
          }}>
            <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
              {/* Level Ring */}
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: `conic-gradient(#6366f1 ${Math.min((gamification.xp / gamification.xp_for_next_level) * 100, 100)}%, var(--border-solid) 0%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <div style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "var(--bg-3)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <span style={{ fontWeight: "800", fontSize: "22px", color: "var(--text)", lineHeight: 1 }}>
                      {gamification.level}
                    </span>
                    <span style={{ fontSize: "9px", fontWeight: "700", color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {gamification.level_name}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-subtle)", marginTop: "6px" }}>
                  {gamification.xp} / {gamification.xp_for_next_level} XP
                </div>
              </div>

              {/* Info Column */}
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "15px", fontWeight: "700", color: "var(--text)" }}>
                    🔥 {Math.max(
                      gamification.streak_count,
                      Number(localStorage.getItem(`healix_goal_steps_${user?.id}_streak`) || 0),
                      Number(localStorage.getItem(`healix_goal_calories_${user?.id}_streak`) || 0)
                    )} day streak
                  </span>
                </div>

                {/* Daily Challenge */}
                {gamification.challenge && (
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    background: gamification.challenge.completed ? "rgba(16,185,129,0.08)" : "rgba(249,115,22,0.08)",
                    border: `1px dashed ${gamification.challenge.completed ? "rgba(16,185,129,0.3)" : "rgba(249,115,22,0.3)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-subtle)", marginBottom: "2px" }}>
                        Daily Challenge
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>
                        {gamification.challenge.title}
                        <span style={{ color: "var(--text-subtle)", fontWeight: "500" }}> — +{gamification.challenge.xp_reward} XP</span>
                      </div>
                    </div>
                    {!gamification.challenge.completed ? (
                      <button
                        onClick={async () => {
                          try {
                            const res = await gamificationAPI.completeChallenge();
                            setGamification((prev) => ({
                              ...prev,
                              xp: res.total_xp,
                              level: res.level,
                              level_name: res.level_name,
                              xp_for_next_level: res.xp_for_next_level,
                              streak_count: res.streak_count,
                              challenge: { ...prev.challenge, completed: true },
                              badges: [...prev.badges, ...res.new_badges],
                            }));
                            showXpToast(res.level_up ? `Level Up! You're now ${res.level_name}` : `+${res.xp_gained} XP`);
                          } catch {}
                        }}
                        style={{
                          padding: "8px 18px",
                          borderRadius: "10px",
                          border: "none",
                          background: "linear-gradient(135deg, #f97316, #f59e0b)",
                          color: "#fff",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                          flexShrink: 0,
                        }}
                      >
                        Complete
                      </button>
                    ) : (
                      <span style={{ color: "#10b981", fontWeight: "700", fontSize: "13px", flexShrink: 0 }}>
                        ✓ Done
                      </span>
                    )}
                  </div>
                )}

                {/* Badges Row */}
                <div style={{ display: "flex", gap: "8px", marginTop: "14px", alignItems: "center", flexWrap: "wrap" }}>
                  {gamification.badges.slice(0, 5).map((b) => (
                    <span key={b.id} title={b.name} style={{ fontSize: "22px", cursor: "default" }}>
                      {b.emoji}
                    </span>
                  ))}
                  {gamification.badges.length > 5 && (
                    <span style={{ fontSize: "12px", color: "var(--text-subtle)", fontWeight: "600" }}>
                      +{gamification.badges.length - 5} more
                    </span>
                  )}
                  {gamification.badges.length === 0 && (
                    <span style={{ fontSize: "12px", color: "var(--text-subtle)" }}>
                      No badges yet — keep going!
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Health Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "28px",
          marginBottom: "64px",
          position: "relative",
          zIndex: 1,
        }}>
          {healthCards.map((card, i) => (
            <div
              key={i}
              className="health-card"
              style={{
                background: card.gradient,
                animation: `fadeUp 0.8s ease ${i * 0.12}s both`,
              }}
            >
              <div className="icon-float" style={{
                fontSize: "48px",
                marginBottom: "20px",
                filter: card.iconGlow,
              }}>
                {card.icon}
              </div>

              <div style={{
                color: "var(--text-muted)",
                fontSize: "13px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                marginBottom: "16px",
              }}>
                {card.title}
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "8px" }}>
                <span className="value-glow" style={{
                  color: card.color,
                  fontSize: "56px",
                  fontWeight: "900",
                  letterSpacing: "-2.5px",
                  lineHeight: 1,
                  textShadow: card.glow,
                }}>
                  {card.value}
                </span>
                <span style={{
                  color: "var(--text-subtle)",
                  fontSize: "20px",
                  fontWeight: "700",
                }}>
                  {card.unit}
                </span>
              </div>

              <div style={{
                color: "var(--text-subtle)",
                fontSize: "15px",
                fontWeight: "500",
                marginBottom: "16px",
              }}>
                {card.subtitle}
              </div>

              {card.progress != null && (
                <div style={{
                  marginTop: "20px",
                  position: "relative",
                }}>
                  <div style={{
                    height: "8px",
                    background: "var(--border-solid)",
                    borderRadius: "999px",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${card.progress}%`,
                      background: `linear-gradient(90deg, ${card.color}, ${card.color}cc)`,
                      borderRadius: "999px",
                      transition: "width 2s cubic-bezier(0.4, 0, 0.2, 1) 0.3s",
                      boxShadow: `0 0 20px ${card.color}88`,
                      backgroundSize: "200% 100%",
                      animation: "shimmer 3s linear infinite",
                    }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Weekly Summary */}
        <div style={{ marginBottom: "48px", position: "relative", zIndex: 1 }}>
          <h2 style={{
            color: "var(--text)",
            fontSize: "24px",
            fontWeight: "700",
            margin: "0 0 24px 0",
          }}>
            Weekly Summary
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}>
            {/* Avg Heart Rate */}
            <div className="weekly-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{ color: "var(--text-subtle)", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                    Avg Heart Rate
                  </div>
                  <div style={{ color: "var(--text)", fontSize: "36px", fontWeight: "800", letterSpacing: "-1px" }}>
                    {weeklyAvgHr != null ? weeklyAvgHr : "—"}{" "}
                    <span style={{ fontSize: "16px", color: "var(--text-subtle)", fontWeight: "600" }}>BPM</span>
                  </div>
                  <div style={{ color: "var(--text-subtle)", fontSize: "12px", marginTop: "4px" }}>
                    Last 7 days
                  </div>
                </div>
                <div style={{ fontSize: "24px" }}>📈</div>
              </div>
              <div style={{ color: weeklyAvgHr != null ? "#10b981" : "var(--text-faint)", fontSize: "13px", fontWeight: "600" }}>
                {weeklyAvgHr != null ? `${weeklyAvgHr} BPM avg this week` : "No data this week"}
              </div>
            </div>

            {/* Avg Daily Steps */}
            <div className="weekly-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{ color: "var(--text-subtle)", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                    Avg Daily Steps
                  </div>
                  <div style={{ color: "var(--text)", fontSize: "36px", fontWeight: "800", letterSpacing: "-1px" }}>
                    {weeklySteps != null ? weeklySteps.toLocaleString() : "—"}
                  </div>
                  <div style={{ color: "var(--text-subtle)", fontSize: "12px", marginTop: "4px" }}>
                    Last 7 days
                  </div>
                </div>
                <div style={{ fontSize: "24px" }}>⚡</div>
              </div>
              <div style={{ color: weeklySteps != null ? "#10b981" : "var(--text-faint)", fontSize: "13px", fontWeight: "600" }}>
                {weeklySteps != null ? `${weeklySteps.toLocaleString()} steps/day avg` : "No data this week"}
              </div>
            </div>

            {/* Sleep */}
            <div className="weekly-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{ color: "var(--text-subtle)", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                    Avg Sleep
                  </div>
                  <div style={{ color: "var(--text)", fontSize: "36px", fontWeight: "800", letterSpacing: "-1px" }}>
                    {weeklySleep != null ? <>{weeklySleep}<span style={{ fontSize: "20px" }}>h</span></> : "—"}
                  </div>
                  <div style={{ color: "var(--text-subtle)", fontSize: "12px", marginTop: "4px" }}>
                    Last 7 days
                  </div>
                </div>
                <div style={{ fontSize: "24px" }}>🌙</div>
              </div>
              <div style={{ color: weeklySleep != null ? (weeklySleep >= 7 ? "#10b981" : "#f59e0b") : "var(--text-faint)", fontSize: "13px", fontWeight: "600" }}>
                {weeklySleep != null ? (weeklySleep >= 7 ? `${weeklySleep}h avg — good quality` : `${weeklySleep}h avg — below recommended`) : "No data this week"}
              </div>
            </div>
          </div>
        </div>

        {/* Today's Activity */}
        <div style={{ marginBottom: "48px", position: "relative", zIndex: 1 }}>
          <h2 style={{
            color: "var(--text)",
            fontSize: "24px",
            fontWeight: "700",
            margin: "0 0 24px 0",
          }}>
            Today's Activity
          </h2>
          <div className="activity-card">
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "32px",
            }}>
              <div>
                <div style={{ color: "var(--text-subtle)", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>
                  Steps
                </div>
                <div style={{ color: "var(--text)", fontSize: "32px", fontWeight: "800", letterSpacing: "-1px" }}>
                  {stepsVal != null ? stepsVal.toLocaleString() : "—"}{" "}
                  {stepsVal != null && <span style={{ fontSize: "16px", color: "var(--text-subtle)" }}>steps</span>}
                </div>
              </div>

              <div>
                <div style={{ color: "var(--text-subtle)", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>
                  Calories
                </div>
                <div style={{ color: "var(--text)", fontSize: "32px", fontWeight: "800", letterSpacing: "-1px" }}>
                  {caloriesVal != null ? caloriesVal.toLocaleString() : "—"}{" "}
                  {caloriesVal != null && <span style={{ fontSize: "16px", color: "var(--text-subtle)" }}>kcal</span>}
                </div>
              </div>

              <div>
                <div style={{ color: "var(--text-subtle)", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>
                  Heart Rate
                </div>
                <div style={{ color: "var(--text)", fontSize: "32px", fontWeight: "800", letterSpacing: "-1px" }}>
                  {hrValue != null ? hrValue : "—"}{" "}
                  {hrValue != null && <span style={{ fontSize: "16px", color: "var(--text-subtle)" }}>bpm</span>}
                </div>
              </div>

              <div>
                <div style={{ color: "var(--text-subtle)", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>
                  Sleep
                </div>
                <div style={{ color: "var(--text)", fontSize: "32px", fontWeight: "800", letterSpacing: "-1px" }}>
                  {sleepVal != null ? sleepVal : "—"}{" "}
                  {sleepVal != null && <span style={{ fontSize: "20px", color: "var(--text-subtle)" }}>h</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Health Insights */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{
            color: "var(--text)",
            fontSize: "24px",
            fontWeight: "700",
            margin: "0 0 24px 0",
          }}>
            Health Insights
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "20px",
          }}>
            {insights.map((insight, i) => (
              <div key={i} className="insight-card" style={{
                background: `${insight.color}14`,
                borderColor: `${insight.color}4d`,
              }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: `${insight.color}26`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  flexShrink: 0,
                }}>
                  {insight.icon}
                </div>
                <div>
                  <div style={{ color: "var(--text)", fontSize: "16px", fontWeight: "700", marginBottom: "4px" }}>
                    {insight.title}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.5" }}>
                    {insight.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

        {/* XP Toast */}
        {xpToast && (
          <div style={{
            position: "fixed",
            bottom: "32px",
            right: "32px",
            background: "linear-gradient(135deg, #6366f1, #06b6d4)",
            color: "#fff",
            padding: "14px 24px",
            borderRadius: "14px",
            fontSize: "15px",
            fontWeight: "700",
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: "0 12px 40px rgba(99,102,241,0.4)",
            zIndex: 9999,
            animation: "fadeUp 0.4s ease both",
          }}>
            {xpToast}
          </div>
        )}
    </>
  );
};
