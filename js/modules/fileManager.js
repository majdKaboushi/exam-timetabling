/**
 * FileManager Module
 * Handles file operations including upload, validation, and export
 */

class FileManager {
  constructor(requiredFiles) {
    this.requiredFiles = requiredFiles;
  }

  async collectFiles() {
    const filesMap = {};
    const bulk = document.getElementById("bulkInput").files;

    for (const file of bulk) {
      if (this.requiredFiles.includes(file.name)) {
        filesMap[file.name] = await file.text();
      }
    }

    const inputs = document.querySelectorAll("#individualInputs input[type=file]");
    for (const input of inputs) {
      if (input.files.length > 0) {
        filesMap[input.dataset.name] = await input.files[0].text();
      }
    }

    return filesMap;
  }

  validateFiles(filesMap) {
    const missing = this.requiredFiles.filter((name) => !filesMap[name]);
    return missing.length === 0 ? null : missing;
  }

  downloadFile(filename, content, type = "text/csv") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  exportScheduleToCSV(schedule, courses, timeslots, filename) {
    let csv = "Course ID,Course Name,Timeslot,Day,Period,Room\n";

    for (const course of courses) {
      const assignment = schedule[course.id];
      const timeslotData =
        assignment && assignment.timeslot
          ? timeslots.find((t) => t.id === assignment.timeslot)
          : null;

      csv += `${course.id},${course.name},${
        assignment ? assignment.timeslot ?? "" : ""
      },${timeslotData ? timeslotData.day : ""},${timeslotData ? timeslotData.period : ""},${
        assignment ? assignment.room ?? "" : ""
      }\n`;
    }

    this.downloadFile(filename, csv);
  }

  exportExperimentResultsToCSV(summary, filename) {
    let csv =
      "Algorithm,Best Fitness,Worst Fitness,Avg Fitness,StdDev,Avg Time(ms)\n";

    for (const alg of ["GA", "PSO", "ACO"]) {
      const stats = summary[alg];
      csv += `${alg},${stats.fitness.min},${stats.fitness.max},${stats.fitness.avg.toFixed(2)},${stats.fitness.std.toFixed(2)},${stats.time.avg.toFixed(2)}\n`;
    }

    this.downloadFile(filename, csv);
  }
}

// Make available globally (for non-module environments)
if (typeof window !== 'undefined') {
  window.FileManager = FileManager;
}
