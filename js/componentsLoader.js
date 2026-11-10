// Component Loader - loads HTML components dynamically
const components = [
  { file: 'components/navbar.html', container: 'navbar-container' },
  { file: 'components/data-upload.html', container: 'components-container' },
  { file: 'components/settings.html', container: 'components-container' },
  { file: 'components/data-summary.html', container: 'components-container' },
  { file: 'components/greedy-result.html', container: 'components-container' },
  { file: 'components/ga-section.html', container: 'components-container' },
  { file: 'components/pso-section.html', container: 'components-container' },
  { file: 'components/aco-section.html', container: 'components-container' },
  { file: 'components/experiments.html', container: 'components-container' },
  { file: 'components/log-section.html', container: 'components-container' },
  { file: 'components/chart-section.html', container: 'components-container' },
  { file: 'components/footer.html', container: 'footer-container' }
];

async function loadComponents() {
  for (const component of components) {
    try {
      const response = await fetch(component.file);
      if (!response.ok) {
        console.warn(`Failed to load ${component.file}: ${response.status}`);
        continue;
      }
      const html = await response.text();
      const container = document.getElementById(component.container);
      if (container) {
        container.innerHTML += html;
      }
    } catch (error) {
      console.error(`Error loading ${component.file}:`, error);
    }
  }
}

// Load components when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadComponents);
} else {
  loadComponents();
}
