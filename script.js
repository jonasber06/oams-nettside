// JavaScript for OAMS Website (Clean & Modern)

document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('masthead');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mainNav = document.getElementById('mainNav');
  const dropdownItems = document.querySelectorAll('.nav-item.has-dropdown');

  // Change header appearance on scroll
  const handleScroll = () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Initial check

  // Toggle mobile menu
  if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
      mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
      mainNav.classList.toggle('is-open');
    });

    // Close when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 860 && mainNav.classList.contains('is-open')) {
        if (!mainNav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
          mainNav.classList.remove('is-open');
          mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
      }
    });

    // Close when clicking direct anchor links on mobile
    mainNav.querySelectorAll('a:not(.has-dropdown > a)').forEach((anchor) => {
      anchor.addEventListener('click', () => {
        if (window.innerWidth <= 860) {
          mainNav.classList.remove('is-open');
          mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  // Handle dropdown toggle on mobile devices
  dropdownItems.forEach((item) => {
    const link = item.querySelector('.nav-link');
    if (link) {
      link.addEventListener('click', (e) => {
        if (window.innerWidth <= 860) {
          e.preventDefault();
          const wasOpen = item.classList.contains('dropdown-open');
          // Close other open dropdowns
          dropdownItems.forEach((other) => other.classList.remove('dropdown-open'));
          if (!wasOpen) {
            item.classList.add('dropdown-open');
          }
        }
      });
    }
  });
});
