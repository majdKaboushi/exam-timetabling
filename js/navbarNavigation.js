// Navbar Navigation Module
// Handles smooth scrolling and active state management

class NavbarNavigation {
  constructor() {
    this.navLinks = null;
    this.sections = ['data-section', 'gaCard', 'psoCard', 'acoCard', 'expCard'];
    this.init();
  }

  init() {
    // Wait for components to load
    setTimeout(() => {
      this.navLinks = document.querySelectorAll('.navbar-nav .nav-link[data-target]');
      this.setupNavigation();
      this.setupScrollSpy();
    }, 1500);
  }

  setupNavigation() {
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();

        // Remove active class from all links
        this.navLinks.forEach(l => l.classList.remove('active'));

        // Add active class to clicked link
        link.classList.add('active');

        // Get target section ID
        const targetId = link.getAttribute('data-target');
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          // Check if section is hidden
          if (targetElement.style.display === 'none') {
            // Show alert that data needs to be loaded first
            alert('Please load data first to access this section.');
            // Keep Data section active
            this.navLinks.forEach(l => l.classList.remove('active'));
            const dataLink = document.querySelector('.nav-link[data-target="data-section"]');
            if (dataLink) dataLink.classList.add('active');
            return;
          }

          // Scroll to element
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

          // Close mobile menu if open
          const navbarCollapse = document.getElementById('navbarNav');
          if (navbarCollapse && navbarCollapse.classList.contains('show')) {
            const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
            if (bsCollapse) {
              bsCollapse.hide();
            }
          }
        }
      });
    });
  }

  setupScrollSpy() {
    window.addEventListener('scroll', () => {
      let current = '';

      this.sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section && section.style.display !== 'none') {
          const sectionTop = section.offsetTop;
          if (window.pageYOffset >= sectionTop - 200) {
            current = sectionId;
          }
        }
      });

      // If no visible section matches, default to data-section
      if (!current) {
        current = 'data-section';
      }

      this.navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-target') === current) {
          link.classList.add('active');
        }
      });
    });
  }

  // Method to refresh navigation (call after data is loaded)
  refresh() {
    this.navLinks = document.querySelectorAll('.navbar-nav .nav-link[data-target]');
  }
}

// Initialize when DOM is ready
let navbarNav;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    navbarNav = new NavbarNavigation();
  });
} else {
  navbarNav = new NavbarNavigation();
}

// Make available globally
if (typeof window !== 'undefined') {
  window.navbarNav = navbarNav;
}
