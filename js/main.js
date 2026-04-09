// Lenis
window.lenis = new Lenis({
  autoRaf: true,
});

(() => {
  // -------------------- SAFE BOOTSTRAP --------------------
  const gsap = window.gsap;
  if (!gsap) {
    document.documentElement.classList.remove("is-hero-loading");
    console.warn("[GSAP] gsap not found. Script skipped.");
    return;
  }
  // Register plugins
  const maybePlugins = [
    window.ScrollTrigger,
    window.MotionPathPlugin,
    window.Flip,
    window.SplitText,
    window.ScrambleTextPlugin
  ].filter(Boolean);
  try {
    gsap.registerPlugin(...maybePlugins);
  } catch (e) {
    console.warn("[GSAP] registerPlugin failed:", e);
  }
  const has = (name) => !!window[name];
  // Выполняем модули так, чтобы ошибка одного не роняла весь сайт
  const safeRun = (label, fn) => {
    try {
      fn();
    } catch (e) {
      console.warn(`[${label}] init failed:`, e);
    }
  };
  // clip-path helper для Safari
  const setClipPath = (targets, value) => {
    gsap.set(targets, { clipPath: value, webkitClipPath: value });
  };
  const tweenClipPathVars = (vars) => {
    if (vars && vars.clipPath != null && vars.webkitClipPath == null) {
      vars.webkitClipPath = vars.clipPath;
    }
    return vars;
  };
  // Один общий, безопасный refresh
  let _refreshQueued = false;
  const scheduleRefresh = () => {
    if (!has("ScrollTrigger")) return;
    if (_refreshQueued) return;
    _refreshQueued = true;
    requestAnimationFrame(() => {
      _refreshQueued = false;
      window.ScrollTrigger.refresh();
    });
  };
  // -------------------- LEGACY WEBFLOW IX3 PARITY --------------------
  function initLegacyHeroIx3() {
    const root = document.querySelector("[data-darken-on-scroll='true']");
    // The section is hidden in <head> until animation runtime is ready.
    document.documentElement.classList.remove("is-hero-loading");
    if (!root || !has("ScrollTrigger")) return;
    const heroMask = root.querySelector(".hero-mask-wrap");
    const heroImage = root.querySelector(".hero-kate");
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: "bottom top",
        scrub: 0.8,
        invalidateOnRefresh: true
      }
    });
    tl.to(root, { backgroundColor: "hsla(0, 0%, 0%, 1)", duration: 1 }, 0);
    if (heroMask) tl.to(heroMask, { height: 0, duration: 0.1 }, 0);
    if (heroImage) tl.to(heroImage, { yPercent: 20, duration: 1 }, 0);
  }
  function initLegacyJokeTextIx3() {
    const items = Array.from(document.querySelectorAll(".joke-text"));
    if (!items.length) return;
    items.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0 },
        {
          opacity: 1,
          ease: "none",
          duration: 1.01,
          delay: 2.44,
          overwrite: "auto",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            toggleActions: "play none none none"
          }
        }
      );
    });
  }
  // -------------------- LENIS <-> SCROLLTRIGGER BRIDGE --------------------
  function initLenisBridge() {
    if (!has("ScrollTrigger")) return;
    // Safari/iOS: меньше плясок от 100vh/адресной строки
    window.ScrollTrigger.config({ ignoreMobileResize: true });
    const lenis = window.lenis;
    if (!lenis || typeof lenis.on !== "function") return;
    // Главная связка: ScrollTrigger должен обновляться на lenis-scroll
    lenis.on("scroll", window.ScrollTrigger.update);
    // Когда ScrollTrigger делает refresh, сообщаем Lenis (если доступно)
    window.ScrollTrigger.addEventListener("refresh", () => {
      if (typeof lenis.resize === "function") lenis.resize();
    });
    scheduleRefresh();
  }

  // -------------------- 11) SCRAMBLE TEXT --------------------
  function initScramble() {
    if (!has("ScrollTrigger") || !has("ScrambleTextPlugin") || !has("SplitText")) return;
    function initScrambleOnLoad() {
      document.querySelectorAll('[data-scramble="load"]').forEach((target) => {
        const split = new window.SplitText(target, {
          type: "words, chars",
          wordsClass: "word",
          charsClass: "char"
        });
        gsap.to(split.words, {
          duration: 1.2,
          stagger: 0.01,
          scrambleText: { text: "{original}", chars: "upperCase", speed: 0.85 },
          onComplete: () => split.revert()
        });
      });
    }
    function initScrambleOnScroll() {
      document.querySelectorAll('[data-scramble="scroll"]').forEach((target) => {
        const isAlternative = target.hasAttribute("data-scramble-alt");
        // используем секцию как триггер, чтобы ждать, пока она целиком войдёт во вьюпорт
        const triggerEl =
          target.closest("[data-scramble-trigger]") ||
          target.closest("section") ||
          target;
        const split = new window.SplitText(target, {
          type: "words, chars",
          wordsClass: "word",
          charsClass: "char"
        });
        gsap.to(split.words, {
          duration: 1.4,
          stagger: 0.015,
          scrambleText: {
            text: "{original}",
            chars: isAlternative ? "▯|" : "upperCase",
            speed: 0.95
          },
          scrollTrigger: {
            trigger: triggerEl,
            start: "top 20%", // запускаем, когда секция уже ~80% в вьюпорте
            once: true,
            invalidateOnRefresh: true
          },
          onComplete: () => split.revert()
        });
      });
    }
    function initScrambleOnHover() {
      document.querySelectorAll('[data-scramble-hover="link"]').forEach((target) => {
        const textEl = target.querySelector('[data-scramble-hover="target"]');
        if (!textEl) return;
        const originalText = textEl.textContent || "";
        const customHoverText = textEl.getAttribute("data-scramble-text");
        const split = new window.SplitText(textEl, {
          type: "words, chars",
          wordsClass: "word",
          charsClass: "char"
        });
        target.addEventListener("mouseenter", () => {
          gsap.to(textEl, {
            duration: 1,
            scrambleText: { text: customHoverText ? customHoverText : originalText, chars: "◊▯∆|" }
          });
        });
        target.addEventListener("mouseleave", () => {
          gsap.to(textEl, {
            duration: 0.3,
            scrambleText: { text: originalText, speed: 2, chars: "◊▯∆" }
          });
        });
      });
    }
    initScrambleOnScroll();
  }
  // -------------------- 1) STICKY FEATURES --------------------
  function initStickyFeatures(root) {
    if (!has("ScrollTrigger")) return;
    const wraps = Array.from((root || document).querySelectorAll("[data-sticky-feature-wrap]"));
    if (!wraps.length) return;
    wraps.forEach((w) => {
      const visualWraps = Array.from(w.querySelectorAll("[data-sticky-feature-visual-wrap]"));
      const items = Array.from(w.querySelectorAll("[data-sticky-feature-item]"));
      const progressBar = w.querySelector("[data-sticky-feature-progress]");
      if (!visualWraps.length || !items.length) return;
      const count = Math.min(visualWraps.length, items.length);
      if (count < 1) return;
      const rm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const DURATION = rm ? 0.01 : 0.75;
      const EASE = "power4.inOut";
      const SCROLL_AMOUNT = 0.9;
      const getTexts = (el) => Array.from(el.querySelectorAll("[data-sticky-feature-text]"));
      if (visualWraps[0]) setClipPath(visualWraps[0], "inset(0% round 0.75em)");
      gsap.set(items[0], { autoAlpha: 1 });
      let currentIndex = 0;
      function animateOut(itemEl) {
        if (!itemEl) return;
        const texts = getTexts(itemEl);
        gsap.to(texts, {
          autoAlpha: 0,
          y: -30,
          ease: "power4.out",
          duration: 0.4,
          onComplete: () => gsap.set(itemEl, { autoAlpha: 0 })
        });
      }
      function animateIn(itemEl) {
        if (!itemEl) return;
        const texts = getTexts(itemEl);
        gsap.set(itemEl, { autoAlpha: 1 });
        gsap.fromTo(
          texts,
          { autoAlpha: 0, y: 30 },
          {
            autoAlpha: 1,
            y: 0,
            ease: "power4.out",
            duration: DURATION,
            stagger: 0.1
          }
        );
      }
      function transition(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        if (!visualWraps[fromIndex] || !visualWraps[toIndex]) return;
        const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
        if (fromIndex < toIndex) {
          tl.to(
            visualWraps[toIndex],
            tweenClipPathVars({
              clipPath: "inset(0% round 0.75em)",
              duration: DURATION,
              ease: EASE
            }),
            0
          );
        } else {
          tl.to(
            visualWraps[fromIndex],
            tweenClipPathVars({
              clipPath: "inset(50% round 0.75em)",
              duration: DURATION,
              ease: EASE
            }),
            0
          );
        }
        animateOut(items[fromIndex]);
        animateIn(items[toIndex]);
      }
      const steps = Math.max(1, count - 1);
      const st = window.ScrollTrigger.create({
        trigger: w,
        start: "top top",
        end: () => `+=${steps * (window.innerHeight || 0)}`,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: true,
        refreshPriority: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = Math.min(self.progress, SCROLL_AMOUNT) / SCROLL_AMOUNT;
          let idx = Math.floor(p * steps + 1e-6);
          idx = Math.max(0, Math.min(steps, idx));
          if (progressBar) {
            gsap.to(progressBar, { scaleX: p, ease: "none" });
          }
          if (idx !== currentIndex) {
            transition(currentIndex, idx);
            currentIndex = idx;
          }
        }
      });
      // Late-loading images inside the pinned section shift layout.
      // Refresh keeps downstream ScrollTriggers in sync with real positions.
      const media = Array.from(w.querySelectorAll("img, video"));
      media.forEach((el) => {
        if (el.tagName === "IMG") {
          const img = el;
          if (img.complete) return;
          img.addEventListener("load", scheduleRefresh, { once: true });
          img.addEventListener("error", scheduleRefresh, { once: true });
          return;
        }
        const video = el;
        if (video.readyState >= 1) return;
        video.addEventListener("loadedmetadata", scheduleRefresh, { once: true });
        video.addEventListener("error", scheduleRefresh, { once: true });
      });
      if (st) scheduleRefresh();
    });
  }
  // -------------------- 2) STICKY TITLE SCROLL --------------------
  function initStickyTitleScroll() {
    if (!has("ScrollTrigger") || !has("SplitText")) return;
    const wraps = document.querySelectorAll('[data-sticky-title="wrap"]');
    if (!wraps.length) return;
    wraps.forEach((wrap) => {
      const headings = Array.from(wrap.querySelectorAll('[data-sticky-title="heading"]'));
      if (!headings.length) return;
      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: wrap,
          start: "top 40%",
          end: "bottom bottom",
          scrub: true
        }
      });
      const revealDuration = 0.7;
      const fadeOutDuration = 0.7;
      const overlapOffset = 0.15;
      headings.forEach((heading, index) => {
        heading.setAttribute("aria-label", heading.textContent || "");
        const split = new window.SplitText(heading, { type: "words,chars" });
        split.words.forEach((word) => word.setAttribute("aria-hidden", "true"));
        gsap.set(heading, { visibility: "visible" });
        const headingTl = gsap.timeline();
        headingTl.from(split.chars, {
          autoAlpha: 0,
          stagger: { amount: revealDuration, from: "start" },
          duration: revealDuration
        });
        if (index < headings.length - 1) {
          headingTl.to(split.chars, {
            autoAlpha: 0,
            stagger: { amount: fadeOutDuration, from: "end" },
            duration: fadeOutDuration
          });
        }
        if (index === 0) masterTl.add(headingTl);
        else masterTl.add(headingTl, `-=${overlapOffset}`);
      });
    });
  }
  // -------------------- 4) FLIP ON SCROLL --------------------
  function initFlipOnScroll() {
    if (!has("ScrollTrigger") || !has("Flip")) return;
    const wrapperElements = Array.from(document.querySelectorAll("[data-flip-element='wrapper']"));
    const targetEl = document.querySelector("[data-flip-element='target']");
    if (!targetEl || wrapperElements.length < 2) return;
    let tl;
    const buildFlipTimeline = () => {
      if (tl) {
        tl.scrollTrigger && tl.scrollTrigger.kill();
        tl.kill();
        gsap.set(targetEl, { clearProps: "all" });
      }
      tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapperElements[0],
          start: "center center",
          endTrigger: wrapperElements[wrapperElements.length - 1],
          end: "center center",
          scrub: 0.25,
          invalidateOnRefresh: true
        }
      });
      wrapperElements.forEach((element, index) => {
        const nextIndex = index + 1;
        if (nextIndex >= wrapperElements.length) return;
        const nextWrapperEl = wrapperElements[nextIndex];
        if (!nextWrapperEl) return;
        const nextRect = nextWrapperEl.getBoundingClientRect();
        const thisRect = element.getBoundingClientRect();
        const nextDistance = nextRect.top + window.pageYOffset + nextWrapperEl.offsetHeight / 2;
        const thisDistance = thisRect.top + window.pageYOffset + element.offsetHeight / 2;
        const offset = nextDistance - thisDistance;
        const dur = Math.max(0.001, Math.abs(offset));
        tl.add(
          window.Flip.fit(targetEl, nextWrapperEl, {
            duration: dur,
            ease: "none"
          })
        );
      });
    };
    const rebuildFlipTimeline = () => {
      buildFlipTimeline();
      scheduleRefresh();
    };
    rebuildFlipTimeline();
    const targetImage = targetEl.querySelector("img");
    if (targetImage && !targetImage.complete) {
      targetImage.addEventListener("load", rebuildFlipTimeline, { once: true });
      targetImage.addEventListener("error", rebuildFlipTimeline, { once: true });
    }
    window.addEventListener("load", rebuildFlipTimeline, { once: true });
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(rebuildFlipTimeline, 120);
    });
  }
  // -------------------- 5) IMAGES ON SVG PATH --------------------
  function initImagesOnPathScroll() {
    if (!has("ScrollTrigger") || !has("MotionPathPlugin")) return;
    const wrap = document.querySelector('[data-motionpath="wrap"]');
    if (!wrap) return;
    const path = wrap.querySelector('[data-motionpath="path"]');
    const items = wrap.querySelectorAll('[data-motionpath="item"]');
    const itemDetails = wrap.querySelectorAll('[data-motionpath="item-details"]');
    if (!path || !items.length) return;
    gsap.set(items, { zIndex: (i, t, all) => all.length - i });
    // Explicit initial state prevents first-frame overlap artifacts
    gsap.set(items, { autoAlpha: 0, scale: 0.4, filter: "blur(1.5em)" });
    gsap.set(itemDetails, { autoAlpha: 0, yPercent: 25 });
    const oldTl = initImagesOnPathScroll.tl;
    let progress = 0;
    if (oldTl) {
      progress = oldTl.progress();
      oldTl.progress(0).kill();
    }
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrap,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        invalidateOnRefresh: true
      },
      defaults: { ease: "none", stagger: 0.3 }
    });
    tl.to(items, {
      duration: 1,
      motionPath: { path, align: path, curviness: 2, alignOrigin: [0.5, 0.5] }
    })
      .to(items, { autoAlpha: 1, duration: 0.1 }, 0)
      .to(items, { filter: "blur(0em)", duration: 0.5 }, 0)
      .to(itemDetails, { autoAlpha: 1, yPercent: 0, duration: 0.1 }, 0.5)
      .to(items, { scale: 1, duration: 0.65 }, 0)
      .to(items, { autoAlpha: 0, filter: "blur(1em)", duration: 0.15 }, 0.85)
      .to(itemDetails, { autoAlpha: 0, duration: 0.05 }, 0.9);
    tl.progress(progress);
    initImagesOnPathScroll.tl = tl;
    scheduleRefresh();
    if (!initImagesOnPathScroll.resizeHandler) {
      const debounce = (fn, delay = 200) => {
        let timeout;
        return () => {
          clearTimeout(timeout);
          timeout = setTimeout(fn, delay);
        };
      };
      initImagesOnPathScroll.resizeHandler = debounce(() => initImagesOnPathScroll(), 200);
      window.addEventListener("resize", initImagesOnPathScroll.resizeHandler);
    }
    return tl;
  }
  // -------------------- 6) RADIAL TEXT MARQUEE --------------------
  function initRadialTextMarquee() {
    const wraps = document.querySelectorAll('[data-radial-text-marquee-init]');
    if (!wraps.length) return;
    const ns = "http://www.w3.org/2000/svg";
    const xns = "http://www.w3.org/1999/xlink";
    const prefersReducedMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clamp = (n, a, b) => Math.min(b, Math.max(a, Number(n) || 0));
    const speedScale = { minViewport: 250, maxViewport: 2000, minMultiplier: 0.5, maxMultiplier: 1 };
    const getSpeedMultiplier = () => {
      const w = window.innerWidth || speedScale.maxViewport;
      const t = clamp((w - speedScale.minViewport) / (speedScale.maxViewport - speedScale.minViewport), 0, 1);
      return speedScale.minMultiplier + t * (speedScale.maxMultiplier - speedScale.minMultiplier);
    };
    const letterSpacingToPx = (ls, fontSizePx) => {
      if (!ls || ls === "normal") return 0;
      if (ls.endsWith("px")) return parseFloat(ls) || 0;
      if (ls.endsWith("em")) return (parseFloat(ls) || 0) * fontSizePx;
      if (ls.endsWith("rem")) {
        const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        return (parseFloat(ls) || 0) * root;
      }
      const n = parseFloat(ls);
      return Number.isFinite(n) ? n : 0;
    };
    const syncTypography = (fromEl, svgText, svgTextPath) => {
      const s = getComputedStyle(fromEl);
      const fontSizePx = parseFloat(s.fontSize) || 16;
      const lsPx = letterSpacingToPx(s.letterSpacing, fontSizePx);
      svgText.setAttribute("font-family", s.fontFamily);
      svgText.setAttribute("font-size", s.fontSize);
      svgText.setAttribute("font-weight", s.fontWeight);
      svgText.setAttribute("dominant-baseline", "alphabetic");
      svgText.setAttribute("text-rendering", "geometricPrecision");
      svgText.setAttribute("letter-spacing", `${lsPx}px`);
      svgText.setAttribute("fill", s.color);
      if (svgTextPath) svgTextPath.setAttribute("letter-spacing", `${lsPx}px`);
      return fontSizePx;
    };
    const appendTspan = (tp, value, fill) => {
      const t = document.createElementNS(ns, "tspan");
      t.textContent = value;
      if (fill) t.setAttribute("fill", fill);
      tp.appendChild(t);
    };
    const buildRun = (tp, text, spacer, spacerColor, pad, reps) => {
      tp.textContent = "";
      appendTspan(tp, text);
      for (let i = 0; i < reps; i++) {
        appendTspan(tp, pad);
        appendTspan(tp, spacer, spacerColor);
        appendTspan(tp, pad);
        appendTspan(tp, text);
      }
    };
    const buildUnit = (tp, text, spacer, spacerColor, pad) => {
      tp.textContent = "";
      appendTspan(tp, pad);
      appendTspan(tp, spacer, spacerColor);
      appendTspan(tp, pad);
      appendTspan(tp, text);
    };
    const radiusLevelToCircleR = (half, level01) => {
      if (level01 <= 0) return half * 200;
      const inv = 1 - level01;
      return half * (1.01 + inv * inv * 16.99);
    };
    const setPlaying = (state, play) => {
      state.isInView = play;
      if (!state.tween) return;
      if (prefersReducedMotion) return state.tween.pause();
      play ? state.tween.play() : state.tween.pause();
    };
    const makeSvg = (wrap) => {
      const svg = document.createElementNS(ns, "svg");
      const defs = document.createElementNS(ns, "defs");
      const g = document.createElementNS(ns, "g");
      const path = document.createElementNS(ns, "path");
      const text = document.createElementNS(ns, "text");
      const textPath = document.createElementNS(ns, "textPath");
      const id = `rtm-${Math.random().toString(16).slice(2)}`;
      Object.assign(svg.style, {
        position: "absolute",
        top: 0,
        left: 0,
        overflow: "visible",
        pointerEvents: "none",
        display: "block"
      });
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      path.setAttribute("id", id);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "none");
      textPath.setAttributeNS(xns, "xlink:href", `#${id}`);
      textPath.setAttribute("text-anchor", "start");
      text.appendChild(textPath);
      defs.appendChild(path);
      svg.appendChild(defs);
      g.appendChild(path);
      g.appendChild(text);
      svg.appendChild(g);
      wrap.appendChild(svg);
      const textEl = wrap.querySelector("[data-radial-text-marquee-text]");
      if (textEl) textEl.style.opacity = "0";
      // hidden measure svg
      const msvg = document.createElementNS(ns, "svg");
      const mdefs = document.createElementNS(ns, "defs");
      const mpath = document.createElementNS(ns, "path");
      const mtext = document.createElementNS(ns, "text");
      const mtp = document.createElementNS(ns, "textPath");
      const mid = `rtm-m-${Math.random().toString(16).slice(2)}`;
      msvg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none";
      mpath.setAttribute("id", mid);
      mpath.setAttribute("d", "M 0 0 L 100000 0");
      mtp.setAttributeNS(xns, "xlink:href", `#${mid}`);
      mtp.setAttribute("text-anchor", "start");
      mtext.appendChild(mtp);
      mdefs.appendChild(mpath);
      msvg.appendChild(mdefs);
      msvg.appendChild(mtext);
      wrap.appendChild(msvg);
      return { svg, g, path, text, textPath, measureText: mtext, measureTextPath: mtp };
    };
    // Один resize listener на wrap
    const rebuildHandlers = new WeakMap();
    const debounce = (fn, delay = 120) => {
      let t;
      return () => {
        clearTimeout(t);
        t = setTimeout(fn, delay);
      };
    };
    wraps.forEach((wrap) => {
      const textEl = wrap.querySelector("[data-radial-text-marquee-text]");
      if (!textEl) return;
      const state = {
        ...makeSvg(wrap),
        tween: null,
        proxy: { x: 0 },
        isInView: true,
        raf: 0
      };
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(
          (e) => setPlaying(state, e[0] && e[0].isIntersecting),
          { threshold: 0 }
        ).observe(wrap);
      }
      const rebuild = () => {
        const text = (textEl.textContent || "").trim();
        if (!text) return;
        const duplicateBase = 6;
        const speed = clamp(wrap.getAttribute("data-radial-text-marquee-speed") || 4, 0, 200);
        const speedPx = Math.max(speed * 100 * getSpeedMultiplier(), 1);
        const radiusLevel = clamp(wrap.getAttribute("data-radial-text-marquee-radius") || 10, 0, 10);
        const level01 = radiusLevel / 10;
        const spacer = wrap.getAttribute("data-radial-text-marquee-spacer") || "•";
        const spacerColor = wrap.getAttribute("data-radial-text-marquee-spacer-color") || null;
        const padCount = clamp(wrap.getAttribute("data-radial-text-marquee-spacer-padding") || 1, 0, 20);
        const pad = "\u00A0".repeat(padCount);
        const fontSizePx = syncTypography(textEl, state.text, state.textPath);
        syncTypography(textEl, state.measureText, state.measureTextPath);
        const wrapW = Math.max(wrap.clientWidth, 1);
        const wrapH = Math.max(wrap.clientHeight || textEl.offsetHeight, 1);
        const bleed = fontSizePx * 2;
        const w = wrapW + bleed * 2;
        const h = wrapH;
        Object.assign(state.svg.style, { width: `${w}px`, height: `${h}px`, left: `${-bleed}px` });
        state.svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
        const half = w / 2;
        const r = level01 <= 0.0001 ? half * 200 : Math.max(radiusLevelToCircleR(half, level01), half + 0.001);
        const under = Math.max(r * r - half * half, 0);
        const y = Math.max(r - Math.sqrt(under), 0);
        state.path.setAttribute(
          "d",
          level01 <= 0.0001 ? `M 0 ${y} L ${w} ${y}` : `M 0 ${y} A ${r} ${r} 0 0 1 ${w} ${y}`
        );
        state.text.setAttribute("x", "0");
        state.text.setAttribute("y", y);
        state.g.setAttribute("transform", `translate(0 ${fontSizePx})`);
        cancelAnimationFrame(state.raf);
        state.raf = requestAnimationFrame(() => {
          buildUnit(state.measureTextPath, text, spacer, spacerColor, pad);
          const unitLen = state.measureTextPath.getComputedTextLength();
          if (!unitLen || unitLen <= 0) {
            buildRun(state.textPath, text, spacer, spacerColor, pad, duplicateBase);
            state.tween && state.tween.kill();
            return;
          }
          const loopLen = unitLen;
          let reps = duplicateBase;
          buildRun(state.textPath, text, spacer, spacerColor, pad, reps);
          const MAX_ITERS = 25;
          let lastLen = state.textPath.getComputedTextLength();
          for (let i = 0; i < MAX_ITERS; i++) {
            const nowLen = state.textPath.getComputedTextLength();
            if (!nowLen || nowLen <= 0) break;
            if (nowLen >= Math.max(loopLen * 2.6, wrapW * 3)) break;
            if (nowLen <= lastLen + 0.01) break;
            lastLen = nowLen;
            reps = Math.ceil(reps * 1.35);
            buildRun(state.textPath, text, spacer, spacerColor, pad, reps);
          }
          state.tween && state.tween.kill();
          if (prefersReducedMotion) return;
          state.proxy.x = 0;
          state.tween = gsap.to(state.proxy, {
            x: loopLen,
            duration: loopLen / speedPx,
            ease: "none",
            repeat: -1,
            onUpdate: () => {
              const x = ((state.proxy.x % loopLen) + loopLen) % loopLen;
              state.textPath.setAttribute("startOffset", `${-x}px`);
            }
          });
          setPlaying(state, state.isInView);
        });
      };
      rebuild();
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(rebuild).catch(() => {});
      }
      if (!rebuildHandlers.has(wrap)) {
        const onResize = debounce(rebuild, 120);
        rebuildHandlers.set(wrap, onResize);
        if ("ResizeObserver" in window) {
          new ResizeObserver(onResize).observe(wrap);
          new ResizeObserver(onResize).observe(textEl);
        } else {
          window.addEventListener("resize", onResize);
        }
      }
    });
  }
  // -------------------- 7) HORIZONTAL SCROLL --------------------
  function initHorizontalScrolling() {
    if (!has("ScrollTrigger")) return;
    const mm = gsap.matchMedia();
    mm.add(
      {
        isMobile: "(max-width:479px)",
        isMobileLandscape: "(max-width:767px)",
        isTablet: "(max-width:991px)",
        isDesktop: "(min-width:992px)"
      },
      (context) => {
        const { isMobile, isMobileLandscape, isTablet } = context.conditions;
        const ctx = gsap.context(() => {
          const wrappers = document.querySelectorAll("[data-horizontal-gallery-wrap]");
          if (!wrappers.length) return;
          wrappers.forEach((wrap) => {
            // optional disable logic per breakpoint
            const disable = wrap.getAttribute("data-horizontal-gallery-disable");
            if (
              (disable === "mobile" && isMobile) ||
              (disable === "mobileLandscape" && isMobileLandscape) ||
              (disable === "tablet" && isTablet)
            ) {
              return; // skip this wrapper on specified breakpoint
            }
            const panels = gsap.utils.toArray("[data-horizontal-gallery-panel]", wrap);
            if (panels.length < 2) return;
            gsap.to(panels, {
              x: () => -(wrap.scrollWidth - window.innerWidth),
              ease: "none",
              scrollTrigger: {
                trigger: wrap,
                start: "top top",
                end: () => "+=" + (wrap.scrollWidth - window.innerWidth),
                scrub: true,
                pin: true,
                invalidateOnRefresh: true
              }
            });
          });
        });
        return () => ctx.revert(); // cleanup
      }
    );
  }
  // -------------------- 8) BG ZOOM (FLIP) --------------------
  function initBackgroundZoom() {
    if (!has("ScrollTrigger") || !has("Flip")) return;
    const containers = document.querySelectorAll("[data-bg-zoom-init]");
    if (!containers.length) return;
    let masterTimeline;
    const getScrollRange = ({ trigger, start, endTrigger, end }) => {
      const st = window.ScrollTrigger.create({ trigger, start, endTrigger, end });
      const range = Math.max(1, st.end - st.start);
      st.kill();
      return range;
    };
    const bgZoomTimeline = () => {
      masterTimeline && masterTimeline.kill();
      masterTimeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: containers[0].querySelector("[data-bg-zoom-start]") || containers[0],
          start: "clamp(top bottom)",
          endTrigger: containers[containers.length - 1],
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true
        }
      });
      containers.forEach((container) => {
        const startEl = container.querySelector("[data-bg-zoom-start]");
        const endEl = container.querySelector("[data-bg-zoom-end]");
        const contentEl = container.querySelector("[data-bg-zoom-content]");
        const darkEl = container.querySelector("[data-bg-zoom-dark]");
        const imgEl = container.querySelector("[data-bg-zoom-img]");
        if (!startEl || !endEl || !contentEl) return;
        const startRadius = getComputedStyle(startEl).borderRadius;
        const endRadius = getComputedStyle(endEl).borderRadius;
        const hasRadius = startRadius !== "0px" || endRadius !== "0px";
        contentEl.style.overflow = hasRadius ? "hidden" : "";
        if (hasRadius) gsap.set(contentEl, { borderRadius: startRadius });
        window.Flip.fit(contentEl, startEl, { scale: false });
        const zoomScrollRange = getScrollRange({
          trigger: startEl,
          start: "clamp(top bottom)",
          endTrigger: endEl,
          end: "center center"
        });
        const afterScrollRange = getScrollRange({
          trigger: endEl,
          start: "center center",
          endTrigger: container,
          end: "bottom top"
        });
        masterTimeline.add(
          window.Flip.fit(contentEl, endEl, {
            duration: zoomScrollRange,
            ease: "none",
            scale: false
          })
        );
        if (hasRadius) {
          masterTimeline.to(contentEl, { borderRadius: endRadius, duration: zoomScrollRange }, "<");
        }
        masterTimeline.to(contentEl, { y: `+=${afterScrollRange}`, duration: afterScrollRange });
        if (darkEl) {
          gsap.set(darkEl, { opacity: 0 });
          masterTimeline.to(darkEl, { opacity: 0.75, duration: afterScrollRange * 0.25 }, "<");
        }
        if (imgEl) {
          gsap.set(imgEl, { scale: 1, transformOrigin: "50% 50%" });
          masterTimeline.to(imgEl, { scale: 1.25, yPercent: -10, duration: afterScrollRange }, "<");
        }
      });
      scheduleRefresh();
    };
    bgZoomTimeline();
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(bgZoomTimeline, 120);
    });
  }
  // -------------------- 10) GLOBAL PARALLAX --------------------
  function initGlobalParallax() {
    if (!has("ScrollTrigger")) return;
    const mm = gsap.matchMedia();
    mm.add(
      {
        isMobile: "(max-width:479px)",
        isMobileLandscape: "(max-width:767px)",
        isTablet: "(max-width:991px)",
        isDesktop: "(min-width:992px)"
      },
      (context) => {
        const { isMobile, isMobileLandscape, isTablet } = context.conditions;
        const ctx = gsap.context(() => {
          document.querySelectorAll('[data-parallax="trigger"]').forEach((trigger) => {
            const disable = trigger.getAttribute("data-parallax-disable");
            if (
              (disable === "mobile" && isMobile) ||
              (disable === "mobileLandscape" && isMobileLandscape) ||
              (disable === "tablet" && isTablet)
            ) return;
            const target = trigger.querySelector('[data-parallax="target"]') || trigger;
            const direction = trigger.getAttribute("data-parallax-direction") || "vertical";
            const prop = direction === "horizontal" ? "xPercent" : "yPercent";
            const scrubAttr = trigger.getAttribute("data-parallax-scrub");
            const scrub = scrubAttr ? parseFloat(scrubAttr) : true;
            const startAttr = trigger.getAttribute("data-parallax-start");
            const startVal = startAttr !== null ? parseFloat(startAttr) : 20;
            const endAttr = trigger.getAttribute("data-parallax-end");
            const endVal = endAttr !== null ? parseFloat(endAttr) : -20;
            const scrollStartRaw = trigger.getAttribute("data-parallax-scroll-start") || "top bottom";
            const scrollStart = `clamp(${scrollStartRaw})`;
            const scrollEndRaw = trigger.getAttribute("data-parallax-scroll-end") || "bottom top";
            const scrollEnd = `clamp(${scrollEndRaw})`;
            gsap.fromTo(
              target,
              { [prop]: startVal },
              {
                [prop]: endVal,
                ease: "none",
                scrollTrigger: { trigger, start: scrollStart, end: scrollEnd, scrub }
              }
            );
          });
        });
        return () => ctx.revert();
      }
    );
  }
  // -------------------- 12) LOGO WALL CYCLE --------------------
  function initLogoWallCycle() {
    if (!has("ScrollTrigger")) return;
    const loopDelay = 1.5;
    const duration = 0.9;
    function findParentWithDirectTarget(container) {
      const explicit = container.querySelector("[data-logo-wall-target-parent]");
      if (explicit) return explicit;
      const all = container.querySelectorAll("*");
      for (const el of all) {
        const kids = el.children;
        for (const ch of kids) {
          if (ch.matches && ch.matches("[data-logo-wall-target]")) return el;
        }
      }
      return container;
    }
    document.querySelectorAll("[data-logo-wall-cycle-init]").forEach((root) => {
      const list = root.querySelector("[data-logo-wall-list]");
      if (!list) return;
      const items = Array.from(list.querySelectorAll("[data-logo-wall-item]"));
      if (!items.length) return;
      const shuffleFront = root.getAttribute("data-logo-wall-shuffle") !== "false";
      const originalTargets = items
        .map((item) => item.querySelector("[data-logo-wall-target]"))
        .filter(Boolean);
      let visibleItems = [];
      let visibleCount = 0;
      let pool = [];
      let pattern = [];
      let patternIndex = 0;
      let tl;
      function isVisible(el) {
        return window.getComputedStyle(el).display !== "none";
      }
      function shuffleArray(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      }
      function setup() {
        tl && tl.kill();
        visibleItems = items.filter(isVisible);
        visibleCount = visibleItems.length;
        if (!visibleCount) return;
        pattern = shuffleArray(Array.from({ length: visibleCount }, (_, i) => i));
        patternIndex = 0;
        items.forEach((item) => {
          item.querySelectorAll("[data-logo-wall-target]").forEach((old) => old.remove());
        });
        pool = originalTargets.map((n) => n.cloneNode(true));
        let front, rest;
        if (shuffleFront) {
          const shuffledAll = shuffleArray(pool);
          front = shuffledAll.slice(0, visibleCount);
          rest = shuffleArray(shuffledAll.slice(visibleCount));
        } else {
          front = pool.slice(0, visibleCount);
          rest = shuffleArray(pool.slice(visibleCount));
        }
        pool = front.concat(rest);
        for (let i = 0; i < visibleCount; i++) {
          const parent =
            visibleItems[i].querySelector("[data-logo-wall-target-parent]") || visibleItems[i];
          const node = pool.shift();
          if (node) parent.appendChild(node);
        }
        tl = gsap.timeline({ repeat: -1, repeatDelay: loopDelay });
        tl.call(swapNext);
        tl.play();
      }
      function swapNext() {
        const nowCount = items.filter(isVisible).length;
        if (nowCount !== visibleCount) {
          setup();
          return;
        }
        if (!pool.length || !visibleCount) return;
        const idx = pattern[patternIndex % visibleCount];
        patternIndex++;
        const container = visibleItems[idx];
        if (!container) return;
        const parent = findParentWithDirectTarget(container);
        const existing = parent.querySelectorAll("[data-logo-wall-target]");
        if (existing.length > 1) return;
        const current = parent.querySelector("[data-logo-wall-target]");
        const incoming = pool.shift();
        if (!incoming) return;
        gsap.set(incoming, { yPercent: 50, autoAlpha: 0 });
        parent.appendChild(incoming);
        if (current) {
          gsap.to(current, {
            yPercent: -50,
            autoAlpha: 0,
            duration,
            ease: "expo.inOut",
            onComplete: () => {
              current.remove();
              pool.push(current);
            }
          });
        }
        gsap.to(incoming, {
          yPercent: 0,
          autoAlpha: 1,
          duration,
          delay: 0.1,
          ease: "expo.inOut"
        });
      }
      setup();
      window.ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => tl && tl.play(),
        onLeave: () => tl && tl.pause(),
        onEnterBack: () => tl && tl.play(),
        onLeaveBack: () => tl && tl.pause()
      });
      document.addEventListener("visibilitychange", () => {
        if (!tl) return;
        document.hidden ? tl.pause() : tl.play();
      });
    });
  }
  // -------------------- 15) STICKY STEPS (BASIC) --------------------
  function initStickyStepsBasic(root) {
    const containers = Array.from((root || document).querySelectorAll("[data-sticky-steps-init]"));
    if (!containers.length) return;
    containers.forEach((container) => {
      if (container.dataset.stickyStepsInitialized === "true") return;
      const items = Array.from(container.querySelectorAll("[data-sticky-steps-item]"));
      if (!items.length) return;
      container.dataset.stickyStepsInitialized = "true";
      let rafId = null;
      const updateSteps = () => {
        rafId = null;
        const viewportCenter = window.innerHeight / 2;
        let closestIndex = 0;
        let closestDistance = Infinity;
        items.forEach((item, index) => {
          const anchor = item.querySelector("[data-sticky-steps-anchor]");
          if (!anchor) return;
          const rect = anchor.getBoundingClientRect();
          const anchorCenter = rect.top + rect.height / 2;
          const distance = Math.abs(viewportCenter - anchorCenter);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });
        items.forEach((item, index) => {
          let status = "active";
          if (index < closestIndex) status = "before";
          if (index > closestIndex) status = "after";
          item.setAttribute("data-sticky-steps-item-status", status);
        });
      };
      const requestUpdate = () => {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(updateSteps);
      };
      window.addEventListener("scroll", requestUpdate, { passive: true });
      window.addEventListener("resize", requestUpdate);
      requestUpdate();
    });
  }
  // -------------------- 16) LAYERED PANELS --------------------
  function initLayeredPanels() {
    if (!has("ScrollTrigger")) return;
    const root = document.querySelector("[data-layered-panels-init]");
    if (!root || root.dataset.layeredPanelsInitialized === "true") return;
    const panels = gsap.utils.toArray("[data-layered-panel]", root);
    if (panels.length < 2) return;
    root.dataset.layeredPanelsInitialized = "true";
    panels.forEach((panel, index) => {
      const isLast = index === panels.length - 1;
      window.ScrollTrigger.create({
        trigger: panel,
        start: "top top",
        pin: true,
        pinSpacing: isLast,
        anticipatePin: 1,
        invalidateOnRefresh: true
      });
    });
    scheduleRefresh();
  }
  // -------------------- INIT ALL --------------------
  const initAll = () => {
    safeRun("LegacyHeroIx3", () => initLegacyHeroIx3());
    safeRun("LegacyJokeTextIx3", () => initLegacyJokeTextIx3());
    safeRun("LenisBridge", () => initLenisBridge());
    safeRun("Scramble", () => initScramble());
    safeRun("StickyFeatures", () => initStickyFeatures());
    safeRun("StickyTitleScroll", () => initStickyTitleScroll());
    safeRun("FlipOnScroll", () => initFlipOnScroll());
    safeRun("HorizontalScrolling", () => initHorizontalScrolling());
    safeRun("ImagesOnPath", () => initImagesOnPathScroll());
    safeRun("RadialTextMarquee", () => initRadialTextMarquee());
    safeRun("BackgroundZoom", () => initBackgroundZoom());
    safeRun("GlobalParallax", () => initGlobalParallax());
    safeRun("LogoWallCycle", () => initLogoWallCycle());
    safeRun("StickyStepsBasic", () => initStickyStepsBasic());
    safeRun("LayeredPanels", () => initLayeredPanels());
    
    // После всех инитов — один общий refresh
    scheduleRefresh();
    // И ещё один refresh после полной загрузки (шрифты/картинки/AVIF)
    window.addEventListener("load", scheduleRefresh, { once: true });
  };
  // Native init, independent from Webflow runtime.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll, { once: true });
  } else {
    initAll();
  }
})();
