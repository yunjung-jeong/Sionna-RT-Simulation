/* Optional: marks the contents entry of the section being read (aria-current="location").
   The page works fully without it. */
(function () {
  "use strict";
  var links = Array.prototype.slice.call(document.querySelectorAll('.toc a[href^="#"]'));
  if (!links.length) return;
  var entries = links
    .map(function (a) {
      return { link: a, section: document.getElementById(a.getAttribute("href").slice(1)) };
    })
    .filter(function (e) { return e.section; });

  var current = null;
  var ticking = false;

  function update() {
    ticking = false;
    var line = window.innerHeight * 0.3;
    var active = null;
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].section.getBoundingClientRect().top <= line) active = entries[i];
    }
    // at the very bottom of the page, the last section is the one being read
    if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 2) {
      active = entries[entries.length - 1];
    }
    if (active === current) return;
    if (current) current.link.removeAttribute("aria-current");
    if (active) active.link.setAttribute("aria-current", "location");
    current = active;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
