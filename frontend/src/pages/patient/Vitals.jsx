import { useState, useEffect } from "react";
import { SegmentedToggle } from "../../components/SegmentedToggle";
import {
  thresholds,
  calcStatsFromToday,
  calcStatsFromWeek,
} from "../../data/vitalsMock";
import { biomarkersAPI, googleFitAPI } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

export const PatientVitals = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("today");
  const [vitalsToday, setVitalsToday] = useState({ heartRate: [], spo2: [] });
  const [vitalsWeek, setVitalsWeek] = useState({ heartRate: [], spo2: [] });
  const [stepsData, setStepsData] = useState({
    today: 0,
    goal: 10000,
    distance: 0,
    activeTime: 0,
    streak: 0,
    hourlySteps: [],
  });
  const [caloriesData, setCaloriesData] = useState({
    today: 0,
    totalBurned: 0,
    active: 0,
    resting: 0,
    breakdown: [],
  });

  // Apply timeseries data from the sync/today response to state
  const applyTimeseries = (data) => {
    const ts = data?.timeseries;
    const d = data?.synced_data;
    if (!ts && !d) return;

    if (ts?.heart_rate?.length) {
      setVitalsToday((prev) => ({
        ...prev,
        heartRate: ts.heart_rate.map((p) => ({ t: p.t, v: Math.round(p.v) })),
      }));
    }
    if (ts?.spo2?.length) {
      setVitalsToday((prev) => ({
        ...prev,
        spo2: ts.spo2.map((p) => ({ t: p.t, v: Math.round(p.v) })),
      }));
    }
    if (d?.steps != null) {
      setStepsData((prev) => ({
        ...prev,
        today: d.steps,
        hourlySteps: ts?.steps || [],
      }));
    }
    if (d?.calories != null) {
      const cal = Math.round(d.calories);
      setCaloriesData((prev) => ({
        ...prev,
        today: cal,
        totalBurned: cal,
        breakdown: ts?.calories || [],
      }));
    }
  };

  // Fetch stored biomarker data from DB (fast, cached)
  const fetchBiomarkerData = () => {
    // Quick: load today's stored timeseries from the /today endpoint
    googleFitAPI.today()
      .then(applyTimeseries)
      .catch(() => { });

    // Also fetch current summary readings (for non-GFit data like BP)
    biomarkersAPI.getCurrent()
      .then((data) => {
        const r = data?.current_readings;
        if (!r) return;
        if (r.steps && !stepsData.today) {
          setStepsData((prev) => ({ ...prev, today: r.steps.value }));
        }
        if (r.calories && !caloriesData.today) {
          const cal = Math.round(r.calories.value);
          setCaloriesData((prev) => ({ ...prev, today: cal, totalBurned: cal }));
        }
      })
      .catch(() => { });
  };

  useEffect(() => {
    // 1. Show cached timeseries immediately
    fetchBiomarkerData();

    // 2. If Google Fit connected, sync fresh data from Google, then apply directly
    if (user?.id && localStorage.getItem(`healix_gfit_connected_${user.id}`) === "true") {
      googleFitAPI.sync()
        .then(applyTimeseries)
        .catch(() => { });
    }
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
  const spo2TimeInRange = vitalsToday.spo2.length > 0 ? Math.round((spo2InRange / vitalsToday.spo2.length) * 100) : 0;

  const stepsProgress = stepsData.goal > 0 ? (stepsData.today / stepsData.goal) * 100 : 0;

  // Data availability flags
  const hasHrData = vitalsToday.heartRate.length > 0 || vitalsWeek.heartRate.length > 0;
  const hasSpo2Data = vitalsToday.spo2.length > 0 || vitalsWeek.spo2.length > 0;
  const hasStepsData = stepsData.today > 0;
  const hasCaloriesData = caloriesData.today > 0;
  const hasAnyData = hasHrData || hasSpo2Data || hasStepsData || hasCaloriesData;

  const StatBox = ({ label, value, unit }) => (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "12px",
      padding: "16px 20px",
      textAlign: "center",
    }}>
      <div style={{
        color: "var(--text-subtle)",
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
          color: "var(--text)",
          fontSize: "28px",
          fontWeight: "800",
          letterSpacing: "-1px",
        }}>
          {value}
        </span>
        <span style={{ color: "var(--text-subtle)", fontSize: "14px", fontWeight: "600" }}>
          {unit}
        </span>
      </div>
    </div>
  );

  const LineChart = ({ data, color, label, showArea = true }) => {
    if (!data || data.length < 2) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", color: "var(--text-faint)", fontSize: "14px", fontWeight: "600" }}>
          No chart data available
        </div>
      );
    }
    const isToday = Array.isArray(data) && data[0]?.t;

    // --- Downsample dense data (e.g. hundreds of heart-rate readings) ---
    const MAX_POINTS = 60;
    let displayData = data;
    if (data.length > MAX_POINTS) {
      // Pick evenly-spaced indices, always including first and last
      const step = (data.length - 1) / (MAX_POINTS - 1);
      displayData = [];
      for (let i = 0; i < MAX_POINTS; i++) {
        const idx = Math.round(i * step);
        displayData.push(data[idx]);
      }
    }

    const values = isToday ? displayData.map(d => d.v) : displayData.map(d => d.avg || d.v);
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

    // --- Decide how many x-axis labels & dots to show ---
    const MAX_LABELS = 8;
    const labelStep = Math.max(1, Math.floor(points.length / MAX_LABELS));
    const isDense = displayData.length > 20;

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

          {/* Y-axis labels */}
          {[0, 1, 2, 3, 4].map(i => {
            const yVal = Math.round(max - (i / 4) * range);
            return (
              <text
                key={`y-${i}`}
                x={padding - 6}
                y={padding + (chartHeight / 4) * i + 4}
                textAnchor="end"
                fill="#475569"
                fontSize="9"
                fontWeight="600"
              >
                {yVal}
              </text>
            );
          })}

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
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {/* Data points — only show dots on label positions for dense data */}
          {points.map((p, i) => {
            if (isDense && i % labelStep !== 0 && i !== points.length - 1) return null;
            return (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isDense ? 3.5 : 5}
                  fill={color}
                  stroke="#0f172a"
                  strokeWidth="2"
                  style={{ cursor: "pointer" }}
                />
                {/* Tooltip on hover */}
                <title>{`${Math.round(p.val)}`}</title>
              </g>
            );
          })}

          {/* X-axis labels — evenly spaced, max ~8 labels */}
          {points.map((p, i) => {
            if (i % labelStep !== 0 && i !== points.length - 1) return null;
            const timeLabel = isToday
              ? new Date(displayData[i].t).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
              : displayData[i].day;

            return (
              <text
                key={`label-${i}`}
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                fill="#64748b"
                fontSize="9"
                fontWeight="600"
              >
                {timeLabel}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  const BarChart = ({ data, maxValue, color }) => {
    if (!data || data.length === 0) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "180px", color: "#475569", fontSize: "14px", fontWeight: "600" }}>
          No activity data available
        </div>
      );
    }
    return (
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
              <div style={{ color: "var(--text-subtle)", fontSize: "9px", fontWeight: "600", textAlign: "center" }}>
                {item.hour || item.label}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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
        [data-theme="light"] .gradient-text {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .vital-card {
          background: linear-gradient(135deg, var(--bg-3), var(--border-solid));
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
                color: "var(--text-subtle)",
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
                    color: "var(--text)",
                    fontSize: "20px",
                    fontWeight: "700",
                    margin: 0,
                    letterSpacing: "-0.5px",
                  }}>
                    Heart Rate
                  </h2>
                  <p style={{ color: "var(--text-subtle)", fontSize: "13px", margin: "2px 0 0 0" }}>
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
                  {hasHrData ? hrStats.current : "—"}
                  <span style={{ fontSize: "16px", color: "var(--text-subtle)", fontWeight: "600", marginLeft: "4px" }}>BPM</span>
                </div>
                <div className="status-badge" style={{
                  background: hrWarning ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
                  border: hrWarning ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(16,185,129,0.3)",
                  color: hrWarning ? "#ef4444" : "#10b981",
                  marginTop: "8px",
                }}>
                  {!hasHrData ? "No data" : hrWarning ? "⚠️ Warning" : "✓ Normal"}
                </div>
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
              marginBottom: "28px",
            }}>
              <StatBox label="Current" value={hasHrData ? hrStats.current : "—"} unit="BPM" />
              <StatBox label="Resting" value={hasHrData ? hrStats.resting : "—"} unit="BPM" />
              <StatBox label="Peak" value={hasHrData ? hrStats.peak : "—"} unit="BPM" />
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
                    color: "var(--text)",
                    fontSize: "20px",
                    fontWeight: "700",
                    margin: 0,
                    letterSpacing: "-0.5px",
                  }}>
                    Blood Oxygen (SpO₂)
                  </h2>
                  <p style={{ color: "var(--text-subtle)", fontSize: "13px", margin: "2px 0 0 0" }}>
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
                  {hasSpo2Data ? spo2Stats.current : "—"}
                  <span style={{ fontSize: "16px", color: "var(--text-subtle)", fontWeight: "600", marginLeft: "4px" }}>%</span>
                </div>
                <div className="status-badge" style={{
                  background: spo2Warning ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
                  border: spo2Warning ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(16,185,129,0.3)",
                  color: spo2Warning ? "#ef4444" : "#10b981",
                  marginTop: "8px",
                }}>
                  {!hasSpo2Data ? "No data" : spo2Warning ? "⚠️ Warning" : "✓ Excellent"}
                </div>
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
              marginBottom: "28px",
            }}>
              <StatBox label="Current" value={hasSpo2Data ? spo2Stats.current : "—"} unit="%" />
              <StatBox label="Average" value={hasSpo2Data ? Math.round((spo2Stats.current + spo2Stats.peak + spo2Stats.resting) / 3 * 10) / 10 : "—"} unit="%" />
              <StatBox label="Lowest" value={hasSpo2Data ? spo2Stats.resting : "—"} unit="%" />
              <StatBox label="Time in Range" value={hasSpo2Data ? spo2TimeInRange : "—"} unit="%" />
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
              <p style={{ color: "var(--text-subtle)", fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
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
                  <h2 style={{ color: "var(--text)", fontSize: "20px", fontWeight: "700", margin: 0 }}>
                    Steps & Activity
                  </h2>
                  <p style={{ color: "var(--text-subtle)", fontSize: "13px", margin: "2px 0 0 0" }}>
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
                  {hasStepsData ? stepsData.today.toLocaleString() : "—"}
                </div>
                <p style={{ color: "var(--text-subtle)", fontSize: "13px", margin: "4px 0 0 0" }}>
                  {hasStepsData ? `of ${stepsData.goal.toLocaleString()} goal` : "No data yet"}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
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
                  <span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Distance
                  </span>
                </div>
                <div style={{ color: "var(--text)", fontSize: "24px", fontWeight: "800", letterSpacing: "-1px" }}>
                  {stepsData.distance} <span style={{ fontSize: "14px", color: "var(--text-subtle)", fontWeight: "600" }}>km</span>
                </div>
              </div>

              <div className="stat-box">
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "16px" }}>⏱️</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Active Time
                  </span>
                </div>
                <div style={{ color: "var(--text)", fontSize: "24px", fontWeight: "800", letterSpacing: "-1px" }}>
                  {stepsData.activeTime} <span style={{ fontSize: "14px", color: "var(--text-subtle)", fontWeight: "600" }}>hrs</span>
                </div>
              </div>

              <div className="stat-box">
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "16px" }}>🔥</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Streak
                  </span>
                </div>
                <div style={{ color: "var(--text)", fontSize: "24px", fontWeight: "800", letterSpacing: "-1px" }}>
                  {stepsData.streak} <span style={{ fontSize: "14px", color: "var(--text-subtle)", fontWeight: "600" }}>days</span>
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
                  <h2 style={{ color: "var(--text)", fontSize: "20px", fontWeight: "700", margin: 0 }}>
                    Calories Burned
                  </h2>
                  <p style={{ color: "var(--text-subtle)", fontSize: "13px", margin: "2px 0 0 0" }}>
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
                  {hasCaloriesData ? caloriesData.today.toLocaleString() : "—"}
                </div>
                <p style={{ color: "var(--text-subtle)", fontSize: "13px", margin: "4px 0 0 0" }}>
                  {hasCaloriesData ? "calories today" : "No data yet"}
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "28px" }}>
              <div className="stat-box">
                <div style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
                  Total Burned
                </div>
                <div style={{ color: "var(--text)", fontSize: "24px", fontWeight: "800", letterSpacing: "-1px" }}>
                  {caloriesData.totalBurned.toLocaleString()}
                </div>
              </div>

              <div className="stat-box">
                <div style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
                  Active
                </div>
                <div style={{ color: "var(--text)", fontSize: "24px", fontWeight: "800", letterSpacing: "-1px" }}>
                  {caloriesData.active.toLocaleString()}
                </div>
              </div>

              <div className="stat-box">
                <div style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
                  Resting
                </div>
                <div style={{ color: "var(--text)", fontSize: "24px", fontWeight: "800", letterSpacing: "-1px" }}>
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