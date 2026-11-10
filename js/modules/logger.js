/**
 * Logger Module
 * Handles all logging operations
 */

class Logger {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
  }

  log(message) {
    if (this.element) {
      this.element.textContent += message + "\n";
      this.element.scrollTop = this.element.scrollHeight;
    }
  }

  error(message) {
    console.error(message);
    this.log(`Error: ${message}`);
  }

  clear() {
    if (this.element) {
      this.element.textContent = "";
    }
  }
}

// Make available globally (for non-module environments)
if (typeof window !== 'undefined') {
  window.Logger = Logger;
}
