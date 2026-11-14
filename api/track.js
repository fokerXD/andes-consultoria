/* ============================================================
   /api/track — Consulta pública de un pedido por su código
   ------------------------------------------------------------
   El seguimiento vivía en el localStorage del navegador que hizo
   el pedido. El mismo cliente, abriendo el correo en su teléfono,
   no encontraba nada. Ahora el pedido se consulta del registro.

   PRIVACIDAD: el código es de la forma ACI-1234, o sea enumerable.
   Por eso esta ruta devuelve SOLO el avance —servicio, etapa,
   plazo, fechas— y nunca el correo, la entidad, las indicaciones
   ni los archivos del cliente. Quien adivine un código no obtiene
   datos de nadie. Lo reservado se ve en el panel, con llave.
   ============================================================ */

import { leer, hayAlmacen } from "./_pedidos.js";

export default async function handler(req, res) {
  const code = String((req.query && req.query.code) || "").trim().toUpperCase();
  if (!/^ACI-[A-Z0-9]{3,10}$/.test(code)) {
    return res.status(400).json({ error: "Código no válido." });
  }
  if (!hayAlmacen()) {
    return res.status(503).json({ error: "El registro de pedidos no está configurado.", sinRegistro: true });
  }

  const p = await leer(code);
  if (!p) return res.status(404).json({ error: "No encontramos ese pedido." });

  /* Proyección deliberadamente pobre: solo lo que el propio cliente
     ya sabe de su pedido y necesita para seguirlo. */
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    code: p.code,
    serviceKey: p.servicio && p.servicio.key || null,
    serviceName: p.servicio && p.servicio.nombre || "",
    stage: p.stage || 1,
    days: p.dias || null,
    speed: p.velocidad || "std",
    moneda: p.moneda || "PEN",
    total: p.monto || null,
    via: p.via,
    estadoPago: p.estadoPago,
    creado: p.creado,
    actualizado: p.actualizado || p.creado,
    hitos: (p.historial || []).map(h => ({ etapa: h.etapa, nota: h.nota, ts: h.ts }))
  });
}
