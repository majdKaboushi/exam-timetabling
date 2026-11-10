// Randomized DSATUR ordering, a "kick" move, and a seedable RNG (mulberry32)

(function () {
  let _rand = Math.random;
  function setSeed(seed) {
    if (seed === undefined || seed === null || seed === "") {
      _rand = Math.random;
      return;
    }
    let a = Number(seed) >>> 0 || 1;
    _rand = function () {
      // mulberry32
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = () => _rand();
  const randInt = (n) => Math.floor(rand() * n);
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function prep(dataset) {
    if (dataset._feas) return dataset._feas;
    const ids = dataset.courses.map((c) => c.id);
    const enrolled = {};
    dataset.courses.forEach((c) => (enrolled[c.id] = c.enrolled));
    const adj = {};
    ids.forEach((id) => (adj[id] = new Set()));
    for (const k in dataset.conflictMap) {
      const [a, b] = k.split("|");
      if (adj[a] && adj[b] && a !== b) {
        adj[a].add(b);
        adj[b].add(a);
      }
    }
    for (const sid in dataset.studentCourses) {
      const L = dataset.studentCourses[sid];
      for (let i = 0; i < L.length; i++)
        for (let j = i + 1; j < L.length; j++) {
          if (adj[L[i]] && adj[L[j]] && L[i] !== L[j]) {
            adj[L[i]].add(L[j]);
            adj[L[j]].add(L[i]);
          }
        }
    }
    const slots = dataset.timeslots.map((t) => t.id);
    const roomsAsc = [...dataset.rooms].sort((a, b) => a.capacity - b.capacity);
    const courseStudents = {};
    ids.forEach((id) => (courseStudents[id] = []));
    for (const sid in dataset.studentCourses)
      for (const cid of dataset.studentCourses[sid]) {
        if (courseStudents[cid]) courseStudents[cid].push(sid);
      }
    dataset._feas = {
      ids,
      enrolled,
      adj,
      slots,
      roomsAsc,
      courseStudents,
      slotDay: dataset.timeslotDay,
    };
    return dataset._feas;
  }

  function newState(dataset) {
    const P = prep(dataset);
    const slotCourses = {};
    P.slots.forEach((s) => (slotCourses[s] = new Set()));
    return { P, slotOf: {}, roomOf: {}, slotCourses, roomUsed: {} };
  }

  function slotOK(st, cid, slot) {
    const adj = st.P.adj[cid];
    for (const o of st.slotCourses[slot]) if (adj.has(o)) return false;
    return true;
  }
  // best-fit: smallest free room that fits
  function freeRoom(st, cid, slot) {
    const need = st.P.enrolled[cid];
    for (const r of st.P.roomsAsc) {
      if (r.capacity >= need && !st.roomUsed[slot + "|" + r.id]) return r.id;
    }
    return null;
  }
  function place(st, cid, slot, room) {
    st.slotOf[cid] = slot;
    st.roomOf[cid] = room;
    st.slotCourses[slot].add(cid);
    st.roomUsed[slot + "|" + room] = cid;
  }
  function unplace(st, cid) {
    const s = st.slotOf[cid];
    if (s === undefined) return;
    st.slotCourses[s].delete(cid);
    delete st.roomUsed[s + "|" + st.roomOf[cid]];
    delete st.slotOf[cid];
    delete st.roomOf[cid];
  }
  function feasibleSlots(st, cid) {
    const out = [];
    for (const s of st.P.slots)
      if (slotOK(st, cid, s) && freeRoom(st, cid, s) !== null) out.push(s);
    return out;
  }

  // try to move one blocking course to another slot
  function kick(st, cid) {
    for (const s of shuffle([...st.P.slots])) {
      const blockers = [...st.slotCourses[s]].filter((o) =>
        st.P.adj[cid].has(o),
      );
      if (blockers.length !== 1) continue;
      const b = blockers[0];
      const bRoom = st.roomOf[b];
      unplace(st, b);
      const room = freeRoom(st, cid, s);
      if (room !== null) {
        place(st, cid, s, room);
        const alt = shuffle(feasibleSlots(st, b).filter((x) => x !== s));
        if (alt.length > 0) {
          place(st, b, alt[0], freeRoom(st, b, alt[0]));
          return true;
        }
        unplace(st, cid);
      }
      place(st, b, s, bRoom); // undo
    }
    return false;
  }

  // finish a partial schedule with randomized DSATUR; chooseSlot is optional (ACO uses it)
  function complete(st, chooseSlot) {
    const left = new Set(st.P.ids.filter((id) => st.slotOf[id] === undefined));
    while (left.size > 0) {
      // pick the most constrained course: fewest free slots, then highest degree
      let best = null,
        bestSlots = null,
        bestKey = Infinity;
      for (const cid of left) {
        const fs = feasibleSlots(st, cid);
        const key = fs.length * 10000 - st.P.adj[cid].size * 10 + rand();
        if (key < bestKey) {
          bestKey = key;
          best = cid;
          bestSlots = fs;
        }
        if (fs.length === 0) break;
      }
      if (bestSlots.length === 0) {
        if (!kick(st, best)) return false;
      } else {
        const s = chooseSlot
          ? chooseSlot(best, bestSlots, st)
          : bestSlots[randInt(bestSlots.length)];
        place(st, best, s, freeRoom(st, best, s));
      }
      left.delete(best);
    }
    return true;
  }

  function stateToInd(st) {
    const S = {};
    for (const cid of st.P.ids)
      S[cid] = { slot: st.slotOf[cid], room: st.roomOf[cid] };
    return S;
  }
  function indToState(S, dataset) {
    const st = newState(dataset);
    for (const cid of st.P.ids) {
      const a = S[cid];
      if (a && a.slot) place(st, cid, a.slot, a.room);
    }
    return st;
  }

  // build a feasible schedule from scratch (several tries)
  function construct(dataset, tries = 50, chooseSlot) {
    for (let t = 0; t < tries; t++) {
      const st = newState(dataset);
      if (complete(st, chooseSlot)) return stateToInd(st);
    }
    return null;
  }

  // keep every valid assignment, rebuild the rest
  function repair(S, dataset) {
    if (!S) return null;
    const st = newState(dataset);
    for (const cid of shuffle([...st.P.ids])) {
      const a = S[cid];
      if (!a || !a.slot || !slotOK(st, cid, a.slot)) continue;
      let room = a.room;
      const roomObj = st.P.roomsAsc.find((r) => r.id === room);
      if (
        !room ||
        !roomObj ||
        roomObj.capacity < st.P.enrolled[cid] ||
        st.roomUsed[a.slot + "|" + room]
      ) {
        room = freeRoom(st, cid, a.slot);
      }
      if (room !== null) place(st, cid, a.slot, room);
    }
    return complete(st) ? stateToInd(st) : null;
  }

  // feasibility-preserving mutation: move one course or swap two whole slots
  function mutate(S, dataset, rate) {
    const st = indToState(S, dataset);
    const P = st.P;
    for (const cid of P.ids) {
      if (rand() >= rate) continue;
      const cur = st.slotOf[cid],
        curRoom = st.roomOf[cid];
      unplace(st, cid);
      const fs = feasibleSlots(st, cid).filter((s) => s !== cur);
      if (fs.length) {
        const s = fs[randInt(fs.length)];
        place(st, cid, s, freeRoom(st, cid, s));
      } else place(st, cid, cur, curRoom);
    }
    if (rand() < Math.max(rate, 0.3)) swapSlots(st);
    return stateToInd(st);
  }
  function swapSlots(st) {
    const sl = st.P.slots;
    if (sl.length < 2) return;
    const a = sl[randInt(sl.length)];
    let b = sl[randInt(sl.length)];
    if (a === b) b = sl[(sl.indexOf(a) + 1) % sl.length];
    const A = [...st.slotCourses[a]],
      B = [...st.slotCourses[b]];
    const ra = A.map((c) => st.roomOf[c]),
      rb = B.map((c) => st.roomOf[c]);
    A.forEach((c) => unplace(st, c));
    B.forEach((c) => unplace(st, c));
    A.forEach((c, i) => place(st, c, b, ra[i]));
    B.forEach((c, i) => place(st, c, a, rb[i]));
  }

  window.Feasible = {
    setSeed,
    rand,
    randInt,
    shuffle,
    prep,
    newState,
    slotOK,
    freeRoom,
    place,
    unplace,
    feasibleSlots,
    complete,
    construct,
    repair,
    mutate,
    stateToInd,
    indToState,
  };
})();
