// Position = schedule. "Velocity" = probabilities: keep current (w),
// copy from pbest (c1), or copy from gbest (c2).

function runPSO(dataset, params, onIteration) {
  if (params.seed !== undefined) Feasible.setSeed(params.seed);
  const numParticles = params.populationSize || 30;
  const iterations = params.iterations || 100;
  const w = params.inertia !== undefined ? params.inertia : 0.5;
  const c1 = params.c1 !== undefined ? params.c1 : 1.5;
  const c2 = params.c2 !== undefined ? params.c2 : 1.5;
  const turbulence = params.turbulence !== undefined ? params.turbulence : 0.05;
  const patience = params.patience || Infinity;

  const evaluate = (ind) =>
    Constraints.evaluateSchedule(GA.individualToSchedule(ind), dataset);

  const particles = [];
  for (let i = 0; i < numParticles; i++) {
    const ind = GA.randomFeasibleIndividual(dataset);
    if (!ind) continue;
    const ev = evaluate(ind);
    if (Constraints.isFeasible(ev))
      particles.push({ pos: ind, pbest: ind, pbestEv: ev });
  }
  if (particles.length === 0) throw new Error("Failed to generate valid particles");

  let gbest = particles[0].pbest,
    gbestEv = particles[0].pbestEv;
  for (const p of particles)
    if (p.pbestEv.fitness < gbestEv.fitness) {
      gbest = p.pbest;
      gbestEv = p.pbestEv;
    }

  const history = [{ iter: 0, best: gbestEv.fitness, avg: avgPSO(particles) }];
  if (onIteration) onIteration(0, gbestEv.fitness, history[0].avg);

  const pKeep = w / (w + c1 + c2);
  const pPbest = c1 / (w + c1 + c2);
  let noImprove = 0;
  let iter = 1;

  for (; iter <= iterations; iter++) {
    for (const p of particles) {
      const newPos = {};
      for (const c of dataset.courses) {
        const r = Feasible.rand();
        if (r < pKeep) newPos[c.id] = { ...p.pos[c.id] };
        else if (r < pKeep + pPbest) newPos[c.id] = { ...p.pbest[c.id] };
        else newPos[c.id] = { ...gbest[c.id] };
      }
      let moved = GA.repairIndividual(newPos, dataset);
      if (!moved) moved = p.pos;
      moved = Feasible.mutate(moved, dataset, turbulence);
      const ev = evaluate(moved);
      if (Constraints.isFeasible(ev)) {
        p.pos = moved;
        if (ev.fitness < p.pbestEv.fitness) {
          p.pbest = moved;
          p.pbestEv = ev;
        }
      }
    }

    let improved = false;
    for (const p of particles) {
      if (p.pbestEv.fitness < gbestEv.fitness) {
        gbest = p.pbest;
        gbestEv = p.pbestEv;
        improved = true;
      }
    }
    noImprove = improved ? 0 : noImprove + 1;

    const avg = avgPSO(particles);
    history.push({ iter, best: gbestEv.fitness, avg });
    if (onIteration) onIteration(iter, gbestEv.fitness, avg);
    if (noImprove >= patience) break;
  }

  return {
    bestSchedule: GA.individualToSchedule(gbest),
    bestEvaluation: gbestEv,
    history,
    stoppedAt: Math.min(iter, iterations),
  };
}

function avgPSO(particles) {
  return (
    particles.reduce((acc, p) => acc + p.pbestEv.fitness, 0) / particles.length
  );
}

window.PSO = { runPSO };
