/**
 * Mock vitals data used as fallback when backend biomarker data is unavailable.
 * Both Dashboard.jsx and Vitals.jsx import from here.
 */

// ── Today's readings (time-series for charts) ──────────────────
function generateTodayData(baseValue, variance, count = 24) {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    return Array.from({ length: count }, (_, i) => {
        const t = new Date(start.getTime() + i * (60 * 60 * 1000)); // hourly
        const v = Math.round(baseValue + (Math.random() - 0.5) * variance * 2);
        return { t: t.toISOString(), v };
    });
}

export const vitalsToday = {
    heartRate: generateTodayData(75, 12, 24),
    spo2: generateTodayData(97, 2, 24),
};

// ── Weekly readings (daily averages) ────────────────────────────
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function generateWeekData(baseValue, variance) {
    return days.map((day) => ({
        day,
        avg: Math.round(baseValue + (Math.random() - 0.5) * variance * 2),
        v: Math.round(baseValue + (Math.random() - 0.5) * variance * 2),
    }));
}

export const vitalsWeek = {
    heartRate: generateWeekData(76, 8),
    spo2: generateWeekData(97, 1.5),
};

// ── Alert thresholds ────────────────────────────────────────────
export const thresholds = {
    heartRate: { low: 50, high: 100 },
    spo2: { low: 95, high: 100 },
};

// ── Stat calculators ────────────────────────────────────────────
export function calcStatsFromToday(data) {
    if (!data || data.length === 0) {
        return { current: 0, resting: 0, peak: 0 };
    }
    const values = data.map((d) => d.v);
    return {
        current: values[values.length - 1],
        resting: Math.min(...values),
        peak: Math.max(...values),
    };
}

export function calcStatsFromWeek(data) {
    if (!data || data.length === 0) {
        return { current: 0, resting: 0, peak: 0 };
    }
    const values = data.map((d) => d.avg || d.v);
    return {
        current: values[values.length - 1],
        resting: Math.min(...values),
        peak: Math.max(...values),
    };
}
