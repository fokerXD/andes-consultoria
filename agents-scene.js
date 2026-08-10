/* ============================================================
   agents-scene.js — Andes Consultoría
   Escena cenital de agentes ligada al scroll. Canvas 2D con una
   proyección propia (rotación + inclinación + zoom) en vez de
   Three.js: la vista es cenital y monocroma, así que el coste de
   un motor 3D no se justifica y en móvil rinde bastante mejor.

   Coreografía: la sección .scene-pin es la pista de scroll; el
   progreso 0→1 dentro de ella mueve la cámara y avanza las 5 fases.

   Expone window.AndesScene = { stop, start, isRunning }.
   ============================================================ */
(function () {
  "use strict";

  var PHASES = [
    { t: "Insumos validados",
      d: "Recibimos tus archivos y verificamos que cada insumo esté completo y sea legible antes de tocar el expediente." },
    { t: "Análisis normativo",
      d: "Contrastamos el caso contra el sistema nacional de inversión y la ley de contrataciones que aplica a tu país." },
    { t: "Redacción técnica",
      d: "Los agentes redactan en paralelo por secciones, con la estructura que exige la norma y el formato del entregable." },
    { t: "Control de calidad",
      d: "Revisión cruzada: consistencia de cifras, trazabilidad de fuentes y cumplimiento de cada requisito formal." },
    { t: "Firma del especialista",
      d: "Un consultor humano revisa, corrige y firma. Nada sale sin esa revisión final." }
  ];

  var N_AGENTS = 12;
  var TAU = Math.PI * 2;

  var host, canvas, ctx, pin;
  var elTitle, elDesc, elFill, elPct, elCount, elList, elPhaseNum;
  var W = 0, H = 0, dpr = 1;
  var raf = 0, running = false, visible = false;
  var progress = 0, shownPhase = -1;
  var t0 = 0;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  /* ---------- Agentes: posición angular fija, activación por fase ---------- */
  var agents = [];
  function buildAgents() {
    agents = [];
    for (var i = 0; i < N_AGENTS; i++) {
      agents.push({
        a: (i / N_AGENTS) * TAU,          // ángulo en la órbita
        r: 1,                              // radio (unidades de escena)
        // cada agente entra en juego en una fase concreta
        phase: Math.floor(i / (N_AGENTS / PHASES.length)) % PHASES.length,
        // desfase para que el latido no sea sincrónico
        seed: (i * 137.5) % 100 / 100
      });
    }
  }

  /* ---------- Proyección cenital con rotación y zoom ---------- */
  function project(x, y, cam) {
    var c = Math.cos(cam.rot), s = Math.sin(cam.rot);
    var rx = x * c - y * s;
    var ry = x * s + y * c;
    return {
      x: W / 2 + rx * cam.zoom,
      y: H / 2 + ry * cam.zoom * cam.tilt   // tilt < 1 = leve escorzo cenital
    };
  }

  var resizePendiente = false;
  function resize() {
    if (!canvas || !host) return;
    var r = host.getBoundingClientRect();
    if (!r.width || !r.height) {
      /* El contenedor todavía no tiene medidas (layout incompleto). Antes se
         abandonaba en silencio y el canvas se quedaba en los 300x150 por
         defecto para siempre; ahora se reintenta. */
      if (!resizePendiente) {
        resizePendiente = true;
        setTimeout(function () { resizePendiente = false; resize(); }, 120);
      }
      return;
    }
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ---------- Progreso de scroll dentro de la pista ---------- */
  function readProgress() {
    if (!pin) return 0;
    var r = pin.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    if (total <= 0) return 0;
    return clamp(-r.top / total, 0, 1);
  }

  /* ---------- Dibujo ---------- */
  function draw(now) {
    var time = (now - t0) / 1000;
    var p = progress;
    var base = Math.min(W, H);

    var cam = {
      rot: p * TAU * 0.62,                       // la cámara gira con el scroll
      zoom: lerp(base * 0.17, base * 0.31, ease(p)), // y se acerca
      tilt: lerp(0.42, 0.66, ease(p))            // el escorzo se abre un poco
    };

    ctx.clearRect(0, 0, W, H);

    var phaseF = p * PHASES.length;
    var phaseI = clamp(Math.floor(phaseF), 0, PHASES.length - 1);

    /* --- anillos de referencia (retícula cenital) --- */
    ctx.lineWidth = 1;
    for (var k = 1; k <= 3; k++) {
      var rr = k * 0.42;
      ctx.beginPath();
      for (var a = 0; a <= 64; a++) {
        var pt = project(Math.cos(a / 64 * TAU) * rr, Math.sin(a / 64 * TAU) * rr, cam);
        a === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = "rgba(244,241,233," + (0.05 - k * 0.01) + ")";
      ctx.stroke();
    }

    /* --- mesa central --- */
    var tableR = 0.34;
    ctx.beginPath();
    for (var a2 = 0; a2 <= 72; a2++) {
      var tp = project(Math.cos(a2 / 72 * TAU) * tableR, Math.sin(a2 / 72 * TAU) * tableR, cam);
      a2 === 0 ? ctx.moveTo(tp.x, tp.y) : ctx.lineTo(tp.x, tp.y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(244,241,233,.05)";
    ctx.fill();
    ctx.strokeStyle = "rgba(244,241,233,.2)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    /* núcleo latiendo en la mesa */
    var core = project(0, 0, cam);
    var pulse = 1 + Math.sin(time * 1.6) * 0.12;
    var g = ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, base * 0.07 * pulse);
    g.addColorStop(0, "rgba(20,184,166,.5)");
    g.addColorStop(1, "rgba(20,184,166,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(core.x, core.y, base * 0.07 * pulse, 0, TAU);
    ctx.fill();

    /* --- conexiones agente ↔ mesa --- */
    for (var i = 0; i < agents.length; i++) {
      var ag = agents[i];
      var active = ag.phase <= phaseI;
      var ang = ag.a + p * 0.55;                   // la órbita avanza despacio
      var ax = Math.cos(ang) * ag.r, ay = Math.sin(ang) * ag.r;
      var ap = project(ax, ay, cam);
      var edge = project(Math.cos(ang) * tableR, Math.sin(ang) * tableR, cam);

      ctx.beginPath();
      ctx.moveTo(edge.x, edge.y);
      ctx.lineTo(ap.x, ap.y);
      ctx.strokeStyle = active ? "rgba(20,184,166,.42)" : "rgba(244,241,233,.1)";
      ctx.lineWidth = active ? 1.3 : 1;
      ctx.stroke();

      /* paquete de datos viajando hacia la mesa */
      if (active) {
        var tr = (time * 0.5 + ag.seed) % 1;
        var dx = lerp(ap.x, edge.x, tr), dy = lerp(ap.y, edge.y, tr);
        ctx.beginPath();
        ctx.arc(dx, dy, 2.1, 0, TAU);
        ctx.fillStyle = "rgba(20,184,166,.85)";
        ctx.fill();
      }

      /* nodo del agente */
      var rad = active ? 5.4 : 3.6;
      var beat = active ? 1 + Math.sin(time * 2.2 + ag.seed * 6) * 0.1 : 1;
      ctx.beginPath();
      ctx.arc(ap.x, ap.y, rad * beat, 0, TAU);
      ctx.fillStyle = active ? "#14B8A6" : "rgba(244,241,233,.28)";
      ctx.fill();
      if (active) {
        ctx.beginPath();
        ctx.arc(ap.x, ap.y, rad * beat + 4, 0, TAU);
        ctx.strokeStyle = "rgba(20,184,166,.28)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    /* --- malla entre agentes activos de la fase en curso --- */
    ctx.strokeStyle = "rgba(20,184,166,.16)";
    ctx.lineWidth = 1;
    for (var m = 0; m < agents.length; m++) {
      if (agents[m].phase > phaseI) continue;
      for (var n = m + 1; n < agents.length; n++) {
        if (agents[n].phase > phaseI) continue;
        if ((m + n) % 3 !== 0) continue;           // se dibuja solo una parte: legibilidad
        var angM = agents[m].a + p * 0.55, angN = agents[n].a + p * 0.55;
        var pm = project(Math.cos(angM), Math.sin(angM), cam);
        var pn = project(Math.cos(angN), Math.sin(angN), cam);
        ctx.beginPath();
        ctx.moveTo(pm.x, pm.y);
        ctx.lineTo(pn.x, pn.y);
        ctx.stroke();
      }
    }
  }

  /* ---------- Sincronía con el panel de texto ---------- */
  function syncUI() {
    var p = progress;
    var pct = Math.round(p * 100);
    var phaseI = clamp(Math.floor(p * PHASES.length), 0, PHASES.length - 1);

    if (elFill) elFill.style.width = pct + "%";
    if (elPct) elPct.textContent = pct + "%";

    if (phaseI !== shownPhase) {
      shownPhase = phaseI;
      var ph = PHASES[phaseI];
      if (elTitle) elTitle.textContent = ph.t;
      if (elDesc) elDesc.textContent = ph.d;
      if (elPhaseNum) elPhaseNum.textContent = "Fase " + String(phaseI + 1).padStart(2, "0");
      if (elCount) elCount.textContent = String(phaseI + 1).padStart(2, "0") + " / " + String(PHASES.length).padStart(2, "0");
      if (elList) {
        for (var i = 0; i < elList.children.length; i++) {
          var li = elList.children[i];
          li.classList.toggle("on", i === phaseI);
          li.classList.toggle("done", i < phaseI);
        }
      }
    }
  }

  function frame(now) {
    if (!running) return;
    progress = readProgress();
    syncUI();
    if (visible) draw(now);
    raf = requestAnimationFrame(frame);
  }

  /* El navegador pausa requestAnimationFrame cuando la pestaña no está
     visible, y lo estrangula bajo carga. El texto de la fase y la barra
     no deben depender de eso: se sincronizan también al hacer scroll,
     que es barato porque no toca el canvas. */
  function onScroll() {
    progress = readProgress();
    syncUI();
  }

  /* ---------- Arranque / parada ---------- */
  function start() {
    if (running || !canvas) return;
    running = true;
    t0 = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (ctx) ctx.clearRect(0, 0, W, H);
  }

  function init() {
    pin = document.querySelector(".scene-pin");
    host = document.querySelector(".scene-canvas-wrap");
    canvas = document.getElementById("agentsCanvas");
    if (!pin || !host || !canvas) return;
    ctx = canvas.getContext("2d");
    if (!ctx) return;

    elTitle = document.getElementById("phaseTitle");
    elDesc = document.getElementById("phaseDesc");
    elFill = document.getElementById("phaseFill");
    elPct = document.getElementById("phasePct");
    elCount = document.getElementById("sceneCount");
    elList = document.getElementById("phaseList");
    elPhaseNum = document.getElementById("phaseNum");

    buildAgents();
    /* onScroll es barato (no toca el canvas): deja el panel de fases
       correcto desde el primer momento sin coste de render. */
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* Solo pinta cuando la escena está en pantalla */
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
      }, { rootMargin: "120px" }).observe(pin);
    } else { visible = true; }

    /* Respeta la preferencia del sistema desde el arranque y en caliente */
    var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    var wired = false;
    function apply() {
      if (mq.matches || document.body.classList.contains("aware-on")) { stop(); resetStatic(); }
      else {
        /* El observador de tamaño dispara resize() al registrarse, que
           reserva el búfer del canvas. Se registra aquí, ya fuera del
           camino de render inicial. */
        if (!wired) {
          wired = true;
          if (window.ResizeObserver) new ResizeObserver(resize).observe(host);
          else window.addEventListener("resize", resize);
        }
        resize();
        start();
      }
    }
    mq.addEventListener ? mq.addEventListener("change", apply) : mq.addListener(apply);

    /* Arranque diferido: dimensionar el canvas y lanzar el bucle compite con
       el primer pintado. Se espera a 'load' y luego a que el hilo principal
       quede libre; con timeout por si nunca hay hueco de inactividad. */
    function afterPaint(fn) {
      var go = function () {
        if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 1500 });
        else setTimeout(fn, 200);
      };
      if (document.readyState === "complete") go();
      else window.addEventListener("load", go, { once: true });
    }
    afterPaint(apply);

    window.AndesScene = {
      start: start, stop: stop, refresh: apply,
      /* Un fotograma a demanda: sirve para verificación automatizada y
         para repintar tras un cambio de tamaño sin esperar al rAF. */
      tick: function () { resize(); onScroll(); draw(performance.now()); },
      isRunning: function () { return running; }
    };
  }

  /* Con la escena apagada el usuario sigue necesitando saber las 5 fases:
     el bloque estático las lista y el panel muestra la primera. */
  function resetStatic() {
    if (elTitle && !elTitle.textContent) elTitle.textContent = PHASES[0].t;
    if (elDesc && !elDesc.textContent) elDesc.textContent = PHASES[0].d;
  }

  /* Publica las fases para que index.html no las duplique a mano */
  window.ANDES_PHASES = PHASES;

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
