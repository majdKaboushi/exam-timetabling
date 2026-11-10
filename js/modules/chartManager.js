/**
 * ChartManager Module
 * Handles Chart.js operations
 */

class ChartManager {
  constructor(canvasId, chartColors) {
    this.canvasId = canvasId;
    this.chartColors = chartColors;
    this.chart = null;
  }

  getCanvas() {
    return document.getElementById(this.canvasId);
  }

  drawChart(history, label, xLabel) {
    const canvas = this.getCanvas();
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (this.chart) {
      this.chart.destroy();
    }

    const colors = this.chartColors[label] || this.chartColors.GA;

    this.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: history.map((h) => h.gen),
        datasets: [
          {
            label: `${label} - Best`,
            data: history.map((h) => h.best),
            borderColor: colors.border,
            backgroundColor: colors.bg,
            fill: true,
            tension: 0.4,
          },
          {
            label: `${label} - Average`,
            data: history.map((h) => h.avg),
            borderColor: colors.border,
            backgroundColor: "transparent",
            borderDash: [5, 5],
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: true,
            text: `Fitness Evolution - ${label}`,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: xLabel,
            },
          },
          y: {
            title: {
              display: true,
              text: "Fitness",
            },
          },
        },
      },
    });
  }
}

// Make available globally (for non-module environments)
if (typeof window !== 'undefined') {
  window.ChartManager = ChartManager;
}
