// experiments.js — run each algorithm N times and compute stats

async function runExperiments(dataset, params, runs, onProgress) {
  const results = { GA: [], PSO: [], ACO: [] };

  // different seed per run (seed + i) for stability testing
  const base = (params.GA && params.GA.seed) || 1;

  for (let i = 0; i < runs; i++) {
    const seed = base + i;

    // Run GA asynchronously to allow UI updates
    const gaResult = await new Promise((resolve) => {
      setTimeout(() => {
        const t0 = performance.now();
        const gaRes = GA.runGA(dataset, { ...params.GA, seed });
        const t1 = performance.now();
        resolve({
          fitness: gaRes.bestEvaluation.fitness,
          A: gaRes.bestEvaluation.A,
          time: t1 - t0,
        });
      }, 0);
    });
    results.GA.push(gaResult);

    // Small delay to allow UI update
    await new Promise((r) => setTimeout(r, 10));

    // Run PSO asynchronously
    const psoResult = await new Promise((resolve) => {
      setTimeout(() => {
        const t0 = performance.now();
        const psoRes = PSO.runPSO(dataset, { ...params.PSO, seed });
        const t1 = performance.now();
        resolve({
          fitness: psoRes.bestEvaluation.fitness,
          A: psoRes.bestEvaluation.A,
          time: t1 - t0,
        });
      }, 0);
    });
    results.PSO.push(psoResult);

    // Small delay to allow UI update
    await new Promise((r) => setTimeout(r, 10));

    // Run ACO asynchronously
    const acoResult = await new Promise((resolve) => {
      setTimeout(() => {
        const t0 = performance.now();
        const acoRes = ACO.runACO(dataset, { ...params.ACO, seed });
        const t1 = performance.now();
        resolve({
          fitness: acoRes.bestEvaluation.fitness,
          A: acoRes.bestEvaluation.A,
          time: t1 - t0,
        });
      }, 0);
    });
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
