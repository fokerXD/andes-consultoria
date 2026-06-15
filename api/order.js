/* ============================================================
   /api/order  —  Función serverless (Vercel, Node 18+)
   1) Crea el cargo en Culqi con el token recibido (si hay llave secreta).
   2) Genera el pedido con código de seguimiento.
   3) Envía el comprobante + código al correo del cliente (si hay Resend).
   Si faltan las variables de entorno, opera en MODO DEMO (simula).

   Variables de entorno (Vercel → Settings → Environment Variables):
   - CULQI_SECRET_KEY   (sk_test_... o sk_live_...)   [opcional en demo]
   - RESEND_API_KEY     (re_...)                       [opcional en demo]
   - FROM_EMAIL         (ej: "Andes <hola@tudominio.pe>") [opcional]
   ============================================================ */

const PEN = n => "S/ " + Math.round(n).toLocaleString("es-PE");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }

  const body = typeof req.body === "string" ? safeJSON(req.body) : (req.body || {});
  const { code, name, email, token, serviceName, amount, days, demo, note, files } = body;

  if (!email || !serviceName || !amount) {
    return res.status(400).json({ error: "Datos incompletos del pedido." });
  }

  const trackingCode = code || ("ACI-" + Math.floor(1000 + Math.random() * 9000));
  const result = { code: trackingCode, charged: false, emailed: false, demo: !!demo };

  /* ---- 1) Cargo en Culqi (solo si hay llave y token real) ---- */
  const sk = process.env.CULQI_SECRET_KEY;
  if (sk && token && !String(token).startsWith("tkn_demo") && !demo) {
    try {
      const chg = await fetch("https://api.culqi.com/v2/charges", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + sk },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // céntimos
          currency_code: "PEN",
          email,
          source_id: token,
          description: `Andes — ${serviceName}`.slice(0, 80),
          metadata: { tracking: trackingCode, service: serviceName }
        })
      });
      const data = await chg.json();
      if (!chg.ok) {
        return res.status(402).json({ error: data.user_message || data.merchant_message || "El cargo fue rechazado.", details: data });
      }
      result.charged = true;
      result.chargeId = data.id;
    } catch (err) {
      return res.status(502).json({ error: "No se pudo procesar el cargo en Culqi.", message: String(err) });
    }
  }

  /* ---- 2) + 3) Envío del comprobante por correo (si hay Resend) ---- */
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const from = process.env.FROM_EMAIL || "Andes Consultoría <onboarding@resend.dev>";
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + resendKey },
        body: JSON.stringify({
          from,
          to: [email],
          subject: `Andes Consultoría — Pedido ${trackingCode} confirmado`,
          html: emailHTML({ trackingCode, name, serviceName, amount, days, note, files })
        })
      });
      if (r.ok) result.emailed = true;
    } catch (_) { /* no bloquea la confirmación */ }
  }

  return res.status(200).json(result);
}

function safeJSON(s) { try { return JSON.parse(s); } catch (_) { return {}; } }

function emailHTML({ trackingCode, name, serviceName, amount, days, note, files }) {
  const noteBlock = note ? `<tr><td colspan="2" style="padding:10px 0"><div style="color:#5C6B7A;font-size:13px">Indicaciones del cliente</div><div style="margin-top:4px">${escapeHtml(note)}</div></td></tr>` : "";
  const filesBlock = (files && files.length)
    ? `<tr><td colspan="2" style="padding:10px 0"><div style="color:#5C6B7A;font-size:13px">Archivos remitidos (${files.length})</div><ul style="margin:6px 0 0;padding-left:18px">${files.map(f => `<li>${escapeHtml(f.name)}</li>`).join("")}</ul></td></tr>`
    : "";
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;color:#13202E">
    <div style="background:#0E2A47;color:#fff;padding:22px 24px;border-radius:14px 14px 0 0">
      <h2 style="margin:0;font-family:Georgia,serif">Andes Consultoría Inteligente</h2>
      <p style="margin:6px 0 0;color:#cfe0ef">Confirmación de pedido</p>
    </div>
    <div style="border:1px solid #E5E0D6;border-top:none;border-radius:0 0 14px 14px;padding:24px">
      <p>Hola ${escapeHtml(name || "")},</p>
      <p>Recibimos tu solicitud del servicio <b>${escapeHtml(serviceName)}</b>. Ya está en cola de elaboración.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px 0;color:#5C6B7A">Código de seguimiento</td><td style="text-align:right"><b>${trackingCode}</b></td></tr>
        <tr><td style="padding:8px 0;color:#5C6B7A">Total</td><td style="text-align:right"><b>${PEN(amount)}</b> (IGV incl.)</td></tr>
        <tr><td style="padding:8px 0;color:#5C6B7A">Plazo estimado</td><td style="text-align:right">${days} días hábiles</td></tr>
        ${noteBlock}
        ${filesBlock}
      </table>
      <p style="background:#f3ece5;border-radius:10px;padding:14px 16px;font-size:14px">
        Sigue el avance de tu servicio por hitos ingresando tu código en la sección
        <b>Trazabilidad</b> de nuestra web. Te entregaremos el producto final por este medio
        al completar el control de calidad.</p>
      <p style="color:#5C6B7A;font-size:12px;margin-top:20px">Pago procesado de forma segura por Culqi · Datos protegidos conforme a la Ley N.° 29733.</p>
    </div>
  </div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
