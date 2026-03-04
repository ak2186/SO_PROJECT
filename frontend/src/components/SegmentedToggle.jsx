export const SegmentedToggle = ({ options, value, onChange }) => {
  return (
    <div
      style={{
        display: "inline-flex",
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        border: "1px solid rgba(59,130,246,0.2)",
        borderRadius: 999,
        padding: 6,
        gap: 6,
        boxShadow: "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              border: "none",
              borderRadius: 999,
              padding: "10px 24px",
              background: active
                ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                : "transparent",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "14px",
              color: active ? "#fff" : "#94a3b8",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: active ? "0 4px 16px rgba(59,130,246,0.4)" : "none",
              transform: active ? "scale(1.05)" : "scale(1)",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};