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

  // Initialize frontpage image slideshow if present
  initFrontpageSlideshow();
});

let frontpageSlideshowCleanup = null;

function initFrontpageSlideshow() {
  const slideshow = document.getElementById('frontpageSlideshow');
  if (!slideshow) return;

  // Rydd opp tidligere timere/lyttere hvis funksjonen kalles på nytt (f.eks. etter Supabase-innlasting)
  if (typeof frontpageSlideshowCleanup === 'function') {
    frontpageSlideshowCleanup();
    frontpageSlideshowCleanup = null;
  }

  const track = slideshow.querySelector('.slideshow-track');
  const prevBtn = document.getElementById('slideshowPrev');
  const nextBtn = document.getElementById('slideshowNext');
  const dotsContainer = document.getElementById('slideshowDots');

  let currentIndex = 0;
  let autoPlayTimer = null;
  const AUTO_PLAY_MS = 5000;

  const getSlides = () => (track ? Array.from(track.querySelectorAll('.slideshow-slide')) : []);
  const getDots = () => (dotsContainer ? Array.from(dotsContainer.querySelectorAll('.slideshow-dot')) : []);

  // Synkroniser prikker (dots), aria-labels og knapper dynamisk ut fra antall slides i DOM
  const syncControlsWithSlides = () => {
    const slides = getSlides();
    const total = slides.length;

    slides.forEach((slide, idx) => {
      slide.setAttribute('aria-label', `Bilde ${idx + 1} av ${total}`);
    });

    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      if (total > 1) {
        slides.forEach((_, idx) => {
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'slideshow-dot' + (idx === currentIndex ? ' is-active' : '');
          dot.setAttribute('role', 'tab');
          dot.setAttribute('aria-selected', String(idx === currentIndex));
          dot.setAttribute('aria-label', `Vis bilde ${idx + 1}`);
          dot.setAttribute('data-slide-to', String(idx));
          dotsContainer.appendChild(dot);
        });
      }
      dotsContainer.hidden = total <= 1;
    }

    if (prevBtn) prevBtn.hidden = total <= 1;
    if (nextBtn) nextBtn.hidden = total <= 1;
  };

  const showSlide = (index) => {
    const slides = getSlides();
    const dots = getDots();
    if (slides.length === 0) return;

    currentIndex = (index + slides.length) % slides.length;

    slides.forEach((slide, idx) => {
      const isActive = idx === currentIndex;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
    });

    dots.forEach((dot, idx) => {
      const isActive = idx === currentIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-selected', String(isActive));
    });
  };

  const nextSlide = () => showSlide(currentIndex + 1);
  const prevSlide = () => showSlide(currentIndex - 1);

  const stopAutoPlay = () => {
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
      autoPlayTimer = null;
    }
  };

  const startAutoPlay = () => {
    stopAutoPlay();
    if (getSlides().length > 1) {
      autoPlayTimer = setInterval(nextSlide, AUTO_PLAY_MS);
    }
  };

  const onPrevClick = () => {
    prevSlide();
    startAutoPlay();
  };

  const onNextClick = () => {
    nextSlide();
    startAutoPlay();
  };

  const onDotClick = (e) => {
    const dot = e.target.closest('.slideshow-dot');
    if (!dot) return;
    const targetIndex = Number(dot.getAttribute('data-slide-to'));
    if (!Number.isNaN(targetIndex)) {
      showSlide(targetIndex);
      startAutoPlay();
    }
  };

  if (prevBtn) prevBtn.addEventListener('click', onPrevClick);
  if (nextBtn) nextBtn.addEventListener('click', onNextClick);
  if (dotsContainer) dotsContainer.addEventListener('click', onDotClick);

  slideshow.addEventListener('mouseenter', stopAutoPlay);
  slideshow.addEventListener('mouseleave', startAutoPlay);
  slideshow.addEventListener('focusin', stopAutoPlay);
  slideshow.addEventListener('focusout', startAutoPlay);

  frontpageSlideshowCleanup = () => {
    stopAutoPlay();
    if (prevBtn) prevBtn.removeEventListener('click', onPrevClick);
    if (nextBtn) nextBtn.removeEventListener('click', onNextClick);
    if (dotsContainer) dotsContainer.removeEventListener('click', onDotClick);
    slideshow.removeEventListener('mouseenter', stopAutoPlay);
    slideshow.removeEventListener('mouseleave', startAutoPlay);
    slideshow.removeEventListener('focusin', stopAutoPlay);
    slideshow.removeEventListener('focusout', startAutoPlay);
  };

  syncControlsWithSlides();
  showSlide(0);
  startAutoPlay();
}

/**
 * Bygger slides dynamisk fra en liste med bilder (f.eks. fra Supabase/admin-panelet)
 * Støtter fritt antall bilder: [{ url, alt, caption }, ...] eller ['url1', 'url2', ...]
 */
function setFrontpageSlideshowImages(items) {
  const slideshow = document.getElementById('frontpageSlideshow');
  if (!slideshow) return;
  const track = slideshow.querySelector('.slideshow-track');
  if (!track || !Array.isArray(items) || items.length === 0) return;

  track.innerHTML = '';

  items.forEach((item, idx) => {
    const isObj = item && typeof item === 'object';
    const url = isObj ? (item.url || item.image_url || item.src || '') : String(item || '');
    const alt = isObj ? (item.alt || item.caption || `Bilde ${idx + 1}`) : `Bilde ${idx + 1}`;
    const caption = isObj ? (item.caption || '') : '';

    const slide = document.createElement('div');
    slide.className = 'slideshow-slide' + (idx === 0 ? ' is-active' : '');
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');

    const media = document.createElement('div');
    media.className = 'slideshow-media';

    const img = document.createElement('img');
    img.className = 'slideshow-img';
    img.setAttribute('src', url);
    img.setAttribute('alt', alt);
    media.appendChild(img);

    const placeholder = document.createElement('div');
    placeholder.className = 'slideshow-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
          stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
      </svg>
      <span></span>
    `;
    placeholder.querySelector('span').textContent = caption || `Bilde ${idx + 1}`;
    media.appendChild(placeholder);

    if (caption && url) {
      const capEl = document.createElement('div');
      capEl.className = 'slideshow-caption';
      capEl.textContent = caption;
      media.appendChild(capEl);
    }

    slide.appendChild(media);
    track.appendChild(slide);
  });

  initFrontpageSlideshow();
}

window.initFrontpageSlideshow = initFrontpageSlideshow;
window.setFrontpageSlideshowImages = setFrontpageSlideshowImages;
