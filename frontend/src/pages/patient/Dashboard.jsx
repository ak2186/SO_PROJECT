
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

  // Apply synced data directly from sync/today response (freshest values)
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
    // 1. Show cached DB data immediately
    fetchCurrentReadings();

    // 2. If Google Fit is connected, sync fresh data then apply it directly
    if (localStorage.getItem("healix_gfit_connected") === "true") {
      googleFitAPI.sync()
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
          transition: all 0.4s ease;
        }
        
        .weekly-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.4);
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
              {/* Glowing icon */}
              <div className="icon-float" style={{
                fontSize: "48px",
                marginBottom: "20px",
                filter: card.iconGlow,
              }}>
                {card.icon}
              </div>

              {/* Title */}
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

              {/* Value */}
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

              {/* Subtitle */}
              <div style={{
                color: "#64748b",
                fontSize: "15px",
                fontWeight: "500",
                marginBottom: "16px",
              }}>
                {card.subtitle}
              </div>

              {/* Progress bar for Steps */}
              {card.progress && (
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

      </div>
    </>
  );
};