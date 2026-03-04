
import { useState, useEffect } from "react";
import { vitalsToday, calcStatsFromToday } from "../../data/vitalsMock";
import { biomarkersAPI } from "../../utils/api";

export const PatientDashboard = () => {
  const [hrStats, setHrStats] = useState(calcStatsFromToday(vitalsToday.heartRate));
  const [spo2Stats, setSpo2Stats] = useState(calcStatsFromToday(vitalsToday.spo2));
  const [stepsVal, setStepsVal] = useState("8,432");
  const [caloriesVal, setCaloriesVal] = useState("1,847");

  useEffect(() => {
    biomarkersAPI.getCurrent()
      .then((data) => {
        const r = data?.current_readings;
        if (!r) return;
        if (r.heart_rate) {
          setHrStats((prev) => ({ ...prev, current: r.heart_rate.value }));
        }
        if (r.spo2) {
          setSpo2Stats((prev) => ({ ...prev, current: r.spo2.value }));
        }
        if (r.steps) {
          setStepsVal(Number(r.steps.value).toLocaleString());
        }
        if (r.calories) {
          setCaloriesVal(Number(Math.round(r.calories.value)).toLocaleString());
        }
      })
      .catch(() => { }); // fallback to mock
  }, []);

  const healthCards = [
    {
      title: "Heart Rate",
      value: hrStats.current,
      unit: "bpm",
      subtitle: "Current reading",
      icon: "❤️",
      color: "#ef4444",
      gradient: "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.05) 100%)",
      glow: "0 0 60px rgba(239,68,68,0.4)",
      iconGlow: "drop-shadow(0 0 20px rgba(239,68,68,0.6))",
    },
    {
      title: "Blood Oxygen",
      value: spo2Stats.current,
      unit: "%",
      subtitle: "SpO₂ level",
      icon: "💧",
      color: "#3b82f6",
      gradient: "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.05) 100%)",
      glow: "0 0 60px rgba(59,130,246,0.4)",
      iconGlow: "drop-shadow(0 0 20px rgba(59,130,246,0.6))",
    },
    {
      title: "Steps Today",
      value: stepsVal,
      unit: "steps",
      subtitle: "84% of goal",
      progress: 84,
      icon: "👟",
      color: "#10b981",
      gradient: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.05) 100%)",
      glow: "0 0 60px rgba(16,185,129,0.4)",
      iconGlow: "drop-shadow(0 0 20px rgba(16,185,129,0.6))",
    },
    {
      title: "Calories Burned",
      value: caloriesVal,
      unit: "kcal",
      subtitle: "Active energy",
      icon: "🔥",
      color: "#f59e0b",
      gradient: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.05) 100%)",
      glow: "0 0 60px rgba(245,158,11,0.4)",
      iconGlow: "drop-shadow(0 0 20px rgba(245,158,11,0.6))",
    },
  ];

  const weeklySummary = [
    { label: "Avg Heart Rate", value: "78", unit: "bpm", color: "#ef4444", icon: "💓" },
    { label: "Active Minutes", value: "342", unit: "min", color: "#10b981", icon: "⚡" },
    { label: "Sleep Quality", value: "7.2", unit: "hrs", color: "#8b5cf6", icon: "😴" },
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

        {/* Weekly Summary */}
        <div style={{ animation: "fadeUp 0.8s ease 0.5s both", position: "relative", zIndex: 1 }}>
          <h2 className="gradient-text" style={{
            fontSize: "36px",
            fontWeight: "800",
            marginBottom: "32px",
            letterSpacing: "-1px",
          }}>
            Weekly Summary
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "24px",
          }}>
            {weeklySummary.map((item, i) => (
              <div
                key={i}
                className="weekly-card"
                style={{
                  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "24px",
                  padding: "32px",
                  position: "relative",
                  overflow: "hidden",
                  animation: `fadeUp 0.6s ease ${0.6 + i * 0.12}s both`,
                }}
              >
                {/* Top accent bar */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: `linear-gradient(90deg, ${item.color}, transparent)`,
                  boxShadow: `0 0 20px ${item.color}88`,
                }} />

                {/* Icon */}
                <div style={{
                  fontSize: "32px",
                  marginBottom: "16px",
                  filter: `drop-shadow(0 0 16px ${item.color}88)`,
                }}>
                  {item.icon}
                </div>

                {/* Label */}
                <div style={{
                  color: "#94a3b8",
                  fontSize: "12px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  marginBottom: "12px",
                }}>
                  {item.label}
                </div>

                {/* Value */}
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span style={{
                    color: item.color,
                    fontSize: "40px",
                    fontWeight: "900",
                    letterSpacing: "-1.5px",
                    textShadow: `0 0 30px ${item.color}66`,
                  }}>
                    {item.value}
                  </span>
                  <span style={{
                    color: "#64748b",
                    fontSize: "16px",
                    fontWeight: "700",
                  }}>
                    {item.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};