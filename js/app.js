(function () {
  "use strict";

  gsap.registerPlugin(ScrollTrigger);

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------
     Lenis smooth scroll
  ------------------------------------------------------------------ */
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* ------------------------------------------------------------------
     Loader — waits for hero image + fonts
  ------------------------------------------------------------------ */
  const loader = document.getElementById("loader");
  const loaderBar = document.getElementById("loader-bar");
  const loaderPercent = document.getElementById("loader-percent");
  const heroImg = document.getElementById("hero-img");

  let progress = 0;
  const targetProgress = { value: 0 };

  function setProgress(p) {
    targetProgress.value = Math.max(targetProgress.value, p);
    gsap.to({ v: progress }, {
      v: targetProgress.value,
      duration: 0.4,
      onUpdate: function () {
        progress = this.targets()[0].v;
        loaderBar.style.width = progress + "%";
        loaderPercent.textContent = Math.round(progress);
      },
    });
  }

  setProgress(15);
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  fontsReady.then(() => setProgress(55));

  const heroReady = new Promise((resolve) => {
    if (heroImg.readyState >= 2) return resolve();
    heroImg.addEventListener("loadeddata", resolve, { once: true });
    heroImg.addEventListener("error", resolve, { once: true });
  });

  Promise.all([fontsReady, heroReady]).then(() => {
    setProgress(100);
    setTimeout(finishLoad, 500);
  });
  // Fallback in case something never fires
  setTimeout(finishLoad, 4000);

  let loadFinished = false;
  function finishLoad() {
    if (loadFinished) return;
    loadFinished = true;
    setProgress(100);
    gsap.to(loader, {
      opacity: 0,
      duration: 0.9,
      delay: 0.15,
      ease: "power2.inOut",
      onComplete: () => {
        loader.style.display = "none";
        document.body.classList.add("loaded");
        playHeroIntro();
        ScrollTrigger.refresh();
      },
    });
  }

  /* ------------------------------------------------------------------
     Header behaviour
  ------------------------------------------------------------------ */
  const header = document.getElementById("site-header");
  ScrollTrigger.create({
    start: 60,
    end: 99999,
    onUpdate: (self) => {
      header.classList.toggle("scrolled", self.scroll() > 60);
    },
  });

  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    navLinks.style.display = expanded ? "" : "flex";
    if (!expanded) {
      navLinks.style.cssText = "display:flex;position:fixed;inset:0;flex-direction:column;align-items:center;justify-content:center;background:#0b0b0a;gap:2.4rem;z-index:400;";
      navLinks.querySelectorAll("a").forEach((a) => (a.style.fontSize = "1.4rem"));
    } else {
      navLinks.removeAttribute("style");
    }
  });
  navLinks.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      navLinks.removeAttribute("style");
    })
  );

  /* ------------------------------------------------------------------
     Hero: split words + intro choreography + parallax on scroll
  ------------------------------------------------------------------ */
  function playHeroIntro() {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".hero-heading .word", { yPercent: 115, duration: 1.1, stagger: 0.045 })
      .from(".hero-content .section-label", { opacity: 0, y: 12, duration: 0.6 }, 0)
      .from(".hero-tagline", { opacity: 0, y: 24, duration: 0.9 }, "-=0.6")
      .from(".hero-actions .btn", { opacity: 0, y: 20, duration: 0.7, stagger: 0.12 }, "-=0.5")
      .from(".scroll-indicator", { opacity: 0, duration: 0.8 }, "-=0.4");
  }

  gsap.to("#hero-img", {
    yPercent: 12,
    scale: 1.0,
    ease: "none",
    scrollTrigger: { trigger: ".hero-standalone", start: "top top", end: "bottom top", scrub: true },
  });

  // Subtle mouse parallax on hero
  const heroSection = document.getElementById("hero");
  heroSection.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 18;
    const y = (e.clientY / window.innerHeight - 0.5) * 18;
    gsap.to("#hero-img", { x, y, duration: 1.2, ease: "power2.out", overwrite: "auto" });
  });

  /* ------------------------------------------------------------------
     Generic scroll-reveal system (data-reveal attribute)
  ------------------------------------------------------------------ */
  const REVEALS = {
    "fade-up": (el) => gsap.from(el, { y: 60, opacity: 0, duration: 1, ease: "power3.out" }),
    "slide-left": (el) => gsap.from(el, { x: -90, opacity: 0, duration: 1, ease: "power3.out" }),
    "slide-right": (el) => gsap.from(el, { x: 90, opacity: 0, duration: 1, ease: "power3.out" }),
    "scale-up": (el) => gsap.from(el, { scale: 0.88, opacity: 0, duration: 1.05, ease: "power2.out" }),
    "rotate-in": (el) => gsap.from(el, { y: 40, rotation: 3, opacity: 0, duration: 1, ease: "power3.out" }),
    "clip-reveal": (el) =>
      gsap.from(el, { clipPath: "inset(12% 0% 12% 0% round 2px)", scale: 1.08, opacity: 0, duration: 1.3, ease: "power4.inOut" }),
    "stagger-up": (el) =>
      gsap.from(el.querySelectorAll(".stat-number, .stat-suffix, .stat-label"), {
        y: 40, opacity: 0, duration: 0.9, stagger: 0.12, ease: "power3.out",
      }),
  };

  document.querySelectorAll("[data-reveal]").forEach((el) => {
    const type = el.dataset.reveal;
    const build = REVEALS[type] || REVEALS["fade-up"];
    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      onEnter: () => build(el),
      once: true,
    });
  });

  // Section headings: word-mask reveal
  document.querySelectorAll(".section-heading").forEach((heading) => {
    const original = heading.innerHTML;
    const lines = original.split("<br>");
    heading.innerHTML = lines
      .map((line) => `<span class="mask-line"><span class="mask-inner">${line}</span></span>`)
      .join("");
    heading.querySelectorAll(".mask-line").forEach((l) => (l.style.display = "block"));
    heading.querySelectorAll(".mask-line").forEach((l) => (l.style.overflow = "hidden"));
    gsap.set(heading.querySelectorAll(".mask-inner"), { display: "block", yPercent: 100 });
    ScrollTrigger.create({
      trigger: heading,
      start: "top 88%",
      once: true,
      onEnter: () =>
        gsap.to(heading.querySelectorAll(".mask-inner"), {
          yPercent: 0, duration: 1.1, stagger: 0.09, ease: "power4.out",
        }),
    });
  });

  /* ------------------------------------------------------------------
     Gradual word-by-word text reveal — tied to scroll position,
     not a one-shot fade. Words light up progressively as the
     paragraph scrolls through view.
  ------------------------------------------------------------------ */
  function splitIntoWords(el) {
    if (el.children.length > 0) return null; // skip paragraphs with nested markup
    const parts = el.textContent.split(/(\s+)/);
    el.innerHTML = parts
      .map((part) => (part.trim() === "" ? part : `<span class="word-reveal">${part}</span>`))
      .join("");
    return Array.from(el.querySelectorAll(".word-reveal"));
  }

  document
    .querySelectorAll(".section-body, .diff-body p, .service-video p, .process-step p")
    .forEach((p) => {
      const words = splitIntoWords(p);
      if (!words || !words.length) return;
      gsap.set(words, { opacity: 0.16 });
      ScrollTrigger.create({
        trigger: p,
        start: "top 95%",
        end: "top 50%",
        scrub: 0.4,
        onUpdate: (self) => {
          const n = words.length;
          words.forEach((w, i) => {
            const revealAt = i / n;
            w.style.opacity = revealAt <= self.progress ? 1 : 0.16;
          });
        },
      });
    });

  /* ------------------------------------------------------------------
     Lazy-loaded section videos — load + play only near viewport,
     pause when scrolled away to save bandwidth/battery.
  ------------------------------------------------------------------ */
  const lazyVideos = document.querySelectorAll("video.lazy-video");
  if ("IntersectionObserver" in window) {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            if (!video.src) {
              const source = video.dataset.src;
              video.src = source;
              video.load();
            }
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { rootMargin: "500px 0px" }
    );
    lazyVideos.forEach((v) => videoObserver.observe(v));
  } else {
    lazyVideos.forEach((v) => {
      v.src = v.dataset.src;
      v.load();
      v.play().catch(() => {});
    });
  }

  /* ------------------------------------------------------------------
     Marquee strips
  ------------------------------------------------------------------ */
  document.querySelectorAll(".marquee-track").forEach((track) => {
    const container = track.parentElement;
    // The markup ships with one repeated "set" already duplicated once.
    // Rebuild from a single set, then clone it enough times so that ONE
    // set alone always covers the container width — otherwise, on wide
    // screens, a blank gap shows before the loop wraps around.
    const children = Array.from(track.children);
    const baseHTML = children.slice(0, children.length / 2).map((c) => c.outerHTML).join("");
    track.innerHTML = baseHTML;
    while (track.scrollWidth < container.clientWidth) {
      track.insertAdjacentHTML("beforeend", baseHTML);
    }
    // Duplicate the now-sufficiently-wide set once more for the seamless loop.
    track.insertAdjacentHTML("beforeend", track.innerHTML);

    const dir = parseFloat(track.dataset.speed) || 1;
    const totalWidth = track.scrollWidth / 2;
    const duration = totalWidth / 42; // ~42px/s, consistent pace regardless of content width
    gsap.fromTo(
      track,
      { x: dir < 0 ? 0 : -totalWidth },
      { x: dir < 0 ? -totalWidth : 0, duration, ease: "none", repeat: -1 }
    );
  });

  /* ------------------------------------------------------------------
     Diferenciais list — connecting accent line grows
  ------------------------------------------------------------------ */
  gsap.utils.toArray(".diff-item").forEach((item) => {
    ScrollTrigger.create({
      trigger: item,
      start: "top 80%",
      once: true,
      onEnter: () => item.querySelector(".diff-num").style.color = "var(--blue)",
    });
  });

  /* ------------------------------------------------------------------
     Processo — vertical line fill scrubbed with scroll
  ------------------------------------------------------------------ */
  const lineFill = document.getElementById("process-line-fill");
  if (lineFill) {
    gsap.to(lineFill, {
      height: "100%",
      ease: "none",
      scrollTrigger: {
        trigger: ".process-timeline",
        start: "top 70%",
        end: "bottom 60%",
        scrub: true,
      },
    });
  }

  /* ------------------------------------------------------------------
     Depoimentos — carrossel de reviews (arrows, dots, drag-to-scroll)
  ------------------------------------------------------------------ */
  const reviewsViewport = document.getElementById("reviews-viewport");
  if (reviewsViewport) {
    const track = document.getElementById("reviews-track");
    const slides = Array.from(track.children);
    const prevBtn = document.getElementById("reviews-prev");
    const nextBtn = document.getElementById("reviews-next");
    const dotsWrap = document.getElementById("reviews-dots");

    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.setAttribute("aria-label", `Ir para avaliação ${i + 1}`);
      dot.addEventListener("click", () => slides[i].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" }));
      dotsWrap.appendChild(dot);
    });
    const dots = Array.from(dotsWrap.children);

    function closestSlideIndex() {
      const center = reviewsViewport.scrollLeft + reviewsViewport.clientWidth / 2;
      let closest = 0, minDist = Infinity;
      slides.forEach((s, i) => {
        const dist = Math.abs(s.offsetLeft + s.offsetWidth / 2 - center);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      return closest;
    }

    function updateUI() {
      const active = closestSlideIndex();
      dots.forEach((d, i) => d.classList.toggle("active", i === active));
      prevBtn.disabled = reviewsViewport.scrollLeft <= 4;
      nextBtn.disabled = reviewsViewport.scrollLeft >= reviewsViewport.scrollWidth - reviewsViewport.clientWidth - 4;
    }

    prevBtn.addEventListener("click", () => {
      const target = Math.max(0, closestSlideIndex() - 1);
      slides[target].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    });
    nextBtn.addEventListener("click", () => {
      const target = Math.min(slides.length - 1, closestSlideIndex() + 1);
      slides[target].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    });

    reviewsViewport.addEventListener("scroll", () => updateUI(), { passive: true });

    // Mouse drag-to-scroll (desktop)
    let isDown = false, startX = 0, startScroll = 0;
    reviewsViewport.addEventListener("pointerdown", (e) => {
      isDown = true;
      reviewsViewport.classList.add("dragging");
      startX = e.clientX;
      startScroll = reviewsViewport.scrollLeft;
    });
    window.addEventListener("pointermove", (e) => {
      if (!isDown) return;
      reviewsViewport.scrollLeft = startScroll - (e.clientX - startX);
    });
    window.addEventListener("pointerup", () => {
      isDown = false;
      reviewsViewport.classList.remove("dragging");
    });

    updateUI();
  }

  /* ------------------------------------------------------------------
     Estatísticas — counters
  ------------------------------------------------------------------ */
  document.querySelectorAll(".stat-number").forEach((el) => {
    const target = parseFloat(el.dataset.value);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    ScrollTrigger.create({
      trigger: el.closest(".stat-block"),
      start: "top 80%",
      once: true,
      onEnter: () =>
        gsap.fromTo(
          el,
          { textContent: 0 },
          {
            textContent: target,
            duration: 2,
            ease: "power2.out",
            snap: { textContent: decimals === 0 ? 1 : 0.01 },
            onUpdate: function () {
              el.textContent = Math.round(gsap.getProperty(el, "textContent"));
            },
          }
        ),
    });
  });

  /* ------------------------------------------------------------------
     Before / After compare slider
  ------------------------------------------------------------------ */
  const compareFrame = document.querySelector(".compare-frame");
  if (compareFrame) {
    const afterWrap = compareFrame.querySelector(".compare-after-wrap");
    const afterImg = compareFrame.querySelector(".compare-after");
    const handle = compareFrame.querySelector(".compare-handle");
    let dragging = false;

    function setSplit(pct) {
      pct = Math.min(96, Math.max(4, pct));
      const afterWidth = 100 - pct;
      afterWrap.style.width = afterWidth + "%";
      afterImg.style.width = (10000 / afterWidth) + "%";
      handle.style.left = pct + "%";
    }
    setSplit(50);

    function pointerX(e) {
      const rect = compareFrame.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      return ((clientX - rect.left) / rect.width) * 100;
    }

    compareFrame.addEventListener("pointerdown", (e) => { dragging = true; setSplit(pointerX(e)); });
    window.addEventListener("pointerup", () => (dragging = false));
    window.addEventListener("pointermove", (e) => { if (dragging) setSplit(pointerX(e)); });

    // gentle auto sweep reveal on scroll into view
    ScrollTrigger.create({
      trigger: compareFrame,
      start: "top 75%",
      once: true,
      onEnter: () => gsap.fromTo({ p: 15 }, { p: 15 }, { p: 65, duration: 1.6, ease: "power2.inOut", onUpdate: function () { setSplit(this.targets()[0].p); } }).then(() => setSplit(50)),
    });
  }

  /* ------------------------------------------------------------------
     CTA final — image parallax
  ------------------------------------------------------------------ */
  gsap.to("#cta-img", {
    yPercent: 8,
    ease: "none",
    scrollTrigger: { trigger: ".section-cta-final", start: "top bottom", end: "bottom top", scrub: true },
  });

  gsap.utils.toArray(".footer-col, .footer-top").forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: "top 92%",
      once: true,
      onEnter: () => gsap.from(el, { opacity: 0, y: 24, duration: 0.9, ease: "power3.out" }),
    });
  });
})();
