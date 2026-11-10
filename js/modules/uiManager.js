/**
 * UIManager Module
 * Handles UI rendering and updates
 */

class UIManager {
  constructor() {
    this.elements = {};
  }

  getElement(id) {
    if (!this.elements[id]) {
      this.elements[id] = document.getElementById(id);
    }
    return this.elements[id];
  }

  showElement(id, animationClass = "fade-in") {
    const element = this.getElement(id);
    if (element) {
      element.style.display = "block";
      if (animationClass) {
        element.classList.add(animationClass);
      }
    }
  }

  hideElement(id) {
    const element = this.getElement(id);
    if (element) {
      element.style.display = "none";
    }
  }

  setElementText(id, text) {
    const element = this.getElement(id);
    if (element) {
      element.textContent = text;
    }
  }

  setElementHTML(id, html) {
    const element = this.getElement(id);
    if (element) {
      element.innerHTML = html;
    }
  }

  disableButton(id, disabled = true) {
    const element = this.getElement(id);
    if (element) {
      element.disabled = disabled;
    }
  }

  renderScheduleTable(tableId, courses, schedule, timeslots) {
    const table = this.getElement(tableId);
    if (!table) return;

    let html = `
      <thead>
        <tr>
          <th>Course ID</th>
          <th>Course Name</th>
          <th>Timeslot</th>
          <th>Day</th>
          <th>Room</th>
        </tr>
      </thead>
      <tbody>
    `;

    for (const course of courses) {
      const assignment = schedule[course.id];
      const timeslotData =
        assignment && assignment.timeslot
          ? timeslots.find((t) => t.id === assignment.timeslot)
          : null;

      html += `
        <tr>
          <td>${course.id}</td>
          <td>${course.name}</td>
          <td>${assignment ? assignment.timeslot ?? "—" : "—"}</td>
          <td>${timeslotData ? timeslotData.day + " / " + timeslotData.period : "—"}</td>
          <td>${assignment ? assignment.room ?? "—" : "—"}</td>
        </tr>
      `;
    }

    html += "</tbody>";
    table.innerHTML = html;
  }

  renderFitnessSummary(containerId, evaluation) {
    const container = this.getElement(containerId);
    if (!container) return;

    const isFeasible = Constraints.isFeasible(evaluation);

    container.innerHTML = `
      <div class="row g-3">
        <div class="col-md-4">
          <div class="stat-card">
            <div class="stat-value">${evaluation.fitness}</div>
            <div class="stat-label">Fitness</div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="stat-card">
            <div class="stat-value">${evaluation.A}</div>
            <div class="stat-label">A (Conflicts)</div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="stat-card">
            <div class="stat-value">
              <span class="badge ${isFeasible ? "badge-success" : "badge-danger"}">
                ${isFeasible ? "Feasible ✔" : "Infeasible ✘"}
              </span>
            </div>
            <div class="stat-label">Status</div>
          </div>
        </div>
      </div>
    `;
  }

  renderDataSummary(courses, students, timeslots, rooms) {
    this.setElementHTML(
      "summaryBox",
      `
      <div class="row g-3">
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-value">${courses.length}</div>
            <div class="stat-label">Courses</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-value">${students.length}</div>
            <div class="stat-label">Students</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-value">${timeslots.length}</div>
            <div class="stat-label">Timeslots</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-value">${rooms.length}</div>
            <div class="stat-label">Rooms</div>
          </div>
        </div>
      </div>
    `
    );
  }

  renderExperimentResults(summary) {
    const table = this.getElement("expResultsTable");
    if (!table) return;

    let html = `
      <thead>
        <tr>
          <th>Algorithm</th>
          <th>Best Fitness</th>
          <th>Worst Fitness</th>
          <th>Avg Fitness</th>
          <th>Std Dev</th>
          <th>Avg Time (ms)</th>
        </tr>
      </thead>
      <tbody>
    `;

    for (const alg of ["GA", "PSO", "ACO"]) {
      const stats = summary[alg];
      html += `
        <tr>
          <td><strong>${alg}</strong></td>
          <td>${stats.fitness.min.toFixed(0)}</td>
          <td>${stats.fitness.max.toFixed(0)}</td>
          <td>${stats.fitness.avg.toFixed(1)}</td>
          <td>${stats.fitness.std.toFixed(2)}</td>
          <td>${stats.time.avg.toFixed(0)}</td>
        </tr>
      `;
    }

    html += "</tbody>";
    table.innerHTML = html;
  }
}

// Make available globally (for non-module environments)
if (typeof window !== 'undefined') {
  window.UIManager = UIManager;
}
