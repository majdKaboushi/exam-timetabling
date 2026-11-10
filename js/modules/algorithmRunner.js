/**
 * AlgorithmRunner Module
 * Handles algorithm execution and result management
 */

class AlgorithmRunner {
  constructor(dataset, logger, uiManager, chartManager) {
    this.dataset = dataset;
    this.logger = logger;
    this.ui = uiManager;
    this.chart = chartManager;
    this.results = {
      GA: null,
      PSO: null,
      ACO: null,
    };
  }

  getCommonParams() {
    const seedInput = this.ui.getElement("seedInput");
    const patienceInput = this.ui.getElement("patienceInput");

    return {
      seed: seedInput ? +seedInput.value || 1 : 1,
      patience: patienceInput ? (+patienceInput.value || Infinity) : Infinity,
    };
  }

  runGA() {
    const params = {
      populationSize: +this.ui.getElement("gaPop").value,
      generations: +this.ui.getElement("gaGen").value,
      mutationRate: +this.ui.getElement("gaMut").value,
      elitism: +this.ui.getElement("gaEli").value,
      ...this.getCommonParams(),
    };

    this.logger.log("— Running GA —");
    const t0 = performance.now();
    const history = [];

    this.results.GA = GA.runGA(this.dataset, params, (gen, best, avg) => {
      history.push({ gen, best, avg });
      if (gen % 10 === 0 || gen === params.generations) {
        this.logger.log(`Generation ${gen}: best=${best}`);
      }
    });

    const t1 = performance.now();
    this.logger.log(
      `GA completed — Fitness = ${this.results.GA.bestEvaluation.fitness} in ${(
        t1 - t0
      ).toFixed(0)} ms`
    );

    this.ui.renderFitnessSummary("gaResultBox", this.results.GA.bestEvaluation);
    this.ui.renderScheduleTable(
      "gaScheduleTable",
      this.dataset.courses,
      this.results.GA.bestSchedule,
      this.dataset.timeslots
    );
    this.ui.showElement("chartCard", "fade-in");
    this.chart.drawChart(history, "GA", "Generation");
  }

  runPSO() {
    const params = {
      populationSize: +this.ui.getElement("psoPop").value,
      iterations: +this.ui.getElement("psoIter").value,
      inertia: +this.ui.getElement("psoW").value,
      c1: +this.ui.getElement("psoC1").value,
      c2: +this.ui.getElement("psoC2").value,
      ...this.getCommonParams(),
    };

    this.logger.log("— Running PSO —");
    const t0 = performance.now();
    const history = [];

    this.results.PSO = PSO.runPSO(this.dataset, params, (iter, best, avg) => {
      history.push({ gen: iter, best, avg });
      if (iter % 10 === 0 || iter === params.iterations) {
        this.logger.log(`Iteration ${iter}: best=${best}`);
      }
    });

    const t1 = performance.now();
    this.logger.log(
      `PSO completed — Fitness = ${this.results.PSO.bestEvaluation.fitness} in ${(
        t1 - t0
      ).toFixed(0)} ms`
    );

    this.ui.renderFitnessSummary("psoResultBox", this.results.PSO.bestEvaluation);
    this.ui.renderScheduleTable(
      "psoScheduleTable",
      this.dataset.courses,
      this.results.PSO.bestSchedule,
      this.dataset.timeslots
    );
    this.ui.showElement("chartCard", "fade-in");
    this.chart.drawChart(history, "PSO", "Iteration");
  }

  runACO() {
    const params = {
      populationSize: +this.ui.getElement("acoAnts").value,
      iterations: +this.ui.getElement("acoIter").value,
      alpha: +this.ui.getElement("acoAlpha").value,
      beta: +this.ui.getElement("acoBeta").value,
      evaporation: +this.ui.getElement("acoEvap").value,
      ...this.getCommonParams(),
    };

    this.logger.log("— Running ACO —");
    const t0 = performance.now();
    const history = [];

    this.results.ACO = ACO.runACO(this.dataset, params, (iter, best, avg) => {
      history.push({ gen: iter, best, avg });
      if (iter % 10 === 0 || iter === params.iterations) {
        this.logger.log(`Iteration ${iter}: best=${best}`);
      }
    });

    const t1 = performance.now();
    this.logger.log(
      `ACO completed — Fitness = ${this.results.ACO.bestEvaluation.fitness} in ${(
        t1 - t0
      ).toFixed(0)} ms`
    );

    this.ui.renderFitnessSummary("acoResultBox", this.results.ACO.bestEvaluation);
    this.ui.renderScheduleTable(
      "acoScheduleTable",
      this.dataset.courses,
      this.results.ACO.bestSchedule,
      this.dataset.timeslots
    );
    this.ui.showElement("chartCard", "fade-in");
    this.chart.drawChart(history, "ACO", "Iteration");
  }

  async runExperiments(runs) {
    const gaParams = {
      populationSize: +this.ui.getElement("gaPop").value,
      generations: +this.ui.getElement("gaGen").value,
      mutationRate: +this.ui.getElement("gaMut").value,
      elitism: +this.ui.getElement("gaEli").value,
      ...this.getCommonParams(),
    };

    const psoParams = {
      populationSize: +this.ui.getElement("psoPop").value,
      iterations: +this.ui.getElement("psoIter").value,
      inertia: +this.ui.getElement("psoW").value,
      c1: +this.ui.getElement("psoC1").value,
      c2: +this.ui.getElement("psoC2").value,
      ...this.getCommonParams(),
    };

    const acoParams = {
      populationSize: +this.ui.getElement("acoAnts").value,
      iterations: +this.ui.getElement("acoIter").value,
      alpha: +this.ui.getElement("acoAlpha").value,
      beta: +this.ui.getElement("acoBeta").value,
      evaporation: +this.ui.getElement("acoEvap").value,
      ...this.getCommonParams(),
    };

    const expProgress = this.ui.getElement("expProgress");
    const expLoadingIndicator = this.ui.getElement("expLoadingIndicator");

    // Disable button and show loading indicators
    this.ui.disableButton("runExpBtn", true);

    if (expProgress) {
      expProgress.style.display = "block";
      expProgress.textContent = "Initializing...";
    }

    if (expLoadingIndicator) {
      expLoadingIndicator.style.display = "block";
    }

    // Force UI update before starting heavy computation
    await new Promise((r) => setTimeout(r, 100));

    this.logger.log(`— Starting Comprehensive Experiment (${runs} runs) —`);

    const results = await runExperiments(
      this.dataset,
      { GA: gaParams, PSO: psoParams, ACO: acoParams },
      runs,
      (current, total) => {
        if (expProgress) {
          expProgress.textContent = `Running: Round ${current} of ${total}...`;
        }
        this.logger.log(`Round ${current}/${total} completed.`);
      }
    );

    this.ui.disableButton("runExpBtn", false);

    if (expProgress) {
      expProgress.textContent = "Experiment completed successfully!";
      setTimeout(() => {
        expProgress.style.display = "none";
      }, 3000);
    }

    if (expLoadingIndicator) {
      expLoadingIndicator.style.display = "none";
    }

    this.logger.log("— Comprehensive Experiment Completed —");
    this.ui.renderExperimentResults(results.summary);
    this.ui.showElement("expResultsDiv", "fade-in");

    return results;
  }
}

// Make available globally (for non-module environments)
if (typeof window !== 'undefined') {
  window.AlgorithmRunner = AlgorithmRunner;
}
