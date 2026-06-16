/* ============================================================
   bg.js — Malla de datos animada de fondo (civic-tech).
   Partículas conectadas que evocan datos/red del sector público.
   Liviano, respeta prefers-reduced-motion y pausa con la pestaña.
   ============================================================ */
(function () {
  "use strict";
  const c = document.getElementById("bgmesh");
  if (!c) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const ctx = c.getContext("2d");
  if (!ctx) return;

  let w, h, dpr, parts = [], raf = null, running = true;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    c.style.width = w + "px"; c.style.height = h + "px";
    c.width = Math.floor(w * dpr); c.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function init() {
    resize();
    const n = Math.max(28, Math.min(72, Math.floor(w * h / 26000)));
    parts = [];
    for (let i = 0; i < n; i++) parts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25 });
  }
  function draw() {
    if (!running) return;
    raf = requestAnimationFrame(draw);
    ctx.clearRect(0, 0, w, h);
    const D = 20000;
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    }
    for (let i = 0; i < parts.length; i++) {
      for (let j = i + 1; j < parts.length; j++) {
        const a = parts[i], b = parts[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 < D) {
          const al = (1 - d2 / D) * 0.16;
          ctx.strokeStyle = "rgba(52,229,196," + al + ")";
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    for (const p of parts) {
      ctx.fillStyle = "rgba(139,123,255,.55)";
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, 6.283); ctx.fill();
    }
  }
  let rT;
  window.addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(init, 200); });
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running && !document.hidden) { if (raf) cancelAnimationFrame(raf); draw(); }
  });
  init();
  draw();
})();
