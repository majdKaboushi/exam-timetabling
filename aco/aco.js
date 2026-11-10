// Each ant builds a schedule step by step. Slot choice uses roulette wheel:
// P ~ tau^alpha * eta^beta, where tau = pheromone on (course, slot) and
// eta = 1 / (1 + deltaA), deltaA = students of this course with another exam
// on the same day. Room = smallest free room that fits (best-fit).

async function runACO(dataset, params, onIteration) {
  if (params.seed !== undefined) Feasible.setSeed(params.seed);
  const numAnts = params.populationSize || 30;
  const iterations = params.iterations || 100;
  const alpha = params.alpha !== undefined ? params.alpha : 1.0;
  const beta = params.beta !== undefined ? params.beta : 2.0;
  const evaporation =
    params.evaporation !== undefined ? params.evaporation : 0.1;
  const Q = params.Q || 1000;
  const tauMin = 0.01,
    tauMax = 10;
  const patience = params.patience || Infinity;

  // Helper function to yield control to UI
  const yieldToUI = async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  };

  const P = Feasible.prep(dataset);
  const slotIdx = {};
  P.slots.forEach((s, i) => (slotIdx[s] = i));

  const tau = {};
  for (const cid of P.ids) tau[cid] = new Array(P.slots.length).fill(1.0);

  // deltaA: students of this course who already have an exam on that day
  function deltaA(st, cid, slot) {
    const day = P.slotDay[slot];
    let d = 0;
    for (const sid of P.courseStudents[cid]) {
      for (const oc of dataset.studentCourses[sid]) {
        if (
          oc !== cid &&
          st.slotOf[oc] !== undefined &&
          P.slotDay[st.slotOf[oc]] === day
        ) {
          d++;
          break;
        }
      }
    }
    return d;
  }

  function chooseSlot(cid, slots, st) {
    const weights = slots.map(
      (s) =>
        Math.pow(tau[cid][slotIdx[s]], alpha) *
        Math.pow(1 / (1 + deltaA(st, cid, s)), beta),
    );
    let r = Feasible.rand() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < slots.length; i++) {
      r -= weights[i];
      if (r <= 0) return slots[i];
    }
    return slots[slots.length - 1];
  }

  let gbest = null;
  let gbestEv = { fitness: Infinity, C: 0, R: 0, O: 0, A: 0 };
  const history = [];
  let noImprove = 0,
    failedAnts = 0;
  let iter = 1;

  for (; iter <= iterations; iter++) {
    const ants = [];
    for (let a = 0; a < numAnts; a++) {
      const st = Feasible.newState(dataset);
      if (!Feasible.complete(st, chooseSlot)) {
        failedAnts++;
        continue;
      }
      const schedule = GA.individualToSchedule(Feasible.stateToInd(st));
      const ev = Constraints.evaluateSchedule(schedule, dataset);
      if (Constraints.isFeasible(ev)) ants.push({ schedule, ev });
      // Yield periodically during ant construction
      if (a % 5 === 0) await yieldToUI();
    }

    let improved = false;
    for (const ant of ants)
      if (ant.ev.fitness < gbestEv.fitness) {
        gbest = ant.schedule;
        gbestEv = ant.ev;
        improved = true;
      }
    noImprove = improved ? 0 : noImprove + 1;

    // pheromone update: 1) evaporation
    for (const cid of P.ids)
      for (let i = 0; i < tau[cid].length; i++) tau[cid][i] *= 1 - evaporation;
    // 2) deposit: best ant this round + global best
    const deposit = (sched, ev) => {
      const amount = Q / (1 + ev.fitness);
      for (const cid in sched) tau[cid][slotIdx[sched[cid].timeslot]] += amount;
    };
    if (ants.length) {
      ants.sort((x, y) => x.ev.fitness - y.ev.fitness);
      deposit(ants[0].schedule, ants[0].ev);
    }
    if (gbest) deposit(gbest, gbestEv);
    for (const cid of P.ids)
      for (let i = 0; i < tau[cid].length; i++) {
        tau[cid][i] = Math.min(tauMax, Math.max(tauMin, tau[cid][i]));
      }

    const avg = ants.length
      ? ants.reduce((s, x) => s + x.ev.fitness, 0) / ants.length
      : null;
    history.push({ iter, best: gbestEv.fitness, avg });
    if (onIteration) onIteration(iter, gbestEv.fitness, avg);
    if (gbest && noImprove >= patience) break;

    // Yield control to UI every iteration
    await yieldToUI();
  }

  if (!gbest) throw new Error("All ants failed to build a valid schedule");
  return {
    bestSchedule: gbest,
    bestEvaluation: gbestEv,
    history,
    failedAnts,
    stoppedAt: Math.min(iter, iterations),
  };
}

window.ACO = { runACO };
