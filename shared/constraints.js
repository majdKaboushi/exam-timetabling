// fitness = 1000C + 1000R + 1000O + 10A

function evaluateSchedule(S, dataset) {
  const { courses, timeslots, rooms, studentCourses, timeslotDay } = dataset;

  const roomSlotCount = {};
  let R = 0; // capacity violations

  for (const c of courses) {
    const a = S[c.id];
    if (!a || !a.timeslot || !a.room) {
      R += 1;
      continue;
    }
    const key = `${a.timeslot}|${a.room}`;
    roomSlotCount[key] = (roomSlotCount[key] || 0) + 1;

    const roomObj = rooms.find((r) => r.id === a.room);
    if (!roomObj || roomObj.capacity < c.enrolled) R += 1;
  }

  // O: double-booked rooms
  let O = 0;
  for (const k in roomSlotCount) {
    if (roomSlotCount[k] > 1) O += roomSlotCount[k] - 1;
  }

  // C: students with two exams in the same slot
  let C = 0;
  for (const sid in studentCourses) {
    const perSlot = {};
    for (const cid of studentCourses[sid]) {
      const a = S[cid];
      if (!a || !a.timeslot) continue;
      if (!perSlot[a.timeslot]) perSlot[a.timeslot] = [];
      perSlot[a.timeslot].push(cid);
    }
    for (const slot in perSlot) {
      const n = perSlot[slot].length;
      if (n > 1) C += n - 1;
    }
  }

  // A: students with two exams on the same day
  let A = 0;
  for (const sid in studentCourses) {
    const perDay = {};
    for (const cid of studentCourses[sid]) {
      const a = S[cid];
      if (!a || !a.timeslot) continue;
      const day = timeslotDay[a.timeslot];
      if (!day) continue;
      perDay[day] = (perDay[day] || 0) + 1;
    }
    for (const d in perDay) {
      if (perDay[d] > 1) A += perDay[d] - 1;
    }
  }

  const fitness = 1000 * C + 1000 * R + 1000 * O + 10 * A;
  return { C, R, O, A, fitness };
}

function isFeasible(ev) {
  return ev.C === 0 && ev.R === 0 && ev.O === 0;
}

window.Constraints = { evaluateSchedule, isFeasible };
