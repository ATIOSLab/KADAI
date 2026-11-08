/**
 * Standard KADAI Chart Tokens & Tooltip Configuration
 * Unified across Dashboard, Reports, Finance, and KDS Analytics.
 */

export const KADAI_CHART_THEME = {
  // Brand Color Palette
  colors: {
    primary: "#EA580C",       // Ember Flame (Main Trend / Revenue)
    secondary: "#FB923C",     // Flame Glow (Profit / Net)
    accent: "#F59E0B",        // Amber Gold (Tax / Service)
    slate: "#020617",         // Deep Slate (Cash / Base)
    slateMuted: "#64748B",    // Slate Neutral
    grid: "#E2E8F0",          // Subtle Grid Line
    axis: "#64748B",          // Axis Label Text
  },

  // Standard Tooltip Container Styling
  tooltipStyle: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderWidth: "1px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px 0 rgba(0, 0, 0, 0.08)",
    padding: "10px 14px",
    fontSize: "12px",
    fontFamily: "var(--font-sans), 'Plus Jakarta Sans', sans-serif",
    color: "#0F172A",
  },

  // Currency axis formatter (100rb, 2.5jt, 1.2M)
  formatAxisCurrency(value: number): string {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000_000) {
      const val = value / 1_000_000;
      return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}jt`;
    }
    if (value >= 1_000) {
      return `${Math.round(value / 1000)}rb`;
    }
    return String(value);
  },

  // Standard Cartesian Grid Props
  gridProps: {
    strokeDasharray: "3 3",
    stroke: "#E2E8F0",
    strokeWidth: 1,
    vertical: false,
  },

  // Standard X-Axis Props
  xAxisProps: {
    stroke: "#64748B",
    fontSize: 11,
    tickLine: false,
    axisLine: { stroke: "#E2E8F0" },
  },

  // Standard Y-Axis Props
  yAxisProps: {
    stroke: "#64748B",
    fontSize: 11,
    tickLine: false,
    axisLine: false,
    width: 60,
  },
};
