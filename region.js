/* ============================================================
   region.js — Capa de país / región
   ------------------------------------------------------------
   El sitio pasó de "sector público peruano" a "sectores públicos
   de América Latina y el Caribe". Eso obliga a distinguir dos
   tipos de servicio:

     · alcance "multilateral" → las obligaciones nacen del contrato
       de préstamo y de las políticas del Banco, no de la ley del
       país. Aplican IGUAL en los 26 países prestatarios del BID.

     · alcance "nacional" → dependen del sistema de inversión
       pública y de la ley de contrataciones de CADA país. Hoy solo
       está habilitado el módulo de Perú.

   Este archivo es la única fuente de verdad sobre países, monedas
   y marcos normativos. Debe cargarse ANTES que app.js.

   ⚠ Los datos normativos de COUNTRIES fueron verificados en agosto
   de 2026 contra fuentes oficiales de cada país. Revísalos cada
   6 meses: en esta región cambian con frecuencia (ver `revisado`).
   ============================================================ */
"use strict";

(function () {

  /* ---------- Tipo de cambio referencial ----------
     Solo se usa para MOSTRAR un equivalente en dólares fuera del
     Perú. El monto en firme siempre se fija en la propuesta formal.
     Actualiza este valor cuando se mueva el mercado.              */
  const FX = { pen_usd: 3.40, actualizado: "5 de agosto de 2026" };

  /* ---------- Países ----------
     `modulo`:
        "completo"     → línea multilateral + línea nacional operativa
        "multilateral" → solo línea multilateral (la nacional se cotiza a medida)
     Los campos normativos se muestran en la sección de cobertura.  */
  const COUNTRIES = {
    PE: {
      nombre: "Perú", gentilicio: "peruano", moneda: "PEN", modulo: "completo",
      inversion: "Invierte.pe — Sistema Nacional de Programación Multianual y Gestión de Inversiones (DGPMI, MEF)",
      contratacion: "Ley N.° 32069, Ley General de Contrataciones Públicas (vigente desde el 22/04/2025) — OECE",
      plataforma: "SEACE, en transición hacia PLADICOP",
      datos: "Ley N.° 29733 y su reglamento DS N.° 016-2024-JUS — Autoridad Nacional de Protección de Datos Personales (MINJUSDH)",
      nota: "La migración del SEACE a PLADICOP es progresiva y todavía no concluye."
    },
    CO: {
      nombre: "Colombia", gentilicio: "colombiano", moneda: "USD", modulo: "multilateral",
      inversion: "SUIFP y banco de proyectos BPIN, en migración a la Plataforma Integrada de Inversión Pública (DNP)",
      contratacion: "Ley 80 de 1993 y Ley 1150 de 2007, con el Decreto 1082 de 2015 — Colombia Compra Eficiente (ANCP-CCE)",
      plataforma: "SECOP II y Tienda Virtual del Estado Colombiano",
      datos: "Ley Estatutaria 1581 de 2012 — Superintendencia de Industria y Comercio",
      nota: "El «Nuevo SECOP» reemplaza a SECOP I, SECOP II y TVEC de forma escalonada durante 2026."
    },
    CL: {
      nombre: "Chile", gentilicio: "chileno", moneda: "USD", modulo: "multilateral",
      inversion: "Sistema Nacional de Inversiones (SNI) — Ministerio de Desarrollo Social y Familia y DIPRES",
      contratacion: "Ley N.° 19.886, modernizada por la Ley N.° 21.634 (2023) — ChileCompra",
      plataforma: "Mercado Público (mercadopublico.cl)",
      datos: "Ley N.° 19.628 sobre protección de la vida privada",
      nota: "La Ley N.° 21.719, que crea la Agencia de Protección de Datos Personales, entra en vigencia el 1 de diciembre de 2026: hasta esa fecha rige la Ley 19.628."
    },
    EC: {
      nombre: "Ecuador", gentilicio: "ecuatoriano", moneda: "USD", modulo: "multilateral",
      inversion: "Plan Anual de Inversiones y dictamen de prioridad, conforme al Código Orgánico de Planificación y Finanzas Públicas",
      contratacion: "LOSNCP, reformada en octubre de 2025, con nuevo reglamento general (D.E. 193) — SERCOP",
      plataforma: "SOCE — compraspublicas.gob.ec",
      datos: "Ley Orgánica de Protección de Datos Personales (2021) — Superintendencia de Protección de Datos Personales",
      nota: "La Secretaría Nacional de Planificación fue absorbida por la Presidencia en agosto de 2025: el ente rector de la planificación cambió."
    },
    MX: {
      nombre: "México", gentilicio: "mexicano", moneda: "USD", modulo: "multilateral",
      inversion: "Cartera de Programas y Proyectos de Inversión — Unidad de Inversiones de la SHCP",
      contratacion: "Nueva LAASSP (DOF 16/04/2025) y LOPSRM para obra — Secretaría Anticorrupción y Buen Gobierno",
      plataforma: "Compras MX, en sustitución progresiva de CompraNet",
      datos: "Nueva LFPDPPP (DOF 20/03/2025) — «Transparencia para el Pueblo», tras la extinción del INAI",
      nota: "México no tiene un sistema nacional de inversión pública con ley propia: el marco es presupuestario."
    },
    AR: {
      nombre: "Argentina", gentilicio: "argentino", moneda: "USD", modulo: "multilateral",
      inversion: "Sistema Nacional de Inversiones Públicas (Ley N.° 24.354) y banco de proyectos BAPIN — Dirección Nacional de Inversión Pública",
      contratacion: "Decreto Delegado N.° 1023/2001 y Decreto N.° 1030/2016, modificados por los Decretos 70/2023 y 747/2024 — Oficina Nacional de Contrataciones",
      plataforma: "COMPR.AR para bienes y servicios; CONTRAT.AR para obra pública",
      datos: "Ley N.° 25.326 — Agencia de Acceso a la Información Pública",
      nota: "Los montos máximos del sistema de inversión se actualizaron por Disposición DNIP 1/2025, vigente desde enero de 2026."
    },
    BR: {
      nombre: "Brasil", gentilicio: "brasileño", moneda: "USD", modulo: "multilateral",
      inversion: "Brasil no tiene un sistema nacional de inversión pública formal: la inversión se programa vía PPA y presupuesto (SIOP), bajo el Ministério do Planejamento e Orçamento",
      contratacion: "Lei n.° 14.133/2021, Nova Lei de Licitações, única aplicable desde el 01/01/2024 — SEGES/MGI",
      plataforma: "PNCP — Portal Nacional de Contratações Públicas; Compras.gov.br en el ámbito federal",
      datos: "Lei n.° 13.709/2018 (LGPD) — Agência Nacional de Proteção de Dados",
      nota: "La ANPD pasó a ser agencia reguladora por la Lei n.° 15.352, de febrero de 2026."
    },
    DO: {
      nombre: "República Dominicana", corto: "Rep. Dominicana", gentilicio: "dominicano", moneda: "USD", modulo: "multilateral",
      inversion: "Sistema Nacional de Inversión Pública (Ley N.° 498-06) — Dirección General de Inversión Pública, MEPyD",
      contratacion: "Ley N.° 47-25 de Contrataciones Públicas, vigente desde el 28/01/2026, con reglamento (Decreto 52-26) — DGCP",
      plataforma: "SECP — Portal Transaccional, comprasdominicana.gob.do",
      datos: "Ley N.° 172-13",
      nota: "La Ley 47-25 rediseñó por completo el régimen y todavía se está implementando por etapas. El país no cuenta con una autoridad independiente de protección de datos."
    },
    PA: {
      nombre: "Panamá", gentilicio: "panameño", moneda: "USD", modulo: "multilateral",
      inversion: "Sistema Nacional de Inversiones Públicas (SINIP) — Dirección de Programación de Inversiones, MEF",
      contratacion: "Ley 22 de 2006, en su texto único ordenado por la Ley 153 de 2020 — Dirección General de Contrataciones Públicas",
      plataforma: "PanamaCompra",
      datos: "Ley 81 de 2019 — Autoridad Nacional de Transparencia y Acceso a la Información",
      nota: "Hay una reforma a la ley de contrataciones en preparación; hasta que se sancione rige el texto único de 2020."
    },
    CR: {
      nombre: "Costa Rica", gentilicio: "costarricense", moneda: "USD", modulo: "multilateral",
      inversion: "Sistema Nacional de Inversión Pública, con rango legal desde la Ley N.° 10441 (2024) — MIDEPLAN",
      contratacion: "Ley N.° 9986, Ley General de Contratación Pública, vigente desde el 01/12/2022 — Autoridad de Contratación Pública",
      plataforma: "SICOP, que opera como Sistema Digital Unificado",
      datos: "Ley N.° 8968 — Agencia de Protección de Datos de los Habitantes (PRODHAB)",
      nota: "El reglamento de la Ley 9986 fue reformado ampliamente en mayo de 2026."
    },
    GT: {
      nombre: "Guatemala", gentilicio: "guatemalteco", moneda: "USD", modulo: "multilateral",
      inversion: "Sistema Nacional de Inversión Pública — SEGEPLAN",
      contratacion: "Ley de Contrataciones del Estado, Decreto N.° 57-92 — Dirección General de Adquisiciones del Estado, MINFIN",
      plataforma: "GUATECOMPRAS, con el Registro General de Adquisiciones del Estado",
      datos: "Guatemala no cuenta con una ley integral de protección de datos personales ni con autoridad de control",
      nota: "Hay una iniciativa de nueva ley de contrataciones en el Congreso; a la fecha sigue vigente el Decreto 57-92."
    },
    UY: {
      nombre: "Uruguay", gentilicio: "uruguayo", moneda: "USD", modulo: "multilateral",
      inversion: "Sistema Nacional de Inversión Pública y Banco de Proyectos — Oficina de Planeamiento y Presupuesto",
      contratacion: "TOCAF (Decreto N.° 150/012) y sus modificativas; no existe una ley de contrataciones autónoma — Agencia Reguladora de Compras Estatales (ARCE)",
      plataforma: "Compras Estatales — comprasestatales.gub.uy, con el RUPE",
      datos: "Ley N.° 18.331 — Unidad Reguladora y de Control de Datos Personales",
      nota: "La Ley de Presupuesto N.° 20.446 reformó el TOCAF con efectos desde 2026. La ACCE pasó a llamarse ARCE."
    }
  };

  const ORDEN = ["PE", "CO", "CL", "EC", "MX", "AR", "BR", "DO", "PA", "CR", "GT", "UY"];
  const REVISADO = "agosto de 2026";
  const KEY = "andes.pais";
  const DEFAULT = "PE";

  let activo = DEFAULT;
  const subs = [];

  /* ---------- Persistencia ---------- */
  function leerInicial() {
    try {
      const url = new URLSearchParams(location.search).get("pais");
      if (url && COUNTRIES[url.toUpperCase()]) return url.toUpperCase();
    } catch (e) { /* URL malformada: se ignora */ }
    try {
      const g = localStorage.getItem(KEY);
      if (g && COUNTRIES[g]) return g;
    } catch (e) { /* almacenamiento bloqueado: se ignora */ }
    return DEFAULT;
  }

  function set(code) {
    const c = String(code || "").toUpperCase();
    if (!COUNTRIES[c] || c === activo) return;
    activo = c;
    try { localStorage.setItem(KEY, c); } catch (e) { /* no bloquea nada */ }
    document.documentElement.setAttribute("data-pais", c);
    document.documentElement.setAttribute("data-modulo", COUNTRIES[c].modulo);
    subs.forEach(fn => { try { fn(c, COUNTRIES[c]); } catch (e) { console.error(e); } });
  }

  /* ---------- Moneda ----------
     El modelo de precios está denominado en soles. Fuera del Perú se
     muestra el equivalente referencial en dólares, redondeado a la
     decena, para no dar una falsa precisión.                        */
  function money(n, code) {
    const c = COUNTRIES[code || activo] || COUNTRIES[DEFAULT];
    const v = Number(n) || 0;
    if (c.moneda === "PEN") return "S/ " + Math.round(v).toLocaleString("es-PE");
    const usd = Math.round(v / FX.pen_usd / 10) * 10;
    return "US$ " + usd.toLocaleString("es-PE");
  }

  /* ---------- Selector del header ---------- */
  function pintarSelector() {
    const host = document.getElementById("paisPicker");
    if (!host) return;
    host.innerHTML =
      '<label class="pais-lbl" for="paisSel">' +
        '<svg class="ic" aria-hidden="true"><use href="#i-globe"/></svg>' +
        '<span class="sr-only">País de la entidad</span>' +
      '</label>' +
      '<select id="paisSel" class="pais-sel" aria-label="País de la entidad contratante">' +
        ORDEN.map(k => '<option value="' + k + '"' + (k === activo ? " selected" : "") + '>' +
          (COUNTRIES[k].corto || COUNTRIES[k].nombre) + '</option>').join("") +
      '</select>';
    host.querySelector("#paisSel").addEventListener("change", e => set(e.target.value));
    reubicar();
  }

  /* En móvil la barra ya lleva marca + dos botones + hamburguesa: meter ahí
     un selector la desborda (probado: 481px de contenido en una ventana de
     390px). Por debajo de 680px el selector se muda al desplegable del menú,
     que además es donde uno espera encontrar un control de ámbito. */
  let mq = null;
  function reubicar() {
    const host = document.getElementById("paisPicker");
    const nav = document.getElementById("navLinks");
    if (!host || !nav) return;
    if (!mq) {
      mq = window.matchMedia("(max-width: 680px)");
      const on = mq.addEventListener ? mq.addEventListener.bind(mq, "change")
                                     : mq.addListener.bind(mq);
      on(reubicar);
    }
    const enMenu = host.parentElement === nav;
    if (mq.matches && !enMenu) { nav.appendChild(host); host.classList.add("pais-en-menu"); }
    else if (!mq.matches && enMenu) {
      const barra = document.querySelector(".nav-cta");
      if (barra) barra.insertBefore(host, barra.firstChild);
      host.classList.remove("pais-en-menu");
    }
  }

  function sincronizarSelector(code) {
    const s = document.getElementById("paisSel");
    if (s && s.value !== code) s.value = code;
  }

  /* ---------- Textos dependientes del país ----------
     Cualquier elemento con data-pais-txt="clave" recibe el texto
     correspondiente al país activo. Evita repartir condicionales
     por todo el HTML.                                              */
  const TEXTOS = {
    marco(c) {
      return c.modulo === "completo"
        ? "Conforme a " + c.inversion.split(" — ")[0] + " y a la normativa nacional"
        : "Conforme a las políticas del Banco y a la normativa de " + c.nombre;
    },
    datos(c) {
      return c.datos.indexOf("no cuenta") >= 0
        ? "Confidencialidad contractual reforzada"
        : "Datos protegidos — " + c.datos.split(" — ")[0];
    },
    ambito(c) { return c.nombre; },
    fx() {
      return "Los importes se muestran convertidos a dólares con un tipo de cambio referencial de S/ " +
        FX.pen_usd.toFixed(2) + " por US$ (" + FX.actualizado + "). El monto en firme se fija en la propuesta formal, " +
        "en la moneda del contrato.";
    },
    contratacion(c) { return c.contratacion.split(" — ")[0]; }
  };

  function pintarTextos(code, c) {
    document.querySelectorAll("[data-pais-txt]").forEach(el => {
      const fn = TEXTOS[el.getAttribute("data-pais-txt")];
      if (fn) el.textContent = fn(c);
    });
    // Bloques que solo aplican a un módulo concreto
    document.querySelectorAll("[data-solo-pe]").forEach(el => { el.hidden = code !== "PE"; });
    document.querySelectorAll("[data-salvo-pe]").forEach(el => { el.hidden = code === "PE"; });
  }

  /* ---------- Sección de cobertura ---------- */
  function pintarCobertura() {
    const host = document.getElementById("coberturaGrid");
    if (!host) return;
    host.innerHTML = ORDEN.map(k => {
      const c = COUNTRIES[k];
      const completo = c.modulo === "completo";
      return '<article class="cob-card' + (completo ? " cob-full" : "") + '" data-cob="' + k + '">' +
        '<header class="cob-head">' +
          '<h3>' + c.nombre + '</h3>' +
          '<span class="cob-tag">' + (completo ? "Línea multilateral + nacional" : "Línea multilateral") + '</span>' +
        '</header>' +
        '<dl class="cob-dl">' +
          '<dt>Inversión pública</dt><dd>' + c.inversion + '</dd>' +
          '<dt>Contrataciones</dt><dd>' + c.contratacion + '</dd>' +
          '<dt>Plataforma</dt><dd>' + c.plataforma + '</dd>' +
          '<dt>Datos personales</dt><dd>' + c.datos + '</dd>' +
        '</dl>' +
        (c.nota ? '<p class="cob-nota">' + c.nota + '</p>' : '') +
        '<button class="cob-cta" type="button" data-cob-sel="' + k + '">Ver catálogo para ' + c.nombre + '</button>' +
      '</article>';
    }).join("");
    host.addEventListener("click", e => {
      const b = e.target.closest("[data-cob-sel]");
      if (!b) return;
      set(b.getAttribute("data-cob-sel"));
      const s = document.getElementById("servicios");
      if (s) s.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    const rev = document.getElementById("coberturaRev");
    if (rev) rev.textContent = REVISADO;
  }

  /* ---------- API pública ---------- */
  window.REGION = {
    get code() { return activo; },
    get pais() { return COUNTRIES[activo]; },
    get lista() { return ORDEN.map(k => Object.assign({ code: k }, COUNTRIES[k])); },
    get fx() { return Object.assign({}, FX); },
    get revisado() { return REVISADO; },
    esPeru() { return activo === "PE"; },
    moneda() { return COUNTRIES[activo].moneda; },
    money,
    set,
    onChange(fn) { if (typeof fn === "function") subs.push(fn); }
  };

  /* ---------- Arranque ---------- */
  activo = leerInicial();
  document.documentElement.setAttribute("data-pais", activo);
  document.documentElement.setAttribute("data-modulo", COUNTRIES[activo].modulo);

  subs.push(sincronizarSelector);
  subs.push(pintarTextos);

  document.addEventListener("DOMContentLoaded", function () {
    pintarSelector();
    pintarCobertura();
    pintarTextos(activo, COUNTRIES[activo]);
  });

})();
