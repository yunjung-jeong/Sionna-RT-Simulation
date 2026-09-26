/* Contents scrollspy, ported from the CV (cv/script.js), reduced to what this page needs.
   Optional: without it the contents list is a plain list of anchors and the rail uses
   the CSS default for the rail head's height. It
   - marks the current section's link with aria-current (the dot leader fills in, or the
     running bar underlines it) and gives the section the is-current class;
   - keeps the current link in view when the running bar scrolls sideways (phones);
   - measures the rail head so the contents sit directly beneath it (--rh-h). */
(function () {
  'use strict';

  var root = document.documentElement;
  var railHead = document.querySelector('.rail-head');
  var list = document.querySelector('.toc ol');

  function measureRailHead() {
    if (!railHead) return;
    var h = railHead.getBoundingClientRect().height;
    if (h > 0) root.style.setProperty('--rh-h', Math.ceil(h) + 'px');
  }
  if (railHead && 'ResizeObserver' in window) {
    new ResizeObserver(measureRailHead).observe(railHead);
  }
  measureRailHead();

  var sections = Array.prototype.slice.call(document.querySelectorAll('main .section[id]'));
  if (!sections.length) return;

  var linksById = {};
  Array.prototype.forEach.call(document.querySelectorAll('.toc a[href^="#"]'), function (a) {
    linksById[a.getAttribute('href').slice(1)] = a;
  });

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var currentId;

  // Capped so a very tall window does not overshoot a short section.
  function readingOffset() { return Math.min(window.innerHeight * 0.32, 260); }

  // Running bar only: scroll it sideways so the current link is visible.
  function reveal(link) {
    if (!list || !link || list.scrollWidth <= list.clientWidth + 1) return;
    var li = link.parentNode;
    var left = li.offsetLeft - list.offsetLeft - 24;
    var right = li.offsetLeft - list.offsetLeft + li.offsetWidth + 48;
    if (left < list.scrollLeft || right > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: Math.max(0, left), behavior: reduce ? 'auto' : 'smooth' });
    }
  }

  function apply(id) {
    if (id === currentId) return;
    currentId = id;
    Object.keys(linksById).forEach(function (key) {
      if (key === id) linksById[key].setAttribute('aria-current', 'true');
      else linksById[key].removeAttribute('aria-current');
    });
    sections.forEach(function (s) { s.classList.toggle('is-current', s.id === id); });
    if (id) reveal(linksById[id]);
    else if (list) list.scrollLeft = 0;
  }

  // Measured live: lazy images above can still change the layout after load.
  function pick() {
    var y = window.scrollY;
    var line = readingOffset();
    var id = null;   // above the first section (title, hero, glance): nothing is current
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= line) id = sections[i].id;
      else break;
    }
    // The last sections are short; once the page bottoms out, the last one is current.
    if (id && y + window.innerHeight >= root.scrollHeight - 2) id = sections[sections.length - 1].id;
    apply(id);
  }

  function remeasure() { measureRailHead(); pick(); }

  window.addEventListener('scroll', pick, { passive: true });
  window.addEventListener('resize', remeasure);
  window.addEventListener('load', remeasure);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(remeasure).catch(function () { /* ignore */ });
  }
  remeasure();
})();
