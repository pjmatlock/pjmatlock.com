/* PJ Matlock site interactions. Vanilla, no deps, progressive-enhancement.
   Everything degrades gracefully if JS is off and respects reduced-motion. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    /* --- current year --- */
    var year = String(new Date().getFullYear());
    document.querySelectorAll(".yr").forEach(function (el) { el.textContent = year; });

    /* --- mobile nav toggle --- */
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");
    if (toggle && links) {
      toggle.addEventListener("click", function () {
        var open = links.classList.toggle("open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      links.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { links.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); });
      });
    }

    /* --- reveal on scroll --- */
    var revealEls = document.querySelectorAll(".reveal");
    if (reduce || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            var el = e.target;
            var delay = parseFloat(el.getAttribute("data-delay") || "0");
            if (delay) el.style.transitionDelay = delay + "s";
            el.classList.add("in");
            io.unobserve(el);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
      revealEls.forEach(function (el) { io.observe(el); });
    }

    /* --- count-up stats --- */
    function animateCount(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      var dur = 1500;
      if (reduce) { el.textContent = formatNum(target) + suffix; return; }
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 4); /* easeOutQuart */
        el.textContent = formatNum(Math.round(target * eased)) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = formatNum(target) + suffix;
      }
      requestAnimationFrame(step);
    }
    function formatNum(n) { return n >= 1000 ? (n / 1000).toLocaleString() + "K" : String(n); }

    var counters = document.querySelectorAll("[data-count]");
    if (counters.length) {
      if (reduce || !("IntersectionObserver" in window)) {
        counters.forEach(animateCount);
      } else {
        var cio = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); } });
        }, { threshold: 0.6 });
        counters.forEach(function (el) { cio.observe(el); });
      }
    }

    /* --- scroll-drawn timeline --- */
    var track = document.querySelector(".tl-track");
    var fill = document.querySelector(".tl-fill");
    var items = Array.prototype.slice.call(document.querySelectorAll(".tl-item"));
    if (track && fill && items.length) {
      if (reduce) {
        fill.style.transform = "scaleY(1)";
        items.forEach(function (it) { it.classList.add("lit"); });
      } else {
        var ticking = false;
        function update() {
          ticking = false;
          var rect = track.getBoundingClientRect();
          var vh = window.innerHeight;
          var anchor = vh * 0.5;
          var prog = rect.height > 0 ? (anchor - rect.top) / rect.height : 0;
          prog = Math.max(0, Math.min(1, prog));
          fill.style.transform = "scaleY(" + prog + ")";
          var fillY = rect.top + rect.height * prog;
          items.forEach(function (it) {
            var dot = it.querySelector(".tl-dot");
            var dy = dot ? dot.getBoundingClientRect().top : it.getBoundingClientRect().top;
            if (dy <= fillY + 4) it.classList.add("lit");
          });
        }
        function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
        update();
      }
    }

    /* --- FAQ accordion --- */
    document.querySelectorAll(".faq-q").forEach(function (btn, i) {
      var item = btn.closest(".faq-item");
      var panel = item ? item.querySelector(".faq-a") : null;
      btn.setAttribute("aria-expanded", "false");
      if (panel) {
        if (!panel.id) panel.id = "faq-panel-" + i;
        panel.setAttribute("role", "region");
        btn.setAttribute("aria-controls", panel.id);
      }
      btn.addEventListener("click", function () {
        var open = item.classList.toggle("open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });

    /* --- source-card favicon fallback (keeps the grid uniform if a remote favicon 404s) --- */
    document.querySelectorAll(".source .fav img").forEach(function (img) {
      img.addEventListener("error", function () {
        var fav = img.parentElement;
        if (fav) fav.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8b97ad" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
      });
    });

    /* --- cursor spotlight on glass cards --- */
    if (!reduce && window.matchMedia("(hover: hover)").matches) {
      document.querySelectorAll(".card.spot").forEach(function (card) {
        card.addEventListener("pointermove", function (e) {
          var r = card.getBoundingClientRect();
          card.style.setProperty("--mx", (e.clientX - r.left) + "px");
          card.style.setProperty("--my", (e.clientY - r.top) + "px");
        });
      });
    }
  });
})();
