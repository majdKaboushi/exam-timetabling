function greedySchedule(dataset) {
  const { courses, timeslots, rooms, conflictMap } = dataset;

  const order = [...courses].sort((a, b) => b.enrolled - a.enrolled);

  const S = {};
  const usedRoomSlot = {};

  for (const c of order) {
    let placed = false;

    const sortedRooms = [...rooms]
      .sort((a, b) => a.capacity - b.capacity)
      .filter((r) => r.capacity >= c.enrolled);

    for (const t of timeslots) {
      let conflict = false;
      for (const otherId in S) {
        if (S[otherId].timeslot === t.id) {
          const key = `${c.id}|${otherId}`;
          if (conflictMap[key]) {
            conflict = true;
            break;
          }
        }
      }
      if (conflict) continue;

      for (const r of sortedRooms) {
        const key = `${t.id}|${r.id}`;
        if (usedRoomSlot[key]) continue;
        S[c.id] = { timeslot: t.id, room: r.id };
        usedRoomSlot[key] = true;
        placed = true;
        break;
      }
      if (placed) break;
    }

    if (!placed) {
      S[c.id] = { timeslot: null, room: null };
    }
  }

  return S;
}

window.Greedy = { greedySchedule };
