/* ============================================================
   api/_pedidos.js — Registro de pedidos
   ------------------------------------------------------------
   Antes de esto, un pedido no existía en ninguna parte: /api/order
   cobraba, mandaba un correo al cliente y devolvía 200. Ni se
   guardaba, ni Jorge se enteraba, y el seguimiento vivía en el
   localStorage del navegador que hizo el pedido, así que el mismo
   cliente no podía consultarlo desde su teléfono.

   Este módulo es la única puerta al almacenamiento. Detecta solo
   con qué cuenta y lo dice: si falta algo, el sitio NO finge que
   funcionó. Un pedido que no se pudo guardar se reporta como tal.

   Variables de entorno (Vercel → Settings → Environment Variables):
     BLOB_READ_WRITE_TOKEN   la crea Vercel al conectar un Blob Store
                             al proyecto. No se escribe a mano.
   ============================================================ */

const PREFIJO = "pedidos/";

/* El SDK se importa de forma perezosa y tolerante: si la dependencia
   no está instalada todavía, el sitio sigue en pie y el estado lo
   reporta, en vez de caerse con un error de módulo. */
let _blob = null, _blobIntento = false;
async function blob() {
  if (_blobIntento) return _blob;
  _blobIntento = true;
  try { _blob = await import("@vercel/blob"); }
  catch (_) { _blob = null; }
  return _blob;
}

export function hayAlmacen() { return !!process.env.BLOB_READ_WRITE_TOKEN; }

/* ---------- Guardar ----------
   Devuelve {ok, motivo}. Nunca lanza: un fallo al archivar no debe
   tumbar un cobro que ya se hizo. */
export async function guardar(pedido) {
  if (!hayAlmacen()) return { ok: false, motivo: "sin_almacen" };
  const b = await blob();
  if (!b) return { ok: false, motivo: "sin_sdk" };
  try {
    await b.put(PREFIJO + pedido.code + ".json", JSON.stringify(pedido, null, 2), {
      access: "private",           // el almacén es privado: leerlo exige token
      addRandomSuffix: false,      // la ruta debe ser predecible para poder leerla
      contentType: "application/json",
      allowOverwrite: true,
      cacheControlMaxAge: 0
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, motivo: String(e && e.message || e).slice(0, 160) };
  }
}

/* ---------- Leer un pedido por su código ---------- */
export async function leer(code) {
  if (!hayAlmacen()) return null;
  const b = await blob();
  if (!b) return null;
  try {
    /* En un almacén privado la URL no se puede pedir a secas: hay que
       leer por get(), que autentica con el token. useCache:false evita
       servir una versión cacheada tras avanzar una etapa. */
    const r = await b.get(PREFIJO + code + ".json", { access: "private", useCache: false });
    if (!r || !r.stream) return null;
    return JSON.parse(await new Response(r.stream).text());
  } catch (_) { return null; }
}

/* ---------- Listar los más recientes (para el panel) ---------- */
export async function listar(limite = 100) {
  if (!hayAlmacen()) return [];
  const b = await blob();
  if (!b) return [];
  try {
    const { blobs } = await b.list({ prefix: PREFIJO, limit: Math.min(1000, limite) });
    const orden = blobs.sort((a, z) => new Date(z.uploadedAt) - new Date(a.uploadedAt)).slice(0, limite);
    const out = [];
    for (const item of orden) {
      try {
        const r = await b.get(item.pathname, { access: "private", useCache: false });
        if (r && r.stream) out.push(JSON.parse(await new Response(r.stream).text()));
      } catch (_) { /* un pedido ilegible no debe ocultar los demás */ }
    }
    return out;
  } catch (_) { return []; }
}

/* ---------- Actualizar la etapa de un pedido ---------- */
export async function avanzar(code, etapa, nota) {
  const p = await leer(code);
  if (!p) return { ok: false, motivo: "no_existe" };
  p.stage = Number(etapa);
  p.historial = p.historial || [];
  p.historial.push({ etapa: p.stage, nota: nota || "", ts: Date.now() });
  p.actualizado = Date.now();
  return await guardar(p);
}

/* ---------- Estado del embudo ----------
   Lo consume /api/estado. Sirve para saber, sin adivinar, qué parte
   del circuito está viva. Nunca devuelve el valor de una llave:
   solo si está puesta. */
export function estado() {
  const culqi  = !!process.env.CULQI_SECRET_KEY;
  const resend = !!process.env.RESEND_API_KEY;
  const almacen = hayAlmacen();
  const avisos = !!(process.env.NOTIFY_EMAIL || "").trim();
  return {
    cobro:        culqi   ? "activo" : "demo",
    correo:       resend  ? "activo" : "inactivo",
    aviso_interno: avisos && resend ? "activo" : "inactivo",
    registro:     almacen ? "activo" : "inactivo",
    panel:        (almacen && !!process.env.ADMIN_KEY) ? "activo" : "inactivo",
    operativo:    !!(resend && almacen),
    remitente:    (process.env.FROM_EMAIL || "").replace(/<.*>/, "").trim() || null
  };
}

/* Formato de importe fiel a la moneda en que se cotizó.
   El correo salía siempre en soles aunque el cliente hubiera visto
   dólares, que es justo el caso de todo pedido fuera del Perú. */
export function money(monto, moneda) {
  const n = Math.round(Number(monto) || 0);
  return (moneda === "USD")
    ? "US$ " + n.toLocaleString("en-US")
    : "S/ " + n.toLocaleString("es-PE");
}
