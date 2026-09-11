/* ==========================================================================
   AVODAH CONTRACTORS — script.js (vanilla JS, no dependencies)
   Handles: mobile nav, gallery filtering, lightbox, budget slider output
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    function setNav(open) {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    toggle.addEventListener('click', function () {
      setNav(!nav.classList.contains('open'));
    });
    // Escape closes the menu and puts focus back on the button that opened it,
    // so keyboard users are not stranded inside an open overlay.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        setNav(false);
        toggle.focus();
      }
    });
    // Tabbing past the last link, or clicking outside, closes the menu.
    document.addEventListener('focusin', function (e) {
      if (nav.classList.contains('open') &&
          !nav.contains(e.target) && e.target !== toggle) {
        setNav(false);
      }
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('open') &&
          !nav.contains(e.target) && !toggle.contains(e.target)) {
        setNav(false);
      }
    });
  }

  /* ---------- Hero video: honour prefers-reduced-motion ----------
     The markup autoplays so it works without JS, but people who have asked
     their OS for reduced motion should keep the still poster (WCAG 2.2.2).
     Removing the attribute matters for Safari, which will otherwise resume
     playback on its own after the pause. */
  var heroVideo = document.querySelector('video.hero-bg');
  if (heroVideo && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    heroVideo.removeAttribute('autoplay');
    heroVideo.pause();
  }

  /* ---------- Sticky header: reveal on scroll up, hide on scroll down ---------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var lastY = window.pageYOffset;
    var ticking = false;
    var THRESHOLD = 8; // ignore tiny scroll jitters
    var isOverlay = document.body.classList.contains('nav-overlay');

    // On overlay (homepage) the header starts transparent over the video.
    if (isOverlay && window.pageYOffset <= 10) {
      header.classList.add('at-top');
    }

    function onScroll() {
      var y = window.pageYOffset;
      header.classList.toggle('header-scrolled', y > 4);

      // Overlay header: transparent while at/near the top. Using a wider zone
      // (<= 60px) lets the CSS color/gradient transitions ease in as the user
      // scrolls back up, instead of snapping exactly at the top.
      if (isOverlay) {
        if (y <= 60) {
          header.classList.add('at-top');
          header.classList.remove('header-hidden');
          lastY = y;
          ticking = false;
          return;
        } else {
          header.classList.remove('at-top');
        }
      }

      // Never hide while the mobile menu is open.
      if (nav && nav.classList.contains('open')) {
        header.classList.remove('header-hidden');
        lastY = y;
        ticking = false;
        return;
      }
      if (Math.abs(y - lastY) > THRESHOLD) {
        if (y > lastY && y > 80) {
          header.classList.add('header-hidden');   // scrolling down
        } else {
          header.classList.remove('header-hidden'); // scrolling up
        }
        lastY = y;
      }
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
  }

  /* ---------- Gallery filtering ---------- */
  var filterBtns = document.querySelectorAll('.filter-btn');
  var items = document.querySelectorAll('.gallery-item');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cat = btn.getAttribute('data-filter');
      filterBtns.forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      items.forEach(function (item) {
        var match = cat === 'all' || item.getAttribute('data-category') === cat;
        if (match) { item.removeAttribute('hidden'); }
        else { item.setAttribute('hidden', ''); }
      });
    });
  });

  /* ---------- Lightbox / spotlight ---------- */
  var lightbox = document.querySelector('.lightbox');
  if (lightbox) {
    var lbImg = lightbox.querySelector('.lightbox-img');
    var lbPh = lightbox.querySelector('.lightbox-ph');
    var lbCaption = lightbox.querySelector('.lightbox-caption');
    var lbClose = lightbox.querySelector('.lightbox-close');
    var lbPrev = lightbox.querySelector('.lightbox-prev');
    var lbNext = lightbox.querySelector('.lightbox-next');
    var lastFocus = null;
    // Both filtered galleries (.gallery-item) and the homepage collage
    // (.collage-item) open the same spotlight.
    var lbTriggers = document.querySelectorAll('.gallery-item, .collage-item');

    // The set of photos the person can click-to-scroll through — every
    // trigger sharing the same parent (a 2x2 spotlight grid, or the
    // homepage collage) becomes one navigable group.
    var lbGroup = [];
    var lbIndex = -1;

    function showItem(item) {
      lastFocus = lastFocus || item;
      var full = item.getAttribute('data-full');
      var phSource = item.querySelector('.ph');
      var figcaption = item.querySelector('figcaption');
      var caption = figcaption ? figcaption.textContent : (item.getAttribute('data-label') || '');
      var alt = item.querySelector('img')
        ? item.querySelector('img').getAttribute('alt') : (item.getAttribute('data-label') || 'Project photo');
      if (full) {
        // A real photo is available.
        if (lbImg) { lbImg.setAttribute('src', full); lbImg.setAttribute('alt', alt); lbImg.hidden = false; }
        if (lbPh) { lbPh.hidden = true; }
      } else if (phSource) {
        // No photo yet — show the same labeled placeholder frame, enlarged.
        if (lbPh) { lbPh.textContent = phSource.textContent; lbPh.hidden = false; }
        if (lbImg) { lbImg.hidden = true; lbImg.setAttribute('src', ''); }
      }
      if (lbCaption) { lbCaption.textContent = caption; }
    }

    function updateNavVisibility() {
      var show = lbGroup.length > 1;
      if (lbPrev) { lbPrev.hidden = !show; }
      if (lbNext) { lbNext.hidden = !show; }
    }

    function openLightbox(item) {
      lastFocus = item;
      var parent = item.parentElement;
      lbGroup = parent ? Array.prototype.slice.call(parent.querySelectorAll('.gallery-item, .collage-item')) : [item];
      lbIndex = lbGroup.indexOf(item);
      if (lbIndex < 0) { lbGroup = [item]; lbIndex = 0; }
      showItem(lbGroup[lbIndex]);
      updateNavVisibility();
      lightbox.classList.add('open');
      lbClose.focus();
      document.body.style.overflow = 'hidden';
    }
    function goTo(offset) {
      if (lbGroup.length < 2) { return; }
      lbIndex = (lbIndex + offset + lbGroup.length) % lbGroup.length;
      showItem(lbGroup[lbIndex]);
    }
    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
      if (lbImg) { lbImg.hidden = true; lbImg.setAttribute('src', ''); }
      if (lbPh) { lbPh.hidden = true; }
      if (lastFocus) { lastFocus.focus(); }
      lbGroup = [];
      lbIndex = -1;
    }
    lbTriggers.forEach(function (item) {
      item.addEventListener('click', function () { openLightbox(item); });
    });

    /* Category cards (Custom / Commercial "What we build" grid) open the
       lightbox straight onto their category's photo set — no intermediate
       modal. The set lives in a hidden container, so its thumbnails never
       download; the lightbox reads data-full and alt straight off them.
       lastFocus is re-pointed at the card afterwards, because the hidden
       thumbnail we open on isn't focusable and focus would otherwise be
       dropped to <body> when the lightbox closes. */
    document.querySelectorAll('[data-lightbox-group]').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var set = document.getElementById(trigger.getAttribute('data-lightbox-group'));
        var first = set ? set.querySelector('.gallery-item') : null;
        if (!first) { return; }
        openLightbox(first);
        lastFocus = trigger;
      });
    });
    if (lbPrev) { lbPrev.addEventListener('click', function () { goTo(-1); }); }
    if (lbNext) { lbNext.addEventListener('click', function () { goTo(1); }); }
    lbClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) { closeLightbox(); }
    });
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('open')) { return; }
      if (e.key === 'Escape') { closeLightbox(); return; }
      if (e.key === 'ArrowLeft') { goTo(-1); return; }
      if (e.key === 'ArrowRight') { goTo(1); return; }
      // Focus trap: the lightbox is aria-modal, so Tab must cycle inside it
      // rather than walking onto the page still rendered behind the overlay.
      if (e.key === 'Tab') {
        var focusable = Array.prototype.filter.call(
          lightbox.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
          function (el) { return !el.hidden && !el.disabled && el.offsetParent !== null; }
        );
        if (!focusable.length) { return; }
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    });
  }

  /* ---------- Budget range slider ---------- */
  var slider = document.getElementById('budget');
  var output = document.getElementById('budget-out');
  if (slider && output) {
    var fmt = function (v) {
      v = Number(v);
      if (v >= 2000000) { return '$2,000,000+'; }
      return '$' + v.toLocaleString('en-US');
    };
    var update = function () { output.textContent = fmt(slider.value); };
    slider.addEventListener('input', update);
    update();
  }

  /* ---------- Demo form handler ----------
     Static HTML cannot submit on its own. Replace this with your JotForm
     embed (recommended) or point the form's action at a real endpoint.
     See README for instructions. */
  var demoForms = document.querySelectorAll('form[data-demo]');
  demoForms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      alert('This is a placeholder form. Connect it to JotForm or a backend before launch — see README.');
    });
  });

  /* ---------- Scroll-driven process line drawing (Our Process page) ----------
     Five SVG groups (#ph1..#ph5) draw themselves sequentially as the user
     scrolls through .scrolly-track. Each phase also fades its step box in
     up-and-to-the-right; during phase 5 the seated figures fade as the
     excited figures appear outside the finished house. */
  var scrolly = document.querySelector('.scrolly');
  if (scrolly) {
    var svg = scrolly.querySelector('.scrolly-svg');
    var phaseEls = ['#ph1', '#ph2', '#ph3', '#ph4', '#ph5'].map(function (sel) {
      return scrolly.querySelector(sel);
    });
    var sBoxes = Array.prototype.slice.call(scrolly.querySelectorAll('.scrolly-box'));

    // Measure every path once; prime dasharray/dashoffset so nothing is drawn.
    var phases = phaseEls.map(function (g) {
      var ps = Array.prototype.slice.call(g.querySelectorAll('path'));
      var lens = ps.map(function (p) {
        var L = p.getTotalLength();
        p.style.strokeDasharray = L + ' ' + L;
        p.style.strokeDashoffset = L;
        p.style.visibility = 'hidden';
        return L;
      });
      var total = lens.reduce(function (a, b) { return a + b; }, 0);
      return { el: g, paths: ps, lens: lens, total: total };
    });

    // Draw a phase's paths sequentially: q in [0,1] sweeps the pen through
    // the group's cumulative length, path by path.
    function drawPhase(i, q) {
      var ph = phases[i];
      var target = q * ph.total;
      var acc = 0;
      for (var k = 0; k < ph.paths.length; k++) {
        var L = ph.lens[k];
        var drawn = Math.max(0, Math.min(L, target - acc));
        ph.paths[k].style.strokeDashoffset = L - drawn;
        // Hide fully-undrawn paths: round linecaps otherwise render a dot
        // artifact at the start point even at full dashoffset.
        ph.paths[k].style.visibility = drawn > 0.5 ? 'visible' : 'hidden';
        acc += L;
      }
    }

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      // Static: the finished scene, with frame/interior faded as built.
      phases.forEach(function (_, i) { drawPhase(i, 1); });
      phases[2].el.style.opacity = '0.1';
      phases[0].el.style.opacity = '0.12';
      sBoxes.forEach(function (b) { b.classList.add('shown'); b.style.setProperty('--fill', '100%'); });
      scrolly.classList.add('scrolly-static', 'ready');
    } else {
      var sTicking = false;
      function scrollyUpdate() {
        var rect = scrolly.querySelector('.scrolly-track').getBoundingClientRect();
        var span = rect.height - window.innerHeight;
        var p = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 1;
        var N = phases.length;
        for (var i = 0; i < N; i++) {
          var q = Math.min(1, Math.max(0, (p - i / N) * N));
          drawPhase(i, q);
          // Accumulating steps: each box is outlined from the start and
          // fills in left-to-right as its phase draws, rather than
          // appearing from nothing.
          sBoxes[i].style.setProperty('--fill', (q * 100).toFixed(1) + '%');
          if (q > 0.04) { sBoxes[i].classList.add('shown'); }
        }
        // Phase 4: the shell closes in — the frame and the interior scene
        // fade behind the new walls and roof (line art has no occlusion,
        // so we fake it). Phase 5 finishes the fade as the people come out.
        var q4 = Math.min(1, Math.max(0, (p - 0.6) * 5));
        var q5 = Math.min(1, Math.max(0, (p - 0.8) * 5));
        phases[2].el.style.opacity = (1 - 0.92 * q4).toFixed(3);
        phases[0].el.style.opacity = (1 - 0.70 * q4 - 0.22 * q5).toFixed(3);
        sTicking = false;
      }
      window.addEventListener('scroll', function () {
        if (!sTicking) { window.requestAnimationFrame(scrollyUpdate); sTicking = true; }
      }, { passive: true });
      window.addEventListener('resize', scrollyUpdate);
      scrollyUpdate();
      scrolly.classList.add('ready');
    }
  }

  /* NOTE (v10 revision 4): the carousel engine and the category "spotlight"
     modal handler were removed with the Window 2 rework. Custom and Commercial
     were their only consumers; those pages now use a static category grid whose
     cards open the shared lightbox directly. */

  /* ---------- Gallery "show more" toggle (Custom / Commercial) ---------- */
  document.querySelectorAll('[data-gallery-toggle]').forEach(function (btn) {
    var section = btn.closest('section');
    if (!section) { return; }
    var extras = Array.prototype.slice.call(section.querySelectorAll('.gallery-item.is-extra'));
    var expanded = false;
    btn.addEventListener('click', function () {
      expanded = !expanded;
      extras.forEach(function (el) {
        if (expanded) { el.removeAttribute('hidden'); }
        else { el.setAttribute('hidden', ''); }
      });
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      btn.textContent = expanded ? 'Show fewer projects' : 'Show more projects';
    });
  });
})();
