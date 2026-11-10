// Parse CSV text into an array of row objects (handles BOM and quotes)
function parseCSV(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];

  const header = splitCSVLine(lines[0]).map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCSVLine(lines[i]);
    const obj = {};
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = cells[j] !== undefined ? cells[j].trim() : "";
    }
    rows.push(obj);
  }
  return rows;
}

// Split one CSV line, respecting quotes
function splitCSVLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

// Build the unified dataset from a map of CSV file texts
function loadDataset(filesMap) {
  const required = [
    "courses.csv",
    "students.csv",
    "enrollments.csv",
    "timeslots.csv",
    "rooms.csv",
    "conflicts.csv",
  ];
  for (const name of required) {
    if (!filesMap[name]) throw new Error(`Missing file: ${name}`);
  }

  const courses = parseCSV(filesMap["courses.csv"]).map((r) => ({
    id: r.course_id,
    name: r.course_name,
    enrolled: parseInt(r.enrolled_students, 10),
  }));

  const students = parseCSV(filesMap["students.csv"]).map((r) => ({
    id: r.student_id,
    name: r.student_name,
  }));

  const enrollments = parseCSV(filesMap["enrollments.csv"]).map((r) => ({
    studentId: r.student_id,
    courseId: r.course_id,
  }));

  const timeslots = parseCSV(filesMap["timeslots.csv"]).map((r) => ({
    id: r.timeslot_id,
    day: r.day,
    period: r.period,
  }));

  const rooms = parseCSV(filesMap["rooms.csv"]).map((r) => ({
    id: r.room_id,
    capacity: parseInt(r.capacity, 10),
  }));

  const conflicts = parseCSV(filesMap["conflicts.csv"]).map((r) => ({
    course1: r.course_1,
    course2: r.course_2,
    shared: parseInt(r.shared_students, 10),
  }));

  const courseIndex = {};
  courses.forEach((c, i) => (courseIndex[c.id] = i));

  const timeslotIndex = {};
  timeslots.forEach((t, i) => (timeslotIndex[t.id] = i));

  const studentCourses = {};
  enrollments.forEach((e) => {
    if (!studentCourses[e.studentId]) studentCourses[e.studentId] = [];
    studentCourses[e.studentId].push(e.courseId);
  });

  const conflictMap = {};
  conflicts.forEach((c) => {
    conflictMap[`${c.course1}|${c.course2}`] = c.shared;
    conflictMap[`${c.course2}|${c.course1}`] = c.shared;
  });

  const timeslotDay = {};
  timeslots.forEach((t) => (timeslotDay[t.id] = t.day));

  return {
    courses,
    students,
    enrollments,
    timeslots,
    rooms,
    conflicts,
    courseIndex,
    timeslotIndex,
    studentCourses,
    conflictMap,
    timeslotDay,
  };
}

window.DataLoader = { parseCSV, loadDataset };
