/**
 * Configuration Module
 * Centralized configuration for the application
 */

const AppConfig = {
  REQUIRED_FILES: [
    "courses.csv",
    "students.csv",
    "enrollments.csv",
    "timeslots.csv",
    "rooms.csv",
    "conflicts.csv",
  ],
  CHART_COLORS: {
    GA: { border: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" },
    PSO: { border: "#8b5cf6", bg: "rgba(139, 92, 246, 0.1)" },
    ACO: { border: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
  },
  UI_CONFIG: {
    ANIMATION_DURATION: 3000,
    LOG_UPDATE_INTERVAL: 10,
  },
};

// Make available globally (for non-module environments)
if (typeof window !== 'undefined') {
  window.AppConfig = AppConfig;
}
