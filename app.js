/* ============================================================
   Andes Consultoría Inteligente — lógica de la plataforma
   Cotizador, checkout (Culqi), entrega y trazabilidad.
   ============================================================ */
"use strict";

/* ---------- Utilidades ---------- */
/* El modelo de precios está denominado en soles. region.js decide cómo
   se MUESTRA según el país de la entidad: soles en Perú, equivalente
   referencial en dólares fuera. Si region.js no cargó, se cae a soles. */
const PEN = n => (window.REGION ? window.REGION.money(n)
                                : "S/ " + Math.round(n).toLocaleString("es-PE"));
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const IGV = 0.18; // referencial: precios mostrados incluyen IGV

/* ---------- Catálogo de servicios ----------
   Cada campo puede aportar al precio con:
   - factor  (multiplicador sobre la base)
   - add     (monto fijo en soles)
   - perUnit (en numéricos: precio por unidad sobre 'incluidas')
   También aporta 'days' al plazo estimado.                      */
const SERVICES = {
  expediente: { alcance: "nacional",
    tag: "Inversión pública",
    icon: '<svg class="ic" aria-hidden="true"><use href="#i-ruler"/></svg>',
    name: "Expediente Técnico / Documento Equivalente",
    short: "Elaboración integral conforme a Invierte.pe y directivas del MEF, para cualquier sector.",
    base: 7500,
    baseDays: 25,
    insumos: [
      "Estudio de preinversión / ficha técnica aprobada (PDF)",
      "Código Único de Inversiones (CUI)",
      "Estudios básicos disponibles (topografía, suelos, hidrología, etc.)",
      "Disponibilidad de terreno / saneamiento físico-legal",
      "Parámetros y normativa sectorial aplicable"
    ],
    miniInsumos: ["Ficha/estudio de preinversión", "CUI y estudios básicos", "Normativa sectorial"],
    kw: ["ioarr", "documento equivalente", "invierte.pe", "ficha técnica", "ficha estándar", "obra", "inversión pública", "optimización", "ampliación marginal", "reposición", "rehabilitación", "tecnología", "tic", "transformación digital", "presupuesto de obra"],
    note(v) {
      const grande = v.monto === "c" || v.monto === "d"; // > S/ 5 M
      if (v.tipo === "pi") {
        return { cls: "", html: `<h5>Documento aplicable</h5>
          <span class="doc">Expediente Técnico</span>
          Para un <b>Proyecto de Inversión</b> el documento de la fase de ejecución es el expediente técnico,
          conforme a la <b>Directiva N.° 001-2019-EF/63.01</b> (Directiva General del Invierte.pe). Crea o amplía
          la capacidad de producción de un servicio público.` };
      }
      if (v.tipo === "ioarr") {
        return { cls: "", html: `<h5>Documento aplicable</h5>
          <span class="doc">Documento Equivalente</span>
          Las <b>IOARR</b> (Optimización, Ampliación Marginal, Reposición, Rehabilitación) no se formulan: se
          registran (Formato N.° 07-C) y se ejecutan con un <b>documento equivalente</b> que reemplaza al expediente
          técnico. Base: <b>Lineamientos IOARR</b> (RD N.° 004-2019-EF/63.01) y la Directiva General.
          Recuerda: una IOARR es puntual y de baja complejidad; si requiere analizar alternativas o la UP estuvo
          inoperativa más de un año, corresponde un PI.` };
      }
      // tic
      return { cls: grande ? "warn" : "", html: `<h5>Documento aplicable</h5>
        <span class="doc">Documento Equivalente (TIC)</span>
        Para inversiones <b>con énfasis en tecnologías digitales</b> aplica el lineamiento del MEF de
        <b>febrero 2025</b> (Optimización y Reposición; el contenido mínimo del documento equivalente incluye
        diagnóstico AS&nbsp;IS/TO&nbsp;BE, ciberseguridad, especificaciones de software/hardware, presupuesto con
        2 cotizaciones y cronograma). Califica como TIC si los activos digitales son ≥ 50% del costo.
        ${grande ? `<br><br><b>⚠ Atención:</b> las IOARR tecnológicas <b>no deben superar S/ 4.5 millones</b>;
        además, un <b>data center</b> (edificación/terreno) siempre es un Proyecto de Inversión, no una IOARR.
        Con el monto seleccionado conviene evaluar un PI.` : `` }` };
    },
    fields: [
      { key: "tipo", label: "Tipo de inversión (define el documento y el lineamiento MEF)", type: "select", options: [
        { label: "Proyecto de Inversión (PI) → Expediente Técnico", value: "pi", factor: 1.0, days: 0 },
        { label: "IOARR → Documento Equivalente", value: "ioarr", factor: 0.6, days: -8 },
        { label: "IOARR con énfasis en tecnología digital → Doc. Equivalente TIC", value: "tic", factor: 0.7, days: -6 }
      ]},
      { key: "sector", label: "Sector de la inversión", type: "select", options: [
        { label: "Educación", value: "edu", factor: 1.0, days: 0 },
        { label: "Otro / edificación pública", value: "otr", factor: 1.05, days: 2 },
        { label: "Riego / agricultura", value: "rie", factor: 1.1, days: 3 },
        { label: "Saneamiento / agua", value: "san", factor: 1.15, days: 4 },
        { label: "Salud", value: "sal", factor: 1.25, days: 5 },
        { label: "Transporte / vialidad", value: "tra", factor: 1.3, days: 6 }
      ]},
      { key: "monto", label: "Monto referencial del proyecto", type: "select", options: [
        { label: "Hasta S/ 1 millón", value: "a", factor: 1.0, days: 0 },
        { label: "S/ 1 M – S/ 5 M", value: "b", factor: 1.6, days: 8 },
        { label: "S/ 5 M – S/ 20 M", value: "c", factor: 2.4, days: 16 },
        { label: "Más de S/ 20 M", value: "d", factor: 3.2, days: 28 }
      ]},
      { key: "estudios", label: "¿Qué estudios básicos debemos integrar/elaborar?", type: "checks", options: [
        { label: "Topografía", value: "topo", add: 900, days: 3 },
        { label: "Mecánica de suelos", value: "suelo", add: 1100, days: 4 },
        { label: "Hidrología / hidráulica", value: "hidro", add: 1200, days: 4 },
        { label: "Impacto ambiental", value: "amb", add: 1500, days: 5 }
      ]},
      { key: "urgencia", label: "Plazo de entrega", type: "select", options: [
        { label: "Estándar", value: "std", factor: 1.0, days: 0 },
        { label: "Prioritario (-30% de plazo)", value: "pri", factor: 1.25, days: -6 }
      ]}
    ]
  },

  politicas: { alcance: "regional",
    tag: "Gobernanza",
    icon: '<svg class="ic" aria-hidden="true"><use href="#i-bank"/></svg>',
    name: "Formulación de Políticas Públicas",
    short: "Diseño de políticas, lineamientos y planes basados en evidencia, con matriz de seguimiento.",
    base: 4200,
    baseDays: 18,
    insumos: [
      "Diagnóstico / línea base disponible (si existe)",
      "Marco normativo y competencias de la entidad",
      "Evidencia, estadísticas o estudios previos",
      "Mapa preliminar de actores involucrados",
      "Objetivos de política priorizados por la entidad"
    ],
    miniInsumos: ["Diagnóstico / línea base", "Marco normativo y competencias", "Evidencia disponible"],
    kw: ["lineamientos", "plan", "gobernanza", "diagnóstico", "indicadores", "política nacional", "ceplan", "objetivos estratégicos"],
    note() { return { cls: "", html: `<h5>Enfoque del servicio</h5><span class="doc">Política / Lineamientos</span> Diseño basado en evidencia, alineado a los Lineamientos de Política Nacional y al marco de planeamiento (CEPLAN). Incluye diagnóstico, objetivos prioritarios y, opcionalmente, matriz de indicadores para seguimiento.` }; },
    fields: [
      { key: "nivel", label: "Nivel de gobierno", type: "select", options: [
        { label: "Local / municipal", value: "loc", factor: 1.0, days: 0 },
        { label: "Regional", value: "reg", factor: 1.4, days: 6 },
        { label: "Nacional / sectorial", value: "nac", factor: 1.9, days: 12 }
      ]},
      { key: "alcance", label: "Alcance del entregable", type: "select", options: [
        { label: "Documento de lineamientos", value: "lin", factor: 1.0, days: 0 },
        { label: "Política / plan completo", value: "pol", factor: 1.8, days: 10 }
      ]},
      { key: "extras", label: "Componentes adicionales", type: "checks", options: [
        { label: "Matriz de seguimiento e indicadores", value: "matriz", add: 1200, days: 4 },
        { label: "Análisis costo-beneficio", value: "acb", add: 1600, days: 5 },
        { label: "Proceso participativo / talleres", value: "part", add: 1800, days: 6 }
      ]}
    ]
  },

  regulatorio: { alcance: "regional",
    tag: "Legal & regulatorio",
    icon: '<svg class="ic" aria-hidden="true"><use href="#i-scale"/></svg>',
    name: "Análisis Regulatorio",
    short: "Análisis de impacto regulatorio (AIR), opinión legal y benchmarking normativo.",
    base: 2800,
    baseDays: 10,
    insumos: [
      "Norma(s) o proyecto(s) normativo(s) a analizar",
      "Exposición de motivos (si existe)",
      "Sector / materia regulada",
      "Antecedentes y normativa conexa"
    ],
    miniInsumos: ["Norma o proyecto a analizar", "Exposición de motivos", "Normativa conexa"],
    kw: ["air", "norma", "reglamento", "legal", "decreto supremo", "impacto regulatorio", "benchmarking", "calidad regulatoria", "acr"],
    note(v) { const air = v.profundidad === "air"; return { cls: "", html: `<h5>Enfoque del servicio</h5><span class="doc">${air ? "Análisis de Impacto Regulatorio (AIR)" : "Informe / opinión legal"}</span> ${air ? "Evaluamos el problema, las alternativas y los costos/beneficios conforme a la política de calidad regulatoria." : "Opinión sustentada, con base legal citada y recomendaciones accionables."}` }; },
    fields: [
      { key: "profundidad", label: "Tipo de análisis", type: "select", options: [
        { label: "Opinión legal / informe", value: "op", factor: 1.0, days: 0 },
        { label: "Análisis de Impacto Regulatorio (AIR)", value: "air", factor: 2.2, days: 8 },
        { label: "Benchmarking normativo comparado", value: "bm", factor: 1.6, days: 6 }
      ]},
      { key: "normas", label: "N.° de normas/dispositivos a analizar", type: "number", included: 1, perUnit: 600, min: 1, max: 30, days: 2, unitLabel: "norma adicional" },
      { key: "urgencia", label: "Plazo de entrega", type: "select", options: [
        { label: "Estándar", value: "std", factor: 1.0, days: 0 },
        { label: "Express 72 h (+35%)", value: "exp", factor: 1.35, days: -5 }
      ]}
    ]
  },

  financiera: { alcance: "regional",
    tag: "Gestión financiera",
    icon: '<svg class="ic" aria-hidden="true"><use href="#i-chart"/></svg>',
    name: "Servicios de Gestión Financiera",
    short: "Análisis de ejecución presupuestal, avances financieros y tableros, marco nacional o multilateral.",
    base: 3500,
    baseDays: 12,
    insumos: [
      "Reportes de ejecución (SIAF / SIGA u otros)",
      "Presupuesto Institucional Modificado (PIM) y metas",
      "Periodo y unidades ejecutoras a analizar",
      "Marco aplicable (nacional o del organismo multilateral)"
    ],
    miniInsumos: ["Reportes de ejecución del sistema financiero", "Presupuesto vigente y metas", "Periodo y unidad ejecutora a analizar"],
    kw: ["presupuesto", "presupuestal", "siaf", "siga", "pim", "bid", "banco mundial", "multilateral", "tablero", "bi", "avance financiero", "devengado", "ejecución"],
    note(v) { const mul = v.marco === "mul"; return { cls: "", html: `<h5>Enfoque del servicio</h5><span class="doc">${mul ? "Marco multilateral (BID / BM)" : "Marco nacional (MEF)"}</span> Análisis a partir de SIAF/SIGA y PIM, con conciliación por unidad ejecutora y, si corresponde, tablero de control.${mul ? " Alineado a la reportería del organismo." : ""}` }; },
    fields: [
      { key: "tipo", label: "Tipo de análisis", type: "select", options: [
        { label: "Ejecución presupuestal", value: "eje", factor: 1.0, days: 0 },
        { label: "Avance financiero de proyecto", value: "ava", factor: 1.2, days: 3 },
        { label: "Tablero de control (BI) + análisis", value: "bi", factor: 1.6, days: 6 }
      ]},
      { key: "marco", label: "Marco normativo", type: "select", options: [
        { label: "Nacional (MEF)", value: "nac", factor: 1.0, days: 0 },
        { label: "Multilateral (BID / Banco Mundial)", value: "mul", factor: 1.4, days: 4 }
      ]},
      { key: "ue", label: "N.° de unidades ejecutoras / fuentes", type: "number", included: 1, perUnit: 450, min: 1, max: 40, days: 1, unitLabel: "UE/fuente adicional" }
    ]
  },

  evaluacion: { alcance: "nacional",
    tag: "Contrataciones",
    icon: '<svg class="ic" aria-hidden="true"><use href="#i-clipboard"/></svg>',
    name: "Evaluación a Comités de Selección",
    short: "Apoyo experto al comité: análisis de admisión, evaluación técnica y evaluaciones combinadas.",
    base: 2400,
    baseDays: 7,
    insumos: [
      "Bases integradas del procedimiento",
      "Propuestas / ofertas recibidas",
      "Acta de instalación del comité",
      "Cronograma del procedimiento de selección"
    ],
    miniInsumos: ["Bases integradas", "Propuestas recibidas", "Cronograma del proceso"],
    kw: ["oece", "osce", "ley 32069", "contrataciones publicas", "contrataciones", "postores", "ofertas", "propuestas", "comité", "admisión", "evaluación técnica", "evaluación económica", "selección", "licitación", "concurso público", "seace"],
    note(v) { const t = v.tipo; const lab = t === "com" ? "Evaluación combinada (técnica + económica)" : t === "tec" ? "Evaluación técnica" : "Admisión / calificación"; return { cls: "", html: `<h5>Enfoque del servicio</h5><span class="doc">${lab}</span> Apoyo experto al comité conforme a las bases integradas y a la Ley N.° 32069, Ley General de Contrataciones Públicas, y su Reglamento: revisión de requisitos, puntajes por criterio y cuadro de méritos. La decisión y responsabilidad permanecen en el comité.` }; },
    fields: [
      { key: "tipo", label: "Tipo de evaluación", type: "select", options: [
        { label: "Admisión / requisitos de calificación", value: "adm", factor: 1.0, days: 0 },
        { label: "Evaluación técnica", value: "tec", factor: 1.6, days: 3 },
        { label: "Evaluación combinada (técnica + económica)", value: "com", factor: 2.1, days: 5 }
      ]},
      { key: "props", label: "N.° de propuestas/postores a evaluar", type: "number", included: 3, perUnit: 180, min: 1, max: 80, days: 0.5, unitLabel: "propuesta adicional" },
      { key: "complejidad", label: "Complejidad del objeto", type: "select", options: [
        { label: "Estándar", value: "std", factor: 1.0, days: 0 },
        { label: "Alta (obra / consultoría compleja)", value: "alt", factor: 1.3, days: 3 }
      ]}
    ]
  },

  /* ===== Servicios en incorporación (Próximamente) — también cotizables ===== */
  /* ---------- Operaciones con banca multilateral (BID) ----------
     Esta línea es la columna REGIONAL del catálogo: las obligaciones
     nacen del contrato de préstamo y de las políticas del Banco, no de
     la ley de cada país, así que aplican igual en los 26 países
     prestatarios del BID.

     Marco de referencia:
       · Normas Generales del Contrato de Préstamo — Art. 4.01 y 4.02
         (condiciones previas al primer desembolso y su plazo)
       · Capítulo de supervisión de las Normas Generales — planes, informes
         y auditoría financiera externa
       · GN-2349-15 — Política de Adquisiciones de Bienes, Obras y Servicios Diferentes
         de Consultoría (mayo 2019, vigente desde enero 2020)
       · GN-2350-15 — Política de Selección y Contratación de Consultores (íd.)
       · OP-273-12 — Guía de Gestión Financiera para Proyectos Financiados por el BID
         (17.06.2019, reemplaza OP-273-2)
       · MPAS / ESPF — Marco de Política Ambiental y Social (vigente 31.10.2021), NDAS 1-10

     ⚠ Ojo con la numeración: 4.01 y 4.02 son estables en toda la cartera,
     pero los artículos del capítulo de supervisión (7.0x) NO tienen contenido
     uniforme entre generaciones de Normas Generales ni entre países. No se
     citan números ahí. Los plazos concretos los fija cada contrato en sus
     Estipulaciones Especiales. ------------------------------------------- */

  bidmonitoreo: { alcance: "multilateral",
    tag: "BID · Monitoreo", icon: '<svg class="ic" aria-hidden="true"><use href="#i-trend"/></svg>',
    name: "Monitoreo y reportes de operación BID",
    short: "PEP, POA, Informe Semestral de Progreso y Matriz de Resultados, en el formato y la oportunidad que exige el Banco.",
    base: 8500, baseDays: 15,
    insumos: [
      "Contrato de Préstamo con sus Estipulaciones Especiales",
      "Matriz de Resultados vigente (indicadores, líneas de base y metas)",
      "PEP y POA vigentes, si existen",
      "Plan de Adquisiciones vigente",
      "Reportes de ejecución presupuestal y financiera (SIAF / sistema del ejecutor)"
    ],
    miniInsumos: ["Contrato de préstamo", "Matriz de Resultados", "POA y ejecución"],
    kw: ["bid", "banca multilateral", "préstamo", "pep", "plan de ejecución", "poa", "plan operativo anual", "isp", "informe semestral de progreso", "matriz de resultados", "pmr", "convergence", "monitoreo", "seguimiento", "organismo ejecutor", "banco mundial", "caf"],
    note(v) {
      const atraso = v.estado === "atraso";
      return { cls: atraso ? "warn" : "", html: `<h5>Base contractual</h5>
        <span class="doc">Normas Generales — supervisión de la ejecución</span>
        El Prestatario y el Organismo Ejecutor deben presentar los planes e informes <b>en la forma y con el
        contenido que el Banco razonablemente solicite</b>. El <b>Informe Semestral de Progreso (ISP)</b> reporta
        los resultados y productos alcanzados en la ejecución del <b>POA</b>, del <b>Plan de Adquisiciones</b> y de
        la <b>Matriz de Resultados</b>; el informe del segundo semestre incluye además la <b>propuesta de POA del
        año siguiente</b>.<br>
        El <b>PEP</b> ordena la planificación plurianual según la estructura de productos de la Matriz de Resultados,
        con la ruta crítica de hitos y el plan de ejecución financiera.<br>
        El <b>PMR</b> lo prepara el equipo de proyecto del Banco, no el ejecutor: tu ISP/POA es el insumo que
        determina si la operación se califica como satisfactoria, en alerta o en problema.
        <br><b>Ojo con el plazo:</b> el plazo del ISP lo fija cada contrato en sus Estipulaciones Especiales
        (hemos visto 30 y 60 días desde el cierre del semestre). Lo verificamos en tu contrato antes de empezar.` };
    },
    fields: [
      { key: "producto", label: "Qué necesitas", type: "select", options: [
        { label: "Plan Operativo Anual (POA)", value: "poa", factor: 1.0, days: 0 },
        { label: "Informe Semestral de Progreso (ISP)", value: "isp", factor: 1.11, days: 3 },
        { label: "Matriz de Resultados: revisión y reformulación de indicadores", value: "mdr", factor: 1.33, days: 8 },
        { label: "Plan de Ejecución Plurianual (PEP)", value: "pep", factor: 1.5, days: 11 },
        { label: "Paquete completo (PEP + POA + ISP)", value: "full", factor: 2.11, days: 17 } ]},
      { key: "componentes", label: "Componentes del programa", type: "select", options: [
        { label: "1 a 2 componentes", value: "c2", factor: 1.0, days: 0 },
        { label: "3 a 4 componentes", value: "c4", factor: 1.25, days: 4 },
        { label: "5 o más componentes", value: "c5", factor: 1.5, days: 8 } ]},
      { key: "estado", label: "Situación de la operación", type: "select", options: [
        { label: "Al día, reporte de rutina", value: "ok", factor: 1.0, days: 0 },
        { label: "Con informes atrasados o desembolso bajo la meta", value: "atraso", factor: 1.3, days: 3 } ]}
    ]
  },

  bidadquisiciones: { alcance: "multilateral",
    tag: "BID · Adquisiciones", icon: '<svg class="ic" aria-hidden="true"><use href="#i-package"/></svg>',
    name: "Adquisiciones bajo políticas BID",
    short: "Plan de Adquisiciones, documentos de licitación, informes de evaluación y el expediente que sustenta la no objeción.",
    base: 8600, baseDays: 9,
    insumos: [
      "Plan de Adquisiciones vigente y su registro en SEPA",
      "Anexo fiduciario de la Propuesta de Préstamo (umbrales y modalidad de revisión)",
      "Términos de Referencia o Especificaciones Técnicas del área usuaria",
      "Documento estándar de licitación aplicable a la operación",
      "Presupuesto y certificación presupuestal disponible"
    ],
    miniInsumos: ["Plan de Adquisiciones", "Anexo fiduciario", "TDR o especificaciones"],
    kw: ["bid", "adquisiciones", "gn-2349-15", "gn-2350-15", "plan de adquisiciones", "sepa", "no objeción", "lpi", "lpn", "comparación de precios", "sbcc", "sbc", "sbmc", "scc", "selección directa", "consultor individual", "lista corta", "ex ante", "ex post", "banca multilateral", "licitación pública internacional"],
    note(v) {
      const ind = v.objeto === "ci";
      const ex = v.revision === "exante";
      return { cls: ex ? "" : "warn", html: `<h5>Política aplicable</h5>
        <span class="doc">${v.objeto === "bienes" ? "GN-2349-15" : "GN-2350-15"}</span>
        ${v.objeto === "bienes"
          ? `Bienes, obras y servicios diferentes de consultoría se rigen por la <b>GN-2349-15</b>. El método por
             defecto es la <b>LPI</b>; la <b>Comparación de Precios</b> exige mínimo <b>tres</b> cotizaciones y la
             <b>Contratación Directa</b> solo procede por las cinco causales tasadas del ¶3.7, con publicación
             obligatoria de la adjudicación.`
          : `La selección de consultores se rige por la <b>GN-2350-15</b>. El método por defecto es la <b>SBCC</b>.
             La <b>lista corta</b> lleva entre <b>5 y 8 firmas</b> y, una vez emitida la no objeción,
             <b>no se agregan ni suprimen nombres</b> sin anuencia del Banco. La <b>SCC</b> se limita a servicios
             menores que en ningún caso excedan <b>US$200,000</b>.
             ${ind ? `<br>Para <b>consultores individuales</b> no hay publicación ni propuestas: se comparan las
             calificaciones de <b>al menos tres candidatos</b>. La selección directa de individuales solo procede
             si es continuación de un trabajo previo competitivo, si la duración es <b>menor de seis meses</b>,
             por emergencia, o si hay una única persona calificada.` : ""}`}
        <br><b>Cuidado con dos cosas.</b> Los <b>umbrales no están en la política</b>: los fija el Plan de
        Adquisiciones aprobado y el anexo fiduciario de tu operación. Y está prohibido <b>fraccionar</b> un
        contrato para evitar la LPI: dividir en paquetes menores requiere aprobación previa del Banco.
        ${ex
          ? `<br>En <b>revisión ex ante</b> el Banco debe dar no objeción <b>antes de llamar a licitación</b> y
             <b>antes de la decisión de adjudicación</b>; el contrato solo se adjudica después de recibida.
             Las órdenes de cambio que en conjunto superen el <b>15%</b> del precio original también la requieren.`
          : `<br>En <b>revisión ex post</b> no hay no objeción previa, pero debes conservar todo el expediente
             durante la ejecución y <b>hasta tres años después del último desembolso</b>. Si el Banco encuentra
             incumplimiento en la revisión posterior, puede <b>declarar la adquisición no elegible</b>: el costo
             se traslada a tu presupuesto. Por eso conviene armar el expediente como si fuera ex ante.`}
        <br>En toda evaluación debes verificar la <b>lista de firmas e individuos inelegibles</b> del Banco: no se
        puede adjudicar a quien figure en ella.` };
    },
    fields: [
      { key: "objeto", label: "Objeto de la contratación", type: "select", options: [
        { label: "Consultor individual (GN-2350-15, Sección V)", value: "ci", factor: 1.0, days: 0 },
        { label: "Bienes, obras o servicios diferentes de consultoría (GN-2349-15)", value: "bienes", factor: 1.18, days: 6 },
        { label: "Servicios de consultoría — firma (GN-2350-15)", value: "firma", factor: 1.24, days: 8 } ]},
      { key: "etapa", label: "Etapa que necesitas cubrir", type: "select", options: [
        { label: "Plan de Adquisiciones: elaboración o actualización (18 meses)", value: "pa", factor: 1.0, days: 0 },
        { label: "Documentos de licitación / solicitud de propuestas", value: "docs", factor: 1.18, days: 5 },
        { label: "Informe de evaluación y recomendación de adjudicación", value: "eval", factor: 1.35, days: 7 },
        { label: "Expediente completo, de la convocatoria a la firma del contrato", value: "full", factor: 2.06, days: 17 } ]},
      { key: "revision", label: "Modalidad de revisión del Banco", type: "select", options: [
        { label: "Ex post", value: "expost", factor: 1.0, days: 0 },
        { label: "Ex ante (requiere no objeción)", value: "exante", factor: 1.15, days: 4 } ]}
    ]
  },

  bidfinanciero: { alcance: "multilateral",
    tag: "BID · Financiero", icon: '<svg class="ic" aria-hidden="true"><use href="#i-cash"/></svg>',
    name: "Gestión financiera y desembolsos BID",
    short: "Plan financiero, solicitudes de desembolso, rendición del 80% y control de elegibilidad del gasto.",
    base: 10500, baseDays: 18,
    insumos: [
      "Contrato de Préstamo y cláusula de uso de los recursos",
      "Estado de la cuenta designada y saldos pendientes de justificación",
      "Programación operativa y presupuesto del período",
      "Registros contables y documentación soporte del gasto",
      "Programación del Aporte Local (contrapartida)"
    ],
    miniInsumos: ["Contrato de préstamo", "Saldos por justificar", "Programación del período"],
    kw: ["bid", "desembolso", "anticipo", "reembolso", "pago directo", "op-273-12", "justificación", "rendición", "gasto elegible", "cuenta designada", "contrapartida", "aporte local", "plan financiero", "gestión financiera", "siaf", "cuenta única de tesorería"],
    note(v) {
      return { cls: v.alcance === "eleg" ? "warn" : "", html: `<h5>Marco aplicable</h5>
        <span class="doc">OP-273-12</span>
        La <b>Guía de Gestión Financiera para Proyectos Financiados por el BID (OP-273-12, 17.06.2019)</b>
        reemplazó en su totalidad a la OP-273-2 y organiza la materia en <b>10 Requisitos</b>.<br>
        Los desembolsos se hacen por <b>anticipo, pago directo, reembolso</b> o reembolso contra garantía de carta
        de crédito, y se basan en un <b>plan financiero</b> derivado de la programación operativa: como regla las
        necesidades no exceden un período referencial de <b>seis meses</b> (hasta 12 con aprobación documentada del
        Jefe de Equipo).<br>
        <b>La regla que más traba la ejecución:</b> para recibir un nuevo anticipo debes haber justificado, como
        regla general, el <b>80% del saldo total acumulado pendiente</b>. Hasta que no se justifique,
        <b>el Banco no puede otorgar otro adelanto</b>. El incremento del anticipo vigente procede
        <b>una sola vez</b> por período y exige presentar la planificación financiera ajustada.<br>
        Un gasto es <b>elegible</b> si es necesario y concordante con los objetivos, se ejecutó conforme al contrato
        y a las políticas del Banco, está adecuadamente registrado y sustentado, y se efectuó dentro del Plazo
        Original de Desembolsos. Si se detectan gastos no elegibles el Banco puede exigir el <b>reintegro</b> o
        documentación sustituta, y suspender desembolsos si no se resuelve.<br>
        La documentación soporte <b>original</b> se conserva y debe estar disponible para el Banco y los auditores.` };
    },
    fields: [
      { key: "alcance", label: "Qué necesitas", type: "select", options: [
        { label: "Plan financiero y programación de desembolsos", value: "plan", factor: 1.0, days: 0 },
        { label: "Preparación de la rendición / justificación de gastos", value: "rend", factor: 1.1, days: 2 },
        { label: "Diagnóstico de elegibilidad del gasto (preventivo o ante observación)", value: "eleg", factor: 1.3, days: 5 },
        { label: "Paquete: plan financiero + rendición + tablero de seguimiento", value: "full", factor: 1.8, days: 12 } ]},
      { key: "modalidad", label: "Modalidad de desembolso predominante", type: "select", options: [
        { label: "Anticipo de fondos", value: "ant", factor: 1.0, days: 0 },
        { label: "Reembolso de gastos", value: "reem", factor: 1.05, days: 1 },
        { label: "Pago directo a terceros", value: "dir", factor: 1.0, days: 0 },
        { label: "Mixta", value: "mix", factor: 1.15, days: 3 } ]},
      { key: "monto", label: "Monto del préstamo", type: "select", options: [
        { label: "Hasta US$ 20 millones", value: "m20", factor: 1.0, days: 0 },
        { label: "US$ 20 a 80 millones", value: "m80", factor: 1.25, days: 4 },
        { label: "Más de US$ 80 millones", value: "m80p", factor: 1.5, days: 8 } ]}
    ]
  },

  bidauditoria: { alcance: "multilateral",
    tag: "BID · Auditoría", icon: '<svg class="ic" aria-hidden="true"><use href="#i-receipt"/></svg>',
    name: "Auditoría externa y Estados Financieros Auditados",
    short: "TDR de auditoría, preparación del EFA y respuesta a observaciones y revisiones ex post.",
    base: 6000, baseDays: 6,
    insumos: [
      "Contrato de Préstamo, con el capítulo de supervisión y las Estipulaciones Especiales aplicables",
      "Estados financieros del proyecto y conciliaciones del período",
      "Expedientes de adquisiciones del período a revisar",
      "Informe de auditoría anterior y estado de las recomendaciones",
      "Fecha de corte acordada con el Banco"
    ],
    miniInsumos: ["Contrato de préstamo", "Estados financieros", "Expedientes de adquisiciones"],
    kw: ["bid", "auditoría", "efa", "estados financieros auditados", "auditor externo", "tdr de auditoría", "revisión ex post", "nia", "intosai", "contraloría", "oci", "suspensión de desembolsos", "op-273-12", "auditoría externa"],
    note(v) {
      const tarde = v.situacion === "vencido";
      return { cls: tarde ? "warn" : "", html: `<h5>Base contractual</h5>
        <span class="doc">Normas Generales — supervisión de la gestión financiera</span>
        Los <b>Estados Financieros Auditados</b> se presentan <b>dentro de los 120 días siguientes al cierre de
        cada ejercicio fiscal del Proyecto</b> y <b>dentro de los 120 días siguientes a la fecha del último
        desembolso</b>. El plazo puede extenderse a <b>180 días</b> cuando se usan los sistemas de gestión
        financiera del país con ciclos de reporte distintos que satisfagan al Banco (OP-273-12 ¶8.3).<br>
        La auditoría la realiza un <b>auditor externo previamente aceptado por el Banco</b> o una Entidad
        Fiscalizadora Superior aceptada, con <b>TDR previamente acordados</b> que definen tipo, oportunidad y
        alcance de la revisión, bajo NIA/IFAC, INTOSAI o normas nacionales aceptables.<br>
        ${tarde
          ? `<b>Situación crítica.</b> El incumplimiento en la presentación de los informes de auditoría externa
             <b>conduce a la suspensión de los desembolsos</b> mediante un proceso automatizado (OP-273-12 ¶8.6).
             Se puede solicitar <b>dispensa</b> al Especialista en Gestión Financiera; la prórroga formal solo
             aplica a cooperaciones técnicas e inversión no reembolsable, con un máximo de 60 días por ejercicio.
             Priorizamos el expediente que sustente esa gestión.`
          : `El incumplimiento del plazo <b>conduce a la suspensión automática de los desembolsos</b>, así que el
             trabajo se planifica hacia atrás desde la fecha de corte.`}
        <br>Recuerda además que a la Fecha de Cierre debes <b>retener y contabilizar fondos suficientes para los
        honorarios de auditoría y las evaluaciones ex post</b> financiadas con recursos del Banco, y que la
        documentación de contratos bajo revisión ex post se conserva <b>tres años desde el último desembolso</b>.` };
    },
    fields: [
      { key: "producto", label: "Qué necesitas", type: "select", options: [
        { label: "TDR de auditoría externa para acordar con el Banco", value: "tdr", factor: 1.0, days: 0 },
        { label: "Respuesta a observaciones del auditor o del Banco", value: "obs", factor: 1.29, days: 3 },
        { label: "Preparación del EFA: cierre, conciliaciones y expediente para el auditor", value: "efa", factor: 1.43, days: 9 },
        { label: "Revisión ex post preventiva de expedientes de adquisiciones", value: "expost", factor: 1.86, days: 15 },
        { label: "Paquete completo de cierre del ejercicio", value: "full", factor: 2.43, days: 19 } ]},
      { key: "situacion", label: "Situación del plazo", type: "select", options: [
        { label: "Dentro de plazo", value: "ok", factor: 1.0, days: 3 },
        { label: "Plazo vencido o desembolsos ya suspendidos", value: "vencido", factor: 1.45, days: 0 } ]}
    ]
  },

  bidsalvaguardias: { alcance: "multilateral",
    tag: "BID · Salvaguardias", icon: '<svg class="ic" aria-hidden="true"><use href="#i-leaf"/></svg>',
    name: "Salvaguardias ambientales y sociales (MPAS)",
    short: "Sistema de Gestión Ambiental y Social, PGAS, especificaciones en pliegos e informe semestral de cumplimiento.",
    base: 7100, baseDays: 9,
    insumos: [
      "Clasificación ambiental y social de la operación (Categoría A, B o C)",
      "Análisis o Evaluación de Impacto Ambiental y Social disponible",
      "Plan de Gestión Ambiental y Social vigente, si existe",
      "Documentos de licitación en los que deban insertarse las especificaciones",
      "Registro de partes interesadas y del mecanismo de reclamación"
    ],
    miniInsumos: ["Categoría A / B / C", "EIAS o PGAS existente", "Partes interesadas"],
    kw: ["bid", "salvaguardias", "mpas", "espf", "ndas", "esps", "ambiental", "social", "sgas", "pgas", "esmp", "eias", "esia", "reasentamiento", "pueblos indígenas", "género", "partes interesadas", "mecanismo de reclamación", "categoría b"],
    note(v) {
      const cat = v.categoria;
      return { cls: cat === "a" ? "warn" : "", html: `<h5>Marco aplicable</h5>
        <span class="doc">MPAS · vigente desde 31.10.2021</span>
        El <b>Marco de Política Ambiental y Social</b> (ESPF) rige desde el <b>31 de octubre de 2021</b> y se
        compone de una Declaración de Política y <b>10 Normas de Desempeño Ambiental y Social (NDAS)</b>:
        evaluación y gestión de riesgos, trabajo y condiciones laborales, eficiencia de recursos y contaminación,
        salud y seguridad de la comunidad, reasentamiento involuntario, biodiversidad, pueblos indígenas,
        patrimonio cultural, <b>igualdad de género</b> y participación de partes interesadas.<br>
        La <b>NDAS 1</b> impone la obligación nuclear: establecer y mantener un <b>Sistema de Gestión Ambiental y
        Social (SGAS)</b> iniciado y liderado por el organismo ejecutor, con jerarquía de mitigación,
        participación continua de las partes interesadas y un <b>mecanismo de reclamación a nivel de proyecto</b>.<br>
        ${cat === "c"
          ? `Para <b>Categoría C</b> corresponden la Ficha Ambiental y Social, los lineamientos del PGAS y las
             <b>especificaciones técnicas ambientales y sociales en los pliegos</b>.`
          : cat === "b"
          ? `Para <b>Categoría B</b> corresponden la Evaluación de Impacto Ambiental y Social, los lineamientos del
             PGAS, el Plan de Consulta Pública Significativa con su realización efectiva, y las
             <b>especificaciones técnicas ambientales y sociales en los pliegos</b>.`
          : `<b>Categoría A.</b> Exige EIAS completa y PGAS, y en muchos programas queda excluida de elegibilidad.
             Confirma la clasificación con el Banco antes de avanzar: el alcance y el equipo cambian por completo.`}
        <br>El <b>informe de cumplimiento ambiental y social</b> es generalmente <b>semestral</b> y se sincroniza
        con el ISP; su fecha exacta la fija cada Contrato de Préstamo. Las inspecciones se evalúan contra
        <b>evidencia objetiva</b> de cumplimiento del PGAS —no contra lo planificado ni lo "próximo a resolver"—
        y generan un listado de no conformidades.<br>
        Si tu operación se aprobó <b>después de noviembre de 2021</b>, debes usar la versión de los documentos
        estándar de licitación <b>adaptada al ESPF</b>.
        <br><b>Alcance de este servicio:</b> preparamos instrumentos de gestión, especificaciones para pliegos e
        informes de cumplimiento. La <b>EIAS y los estudios ambientales que exigen habilitación profesional o
        registro ante la autoridad ambiental</b> los firma un especialista habilitado; te decimos desde el inicio
        qué parte requiere ese perfil.` };
    },
    fields: [
      { key: "categoria", label: "Clasificación de impacto de la operación", type: "select", options: [
        { label: "Categoría C (impacto mínimo o nulo)", value: "c", factor: 1.0, days: 0 },
        { label: "Categoría B (impacto moderado y localizado)", value: "b", factor: 1.33, days: 6 },
        { label: "Aún sin clasificar", value: "sc", factor: 1.47, days: 9 },
        { label: "Categoría A (impacto significativo)", value: "a", factor: 2.13, days: 18 } ]},
      { key: "producto", label: "Qué necesitas", type: "select", options: [
        { label: "Especificaciones técnicas ambientales y sociales para pliegos", value: "etas", factor: 1.0, days: 0 },
        { label: "Informe semestral de cumplimiento ambiental y social", value: "informe", factor: 1.21, days: 3 },
        { label: "Mecanismo de reclamación y plan de partes interesadas (NDAS 10)", value: "ndas10", factor: 1.36, days: 5 },
        { label: "Plan de Gestión Ambiental y Social (PGAS) o sus lineamientos", value: "pgas", factor: 1.57, days: 10 },
        { label: "Diseño del Sistema de Gestión Ambiental y Social (SGAS)", value: "sgas", factor: 1.79, days: 13 } ]}
    ]
  },

  bidunidadejecutora: { alcance: "multilateral",
    tag: "BID · Unidad ejecutora", icon: '<svg class="ic" aria-hidden="true"><use href="#i-compass"/></svg>',
    name: "Puesta en marcha y fortalecimiento de la unidad ejecutora",
    short: "Manual Operativo, condiciones previas al primer desembolso, elegibilidad y plan de ejecutabilidad.",
    base: 9500, baseDays: 18,
    insumos: [
      "Contrato de Préstamo y Propuesta de Préstamo con su anexo fiduciario",
      "Estructura orgánica y dotación actual de la unidad ejecutora",
      "Manual Operativo vigente, si existe",
      "Estado de cumplimiento de las condiciones previas del Art. 4.01",
      "Ejecución financiera acumulada y proyección de desembolsos"
    ],
    miniInsumos: ["Contrato y anexo fiduciario", "Estructura de la UE", "Ejecución acumulada"],
    kw: ["bid", "unidad ejecutora", "organismo ejecutor", "manual operativo", "mop", "condiciones previas", "primer desembolso", "elegibilidad", "artículo 4.01", "taller de arranque", "convergence", "plan de ejecutabilidad", "ejecutabilidad", "cartera", "pm4r", "gobernanza del proyecto"],
    note(v) {
      const rescate = v.momento === "rescate";
      return { cls: rescate ? "warn" : "", html: `<h5>Base contractual</h5>
        <span class="doc">Normas Generales, Art. 4.01 y 4.02</span>
        Antes del primer desembolso el ejecutor debe acreditar: <b>informe jurídico fundado</b> sobre la validez y
        exigibilidad de las obligaciones; <b>designación de los funcionarios facultados</b> para solicitar
        desembolsos con sus firmas autenticadas; <b>información de la cuenta bancaria</b> donde se depositarán los
        recursos (o su registro en la Cuenta Única de Tesorería); y la demostración de contar con un
        <b>sistema de información financiera y una estructura de control interno adecuados</b>. A ello se suman las
        condiciones especiales de las Estipulaciones Especiales.<br>
        <b>El reloj corre:</b> si dentro de <b>180 días</b> desde la entrada en vigencia no se cumplen esas
        condiciones, el Banco <b>podrá poner término al contrato</b>.<br>
        ${v.momento === "arranque"
          ? `El <b>taller de arranque</b> conviene realizarlo cuando la operación está próxima a obtener la
             elegibilidad: la planificación inicial <b>no puede modificarse en Convergence pasados 40 días</b>
             desde la elegibilidad, así que las metas físicas y financieras con las que arranques te acompañarán
             todo el proyecto.`
          : rescate
          ? `<b>Cartera en riesgo.</b> Cuando el desembolso va por debajo de la meta, el trabajo real no es
             administrativo sino de <b>ruta crítica</b>: identificar qué procesos pueden comprometerse en el
             ejercicio, cuáles deben reprogramarse y qué requiere no objeción con anticipación. Eso es el
             <b>Plan de Ejecutabilidad</b>.`
          : `El <b>Manual Operativo</b> es el instrumento que define responsabilidades, flujos y plazos internos.
             Cuando está sobrecargado de gobernanzas y firmas, el cuello de botella deja de ser el Banco y pasa a
             ser la propia entidad.`}` };
    },
    fields: [
      { key: "momento", label: "Momento de la operación", type: "select", options: [
        { label: "En ejecución: fortalecimiento y ordenamiento", value: "ejecucion", factor: 1.0, days: 0 },
        { label: "Antes de la elegibilidad: puesta en marcha", value: "arranque", factor: 1.11, days: 5 },
        { label: "Cartera en riesgo: bajo desembolso o plazo por vencer", value: "rescate", factor: 1.44, days: 11 } ]},
      { key: "alcance", label: "Alcance", type: "select", options: [
        { label: "Condiciones previas al primer desembolso (Art. 4.01)", value: "cp", factor: 1.0, days: 0 },
        { label: "Manual Operativo del Proyecto (MOP)", value: "mop", factor: 1.54, days: 12 },
        { label: "Plan de Ejecutabilidad con ruta crítica y programación de no objeciones", value: "pe", factor: 1.77, days: 15 },
        { label: "Paquete integral de puesta en marcha", value: "full", factor: 2.46, days: 27 } ]}
    ]
  },
  defensa: { alcance: "nacional",
    soon: true, tag: "Derecho administrativo", icon: '<svg class="ic" aria-hidden="true"><use href="#i-shield"/></svg>',
    name: "Defensa en controversias y arbitrajes con el Estado",
    short: "Estrategia y elaboración de escritos en controversias contractuales y arbitrajes ante el Estado.",
    base: 4800, baseDays: 14,
    insumos: ["Contrato y adendas", "Documentos de la controversia", "Cronograma y plazos vigentes", "Comunicaciones y antecedentes"],
    miniInsumos: ["Contrato y adendas", "Documentos de la controversia", "Plazos vigentes"],
    kw: ["arbitraje", "controversia", "contrato", "conciliación", "laudo", "demanda", "contractual"],
    note() { return { cls: "", html: `<h5>Servicio en incorporación</h5><span class="doc">Estrategia + escritos</span> Apoyo legal especializado; los actos procesales y la representación los asume el abogado patrocinante del cliente.` }; },
    fields: [
      { key: "etapa", label: "Etapa", type: "select", options: [
        { label: "Conciliación / trato directo", value: "con", factor: 0.8, days: -3 },
        { label: "Arbitraje", value: "arb", factor: 1.0, days: 0 },
        { label: "Ejecución / anulación de laudo", value: "eje", factor: 1.3, days: 4 } ]},
      { key: "cuantia", label: "Cuantía de la controversia", type: "select", options: [
        { label: "Hasta S/ 500 mil", value: "a", factor: 1.0, days: 0 },
        { label: "S/ 500 mil – S/ 2 M", value: "b", factor: 1.5, days: 5 },
        { label: "Más de S/ 2 M", value: "c", factor: 2.2, days: 10 } ]}
    ]
  },
  duediligence: { alcance: "nacional",
    soon: true, tag: "Inversión privada", icon: '<svg class="ic" aria-hidden="true"><use href="#i-users"/></svg>',
    name: "Due diligence legal-regulatorio para APP y Obras por Impuestos",
    short: "Revisión integral de viabilidad legal y regulatoria para Asociaciones Público-Privadas y OxI.",
    base: 6500, baseDays: 18,
    insumos: ["Información del proyecto", "Documentación legal disponible", "Marco regulatorio del sector", "Estructura financiera preliminar"],
    miniInsumos: ["Información del proyecto", "Documentación legal", "Marco del sector"],
    kw: ["app", "obras por impuestos", "oxi", "due diligence", "viabilidad", "saneamiento", "proinversión"],
    note() { return { cls: "", html: `<h5>Servicio en incorporación</h5><span class="doc">Due diligence</span> Revisión de viabilidad legal, regulatoria y de riesgos para APP / Obras por Impuestos.` }; },
    fields: [
      { key: "modalidad", label: "Modalidad", type: "select", options: [
        { label: "Obras por Impuestos (OxI)", value: "oxi", factor: 1.0, days: 0 },
        { label: "Asociación Público-Privada (APP)", value: "app", factor: 1.6, days: 8 } ]},
      { key: "alcance", label: "Alcance", type: "select", options: [
        { label: "Revisión focalizada", value: "foc", factor: 0.85, days: -3 },
        { label: "Integral", value: "int", factor: 1.0, days: 0 } ]}
    ]
  },
  osce: { alcance: "nacional",
    soon: true, tag: "Control & sanción", icon: '<svg class="ic" aria-hidden="true"><use href="#i-shield"/></svg>',
    name: "Asistencia en procedimientos ante el OECE y la Contraloría",
    short: "Descargos y respuestas en procedimientos sancionadores y observaciones de control.",
    base: 3200, baseDays: 10,
    insumos: ["Notificación / imputación o informe de control", "Documentación del procedimiento", "Plazos y cronograma", "Antecedentes"],
    miniInsumos: ["Notificación / imputación", "Documentación", "Plazos"],
    kw: ["oece", "osce", "ley 32069", "contraloría", "sancionador", "descargos", "tribunal", "inhabilitación", "observaciones"],
    note() { return { cls: "", html: `<h5>Servicio en incorporación</h5><span class="doc">Descargos / defensa</span> Apoyo en procedimientos ante el OECE (Ley N.° 32069) y observaciones de Contraloría; el patrocinio formal lo asume el abogado del cliente.` }; },
    fields: [
      { key: "ente", label: "Entidad", type: "select", options: [
        { label: "OECE (Tribunal / sancionador)", value: "oece", factor: 1.0, days: 0 },
        { label: "Contraloría (observaciones)", value: "cgr", factor: 1.1, days: 2 } ]},
      { key: "urg", label: "Plazo", type: "select", options: [
        { label: "Estándar", value: "std", factor: 1.0, days: 0 },
        { label: "Urgente (plazo perentorio)", value: "urg", factor: 1.4, days: -4 } ]}
    ]
  },
  alertas: { alcance: "nacional",
    soon: true, tag: "Monitoreo con IA", icon: '<svg class="ic" aria-hidden="true"><use href="#i-bell"/></svg>',
    name: "Sistema de alertas normativas (El Peruano) con IA",
    short: "Monitoreo automatizado de normas publicadas y alertas personalizadas por sector y entidad.",
    base: 900, baseDays: 5,
    insumos: ["Sectores y temas de interés", "Entidad(es) a monitorear", "Correos para las alertas"],
    miniInsumos: ["Sectores de interés", "Entidades", "Correos"],
    kw: ["alertas", "el peruano", "monitoreo", "normas", "suscripción", "normativa"],
    note() { return { cls: "", html: `<h5>Servicio en incorporación · suscripción</h5><span class="doc">Monitoreo mensual</span> Alertas normativas automatizadas, filtradas por sector y entidad. Precio referencial mensual.` }; },
    fields: [
      { key: "plan", label: "Cobertura", type: "select", options: [
        { label: "1 sector", value: "1", factor: 1.0, days: 0 },
        { label: "Hasta 3 sectores", value: "3", factor: 1.6, days: 0 },
        { label: "Multisectorial", value: "m", factor: 2.4, days: 0 } ]},
      { key: "usuarios", label: "N.° de destinatarios", type: "number", included: 3, perUnit: 60, min: 1, max: 200, days: 0, unitLabel: "destinatario adicional" }
    ]
  },
  tableros: { alcance: "regional",
    soon: true, tag: "Inteligencia de datos", icon: '<svg class="ic" aria-hidden="true"><use href="#i-trend"/></svg>',
    name: "Tableros de inteligencia de inversión pública",
    short: "Dashboards de avance físico-financiero de la cartera de inversiones de la entidad.",
    base: 5200, baseDays: 15,
    insumos: ["Cartera de inversiones / CUI", "Reportes de avance (SIAF / formatos)", "Indicadores deseados"],
    miniInsumos: ["Cartera de inversiones", "Reportes de avance", "Indicadores"],
    kw: ["tablero", "dashboard", "bi", "inversión pública", "cartera", "avance", "power bi"],
    note() { return { cls: "", html: `<h5>Servicio en incorporación</h5><span class="doc">Tablero interactivo</span> Visualización del avance físico-financiero con semáforos y alertas.` }; },
    fields: [
      { key: "alcance", label: "Alcance de la cartera", type: "select", options: [
        { label: "Hasta 20 inversiones", value: "a", factor: 1.0, days: 0 },
        { label: "20 – 100 inversiones", value: "b", factor: 1.5, days: 6 },
        { label: "Más de 100", value: "c", factor: 2.2, days: 12 } ]},
      { key: "actualizacion", label: "Actualización", type: "select", options: [
        { label: "Entrega única", value: "u", factor: 1.0, days: 0 },
        { label: "Mantenimiento mensual", value: "m", factor: 1.4, days: 0 } ]}
    ]
  },
  capacitacion: { alcance: "regional",
    soon: true, tag: "Capacitación", icon: '<svg class="ic" aria-hidden="true"><use href="#i-cap"/></svg>',
    name: "Capacitación y certificación en contrataciones del Estado",
    short: "Programas a medida para comités de selección y áreas usuarias, con casos prácticos.",
    base: 2800, baseDays: 9,
    insumos: ["Tema y objetivos de la capacitación", "N.° de participantes", "Modalidad (virtual / presencial)"],
    miniInsumos: ["Tema y objetivos", "N.° de participantes", "Modalidad"],
    kw: ["capacitación", "certificación", "curso", "taller", "contrataciones", "formación"],
    note() { return { cls: "", html: `<h5>Servicio en incorporación</h5><span class="doc">Programa a medida</span> Capacitación con casos prácticos y evaluación; opción de certificación.` }; },
    fields: [
      { key: "modalidad", label: "Modalidad", type: "select", options: [
        { label: "Virtual", value: "vir", factor: 1.0, days: 0 },
        { label: "Presencial", value: "pre", factor: 1.4, days: 3 } ]},
      { key: "participantes", label: "N.° de participantes", type: "number", included: 20, perUnit: 35, min: 1, max: 500, days: 0, unitLabel: "participante adicional" }
    ]
  }
};

/* ---------- Servicios próximamente ---------- */
const FUTURE = [
  { area: "Derecho administrativo", name: "Defensa en controversias y arbitrajes con el Estado", desc: "Estrategia y elaboración de escritos en controversias contractuales y arbitrajes ante el Estado." },
  { area: "Inversión privada", name: "Due diligence legal-regulatorio para APP y Obras por Impuestos", desc: "Revisión integral de viabilidad legal y regulatoria para Asociaciones Público-Privadas y OxI." },
  { area: "Control & sanción", name: "Asistencia en procedimientos ante el OECE y la Contraloría", desc: "Apoyo en procedimientos sancionadores, descargos y respuestas a observaciones de control." },
  { area: "Monitoreo con IA", name: "Sistema de alertas normativas (El Peruano) con IA", desc: "Monitoreo automatizado de normas publicadas y alertas personalizadas por sector y entidad." },
  { area: "Inteligencia de datos", name: "Tableros de inteligencia de inversión pública", desc: "Dashboards de avance físico-financiero de la cartera de inversiones de la entidad." },
  { area: "Capacitación", name: "Capacitación y certificación en contrataciones del Estado", desc: "Programas a medida para comités de selección y áreas usuarias, con casos prácticos." }
];

/* ---------- Hitos de trazabilidad ---------- */
const STAGES = [
  { h: "Pedido recibido", d: "Confirmamos tu pago y registramos el servicio." },
  { h: "Validación de insumos", d: "Revisamos que la documentación esté completa y conforme." },
  { h: "Análisis y diagnóstico", d: "Procesamiento con IA y análisis del especialista." },
  { h: "Elaboración del entregable", d: "Redacción y construcción del producto técnico." },
  { h: "Control de calidad", d: "Revisión normativa y validación profesional final." },
  { h: "Entrega final", d: "Enviamos el producto a tu correo." }
];

/* ---------- Equipo de agentes (simulación) ---------- */
const AGENTS = [
  { icon: "🤖", name: "Agente de Datos & IA", role: "Ingesta y análisis documental",
    logs: ["Procesando los archivos recibidos…", "Extrayendo datos clave (OCR + NLP)…", "Estructurando la información base…", "Clasificando insumos por componente…"] },
  { icon: "⚖️", name: "Agente Legal", role: "Marco normativo y cumplimiento",
    logs: ["Verificando la normativa vigente…", "Cruzando las directivas aplicables…", "Sustentando la base legal…", "Revisando requisitos formales…"] },
  { icon: "📐", name: "Agente Técnico", role: "Ingeniería y especificaciones",
    logs: ["Estructurando especificaciones técnicas…", "Dimensionando los componentes…", "Redactando la memoria descriptiva…", "Consolidando metrados…"] },
  { icon: "📊", name: "Agente Financiero", role: "Presupuesto y costos",
    logs: ["Calculando el presupuesto…", "Cotizando precios unitarios…", "Validando la estructura de costos…", "Armando el cronograma financiero…"] },
  { icon: "🛡️", name: "Auditor de Calidad", role: "Validación y control de calidad",
    logs: ["Auditando la consistencia entre componentes…", "Verificando el cumplimiento normativo…", "Aplicando el control de calidad…", "Consolidando observaciones finales…"], audit: true }
];
const INTAKE_DOCS = [
  { icon: "📕", label: "Estudio / ficha.pdf" }, { icon: "📗", label: "Presupuesto.xlsx" },
  { icon: "📘", label: "Antecedentes.docx" }, { icon: "📐", label: "Planos.dwg" }, { icon: "🗜️", label: "Anexos.zip" }
];

/* ---------- UIT y contratación directa (≤ 8 UIT) ---------- */
const UIT = 5500;            // UIT 2026 (D.S. 301-2025-EF)
const MAX_OS = 8 * UIT;      // S/ 44,000 — tope de contratación directa por Orden de Servicio

/* ---------- Equipos de agentes especializados por servicio ---------- */
const QA = { icon: "🛡️", name: "Auditor de Calidad", role: "Validación y control de calidad",
  logs: ["Auditando consistencia entre componentes…", "Verificando cumplimiento normativo…", "Aplicando control de calidad final…"], audit: true };
const IA_DOC = { icon: "🤖", name: "Agente de Datos & IA", role: "Ingesta y análisis documental",
  logs: ["Procesando los archivos recibidos…", "Extrayendo datos clave (OCR + NLP)…", "Estructurando la información base…"] };
const AGENTS_BY_SERVICE = {
  expediente: [IA_DOC,
    { icon: "🏗️", name: "Agente de Ingeniería", role: "Especificaciones y metrados", logs: ["Estructurando especificaciones técnicas…", "Consolidando metrados…", "Redactando memoria descriptiva…"] },
    { icon: "💰", name: "Agente de Costos", role: "Presupuesto y APU", logs: ["Calculando análisis de precios unitarios…", "Armando el presupuesto…", "Verificando insumos y rendimientos…"] },
    { icon: "⚖️", name: "Agente Invierte.pe", role: "Encuadre normativo PI/IOARR", logs: ["Verificando directivas del MEF…", "Validando PI vs IOARR / documento equivalente…", "Cruzando el Banco de Inversiones…"] }, QA],
  politicas: [IA_DOC,
    { icon: "🏛️", name: "Analista de Políticas", role: "Diseño y lineamientos", logs: ["Estructurando objetivos prioritarios…", "Redactando lineamientos…", "Alineando con CEPLAN…"] },
    { icon: "📈", name: "Agente de Evidencia", role: "Diagnóstico y datos", logs: ["Procesando línea base…", "Analizando evidencia disponible…", "Construyendo indicadores…"] },
    { icon: "⚖️", name: "Agente Legal", role: "Competencias y marco normativo", logs: ["Verificando competencias de la entidad…", "Cruzando el marco normativo…", "Sustentando la base legal…"] }, QA],
  regulatorio: [IA_DOC,
    { icon: "⚖️", name: "Abogado Regulatorio", role: "Opinión legal y cumplimiento", logs: ["Analizando la norma…", "Identificando riesgos legales…", "Redactando la opinión…"] },
    { icon: "🔬", name: "Analista de Impacto (AIR)", role: "Análisis de impacto regulatorio", logs: ["Evaluando alternativas regulatorias…", "Estimando costos y beneficios…", "Midiendo impacto…"] },
    { icon: "🌐", name: "Agente de Benchmarking", role: "Comparado normativo", logs: ["Comparando normativa nacional e internacional…", "Sistematizando hallazgos…"] }, QA],
  financiera: [IA_DOC,
    { icon: "📊", name: "Analista Presupuestal", role: "Ejecución y PIM", logs: ["Analizando ejecución presupuestal…", "Cruzando PIM y metas…", "Detectando desviaciones…"] },
    { icon: "🗄️", name: "Especialista en Sistemas Financieros", role: "Datos financieros", logs: ["Procesando los reportes de ejecución…", "Conciliando devengados…", "Consolidando por unidad ejecutora…"] },
    { icon: "🏦", name: "Agente Multilateral", role: "BID / Banco Mundial", logs: ["Verificando marco del organismo…", "Alineando reportería multilateral…"] }, QA],
  evaluacion: [IA_DOC,
    { icon: "📋", name: "Especialista en Contrataciones", role: "Bases y admisión", logs: ["Revisando bases integradas…", "Verificando requisitos de calificación…", "Ordenando expedientes de postores…"] },
    { icon: "🔧", name: "Evaluador Técnico", role: "Propuestas técnicas", logs: ["Evaluando propuestas técnicas…", "Asignando puntajes por criterio…"] },
    { icon: "💵", name: "Evaluador Económico", role: "Propuestas económicas", logs: ["Calificando ofertas económicas…", "Construyendo el cuadro comparativo…"] }, QA],
  defensa: [IA_DOC,
    { icon: "⚖️", name: "Abogado en Arbitraje", role: "Controversias con el Estado", logs: ["Analizando la controversia…", "Construyendo la estrategia…", "Redactando escritos…"] },
    { icon: "📑", name: "Analista Contractual", role: "Contrato y adendas", logs: ["Revisando el contrato y adendas…", "Identificando incumplimientos…"] },
    { icon: "🔎", name: "Estrategia Probatoria", role: "Medios de prueba", logs: ["Organizando medios probatorios…", "Mapeando antecedentes…"] }, QA],
  duediligence: [IA_DOC,
    { icon: "⚖️", name: "Legal APP/OxI", role: "Viabilidad legal", logs: ["Revisando viabilidad legal APP/OxI…", "Verificando saneamiento…"] },
    { icon: "💰", name: "Agente Financiero", role: "Riesgos y estructura", logs: ["Evaluando estructura financiera…", "Identificando riesgos…"] },
    { icon: "🌐", name: "Regulatorio Sectorial", role: "Marco del sector", logs: ["Cruzando marco regulatorio sectorial…", "Verificando autorizaciones…"] }, QA],
  osce: [IA_DOC,
    { icon: "⚖️", name: "Abogado Sancionador", role: "Descargos y defensa", logs: ["Analizando la imputación…", "Redactando descargos…"] },
    { icon: "📋", name: "Especialista OECE", role: "Procedimientos OECE", logs: ["Revisando el expediente OECE…", "Verificando plazos…"] },
    { icon: "🏛️", name: "Especialista Contraloría", role: "Observaciones de control", logs: ["Atendiendo observaciones de control…", "Sustentando descargos…"] }, QA],
  alertas: [{ icon: "📡", name: "Agente Monitor", role: "Monitoreo de El Peruano", logs: ["Monitoreando publicaciones…", "Detectando normas relevantes…"] },
    { icon: "🏷️", name: "Clasificador Normativo", role: "Etiquetado por sector", logs: ["Clasificando por sector y entidad…", "Filtrando relevancia…"] },
    { icon: "📈", name: "Analista Sectorial", role: "Impacto en tu entidad", logs: ["Evaluando impacto…", "Priorizando alertas…"] },
    { icon: "✉️", name: "Curador de Alertas", role: "Resumen y envío", logs: ["Redactando el resumen ejecutivo…", "Preparando el envío…"] }, QA],
  tableros: [IA_DOC,
    { icon: "📊", name: "Analista BI", role: "Modelado de datos", logs: ["Modelando los datos…", "Construyendo indicadores…"] },
    { icon: "🗄️", name: "Especialista Presupuestal", role: "Avance físico-financiero", logs: ["Procesando avance físico-financiero…", "Calculando semáforos…"] },
    { icon: "🎨", name: "Visualización", role: "Tablero interactivo", logs: ["Diseñando el tablero…", "Publicando vistas…"] }, QA],
  capacitacion: [IA_DOC,
    { icon: "🎓", name: "Diseñador Instruccional", role: "Programa y materiales", logs: ["Diseñando el programa…", "Elaborando materiales y casos…"] },
    { icon: "📋", name: "Especialista en Contrataciones", role: "Contenido técnico", logs: ["Estructurando el contenido técnico…", "Actualizando con normativa vigente…"] },
    { icon: "✅", name: "Evaluación", role: "Certificación", logs: ["Diseñando la evaluación…", "Preparando la certificación…"] }, QA]
};
/* Los seis servicios de la línea BID caían en el equipo genérico, cuyo perfil
   es el de un expediente técnico. Se les da un equipo fiduciario propio: es lo
   que un especialista del Banco espera ver, y es el equipo que mira TODO
   comprador fuera del Perú. */
const AGENTS_BID = [IA_DOC,
  { icon: "🏦", name: "Especialista Fiduciario", role: "Adquisiciones y gestión financiera",
    logs: ["Cotejando con GN-2349-15 y GN-2350-15…", "Revisando el anexo fiduciario del contrato…", "Verificando la elegibilidad del gasto…", "Conciliando con la OP-273-12…"] },
  { icon: "📈", name: "Especialista en Monitoreo", role: "PEP, POA y Matriz de Resultados",
    logs: ["Alineando productos con la Matriz de Resultados…", "Actualizando el POA del ejercicio…", "Recalculando el avance físico-financiero…"] },
  { icon: "🌱", name: "Especialista Ambiental y Social", role: "Salvaguardias (MPAS)",
    logs: ["Clasificando el riesgo conforme al MPAS…", "Revisando las NDAS aplicables…", "Verificando el plan de gestión ambiental y social…"] },
  QA];

function agentsFor(key) {
  if (AGENTS_BY_SERVICE[key]) return AGENTS_BY_SERVICE[key];
  if (String(key).indexOf("bid") === 0) return AGENTS_BID;
  return AGENTS;
}
/* progreso objetivo de cada agente según la etapa [ia, legal, tec, fin, auditor] */
const AGENT_TARGETS = {
  0: [12, 5, 4, 3, 0], 1: [65, 22, 16, 13, 6], 2: [92, 56, 50, 46, 22],
  3: [100, 82, 78, 72, 42], 4: [100, 96, 95, 93, 74], 5: [100, 100, 100, 100, 100]
};

/* ---------- Velocidades de entrega ---------- */
const SPEED = [
  { id: "std", label: "Estándar", factor: 1.0, addPct: 0 },
  { id: "pri", label: "Prioritario", factor: 0.7, addPct: 0.25 },
  { id: "exp", label: "Express", factor: 0.5, addPct: 0.5 }
];
function addBizDays(from, n) {
  const d = new Date(from); let added = 0;
  while (added < n) { d.setDate(d.getDate() + 1); const w = d.getDay(); if (w !== 0 && w !== 6) added++; }
  return d;
}
function fmtDate(d) { return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }); }

function agentCardHTML(a, i, t) {
  let cls = "s-wait", lab = "En espera", wk = "";
  if (t >= 100) { cls = "s-done"; lab = "Listo"; wk = "done"; }
  else if (t > 0) { cls = "s-work"; lab = "Trabajando"; wk = "work"; }
  const log = t >= 100 ? "Componente validado y cerrado ✓" : a.logs[0];
  return `<div class="agent ${a.audit ? "audit " : ""}${wk}" data-ag="${i}">
    <div class="agent-h"><div class="agent-av">${a.icon}</div>
      <div><div class="agent-name">${a.name}</div><div class="agent-role">${a.role}</div></div>
      <span class="agent-stat ${cls}">${lab}</span></div>
    <div class="agent-bar"><i style="width:0%" data-tgt="${t}"></i></div>
    <div class="agent-log">${log}</div></div>`;
}

/* ---------- Pedidos de ejemplo (demo) ---------- */
const DEMO_ORDERS = {
  "ACI-DEMO": { code: "ACI-DEMO", serviceName: "Expediente Técnico (ejemplo)", serviceKey: "expediente", total: 18000, stage: 3, days: 25 },
  "ACI-2048": { code: "ACI-2048", serviceName: "Análisis Regulatorio (ejemplo)", serviceKey: "regulatorio", total: 6160, stage: 4, days: 10 }
};

/* ---------- Estado ---------- */
let current = null; // { key, values, price, days, breakdown }
let trackTimer = null, baseRemaining = 0, selSpeed = "std", curOrder = null, _opsAgents = AGENTS;

/* ============================================================
   RENDER: tarjetas de servicio
   ============================================================ */
function svcHaystack(s) {
  return [s.name, s.tag, s.short, ...(s.miniInsumos || []), ...(s.insumos || []), ...(s.kw || [])]
    .join(" ").toLowerCase();
}
function cardHTML(key, s) {
  return `<article class="svc">
      <div class="svc-top">
        <div class="svc-ico" aria-hidden="true">${s.icon}</div>
        <span class="svc-tag">${s.tag}</span>
        <h3>${s.name}</h3>
        <p>${s.short}</p>
        <ul class="insumos-mini">${s.miniInsumos.map(i => `<li>${i}</li>`).join("")}</ul>
      </div>
      <div class="svc-foot">
        <div class="svc-price">Desde<b>${PEN(s.base)}</b></div>
        <button class="btn btn-dark" data-svc="${key}">Cotizar</button>
      </div>
    </article>`;
}
/* Un servicio de alcance "nacional" está construido sobre el sistema de
   inversión pública y la ley de contrataciones del Perú. Mostrárselo a una
   entidad de otro país sería ofrecerle un producto que no le aplica, así que
   fuera del Perú se retira del grid y en su lugar aparece una tarjeta que
   ofrece cotizar la línea nacional de ESE país a medida. */
function aplicaEnPais(s) {
  if (!window.REGION) return true;
  return s.alcance !== "nacional" || REGION.esPeru();
}

function cardNacionalHTML() {
  const p = window.REGION ? REGION.pais.nombre : "tu país";
  return `<article class="svc svc-medida">
      <div class="svc-top">
        <div class="svc-ico" aria-hidden="true"><svg class="ic" aria-hidden="true"><use href="#i-compass"/></svg></div>
        <span class="svc-tag">Línea nacional · ${p}</span>
        <h3>Servicios sobre el marco nacional de ${p}</h3>
        <p>Los productos de inversión pública y contrataciones que ves para Perú están construidos sobre su
           normativa. Para ${p} los cotizamos a medida sobre su propio sistema, sin plantillas prestadas.</p>
        <ul class="insumos-mini"><li>Describe la necesidad</li><li>Precio y plazo en minutos</li><li>Propuesta formal por correo</li></ul>
      </div>
      <div class="svc-foot">
        <div class="svc-price">A medida<b>Cotización en minutos</b></div>
        <a class="btn btn-dark" href="#asistente">Describir la necesidad</a>
      </div>
    </article>`;
}

function renderServices(q = "") {
  const grid = $("#svcGrid");
  const term = (q || "").trim().toLowerCase();
  const words = term.split(/\s+/).filter(Boolean);
  const entries = Object.entries(SERVICES).filter(([k, s]) =>
    !k.startsWith("__") && !s.soon && aplicaEnPais(s) &&
    (!words.length || words.some(w => svcHaystack(s).includes(w))));
  const conMedida = !words.length && window.REGION && !REGION.esPeru();
  if (!entries.length) {
    grid.innerHTML = `<div class="no-results">No encontramos servicios para <b>"${q}"</b>.<br>
      Prueba con otra palabra o revisa la sección <a href="#proximamente">Próximamente</a>.</div>`;
  } else {
    grid.innerHTML = entries.map(([k, s]) => cardHTML(k, s)).join("") + (conMedida ? cardNacionalHTML() : "");
    $$("[data-svc]", grid).forEach(b => b.addEventListener("click", () => openService(b.dataset.svc)));
  }
  $("#svcCount").textContent = term ? `${entries.length} servicio(s) para “${q}”` : "";
}

function renderFuture() {
  const grid = $("#futureGrid");
  const soon = Object.entries(SERVICES).filter(([, s]) => s.soon && aplicaEnPais(s));
  grid.innerHTML = soon.map(([k, s]) => `
    <div class="future">
      <span class="soon">Próximamente</span>
      <h3>${s.name}</h3>
      <p>${s.short}</p>
      <div class="tag-area">${s.tag}</div>
      <button class="btn btn-ghost" data-soon="${k}">Cotizar</button>
    </div>`).join("");
  $$("[data-soon]", grid).forEach(b => b.addEventListener("click", () => openService(b.dataset.soon)));
}

/* ============================================================
   COTIZADOR CON IA — genera un servicio a medida desde texto libre
   ============================================================ */
const GEN_GENERIC_BASE = 2600, GEN_GENERIC_DAYS = 9;
const GEN_HARD = ["nacional", "multisectorial", "multianual", "integral", "complej", "auditor", "internacional",
  "multilateral", "varias", "varios", "múltiples", "multiples", "urgente", "express", "exhaustiv", "masivo",
  "cartera", "portafolio", "regional", "ministerio"];

function escapeH(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

function pickCategory(t) {
  let best = null, bestScore = 0;
  for (const [k, s] of Object.entries(SERVICES)) {
    if (k.startsWith("__")) continue;
    let score = 0;
    (s.kw || []).forEach(w => { if (t.includes(w)) score += 2; });
    [s.name, s.tag, ...(s.miniInsumos || [])].forEach(p =>
      p.toLowerCase().split(/[^a-záéíóúñ]+/).forEach(w => { if (w.length > 4 && t.includes(w)) score += 1; }));
    if (score > bestScore) { bestScore = score; best = k; }
  }
  return { key: best, score: bestScore };
}
function complexityOf(text) {
  const t = text.toLowerCase();
  let c = 1;
  GEN_HARD.forEach(w => { if (t.includes(w)) c += 0.16; });
  const nums = (text.match(/\d+/g) || []).map(Number).filter(n => n > 1 && n < 100000);
  if (nums.length) c += Math.min(0.7, Math.max(...nums) / 40);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  c += Math.min(0.45, words / 120);
  return Math.min(2.8, Math.max(0.8, c));
}
function shortTitle(text) {
  const clean = text.replace(/\s+/g, " ").trim().replace(/^(necesito|quiero|requiero|busco|solicito)\s+/i, "");
  const words = clean.split(" ");
  let t = words.slice(0, 9).join(" ");
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (words.length > 9) t += "…";
  return t;
}
function buildScope(baseSvc, comp) {
  const s = [];
  if (baseSvc) { s.push("Entregable alineado a: " + baseSvc.name); s.push(baseSvc.short); }
  else { s.push("Informe / entregable técnico-profesional a la medida de tu necesidad"); }
  s.push("Revisión normativa y sustento conforme a la regulación vigente");
  s.push("Procesamiento asistido con IA + validación de un especialista");
  if (comp > 1.6) s.push("Tratamiento de mayor complejidad: múltiples componentes y/o alcance ampliado");
  s.push("Entrega por correo con código de seguimiento y trazabilidad por hitos");
  s.push("Incluye una ronda de ajustes sobre observaciones al entregable");
  return s;
}
function generateLocally(text, opts = {}) {
  const t = text.toLowerCase();
  const cat = pickCategory(t);
  const comp = complexityOf(text);
  const baseSvc = cat.key ? SERVICES[cat.key] : null;
  const base = baseSvc ? baseSvc.base : GEN_GENERIC_BASE;
  let price = base * comp * (opts.factor || 1) * (1 + (opts.extraPct || 0));
  price = Math.max(900, Math.round(price / 50) * 50);
  const baseDays = baseSvc ? baseSvc.baseDays : GEN_GENERIC_DAYS;
  let days = Math.max(3, Math.round(baseDays * (0.7 + comp * 0.45) * (opts.daysFactor || 1)));
  const insumos = baseSvc ? baseSvc.insumos.slice(0, 4)
    : ["Documentación de respaldo disponible", "Marco normativo aplicable", "Antecedentes o datos del caso"];
  const scope = buildScope(baseSvc, comp);
  (opts.scopeExtras || []).forEach(s => scope.splice(Math.max(0, scope.length - 1), 0, s));
  return {
    name: "Servicio a medida: " + shortTitle(text),
    catLabel: baseSvc ? baseSvc.tag : "Servicio a medida",
    catIcon: baseSvc ? baseSvc.icon : "🧩",
    summary: (opts.summary || text).trim(), price, days,
    scope, insumos,
    confidence: cat.score >= 4 ? "alta" : cat.score >= 1 ? "media" : "exploratoria",
    source: "motor"
  };
}
async function generateService(text, opts = {}) {
  let gen = null;
  try {
    const r = await fetch("/api/generate", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ need: opts.summary || text })
    });
    if (r.ok) { const d = await r.json(); if (d && d.ok && d.price) gen = { ...d, summary: (opts.summary || text).trim(), source: "ia" }; }
  } catch (_) {}
  return gen || generateLocally(text, opts);
}

/* ---- Refinamiento del pedido (preguntas + sugerencias) ---- */
const REFINE_Q = [
  { id: "ambito", label: "¿Para qué ámbito es?", opts: [
    { label: "Gobierno local", v: "local", factor: 1.0, txt: "ámbito local" },
    { label: "Gobierno regional", v: "reg", factor: 1.25, txt: "ámbito regional" },
    { label: "Nacional / sectorial", v: "nac", factor: 1.5, txt: "ámbito nacional" },
    { label: "Unidad ejecutora de operación multilateral", v: "mul", factor: 1.6, txt: "unidad ejecutora de una operación con banca multilateral" },
    { label: "Consultor / empresa", v: "priv", factor: 0.95, txt: "cliente privado" }
  ]},
  { id: "urgencia", label: "¿Qué tan urgente es?", opts: [
    { label: "Estándar", v: "std", factor: 1.0, daysFactor: 1.0, txt: "plazo estándar" },
    { label: "Prioritario", v: "pri", factor: 1.2, daysFactor: 0.7, txt: "prioritario" },
    { label: "Urgente (72 h)", v: "exp", factor: 1.45, daysFactor: 0.5, txt: "urgente 72h" }
  ]},
  { id: "alcance", label: "¿Qué tan amplio es el alcance?", opts: [
    { label: "Puntual / acotado", v: "min", factor: 0.85, daysFactor: 0.85, txt: "alcance acotado" },
    { label: "Estándar", v: "std", factor: 1.0, daysFactor: 1.0, txt: "alcance estándar" },
    { label: "Integral / complejo", v: "max", factor: 1.4, daysFactor: 1.25, txt: "alcance integral" }
  ]}
];
const REFINE_SUG = [
  { label: "Análisis de riesgos", pct: 0.08, scope: "Incluye análisis de riesgos" },
  { label: "Base legal detallada", pct: 0.06, scope: "Incluye sustento legal detallado" },
  { label: "Matriz de indicadores", pct: 0.10, scope: "Incluye matriz de indicadores y seguimiento" },
  { label: "Cronograma de implementación", pct: 0.05, scope: "Incluye cronograma de implementación" },
  { label: "Presupuesto detallado", pct: 0.08, scope: "Incluye presupuesto detallado" },
  { label: "Editable + reunión de sustento", pct: 0.07, scope: "Incluye archivos editables y reunión de sustento" }
];

let aiText = "";
let refineState = { ambito: "local", urgencia: "std", alcance: "std", sug: [] };

function showRefine(text) {
  aiText = text;
  refineState = { ambito: "local", urgencia: "std", alcance: "std", sug: [] };
  const vague = text.trim().split(/\s+/).filter(Boolean).length < 12;
  $("#aiResult").innerHTML = `
    <div class="ai-refine">
      <h3>Afinemos tu pedido</h3>
      <p class="sub">Selecciona lo que aplique. Cuanto más claro el alcance, más precisa será la cotización.</p>
      <div class="ai-understood"><b>Lo que entendimos:</b> ${escapeH(text)}</div>
      ${vague ? `<div class="ai-vague">💡 Tu descripción es breve. Ayúdanos precisando <b>el objetivo, la entidad y el resultado esperado</b>; o usa las opciones de abajo para encuadrar el pedido.</div>` : ""}
      ${REFINE_Q.map(q => `
        <div class="rq" data-q="${q.id}">
          <span class="rq-label">${q.label}</span>
          <div class="rq-opts">${q.opts.map(o => `<button class="opt${refineState[q.id] === o.v ? " sel" : ""}" data-q="${q.id}" data-v="${o.v}">${o.label}</button>`).join("")}</div>
        </div>`).join("")}
      <div class="rq sug">
        <span class="rq-label">¿Agregar al alcance? <span class="opt-hint">(opcional · ajusta el precio)</span></span>
        <div class="rq-opts">${REFINE_SUG.map((s, i) => `<button class="opt" data-sug="${i}">${s.label}</button>`).join("")}</div>
      </div>
      <div class="ai-refine-actions">
        <button class="btn btn-primary btn-lg" id="aiDoGen">Generar cotización</button>
        <button class="btn btn-ghost" id="aiSkip">Omitir y generar ahora</button>
        <button class="btn btn-ghost" id="aiEditText">✏️ Editar texto</button>
      </div>
    </div>`;
  // selección de preguntas (single) y sugerencias (multi)
  $$('#aiResult .opt[data-q]').forEach(b => b.addEventListener("click", () => {
    refineState[b.dataset.q] = b.dataset.v;
    $$(`#aiResult .opt[data-q="${b.dataset.q}"]`).forEach(x => x.classList.toggle("sel", x === b));
  }));
  $$('#aiResult .opt[data-sug]').forEach(b => b.addEventListener("click", () => {
    const i = +b.dataset.sug, k = refineState.sug.indexOf(i);
    if (k >= 0) refineState.sug.splice(k, 1); else refineState.sug.push(i);
    b.classList.toggle("sel");
  }));
  $("#aiDoGen").addEventListener("click", () => doGenerate(false));
  $("#aiSkip").addEventListener("click", () => doGenerate(true));
  $("#aiEditText").addEventListener("click", () => { $("#aiResult").innerHTML = ""; $("#aiNeed").focus(); });
  const ar = $("#aiResult"); if (ar.scrollIntoView) ar.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function collectRefine() {
  let factor = 1, daysFactor = 1, extraPct = 0;
  const tags = [], scopeExtras = [];
  REFINE_Q.forEach(q => {
    const o = q.opts.find(x => x.v === refineState[q.id]);
    if (o) { factor *= (o.factor || 1); daysFactor *= (o.daysFactor || 1); tags.push(o.txt); }
  });
  refineState.sug.forEach(i => { extraPct += REFINE_SUG[i].pct; scopeExtras.push(REFINE_SUG[i].scope); });
  const summary = aiText.trim() + " · " + tags.join(" · ") + (scopeExtras.length ? " · " + scopeExtras.join("; ") : "");
  return { factor, daysFactor, extraPct, scopeExtras, summary };
}

async function doGenerate(skip) {
  const opts = skip ? {} : collectRefine();
  $("#aiResult").innerHTML = "";
  $("#aiLoading").hidden = false;
  await sleep(700);
  const gen = await generateService(aiText, opts);
  $("#aiLoading").hidden = true;
  renderGen(gen);
}

let lastGen = null;
function runAI() {
  const text = $("#aiNeed").value.trim();
  if (text.length < 8) { $("#aiNeed").focus(); return shake("#aiNeed"); }
  showRefine(text);
}
function renderGen(gen) {
  lastGen = gen;
  const conf = gen.confidence === "alta" ? "Coincidencia clara con nuestra especialidad."
    : gen.confidence === "media" ? "Se relaciona con nuestros servicios; afinaremos el alcance contigo."
    : "Necesidad poco común: la tomamos como servicio exploratorio a medida.";
  $("#aiResult").innerHTML = `
    <div class="ai-result">
      <span class="ai-cat">${gen.catIcon} ${escapeH(gen.catLabel)}${gen.source === "ia" ? " · IA" : ""}</span>
      <h3>${escapeH(gen.name)}</h3>
      <div class="ai-understood"><b>Lo que entendimos:</b> ${escapeH(gen.summary)}</div>
      <div class="ai-grid">
        <div>
          <strong style="font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)">Alcance propuesto</strong>
          <ul class="ai-scope">${gen.scope.map(x => `<li>${escapeH(x)}</li>`).join("")}</ul>
          <strong style="font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)">Insumos sugeridos</strong>
          <div class="ai-chips">${gen.insumos.map(x => `<span class="ai-chip">${escapeH(x)}</span>`).join("")}</div>
        </div>
        <div>
          <div class="ai-quotebox">
            <small>Costo estimado</small>
            <span class="pr">${PEN(gen.price)}</span>
            <small>IGV incluido</small>
            <span class="plz">⏱️ ${gen.days} días hábiles</span>
          </div>
          <p class="ai-disc">${conf}</p>
        </div>
      </div>
      <div class="dlv-head" style="margin-top:20px">✨ Vista previa de tu entregable</div>
      ${deliverablePreview({ key: inferKey(gen.summary), title: gen.name })}
      <div class="ai-actions">
        <button class="btn btn-primary btn-lg" id="aiContinue">Personalizar y pagar</button>
        <button class="btn btn-ghost" id="aiRefineMore">🎛️ Afinar alcance</button>
        <button class="btn btn-ghost" id="aiEdit">✏️ Editar texto</button>
      </div>
      <p class="ai-disc">Cotización referencial generada automáticamente. El alcance y precio finales se confirman al validar tus insumos.</p>
    </div>`;
  $("#aiContinue").addEventListener("click", () => openGenerated(lastGen));
  $("#aiRefineMore").addEventListener("click", () => showRefine(aiText || gen.summary));
  $("#aiEdit").addEventListener("click", () => { $("#aiResult").innerHTML = ""; $("#aiNeed").focus(); });
  const ar = $("#aiResult");
  if (ar.scrollIntoView) ar.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function openGenerated(gen) {
  SERVICES.__custom = {
    tag: gen.catLabel, icon: gen.catIcon, name: gen.name, short: gen.summary,
    base: gen.price, baseDays: gen.days, insumos: gen.insumos,
    miniInsumos: gen.insumos.slice(0, 3), fields: [],
    note() { return { cls: "", html: `<h5>Servicio generado a tu medida</h5>${gen.scope.map(x => "• " + escapeH(x)).join("<br>")}` }; }
  };
  openService("__custom");
  $("#ordNote").value = gen.summary;
}

/* ---- Vista previa gráfica del entregable (mockup vendedor) ---- */
const PREVIEW = {
  expediente: { visual: "plan", formats: ["PDF", "Word", "Excel", "Planos", "Metrados"],
    sections: ["Memoria descriptiva", "Especificaciones técnicas", "Metrados y presupuesto", "Análisis de precios unitarios", "Cronograma", "Planos"],
    highlights: ["Documento técnico completo y revisable", "Presupuesto sustentado con APU", "Listo para aprobación de la entidad"] },
  politicas: { visual: "chart", formats: ["PDF", "Word", "PPT"],
    sections: ["Diagnóstico y línea base", "Objetivos prioritarios", "Lineamientos de política", "Matriz de indicadores", "Hoja de ruta"],
    highlights: ["Diseño basado en evidencia", "Matriz de seguimiento incluida", "Alineado a CEPLAN y al sector"] },
  regulatorio: { visual: "doc", formats: ["PDF", "Word"],
    sections: ["Antecedentes normativos", "Análisis legal", "Impacto regulatorio", "Riesgos y recomendaciones", "Conclusiones"],
    highlights: ["Opinión legal sustentada", "Base legal debidamente citada", "Recomendaciones accionables"] },
  financiera: { visual: "dashboard", formats: ["PDF", "Excel", "Dashboard"],
    sections: ["Resumen ejecutivo", "Ejecución por unidad ejecutora", "Avance físico-financiero", "Alertas y semáforos", "Recomendaciones"],
    highlights: ["Tablero visual e interactivo", "Indicadores clave de gestión", "Detalle por unidad ejecutora"] },
  evaluacion: { visual: "table", formats: ["PDF", "Excel"],
    sections: ["Acta de evaluación", "Cuadro comparativo", "Puntajes por criterio", "Orden de prelación", "Observaciones"],
    highlights: ["Cuadro de méritos claro", "Sustento por cada criterio", "Listo para el comité de selección"] }
};
const PREVIEW_GENERIC = { visual: "doc", formats: ["PDF", "Word"],
  sections: ["Resumen ejecutivo", "Desarrollo del análisis", "Hallazgos", "Recomendaciones", "Anexos"],
  highlights: ["Documento profesional listo para usar", "Revisado y validado por un especialista", "Entrega con trazabilidad por hitos"] };

function previewVisual(kind) {
  if (kind === "chart") return `<div class="dlv-bars">${[40, 72, 55, 90, 64].map(h => `<i style="height:${h}%"></i>`).join("")}</div>`;
  if (kind === "dashboard") return `<div class="dlv-cards"><span>92%</span><span>S/</span><span>▲</span></div><div class="dlv-bars">${[60, 82, 45, 70].map(h => `<i style="height:${h}%"></i>`).join("")}</div>`;
  if (kind === "table") return `<table class="dlv-tbl">${Array.from({ length: 5 }).map(() => `<tr><td></td><td></td><td></td></tr>`).join("")}</table>`;
  if (kind === "plan") return `<div class="dlv-grid">${Array.from({ length: 6 }).map(() => `<span></span>`).join("")}</div>`;
  return `${[100, 92, 96, 78].map(w => `<div class="dlv-line" style="width:${w}%"></div>`).join("")}`;
}
function inferKey(text) { return pickCategory((text || "").toLowerCase()).key; }
function deliverablePreview(opts) {
  const cfg = PREVIEW[opts.key] || PREVIEW_GENERIC;
  const title = (opts.title || "Entregable").replace(/^Servicio a medida:\s*/i, "");
  const idx = cfg.sections.slice(0, 4).map((s, i) => `<li><b>${i + 1}.</b> ${escapeH(s)}</li>`).join("");
  return `<div class="dlv">
    <div class="dlv-stack">
      <div class="dlv-page p3"></div>
      <div class="dlv-page p2"></div>
      <div class="dlv-page p1">
        <div class="dlv-cover">
          <div class="dlv-brand">▲ ANDES CONSULTORÍA INTELIGENTE</div>
          <div class="dlv-title">${escapeH(title).slice(0, 72)}</div>
          <div class="dlv-sub">Entregable profesional · ${cfg.formats.join(" · ")}</div>
        </div>
        <div class="dlv-body">
          <ul class="dlv-idx">${idx}</ul>
          ${previewVisual(cfg.visual)}
        </div>
        <span class="dlv-ribbon">MUESTRA</span>
      </div>
    </div>
    <div class="dlv-side">
      <h4>Esto es lo que vas a recibir</h4>
      <ul class="dlv-incl">${cfg.highlights.map(h => `<li>${escapeH(h)}</li>`).join("")}</ul>
      <div class="dlv-secs"><b>Contenido del documento:</b> ${cfg.sections.join(" · ")}</div>
      <div class="dlv-formats">${cfg.formats.map(f => `<span class="dlv-fmt" data-f="${f}">${f}</span>`).join("")}</div>
      <p class="dlv-note">Maqueta referencial. El entregable final se elabora y valida según tus insumos.</p>
    </div>
  </div>`;
}

/* ============================================================
   COTIZADOR
   ============================================================ */
function openService(key) {
  current = { key, values: {}, files: [], note: "" };
  const s = SERVICES[key];
  $("#svcModalTitle").textContent = s.name;
  $("#svcModalSub").textContent = "Completa los insumos y obtén tu cotización al instante";
  $("#insumosList").innerHTML = s.insumos.map(i => `<li>${i}</li>`).join("");

  const form = $("#svcForm");
  form.innerHTML = s.fields.map(f => fieldHTML(f)).join("");
  // inicializa valores por defecto
  s.fields.forEach(f => {
    if (f.type === "select") current.values[f.key] = f.options[0].value;
    if (f.type === "number") current.values[f.key] = f.included;
    if (f.type === "checks") current.values[f.key] = [];
  });
  form.addEventListener("input", onFormChange);
  // reinicia personalización
  $("#ordNote").value = "";
  $("#ordFiles").value = "";
  $("#fileList").innerHTML = "";
  $("#fileErr").hidden = true;
  const pvKey = current.key.startsWith("__") ? inferKey((s.short || "") + " " + (s.name || "")) : current.key;
  $("#svcPreview").innerHTML = deliverablePreview({ key: pvKey, title: s.name });
  recompute();
  openModal("#svcModal");
}

/* ---------- Archivos del pedido ---------- */
const MAX_FILES = 10, MAX_TOTAL = 25 * 1024 * 1024;
const OK_EXT = ["pdf","doc","docx","xls","xlsx","csv","png","jpg","jpeg","dwg","zip","ppt","pptx","txt"];
function fileIcon(name){ const e=(name.split(".").pop()||"").toLowerCase();
  if(["pdf"].includes(e))return"📕"; if(["xls","xlsx","csv"].includes(e))return"📗";
  if(["doc","docx","txt"].includes(e))return"📘"; if(["png","jpg","jpeg"].includes(e))return"🖼️";
  if(["zip"].includes(e))return"🗜️"; if(["dwg"].includes(e))return"📐"; return"📄"; }
function humanSize(b){ return b<1024?b+" B":b<1048576?(b/1024).toFixed(0)+" KB":(b/1048576).toFixed(1)+" MB"; }
function addFiles(list){
  const err = $("#fileErr"); err.hidden = true;
  for(const f of list){
    const ext=(f.name.split(".").pop()||"").toLowerCase();
    if(!OK_EXT.includes(ext)){ showFileErr(`Formato no permitido: ${f.name}`); continue; }
    if(current.files.length>=MAX_FILES){ showFileErr(`Máximo ${MAX_FILES} archivos.`); break; }
    if(current.files.some(x=>x.name===f.name && x.size===f.size)) continue;
    const total=current.files.reduce((a,x)=>a+x.size,0)+f.size;
    if(total>MAX_TOTAL){ showFileErr("Superaste el límite de 25 MB en total."); break; }
    current.files.push({ name:f.name, size:f.size, type:f.type });
  }
  renderFileList();
}
function showFileErr(m){ const e=$("#fileErr"); e.hidden=false; e.textContent=m; }
function renderFileList(){
  $("#fileList").innerHTML = current.files.map((f,i)=>`
    <li class="fileitem"><span class="fi-ico">${fileIcon(f.name)}</span>
      <span class="fi-name" title="${f.name}">${f.name}</span>
      <span class="fi-size">${humanSize(f.size)}</span>
      <button class="fi-del" data-fi="${i}" aria-label="Quitar archivo">✕</button></li>`).join("");
  $$("[data-fi]").forEach(b=>b.addEventListener("click",()=>{ current.files.splice(+b.dataset.fi,1); renderFileList(); }));
}

function fieldHTML(f) {
  if (f.type === "select") {
    return `<div class="field"><label for="f_${f.key}">${f.label}</label>
      <select id="f_${f.key}" name="${f.key}" data-type="select">
        ${f.options.map(o => `<option value="${o.value}">${o.label}</option>`).join("")}
      </select></div>`;
  }
  if (f.type === "number") {
    return `<div class="field"><label for="f_${f.key}">${f.label}</label>
      <div class="hint">Incluye ${f.included} en el precio base. Cada ${f.unitLabel}: ${PEN(f.perUnit)}.</div>
      <input type="number" id="f_${f.key}" name="${f.key}" data-type="number" value="${f.included}" min="${f.min}" max="${f.max}"></div>`;
  }
  if (f.type === "checks") {
    return `<div class="field"><label>${f.label}</label>
      <div class="checks">${f.options.map(o => `
        <label class="check"><input type="checkbox" name="${f.key}" value="${o.value}" data-type="checks"> <span>${o.label} <small class="muted">+${PEN(o.add)}</small></span></label>`).join("")}
      </div></div>`;
  }
  return "";
}

function onFormChange(e) {
  const el = e.target;
  const key = el.name, type = el.dataset.type;
  if (type === "select") current.values[key] = el.value;
  else if (type === "number") {
    let v = parseInt(el.value || "0", 10);
    if (isNaN(v)) v = 0;
    current.values[key] = v;
  } else if (type === "checks") {
    current.values[key] = $$(`input[name="${key}"]:checked`).map(i => i.value);
  }
  recompute();
}

function recompute() {
  const s = SERVICES[current.key];
  let mult = 1, adds = 0, days = s.baseDays;
  const breakdown = [{ label: "Servicio base", amount: s.base }];

  s.fields.forEach(f => {
    const val = current.values[f.key];
    if (f.type === "select") {
      const o = f.options.find(x => x.value === val);
      if (o) {
        if (o.factor && o.factor !== 1) { mult *= o.factor; breakdown.push({ label: o.label, amount: s.base * (o.factor - 1) }); }
        if (o.add) { adds += o.add; breakdown.push({ label: o.label, amount: o.add }); }
        days += (o.days || 0);
      }
    } else if (f.type === "number") {
      const extra = Math.max(0, val - f.included);
      if (extra > 0) { adds += extra * f.perUnit; breakdown.push({ label: `${extra} × ${f.unitLabel}`, amount: extra * f.perUnit }); days += extra * (f.days || 0); }
    } else if (f.type === "checks") {
      (val || []).forEach(v => {
        const o = f.options.find(x => x.value === v);
        if (o) { adds += o.add; breakdown.push({ label: o.label, amount: o.add }); days += (o.days || 0); }
      });
    }
  });

  const price = Math.round((s.base * mult + adds) / 50) * 50; // redondeo a S/50
  days = Math.max(3, Math.round(days));
  current.price = price; current.days = days; current.breakdown = breakdown;

  $("#quoteLines").innerHTML = breakdown.map(b =>
    `<div class="quote-line"><span>${b.label}</span><span>${b.amount >= 0 ? "" : "−"}${PEN(Math.abs(b.amount))}</span></div>`).join("");
  $("#quoteTotal").textContent = PEN(price);
  $("#quoteDeliv").innerHTML = `⏱️ Plazo estimado: <strong style="margin-left:4px">${days} días hábiles</strong>`;
  updateNote();
}

function updateNote() {
  const s = SERVICES[current.key];
  const box = $("#svcNote");
  if (typeof s.note !== "function") { box.hidden = true; return; }
  const r = s.note(current.values);
  box.className = "norm-note" + (r.cls ? " " + r.cls : "");
  box.innerHTML = r.html;
  box.hidden = false;
}

/* ============================================================
   CHECKOUT
   ============================================================ */
function openCheckout() {
  const s = SERVICES[current.key];
  current.note = $("#ordNote").value.trim();
  current.speed = "std";
  /* Culqi solo procesa tarjetas peruanas. Fuera del Perú el camino real de
     una entidad pública es una propuesta formal, no un pago con tarjeta. */
  current.method = (window.REGION && !REGION.esPeru()) ? "os" : "culqi";
  current.payTotal = current.price;
  current.payDays = current.days;
  $("#coSvcName").textContent = s.name;
  $("#osFields").hidden = current.method !== "os";
  $("#coErr").hidden = true;
  $$("#coMethod .opt").forEach(x => x.classList.toggle("sel", x.dataset.method === current.method));
  renderCoSpeed();
  closeModal("#svcModal");
  openModal("#checkoutModal");
}
function renderCoSpeed() {
  $("#coSpeed").innerHTML = SPEED.map(s => {
    const d = Math.max(1, Math.ceil(current.days * s.factor));
    const add = Math.round(current.price * s.addPct / 50) * 50;
    return `<div class="speed${s.id === current.speed ? " sel" : ""}" data-cosp="${s.id}"><div class="sp-name">${s.label}</div><div class="sp-days">${d} d</div><div class="sp-add">${add ? "+ " + PEN(add) : "incluido"}</div></div>`;
  }).join("");
  $$("#coSpeed .speed").forEach(el => el.addEventListener("click", () => setCoSpeed(el.dataset.cosp)));
  updateCoTotals();
}
function setCoSpeed(id) {
  current.speed = id;
  $$("#coSpeed .speed").forEach(el => el.classList.toggle("sel", el.dataset.cosp === id));
  updateCoTotals();
}
function updateCoTotals() {
  const s = SPEED.find(x => x.id === current.speed) || SPEED[0];
  current.payTotal = Math.round(current.price * (1 + s.addPct) / 50) * 50;
  current.payDays = Math.max(1, Math.ceil(current.days * s.factor));
  $("#coSvcPrice").textContent = PEN(current.price);
  $("#coTotal").textContent = PEN(current.payTotal);
  $("#payBtn").textContent = current.method !== "os" ? "Pagar " + PEN(current.payTotal)
    : (window.REGION && !REGION.esPeru() ? "Generar propuesta formal" : "Generar TDR y aceptar servicio");
}

function validEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

async function pay() {
  const name = $("#coName").value.trim();
  const email = $("#coEmail").value.trim();
  if (!name) { $("#coName").focus(); return shake("#coName"); }
  if (!validEmail(email)) { $("#coEmail").focus(); return shake("#coEmail"); }

  const pk = (window.ACI_CONFIG && window.ACI_CONFIG.culqiPublicKey || "").trim();
  const useCulqi = /^pk_(test|live)_/.test(pk) && typeof window.Culqi !== "undefined";

  if (useCulqi) {
    startCulqi(pk, name, email);
  } else {
    // MODO DEMO: simulamos el pago
    const btn = $("#payBtn"); btn.disabled = true; btn.textContent = "Procesando pago…";
    await sleep(1300);
    finishOrder({ name, email, demo: true, token: "tkn_demo_" + rand() });
  }
}

function startCulqi(pk, name, email) {
  try {
    Culqi.publicKey = pk;
    Culqi.settings({
      title: "Andes Consultoría",
      currency: "PEN",
      amount: Math.round((current.payTotal || current.price) * 100), // céntimos
      order: ""
    });
    Culqi.options({
      lang: "es",
      installments: false,
      paymentMethods: { tarjeta: true, yape: true, billetera: true, bancaMovil: false, agente: false, cuotealo: false },
      style: { logo: "", buttonBackground: "#C2602F", menuColor: "#0E2A47", buttonText: "Pagar", buttonTextColor: "#ffffff" }
    });
    window.__aciBuyer = { name, email };
    Culqi.open();
  } catch (err) {
    console.error(err);
    alert("No se pudo iniciar el pago con Culqi. Intenta nuevamente o contáctanos.");
  }
}

/* Callback global requerido por Culqi v4 */
window.culqi = function () {
  const buyer = window.__aciBuyer || {};
  if (typeof Culqi !== "undefined" && Culqi.token) {
    finishOrder({ name: buyer.name, email: buyer.email, token: Culqi.token.id, demo: false });
  } else if (typeof Culqi !== "undefined" && Culqi.order) {
    finishOrder({ name: buyer.name, email: buyer.email, token: Culqi.order.id, demo: false, isOrder: true });
  } else if (typeof Culqi !== "undefined" && Culqi.error) {
    alert("Pago no completado: " + (Culqi.error.user_message || Culqi.error.merchant_message || "Inténtalo de nuevo."));
    const btn = $("#payBtn"); btn.disabled = false; btn.textContent = "Pagar " + PEN(current.payTotal || current.price);
  }
};

async function finishOrder({ name, email, token, demo, isOrder }) {
  const btn = $("#payBtn"); btn.disabled = true; btn.textContent = "Confirmando…";
  const s = SERVICES[current.key];
  const code = "ACI-" + rand();
  const payload = {
    code, name, email, token,
    serviceKey: current.key, serviceName: s.name,
    amount: current.payTotal || current.price, days: current.payDays || current.days,
    speed: current.speed || "std",
    values: current.values, demo: !!demo,
    note: current.note || "",
    files: (current.files || []).map(f => ({ name: f.name, size: f.size }))
  };

  // Intenta procesar en el backend (cargo Culqi + envío de correo). Si no hay backend, simula.
  let server = null;
  try {
    const r = await fetch("/api/order", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    if (r.ok) server = await r.json();
  } catch (_) { /* sin backend: modo demo local */ }

  const finalCode = (server && server.code) || code;
  saveOrder({ code: finalCode, serviceName: s.name, serviceKey: current.key, total: current.payTotal || current.price, days: current.payDays || current.days, speed: current.speed || "std", stage: 1, email, createdAt: Date.now() });
  showSuccess(finalCode, email, server);
}

function showSuccess(code, email, server) {
  const emailed = server && server.emailed;
  $("#coBody").innerHTML = `
    <div class="success">
      <div class="ok-ico"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1E7A4B" stroke-width="2.4"><path d="M20 6 9 17l-5-5"/></svg></div>
      <h3 style="margin:0 0 4px">¡Pago confirmado!</h3>
      <p class="muted">Tu servicio fue registrado y ya está en cola de elaboración.</p>
      <div class="code-chip">${code}</div>
      <p style="font-size:.92rem;margin:10px 0 0">${emailed
        ? `Enviamos el comprobante y el código de seguimiento a <b>${email}</b>.`
        : `Guarda tu código de seguimiento. ${server ? "" : "(Modo demo: el envío de correo se activa al conectar el backend.)"}`}</p>
      <p style="font-size:.92rem">El entregable llegará a tu correo al completar el control de calidad. Puedes seguir el avance en la sección de trazabilidad.</p>
      <p style="font-size:.92rem;margin-top:8px;color:#1E7A4B"><b>Incluido:</b> una ronda de ajustes sobre observaciones al entregable, dentro de los 10 días hábiles siguientes a la entrega.</p>
    </div>`;
  $(".modal-foot", $("#checkoutModal")).innerHTML =
    `<button class="btn btn-ghost" id="coClose2">Cerrar</button>
     <button class="btn btn-primary" id="goTrack">Ver seguimiento</button>`;
  $("#coClose2").addEventListener("click", () => closeModal("#checkoutModal"));
  $("#goTrack").addEventListener("click", () => {
    closeModal("#checkoutModal");
    $("#trackInput").value = code;
    doTrack();
    document.getElementById("seguimiento").scrollIntoView({ behavior: "smooth" });
  });
}

/* ============================================================
   ORDEN DE SERVICIO (Entidad pública ≤ 8 UIT) + TDR automático
   ============================================================ */
function submitCheckout() { if (current.method === "os") submitOrdenServicio(); else pay(); }

function REGION_ES_PE() { return !window.REGION || REGION.esPeru(); }

function stripTags(html) { return String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); }

async function submitOrdenServicio() {
  const s = SERVICES[current.key];
  const name = $("#coName").value.trim(), email = $("#coEmail").value.trim();
  const entidad = $("#osEntidad").value.trim(), ruc = $("#osRuc").value.trim();
  const area = $("#osArea").value.trim(), func = $("#osFunc").value.trim();
  const err = $("#coErr"); err.hidden = true;
  if (!entidad || !ruc || !area || !func) {
    err.hidden = false;
    err.textContent = REGION_ES_PE()
      ? "Completa los datos de la entidad (entidad, RUC, área usuaria y responsable) para generar el TDR."
      : "Completa los datos de la entidad (nombre, identificación tributaria, área usuaria y responsable) para generar la propuesta.";
    return;
  }
  if (!validEmail(email)) { $("#coEmail").focus(); return shake("#coEmail"); }
  const total = current.payTotal || current.price;
  /* El tope de 8 UIT para contratación directa por Orden de Servicio es una
     regla de la Ley N.° 32069: no aplica fuera del Perú, donde cada país tiene
     sus propios umbrales de contratación menor. */
  if (REGION_ES_PE() && total > MAX_OS) {
    err.hidden = false;
    err.innerHTML = `El monto (<b>${PEN(total)}</b>) supera el tope de <b>8 UIT (${PEN(MAX_OS)})</b> para contratación directa por Orden de Servicio. Reduce el alcance/velocidad o tramita un procedimiento de selección.`;
    return;
  }
  const btn = $("#payBtn"); btn.disabled = true;
  btn.textContent = REGION_ES_PE() ? "Generando TDR…" : "Generando propuesta…";
  await sleep(900);
  const code = "ACI-" + rand();
  const alcance = (typeof s.note === "function") ? stripTags(s.note(current.values).html) : s.short;
  const tdr = buildTDR({ code, name, email, entidad, ruc, area, func, serviceName: s.name, insumos: s.insumos || [], alcance, amount: total, days: current.payDays || current.days, nota: current.note });
  saveOrder({ code, serviceName: s.name, serviceKey: current.key, total, days: current.payDays || current.days, speed: current.speed || "std", stage: 1, email, method: "os", entidad, createdAt: Date.now() });
  showSuccessOS(code, email, tdr, entidad);
}

function buildTDR(d) {
  const fecha = new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
  const insumos = (d.insumos || []).map(i => `      - ${i}`).join("\n");
  const encabezado = REGION_ES_PE()
    ? "TÉRMINOS DE REFERENCIA (TDR)\nContratación por monto igual o inferior a 8 UIT"
    : "TÉRMINOS DE REFERENCIA / PROPUESTA FORMAL\nPaís de la entidad: " + (window.REGION ? REGION.pais.nombre : "") +
      "\nLos umbrales y la modalidad de contratación se ajustan a la normativa aplicable en el país.";
  return `${encabezado}

Código de servicio : ${d.code}
Fecha              : ${fecha}

1. ENTIDAD CONTRATANTE
   Entidad      : ${d.entidad}
   RUC          : ${d.ruc}
   Área usuaria : ${d.area}
   Responsable  : ${d.func}

2. DENOMINACIÓN DE LA CONTRATACIÓN
   ${d.serviceName}

3. FINALIDAD PÚBLICA
   Contar con el servicio especializado indicado, que permita a la entidad cumplir
   sus objetivos institucionales conforme a la normativa vigente.

4. ANTECEDENTES
   ${d.nota ? d.nota : "[Completar antecedentes específicos del área usuaria.]"}

5. OBJETIVO DE LA CONTRATACIÓN
   Obtener el entregable profesional correspondiente al servicio "${d.serviceName}",
   elaborado y validado por especialistas.

6. ALCANCE Y DESCRIPCIÓN DEL SERVICIO
   ${d.alcance}
   Insumos a cargo de la entidad:
${insumos || "      - [Completar]"}

7. ENTREGABLES
   - Entregable final del servicio, en formato digital editable y PDF.

8. PLAZO DE EJECUCIÓN
   ${d.days} días hábiles, contados desde la entrega de insumos / orden de servicio.

9. PERFIL DEL PROVEEDOR
   Persona natural o jurídica con experiencia en la materia; profesionales colegiados
   según corresponda, quienes validan y firman el entregable.

10. LUGAR DE PRESTACIÓN
    Servicio remoto, con entrega digital y reuniones de coordinación virtuales.

11. FORMA DE PAGO
    Pago único contra conformidad del área usuaria.

12. CONFORMIDAD
    Otorgada por el área usuaria (${d.area}) previa verificación del entregable.

13. MONTO REFERENCIAL
    ${PEN(d.amount)} (incluye IGV). Monto igual o inferior a 8 UIT (S/ 44,000),
    por lo que corresponde contratación directa sin procedimiento de selección,
    conforme a la normativa de contrataciones del Estado.

14. CONFIDENCIALIDAD
    El proveedor guardará confidencialidad sobre la información, conforme a la
    Ley N.° 29733 de Protección de Datos Personales.

---------------------------------------------------------------
Documento generado automáticamente por Andes Consultoría Inteligente.
Revisar y completar los campos entre corchetes [ ] antes de su uso oficial.
`;
}

function downloadTDR(code, tdr) {
  try {
    const blob = new Blob([tdr], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `TDR-${code}.txt`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (_) {}
}

function showSuccessOS(code, email, tdr, entidad) {
  $("#coBody").innerHTML = `
    <div class="success">
      <div class="ok-ico"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1E7A4B" stroke-width="2.4"><path d="M20 6 9 17l-5-5"/></svg></div>
      <h3 style="margin:0 0 4px">¡Servicio aceptado por Orden de Servicio!</h3>
      <p class="muted">Generamos el TDR para <b>${escapeH(entidad)}</b> y registramos el servicio.</p>
      <div class="code-chip">${code}</div>
      <p style="font-size:.92rem;margin:10px 0 0">Descarga el <b>TDR</b>, adjúntalo a tu Orden de Servicio y el equipo iniciará el trabajo. El entregable llegará a <b>${escapeH(email)}</b> al completar el control de calidad.</p>
      <p style="font-size:.82rem;color:var(--muted);margin-top:8px">Monto ≤ 8 UIT: contratación directa sin procedimiento de selección, sujeta a la supervisión y al registro que establece la Ley N.° 32069.</p>
      <p style="font-size:.92rem;margin-top:8px;color:#1E7A4B"><b>Incluido:</b> una ronda de ajustes sobre observaciones al entregable, dentro de los 10 días hábiles siguientes a la entrega.</p>
    </div>`;
  $(".modal-foot", $("#checkoutModal")).innerHTML =
    `<button class="btn btn-ghost" id="coCloseOS">Cerrar</button>
     <span style="display:flex;gap:10px"><button class="btn btn-dark" id="dlTDR">⬇ Descargar TDR</button>
     <button class="btn btn-primary" id="goTrackOS">Ver seguimiento</button></span>`;
  $("#coCloseOS").addEventListener("click", () => closeModal("#checkoutModal"));
  $("#dlTDR").addEventListener("click", () => downloadTDR(code, tdr));
  $("#goTrackOS").addEventListener("click", () => {
    closeModal("#checkoutModal");
    $("#trackInput").value = code; doTrack();
    document.getElementById("seguimiento").scrollIntoView({ behavior: "smooth" });
  });
}

/* ============================================================
   TRAZABILIDAD
   ============================================================ */
function getOrders(){ try { return JSON.parse(localStorage.getItem("aci_orders") || "{}"); } catch(_){ return {}; } }
function saveOrder(o){ const all = getOrders(); all[o.code] = o; try { localStorage.setItem("aci_orders", JSON.stringify(all)); } catch(_){} }

function doTrack() {
  if (trackTimer) { clearInterval(trackTimer); trackTimer = null; }
  const code = $("#trackInput").value.trim().toUpperCase();
  const order = DEMO_ORDERS[code] || getOrders()[code];
  if (!order) {
    $("#trackResult").hidden = true;
    $("#trackEmpty").hidden = false;
    $("#trackEmpty").textContent = `No encontramos el pedido "${code}". Verifica el código de tu correo o prueba con ACI-DEMO.`;
    return;
  }
  curOrder = order;
  $("#trackEmpty").hidden = true;
  $("#trackResult").hidden = false;
  renderOps(order);
  startTicker();
}

function renderOps(o) {
  const last = STAGES.length - 1;
  const stage = Math.min(last, o.stage);
  const p = stage / last;
  const done = stage >= last;
  baseRemaining = done ? 0 : Math.max(1, Math.ceil(o.days * (1 - p)));
  selSpeed = "std";
  const eta = addBizDays(new Date(), baseRemaining);
  const tgt = AGENT_TARGETS[stage] || AGENT_TARGETS[0];
  const team = agentsFor(o.serviceKey); _opsAgents = team;

  const docsHTML = INTAKE_DOCS.map((d, i) =>
    `<div class="doc" style="animation-delay:${(i * 0.12).toFixed(2)}s"><span class="di">${d.icon}</span>${d.label}<span class="dch">✓</span></div>`).join("");

  const agentsHTML = team.map((a, i) => agentCardHTML(a, i, tgt[i])).join("");

  const tlHTML = STAGES.map((st, i) => {
    const cls = i < stage ? "done" : i === stage ? "active" : "";
    const meta = i < stage ? "Completado" : i === stage ? "En curso" : "Pendiente";
    return `<li class="tl ${cls}"><span class="dot"></span><div class="tl-h">${st.h}</div><div class="tl-d">${st.d}</div><div class="tl-meta">${meta}</div></li>`;
  }).join("");

  const speedHTML = SPEED.map(s => {
    const d = Math.max(1, Math.ceil(baseRemaining * s.factor));
    const add = Math.round(o.total * s.addPct / 50) * 50;
    return `<div class="speed${s.id === selSpeed ? " sel" : ""}" data-sp="${s.id}"><div class="sp-name">${s.label}</div><div class="sp-days">${d} d</div><div class="sp-add">${add ? "+ " + PEN(add) : "incluido"}</div></div>`;
  }).join("");

  $("#trackResult").innerHTML = `
    <div class="ops">
      <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px">
        <div><strong style="font-size:1.05rem;color:var(--navy)">${o.serviceName}</strong>
          <div class="tl-meta">Pedido ${o.code} · Total ${PEN(o.total)}</div></div>
        <span class="svc-tag" style="background:${done ? "#e6f3ec" : "#f6ece4"};color:${done ? "#1E7A4B" : "#C2602F"}">${done ? "✔ Entregado" : "● En proceso"}</span>
      </div>
      <div class="eta" style="margin-top:14px">
        <div class="eta-big"><b id="etaDays">${baseRemaining}</b><small>días hábiles${done ? "" : " restantes"}</small></div>
        <div class="eta-mid"><div class="ebar"><i style="width:${Math.round(p * 100)}%"></i></div>
          <div class="elabels"><span>Inicio</span><span>${Math.round(p * 100)}% avanzado</span><span>Entrega</span></div></div>
        <div class="eta-date"><b id="etaDate">${done ? "¡Entregado!" : fmtDate(eta)}</b><small>fecha estimada de entrega</small></div>
      </div>
      <div class="ops-section-t">📥 Documentación recibida de la entidad <span class="live">en sistema</span></div>
      <div class="intake">${docsHTML}</div>
      <div class="ops-section-t">👥 Equipo de agentes especializados ${done ? "" : '<span class="live">trabajando ahora</span>'}</div>
      <div class="agents">${agentsHTML}</div>
      <div class="ops-section-t">🧭 Línea de tiempo del servicio</div>
      <ol class="timeline">${tlHTML}</ol>
      ${done ? "" : `<div class="ops-section-t">⚡ Acelera tu entrega</div>
      <div class="accel">
        <h4>¿Necesitas tu entregable antes?</h4>
        <p class="sub">Sumamos capacidad de equipo para reducir el plazo, dentro de lo razonable. Elige una opción:</p>
        <div class="speed-opts" id="trackSpeed">${speedHTML}</div>
        <div class="accel-foot"><div class="delta" id="accelDelta">Entrega estándar en <b>${baseRemaining}</b> días hábiles.</div>
          <button class="btn btn-primary" id="accelBtn" hidden>Acelerar</button></div>
      </div>`}
    </div>`;

  $$("#trackResult .speed").forEach(el => el.addEventListener("click", () => selectSpeed(el.dataset.sp)));
  const ab = $("#accelBtn"); if (ab) ab.addEventListener("click", confirmAccel);
}

function selectSpeed(id) {
  selSpeed = id;
  const s = SPEED.find(x => x.id === id);
  const newRem = Math.max(1, Math.ceil(baseRemaining * s.factor));
  const add = Math.round(curOrder.total * s.addPct / 50) * 50;
  $$("#trackResult .speed").forEach(el => el.classList.toggle("sel", el.dataset.sp === id));
  $("#etaDays").textContent = newRem;
  $("#etaDate").textContent = fmtDate(addBizDays(new Date(), newRem));
  const delta = $("#accelDelta"), btn = $("#accelBtn");
  if (id === "std") { delta.innerHTML = `Entrega estándar en <b>${baseRemaining}</b> días hábiles.`; btn.hidden = true; }
  else { delta.innerHTML = `Reduce de ${baseRemaining} a <b>${newRem}</b> días hábiles · adicional <b>${PEN(add)}</b>.`; btn.hidden = false; btn.textContent = `Acelerar por + ${PEN(add)}`; }
}

function confirmAccel() {
  const s = SPEED.find(x => x.id === selSpeed);
  const newRem = Math.max(1, Math.ceil(baseRemaining * s.factor));
  const add = Math.round(curOrder.total * s.addPct / 50) * 50;
  const stored = getOrders()[curOrder.code];
  if (stored) { stored.days = Math.max(1, Math.round(stored.days * s.factor)); stored.total = stored.total + add; stored.speed = s.id; saveOrder(stored); }
  const box = $("#trackResult .accel");
  if (box) box.innerHTML = `<h4>⚡ Entrega acelerada</h4>
    <p class="sub" style="margin:0">Tu servicio pasó a modo <b>${s.label}</b>: nueva fecha estimada <b>${fmtDate(addBizDays(new Date(), newRem))}</b> (${newRem} días hábiles). Se cargará un adicional de <b>${PEN(add)}</b> a tu medio de pago.</p>`;
}

function animateBars(root) {
  setTimeout(() => { $$(`${root} .agent-bar i`).forEach(b => { b.style.width = b.dataset.tgt + "%"; }); }, 120);
}
function tickAgents(root, state, team) {
  const set = team || AGENTS;
  $$(`${root} .agent.work`).forEach(card => {
    const a = set[+card.dataset.ag]; if (!a) return;
    const log = card.querySelector(".agent-log");
    log.style.opacity = "0";
    const k = state.k;
    setTimeout(() => { log.innerHTML = a.logs[k % a.logs.length] + ' <span class="dotpulse">●</span>'; log.style.opacity = "1"; }, 200);
    const bar = card.querySelector(".agent-bar i"), t = +bar.dataset.tgt;
    if (t < 100) { const cur = parseFloat(bar.style.width) || 0, nv = Math.min(t + Math.random() * 2, 99); if (nv > cur) bar.style.width = nv + "%"; }
  });
  state.k++;
}
function startTicker() {
  animateBars("#trackResult");
  const state = { k: 1 };
  trackTimer = setInterval(() => tickAgents("#trackResult", state, _opsAgents), 2100);
}

/* Demo de control (feature de venta, sin código de seguimiento) */
function renderShowcase() {
  const el = $("#controlDemo"); if (!el) return;
  const stage = 2, tgt = AGENT_TARGETS[stage];
  const agentsHTML = AGENTS.map((a, i) => agentCardHTML(a, i, tgt[i])).join("");
  const tlHTML = STAGES.map((st, i) => {
    const cls = i < stage ? "done" : i === stage ? "active" : "";
    return `<li class="tl ${cls}"><span class="dot"></span><div class="tl-h">${st.h}</div></li>`;
  }).join("");
  el.innerHTML = `
    <div class="ops">
      <div class="eta">
        <div class="eta-big"><b>12</b><small>días restantes</small></div>
        <div class="eta-mid"><div class="ebar"><i style="width:40%"></i></div>
          <div class="elabels"><span>Inicio</span><span>40% avanzado</span><span>Entrega</span></div></div>
        <div class="eta-date"><b>EN VIVO</b><small>vista de control (demo)</small></div>
      </div>
      <div class="ops-section-t">👥 Tu equipo de agentes <span class="live">trabajando</span></div>
      <div class="agents">${agentsHTML}</div>
      <div class="ops-section-t">🧭 Hitos del servicio</div>
      <ol class="timeline timeline-mini">${tlHTML}</ol>
    </div>`;
  animateBars("#controlDemo");
  const state = { k: 1 };
  setInterval(() => tickAgents("#controlDemo", state, AGENTS), 2300);
}

/* ============================================================
   PRÓXIMAMENTE (notify)
   ============================================================ */
function openNotify(name) {
  $("#ntSub").textContent = name;
  $("#ntMsg").hidden = true;
  $("#ntEmail").value = "";
  openModal("#notifyModal");
}

/* ============================================================
   MODALES + UTIL
   ============================================================ */
let _lastFocus = null, _trapHandler = null, _trapModal = null;
function focusableIn(m) {
  return $$('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])', m)
    .filter(el => el.offsetParent !== null);
}
function openModal(sel) {
  const m = $(sel); m.classList.add("open"); document.body.style.overflow = "hidden";
  if (window.__lenis) { try { window.__lenis.stop(); } catch (_) {} }   // libera el scroll para el modal
  m.scrollTop = 0;
  _lastFocus = document.activeElement; _trapModal = m;
  const f = focusableIn(m); if (f.length) setTimeout(() => { try { f[0].focus(); } catch (_) {} }, 30);
  _trapHandler = (e) => {
    if (e.key !== "Tab") return;
    const els = focusableIn(m); if (!els.length) return;
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  m.addEventListener("keydown", _trapHandler);
}
function closeModal(sel) {
  const m = $(sel); m.classList.remove("open"); document.body.style.overflow = "";
  if (window.__lenis) { try { window.__lenis.start(); } catch (_) {} }
  if (_trapHandler && _trapModal) _trapModal.removeEventListener("keydown", _trapHandler);
  _trapHandler = null; _trapModal = null;
  if (_lastFocus && _lastFocus.focus) { try { _lastFocus.focus(); } catch (_) {} }
  _lastFocus = null;
}
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
function rand(){ return Math.floor(1000 + Math.random() * 9000).toString(); }
function shake(sel){ const el = $(sel); el.style.borderColor = "#C0392B"; el.animate?.([{transform:"translateX(0)"},{transform:"translateX(-6px)"},{transform:"translateX(6px)"},{transform:"translateX(0)"}], {duration:240}); }

/* ============================================================
   INIT
   ============================================================ */
/* Cuenta de servicios cotizables en el país activo, para el KPI de "Nosotros". */
function contarServicios() {
  return Object.entries(SERVICES).filter(([k, s]) => !k.startsWith("__") && !s.soon && aplicaEnPais(s)).length;
}
function pintarKpiServicios() {
  const el = document.getElementById("kpiServicios");
  if (!el) return;
  const n = contarServicios();
  /* motion.js anima este contador al entrar en pantalla y lee data-target en
     ese momento. Si todavía está en "0" es que la animación no ha corrido:
     dejamos el 0 para no romperla y solo actualizamos el objetivo. */
  el.setAttribute("data-target", n);
  if (el.textContent.trim() !== "0") el.textContent = n;

  /* La misma cuenta aparece en el bento de #datos. Ahí motion.js lee
     data-count, también de forma diferida. */
  const bento = document.getElementById("bentoServicios");
  if (bento) {
    bento.setAttribute("data-count", n);
    if (bento.textContent.trim() !== "0") bento.textContent = n;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("#yr").textContent = new Date().getFullYear();
  renderServices();
  renderFuture();
  pintarKpiServicios();

  /* Al cambiar de país cambian el catálogo, la moneda y el KPI. Se repinta
     todo lo que muestra precios o depende del alcance. */
  if (window.REGION) REGION.onChange(() => {
    const si = document.getElementById("svcSearchInput");
    renderServices(si ? si.value : "");
    renderFuture();
    pintarKpiServicios();
    if (current && current.key && document.querySelector("#checkoutModal.open")) updateCoTotals();
    if (current && current.key && document.querySelector("#svcModal.open")) recompute();
  });

  $("#svcModalClose").addEventListener("click", () => closeModal("#svcModal"));
  $("#coClose").addEventListener("click", () => closeModal("#checkoutModal"));
  $("#ntClose").addEventListener("click", () => closeModal("#notifyModal"));
  $("#goCheckout").addEventListener("click", openCheckout);
  $("#payBtn").addEventListener("click", submitCheckout);
  $$("#coMethod .opt").forEach(b => b.addEventListener("click", () => {
    current.method = b.dataset.method;
    $$("#coMethod .opt").forEach(x => x.classList.toggle("sel", x === b));
    $("#osFields").hidden = current.method !== "os";
    $("#coErr").hidden = true;
    updateCoTotals();
  }));
  $("#trackBtn").addEventListener("click", doTrack);
  $("#trackInput").addEventListener("keydown", e => { if (e.key === "Enter") doTrack(); });
  $("#ntSubmit").addEventListener("click", () => {
    const v = $("#ntEmail").value.trim();
    const msg = $("#ntMsg"); msg.hidden = false;
    msg.style.color = validEmail(v) ? "var(--ok)" : "#C0392B";
    msg.textContent = validEmail(v) ? "¡Listo! Te avisaremos apenas esté disponible." : "Ingresa un correo válido.";
  });

  // cotizador con IA
  $("#aiGen").addEventListener("click", runAI);
  $$("#aiExamples .ai-ex").forEach(b => b.addEventListener("click", () => { $("#aiNeed").value = b.dataset.ex; $("#aiNeed").focus(); }));

  // buscador de servicios
  const si = $("#svcSearchInput"), sw = $("#svcSearch");
  si.addEventListener("input", () => { sw.classList.toggle("has-text", !!si.value); renderServices(si.value); });
  $("#svcSearchClear").addEventListener("click", () => { si.value = ""; sw.classList.remove("has-text"); renderServices(); si.focus(); });
  $$(".kw").forEach(b => b.addEventListener("click", () => {
    si.value = b.dataset.kw; sw.classList.add("has-text"); renderServices(si.value);
    document.getElementById("servicios").scrollIntoView({ behavior: "smooth" });
  }));

  // carga de archivos (input + arrastrar/soltar)
  const dz = $("#dropzone"), fi = $("#ordFiles");
  fi.addEventListener("change", e => { addFiles(e.target.files); fi.value = ""; });
  ["dragenter", "dragover"].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add("drag"); }));
  ["dragleave", "drop"].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove("drag"); }));
  dz.addEventListener("drop", e => { if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files); });

  // cerrar modales al hacer clic fuera o con Escape
  $$(".modal").forEach(m => m.addEventListener("click", e => { if (e.target === m) closeModal("#" + m.id); }));
  document.addEventListener("keydown", e => { if (e.key === "Escape") $$(".modal.open").forEach(m => closeModal("#" + m.id)); });

  // menú móvil
  const mt = $("#menuToggle"), nl = $("#navLinks");
  mt.addEventListener("click", () => {
    const show = nl.classList.toggle("show");
    mt.setAttribute("aria-expanded", show);
  });
  $$("#navLinks a").forEach(a => a.addEventListener("click", () => nl.classList.remove("show")));
});
