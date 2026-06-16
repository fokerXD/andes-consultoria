/* ============================================================
   motion.js — Capa de movimiento estilo Awwwards
   Lenis (scroll suave) + GSAP/ScrollTrigger:
   entrada del hero, reveals con stagger, parallax, contadores,
   marquee y botones magnéticos. Respeta prefers-reduced-motion.
   Es 100% aditivo: si GSAP no carga, el sitio funciona igual.
   ============================================================ */
(function () {
  "use strict";
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function start() {
    const gsap = window.gsap;
    if (!gsap) return;                       // sin GSAP: sitio normal
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
    const ST = window.ScrollTrigger;

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

    if (reduce) return;                      // sin animaciones de entrada

    const hover = !window.matchMedia || window.matchMedia("(hover: hover)").matches;

    /* ---- Entrada del hero (timeline) ---- */
    try {
      const heroBits = [
        ".hero .eyebrow", ".hero h1", ".hero .lead",
        ".hero-badges", ".hero-cta", ".hero-art"
      ].map(s => document.querySelector(s)).filter(Boolean);
      if (heroBits.length) {
        gsap.set(heroBits, { opacity: 0, y: 34 });
        gsap.timeline({ defaults: { ease: "power3.out", duration: 0.9 } })
          .to(heroBits, { opacity: 1, y: 0, stagger: 0.12 }, 0.1);
      }
      // parallax de la tarjeta del hero
      if (ST && document.querySelector(".hero-art")) {
        gsap.to(".hero-art", {
          yPercent: 16, ease: "none",
          scrollTrigger: { trigger: "#inicio", start: "top top", end: "bottom top", scrub: true }
        });
      }
    } catch (_) {}

    /* ---- Reveals al hacer scroll (stagger por grupos) ---- */
    try {
      if (ST) {
        const targets = gsap.utils.toArray([
          "#valor .card", ".svc", "#proceso .step", ".future",
          "#confianza .kpi", "#asistente .ai-card", ".control-points li",
          ".control-demo-wrap", ".cta-band", ".track-demo",
          "#valor .section-head", "#servicios .section-head", "#asistente .section-head",
          "#proceso .section-head", "#seguimiento .section-head", "#proximamente .section-head",
          "#datos .section-head", ".bento .b-card", "#confianza .team-card",
          "#confianza .grid-2 > div"
        ]).filter(el => el && !el.closest(".modal"));
        if (targets.length) {
          gsap.set(targets, { opacity: 0, y: 42 });
          ST.batch(targets, {
            start: "top 92%",
            onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: 0.8, stagger: 0.09, ease: "power3.out", overwrite: true })
          });
          // por si algo quedó por encima del primer cálculo
          ST.refresh();
          // Respaldo: nada debe quedar oculto si un trigger no dispara (sobre todo en móvil)
          const failsafe = () => targets.forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.top < (window.innerHeight || 800) * 0.98 && parseFloat(getComputedStyle(el).opacity) < 0.05) {
              gsap.to(el, { opacity: 1, y: 0, duration: 0.5, overwrite: true });
            }
          });
          window.addEventListener("load", () => setTimeout(failsafe, 600));
          setTimeout(failsafe, 2200);
        }
      }
    } catch (_) {}

    /* ---- Contadores de KPIs ---- */
    try {
      document.querySelectorAll("#confianza .kpi b").forEach(el => {
        const m = el.textContent.trim().match(/^(\D*)(\d+)(.*)$/);
        if (!m) return;
        const pre = m[1], num = parseInt(m[2], 10), suf = m[3];
        const o = { v: 0 };
        const apply = () => { el.textContent = pre + Math.round(o.v) + suf; };
        if (ST) {
          gsap.to(o, { v: num, duration: 1.5, ease: "power2.out", onUpdate: apply,
            scrollTrigger: { trigger: el, start: "top 88%", once: true } });
        }
      });
    } catch (_) {}

    /* ---- Contadores de la sección Datos ---- */
    try {
      document.querySelectorAll(".b-metric[data-count]").forEach(el => {
        const target = parseInt(el.dataset.count, 10) || 0;
        const pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
        const o = { v: 0 };
        const fmt = () => { el.textContent = pre + Math.round(o.v).toLocaleString("es-PE") + suf; };
        if (ST) gsap.to(o, { v: target, duration: 1.6, ease: "power2.out", onUpdate: fmt, scrollTrigger: { trigger: el, start: "top 90%", once: true } });
        else fmt();
      });
    } catch (_) {}

    /* ---- Marquee infinito ---- */
    try {
      const track = document.getElementById("marqueeTrack");
      if (track) {
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
