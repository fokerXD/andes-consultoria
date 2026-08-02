/* ============================================================
   motion.js — Capa de movimiento estilo Awwwards
   Lenis (scroll suave) + GSAP/ScrollTrigger:
   entrada del hero, reveals con stagger, parallax, contadores,
   marquee y botones magnéticos. Respeta prefers-reduced-motion.
   Es 100% aditivo: si GSAP no carga, el sitio funciona igual.

   PARCHE 2026-07-31 — contadores:
   Los contadores usaban gsap.to() con duration 1.6s, pero GSAP
   aplica lagSmoothing: cuando el hilo principal se satura (aquí
   compiten Three.js + el canvas de fondo + Lenis), GSAP estira
   la animación y el conteo tardaba >10 s en llegar al valor real.
   Durante ese tiempo la web mostraba cifras FALSAS y visibles:
   "2 disciplinas (derecho, economía, ingeniería)", "66% entregas
   con trazabilidad" (contradiciendo "trazabilidad total"),
   "S/ 29,702" en vez de S/ 44,000 y "49h" en vez de 72h.
   El respaldo existente no ayudaba porque solo actuaba si el
   texto seguía siendo exactamente "0".
   Solución: contador propio con requestAnimationFrame sobre
   performance.now() (inmune a lagSmoothing) + snap incondicional
   al valor final a los 1200 ms.
   ============================================================ */
(function () {
  "use strict";
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Contador independiente de GSAP -------------------------------
     duration en ms. Usa tiempo real, así que aunque el hilo principal
     se sature el valor final llega SIEMPRE dentro del plazo. */
  function countUp(el, target, render, duration) {
    const dur = duration || 1100;
    const t0 = performance.now();
    let done = false;
    const finish = () => { if (!done) { done = true; render(target); } };
    const step = (now) => {
      if (done) return;
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);          // easeOutCubic
      render(target * eased);
      if (p < 1) requestAnimationFrame(step); else finish();
    };
    requestAnimationFrame(step);
    // Red de seguridad: pase lo que pase, el valor real se ve al final.
    setTimeout(finish, dur + 100);
  }

  /* Dispara fn la primera vez que el elemento entra en pantalla.
     Si no hay IntersectionObserver, dispara de inmediato. */
  function onceVisible(el, fn) {
    if (!("IntersectionObserver" in window)) { fn(); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); fn(); } });
    }, { threshold: 0.1, rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    // Si ya está visible al cargar, no esperamos al observer.
    const r = el.getBoundingClientRect();
    if (r.top < (window.innerHeight || 800) && r.bottom > 0) { io.unobserve(el); fn(); }
  }

  function start() {
    const gsap = window.gsap;

    /* ================================================================
       CONTADORES — fuera del bloque que depende de GSAP, para que
       funcionen aunque GSAP no cargue.
       ================================================================ */

    /* ---- Contadores de KPIs (#confianza) ---- */
    try {
      document.querySelectorAll("#confianza .kpi b").forEach(el => {
        const m = el.textContent.trim().match(/^(\D*)(\d+)(.*)$/);
        if (!m) return;
        const pre = m[1], num = parseInt(m[2], 10), suf = m[3];
        const render = v => { el.textContent = pre + Math.round(v) + suf; };
        if (reduce) { render(num); return; }
        el.textContent = pre + "0" + suf;
        onceVisible(el, () => countUp(el, num, render, 1000));
      });
    } catch (_) {}

    /* ---- Contadores de la sección Datos ---- */
    try {
      document.querySelectorAll(".b-metric[data-count]").forEach(el => {
        const target = parseInt(el.dataset.count, 10) || 0;
        const pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
        const render = v => { el.textContent = pre + Math.round(v).toLocaleString("es-PE") + suf; };
        if (reduce) { render(target); return; }
        onceVisible(el, () => countUp(el, target, render, 1200));
      });
    } catch (_) {}

    if (!gsap) return;                       // sin GSAP: sitio normal
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
    const ST = window.ScrollTrigger;

    /* Evita que un frame lento estire TODAS las animaciones de GSAP. */
    try { if (gsap.ticker && gsap.ticker.lagSmoothing) gsap.ticker.lagSmoothing(200, 24); } catch (_) {}

    /* ---- Scroll suave (Lenis) — solo en escritorio (en táctil rompe el scroll) ---- */
    const isTouch = (window.matchMedia && window.matchMedia("(hover: none), (pointer: coarse)").matches) || window.innerWidth < 800;
    let lenis = null;
    if (window.Lenis && !reduce && !isTouch) {
      try {
        lenis = new window.Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.5 });
        window.__lenis = lenis;   // accesible para pausar/reanudar con los modales
        lenis.on("scroll", () => { if (ST) ST.update(); });
        const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
        // anclas internas con desplazamiento suave (respeta header)
        document.querySelectorAll('a[href^="#"]').forEach(a => {
          a.addEventListener("click", e => {
            const id = a.getAttribute("href");
            if (id && id.length > 1) {
              const el = document.querySelector(id);
              if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -82 }); }
            }
          });
        });
      } catch (_) { lenis = null; }
    }

    const hover = !window.matchMedia || window.matchMedia("(hover: hover)").matches;

    /* ---- Entrada del hero (timeline) — solo si no hay "reducir movimiento" ---- */
    if (!reduce) try {
      const heroBits = [
        ".hero .eyebrow", ".hero h1", ".hero .lead",
        ".hero-badges", ".hero-cta", ".hero-art"
      ].map(s => document.querySelector(s)).filter(Boolean);
      if (heroBits.length) {
        gsap.set(heroBits, { opacity: 0, y: 34 });
        gsap.timeline({ defaults: { ease: "power3.out", duration: 0.9 } })
          .to(heroBits, { opacity: 1, y: 0, stagger: 0.12 }, 0.1);
        // Respaldo suave: si el ticker de GSAP no corre, al menos revela el hero.
        const heroFailsafe = () => heroBits.forEach(el => {
          if (parseFloat(getComputedStyle(el).opacity) < 0.05) { el.style.opacity = "1"; el.style.transform = "none"; }
        });
        setTimeout(heroFailsafe, 1400);
        window.addEventListener("load", () => setTimeout(heroFailsafe, 500));

        /* Asentamiento duro. La timeline dura ~1.8 s, pero si el hilo principal
           se satura (Three.js + canvas + Lenis) GSAP la estira y queda a medias:
           el H1 se quedaba desplazado ~28 px hacia abajo y se encimaba con el
           párrafo. Pasados 3 s forzamos la posición final.
           Se excluye .hero-art porque su transform lo controla el parallax. */
        setTimeout(() => {
          heroBits.forEach(el => {
            if (el.classList.contains("hero-art")) { el.style.opacity = "1"; return; }
            const cs = getComputedStyle(el);
            const moved = cs.transform && cs.transform !== "none" && cs.transform !== "matrix(1, 0, 0, 1, 0, 0)";
            if (parseFloat(cs.opacity) < 0.99 || moved) {
              try { gsap.killTweensOf(el); } catch (_) {}
              el.style.opacity = "1";
              el.style.transform = "none";
            }
          });
        }, 3000);
      }
      // parallax de la tarjeta del hero
      if (ST && document.querySelector(".hero-art")) {
        gsap.to(".hero-art", {
          yPercent: 16, ease: "none",
          scrollTrigger: { trigger: "#inicio", start: "top top", end: "bottom top", scrub: true }
        });
      }
    } catch (_) {}

    /* ---- Reveals al hacer scroll (CSS + IntersectionObserver, independiente de GSAP/ticker) ---- */
    try {
      const sels = [
        "#valor .card", ".svc", "#proceso .step", ".future",
        "#confianza .kpi", "#asistente .ai-card", ".control-points li",
        ".control-demo-wrap", ".cta-band", ".track-demo",
        "#valor .section-head", "#servicios .section-head", "#asistente .section-head",
        "#proceso .section-head", "#seguimiento .section-head", "#proximamente .section-head",
        "#datos .section-head", ".bento .b-card", "#confianza .team-card",
        "#confianza .grid-2 > div"
      ];
      const targets = [];
      sels.forEach(s => document.querySelectorAll(s).forEach(el => {
        if (el && !el.closest(".modal") && targets.indexOf(el) < 0) targets.push(el);
      }));
      if (targets.length) {
        if (!("IntersectionObserver" in window)) {
          targets.forEach(el => el.classList.add("rv", "in"));
        } else {
          targets.forEach((el, i) => { el.classList.add("rv"); el.style.transitionDelay = ((i % 6) * 0.06).toFixed(2) + "s"; });
          const io = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
          }, { threshold: 0.08, rootMargin: "0px 0px -4% 0px" });
          targets.forEach(el => io.observe(el));
          // Respaldo: revela lo que ya está dentro/encima del viewport por si el observer tarda
          const showVisible = () => targets.forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.top < (window.innerHeight || 800)) el.classList.add("in");
          });
          setTimeout(showVisible, 400);
          window.addEventListener("load", () => setTimeout(showVisible, 300));
          // Respaldo robusto (Safari iOS): revela al hacer scroll aunque el observer falle
          let sf; window.addEventListener("scroll", () => { clearTimeout(sf); sf = setTimeout(showVisible, 80); }, { passive: true });
          // Red de seguridad final: nada debe quedar oculto
          setTimeout(() => targets.forEach(el => el.classList.add("in")), 3500);
        }
      }
    } catch (_) {}

    /* ---- Marquee infinito ---- */
    try {
      const track = document.getElementById("marqueeTrack");
      if (track && !reduce) {
        track.innerHTML += track.innerHTML;     // duplica para loop sin costura
        gsap.to(track, { xPercent: -50, repeat: -1, duration: 24, ease: "none" });
      }
    } catch (_) {}

    /* ---- Botones magnéticos (solo con mouse) ---- */
    try {
      if (hover) {
        const mag = document.querySelectorAll(".hero-cta .btn, .cta-band .btn, #asistente #aiGen, .btn-primary.btn-lg");
        mag.forEach(el => {
          el.style.willChange = "transform";
          el.addEventListener("mousemove", e => {
            const r = el.getBoundingClientRect();
            gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.45, duration: 0.4, ease: "power3.out" });
          });
          el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.55, ease: "elastic.out(1,0.4)" }));
        });
      }
    } catch (_) {}

    /* ---- Recalcular al cargar fuentes/recursos ---- */
    if (ST) window.addEventListener("load", () => ST.refresh());
  }

  if (document.readyState === "complete") start();
  else document.addEventListener("DOMContentLoaded", start);
})();
