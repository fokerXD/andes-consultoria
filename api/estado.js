/* ============================================================
   /api/estado — Diagnóstico del embudo
   ------------------------------------------------------------
   Responde, sin adivinar, qué parte del circuito comercial está
   viva: cobro, correo al cliente, aviso interno, registro y panel.
   Sirve para comprobar de un vistazo si una llave quedó bien
   puesta, y para que una tarea programada avise si algo se cae.

   No devuelve el valor de ninguna llave: solo si está presente.
   ============================================================ */

import { estado } from "./_pedidos.js";

export default async function handler(req, res) {
  const e = estado();
  const faltan = [];
  if (e.registro !== "activo")      faltan.push({ que: "BLOB_READ_WRITE_TOKEN", como: "Vercel → Storage → Create Database → Blob → conectar al proyecto" });
  if (e.correo !== "activo")        faltan.push({ que: "RESEND_API_KEY", como: "resend.com → API Keys" });
  if (e.aviso_interno !== "activo") faltan.push({ que: "NOTIFY_EMAIL", como: "tu correo, para enterarte de cada pedido" });
  if (e.cobro !== "activo")         faltan.push({ que: "CULQI_SECRET_KEY", como: "culqi.com → Desarrollo → Llaves (sk_live_…)" });
  if (e.panel !== "activo")         faltan.push({ que: "ADMIN_KEY", como: "una frase larga que inventes; abre /panel.html" });

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    ...e,
    faltan,
    resumen: e.operativo
      ? "El embudo registra y notifica."
      : "El embudo NO está operativo: los pedidos no se registran o no se avisan."
  });
}
