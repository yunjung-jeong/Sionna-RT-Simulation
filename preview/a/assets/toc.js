/* Marks the section in view in the sticky contents bar (aria-current), and keeps that link
   visible when the bar scrolls sideways on phones. The page works fully without this file. */
(function () {
  'use strict';

  var links = Array.prototype.slice.call(document.querySelectorAll('.toc a[href^="#"]'));
  var list = document.querySelector('.toc ul');
  if (!links.length || !list) return;

  var items = [];
  links.forEach(function (a) {
    var el = document.getElementById(a.getAttribute('href').slice(1));
    if (el) items.push({ link: a, el: el });
  });

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var current = null;
  var ticking = false;

  function reveal(link) {
    if (list.scrollWidth <= list.clientWidth + 1) return;
    var li = link.parentNode;
    var left = li.offsetLeft - list.offsetLeft - 16;
    var right = left + li.offsetWidth + 48;
    if (left < list.scrollLeft || right > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: Math.max(0, left), behavior: reduce ? 'auto' : 'smooth' });
    }
  }

  function setCurrent(item) {
    if (item === current) return;
    if (current) current.link.removeAttribute('aria-current');
    current = item;
    if (item) {
      item.link.setAttribute('aria-current', 'location');
      reveal(item.link);
    }
  }

  function update() {
    ticking = false;
    var line = window.innerHeight * 0.3;
    var found = null;
    for (var i = 0; i < items.length; i++) {
      if (items[i].el.getBoundingClientRect().top <= line) found = items[i];
      else break;
    }
    var doc = document.documentElement;
    if (found && window.scrollY + window.innerHeight >= doc.scrollHeight - 4) {
      found = items[items.length - 1];
    }
    setCurrent(found);
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
