/* ============================================================
   editorial.js — Andes Consultoría
   Capa de interfaz del rediseño editorial: píldora de navegación,
   overlay de menú, reloj en vivo, modo consciente, selector de
   país/idioma (26 prestatarios BID, datos en paises.js), capítulos
   de servicios y panel de trazabilidad.

   Nota sobre el menú: app.js ya togglea la clase .show sobre
   #navLinks al pulsar #menuToggle. Este archivo NO vuelve a
   enlazar ese click —haría doble toggle y el menú no abriría—;
   solo reacciona al cambio de clase para el bloqueo de scroll,
   el foco y la tecla Escape.
   ============================================================ */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
  };

  /* ==========================================================
     0. window.REGION — puente con app.js
     --------------------------------------------------------
     app.js formatea TODOS los precios con REGION.money(), decide
     el método de contratación con REGION.esPeru() y repinta el
     catálogo con REGION.onChange(). Ese objeto lo publicaba
     region.js, que este rediseño reemplaza; sin él los precios se
     quedarían congelados en soles y el catálogo no reaccionaría al
     cambiar de país.

     Se define en el nivel superior (no dentro de init) y este
     archivo se carga ANTES que app.js: app.js consulta REGION en su
     propio DOMContentLoaded, que se dispara después.

     Regla de moneda, idéntica a la de region.js: soles en Perú,
     equivalente referencial en dólares en el resto.
     ========================================================== */
  var FX = { pen_usd: 3.40, actualizado: "5 de agosto de 2026" };
  var activo = "PE";
  var subs = [];

  function paisesData() { return (window.ANDES_PAISES && window.ANDES_PAISES.C) || {}; }
  function monedaDe(iso) { return iso === "PE" ? "PEN" : "USD"; }

  window.REGION = {
    get code() { return activo; },
    get pais() {
      var c = paisesData()[activo] || { n: "Perú" };
      return { code: activo, nombre: c.n, moneda: monedaDe(activo), lang: c.lang || "es" };
    },
    get lista() {
      var C = paisesData();
      return Object.keys(C).map(function (k) {
        return { code: k, nombre: C[k].n, moneda: monedaDe(k), lang: C[k].lang };
      });
    },
    get fx() { return { pen_usd: FX.pen_usd, actualizado: FX.actualizado }; },
    get revisado() { return (paisesData()[activo] || {}).v === "ok"; },
    esPeru: function () { return activo === "PE"; },
    moneda: function () { return monedaDe(activo); },
    money: function (n, code) {
      var iso = code || activo;
      var v = Number(n) || 0;
      if (monedaDe(iso) === "PEN") return "S/ " + Math.round(v).toLocaleString("es-PE");
      return "US$ " + (Math.round(v / FX.pen_usd / 10) * 10).toLocaleString("es-PE");
    },
    set: function (code) {
      if (!paisesData()[code] || code === activo) return;
      activo = code;
      var sel = $("#paisSel");
      if (sel && sel.value !== code) sel.value = code;
      notify();
    },
    onChange: function (fn) { if (typeof fn === "function") subs.push(fn); }
  };

  function notify() {
    for (var i = 0; i < subs.length; i++) {
      try { subs[i](activo); } catch (e) { /* un suscriptor roto no tumba al resto */ }
    }
  }

  /* ==========================================================
     1. Reloj en vivo de la píldora
     ========================================================== */
  function initClock() {
    var el = $("#liveClock");
    if (!el) return;
    function tick() {
      var d = new Date();
      el.textContent = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    }
    tick();
    setInterval(tick, 15000);
  }

  /* ==========================================================
     2. Píldora que se retrae al bajar
     ========================================================== */
  function initPill() {
    var pill = $(".nav-pill");
    if (!pill) return;
    var last = window.scrollY, ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        var overlayOpen = document.body.classList.contains("no-scroll");
        // no se esconde arriba del todo, ni con el menú abierto
        pill.classList.toggle("tucked", !overlayOpen && y > last && y > 260);
        last = y;
        ticking = false;
      });
    }, { passive: true });
  }

  /* ==========================================================
     3. Overlay de menú — accesibilidad sobre el toggle de app.js
     ========================================================== */
  function initOverlay() {
    var ov = $("#navLinks"), btn = $("#menuToggle");
    if (!ov) return;
    var lastFocus = null;

    function isOpen() { return ov.classList.contains("show"); }
    function close() {
      ov.classList.remove("show");
      if (btn) btn.setAttribute("aria-expanded", "false");
    }

    // Reacciona a la clase .show la togglee quien la togglee
    new MutationObserver(function () {
      var open = isOpen();
      document.body.classList.toggle("no-scroll", open);
      ov.setAttribute("aria-hidden", open ? "false" : "true");
      if (open) {
        lastFocus = document.activeElement;
        var first = ov.querySelector("a, button");
        if (first) first.focus();
      } else if (lastFocus && lastFocus.focus) {
        lastFocus.focus();
        lastFocus = null;
      }
    }).observe(ov, { attributes: true, attributeFilter: ["class"] });

    var closeBtn = $("#ovClose");
    if (closeBtn) closeBtn.addEventListener("click", close);

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || !isOpen()) return;
      // Si hay un modal encima, Escape es suyo: app.js lo cierra.
      if ($(".modal.open")) return;
      close();
    });

    // Retención de foco mientras la cortina está abierta
    ov.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || !isOpen()) return;
      var f = $$('a[href], button:not([disabled])', ov).filter(function (el) {
        return el.offsetParent !== null;
      });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ==========================================================
     4. Modo consciente
     ========================================================== */
  function initAware() {
    var btn = $("#awareBtn");
    if (!btn) return;
    var on = store.get("andes_aware") === "1";
    function apply(v, persist) {
      on = v;
      document.body.classList.toggle("aware-on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      var lbl = $("#awareLabel");
      if (lbl) lbl.textContent = on ? "Modo consciente activo" : "Modo consciente";
      if (persist) store.set("andes_aware", on ? "1" : "0");
      /* Solo se avisa a la escena si hay algo que cambiar: al pulsar el botón,
         o al restaurar el modo ya activado. Llamarlo en cada carga forzaba el
         arranque del canvas en DOMContentLoaded —antes de que hubiera layout—
         y anulaba su diferido hasta después del primer pintado. */
      if ((persist || on) && window.AndesScene && window.AndesScene.refresh) {
        window.AndesScene.refresh();
      }
    }
    apply(on, false);
    btn.addEventListener("click", function () { apply(!on, true); });
  }

  /* ==========================================================
     5. Selector de país / idioma (26 prestatarios BID)
     ========================================================== */
  function initPaises() {
    var data = window.ANDES_PAISES;
    var sel = $("#paisSel");
    if (!data || !sel) return;

    var C = data.C, I18N = data.I18N, GROUPS = data.GROUPS;

    function esc(s) {
      return String(s == null ? "" : s).replace(/[&<>"]/g, function (m) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m];
      });
    }
    function t(lang, k) { return (I18N[lang] && I18N[lang][k]) || I18N.es[k] || ""; }

    /* --- opciones agrupadas por idioma --- */
    sel.innerHTML = GROUPS.map(function (g) {
      return '<optgroup label="' + esc(g[0]) + '">' + g[1].map(function (iso) {
        var c = C[iso];
        return c ? '<option value="' + iso + '">' + c.f + " " + esc(c.n) + "</option>" : "";
      }).join("") + "</optgroup>";
    }).join("");

    /* --- traducción de la interfaz --- */
    function applyLang(lang) {
      $$("[data-i18n]").forEach(function (el) {
        var v = t(lang, el.getAttribute("data-i18n"));
        if (v) el.textContent = v;
      });
      document.documentElement.lang = lang;
      sel.setAttribute("aria-label", t(lang, "picker"));
      var tag = $("#langTag");
      if (tag) tag.textContent = lang.toUpperCase();
    }

    /* --- panel de contexto normativo --- */
    function renderCtx(iso) {
      var c = C[iso], box = $("#paisCtx");
      if (!c || !box) return;
      var L = c.lang;
      var row = function (k, v) {
        return '<div class="pc-row"><span class="pc-k">' + esc(k) + '</span><span class="pc-v">' + esc(v) + "</span></div>";
      };
      var okv = c.v === "ok";
      box.innerHTML =
        '<div class="pc-head">' +
          '<span class="pc-flag">' + c.f + "</span>" +
          "<strong>" + esc(c.n) + "</strong>" +
          '<span class="pc-badge ' + (okv ? "ok" : "warn") + '">' + esc(t(L, okv ? "ctx_verified" : "ctx_partial")) + "</span>" +
          '<span class="pc-title">' + esc(t(L, "ctx_title")) + "</span>" +
        "</div>" +
        '<div class="pc-grid">' +
          row(t(L, "ctx_sni"), c.sni.s + " · " + c.sni.l + " · " + c.sni.o) +
          row(t(L, "ctx_proc"), c.proc.l + " · " + c.proc.o + (c.proc.p && c.proc.p !== "—" ? " · " + c.proc.p : "")) +
          row(t(L, "ctx_exp"), c.eq.exp) +
          row(t(L, "ctx_preinv"), c.eq.preinv) +
          row(t(L, "ctx_ioarr"), c.eq.ioarr) +
          row(t(L, "ctx_fin"), c.eq.fin) +
          row(t(L, "ctx_com"), c.eq.com) +
          row(t(L, "ctx_air"), c.eq.air || "—") +
          row(t(L, "ctx_bid"), "GN-2349-15 (bienes y obras) · GN-2350-15 (consultoría) · PEP/POA/ISP · desembolsos/EFA · salvaguardias") +
        "</div>" +
        '<p class="pc-note">' + esc(t(L, "ctx_note")) + "</p>";

      var vb = $("#paisVerif");
      if (vb) {
        vb.className = "verif " + (okv ? "ok" : "warn");
        vb.textContent = okv ? "Equivalencias verificadas" : "Equivalencias por verificar";
      }
    }

    /* --- vocabulario heredado de region.js, que este rediseño reemplaza --- */
    function applyScoped(iso) {
      var c = C[iso], esPE = iso === "PE";
      $$("[data-solo-pe]").forEach(function (el) { el.hidden = !esPE; });
      $$("[data-salvo-pe]").forEach(function (el) { el.hidden = esPE; });
      $$("[data-pais-txt]").forEach(function (el) {
        var k = el.getAttribute("data-pais-txt");
        if (k === "ambito") el.textContent = c.n;
        else if (k === "fx") {
          el.textContent = esPE ? "" :
            "Importe referencial en US$. La facturación en " + c.n + " se acuerda con la entidad al aceptar la propuesta.";
        }
      });
      var ctxP = $("#ctxPais");
      if (ctxP) ctxP.textContent = c.n;
    }

    function apply(iso) {
      var c = C[iso];
      if (!c) return;
      store.set("andes_pais", iso);
      window.__pais = iso;
      window.__lang = c.lang;
      activo = iso;                 // mantiene REGION en sincronía
      applyLang(c.lang);
      applyScoped(iso);
      renderCtx(iso);
      notify();                     // app.js repinta catálogo, precios y KPI
      document.dispatchEvent(new CustomEvent("andes:pais", { detail: { iso: iso, lang: c.lang } }));
    }

    /* sitemap.xml publica URLs del tipo /?pais=CO, así que el parámetro
       manda sobre lo guardado: si no, todas esas URLs mostrarían el mismo
       país y Google las leería como contenido duplicado. */
    var qs = null;
    try {
      var q = new URLSearchParams(location.search).get("pais");
      if (q) { q = q.toUpperCase(); if (C[q]) qs = q; }
    } catch (_) {}

    var saved = store.get("andes_pais");
    var iso = qs || (saved && C[saved] ? saved : "PE");
    sel.value = iso;
    apply(iso);
    sel.addEventListener("change", function () { apply(sel.value); });
  }

  /* ==========================================================
     6. Capítulos de servicios (acordeón)
     ========================================================== */
  function initChapters() {
    $$(".chapter-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", open ? "false" : "true");
        var panel = btn.nextElementSibling;
        if (panel) panel.setAttribute("aria-hidden", open ? "true" : "false");
      });
    });
  }

  /* ==========================================================
     7. Panel de trazabilidad
     ========================================================== */
  function initTrace() {
    var card = $("#tracePanel");
    if (!card) return;
    var fill = $("#tcFill"), pct = $("#tcPct");
    var steps = $$("#tcSteps li");
    var target = parseInt(card.getAttribute("data-pct") || "68", 10);
    var played = false;

    function play() {
      if (played) return;
      played = true;
      if (fill) fill.style.width = target + "%";

      var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
                    document.body.classList.contains("aware-on");
      if (reduced) {
        if (pct) pct.firstChild.nodeValue = String(target);
        return;
      }
      var t0 = performance.now(), dur = 1300;
      (function step(now) {
        var k = Math.min((now - t0) / dur, 1);
        var v = Math.round(target * (1 - Math.pow(1 - k, 3)));
        if (pct) pct.firstChild.nodeValue = String(v);
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    }

    // Marca hitos según el porcentaje declarado
    steps.forEach(function (li, i) {
      var at = (i + 1) / steps.length * 100;
      if (at <= target) li.classList.add("done");
      else if (li.previousElementSibling && li.previousElementSibling.classList.contains("done") &&
               !li.classList.contains("done")) li.classList.add("now");
    });

    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es, o) {
        if (es[0].isIntersecting) { play(); o.disconnect(); }
      }, { threshold: .35 }).observe(card);
    } else { play(); }
  }

  /* ==========================================================
     7b. Contadores de cifras
     --------------------------------------------------------
     En el sitio anterior los animaba motion.js, que arrastra GSAP
     y Lenis. El rediseño no los carga, así que la cuenta se hace
     aquí: app.js sigue publicando el objetivo en data-count /
     data-target y solo hay que leerlo al entrar en pantalla.
     ========================================================== */
  function initCounters() {
    var els = $$(".b-metric[data-count], #kpiServicios[data-target]");
    if (!els.length) return;

    function run(el) {
      var target = parseInt(el.getAttribute("data-count") || el.getAttribute("data-target") || "0", 10);
      if (!target) return;
      var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
                    document.body.classList.contains("aware-on");
      if (reduced) { el.textContent = String(target); return; }
      var t0 = performance.now(), dur = 1100;
      (function step(now) {
        var k = Math.min((now - t0) / dur, 1);
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    }

    if (!window.IntersectionObserver) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        run(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: .4 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ==========================================================
     8. Revelado al entrar en pantalla
     ========================================================== */
  function initReveal() {
    var els = $$("[data-reveal]");
    if (!els.length || !window.IntersectionObserver) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("reveal");
        io.unobserve(e.target);
      });
    }, { threshold: .18, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ==========================================================
     Arranque
     ========================================================== */
  function init() {
    initClock();
    initPill();
    initOverlay();
    initAware();
    initPaises();
    initChapters();
    initTrace();
    initCounters();
    initReveal();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
