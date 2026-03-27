import { useState, useEffect } from "react";
import "./goals.css";
import {
  Pencil,
  Flame,
  Footprints,
  TrendingUp,
  Pill,
  Wind,
  Dumbbell,
  Sun,
  Droplets,
  Moon,
  Smile,
} from "lucide-react";
import { biomarkersAPI } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

const GoalCard = ({
  title,
  subtitle,
  icon,
  current,
  initialTarget,
  color,
  backgroundColor,
  daysColor,
  storageKey,
}) => {
  // Load persisted target or use default
  const loadTarget = () => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) return Number(saved);
    }
    return initialTarget;
  };

  const [target, setTarget] = useState(loadTarget);
  const [editTarget, setEditTarget] = useState(loadTarget);
  const [isEditing, setIsEditing] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [showWeekly, setShowWeekly] = useState(false);

  // Calculate progress
  const calculatedPercentage = Math.min(
    Math.round((current / target) * 100),
    100
  );

  // Animation
  useEffect(() => {
    setTimeout(() => {
      setPercentage(calculatedPercentage);
    }, 200);
  }, [calculatedPercentage]);

  // Save target
  const handleSave = () => {
    const val = Number(editTarget);
    setTarget(val);
    if (storageKey) localStorage.setItem(storageKey, String(val));
    setIsEditing(false);
  };

  // Remaining amount
  const remaining = target - current;

  // Streak logic
  const todayStr = new Date().toISOString().split("T")[0];
  const streakKey = storageKey ? `${storageKey}_streak` : null;
  const streakDateKey = storageKey ? `${storageKey}_streakdate` : null;
  const pbKey = storageKey ? `${storageKey}_pb` : null;

  const loadStreak = () => {
    if (!streakKey) return 0;
    return Number(localStorage.getItem(streakKey) || 0);
  };
  const [streak, setStreak] = useState(loadStreak);

  // Update when goal achieved
  useEffect(() => {
    if (!storageKey || current <= 0) return;

    // Personal Best
    const prevPB = Number(localStorage.getItem(pbKey) || 0);
    if (current > prevPB) localStorage.setItem(pbKey, String(current));

    // Streak
    if (remaining <= 0) {
      const lastDate = localStorage.getItem(streakDateKey);
      if (lastDate !== todayStr) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        const newStreak = lastDate === yesterdayStr ? streak + 1 : 1;
        setStreak(newStreak);
        localStorage.setItem(streakKey, String(newStreak));
        localStorage.setItem(streakDateKey, todayStr);
      }
    }
  }, [current, remaining]);

  const personalBest = Number(localStorage.getItem(pbKey) || 0);

  // Random Weekly Data
  const weeklyData = Array.from({ length: 7 }, () =>
    Math.floor(Math.random() * target)
  );

  return (
    <div className="goal-card">
      {/* Header */}
      <div className="goal-header">
        <div className="goal-title">
          <div
            className="icon-box"
            style={{ borderColor: color, backgroundColor: backgroundColor }}
          >
            {icon}
          </div>
          <div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {streak > 0 && (
            <span className="streak-badge">🔥 {streak} day streak</span>
          )}
          {personalBest > 0 && (
            <span className="pb-badge">
              🏆 Best: {personalBest.toLocaleString()}
            </span>
          )}
          <button className="edit-btn" onClick={() => setIsEditing(true)}>
            <Pencil size={16} />
          </button>
        </div>
      </div>

      {isEditing ? (
        // Edit Target
        <div className="edit-section">
          <label>Daily Target</label>
          <input
            type="number"
            value={editTarget}
            onChange={(e) => setEditTarget(e.target.value)}
          />

          <div className="edit-actions">
            <button className="save-btn" onClick={handleSave}>
              Save
            </button>
            <button className="cancel-btn" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Progress circle */}
          <div
            className="progress-circle"
            style={{
              background: `conic-gradient(${color} ${percentage}%, #1e293b ${percentage}%)`,
            }}
          >
            <div className="inner-circle">
              <h2>{percentage}%</h2>
              <p>Complete</p>
            </div>
          </div>

          {/* Numbers */}
          <div className="numbers">
            <h2>
              {current.toLocaleString()}{" "}
              <span>/ {target.toLocaleString()}</span>
            </h2>
            {remaining > 0 && <p>{remaining} remaining to reach goal</p>}
            {remaining <= 0 && (
              <p className="success-text">🎉 Goal achieved today!</p>
            )}
          </div>

          {/* Weekly box */}
          <div
            className="week-box"
            onClick={() => setShowWeekly(!showWeekly)}
            style={{
              borderColor: color,
              backgroundColor: backgroundColor,
              cursor: "pointer",
            }}
          >
            {!showWeekly ? (
              <>
                {/* Week summary */}
                <div className="week-header">
                  <p style={{ color: daysColor }}>This Week</p>
                  <TrendingUp size={18} color={color} />
                </div>

                <h2 style={{ color: daysColor }}>0/7</h2>
                <span style={{ color: color }}>days goal achieved</span>
              </>
            ) : (
              /* Weekly graph */
              <div className="weekly-graph">
                {weeklyData.map((value, index) => {
                  const height = Math.min((value / target) * 100, 100);
                  return (
                    <div key={index} className="bar-wrapper">
                      <div
                        className="bar"
                        style={{
                          height: `${height}%`,
                          backgroundColor: color,
                        }}
                      />
                      <span className="day-label">
                        {["M", "T", "W", "T", "F", "S", "S"][index]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const TrackableCard = ({ storageKey, title, icon, color }) => {
  const todayStr = new Date().toISOString().split("T")[0];

  // Daily water counter
  if (title === "Water") {
    const countKey = `${storageKey}_${todayStr}`;
    const targetKey = `${storageKey}_target`;
    const [count, setCount] = useState(() =>
      Number(localStorage.getItem(countKey) || 0)
    );
    const [target] = useState(() =>
      Number(localStorage.getItem(targetKey) || 8)
    );

    // Add or subtract glasses
    const adjust = (delta) => {
      const next = Math.max(0, count + delta);
      setCount(next);
      localStorage.setItem(countKey, String(next));
    };

    // Check if goal achieved
    const achieved = count >= target;
    return (
      <div
        className="trackable-card"
        style={{ borderColor: achieved ? color : "#1e293b" }}
      >
        <div className="trackable-header">
          <div className="quicklog-icon">{icon}</div>
          <div className="trackable-info">
            <div className="trackable-title">Water Intake</div>
            <div className="trackable-sub">Daily goal: {target} glasses</div>
          </div>
          {achieved && (
            <span
              className="streak-badge"
              style={{ color, borderColor: color, background: `${color}18` }}
            >
              ✓ Done
            </span>
          )}
        </div>
        <div className="trackable-counter">
          <button className="counter-btn" onClick={() => adjust(-1)}>
            −
          </button>
          <div className="counter-display" style={{ color }}>
            <span className="counter-num">{count}</span>
            <span className="counter-unit">/ {target} glasses</span>
          </div>
          <button className="counter-btn" onClick={() => adjust(1)}>
            +
          </button>
        </div>
        <div className="trackable-bar-bg">
          <div
            className="trackable-bar-fill"
            style={{
              width: `${Math.min((count / target) * 100, 100)}%`,
              background: color,
            }}
          />
        </div>
      </div>
    );
  }

  // Sleep time calculator 
  if (title === "Sleep") {
    const sleepKey = `${storageKey}_sleep_${todayStr}`;
    const wakeKey = `${storageKey}_wake_${todayStr}`;
    const [sleep, setSleep] = useState(
      () => localStorage.getItem(sleepKey) || ""
    );
    const [wake, setWake] = useState(() => localStorage.getItem(wakeKey) || "");

    // Calculate sleep hours
    const calcHours = () => {
      if (!sleep || !wake) return null;
      const [sh, sm] = sleep.split(":").map(Number);
      const [wh, wm] = wake.split(":").map(Number);
      let mins = wh * 60 + wm - (sh * 60 + sm);
      if (mins < 0) mins += 24 * 60;
      return (mins / 60).toFixed(1);
    };

    const hours = calcHours();
    const achieved = hours !== null && parseFloat(hours) >= 8;

    return (
      <div
        className="trackable-card"
        style={{ borderColor: achieved ? color : "#1e293b" }}
      >
        <div className="trackable-header">
          <div className="quicklog-icon">{icon}</div>
          <div className="trackable-info">
            <div className="trackable-title">Sleep Tracker</div>
            <div className="trackable-sub" style={{ margin: 0 }}>
              Goal: 8 hours
            </div>
          </div>
          {achieved && (
            <span
              className="streak-badge"
              style={{
                color,
                borderColor: color,
                background: `${color}18`,
              }}
            >
              ✓ Done
            </span>
          )}
        </div>
        <div className="sleep-inputs">
          <div className="sleep-field">
            <label>Slept at</label>
            <input
              type="time"
              value={sleep}
              onChange={(e) => {
                setSleep(e.target.value);
                localStorage.setItem(sleepKey, e.target.value);
              }}
            />
          </div>
          <div className="sleep-divider">→</div>
          <div className="sleep-field">
            <label>Woke up</label>
            <input
              type="time"
              value={wake}
              onChange={(e) => {
                setWake(e.target.value);
                localStorage.setItem(wakeKey, e.target.value);
              }}
            />
          </div>
        </div>
        {hours !== null && (
          <div
            className="sleep-result"
            style={{ color: achieved ? color : "#94a3b8" }}
          >
            {achieved
              ? `🌙 ${hours} hrs — great sleep!`
              : `😴 ${hours} hrs — try for 8`}
          </div>
        )}
      </div>
    );
  }

  // Exercise timer
  if (title === "Exercise") {
    const doneKey = `${storageKey}_done_${todayStr}`;
    const targetKey = `${storageKey}_target`;
    const [done, setDone] = useState(() =>
      Number(localStorage.getItem(doneKey) || 0)
    );
    const [target, setTarget] = useState(() =>
      Number(localStorage.getItem(targetKey) || 30)
    );
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(target);

    // Add or subtract time
    const adjust = (delta) => {
      const next = Math.max(0, done + delta);
      setDone(next);
      localStorage.setItem(doneKey, String(next));
    };

    // Save new target
    const saveTarget = () => {
      setTarget(draft);
      localStorage.setItem(targetKey, String(draft));
      setEditing(false);
    };

    const achieved = done >= target;
    return (
      <div
        className="trackable-card"
        style={{ borderColor: achieved ? color : "#1e293b" }}
      >
        <div className="trackable-header">
          <div className="quicklog-icon">{icon}</div>
          <div className="trackable-info">
            <div className="trackable-title">Exercise Time</div>
            <div className="trackable-sub">Daily goal: {target} min</div>
          </div>
          {achieved && (
            <span
              className="streak-badge"
              style={{ color, borderColor: color, background: `${color}18` }}
            >
              ✓ Done
            </span>
          )}
          <button
            className="edit-btn"
            onClick={() => {
              setDraft(target);
              setEditing(!editing);
            }}
          >
            <Pencil size={14} />
          </button>
        </div>

        {editing && (
          <div className="exercise-edit-box">
            <input
              type="number"
              value={draft}
              onChange={(e) => setDraft(Number(e.target.value))}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #1e293b",
                background: "#111827",
                color: "#f1f5f9",
                fontSize: "14px",
                outline: "none",
              }}
            />
            <button
              className="save-btn"
              style={{ padding: "8px 14px" }}
              onClick={saveTarget}
            >
              Save
            </button>
            <button
              className="cancel-btn"
              style={{ padding: "8px 14px" }}
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        )}
        <div className="trackable-counter">
          <button className="counter-btn" onClick={() => adjust(-5)}>
            −5
          </button>
          <div className="counter-display" style={{ color }}>
            <span className="counter-num">{done}</span>
            <span className="counter-unit">/ {target} min</span>
          </div>
          <button className="counter-btn" onClick={() => adjust(5)}>
            +5
          </button>
        </div>
        <div className="trackable-bar-bg">
          <div
            className="trackable-bar-fill"
            style={{
              width: `${Math.min((done / target) * 100, 100)}%`,
              background: color,
            }}
          />
        </div>
      </div>
    );
  }

  // Daily mood picker
  if (title === "Mood") {
    const moodKey = `${storageKey}_${todayStr}`;
    const moods = [
      { label: "Great", emoji: "😄", value: 5 },
      { label: "Good", emoji: "🙂", value: 4 },
      { label: "Okay", emoji: "😐", value: 3 },
      { label: "Low", emoji: "😔", value: 2 },
      { label: "Bad", emoji: "😞", value: 1 },
    ];
    const [selected, setSelected] = useState(() =>
      Number(localStorage.getItem(moodKey) || 0)
    );

    // Save selected mood
    const pick = (val) => {
      setSelected(val);
      localStorage.setItem(moodKey, String(val));
    };

    const achieved = selected > 0;
    const selectedMood = moods.find((m) => m.value === selected);

    return (
      <div
        className="trackable-card"
        style={{ borderColor: achieved ? color : "#1e293b" }}
      >
        <div className="trackable-header">
          <div className="quicklog-icon">{icon}</div>
          <div className="trackable-info">
            <div className="trackable-title">Mood Check-in</div>
            <div className="trackable-sub" style={{ margin: 0 }}>
              How are you feeling?
            </div>
          </div>
          {achieved && (
            <span
              className="streak-badge"
              style={{ color, borderColor: color, background: `${color}18` }}
            >
              {selectedMood?.emoji} {selectedMood?.label}
            </span>
          )}
        </div>
        <div className="mood-grid">
          {moods.map((m) => (
            <button
              key={m.value}
              onClick={() => pick(m.value)}
              className={`mood-btn ${
                selected === m.value ? "mood-selected" : ""
              }`}
              style={
                selected === m.value
                  ? {
                      borderColor: color,
                      background: `${color}18`,
                      color: "#f1f5f9",
                    }
                  : {}
              }
            >
              <span style={{ fontSize: "22px" }}>{m.emoji}</span>
              <span
                style={{
                  fontSize: "11px",
                  color: selected === m.value ? "#f1f5f9" : "#64748b",
                }}
              >
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

const QuickLogItem = ({ item }) => {
  const todayKey = `${item.key}_${new Date().toISOString().split("T")[0]}`;
  const [checked, setChecked] = useState(
    () => localStorage.getItem(todayKey) === "1"
  );

  // Flip checked state
  const toggle = () => {
    const next = !checked;
    setChecked(next);
    localStorage.setItem(todayKey, next ? "1" : "0");
  };
  return (
    <div
      className={`quicklog-item ${checked ? "checked" : ""}`}
      onClick={toggle}
      style={{
        borderColor: checked ? item.color : "#1e293b",
        backgroundColor: checked ? `${item.color}18` : undefined,
      }}
    >
      <div className="quicklog-icon">{item.icon}</div>
      <span className="quicklog-label">{item.label}</span>
      <span
        className="quicklog-check"
        style={{ background: checked ? item.color : "#1e293b" }}
      >
        {checked ? "✓" : ""}
      </span>
    </div>
  );
};

export const Goals = () => {
  const { user } = useAuth();
  const [currentSteps, setCurrentSteps] = useState(0);
  const [currentCalories, setCurrentCalories] = useState(0);

  const fetchGoalData = () => {
    biomarkersAPI
      .getCurrent()
      .then((data) => {
        const r = data?.current_readings;
        if (!r) return;
        if (r.steps) setCurrentSteps(r.steps.value);
        if (r.calories) setCurrentCalories(Math.round(r.calories.value));
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchGoalData();
    const timer = setTimeout(fetchGoalData, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="goal-dashboard page-enter">
      <div className="goal-dashboard-inner tab-animate">
        <div className="page-header">
          <p className="page-label">HEALTHCARE</p>
          <h1>Goals</h1>
          <p className="page-subtext">Set and track your fitness goals here</p>
        </div>

        <div className="goals-container">
          {/* Steps Goal */}
          <GoalCard
            title="Steps Goal"
            subtitle="Daily Step Target"
            current={currentSteps}
            initialTarget={10000}
            color="#6366f1"
            backgroundColor="rgba(99,102,241,0.1)"
            daysColor="#6366f1"
            icon={<Footprints color="#6366f1" size={20} />}
            storageKey={user?.id ? `healix_goal_steps_${user.id}` : null}
          />

          {/* Calories Goal */}
          <GoalCard
            title="Calories Goal"
            subtitle="Daily Calorie Burn Target"
            current={currentCalories}
            initialTarget={3000}
            color="#f97316"
            backgroundColor="rgba(249,115,22,0.1)"
            daysColor="#f97316"
            icon={<Flame color="#f97316" size={20} />}
            storageKey={user?.id ? `healix_goal_calories_${user.id}` : null}
          />
        </div>

        {/* Trackable Goals */}
        <div className="quicklog-panel">
          <div className="quicklog-header">
            <h2 className="section-title">Health Habits</h2>
            <p className="section-subtext">Log your daily habits</p>
          </div>
          <div className="trackable-grid">
            <TrackableCard
              storageKey={`healix_tr_water_${user?.id}`}
              title="Water"
              icon={<Droplets size={18} color="#3b82f6" />}
              color="#3b82f6"
            />
            <TrackableCard
              storageKey={`healix_tr_sleep_${user?.id}`}
              title="Sleep"
              icon={<Moon size={18} color="#8b5cf6" />}
              color="#8b5cf6"
            />
            <TrackableCard
              storageKey={`healix_tr_exercise_${user?.id}`}
              title="Exercise"
              icon={<Dumbbell size={18} color="#10b981" />}
              color="#10b981"
            />
            <TrackableCard
              storageKey={`healix_tr_mood_${user?.id}`}
              title="Mood"
              icon={<Smile size={18} color="#f59e0b" />}
              color="#f59e0b"
            />
          </div>
        </div>

        {/* Quick Log Panel */}
        <div className="quicklog-panel">
          <div className="quicklog-header">
            <h2 className="section-title">Today's Checklist</h2>
            <p className="section-subtext">Tap to log — resets each day</p>
          </div>
          <div className="quicklog-grid">
            {[
              {
                key: `healix_ql_mindful_${user?.id}`,
                label: "Meditation",
                icon: <Wind size={18} color="#6366f1" />,
                color: "#6366f1",
              },
              {
                key: `healix_ql_stretch_${user?.id}`,
                label: "Stretching",
                icon: <Dumbbell size={18} color="#3b82f6" />,
                color: "#3b82f6",
              },
              {
                key: `healix_ql_outside_${user?.id}`,
                label: "Went outside",
                icon: <Sun size={18} color="#10b981" />,
                color: "#10b981",
              },
              {
                key: `healix_ql_meds_${user?.id}`,
                label: "Took medication",
                icon: <Pill size={18} color="#8b5cf6" />,
                color: "#8b5cf6",
              },
            ].map((item) => (
              <QuickLogItem key={item.key} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
