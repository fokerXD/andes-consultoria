/* ============================================================
   /api/panel — Pedidos completos, con llave
   ------------------------------------------------------------
   GET   → lista los pedidos recientes
   POST  → avanza la etapa de un pedido  {code, etapa, nota}

   La llave viaja en la cabecera Authorization, nunca en la URL:
   una llave en la barra de direcciones acaba en los registros del
   servidor, en el historial y en los "referer" de terceros.
   ============================================================ */

import { listar, avanzar, hayAlmacen } from "./_pedidos.js";

export default async function handler(req, res) {
  const esperada = process.env.ADMIN_KEY || "";
  const enviada = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");

  if (!esperada) return res.status(503).json({ error: "El panel no está configurado (falta ADMIN_KEY)." });
  if (!enviada || !igual(enviada, esperada)) {
    res.setHeader("WWW-Authenticate", 'Bearer realm="panel"');
    return res.status(401).json({ error: "Llave incorrecta." });
  }
  if (!hayAlmacen()) return res.status(503).json({ error: "El registro de pedidos no está configurado." });

  res.setHeader("Cache-Control", "no-store");

  if (req.method === "POST") {
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const code = String(b.code || "").trim().toUpperCase();
    const etapa = Number(b.etapa);
    if (!/^ACI-[A-Z0-9]{3,10}$/.test(code)) return res.status(400).json({ error: "Código no válido." });
    if (!(etapa >= 1 && etapa <= 6)) return res.status(400).json({ error: "Etapa fuera de rango (1-6)." });
    const r = await avanzar(code, etapa, b.nota);
    return res.status(r.ok ? 200 : 400).json(r);
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Método no permitido" });
  }

  const pedidos = await listar(200);
  const total = pedidos.reduce((a, p) => { const m = p.moneda || "PEN"; a[m] = (a[m] || 0) + (Number(p.monto) || 0); return a; }, {});
  return res.status(200).json({ pedidos, cuenta: pedidos.length, total });
}

/* Comparación en tiempo constante: una comparación normal filtra la
   llave carácter a carácter midiendo cuánto tarda en fallar. */
function igual(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
