/* Close with Zahava · funnel pages (vsl/, thank-you/, offer/, specimen docs)
   Lenis smooth scroll, scroll reveals, and the Typeform-style application popup. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var inFrame = window.self !== window.top;
  if (/[?&]static=1/.test(location.search)) document.documentElement.classList.add("static");

  if (!reduce && !inFrame && window.Lenis) {
    var lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
  }

  // scroll reveals (content is visible without JS: .reveal only hides once this runs)
  var els = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window) || /[?&]static=1/.test(location.search)) {
    els.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  // ------------------- opt-in gate: the video unlocks after name + email -------------------
  var gate = document.getElementById("optin");
  if (gate) {
    var frame = document.querySelector(".video__frame");
    var closeGate = function () { gate.classList.remove("open"); gate.setAttribute("aria-hidden", "true"); document.documentElement.style.overflow = ""; };
    document.querySelectorAll("[data-optin]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (frame && frame.classList.contains("is-playing")) return;
        gate.classList.add("open"); gate.setAttribute("aria-hidden", "false"); document.documentElement.style.overflow = "hidden";
        setTimeout(function () { var i = gate.querySelector("input"); if (i) i.focus(); }, 80);
      });
    });
    gate.querySelector("[data-close]").addEventListener("click", closeGate);
    gate.addEventListener("click", function (e) { if (e.target === gate) closeGate(); });
    document.getElementById("optin-form").addEventListener("submit", function (e) {
      e.preventDefault(); closeGate();
      if (frame) frame.classList.add("is-playing"); // sample page: the "video" starts, the Apply button below is the next step
    });
  }

  // ---------------------------- application popup ---------------------------
  var modal = document.getElementById("apply");
  if (!modal) return;
  var qs = [].slice.call(modal.querySelectorAll(".q"));
  var bar = document.getElementById("apply-bar");
  var idx = 0;

  function show(i) {
    idx = Math.max(0, Math.min(i, qs.length - 1));
    qs.forEach(function (q, k) { q.classList.toggle("on", k === idx); });
    bar.style.width = Math.round((idx / (qs.length - 1)) * 100) + "%";
    var inp = qs[idx].querySelector(".q__input");
    if (inp) setTimeout(function () { inp.focus(); }, 60);
  }
  function open() { modal.classList.add("open"); modal.setAttribute("aria-hidden", "false"); show(0); document.documentElement.style.overflow = "hidden"; }
  function close() { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); document.documentElement.style.overflow = ""; }
  function next() { if (idx < qs.length - 1) show(idx + 1); }

  document.querySelectorAll("[data-apply]").forEach(function (b) { b.addEventListener("click", open); });
  modal.querySelector("[data-close]").addEventListener("click", close);
  modal.addEventListener("click", function (e) { if (e.target === modal) close(); });

  qs.forEach(function (q) {
    var ok = q.querySelector(".q__ok");
    if (ok) ok.addEventListener("click", next);
    var opts = q.querySelectorAll(".q__opt");
    opts.forEach(function (o) {
      o.addEventListener("click", function () {
        opts.forEach(function (x) { x.classList.remove("sel"); });
        o.classList.add("sel");
        setTimeout(next, 320);
      });
    });
    q.querySelectorAll(".book__day").forEach(function (d, _, all) {
      d.addEventListener("click", function () { all.forEach(function (x) { x.classList.remove("sel"); }); d.classList.add("sel"); });
    });
  });

  document.addEventListener("keydown", function (e) {
    if (!modal.classList.contains("open")) { if (e.key === "Escape" && gate) gate.classList.remove("open"); return; }
    if (e.key === "Escape") close();
    if (e.key === "Enter" && qs[idx].querySelector(".q__input")) { e.preventDefault(); next(); }
    var letter = e.key && e.key.length === 1 ? e.key.toUpperCase().charCodeAt(0) - 65 : -1;
    var opts = qs[idx].querySelectorAll(".q__opt");
    if (letter >= 0 && letter < opts.length && document.activeElement.tagName !== "INPUT") opts[letter].click();
  });
})();
