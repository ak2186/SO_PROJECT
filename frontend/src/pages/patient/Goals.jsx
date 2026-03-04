import { useState, useEffect } from "react";
import "./goals.css";
import { Pencil, Flame, Footprints, TrendingUp } from "lucide-react";

const GoalCard = ({
  title,
  subtitle,
  icon,
  current,
  initialTarget,
  color,
  backgroundColor,
  daysColor,
}) => {
  // Goal state
  const [target, setTarget] = useState(initialTarget);
  const [editTarget, setEditTarget] = useState(initialTarget);
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
    setTarget(Number(editTarget));
    setIsEditing(false);
  };

  // Remaining amount
  const remaining = target - current;

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

        {/* Edit button */}
        <button className="edit-btn" onClick={() => setIsEditing(true)}>
          <Pencil size={16} />
        </button>
      </div>

      {isEditing ? (
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

export const Goals = () => {
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
            current={8459}
            initialTarget={10000}
            color="#6366f1"
            backgroundColor="rgba(99,102,241,0.1)"
            daysColor="#6366f1"
            icon={<Footprints color="#6366f1" size={20} />}
          />

          {/* Calories Goal */}
          <GoalCard
            title="Calories Goal"
            subtitle="Daily Calorie Burn Target"
            current={1230}
            initialTarget={3000}
            color="#f97316"
            backgroundColor="rgba(249,115,22,0.1)"
            daysColor="#f97316"
            icon={<Flame color="#f97316" size={20} />}
          />
        </div>
      </div>
    </div>
  );
};
