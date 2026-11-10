async function runExperiments(dataset, params, runs, onProgress) {
  const results = { GA: [], PSO: [], ACO: [] };

  // different seed per run (seed + i) for stability testing
  const base = (params.GA && params.GA.seed) || 1;

  for (let i = 0; i < runs; i++) {
    const seed = base + i;

    // GA, PSO and ACO are async, so each run must be awaited
    const t0GA = performance.now();
    const gaRes = await GA.runGA(dataset, { ...params.GA, seed });
    const t1GA = performance.now();
    const gaResult = {
      fitness: gaRes.bestEvaluation.fitness,
      A: gaRes.bestEvaluation.A,
      time: t1GA - t0GA,
    };
    results.GA.push(gaResult);

    // Small delay to allow UI update
    await new Promise((r) => setTimeout(r, 10));

    const t0PSO = performance.now();
    const psoRes = await PSO.runPSO(dataset, { ...params.PSO, seed });
    const t1PSO = performance.now();
    const psoResult = {
      fitness: psoRes.bestEvaluation.fitness,
      A: psoRes.bestEvaluation.A,
      time: t1PSO - t0PSO,
    };
    results.PSO.push(psoResult);

    // Small delay to allow UI update
    await new Promise((r) => setTimeout(r, 10));

    const t0ACO = performance.now();
    const acoRes = await ACO.runACO(dataset, { ...params.ACO, seed });
    const t1ACO = performance.now();
    const acoResult = {
      fitness: acoRes.bestEvaluation.fitness,
      A: acoRes.bestEvaluation.A,
      time: t1ACO - t0ACO,
    };
    results.ACO.push(acoResult);

    if (onProgress) {
      onProgress(i + 1, runs);
      // Allow UI to update after each complete run
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  // compute stats
  const summary = {};
  for (const alg of ["GA", "PSO", "ACO"]) {
    summary[alg] = {
      fitness: calcStats(results[alg], "fitness"),
      time: calcStats(results[alg], "time"),
      A: calcStats(results[alg], "A"),
    };
  }

  return { raw: results, summary };
}

function calcStats(arr, key) {
  const vals = arr.map((x) => x[key]);
  const sum = vals.reduce((a, b) => a + b, 0);
  const avg = sum / vals.length;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const variance =
    vals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / vals.length;
  const std = Math.sqrt(variance);
  return { min, max, avg, std };
}
