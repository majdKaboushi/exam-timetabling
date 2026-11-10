/**
 * Exam Timetabling Application
 * Main Application Controller
 * Object-Oriented Design Pattern
 */

// ============================================================================
// Main Application Class
// ============================================================================

/**
 * ExamTimetablingApp - Main Application Controller
 */
class ExamTimetablingApp {
  constructor() {
    this.logger = new Logger("log");
    this.fileManager = new FileManager(AppConfig.REQUIRED_FILES);
    this.ui = new UIManager();
    this.chartManager = new ChartManager("chart", AppConfig.CHART_COLORS);
    this.algorithmRunner = null;

    this.dataset = null;
    this.schedule = null;
    this.evaluation = null;
    this.experimentResults = null;

    this.initialize();
  }

  initialize() {
    this.initializeFileInputs();
    this.setupEventListeners();
  }

  initializeFileInputs() {
    const indBox = document.getElementById("individualInputs");
    if (!indBox) return;

    AppConfig.REQUIRED_FILES.forEach((name) => {
      const div = document.createElement("div");
      div.className = "mb-3";
      div.innerHTML = `
        <label class="form-label">${name}</label>
        <input type="file" class="form-control" accept=".csv" data-name="${name}">
      `;
      indBox.appendChild(div);
    });
  }

  setupEventListeners() {
    // Load Data Button
    const loadBtn = this.ui.getElement("loadBtn");
    if (loadBtn) {
      loadBtn.addEventListener("click", () => this.handleLoadData());
    }

    // GA Button
    const runGABtn = this.ui.getElement("runGABtn");
    if (runGABtn) {
      runGABtn.addEventListener("click", () => this.handleRunGA());
    }

    // PSO Button
    const runPSOBtn = this.ui.getElement("runPSOBtn");
    if (runPSOBtn) {
      runPSOBtn.addEventListener("click", () => this.handleRunPSO());
    }

    // ACO Button
    const runACOBtn = this.ui.getElement("runACOBtn");
    if (runACOBtn) {
      runACOBtn.addEventListener("click", () => this.handleRunACO());
    }

    // Experiments Button
    const runExpBtn = this.ui.getElement("runExpBtn");
    if (runExpBtn) {
      runExpBtn.addEventListener("click", () => this.handleRunExperiments());
    }

    // Export Buttons
    this.setupExportListeners();
  }

  setupExportListeners() {
    // Experiment Export
    const expExportBtn = this.ui.getElement("expExportCSV");
    if (expExportBtn) {
      expExportBtn.addEventListener("click", () => {
        if (this.experimentResults) {
          this.fileManager.exportExperimentResultsToCSV(
            this.experimentResults.summary,
            "experiments_summary.csv"
          );
        }
      });
    }

    // GA Export
    const gaExportBtn = this.ui.getElement("gaExportCSV");
    if (gaExportBtn) {
      gaExportBtn.addEventListener("click", () => {
        if (this.algorithmRunner && this.algorithmRunner.results.GA) {
          this.fileManager.exportScheduleToCSV(
            this.algorithmRunner.results.GA.bestSchedule,
            this.dataset.courses,
            this.dataset.timeslots,
            "ga_schedule.csv"
          );
        }
      });
    }

    // PSO Export
    const psoExportBtn = this.ui.getElement("psoExportCSV");
    if (psoExportBtn) {
      psoExportBtn.addEventListener("click", () => {
        if (this.algorithmRunner && this.algorithmRunner.results.PSO) {
          this.fileManager.exportScheduleToCSV(
            this.algorithmRunner.results.PSO.bestSchedule,
            this.dataset.courses,
            this.dataset.timeslots,
            "pso_schedule.csv"
          );
        }
      });
    }

    // ACO Export
    const acoExportBtn = this.ui.getElement("acoExportCSV");
    if (acoExportBtn) {
      acoExportBtn.addEventListener("click", () => {
        if (this.algorithmRunner && this.algorithmRunner.results.ACO) {
          this.fileManager.exportScheduleToCSV(
            this.algorithmRunner.results.ACO.bestSchedule,
            this.dataset.courses,
            this.dataset.timeslots,
            "aco_schedule.csv"
          );
        }
      });
    }
  }

  async handleLoadData() {
    try {
      this.logger.log("— Starting Load —");
      const filesMap = await this.fileManager.collectFiles();
      const missing = this.fileManager.validateFiles(filesMap);

      if (missing) {
        alert("Missing files: " + missing.join(", "));
        return;
      }

      this.dataset = DataLoader.loadDataset(filesMap);
      this.logger.log(
        `Loaded: ${this.dataset.courses.length} courses, ${this.dataset.students.length} students, ${this.dataset.timeslots.length} timeslots, ${this.dataset.rooms.length} rooms.`
      );

      // Show data summary
      this.ui.renderDataSummary(
        this.dataset.courses,
        this.dataset.students,
        this.dataset.timeslots,
        this.dataset.rooms
      );
      this.ui.showElement("summaryCard", "fade-in");

      // Run greedy algorithm
      this.schedule = Greedy.greedySchedule(this.dataset);
      this.evaluation = Constraints.evaluateSchedule(
        this.schedule,
        this.dataset
      );

      this.ui.renderFitnessSummary("fitnessBox", this.evaluation);
      this.ui.renderScheduleTable(
        "scheduleTable",
        this.dataset.courses,
        this.schedule,
        this.dataset.timeslots
      );

      // Show all algorithm sections
      this.ui.showElement("resultCard", "fade-in");
      this.ui.showElement("gaCard", "fade-in");
      this.ui.showElement("psoCard", "fade-in");
      this.ui.showElement("acoCard", "fade-in");
      this.ui.showElement("expCard", "fade-in");

      // Initialize algorithm runner
      this.algorithmRunner = new AlgorithmRunner(
        this.dataset,
        this.logger,
        this.ui,
        this.chartManager
      );
    } catch (error) {
      this.logger.error(error.message);
      alert("Error: " + error.message);
    }
  }

  handleRunGA() {
    if (!this.algorithmRunner) {
      alert("Please load data first");
      return;
    }
    this.algorithmRunner.runGA();
  }

  handleRunPSO() {
    if (!this.algorithmRunner) {
      alert("Please load data first");
      return;
    }
    this.algorithmRunner.runPSO();
  }

  handleRunACO() {
    if (!this.algorithmRunner) {
      alert("Please load data first");
      return;
    }
    this.algorithmRunner.runACO();
  }

  async handleRunExperiments() {
    if (!this.algorithmRunner) {
      alert("Please load data first");
      return;
    }

    const expRunsInput = this.ui.getElement("expRuns");
    const runs = expRunsInput ? +expRunsInput.value : 10;

    this.experimentResults = await this.algorithmRunner.runExperiments(runs);
  }
}

// ============================================================================
// Application Initialization
// ============================================================================

let app;

document.addEventListener("DOMContentLoaded", () => {
  // Wait for components to load before initializing the app
  setTimeout(() => {
    app = new ExamTimetablingApp();
  }, 500);
});
