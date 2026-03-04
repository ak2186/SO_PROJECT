import { useState, useEffect } from "react";
import { SegmentedToggle } from "../../components/SegmentedToggle";
import {
  vitalsToday as mockVitalsToday,
  vitalsWeek as mockVitalsWeek,
  thresholds,
  calcStatsFromToday,
  calcStatsFromWeek,
} from "../../data/vitalsMock";
import { biomarkersAPI } from "../../utils/api";

export const PatientVitals = () => {
  const [timeRange, setTimeRange] = useState("today");
  const [vitalsToday, setVitalsToday] = useState(mockVitalsToday);
  const [vitalsWeek, setVitalsWeek] = useState(mockVitalsWeek);
  const [stepsData, setStepsData] = useState({
    today: 8420,
    goal: 10000,
    distance: 6.2,
    activeTime: 2.5,
    streak: 7,
    hourlySteps: [
      { hour: "6 AM", steps: 120 },
      { hour: "7 AM", steps: 540 },
      { hour: "8 AM", steps: 380 },
      { hour: "9 AM", steps: 650 },
      { hour: "10 AM", steps: 480 },
      { hour: "11 AM", steps: 720 },
      { hour: "12 PM", steps: 890 },
      { hour: "1 PM", steps: 310 },
      { hour: "2 PM", steps: 580 },
      { hour: "3 PM", steps: 920 },
      { hour: "4 PM", steps: 680 },
      { hour: "5 PM", steps: 780 },
      { hour: "6 PM", steps: 520 },
      { hour: "7 PM", steps: 340 },
    ],
  });
  const [caloriesData, setCaloriesData] = useState({
    today: 2280,
    totalBurned: 2280,
    active: 860,
    resting: 1420,
    breakdown: [
      { label: "Resting", value: 1420, color: "#f59e0b" },
      { label: "Walking", value: 380, color: "#f59e0b" },
      { label: "Exercise", value: 400, color: "#f59e0b" },
      { label: "Other", value: 80, color: "#f59e0b" },
    ],
  });

  // Fetch biomarker data from backend
  useEffect(() => {
    // Fetch current readings for steps/calories
    biomarkersAPI.getCurrent()
      .then((data) => {
        const r = data?.current_readings;
        if (!r) return;
        if (r.steps) {
          setStepsData((prev) => ({ ...prev, today: r.steps.value }));
        }
        if (r.calories) {
          const cal = Math.round(r.calories.value);
          setCaloriesData((prev) => ({ ...prev, today: cal, totalBurned: cal }));
        }
      })
      .catch(() => { });

    // Fetch history for heart rate / spo2 charts
    biomarkersAPI.getHistory({ limit: 50 })
      .then((data) => {
        if (!data?.readings || data.readings.length === 0) return;
        const readings = data.readings.reverse(); // oldest first
        const hrReadings = readings.filter((r) => r.heart_rate != null);
        const spo2Readings = readings.filter((r) => r.spo2 != null);

        if (hrReadings.length > 0) {
          const hrToday = hrReadings.map((r) => ({
            t: r.recorded_at,
            v: Math.round(r.heart_rate),
          }));
          setVitalsToday((prev) => ({ ...prev, heartRate: hrToday }));
        }
        if (spo2Readings.length > 0) {
          const spo2Today = spo2Readings.map((r) => ({
            t: r.recorded_at,
            v: Math.round(r.spo2),
          }));
          setVitalsToday((prev) => ({ ...prev, spo2: spo2Today }));
        }
      })
      .catch(() => { });
  }, []);

  const hrStats =
    timeRange === "today"
      ? calcStatsFromToday(vitalsToday.heartRate)
      : calcStatsFromWeek(vitalsWeek.heartRate);

  const spo2Stats =
    timeRange === "today"
      ? calcStatsFromToday(vitalsToday.spo2)
      : calcStatsFromWeek(vitalsWeek.spo2);

  // Warning detection
  const hrWarning =
    hrStats.peak > thresholds.heartRate.high ||
    hrStats.resting < thresholds.heartRate.low;
  const spo2Warning = spo2Stats.current < thresholds.spo2.low;

  // Calculate time in range for SpO2
  const spo2InRange = vitalsToday.spo2.filter(d => d.v >= thresholds.spo2.low && d.v <= thresholds.spo2.high).length;
  const spo2TimeInRange = Math.round((spo2InRange / vitalsToday.spo2.length) * 100);

  const stepsProgress = (stepsData.today / stepsData.goal) * 100;

  const StatBox = ({ label, value, unit }) => (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "12px",
      padding: "16px 20px",
      textAlign: "center",
    }}>
      <div style={{
        color: "#64748b",
        fontSize: "11px",
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: "1px",
        marginBottom: "8px",
      }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "4px" }}>
        <span style={{
          color: "#f1f5f9",
          fontSize: "28px",
          fontWeight: "800",
          letterSpacing: "-1px",
        }}>
          {value}
        </span>
        <span style={{ color: "#64748b", fontSize: "14px", fontWeight: "600" }}>
          {unit}
        </span>
      </div>
    </div>
  );

  const LineChart = ({ data, color, label, showArea = true }) => {
    const isToday = Array.isArray(data) && data[0]?.t;
    const values = isToday ? data.map(d => d.v) : data.map(d => d.avg || d.v);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    const padding = 40;
    const width = 800;
    const height = 200;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = values.map((val, i) => {
      const x = padding + (i / (values.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((val - min) / range) * chartHeight;
      return { x, y, val };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

    return (
      <div style={{ position: "relative", width: "100%", height: "240px" }}>
        <svg width="100%" height="240" viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={i}
              x1={padding}
              y1={padding + (chartHeight / 4) * i}
              x2={width - padding}
              y2={padding + (chartHeight / 4) * i}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          ))}

          {/* Area fill */}
          {showArea && (
            <path
              d={areaD}
              fill={`url(#gradient-${label})`}
            />
          )}

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
            style={{
              animation: "drawLine 1.5s ease-out forwards",
              strokeDasharray: 1000,
              strokeDashoffset: 1000,
            }}
          />

          {/* Data points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r="5"
                fill={color}
                stroke="#0f172a"
                strokeWidth="2"
                style={{
                  animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
                  cursor: "pointer",
                }}
              />
            </g>
          ))}

          {/* X-axis labels */}
          {points.map((p, i) => {
            if (i % (isToday ? 2 : 1) !== 0 && i !== points.length - 1) return null;
            const timeLabel = isToday
              ? new Date(data[i].t).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
              : data[i].day;

            return (
              <text
                key={`label-${i}`}
                x={p.x}
                y={height - 10}
                textAnchor="middle"
                fill="#64748b"
                fontSize="10"
                fontWeight="600"
              >
                {timeLabel}
              </text>
            );
          })}
        </svg>

        <style>{`
          @keyframes drawLine {
            to { strokeDashoffset: 0; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    );
  };

  const BarChart = ({ data, maxValue, color }) => (
    <div style={{ height: "180px", display: "flex", alignItems: "flex-end", gap: "8px", padding: "20px 0 0" }}>
      {data.map((item, i) => {
        const heightPct = (item.steps || item.value) / maxValue * 100;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <div style={{
              width: "100%",
              height: `${heightPct}%`,
              background: `linear-gradient(to top, ${color}, ${color}dd)`,
              borderRadius: "6px 6px 0 0",
              minHeight: "8px",
              transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: `0 0 20px ${color}44`,
              animation: `fadeUp 0.6s ease ${i * 0.05}s both`,
            }} />
            <div style={{ color: "#64748b", fontSize: "9px", fontWeight: "600", textAlign: "center" }}>
              {item.hour || item.label}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.85; }
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .vital-card {
          background: linear-gradient(135deg, #0f172a, #1e293b);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.4);
          position: relative;
          overflow: hidden;
          margin-bottom: 32px;
        }
        
        .vital-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--accent-color), transparent);
          box-shadow: 0 0 20px var(--accent-color);
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .stat-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
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
          top: "-250px",
          right: "-250px",
          width: "700px",
          height: "700px",
          background: "radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
          animation: "pulse 12s ease-in-out infinite",
        }} />

        {/* Header */}
        <div style={{
          marginBottom: "40px",
          animation: "fadeUp 0.8s ease both",
          position: "relative",
          zIndex: 1,
        }}>
          <p style={{
            color: "#ef4444",
            fontSize: "12px",
            fontWeight: "700",
            letterSpacing: "2.5px",
            textTransform: "uppercase",
            margin: "0 0 10px 0",
            opacity: 0.9,
          }}>
            Health Monitoring
          </p>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}>
            <div>
              <h1 className="gradient-text" style={{
                fontSize: "42px",
                fontWeight: "800",
                margin: 0,
                letterSpacing: "-1.5px",
                lineHeight: 1.1,
              }}>
                Vital Signs
              </h1>
              <p style={{
                color: "#64748b",
                fontSize: "15px",
                margin: "8px 0 0 0",
              }}>
                Detailed view of your biomarker data and health metrics
              </p>
            </div>

            <SegmentedToggle
              options={[
                { label: "Today", value: "today" },
                { label: "This Week", value: "week" },
              ]}
              value={timeRange}
              onChange={setTimeRange}
            />
          </div>
        </div>

        {/* Heart Rate Section */}
        <div style={{
          animation: "fadeUp 0.8s ease 0.15s both",
          position: "relative",
          zIndex: 1,
        }}>
          <div className="vital-card" style={{ "--accent-color": "#ef4444" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "rgba(239,68,68,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  filter: "drop-shadow(0 0 16px rgba(239,68,68,0.4))",
                }}>
                  ❤️
                </div>
                <div>
                  <h2 style={{
                    color: "#f1f5f9",
                    fontSize: "20px",
                    fontWeight: "700",
                    margin: 0,
                    letterSpacing: "-0.5px",
                  }}>
                    Heart Rate
                  </h2>
                  <p style={{ color: "#64748b", fontSize: "13px", margin: "2px 0 0 0" }}>
                    Detailed heart rate monitoring and trends
                  </p>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{
                  color: "#ef4444",
                  fontSize: "36px",
                  fontWeight: "900",
                  letterSpacing: "-1.5px",
                  lineHeight: 1,
                  textShadow: "0 0 30px rgba(239,68,68,0.5)",
                }}>
                  {hrStats.current}
                  <span style={{ fontSize: "16px", color: "#64748b", fontWeight: "600", marginLeft: "4px" }}>BPM</span>
                </div>
                <div className="status-badge" style={{
                  background: hrWarning ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
                  border: hrWarning ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(16,185,129,0.3)",
                  color: hrWarning ? "#ef4444" : "#10b981",
                  marginTop: "8px",
                }}>
                  {hrWarning ? "⚠️ Warning" : "✓ Normal"}
                </div>
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
              marginBottom: "28px",
            }}>
              <StatBox label="Current" value={hrStats.current} unit="BPM" />
              <StatBox label="Resting" value={hrStats.resting} unit="BPM" />
              <StatBox label="Peak" value={hrStats.peak} unit="BPM" />
            </div>

            <LineChart
              data={timeRange === "today" ? vitalsToday.heartRate : vitalsWeek.heartRate}
              color="#ef4444"
              label="heartrate"
            />
          </div>
        </div>

        {/* SpO2 Section */}
        <div style={{
          animation: "fadeUp 0.8s ease 0.25s both",
          position: "relative",
          zIndex: 1,
        }}>
          <div className="vital-card" style={{ "--accent-color": "#3b82f6" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "rgba(59,130,246,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  filter: "drop-shadow(0 0 16px rgba(59,130,246,0.4))",
                }}>
                  💧
                </div>
                <div>
                  <h2 style={{
                    color: "#f1f5f9",
                    fontSize: "20px",
                    fontWeight: "700",
                    margin: 0,
                    letterSpacing: "-0.5px",
                  }}>
                    Blood Oxygen (SpO₂)
                  </h2>
                  <p style={{ color: "#64748b", fontSize: "13px", margin: "2px 0 0 0" }}>
                    Oxygen saturation levels throughout the day
                  </p>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{
                  color: "#3b82f6",
                  fontSize: "36px",
                  fontWeight: "900",
                  letterSpacing: "-1.5px",
                  lineHeight: 1,
                  textShadow: "0 0 30px rgba(59,130,246,0.5)",
                }}>
                  {spo2Stats.current}
                  <span style={{ fontSize: "16px", color: "#64748b", fontWeight: "600", marginLeft: "4px" }}>%</span>
                </div>
                <div className="status-badge" style={{
                  background: spo2Warning ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
                  border: spo2Warning ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(16,185,129,0.3)",
                  color: spo2Warning ? "#ef4444" : "#10b981",
                  marginTop: "8px",
                }}>
                  {spo2Warning ? "⚠️ Warning" : "✓ Excellent"}
                </div>
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
              marginBottom: "28px",
            }}>
              <StatBox label="Current" value={spo2Stats.current} unit="%" />
              <StatBox label="Average" value={Math.round((spo2Stats.current + spo2Stats.peak + spo2Stats.resting) / 3 * 10) / 10} unit="%" />
              <StatBox label="Lowest" value={spo2Stats.resting} unit="%" />
              <StatBox label="Time in Range" value={spo2TimeInRange} unit="%" />
            </div>

            <LineChart
              data={vitalsToday.spo2}
              color="#3b82f6"
              label="spo2"
            />

            <div style={{
              marginTop: "20px",
              padding: "16px 20px",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}>
              <span style={{ fontSize: "18px" }}>📊</span>
              <p style={{ color: "#64748b", fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
                Your oxygen levels are excellent and consistently within the healthy range (92-100%).
              </p>
            </div>
          </div>
        </div>

        {/* Steps & Activity Section */}
        <div style={{
          animation: "fadeUp 0.8s ease 0.35s both",
          position: "relative",
          zIndex: 1,
        }}>
          <div className="vital-card" style={{ "--accent-color": "#10b981" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "rgba(16,185,129,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                }}>
                  👟
                </div>
                <div>
                  <h2 style={{ color: "#f1f5f9", fontSize: "20px", fontWeight: "700", margin: 0 }}>
                    Steps & Activity
                  </h2>
                  <p style={{ color: "#64748b", fontSize: "13px", margin: "2px 0 0 0" }}>
                    Daily movement and activity tracking
                  </p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{
                  color: "#10b981",
                  fontSize: "36px",
                  fontWeight: "900",
                  letterSpacing: "-1.5px",
                  lineHeight: 1,
                }}>
                  {stepsData.today.toLocaleString()}
                </div>
                <p style={{ color: "#64748b", fontSize: "13px", margin: "4px 0 0 0" }}>
                  of {stepsData.goal.toLocaleString()} goal
                </p>
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Daily Goal Progress
                </span>
                <span style={{ color: "#10b981", fontSize: "14px", fontWeight: "800" }}>
                  {Math.round(stepsProgress)}%
                </span>
              </div>
              <div style={{
                height: "12px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "999px",
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: `${stepsProgress}%`,
                  background: "linear-gradient(90deg, #10b981, #059669)",
                  borderRadius: "999px",
                  transition: "width 2s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 0 20px rgba(16,185,129,0.5)",
                }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "28px" }}>
              <div className="stat-box">
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "16px" }}>📍</span>
                  <span style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Distance
                  </span>
                </div>
                <div style={{ color: "#f1f5f9", fontSize: "24px", fontWeight: "800", letterSpacing: "-1px" }}>
                  {stepsData.distance} <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "600" }}>km</span>
                </div>
              </div>

              <div className="stat-box">
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "16px" }}>⏱️</span>
                  <span style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Active Time
                  </span>
                </div>
                <div style={{ color: "#f1f5f9", fontSize: "24px", fontWeight: "800", letterSpacing: "-1px" }}>
                  {stepsData.activeTime} <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "600" }}>hrs</span>
                </div>
              </div>

              <div className="stat-box">
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "16px" }}>🔥</span>
                  <span style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Streak
                  </span>
                </div>
                <div style={{ color: "#f1f5f9", fontSize: "24px", fontWeight: "800", letterSpacing: "-1px" }}>
                  {stepsData.streak} <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "600" }}>days</span>
                </div>
              </div>
            </div>

            <BarChart data={stepsData.hourlySteps} maxValue={1000} color="#10b981" />
          </div>
        </div>

        {/* Calories Burned Section */}
        <div style={{
          animation: "fadeUp 0.8s ease 0.45s both",
          position: "relative",
          zIndex: 1,
        }}>
          <div className="vital-card" style={{ "--accent-color": "#f59e0b" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "rgba(245,158,11,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                }}>
                  🔥
                </div>
                <div>
                  <h2 style={{ color: "#f1f5f9", fontSize: "20px", fontWeight: "700", margin: 0 }}>
                    Calories Burned
                  </h2>
                  <p style={{ color: "#64748b", fontSize: "13px", margin: "2px 0 0 0" }}>
                    Daily energy expenditure tracking
                  </p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{
                  color: "#f59e0b",
                  fontSize: "36px",
                  fontWeight: "900",
                  letterSpacing: "-1.5px",
                  lineHeight: 1,
                }}>
                  {caloriesData.today.toLocaleString()}
                </div>
                <p style={{ color: "#64748b", fontSize: "13px", margin: "4px 0 0 0" }}>
                  calories today
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "28px" }}>
              <div className="stat-box">
                <div style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
                  Total Burned
                </div>
                <div style={{ color: "#f1f5f9", fontSize: "24px", fontWeight: "800", letterSpacing: "-1px" }}>
                  {caloriesData.totalBurned.toLocaleString()}
                </div>
              </div>

              <div className="stat-box">
                <div style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
                  Active
                </div>
                <div style={{ color: "#f1f5f9", fontSize: "24px", fontWeight: "800", letterSpacing: "-1px" }}>
                  {caloriesData.active.toLocaleString()}
                </div>
              </div>

              <div className="stat-box">
                <div style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
                  Resting
                </div>
                <div style={{ color: "#f1f5f9", fontSize: "24px", fontWeight: "800", letterSpacing: "-1px" }}>
                  {caloriesData.resting.toLocaleString()}
                </div>
              </div>
            </div>

            <BarChart data={caloriesData.breakdown} maxValue={1600} color="#f59e0b" />
          </div>
        </div>
      </div>
    </>
  );
};