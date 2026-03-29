import { useState, useEffect } from "react";
import { biomarkersAPI, googleFitAPI } from "../../utils/api";

export const PatientDashboard = () => {
  const [hrValue, setHrValue] = useState(null);
  const [spo2Value, setSpo2Value] = useState(null);
  const [stepsVal, setStepsVal] = useState(null);
  const [caloriesVal, setCaloriesVal] = useState(null);
  const [stepsProgress, setStepsProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCurrentReadings = () => {
    biomarkersAPI.getCurrent()
      .then((data) => {
        const r = data?.current_readings;
        if (!r) return;
        if (r.heart_rate) setHrValue(Math.round(r.heart_rate.value));
        if (r.spo2) setSpo2Value(Math.round(r.spo2.value));
        if (r.steps) {
          const steps = Number(r.steps.value);
          setStepsVal(steps);
          setStepsProgress(Math.min(Math.round((steps / 10000) * 100), 100));
        }
        if (r.calories) setCaloriesVal(Math.round(r.calories.value));
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
      setStepsProgress(Math.min(Math.round((d.steps / 10000) * 100), 100));
    }
    if (d.calories != null) setCaloriesVal(Math.round(d.calories));
    setLoading(false);
  };

  useEffect(() => {
    fetchCurrentReadings();
    if (localStorage.getItem("healix_gfit_connected") === "true") {
      googleFitAPI.today()
        .then(applyGfitData)
        .catch(() => { });
    }
  }, []);

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
          border: 1px solid rgba(255,255,255,0.1);
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
        
        .weekly-card {
          background: #0f172a;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 24px;
          transition: all 0.3s ease;
        }
        
        .weekly-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
        }

        .activity-card {
          background: #0f172a;
          border: 1px solid rgba(255,255,255,0.08);
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

      <div style={{
        background: "#060d1a",
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
            color: "#64748b",
            fontSize: "18px",
            margin: 0,
            fontWeight: "500",
          }}>
            Your health metrics at a glance ✨
          </p>
        </div>

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
                color: "#94a3b8",
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
                  color: "#64748b",
                  fontSize: "20px",
                  fontWeight: "700",
                }}>
                  {card.unit}
                </span>
              </div>

              <div style={{
                color: "#64748b",
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
                    background: "rgba(255,255,255,0.08)",
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
            color: "#f1f5f9",
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
                  <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                    Avg Heart Rate
                  </div>
                  <div style={{ color: "#f1f5f9", fontSize: "36px", fontWeight: "800", letterSpacing: "-1px" }}>
                    74 <span style={{ fontSize: "16px", color: "#64748b", fontWeight: "600" }}>BPM</span>
                  </div>
                  <div style={{ color: "#64748b", fontSize: "12px", marginTop: "4px" }}>
                    Last 7 days
                  </div>
                </div>
                <div style={{ fontSize: "24px" }}>📈</div>
              </div>
              <div style={{ color: "#10b981", fontSize: "13px", fontWeight: "600" }}>
                ↓ 2 BPM from last week
              </div>
            </div>

            {/* Active Minutes */}
            <div className="weekly-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                    Active Minutes
                  </div>
                  <div style={{ color: "#f1f5f9", fontSize: "36px", fontWeight: "800", letterSpacing: "-1px" }}>
                    145
                  </div>
                  <div style={{ color: "#64748b", fontSize: "12px", marginTop: "4px" }}>
                    Minutes today
                  </div>
                </div>
                <div style={{ fontSize: "24px" }}>⚡</div>
              </div>
              <div style={{ color: "#10b981", fontSize: "13px", fontWeight: "600" }}>
                Goal: 150 min/week
              </div>
            </div>

            {/* Sleep */}
            <div className="weekly-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                    Sleep
                  </div>
                  <div style={{ color: "#f1f5f9", fontSize: "36px", fontWeight: "800", letterSpacing: "-1px" }}>
                    7.5<span style={{ fontSize: "20px" }}>h</span>
                  </div>
                  <div style={{ color: "#64748b", fontSize: "12px", marginTop: "4px" }}>
                    Last night
                  </div>
                </div>
                <div style={{ fontSize: "24px" }}>🌙</div>
              </div>
              <div style={{ color: "#10b981", fontSize: "13px", fontWeight: "600" }}>
                Good quality
              </div>
            </div>
          </div>
        </div>

        {/* Today's Activity */}
        <div style={{ marginBottom: "48px", position: "relative", zIndex: 1 }}>
          <h2 style={{
            color: "#f1f5f9",
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
                <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>
                  Distance
                </div>
                <div style={{ color: "#f1f5f9", fontSize: "32px", fontWeight: "800", letterSpacing: "-1px" }}>
                  6.2 <span style={{ fontSize: "16px", color: "#64748b" }}>km</span>
                </div>
              </div>

              <div>
                <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>
                  Floors Climbed
                </div>
                <div style={{ color: "#f1f5f9", fontSize: "32px", fontWeight: "800", letterSpacing: "-1px" }}>
                  12
                </div>
              </div>

              <div>
                <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>
                  Active Hours
                </div>
                <div style={{ color: "#f1f5f9", fontSize: "32px", fontWeight: "800", letterSpacing: "-1px" }}>
                  8<span style={{ fontSize: "20px", color: "#64748b" }}>/12</span>
                </div>
              </div>

              <div>
                <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>
                  Streak
                </div>
                <div style={{ color: "#f1f5f9", fontSize: "32px", fontWeight: "800", letterSpacing: "-1px" }}>
                  7 <span style={{ fontSize: "16px", color: "#64748b" }}>days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Health Insights */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{
            color: "#f1f5f9",
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
            {/* Great Progress Card */}
            <div className="insight-card" style={{
              background: "rgba(16, 185, 129, 0.08)",
              borderColor: "rgba(16, 185, 129, 0.3)",
            }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "rgba(16, 185, 129, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                flexShrink: 0,
              }}>
                📈
              </div>
              <div>
                <div style={{ color: "#f1f5f9", fontSize: "16px", fontWeight: "700", marginBottom: "4px" }}>
                  Great progress this week!
                </div>
                <div style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.5" }}>
                  You've met your steps goal 5 out of 7 days. Keep it up!
                </div>
              </div>
            </div>

            {/* Upcoming Appointment Card */}
            <div className="insight-card" style={{
              background: "rgba(59, 130, 246, 0.08)",
              borderColor: "rgba(59, 130, 246, 0.3)",
            }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "rgba(59, 130, 246, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                flexShrink: 0,
              }}>
                📅
              </div>
              <div>
                <div style={{ color: "#f1f5f9", fontSize: "16px", fontWeight: "700", marginBottom: "4px" }}>
                  Upcoming Appointment
                </div>
                <div style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.5" }}>
                  Dr. Sarah Mitchell - Tomorrow at 10:30 AM
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

