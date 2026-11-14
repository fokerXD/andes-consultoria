/* ============================================================
   /api/order  —  Registro y confirmación de un pedido
   ------------------------------------------------------------
   Antes esta función cobraba, escribía al cliente y se olvidaba:
   el pedido no quedaba en ninguna parte y el titular del negocio
   nunca se enteraba de que había entrado uno. Ahora:

     1) Cobra en Culqi si el pedido es con tarjeta y hay llave.
     2) ARCHIVA el pedido, de modo que se pueda consultar desde
        cualquier dispositivo y aparezca en el panel.
     3) Escribe al cliente su confirmación.
     4) AVISA al titular, con los datos para empezar a trabajar.

   También atiende la vía "os": la propuesta formal que usan las
   entidades fuera del Perú. Esa vía no pasaba por aquí, así que
   toda la línea regional entraba y se perdía en silencio.

   Variables de entorno (Vercel → Settings → Environment Variables):
     CULQI_SECRET_KEY        sk_test_… / sk_live_…   cobro con tarjeta
     RESEND_API_KEY          re_…                    envío de correo
     FROM_EMAIL              "Andes <hola@tudominio>" remitente verificado
     NOTIFY_EMAIL            tu correo               a dónde te avisamos
     BLOB_READ_WRITE_TOKEN   la crea Vercel al conectar el Blob Store
   ============================================================ */

import { guardar, estado, money } from "./_pedidos.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }

  const body = typeof req.body === "string" ? safeJSON(req.body) : (req.body || {});
  const {
    code, name, email, token, serviceKey, serviceName, amount, days, demo, note, files,
    moneda, metodo, pais, idioma, entidad, ruc, area, funcionario, speed, values
  } = body;

  if (!email || !serviceName || !amount) {
    return res.status(400).json({ error: "Datos incompletos del pedido." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return res.status(400).json({ error: "Correo no válido." });
  }

  const esPropuesta = metodo === "os";
  const divisa = moneda === "USD" ? "USD" : "PEN";
  const trackingCode = code || ("ACI-" + Math.floor(1000 + Math.random() * 9000));
  const result = { code: trackingCode, charged: false, emailed: false, notified: false, stored: false, demo: !!demo };

  /* ---- 1) Cobro en Culqi — solo tarjeta, solo soles ----
     Culqi liquida en PEN. Un pedido en dólares nunca llega aquí:
     su vía es la propuesta formal. */
  const sk = process.env.CULQI_SECRET_KEY;
  if (!esPropuesta && sk && token && !String(token).startsWith("tkn_demo") && !demo) {
    if (divisa !== "PEN") {
      return res.status(400).json({ error: "El cobro con tarjeta solo está disponible en soles." });
    }
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

  /* ---- 2) Archivo del pedido ----
     Va antes de los correos a propósito: si el envío falla, el
     pedido ya existe y se puede recuperar. Al revés no. */
  const pedido = {
    code: trackingCode,
    creado: Date.now(),
    actualizado: Date.now(),
    stage: 1,
    estadoPago: result.charged ? "pagado" : (esPropuesta ? "propuesta" : "pendiente"),
    chargeId: result.chargeId || null,
    via: esPropuesta ? "propuesta_formal" : "tarjeta",
    cliente: { nombre: name || "", email, pais: pais || null, idioma: idioma || null },
    entidad: esPropuesta ? { nombre: entidad || "", ruc: ruc || "", area: area || "", funcionario: funcionario || "" } : null,
    servicio: { key: serviceKey || null, nombre: serviceName, valores: values || null },
    monto: Number(amount), moneda: divisa,
    dias: Number(days) || null, velocidad: speed || "std",
    nota: note || "",
    archivos: Array.isArray(files) ? files.map(f => ({ name: String(f.name || "").slice(0, 160), size: f.size || null })) : [],
    historial: [{ etapa: 1, nota: "Pedido recibido", ts: Date.now() }]
  };

  const archivo = await guardar(pedido);
  result.stored = archivo.ok;
  if (!archivo.ok) result.storeReason = archivo.motivo;

  /* ---- 3) y 4) Correos ---- */
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL || "Andes Consultoría <onboarding@resend.dev>";
  const aviso = (process.env.NOTIFY_EMAIL || "").trim();

  if (resendKey) {
    result.emailed = await enviar(resendKey, {
      from, to: [email],
      subject: `Andes Consultoría — ${esPropuesta ? "Propuesta" : "Pedido"} ${trackingCode}`,
      html: correoCliente(pedido, esPropuesta)
    });

    /* El aviso interno es lo que convierte la web en un negocio:
       sin esto, un pedido de madrugada no se descubre hasta que
       alguien mira el panel de Culqi por casualidad. */
    if (aviso) {
      result.notified = await enviar(resendKey, {
        from, to: [aviso], reply_to: email,
        subject: `${esPropuesta ? "Propuesta" : "Pedido"} ${trackingCode} · ${money(pedido.monto, divisa)} · ${serviceName}`.slice(0, 120),
        html: correoInterno(pedido, esPropuesta, result)
      });
    }
  }

  result.estado = estado();
  return res.status(200).json(result);
}

/* ---------- Envío ---------- */
async function enviar(key, payload) {
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify(payload)
    });
    return r.ok;
  } catch (_) { return false; }
}

function safeJSON(s) { try { return JSON.parse(s); } catch (_) { return {}; } }

/* ---------- Correo al cliente ---------- */
function correoCliente(p, esPropuesta) {
  const fila = (k, v) => `<tr><td style="padding:8px 0;color:#5C6B7A">${k}</td><td style="text-align:right"><b>${v}</b></td></tr>`;
  const nota = p.nota ? `<tr><td colspan="2" style="padding:10px 0"><div style="color:#5C6B7A;font-size:13px">Indicaciones</div><div style="margin-top:4px">${esc(p.nota)}</div></td></tr>` : "";
  const arch = p.archivos.length
    ? `<tr><td colspan="2" style="padding:10px 0"><div style="color:#5C6B7A;font-size:13px">Archivos remitidos (${p.archivos.length})</div><ul style="margin:6px 0 0;padding-left:18px">${p.archivos.map(f => `<li>${esc(f.name)}</li>`).join("")}</ul></td></tr>`
    : "";
  const cierre = esPropuesta
    ? `Te enviaremos la propuesta formal y los términos de referencia para que tu entidad los tramite por su vía de contratación habitual. El pago se acuerda contra la propuesta aceptada.`
    : `Sigue el avance por hitos ingresando tu código en la sección <b>Trazabilidad</b> de la web. Te entregaremos el producto final por este medio al completar el control de calidad.`;
  return envoltura(`
    <p>Hola ${esc(p.cliente.nombre || "")},</p>
    <p>Recibimos tu solicitud del servicio <b>${esc(p.servicio.nombre)}</b>.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      ${fila("Código de seguimiento", p.code)}
      ${fila("Total", money(p.monto, p.moneda) + (p.moneda === "PEN" ? " (IGV incl.)" : " (referencial)"))}
      ${p.dias ? fila("Plazo estimado", p.dias + " días hábiles") : ""}
      ${nota}${arch}
    </table>
    <p style="background:#f3ece5;border-radius:10px;padding:14px 16px;font-size:14px">${cierre}</p>
    <p style="color:#5C6B7A;font-size:12px;margin-top:20px">${p.moneda === "PEN" ? "Pago procesado de forma segura por Culqi · " : ""}Datos tratados conforme a la normativa de protección de datos aplicable.</p>
  `, esPropuesta ? "Confirmación de solicitud" : "Confirmación de pedido");
}

/* ---------- Aviso interno ---------- */
function correoInterno(p, esPropuesta, r) {
  const fila = (k, v) => `<tr><td style="padding:6px 12px 6px 0;color:#5C6B7A;white-space:nowrap">${k}</td><td><b>${v}</b></td></tr>`;
  const ent = p.entidad
    ? fila("Entidad", esc(p.entidad.nombre)) + fila("Identificación", esc(p.entidad.ruc)) +
      fila("Área usuaria", esc(p.entidad.area)) + fila("Responsable", esc(p.entidad.funcionario))
    : "";
  const alertas = [];
  if (!r.stored) alertas.push("⚠ No se pudo archivar este pedido" + (r.storeReason ? ` (${esc(r.storeReason)})` : "") + ". Cópialo de este correo: es el único registro.");
  if (!esPropuesta && !r.charged) alertas.push("⚠ No se cobró: la pasarela está en modo demostración o el pedido llegó sin token.");
  return envoltura(`
    <p style="margin:0 0 14px;font-size:15px"><b>${esPropuesta ? "Nueva solicitud de propuesta formal" : "Nuevo pedido pagado"}</b></p>
    ${alertas.length ? `<div style="background:#FDF0E6;border-left:3px solid #C2602F;padding:10px 14px;border-radius:0 8px 8px 0;font-size:13px;margin-bottom:14px">${alertas.join("<br>")}</div>` : ""}
    <table style="border-collapse:collapse;font-size:14px">
      ${fila("Código", p.code)}
      ${fila("Servicio", esc(p.servicio.nombre))}
      ${fila("Monto", money(p.monto, p.moneda))}
      ${p.dias ? fila("Plazo", p.dias + " días hábiles · " + p.velocidad) : ""}
      ${fila("Contacto", esc(p.cliente.nombre) + " &lt;" + esc(p.cliente.email) + "&gt;")}
      ${p.cliente.pais ? fila("País", p.cliente.pais + (p.cliente.idioma ? " · " + p.cliente.idioma : "")) : ""}
      ${ent}
      ${p.nota ? fila("Indicaciones", esc(p.nota)) : ""}
      ${p.archivos.length ? fila("Archivos", p.archivos.map(f => esc(f.name)).join(", ")) : ""}
    </table>
    <p style="font-size:13px;color:#5C6B7A;margin-top:18px">Responder a este correo escribe directamente al cliente.</p>
  `, "Aviso interno");
}

function envoltura(cuerpo, subtitulo) {
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:580px;margin:auto;color:#13202E">
    <div style="background:#0E2A47;color:#fff;padding:22px 24px;border-radius:14px 14px 0 0">
      <h2 style="margin:0;font-family:Georgia,serif">Andes Consultoría Inteligente</h2>
      <p style="margin:6px 0 0;color:#cfe0ef">${subtitulo}</p>
    </div>
    <div style="border:1px solid #E5E0D6;border-top:none;border-radius:0 0 14px 14px;padding:24px">${cuerpo}</div>
  </div>`;
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
