/* ============================================================
   tropicalize.js — Andes Consultoría
   Selector de país (26 prestatarios del BID) que cambia:
   (1) el idioma de la UI (es/pt/en/fr/nl) y
   (2) el contexto normativo del catálogo (sistema nacional de
       inversión pública + ley de contrataciones + equivalencias).
   La línea multilateral BID (GN-2349-15 / GN-2350-15) es constante.
   Fuentes oficiales por país; equivalencias marcadas [ok|parcial].
   ============================================================ */
(function () {
  "use strict";

  /* ---------- i18n: cadenas de interfaz ---------- */
  const I18N = {
    es: {
      nav1:"Cotizador IA", nav2:"Servicios", nav3:"Datos", nav4:"Control", nav5:"Proceso", nav6:"Trazabilidad",
      btn_track:"Seguir mi pedido", btn_quote:"Cotizar ahora",
      hero_eyebrow:"Consultoría pública potenciada con IA",
      hero_h1:"Servicios de asesoría al Estado, productizados y con resultados trazables.",
      hero_lead:"Expedientes técnicos, políticas públicas, análisis regulatorio, gestión financiera y evaluación de comités. Definimos los insumos, dimensionamos el trabajo y te entregamos un producto profesional —con seguimiento en tiempo real— alineado al sistema nacional de inversión pública y a la ley de contrataciones de tu país, y a las políticas del BID.",
      chip1:"✔ Cotización transparente en minutos", chip2:"✔ Pago seguro en línea", chip3:"✔ Entrega con trazabilidad", chip4:"☕ Café Starbucks a tu oficina al recibir",
      cta_explore:"Explorar servicios", cta_how:"Ver cómo funciona",
      servicios_eyebrow:"Servicios", servicios_h1:"Elige tu servicio, define los insumos y obtén una cotización inmediata",
      servicios_lead:"Cada servicio te indica exactamente qué insumos necesitamos. Con base en ellos dimensionamos el trabajo y calculamos un precio justo y transparente. Diseñado para funcionarios públicos, consultores independientes y firmas proveedoras del Estado.",
      ctx_title:"Contexto normativo del país", ctx_sni:"Sistema nacional de inversión pública", ctx_proc:"Ley / sistema de contrataciones",
      ctx_bid:"Línea multilateral BID (constante en los 26 países)", ctx_exp:"Expediente técnico / documento de ejecución",
      ctx_preinv:"Preinversión / formulación", ctx_ioarr:"Inversión menor / optimización (tipo IOARR)", ctx_fin:"Administración financiera",
      ctx_com:"Comité de selección / evaluación", ctx_air:"Análisis de impacto regulatorio", ctx_verified:"verificado", ctx_partial:"por verificar",
      ctx_note:"Equivalencias mapeadas contra fuentes oficiales de cada país. Lo marcado «por verificar» requiere confirmación en la norma primaria.",
      picker:"País / idioma"
    },
    pt: {
      nav1:"Cotação IA", nav2:"Serviços", nav3:"Dados", nav4:"Controle", nav5:"Processo", nav6:"Rastreabilidade",
      btn_track:"Acompanhar pedido", btn_quote:"Cotar agora",
      hero_eyebrow:"Consultoria pública potencializada por IA",
      hero_h1:"Serviços de assessoria ao Estado, produtizados e com resultados rastreáveis.",
      hero_lead:"Projetos básico/executivo, políticas públicas, análise regulatória, gestão financeira e avaliação de comissões. Definimos os insumos, dimensionamos o trabalho e entregamos um produto profissional —com acompanhamento em tempo real— alinhado ao sistema nacional de investimento público e à lei de licitações do seu país, e às políticas do BID.",
      chip1:"✔ Cotação transparente em minutos", chip2:"✔ Pagamento seguro on-line", chip3:"✔ Entrega com rastreabilidade", chip4:"☕ Café Starbucks no seu escritório ao receber",
      cta_explore:"Explorar serviços", cta_how:"Ver como funciona",
      servicios_eyebrow:"Serviços", servicios_h1:"Escolha seu serviço, defina os insumos e obtenha uma cotação imediata",
      servicios_lead:"Cada serviço indica exatamente quais insumos precisamos. Com base neles dimensionamos o trabalho e calculamos um preço justo e transparente. Feito para servidores públicos, consultores independentes e empresas fornecedoras do Estado.",
      ctx_title:"Contexto normativo do país", ctx_sni:"Sistema nacional de investimento público", ctx_proc:"Lei / sistema de licitações",
      ctx_bid:"Linha multilateral BID (constante nos 26 países)", ctx_exp:"Projeto técnico / documento de execução",
      ctx_preinv:"Pré-investimento / formulação", ctx_ioarr:"Investimento menor / otimização (tipo IOARR)", ctx_fin:"Administração financeira",
      ctx_com:"Comissão de contratação / avaliação", ctx_air:"Análise de impacto regulatório", ctx_verified:"verificado", ctx_partial:"a verificar",
      ctx_note:"Equivalências mapeadas com fontes oficiais de cada país. Itens «a verificar» exigem confirmação na norma primária.",
      picker:"País / idioma"
    },
    en: {
      nav1:"AI Quote", nav2:"Services", nav3:"Data", nav4:"Control", nav5:"Process", nav6:"Tracking",
      btn_track:"Track my order", btn_quote:"Get a quote",
      hero_eyebrow:"Public-sector consulting powered by AI",
      hero_h1:"Advisory services to the State, productized and with traceable results.",
      hero_lead:"Detailed engineering designs, public policy, regulatory analysis, financial management and bid-committee support. We define the inputs, size the work and deliver a professional product —with real-time tracking— aligned to your country's public investment system and procurement law, and to IDB policies.",
      chip1:"✔ Transparent quote in minutes", chip2:"✔ Secure online payment", chip3:"✔ Delivery with tracking", chip4:"☕ Starbucks coffee to your office on delivery",
      cta_explore:"Explore services", cta_how:"See how it works",
      servicios_eyebrow:"Services", servicios_h1:"Pick your service, define the inputs and get an instant quote",
      servicios_lead:"Each service tells you exactly which inputs we need. Based on them we size the work and compute a fair, transparent price. Built for public officials, independent consultants and State-supplier firms.",
      ctx_title:"Country regulatory context", ctx_sni:"National public investment system", ctx_proc:"Procurement law / system",
      ctx_bid:"IDB multilateral track (constant across the 26 countries)", ctx_exp:"Technical file / execution document",
      ctx_preinv:"Pre-investment / formulation", ctx_ioarr:"Minor / optimization investment (IOARR-type)", ctx_fin:"Financial administration",
      ctx_com:"Bid / evaluation committee", ctx_air:"Regulatory impact assessment", ctx_verified:"verified", ctx_partial:"to verify",
      ctx_note:"Equivalences mapped against each country's official sources. Items marked “to verify” need confirmation in the primary law.",
      picker:"Country / language"
    },
    fr: {
      nav1:"Devis IA", nav2:"Services", nav3:"Données", nav4:"Contrôle", nav5:"Processus", nav6:"Suivi",
      btn_track:"Suivre ma commande", btn_quote:"Obtenir un devis",
      hero_eyebrow:"Conseil au secteur public propulsé par l'IA",
      hero_h1:"Services de conseil à l'État, produits et à résultats traçables.",
      hero_lead:"Dossiers techniques, politiques publiques, analyse réglementaire, gestion financière et appui aux commissions d'évaluation. Nous définissons les intrants, dimensionnons le travail et livrons un produit professionnel —avec suivi en temps réel— aligné sur le système national d'investissement public et la loi sur les marchés publics de votre pays, ainsi que sur les politiques de la BID.",
      chip1:"✔ Devis transparent en quelques minutes", chip2:"✔ Paiement en ligne sécurisé", chip3:"✔ Livraison avec suivi", chip4:"☕ Café Starbucks à votre bureau à la livraison",
      cta_explore:"Explorer les services", cta_how:"Voir comment ça marche",
      servicios_eyebrow:"Services", servicios_h1:"Choisissez votre service, définissez les intrants et obtenez un devis immédiat",
      servicios_lead:"Chaque service indique précisément les intrants nécessaires. Sur cette base, nous dimensionnons le travail et calculons un prix juste et transparent. Conçu pour les agents publics, les consultants indépendants et les entreprises prestataires de l'État.",
      ctx_title:"Contexte réglementaire du pays", ctx_sni:"Système national d'investissement public", ctx_proc:"Loi / système des marchés publics",
      ctx_bid:"Volet multilatéral BID (constant dans les 26 pays)", ctx_exp:"Dossier technique / document d'exécution",
      ctx_preinv:"Pré-investissement / formulation", ctx_ioarr:"Investissement mineur / optimisation (type IOARR)", ctx_fin:"Administration financière",
      ctx_com:"Commission d'évaluation des offres", ctx_air:"Analyse d'impact réglementaire", ctx_verified:"vérifié", ctx_partial:"à vérifier",
      ctx_note:"Équivalences établies à partir des sources officielles de chaque pays. Les éléments « à vérifier » nécessitent confirmation dans le texte primaire.",
      picker:"Pays / langue"
    }
  };

  /* ---------- Países prestatarios del BID (26) ----------
     s=sistema inversión, l=norma, o=órgano; p.l=ley compras, p.o=órgano, p.p=portal
     eq: preinv, exp, ioarr, fin, com, air ; v: 'ok'|'partial'  */
  const NO_IOARR = { es:"sin equivalente directo", pt:"sem equivalente direto", en:"no direct equivalent", fr:"pas d'équivalent direct", nl:"geen direct equivalent" };
  const C = {
    PE:{n:"Perú",lang:"es",f:"🇵🇪",v:"ok",
      sni:{s:"Invierte.pe — Programación Multianual y Gestión de Inversiones",l:"D. Leg. 1252 (2016)",o:"DGPMI — MEF"},
      proc:{l:"Ley 32069, Ley General de Contrataciones Públicas",o:"OECE",p:"SEACE / PLADICOP"},
      eq:{preinv:"Ficha técnica / estudio de preinversión",exp:"Expediente técnico o documento equivalente",ioarr:"IOARR (optimización, ampliación marginal, reposición, rehabilitación)",fin:"SIAF-SP",com:"Comité de selección",air:"AIR ex ante — PCM (D.S. 063-2021-PCM)"}},
    AR:{n:"Argentina",lang:"es",f:"🇦🇷",v:"ok",
      sni:{s:"Sistema Nacional de Inversiones Públicas (BAPIN)",l:"Ley 24.354",o:"Dir. Nac. de Inversión Pública"},
      proc:{l:"Régimen de Contrataciones — Decreto 1023/2001",o:"Oficina Nacional de Contrataciones",p:"COMPR.AR"},
      eq:{preinv:"Preinversión (carga en BAPIN)",exp:"Proyecto ejecutivo",ioarr:NO_IOARR.es,fin:"e-SIDIF",com:"Comisión Evaluadora",air:"AIR / Mejora Regulatoria (parcial)"}},
    BR:{n:"Brasil",lang:"pt",f:"🇧🇷",v:"ok",
      sni:{s:"PPA / SIOP (planejamento e orçamento)",l:"Art. 165 CF/1988",o:"Ministério do Planejamento e Orçamento"},
      proc:{l:"Lei 14.133/2021 (Nova Lei de Licitações)",o:"Ministério da Gestão",p:"PNCP / Compras.gov.br"},
      eq:{preinv:"Estudo técnico preliminar (ETP)",exp:"Projeto básico e projeto executivo",ioarr:NO_IOARR.pt,fin:"SIAFI",com:"Comissão de contratação / agente de contratação",air:"Análise de Impacto Regulatório (Lei 13.874/2019; Decreto 10.411/2020)"}},
    CL:{n:"Chile",lang:"es",f:"🇨🇱",v:"ok",
      sni:{s:"Sistema Nacional de Inversiones (SNI)",l:"D.L. 1.263 art. 19 bis; Ley 20.530",o:"MIDESOF + Hacienda (DIPRES)"},
      proc:{l:"Ley 19.886 (mod. Ley 21.634/2023)",o:"ChileCompra",p:"Mercado Público"},
      eq:{preinv:"Iniciativa de Inversión (IDI) / preinversión",exp:"Etapa de diseño (ingeniería)",ioarr:"Reposición / conservación (análogos)",fin:"SIGFE",com:"Comisión Evaluadora",air:"Evaluación regulatoria (parcial)"}},
    CO:{n:"Colombia",lang:"es",f:"🇨🇴",v:"ok",
      sni:{s:"SUIFP / Banco de Proyectos (BPIN)",l:"Ley 152/1994; Decreto 1082/2015",o:"DNP"},
      proc:{l:"Ley 80/1993 y Ley 1150/2007",o:"Colombia Compra Eficiente",p:"SECOP II"},
      eq:{preinv:"Formulación MGA / preinversión",exp:"Estudios y diseños (fase III)",ioarr:NO_IOARR.es,fin:"SIIF Nación",com:"Comité evaluador",air:"Análisis de Impacto Normativo (AIN)"}},
    EC:{n:"Ecuador",lang:"es",f:"🇪🇨",v:"ok",
      sni:{s:"SIPeIP / Plan Anual de Inversiones (PAI)",l:"COPLAFIP (2010)",o:"Sec. de Planificación + MEF"},
      proc:{l:"LOSNCP",o:"SERCOP",p:"SOCE (compraspublicas.gob.ec)"},
      eq:{preinv:"Estudios de preinversión",exp:"Estudios / diseño definitivo",ioarr:NO_IOARR.es,fin:"e-SIGEF",com:"Comisión Técnica",air:"—"}},
    VE:{n:"Venezuela",lang:"es",f:"🇻🇪",v:"partial",
      sni:{s:"Sistema Nacional de Planificación (LOPPP / LOAFSP)",l:"LOPPP; LOAFSP",o:"Min. de Planificación (MPPP)"},
      proc:{l:"Ley de Contrataciones Públicas (Decreto 1.399/2014)",o:"Servicio Nacional de Contrataciones (SNC)",p:"RNC / SNC"},
      eq:{preinv:"Formulación de proyectos / plan de inversión",exp:"Proyecto de ingeniería",ioarr:NO_IOARR.es,fin:"SIGECOF",com:"Comisión de Contrataciones",air:"—"}},
    MX:{n:"México",lang:"es",f:"🇲🇽",v:"partial",
      sni:{s:"Cartera de Programas y Proyectos de Inversión",l:"LFPRH art. 34 y 34 Bis",o:"Unidad de Inversiones — SHCP"},
      proc:{l:"LAASSP y LOPSRM (reforma DOF 16-04-2025)",o:"Sec. Anticorrupción y Buen Gobierno",p:"Compras MX (ex CompraNet)"},
      eq:{preinv:"Análisis Costo-Beneficio (ACB)",exp:"Proyecto ejecutivo",ioarr:NO_IOARR.es,fin:"SIAFF",com:"Comité de Adquisiciones",air:"AIR / MIR — CONAMER"}},
    BO:{n:"Bolivia",lang:"es",f:"🇧🇴",v:"ok",
      sni:{s:"SPIE — Inversión Pública (VIPFE)",l:"Ley 777/2016",o:"Min. de Planificación del Desarrollo"},
      proc:{l:"NB-SABS (D.S. 0181/2009)",o:"MEFP",p:"SICOES"},
      eq:{preinv:"Estudios de preinversión",exp:"Estudio de Diseño Técnico de Preinversión (EDTP)",ioarr:NO_IOARR.es,fin:"SIGEP",com:"Comisión de Calificación",air:"—"}},
    UY:{n:"Uruguay",lang:"es",f:"🇺🇾",v:"ok",
      sni:{s:"Sistema Nacional de Inversión Pública (SNIP)",l:"Ley 18.996",o:"OPP"},
      proc:{l:"TOCAF (Decreto 150/012)",o:"ARCE",p:"SICE / Compras Estatales"},
      eq:{preinv:"Preinversión (OPP)",exp:"Proyecto ejecutivo",ioarr:NO_IOARR.es,fin:"SIIF",com:"Comisión Asesora de Adjudicaciones",air:"Mejora regulatoria (parcial)"}},
    PY:{n:"Paraguay",lang:"es",f:"🇵🇾",v:"ok",
      sni:{s:"Sistema Nacional de Inversión Pública (SNIP)",l:"Ley 6490/2020",o:"MEF — DGIP"},
      proc:{l:"Ley 7021/2022 de Suministro y Contrataciones",o:"DNCP",p:"contrataciones.gov.py"},
      eq:{preinv:"Preinversión (Banco de Proyectos)",exp:"Proyecto ejecutivo / diseño final",ioarr:NO_IOARR.es,fin:"SIAF",com:"Comité de Evaluación",air:"—"}},
    CR:{n:"Costa Rica",lang:"es",f:"🇨🇷",v:"ok",
      sni:{s:"SNIP / Banco de Proyectos (BPIP)",l:"Ley 5525",o:"MIDEPLAN"},
      proc:{l:"Ley 9986, Contratación Pública",o:"Hacienda — Dir. de Contratación",p:"SICOP"},
      eq:{preinv:"Preinversión / formulación",exp:"Estudios de factibilidad y diseño final",ioarr:NO_IOARR.es,fin:"SIGAF",com:"Comisión de evaluación de ofertas",air:"AIR — Mejora Regulatoria (MEIC, Ley 8220)"}},
    PA:{n:"Panamá",lang:"es",f:"🇵🇦",v:"partial",
      sni:{s:"SINIP — Banco de Proyectos",l:"Decreto Ejecutivo 148/2001",o:"MEF — Dir. de Programación de Inversiones"},
      proc:{l:"Ley 22/2006 (reforma Ley 153/2020)",o:"DGCP",p:"PanamaCompra"},
      eq:{preinv:"Preinversión (Banco de Proyectos)",exp:"Estudios y diseños finales",ioarr:NO_IOARR.es,fin:"ISTMO",com:"Comisión evaluadora",air:"—"}},
    GT:{n:"Guatemala",lang:"es",f:"🇬🇹",v:"ok",
      sni:{s:"SNIP — Banco de Proyectos (SINIP)",l:"Decreto 101-97 (Ley Orgánica del Presupuesto)",o:"SEGEPLAN"},
      proc:{l:"Ley de Contrataciones (Decreto 57-92)",o:"MINFIN — DGAE",p:"Guatecompras"},
      eq:{preinv:"Preinversión",exp:"Estudios de factibilidad y diseño final",ioarr:NO_IOARR.es,fin:"SICOIN / SIGES",com:"Junta de Cotización / Licitación",air:"—"}},
    HN:{n:"Honduras",lang:"es",f:"🇭🇳",v:"ok",
      sni:{s:"Sistema Nacional de Inversión Pública (SNIPH)",l:"Ley Orgánica del Presupuesto",o:"SEFIN — DGIP"},
      proc:{l:"Ley de Contratación del Estado (Decreto 74-2001)",o:"ONCAE",p:"HonduCompras 2.0"},
      eq:{preinv:"Preinversión",exp:"Estudios y diseños finales",ioarr:NO_IOARR.es,fin:"SIAFI",com:"Comisión de Evaluación",air:"—"}},
    SV:{n:"El Salvador",lang:"es",f:"🇸🇻",v:"ok",
      sni:{s:"SNIP / Sistema de Información de Inversión Pública",l:"Ley AFI",o:"Hacienda — DGICP"},
      proc:{l:"Ley de Compras Públicas (D.L. 562/2023)",o:"DINAC",p:"COMPRASAL / SINAC"},
      eq:{preinv:"Preinversión",exp:"Carpeta técnica / diseños finales",ioarr:NO_IOARR.es,fin:"SAFI",com:"Comisión de Evaluación de Ofertas (CEO)",air:"—"}},
    NI:{n:"Nicaragua",lang:"es",f:"🇳🇮",v:"ok",
      sni:{s:"Sistema Nacional de Inversiones Públicas (SNIP)",l:"Ley 550; Decreto 61-2001",o:"MHCP"},
      proc:{l:"Ley 737 de Contrataciones Administrativas",o:"DGCE",p:"Nicaragua Compra"},
      eq:{preinv:"Preinversión",exp:"Estudios y diseños finales",ioarr:NO_IOARR.es,fin:"SIGFA",com:"Comité de Evaluación",air:"—"}},
    DO:{n:"República Dominicana",lang:"es",f:"🇩🇴",v:"ok",
      sni:{s:"Sistema Nacional de Inversión Pública (SNIP)",l:"Ley 498-06",o:"MEPyD — DGIP"},
      proc:{l:"Ley 340-06 de Compras y Contrataciones",o:"DGCP",p:"comprasdominicana"},
      eq:{preinv:"Preinversión / formulación",exp:"Estudios de factibilidad y diseño final",ioarr:NO_IOARR.es,fin:"SIGEF",com:"Comité de Compras y Contrataciones",air:"—"}},
    JM:{n:"Jamaica",lang:"en",f:"🇯🇲",v:"ok",
      sni:{s:"Public Investment Management System (PIMS) / PSIP",l:"Financial Administration & Audit (Amdt) Act 2014",o:"Ministry of Finance (PIMSEC)"},
      proc:{l:"Public Procurement Act, 2015",o:"OPPP / PPC",p:"GOJEP"},
      eq:{preinv:"Pre-investment / feasibility study",exp:"Detailed design & technical specifications",ioarr:NO_IOARR.en,fin:"CTMS / IFMIS",com:"Procurement / Evaluation Committee",air:"—"}},
    TT:{n:"Trinidad and Tobago",lang:"en",f:"🇹🇹",v:"ok",
      sni:{s:"Public Sector Investment Programme (PSIP)",l:"Capital budget (annual PSIP)",o:"Ministry of Planning"},
      proc:{l:"Public Procurement & Disposal of Public Property Act, 2015",o:"Office of Procurement Regulation (OPR)",p:"ProcureTT"},
      eq:{preinv:"Project preparation / feasibility",exp:"Detailed engineering design & specifications",ioarr:NO_IOARR.en,fin:"IFMIS",com:"Evaluation / Tenders Committee",air:"—"}},
    BS:{n:"Bahamas",lang:"en",f:"🇧🇸",v:"partial",
      sni:{s:"Public Sector Investment Programme (capital budget)",l:"Public Finance Management framework",o:"Ministry of Finance"},
      proc:{l:"Public Procurement Act, 2023",o:"MoF — Public Procurement Dept.",p:"ePSR (suppliers.gov.bs)"},
      eq:{preinv:"Project concept / feasibility",exp:"Detailed design & specifications",ioarr:NO_IOARR.en,fin:"PFM system",com:"Evaluation / Tenders Committee",air:"—"}},
    BB:{n:"Barbados",lang:"en",f:"🇧🇧",v:"ok",
      sni:{s:"Public Sector Investment Programme (Public Investment Unit)",l:"Capital budget",o:"Ministry of Finance (MFEI)"},
      proc:{l:"Public Procurement Act, 2021",o:"Government Procurement Dept. / CPO",p:"procure.gov.bb"},
      eq:{preinv:"Project appraisal / feasibility",exp:"Detailed engineering design & specifications",ioarr:NO_IOARR.en,fin:"SmartStream (IFMIS)",com:"Evaluation Committee",air:"—"}},
    GY:{n:"Guyana",lang:"en",f:"🇬🇾",v:"ok",
      sni:{s:"Public Sector Investment Programme (PSIP)",l:"Fiscal Management & Accountability Act 2003",o:"Ministry of Finance (State Planning Sec.)"},
      proc:{l:"Procurement Act 2003",o:"NPTAB / PPC",p:"npta.gov.gy"},
      eq:{preinv:"Project preparation / feasibility",exp:"Detailed engineering design & BoQ",ioarr:NO_IOARR.en,fin:"IFMAS",com:"Evaluation Committee / Tender Boards",air:"—"}},
    BZ:{n:"Belize",lang:"en",f:"🇧🇿",v:"ok",
      sni:{s:"Public Sector Investment Programme (PSIP)",l:"Planning framework (Policy & Planning Unit)",o:"Ministry of Economic Development"},
      proc:{l:"Finance and Audit (Reform) Act (Ch. 15)",o:"MoF / Contractor General",p:"—"},
      eq:{preinv:"Project identification / feasibility",exp:"Detailed engineering design / final design",ioarr:NO_IOARR.en,fin:"SmartStream IFMIS",com:"Evaluation / Tender Committee",air:"—"}},
    HT:{n:"Haïti",lang:"fr",f:"🇭🇹",v:"ok",
      sni:{s:"Programme d'Investissements Publics (PIP)",l:"Cadre de planification nationale",o:"MPCE"},
      proc:{l:"Loi du 10 juin 2009 sur les marchés publics",o:"CNMP",p:"cnmp.gouv.ht"},
      eq:{preinv:"Identification / formulation ; étude de faisabilité",exp:"Dossier technique / APD (avant-projet détaillé)",ioarr:NO_IOARR.fr,fin:"SYSDEP / SYSGEP",com:"Commission d'évaluation des offres",air:"—"}},
    SR:{n:"Suriname",lang:"en",f:"🇸🇷",v:"partial",
      sni:{s:"Meerjaren Ontwikkelingsplan (MOP) 2022-2026 — public investment plan",l:"Art. 40 Constitution",o:"Ministry of Finance & Planning / SPS"},
      proc:{l:"Aanbestedingswet 2023 (Procurement Act)",o:"NROA (Procurement Authority)",p:"—"},
      eq:{preinv:"Project preparation / feasibility study (MOP)",exp:"Technical dossier / design & bestek (bidding docs)",ioarr:NO_IOARR.en,fin:"Government financial management",com:"Evaluation / tender committee",air:"—"}}
  };
  // Orden de países por grupo de idioma para el selector
  const GROUPS = [
    ["Español", ["PE","AR","BO","CL","CO","CR","DO","EC","SV","GT","HN","MX","NI","PA","PY","UY","VE"]],
    ["Português", ["BR"]],
    ["English", ["JM","TT","BS","BB","GY","BZ","SR"]],
    ["Français", ["HT"]]
  ];

  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[m]));
  const t = (lang, k) => (I18N[lang] && I18N[lang][k]) || I18N.es[k] || "";

  function applyLang(lang) {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const k = el.getAttribute("data-i18n");
      const v = t(lang, k);
      if (v) el.textContent = v;
    });
    try { document.documentElement.lang = lang; } catch (_) {}
    const sel = document.getElementById("paisSel");
    if (sel) sel.setAttribute("aria-label", t(lang, "picker"));
  }

  function renderCtx(iso) {
    const c = C[iso]; if (!c) return;
    const L = c.lang, box = document.getElementById("paisCtx");
    if (!box) return;
    const vlabel = c.v === "ok" ? t(L,"ctx_verified") : t(L,"ctx_partial");
    const vcls = c.v === "ok" ? "ok" : "warn";
    const row = (label, val) => `<div class="pc-row"><span class="pc-k">${esc(label)}</span><span class="pc-v">${esc(val)}</span></div>`;
    box.innerHTML = `
      <div class="pc-head">
        <span class="pc-flag">${c.f}</span>
        <strong>${esc(c.n)}</strong>
        <span class="pc-badge ${vcls}">${esc(vlabel)}</span>
        <span class="pc-title">${esc(t(L,"ctx_title"))}</span>
      </div>
      <div class="pc-grid">
        ${row(t(L,"ctx_sni"), c.sni.s + " · " + c.sni.l + " · " + c.sni.o)}
        ${row(t(L,"ctx_proc"), c.proc.l + " · " + c.proc.o + (c.proc.p && c.proc.p!=="—" ? " · " + c.proc.p : ""))}
        ${row(t(L,"ctx_exp"), c.eq.exp)}
        ${row(t(L,"ctx_preinv"), c.eq.preinv)}
        ${row(t(L,"ctx_ioarr"), c.eq.ioarr)}
        ${row(t(L,"ctx_fin"), c.eq.fin)}
        ${row(t(L,"ctx_com"), c.eq.com)}
        ${row(t(L,"ctx_air"), c.eq.air || "—")}
        ${row(t(L,"ctx_bid"), "GN-2349-15 (bienes y obras) · GN-2350-15 (consultoría) · PEP/POA/ISP · desembolsos/EFA · salvaguardias")}
      </div>
      <p class="pc-note">${esc(t(L,"ctx_note"))}</p>`;
  }

  function applyCountry(iso) {
    const c = C[iso]; if (!c) return;
    try { localStorage.setItem("andes_pais", iso); } catch (_) {}
    window.__pais = iso; window.__lang = c.lang;
    applyLang(c.lang);
    const cp = document.getElementById("ctxPais");
    if (cp) cp.textContent = c.n;
    renderCtx(iso);
  }

  function buildSelector() {
    const sel = document.getElementById("paisSel");
    if (!sel) return;
    let html = "";
    GROUPS.forEach(([g, list]) => {
      html += `<optgroup label="${esc(g)}">`;
      list.forEach(iso => { const c = C[iso]; if (c) html += `<option value="${iso}">${c.f} ${esc(c.n)}</option>`; });
      html += `</optgroup>`;
    });
    sel.innerHTML = html;
    sel.addEventListener("change", () => applyCountry(sel.value));
  }

  function init() {
    buildSelector();
    let iso = "PE";
    try { const s = localStorage.getItem("andes_pais"); if (s && C[s]) iso = s; } catch (_) {}
    const sel = document.getElementById("paisSel");
    if (sel) sel.value = iso;
    applyCountry(iso);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
