/**
 * MissionEV - Master Application Controller
 * Handles:
 * - Scroll progress bar & solid header transition
 * - Real-time Indian Standard Time (IST) clock
 * - IntersectionObserver section reveal animations
 * - Animated count-up numbers on scroll
 * - Active chapter navigation tracking
 * - Global modals & keyboard navigation (Esc to close)
 */

(function () {
  'use strict';

  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initApp() {
    setupScrollBehavior();
    setupLiveClock();
    setupIntersectionReveals();
    setupCounterAnimations();
    setupModals();
    setupKeyboardShortcuts();
    setupMobileNav();
  }

  /**
   * Scroll progress & Header background
   */
  function setupScrollBehavior() {
    var progressBar = document.getElementById('progressBar');
    var header = document.getElementById('siteHeader');
    var navLinks = document.querySelectorAll('.nav a');
    var sections = document.querySelectorAll('section[id]');

    function onScroll() {
      var docEl = document.documentElement;
      var scrollTop = docEl.scrollTop || document.body.scrollTop;
      var scrollHeight = docEl.scrollHeight - docEl.clientHeight;
      var progress = Math.min(1, Math.max(0, scrollTop / Math.max(1, scrollHeight)));

      if (progressBar) {
        progressBar.style.transform = 'scaleX(' + progress + ')';
      }

      if (header) {
        header.classList.toggle('solid', scrollTop > 50);
      }

      // Highlight active chapter in nav
      var currentSectionId = '';
      sections.forEach(function (sec) {
        var top = sec.offsetTop - 120;
        var height = sec.offsetHeight;
        if (scrollTop >= top && scrollTop < top + height) {
          currentSectionId = sec.getAttribute('id');
        }
      });

      if (currentSectionId) {
        navLinks.forEach(function (link) {
          var href = link.getAttribute('href');
          if (href === '#' + currentSectionId) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Replay / Scroll to top CTA
    var replayBtn = document.getElementById('replayExperienceBtn');
    if (replayBtn) {
      replayBtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  /**
   * Live IST Clock & Pulse Telemetry
   */
  function setupLiveClock() {
    var clockEl = document.getElementById('liveClockTime');
    if (!clockEl) return;

    function updateTime() {
      var now = new Date();
      var options = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      var istTimeStr = new Intl.DateTimeFormat('en-GB', options).format(now);
      clockEl.textContent = istTimeStr + ' IST';
    }

    updateTime();
    setInterval(updateTime, 1000);
  }

  /**
   * IntersectionObserver Section Reveal
   */
  function setupIntersectionReveals() {
    var revealElements = document.querySelectorAll('.reveal');
    if (REDUCED || !('IntersectionObserver' in window)) {
      revealElements.forEach(function (el) { el.classList.add('in'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(function (el) {
      observer.observe(el);
    });
  }

  /**
   * Animated Count-Up Numbers
   */
  function setupCounterAnimations() {
    var counters = document.querySelectorAll('.counter-val');
    if (counters.length === 0) return;

    if (REDUCED || !('IntersectionObserver' in window)) {
      counters.forEach(function (c) {
        c.textContent = c.getAttribute('data-target');
      });
      return;
    }

    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    counters.forEach(function (c) {
      counterObserver.observe(c);
    });
  }

  function animateCounter(el) {
    var targetStr = el.getAttribute('data-target') || '0';
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var targetNum = parseFloat(targetStr.replace(/,/g, ''));
    var isDecimal = targetStr.indexOf('.') !== -1;
    var duration = 1400; // ms
    var start = performance.now();

    function frame(now) {
      var progress = Math.min((now - start) / duration, 1);
      // Ease out cubic
      var ease = 1 - Math.pow(1 - progress, 3);
      var current = targetNum * ease;

      el.textContent = prefix + (isDecimal ? current.toFixed(1) : Math.round(current).toLocaleString()) + suffix;

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = prefix + targetStr + suffix;
      }
    }

    requestAnimationFrame(frame);
  }

  /**
   * Modals Management
   */
  function setupModals() {
    var modals = document.querySelectorAll('.site-modal');
    var closeButtons = document.querySelectorAll('.modal-close-btn, .modal-backdrop');

    closeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        modals.forEach(function (m) { m.classList.remove('open'); });
      });
    });

    // Architecture Docs trigger
    var archDocsBtn = document.getElementById('openArchDocsBtn');
    var archModal = document.getElementById('archDocsModal');
    if (archDocsBtn && archModal) {
      archDocsBtn.addEventListener('click', function () {
        archModal.classList.add('open');
      });
    }
  }

  /**
   * Keyboard Shortcuts (Esc to close open drawers/modals)
   */
  function setupKeyboardShortcuts() {
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var openModals = document.querySelectorAll('.site-modal.open, .drawer.open');
        openModals.forEach(function (m) { m.classList.remove('open'); });
        var drawerOverlay = document.getElementById('tripDrawerOverlay');
        if (drawerOverlay) drawerOverlay.classList.remove('open');
      }
    });
  }

  /**
   * Mobile Navigation Hamburger Menu
   */
  function setupMobileNav() {
    var toggle = document.getElementById('mobileNavToggle');
    var drawer = document.getElementById('mobileNavDrawer');
    if (!toggle || !drawer) return;

    function openDrawer() {
      toggle.classList.add('open');
      drawer.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      toggle.classList.remove('open');
      drawer.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    toggle.addEventListener('click', function () {
      if (drawer.classList.contains('open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    // Close on any link click inside drawer
    var links = drawer.querySelectorAll('a');
    links.forEach(function (link) {
      link.addEventListener('click', function () {
        closeDrawer();
      });
    });

    // Close on backdrop tap (outside drawer)
    document.addEventListener('pointerdown', function (e) {
      if (drawer.classList.contains('open') && !drawer.contains(e.target) && e.target !== toggle && !toggle.contains(e.target)) {
        closeDrawer();
      }
    });

    // Close on Escape
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        closeDrawer();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
