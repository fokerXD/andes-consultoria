/* ===========================================================
   legal-config.js — Datos de la empresa para las páginas legales
   -----------------------------------------------------------
   ►►► LO ÚNICO QUE TIENES QUE EDITAR ESTÁ AQUÍ ABAJO. ◄◄◄

   Completa los 5 campos. En cuanto los cinco tengan valor:
     · desaparece el aviso "⚠️ Plantilla referencial"
     · desaparece el resaltado naranja de los placeholders
     · las páginas quedan publicables

   Mientras algún campo esté vacío, el aviso se mantiene visible
   a propósito: es preferible a publicar datos inventados.
   =========================================================== */
window.ACI_LEGAL = {
  razonSocial:      "",                              // Ej: "Andes Consultoría Inteligente S.A.C."
  ruc:              "",                              // Ej: "20XXXXXXXXX"
  domicilio:        "",                              // Ej: "Av. Ejemplo 123, Of. 401, San Isidro, Lima"
  distritoJudicial: "Lima",
  emailDatos:       "contacto@andesconsultoria.pe",  // responsable de datos personales
  actualizado:      "31 de julio de 2026"
};

/* ---------- de aquí para abajo no hace falta tocar nada ---------- */
(function () {
  "use strict";
  function apply() {
    var c = window.ACI_LEGAL || {};
    var map = {
      "razon-social": c.razonSocial,
      "ruc": c.ruc,
      "domicilio": c.domicilio,
      "distrito-judicial": c.distritoJudicial,
      "email-datos": c.emailDatos,
      "actualizado": c.actualizado
    };

    Object.keys(map).forEach(function (key) {
      var val = (map[key] || "").trim();
      document.querySelectorAll('[data-legal="' + key + '"]').forEach(function (el) {
        if (val) el.textContent = val;
      });
    });

    // Campos imprescindibles para que el documento sea publicable.
    var required = ["razonSocial", "ruc", "domicilio", "emailDatos", "actualizado"];
    var complete = required.every(function (k) { return (c[k] || "").trim().length > 0; });
    if (complete) document.documentElement.classList.add("legal-ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply);
  else apply();
})();
