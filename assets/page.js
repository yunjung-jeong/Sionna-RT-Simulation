/* Page behaviour for the visual layer. Optional: without it the page is complete (videos keep their native controls,
   every environment card is shown in turn, images open as plain links).
   - clips: play while on screen, pause off screen, one play/pause button each; no autoplay with reduced motion;
   - environment viewer (if present): one card at a time, chosen from a row of tabs built from the card titles;
   - carousel: previous / next buttons for the horizontally scrolling row of surroundings;
   - lightbox: figure images open full size over the page (Esc, the button or a click outside closes it);
   - reveal: figures fade in as they scroll into view (skipped with reduced motion). */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ------------------------------------------------------------ clips */
  var phone = window.matchMedia && window.matchMedia('(max-width: 40rem)').matches;

  Array.prototype.forEach.call(document.querySelectorAll('[data-clip]'), function (box) {
    var v = box.querySelector('video');
    if (!v) return;
    // Phones get the stacked cut of the same frames (panels one above the other), chosen once at load.
    var nb = v.getAttribute('data-narrow'), ns = (v.getAttribute('data-narrow-size') || '').split('x');
    if (phone && nb && ns.length === 2) {
      var srcs = v.querySelectorAll('source');
      if (srcs[0]) srcs[0].src = nb + '.webm';
      if (srcs[1]) srcs[1].src = nb + '.mp4';
      v.poster = nb + '_poster.webp';
      v.width = +ns[0]; v.height = +ns[1];
      v.style.aspectRatio = ns[0] + ' / ' + ns[1];
      v.load();
    }
    if (reduce || !hasIO) return;            // native controls stay; the viewer starts it

    v.removeAttribute('controls');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'clip-toggle';
    (box.querySelector('.clip-bar') || box).appendChild(btn);
    var userPaused = false;

    function sync() {
      var playing = !v.paused && !v.ended;
      btn.setAttribute('aria-label', playing ? 'Pause the animation' : 'Play the animation');
      btn.setAttribute('data-state', playing ? 'playing' : 'paused');
      btn.textContent = playing ? 'Pause' : 'Play';
    }
    function play() { var p = v.play(); if (p && p.catch) p.catch(function () { sync(); }); }

    btn.addEventListener('click', function () {
      if (v.paused) { userPaused = false; play(); } else { userPaused = true; v.pause(); }
    });
    v.addEventListener('play', sync);
    v.addEventListener('pause', sync);
    sync();

    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio >= 0.35) { if (!userPaused) play(); }
        else if (!v.paused) v.pause();
      });
    }, { threshold: [0, 0.35, 0.7] }).observe(v);
  });

  /* ------------------------------------------------------------ environment viewer */
  Array.prototype.forEach.call(document.querySelectorAll('[data-env-viewer]'), function (viewer) {
    var cards = Array.prototype.slice.call(viewer.querySelectorAll('.env-card'));
    if (cards.length < 2) return;
    viewer.classList.add('is-tabbed');

    var bar = document.createElement('div');
    bar.className = 'env-tabs';
    var tabs = [];
    var lastGroup = null;
    var row = null;

    cards.forEach(function (card, i) {
      var g = card.getAttribute('data-group') || '';
      if (g !== lastGroup) {
        var grp = document.createElement('div');
        grp.className = 'env-tab-group';
        var lab = document.createElement('p');
        lab.className = 'env-tab-group-label';
        lab.id = 'env-group-' + i;
        lab.textContent = g;
        row = document.createElement('div');
        row.className = 'env-tab-row';
        row.setAttribute('role', 'tablist');
        row.setAttribute('aria-labelledby', lab.id);
        grp.appendChild(lab);
        grp.appendChild(row);
        bar.appendChild(grp);
        lastGroup = g;
      }
      var name = card.querySelector('.env-name');
      var t = document.createElement('button');
      t.type = 'button';
      t.className = 'env-tab';
      t.id = 'tab-' + card.id;
      t.setAttribute('role', 'tab');
      t.setAttribute('aria-controls', card.id);
      t.textContent = name ? name.textContent.split(':')[0] : ('Card ' + (i + 1));
      card.setAttribute('role', 'tabpanel');
      card.setAttribute('aria-labelledby', t.id);
      t.addEventListener('click', function () { select(i, true); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') n = (i + 1) % cards.length;
        else if (k === 'ArrowLeft' || k === 'ArrowUp') n = (i - 1 + cards.length) % cards.length;
        else if (k === 'Home') n = 0;
        else if (k === 'End') n = cards.length - 1;
        if (n !== null) { e.preventDefault(); select(n, true); tabs[n].focus(); }
      });
      row.appendChild(t);
      tabs.push(t);
    });

    var nav = document.createElement('div');
    nav.className = 'env-step';
    var prev = document.createElement('button');
    var next = document.createElement('button');
    prev.type = next.type = 'button';
    prev.className = 'env-step-btn env-prev';
    next.className = 'env-step-btn env-next';
    prev.setAttribute('aria-label', 'Previous environment');
    next.setAttribute('aria-label', 'Next environment');
    prev.textContent = 'Previous';
    next.textContent = 'Next';
    var count = document.createElement('span');
    count.className = 'env-count';
    count.setAttribute('aria-live', 'polite');
    nav.appendChild(prev); nav.appendChild(count); nav.appendChild(next);

    viewer.insertBefore(bar, cards[0]);
    viewer.appendChild(nav);

    var current = -1;
    function select(i, user) {
      if (i === current) return;
      current = i;
      cards.forEach(function (c, j) {
        var on = j === i;
        c.hidden = !on;
        if (on && user && !reduce) { c.classList.remove('is-entering'); void c.offsetWidth; c.classList.add('is-entering'); }
        tabs[j].setAttribute('aria-selected', on ? 'true' : 'false');
        tabs[j].tabIndex = on ? 0 : -1;
      });
      count.textContent = (i + 1) + ' / ' + cards.length;
    }
    prev.addEventListener('click', function () { select((current - 1 + cards.length) % cards.length, true); });
    next.addEventListener('click', function () { select((current + 1) % cards.length, true); });

    var start = 0;
    cards.forEach(function (c, j) { if (location.hash === '#' + c.id) start = j; });
    select(start, false);
  });

  /* ------------------------------------------------------------ carousel buttons */
  Array.prototype.forEach.call(document.querySelectorAll('[data-carousel]'), function (car) {
    var track = car.querySelector('.car-track');
    if (!track) return;
    var nav = document.createElement('div');
    nav.className = 'car-nav';
    [['\u2190', 'Previous surroundings', -1], ['\u2192', 'Next surroundings', 1]].forEach(function (b) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'car-btn';
      btn.textContent = b[0];
      btn.setAttribute('aria-label', b[1]);
      btn.addEventListener('click', function () {
        var item = track.querySelector('.car-item');
        var step = item ? item.getBoundingClientRect().width + 18 : track.clientWidth * 0.8;
        track.scrollBy({ left: b[2] * step, behavior: reduce ? 'auto' : 'smooth' });
      });
      nav.appendChild(btn);
    });
    car.appendChild(nav);
  });

  /* ------------------------------------------------------------ lightbox */
  var box = document.getElementById('lightbox');
  if (box) {
    var big = box.querySelector('.lightbox-img');
    var cap = box.querySelector('.lightbox-cap');
    var closeBtn = box.querySelector('.lightbox-close');
    var opener = null;

    function close() {
      box.hidden = true;
      document.documentElement.classList.remove('has-lightbox');
      big.removeAttribute('src');
      if (opener) opener.focus();
    }
    function open(a) {
      var img = a.querySelector('img');
      opener = a;
      big.src = (img && img.currentSrc) || a.getAttribute('href');
      big.alt = img ? img.alt : '';
      var fig = a.closest('figure');
      var tk = fig && fig.querySelector('.takeaway, .scene-name');
      cap.textContent = tk ? tk.textContent : '';
      box.hidden = false;
      document.documentElement.classList.add('has-lightbox');
      closeBtn.focus();
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a.frame');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      open(a);
    });
    box.addEventListener('click', function (e) { if (e.target === box || e.target === closeBtn) close(); });
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); }   // one control: keep focus in the dialog
    });
  }

  /* ------------------------------------------------------------ reveal */
  if (!reduce && hasIO) {
    var items = document.querySelectorAll('main .section > figure, main .section > .fig-pair, main .scene-cards, main .stats li, main .env-viewer, main .mosaic > .tile, main .carousel');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    Array.prototype.forEach.call(items, function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) return;    // already on screen: no fade
      el.classList.add('reveal');
      io.observe(el);
    });
  }
})();
