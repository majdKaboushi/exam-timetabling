// Fitness: 1000C + 1000R + 1000O + 10A

function buildOptions(dataset) {
  const opts = {};
  for (const c of dataset.courses) {
    const list = [];
    for (const t of dataset.timeslots)
      for (const r of dataset.rooms) {
        if (r.capacity >= c.enrolled) list.push({ slot: t.id, room: r.id });
      }
    opts[c.id] = list;
  }
  return opts;
}

function randomFeasibleIndividual(dataset) {
  return Feasible.construct(dataset, 50);
}

function repairIndividual(S, dataset) {
  return Feasible.repair(S, dataset);
}

function individualToSchedule(S) {
  const out = {};
  for (const cid in S) out[cid] = { timeslot: S[cid].slot, room: S[cid].room };
  return out;
}

function crossover(p1, p2, dataset) {
  const child = {};
  for (const c of dataset.courses) {
    child[c.id] = Feasible.rand() < 0.5 ? { ...p1[c.id] } : { ...p2[c.id] };
  }
  return child;
}

function runGA(dataset, params, onGeneration) {
  if (params.seed !== undefined) Feasible.setSeed(params.seed);
  const popSize = params.populationSize || 30;
  const generations = params.generations || 100;
  const mutationRate =
    params.mutationRate !== undefined ? params.mutationRate : 0.1;
  const crossoverRate =
    params.crossoverRate !== undefined ? params.crossoverRate : 0.9;
  const elitism = params.elitism !== undefined ? params.elitism : 2;
  const patience = params.patience || Infinity;

  const population = [];
  for (let i = 0; i < popSize; i++) {
    const ind = randomFeasibleIndividual(dataset);
    if (ind) population.push(ind);
  }
  if (population.length === 0)
    throw new Error("Failed to generate any valid individual — check the data");

  const evaluate = (ind) =>
    Constraints.evaluateSchedule(individualToSchedule(ind), dataset);
  let scored = population.map((ind) => ({ ind, ev: evaluate(ind) }));
  scored.sort((a, b) => a.ev.fitness - b.ev.fitness);

  let best = scored[0];
  let noImprove = 0;
  const history = [
    { generation: 0, best: best.ev.fitness, avg: avgFitness(scored) },
  ];
  if (onGeneration) onGeneration(0, best.ev.fitness, history[0].avg);

  let g = 1;
  for (; g <= generations; g++) {
    const next = [];
    for (let i = 0; i < elitism && i < scored.length; i++)
      next.push(scored[i].ind);

    while (next.length < popSize) {
      const p1 = tournamentSelect(scored);
      const p2 = tournamentSelect(scored);
      let child =
        Feasible.rand() < crossoverRate
          ? repairIndividual(crossover(p1.ind, p2.ind, dataset), dataset)
          : null;
      if (!child) child = (p1.ev.fitness <= p2.ev.fitness ? p1 : p2).ind;
      child = Feasible.mutate(child, dataset, mutationRate);
      next.push(child);
    }

    scored = next
      .map((ind) => ({ ind, ev: evaluate(ind) }))
      .filter((x) => Constraints.isFeasible(x.ev));
    scored.sort((a, b) => a.ev.fitness - b.ev.fitness);
    if (scored[0].ev.fitness < best.ev.fitness) {
      best = scored[0];
      noImprove = 0;
    } else noImprove++;

    const avg = avgFitness(scored);
    history.push({ generation: g, best: best.ev.fitness, avg });
    if (onGeneration) onGeneration(g, best.ev.fitness, avg);
    if (noImprove >= patience) break;
  }

  return {
    bestIndividual: best.ind,
    bestSchedule: individualToSchedule(best.ind),
    bestEvaluation: best.ev,
    history,
    stoppedAt: Math.min(g, generations),
  };
}

function avgFitness(scored) {
  return scored.reduce((acc, x) => acc + x.ev.fitness, 0) / scored.length;
}

function tournamentSelect(scored, k = 3) {
  let best = null;
  for (let i = 0; i < k; i++) {
    const x = scored[Feasible.randInt(scored.length)];
    if (!best || x.ev.fitness < best.ev.fitness) best = x;
  }
  return best;
}

window.GA = {
  runGA,
  buildOptions,
  repairIndividual,
  individualToSchedule,
  randomFeasibleIndividual,
};
