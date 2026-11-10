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
    this.setupUploadModeToggle();
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

  setupUploadModeToggle() {
    const bulkModeRadio = document.getElementById("bulkMode");
    const individualModeRadio = document.getElementById("individualMode");
    const bulkSection = document.getElementById("bulkUploadSection");
    const individualSection = document.getElementById("individualUploadSection");

    if (!bulkModeRadio || !individualModeRadio || !bulkSection || !individualSection) return;

    bulkModeRadio.addEventListener("change", () => {
      if (bulkModeRadio.checked) {
        bulkSection.style.display = "block";
        individualSection.style.display = "none";
      }
    });

    individualModeRadio.addEventListener("change", () => {
      if (individualModeRadio.checked) {
        bulkSection.style.display = "none";
        individualSection.style.display = "block";
      }
    });

    // Add file count display for bulk upload
    const bulkInput = document.getElementById("bulkInput");
    if (bulkInput) {
      bulkInput.addEventListener("change", () => {
        const fileCount = bulkInput.files.length;
        if (fileCount > 0) {
          this.logger.log(`${fileCount} file(s) selected for bulk upload`);
        }
      });
    }
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
      const loadBtn = document.getElementById("loadBtn");

      // Disable button and show loading state
      if (loadBtn) {
        loadBtn.disabled = true;
        loadBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
      }

      const filesMap = await this.fileManager.collectFiles();
      const missing = this.fileManager.validateFiles(filesMap);

      if (missing) {
        alert("Missing files: " + missing.join(", ") + "\n\nPlease make sure all 6 required files are uploaded.");
        if (loadBtn) {
          loadBtn.disabled = false;
          loadBtn.innerHTML = '<i class="bi bi-upload me-2"></i>Load Data';
        }
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
      this.ui.showElement("chartCard", "fade-in");

      // Initialize algorithm runner
      this.algorithmRunner = new AlgorithmRunner(
        this.dataset,
        this.logger,
        this.ui,
        this.chartManager
      );

      // Re-enable button
      if (loadBtn) {
        loadBtn.disabled = false;
        loadBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Data Loaded Successfully';
        setTimeout(() => {
          loadBtn.innerHTML = '<i class="bi bi-upload me-2"></i>Load Data';
        }, 3000);
      }
    } catch (error) {
      this.logger.error(error.message);
      alert("Error loading data: " + error.message + "\n\nPlease check your CSV files and try again.");
      const loadBtn = document.getElementById("loadBtn");
      if (loadBtn) {
        loadBtn.disabled = false;
        loadBtn.innerHTML = '<i class="bi bi-upload me-2"></i>Load Data';
      }
    }
  }

  async handleRunGA() {
    if (!this.algorithmRunner) {
      alert("Please load data first");
      return;
    }
    await this.algorithmRunner.runGA();
  }

  async handleRunPSO() {
    if (!this.algorithmRunner) {
      alert("Please load data first");
      return;
    }
    await this.algorithmRunner.runPSO();
  }

  async handleRunACO() {
    if (!this.algorithmRunner) {
      alert("Please load data first");
      return;
    }
    await this.algorithmRunner.runACO();
  }

  async handleRunExperiments() {
    if (!this.algorithmRunner) {
      alert("Please load data first");
      return;
    }

    const expRunsInput = this.ui.getElement("expRuns");
    const runs = expRunsInput ? +expRunsInput.value : 10;

    // Disable button and show loading state
    const runBtn = this.ui.getElement("runExpBtn");
    if (runBtn) {
      runBtn.disabled = true;
      runBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Running Experiments...';
    }

    this.experimentResults = await this.algorithmRunner.runExperiments(runs);

    // Re-enable button
    if (runBtn) {
      runBtn.disabled = false;
      runBtn.innerHTML = '<i class="bi bi-play-circle me-2"></i>Run Experiments';
    }
  }
}

// ============================================================================
// Application Initialization
// ============================================================================

let app;

document.addEventListener("DOMContentLoaded", () => {
  // Wait for components to load before initializing the app
  window.addEventListener('componentsLoaded', () => {
    app = new ExamTimetablingApp();
  });
});
