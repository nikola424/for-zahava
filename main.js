/* =========================================================================
   Emmaline Fawcett · pitch-site motion layer
   Lenis smooth scroll · headline reveal · scroll choreography · card
   spotlight · morph-lightbox · sticky CTA · video parallax
   ========================================================================= */
(function () {
  "use strict";

  var CFG = window.PITCH_CONFIG || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches || /[?&]static\b/.test(location.search);
  var isTouch = window.matchMedia("(hover: none)").matches;
  if (reduceMotion) document.documentElement.classList.add("reduced");

  /* ----------------------------- Smooth scroll ---------------------------- */
  var lenis = null;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  if (!reduceMotion && typeof window.Lenis === "function") {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.95 });
    if (hasGsap) {
      gsap.registerPlugin(ScrollTrigger);
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* ---------------------- Headline word-by-word reveal -------------------- */
  var title = document.querySelector(".hero__title:not([hidden])");
  if (title && !reduceMotion) {
    var nodes = Array.prototype.slice.call(title.childNodes);
    title.innerHTML = "";
    var frag = document.createDocumentFragment();
    nodes.forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (part === "") return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else {
            var w = document.createElement("span");
            w.className = "word";
            w.textContent = part;
            frag.appendChild(w);
          }
        });
      } else if (node.nodeType === 1) {
        var wrap = document.createElement("span");
        wrap.className = "word";
        wrap.appendChild(node);
        frag.appendChild(wrap);
      }
    });
    title.appendChild(frag);
    var words = title.querySelectorAll(".word");
    words.forEach(function (w, i) { w.style.transitionDelay = (i * 0.03).toFixed(3) + "s"; });
    title.classList.add("split");
  }

  /* -------------------- Center-out stagger inside grids ------------------- */
  if (!reduceMotion) {
    document.querySelectorAll(".grid").forEach(function (grid) {
      var cards = grid.querySelectorAll(".reveal");
      var center = (cards.length - 1) / 2;
      cards.forEach(function (c, i) {
        c.style.transitionDelay = (Math.abs(i - center) * 0.09).toFixed(3) + "s";
      });
    });
  }

  /* ------------------------ Anchor links → smooth scroll ------------------ */
  var OFFSET = 18;
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id === "#" || id === "#top") {
        e.preventDefault();
        if (lenis) lenis.scrollTo(0); else window.scrollTo({ top: 0 });
        return;
      }
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: -OFFSET });
      } else {
        var y = target.getBoundingClientRect().top + window.pageYOffset - OFFSET;
        window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
      }
    });
  });

  /* --------------------------- Reveal on scroll --------------------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* --------------------------- Card cursor spotlight ---------------------- */
  if (!reduceMotion && !isTouch) {
    document.querySelectorAll(".pcard").forEach(function (card) {
      var queued = false;
      card.addEventListener("mousemove", function (e) {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () {
          var r = card.getBoundingClientRect();
          card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
          card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
          queued = false;
        });
      });
    });
  }

  /* ---------------------- Lightbox (FLIP morph transition) ---------------- */
  var lightbox = document.getElementById("lightbox");
  var stage = document.getElementById("lightbox-stage");
  var titleEl = document.getElementById("lightbox-title");
  var closeBtn = document.getElementById("lightbox-close");
  var lastFocus = null;
  var currentCard = null;

  function buildStage(card) {
    var t = card.getAttribute("data-title") || "";
    var full = card.getAttribute("data-full");
    var embed = card.getAttribute("data-embed");
    stage.classList.toggle("lightbox__stage--embed", !!embed);
    if (embed) {
      titleEl.innerHTML = t + ' <a class="lightbox__open" href="' + embed +
        '" target="_blank" rel="noopener">Open full page ↗</a>';
      stage.innerHTML = '<iframe class="lightbox__frame" src="' + embed +
        '" title="' + t + '" loading="eager"></iframe>';
      stage.scrollTop = 0;
      var fr = stage.querySelector("iframe");
      if (fr) fr.addEventListener("load", function () {
        try {
          fr.contentWindow.scrollTo(0, 0);
          // Always-visible scrollbar inside the preview, and give it focus so scrolling works straight away.
          var st = fr.contentDocument.createElement("style");
          st.textContent = "html{overflow-y:scroll}::-webkit-scrollbar{width:10px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(150,130,110,.45);border-radius:8px;border:2px solid transparent;background-clip:padding-box}";
          fr.contentDocument.head.appendChild(st);
          fr.contentWindow.focus();
        } catch (e) {}
      });
    } else if (full) {
      titleEl.textContent = t;
      stage.innerHTML = '<img src="' + full + '" alt="' + t + '" />';
    } else {
      titleEl.textContent = t;
      var svg = card.querySelector(".thumb .mock");
      var clone = svg ? svg.outerHTML : "";
      stage.innerHTML =
        '<div class="lightbox__placeholder">' + clone +
        "<p>Sample preview &mdash; drop the real deliverable at " +
        "<code>assets/img/</code> and set <code>data-full</code> on this card.</p></div>";
    }
  }

  function thumbTransform(card) {
    var thumb = card.querySelector(".thumb");
    if (!thumb) return null;
    var t = thumb.getBoundingClientRect();
    var s = stage.getBoundingClientRect();
    if (!s.width || !s.height) return null;
    return "translate(" + (t.left - s.left) + "px," + (t.top - s.top) + "px) scale(" +
      (t.width / s.width) + "," + (t.height / s.height) + ")";
  }

  function openLightbox(card) {
    currentCard = card;
    buildStage(card);
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
    lastFocus = document.activeElement;

    if (!reduceMotion && !card.hasAttribute("data-noanim") && !card.hasAttribute("data-embed")) {
      var from = thumbTransform(card);
      if (from) {
        stage.style.transition = "none";
        stage.style.transform = from;
        void stage.offsetWidth;            // force reflow
        stage.style.transition = "";
        stage.style.transform = "none";
      }
    }
    closeBtn.focus();
  }

  function closeLightbox() {
    if (!reduceMotion && currentCard && !currentCard.hasAttribute("data-noanim")) {
      var to = thumbTransform(currentCard);
      if (to) { stage.style.transition = ""; stage.style.transform = to; }
    }
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lenis) lenis.start();
    var clear = function () { stage.innerHTML = ""; stage.style.transform = ""; stage.style.transition = ""; stage.classList.remove("lightbox__stage--embed"); };
    if (reduceMotion) clear(); else setTimeout(clear, 500);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    currentCard = null;
  }

  document.querySelectorAll(".pcard").forEach(function (card) {
    card.addEventListener("click", function () { openLightbox(card); });
  });
  closeBtn.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && lightbox.classList.contains("open")) closeLightbox();
  });

  /* ----------------------- Scroll-linked motion (GSAP) -------------------- */
  // RULE (keep this): GSAP must never read start/end values from an element that is mid
  // CSS `.reveal` transition. It captures the half-way state (opacity 0, translateY 28px)
  // as inline style and the element sticks invisible. That was the "headline disappears
  // on load" bug. So: hand the element to GSAP first with own() (is-in + no CSS
  // transition), tween with explicit fromTo values, clearProps when done, and never let a
  // scrub tween render before the scroll reaches it (immediateRender: false).
  if (!reduceMotion && hasGsap) {
    var own = function (el) { el.classList.add("is-in"); el.style.transition = "none"; return el; };
    var DONE = "transform,opacity,transition";
    // hero: the player stage drifts slightly slower than the page (the stage, not the .reveal wrapper)
    var hpStage = document.querySelector(".hplayer__stage");
    if (hpStage) gsap.fromTo(hpStage, { yPercent: 0 }, { yPercent: -6, ease: "none", immediateRender: false, scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: 0.6 } });
    // hero title: eases back as it leaves (the word reveal owns the entrance, see styles.css .hero__title.split)
    var heroTitle = document.querySelector(".hero__title:not([hidden])");
    if (heroTitle) gsap.fromTo(heroTitle, { yPercent: 0, opacity: 1 }, { yPercent: -10, opacity: 0.35, ease: "none", immediateRender: false, scrollTrigger: { trigger: "#hero", start: "40% top", end: "bottom top", scrub: 0.6 } });
    // section titles: soft rise
    gsap.utils.toArray(".section__title.reveal, .cta__title.reveal").forEach(function (el) {
      own(el);
      gsap.fromTo(el, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", clearProps: DONE, scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });
    // each card grid: staggered rise, centre-out, with a tiny scale settle
    gsap.utils.toArray(".grid").forEach(function (grid) {
      var cards = gsap.utils.toArray(grid.querySelectorAll(".pcard")).map(own);
      if (!cards.length) return;
      gsap.fromTo(cards, { y: 34, opacity: 0, scale: 0.985 }, { y: 0, opacity: 1, scale: 1, duration: 0.85, ease: "power3.out", stagger: { each: 0.09, from: "center" }, clearProps: DONE, scrollTrigger: { trigger: grid, start: "top 86%", once: true } });
    });
    // group rules draw as they enter
    gsap.utils.toArray(".group__head").forEach(function (h) {
      ScrollTrigger.create({ trigger: h, start: "top 90%", once: true, onEnter: function () { h.classList.add("is-in"); } });
    });
    // book-a-call: calendar card settles in
    var cal = document.getElementById("cal-inline");
    if (cal) {
      own(cal);
      gsap.fromTo(cal, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out", clearProps: DONE, scrollTrigger: { trigger: cal, start: "top 85%", once: true } });
    }
  }

  /* ------------------------- Card tilt (cursor-following) ------------------ */
  if (!reduceMotion && !isTouch) {
    document.querySelectorAll(".pcard").forEach(function (card) {
      var raf2 = null, rx = 0, ry = 0;
      function apply() { card.style.transform = "translateY(-6px) rotateX(" + rx + "deg) rotateY(" + ry + "deg)"; raf2 = null; }
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        rx = (-py * 3.2).toFixed(2); ry = (px * 3.2).toFixed(2);
        if (!raf2) raf2 = requestAnimationFrame(apply);
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });
  }

  /* -------------------------- Magnetic sticky pill ------------------------- */
  if (!reduceMotion && !isTouch) {
    var pill = document.getElementById("sticky-cta");
    if (pill) {
      var zone = 90;
      document.addEventListener("mousemove", function (e) {
        var r = pill.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy);
        if (d < zone) pill.style.setProperty("--mgx", (dx * 0.18).toFixed(1) + "px"), pill.style.setProperty("--mgy", (dy * 0.18).toFixed(1) + "px");
        else pill.style.setProperty("--mgx", "0px"), pill.style.setProperty("--mgy", "0px");
      });
    }
  }

  /* ------------------------------ Sticky CTA ------------------------------ */
  /* Visible from first paint. Hides only while the closing CTA is on screen,
     or while the lightbox / Calendly modal is open (they freeze scroll, so a
     scroll test can't detect them - watch their `open` class instead). Both
     inputs feed one sync(). */
  var sticky = document.getElementById("sticky-cta");
  if (sticky) {
    var atCta = false, modalOpen = false;
    var syncSticky = function () {
      sticky.classList.toggle("is-visible", !atCta && !modalOpen);
    };
    var ctaEl = document.getElementById("cta");
    if (ctaEl && "IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { atCta = e.isIntersecting; });
        syncSticky();
      }, { rootMargin: "0px 0px -20% 0px" }).observe(ctaEl);
    }
    var calEl = document.getElementById("cal-modal");
    var lbEl = document.getElementById("lightbox");
    if ("MutationObserver" in window && (calEl || lbEl)) {
      var mo = new MutationObserver(function () {
        modalOpen = (calEl && calEl.classList.contains("open")) ||
                    (lbEl && lbEl.classList.contains("open"));
        syncSticky();
      });
      if (calEl) mo.observe(calEl, { attributes: true, attributeFilter: ["class"] });
      if (lbEl) mo.observe(lbEl, { attributes: true, attributeFilter: ["class"] });
    }
    syncSticky();
  }

  /* ------------------------------ Calendly popup -------------------------- */
  var CAL_URL = (window.PITCH_CONFIG && window.PITCH_CONFIG.calendly) || "https://calendly.com/your-handle/discovery-call";
  var calModal = document.getElementById("cal-modal");
  var calFrame = document.getElementById("cal-frame");
  var calClose = document.getElementById("cal-close");
  var calBuilt = false, calFocus = null;

  function buildCal() {
    if (calBuilt || !calFrame) return;
    calBuilt = true;
    var host = location.hostname || "localhost";
    var src = CAL_URL + "?embed_domain=" + encodeURIComponent(host) +
      "&embed_type=Inline&hide_gdpr_banner=1" +
      "&background_color=ffffff&text_color=16130f&primary_color=1e4d3d";
    var iframe = document.createElement("iframe");
    iframe.title = "Book a discovery call";
    iframe.loading = "eager";
    iframe.setAttribute("frameborder", "0");
    iframe.addEventListener("load", function () { calModal.classList.add("cal-ready"); });
    iframe.src = src;
    calFrame.appendChild(iframe);
  }

  function openCal() {
    buildCal();
    calModal.classList.add("open");
    calModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
    calFocus = document.activeElement;
    calClose.focus();
  }
  function closeCal() {
    calModal.classList.remove("open");
    calModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lenis) lenis.start();
    if (calFocus && calFocus.focus) calFocus.focus();
  }

  var calInline = document.getElementById("cal-inline");
  if (calInline) {
    var host = location.hostname || "localhost";
    var inlineSrc = (CFG.calendly || CAL_URL) + "?embed_domain=" + encodeURIComponent(host) + "&embed_type=Inline&hide_gdpr_banner=1&background_color=ffffff&text_color=16130f&primary_color=1e4d3d";
    var inl = document.createElement("iframe");
    inl.title = "Book a call"; inl.loading = "lazy"; inl.setAttribute("frameborder", "0"); inl.src = inlineSrc;
    calInline.appendChild(inl);
    document.querySelectorAll("[data-calendly]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        var target = document.getElementById("cta");
        if (lenis) lenis.scrollTo(target, { offset: -OFFSET }); else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      });
    });
  } else if (calModal) {
    document.querySelectorAll("[data-calendly]").forEach(function (el) {
      el.addEventListener("click", function (e) { e.preventDefault(); openCal(); });
      el.addEventListener("pointerenter", buildCal, { once: true }); // warm on intent
    });
    calClose.addEventListener("click", closeCal);
    calModal.addEventListener("click", function (e) { if (e.target === calModal) closeCal(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && calModal.classList.contains("open")) closeCal();
    });
    // Pre-warm the iframe when the browser is idle so the popup opens instantly.
    if ("requestIdleCallback" in window) requestIdleCallback(buildCal, { timeout: 2500 });
    else setTimeout(buildCal, 1500);
  }

  /* --------------------- Sender options: branding + case studies ---------- */
  (function () {
    var b = CFG.brand || {};
    var bar = document.getElementById("agency-bar");
    if (bar) {
      if (b.logo || b.name) {
        bar.innerHTML = (b.logo ? '<img src="' + b.logo + '" alt="' + (b.name || "") + '" />' : '') + (b.name && !b.logo ? '<span>' + b.name + '</span>' : '');
        if (b.url) { var a = document.createElement("a"); a.href = b.url; a.target = "_blank"; a.rel = "noopener"; a.innerHTML = bar.innerHTML; bar.innerHTML = ""; bar.appendChild(a); }
      } else bar.remove();
    }
    var foot = document.getElementById("footer-note");
    if (foot && b.footer) foot.textContent = b.footer;
    var cs = CFG.caseStudies || [];
    var sec = document.getElementById("case-studies");
    if (sec) {
      if (!cs.length) { sec.remove(); return; }
      var grid = sec.querySelector(".cs-grid");
      grid.innerHTML = cs.map(function (c) {
        var media = c.youtube ? '<div class="cs-media"><iframe src="https://www.youtube-nocookie.com/embed/' + c.youtube + '?rel=0&modestbranding=1" title="' + (c.title || "") + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>'
                   : (c.image ? '<div class="cs-media"><img src="' + c.image + '" alt="" /></div>' : '');
        return '<article class="cs-card' + (c.wide ? ' cs-card--wide' : '') + ' reveal">' + media + '<div class="cs-body"><p class="cs-result">' + (c.result || "") + '</p><h3 class="cs-title">' + (c.title || "") + '</h3><p class="cs-text">' + (c.text || "") + '</p></div></article>';
      }).join("");
      // cards are injected after the page-wide reveal observer ran, so reveal them here
      var csCards = grid.querySelectorAll(".reveal");
      if (reduceMotion || !("IntersectionObserver" in window)) { csCards.forEach(function (el) { el.classList.add("is-in"); }); }
      else {
        var csIo = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); csIo.unobserve(e.target); } }); }, { threshold: 0.12 });
        csCards.forEach(function (el, i) { el.style.transitionDelay = (i * 0.08) + "s"; csIo.observe(el); });
      }
    }
  })();

  /* ------------------------------ Photo swarm ----------------------------- */
  /* Signature opener: mirrored pairs slide in from every edge, frame the
     (already visible) headline + video, hold, then retrace out. Once, on load. */
  (function () {
    var swarm = document.getElementById("swarm");
    if (!swarm || reduceMotion || window.innerWidth < 760) return;
    var imgs = swarm.querySelectorAll("img");
    var pending = imgs.length;
    function go() { swarm.classList.add("is-on"); setTimeout(function () { swarm.remove(); }, 2900); }
    function done() { if (--pending <= 0) go(); }
    imgs.forEach(function (im) { if (im.complete) done(); else { im.addEventListener("load", done); im.addEventListener("error", done); } });
    setTimeout(function () { if (pending > 0) { pending = 0; go(); } }, 1200);
  })();

  /* ------------------------- Hero embed (Loom / Wistia) ------------------- */
  /* PITCH_CONFIG.heroEmbed = a Loom share URL, a Wistia media id/URL, or any iframe
     src. When set, the stage becomes a responsive iframe and the native player is
     skipped. Leave empty to use assets/video/hero.mp4 with the custom player. */
  var heroEmbedDone = false;
  (function () {
    var src = (CFG.heroEmbed || "").trim();
    var stage = document.getElementById("hp-stage");
    if (!src || !stage) return;
    var url = src;
    var m;
    if ((m = src.match(/loom\.com\/(?:share|embed)\/([a-z0-9]+)/i))) url = "https://www.loom.com/embed/" + m[1] + "?hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true";
    else if ((m = src.match(/wistia\.com\/medias\/([a-z0-9]+)/i)) || (m = src.match(/^([a-z0-9]{10})$/i))) url = "https://fast.wistia.net/embed/iframe/" + m[1] + "?seo=false&videoFoam=true";
    stage.innerHTML = '<iframe class="hplayer__embed" src="' + url + '" title="Pitch video" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="eager"></iframe>';
    stage.setAttribute("data-state", "embed");
    heroEmbedDone = true;
  })();

  /* ----------------------------- Hero video player ------------------------ */
  (function () {
    if (heroEmbedDone) return;
    var stage = document.getElementById("hp-stage");
    var video = document.getElementById("hp-video");
    if (!stage || !video) return;
    var big = document.getElementById("hp-big");
    var playBtn = document.getElementById("hp-play");
    var cur = document.getElementById("hp-cur");
    var dur = document.getElementById("hp-dur");
    var scrub = document.getElementById("hp-scrub");
    var fill = document.getElementById("hp-fill");
    var buf = document.getElementById("hp-buf");
    var knob = document.getElementById("hp-knob");
    var ccBtn = document.getElementById("hp-cc");
    var ccText = document.getElementById("hp-cc-text");
    var muteBtn = document.getElementById("hp-mute");
    var speedBtn = document.getElementById("hp-speed-btn");
    var speedMenu = document.getElementById("hp-speed-menu");
    var fullBtn = document.getElementById("hp-full");

    // default playback speed 1.5x (click-to-play); re-assert on load/play unless user changes it
    var userRate = false;
    video.defaultPlaybackRate = 1.5;
    video.playbackRate = 1.5;
    function applyRate() { if (!userRate) video.playbackRate = 1.5; }
    video.addEventListener("loadedmetadata", applyRate);
    video.addEventListener("play", applyRate);

    function fmt(s) { s = Math.max(0, Math.floor(s || 0)); var m = Math.floor(s / 60), ss = s % 60; return m + ":" + (ss < 10 ? "0" : "") + ss; }
    function setState(s) { stage.setAttribute("data-state", s); }

    // captions rendered ourselves for full styling control
    var ccOn = false, track = null;
    function initTrack() {
      if (track || !video.textTracks || !video.textTracks.length) return;
      track = video.textTracks[0];
      track.mode = "hidden";
      track.addEventListener("cuechange", renderCue);
    }
    function renderCue() {
      if (!ccOn || !track || !track.activeCues || !track.activeCues.length) { ccText.textContent = ""; return; }
      var t = String(track.activeCues[0].text || "").replace(/<[^>]+>/g, "").trim();
      ccText.innerHTML = t ? "<span></span>" : "";
      if (t) ccText.firstChild.textContent = t;
    }
    initTrack();
    video.addEventListener("loadedmetadata", function () { initTrack(); dur.textContent = fmt(video.duration); });
    setTimeout(initTrack, 500);

    function play() { if (video.ended) video.currentTime = 0; var p = video.play(); if (p && p.catch) p.catch(function () {}); }
    function pause() { video.pause(); }
    function toggle() { if (video.paused) play(); else pause(); }
    big.addEventListener("click", play);
    playBtn.addEventListener("click", toggle);
    stage.addEventListener("click", function (e) {
      if (e.target.closest(".hplayer__bar") || e.target.closest(".hplayer__big")) return;
      if (stage.getAttribute("data-state") === "idle") play(); else toggle();
    });
    video.addEventListener("play", function () { setState("playing"); });
    video.addEventListener("pause", function () { if (!video.ended) setState("paused"); });
    video.addEventListener("ended", function () { setState("idle"); });

    video.addEventListener("timeupdate", function () {
      var p = video.duration ? (video.currentTime / video.duration) * 100 : 0;
      fill.style.width = p + "%"; knob.style.left = p + "%";
      cur.textContent = fmt(video.currentTime); scrub.setAttribute("aria-valuenow", Math.round(p));
    });
    video.addEventListener("progress", function () {
      if (video.buffered.length && video.duration) buf.style.width = (video.buffered.end(video.buffered.length - 1) / video.duration) * 100 + "%";
    });
    function seekTo(x) { var r = scrub.getBoundingClientRect(); var ratio = Math.min(1, Math.max(0, (x - r.left) / r.width)); if (video.duration) video.currentTime = ratio * video.duration; }
    var dragging = false;
    scrub.addEventListener("pointerdown", function (e) { dragging = true; scrub.classList.add("dragging"); try { scrub.setPointerCapture(e.pointerId); } catch (x) {} seekTo(e.clientX); });
    scrub.addEventListener("pointermove", function (e) { if (dragging) seekTo(e.clientX); });
    scrub.addEventListener("pointerup", function () { dragging = false; scrub.classList.remove("dragging"); });
    scrub.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") video.currentTime = Math.min(video.duration || 0, video.currentTime + 5);
      else if (e.key === "ArrowLeft") video.currentTime = Math.max(0, video.currentTime - 5);
    });

    function syncMuteIcon() {
      muteBtn.querySelector(".hp-i-muted").style.display = video.muted ? "block" : "none";
      muteBtn.querySelector(".hp-i-sound").style.display = video.muted ? "none" : "block";
      muteBtn.setAttribute("aria-pressed", String(!video.muted));
      muteBtn.setAttribute("aria-label", video.muted ? "Unmute" : "Mute");
    }
    muteBtn.addEventListener("click", function () { video.muted = !video.muted; });
    video.addEventListener("volumechange", syncMuteIcon);
    syncMuteIcon();

    if (ccBtn) ccBtn.addEventListener("click", function () { ccOn = !ccOn; ccBtn.classList.toggle("is-on", ccOn); ccBtn.setAttribute("aria-pressed", String(ccOn)); renderCue(); });

    function closeSpeed() { speedMenu.classList.remove("open"); }
    speedBtn.addEventListener("click", function (e) { e.stopPropagation(); speedMenu.classList.toggle("open"); });
    Array.prototype.forEach.call(speedMenu.querySelectorAll("button"), function (b) {
      b.addEventListener("click", function () {
        var rate = parseFloat(b.getAttribute("data-rate"));
        userRate = true;
        video.playbackRate = rate;
        speedBtn.innerHTML = rate + "&times;";
        Array.prototype.forEach.call(speedMenu.querySelectorAll("button"), function (x) { x.classList.remove("is-on"); });
        b.classList.add("is-on"); closeSpeed();
      });
    });
    document.addEventListener("click", function (e) { if (!e.target.closest(".hp-speed")) closeSpeed(); });

    if (fullBtn) fullBtn.addEventListener("click", function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (stage.requestFullscreen) stage.requestFullscreen();
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
    });

    stage.addEventListener("touchstart", function () { stage.classList.add("hp-touch"); }, { passive: true });
  })();
})();
