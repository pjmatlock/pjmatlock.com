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
      function closeMenu() {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
      toggle.addEventListener("click", function () {
        var open = links.classList.toggle("open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      links.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", closeMenu);
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && links.classList.contains("open")) {
          closeMenu();
          toggle.focus();
        }
      });
      document.addEventListener("click", function (e) {
        if (links.classList.contains("open") && !links.contains(e.target) && !toggle.contains(e.target)) closeMenu();
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
    function setFaqOpen(item, open) {
      item.classList.toggle("open", open);
      var btn = item.querySelector(".faq-q");
      if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
    }
    document.querySelectorAll(".faq-q").forEach(function (btn, i) {
      var item = btn.closest(".faq-item");
      var panel = item ? item.querySelector(".faq-a") : null;
      btn.setAttribute("aria-expanded", "false");
      if (!btn.id) btn.id = "faq-q-" + i;
      if (panel) {
        if (!panel.id) panel.id = "faq-panel-" + i;
        panel.setAttribute("role", "region");
        panel.setAttribute("aria-labelledby", btn.id);
        btn.setAttribute("aria-controls", panel.id);
      }
      btn.addEventListener("click", function () {
        setFaqOpen(item, !item.classList.contains("open"));
      });
    });

    /* Deep links: #faq-... in the URL opens that item */
    function openFaqFromHash() {
      if (!location.hash) return;
      var target;
      try { target = document.querySelector(location.hash); } catch (e) { return; }
      if (target && target.classList && target.classList.contains("faq-item")) setFaqOpen(target, true);
    }
    openFaqFromHash();
    window.addEventListener("hashchange", openFaqFromHash);

    /* Expand all / collapse all */
    document.querySelectorAll(".faq-toggle-all").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var faq = btn.closest(".faq");
        if (!faq) return;
        var items = faq.querySelectorAll(".faq-item");
        var anyClosed = Array.prototype.some.call(items, function (it) { return !it.classList.contains("open"); });
        items.forEach(function (it) { setFaqOpen(it, anyClosed); });
        btn.textContent = anyClosed ? "Collapse all" : "Expand all";
      });
    });

    /* --- source-card favicon fallback (keeps the grid uniform if a remote favicon 404s) --- */
    document.querySelectorAll(".source .fav img").forEach(function (img) {
      img.addEventListener("error", function () {
        var fav = img.parentElement;
        if (fav) fav.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8b97ad" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
      });
    });

    /* --- long-read affordances (case-status only): progress bar + back-to-top --- */
    if (document.querySelector(".wrap.read .timeline")) {
      var bar = document.createElement("div");
      bar.className = "read-progress";
      bar.setAttribute("aria-hidden", "true");
      document.body.appendChild(bar);

      var top = document.createElement("button");
      top.type = "button";
      top.className = "to-top";
      top.setAttribute("aria-label", "Back to top");
      top.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>';
      top.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      });
      document.body.appendChild(top);

      var rpTicking = false;
      function rpUpdate() {
        rpTicking = false;
        var doc = document.documentElement;
        var max = doc.scrollHeight - window.innerHeight;
        var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        bar.style.width = (p * 100) + "%";
        top.classList.toggle("show", window.scrollY > 1200);
      }
      window.addEventListener("scroll", function () {
        if (!rpTicking) { rpTicking = true; requestAnimationFrame(rpUpdate); }
      }, { passive: true });
      rpUpdate();
    }

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
