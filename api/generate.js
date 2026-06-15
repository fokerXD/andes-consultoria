/* ============================================================
   /api/generate — Genera un servicio a medida desde texto libre.
   Usa Claude (Anthropic) si hay ANTHROPIC_API_KEY; si no, el
   frontend cae a su motor heurístico local (siempre funciona).

   Variables de entorno (opcionales):
   - ANTHROPIC_API_KEY  (sk-ant-...)
   - ANTHROPIC_MODEL    (por defecto: claude-haiku-4-5-20251001)
   ============================================================ */

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ ok: false }); }
  const body = typeof req.body === "string" ? safeJSON(req.body) : (req.body || {});
  const need = (body.need || "").toString().slice(0, 1500).trim();
  if (!need) return res.status(400).json({ ok: false, error: "Falta la descripción." });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(200).json({ ok: false, fallback: true }); // sin llave → motor local

  const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
  const system = `Eres el motor de cotización de "Andes Consultoría Inteligente", una firma peruana que brinda servicios de asesoría al sector público (expedientes técnicos y documentos equivalentes bajo Invierte.pe/MEF, políticas públicas, análisis regulatorio, gestión financiera y evaluación de comités de selección).
Dada la necesidad del usuario, propones un servicio a medida. Responde SOLO con un objeto JSON válido (sin texto adicional, sin markdown) con esta forma exacta:
{"name": string, "catLabel": string, "catIcon": string(un emoji), "price": number(entero en soles peruanos, IGV incluido), "days": number(entero, días hábiles), "scope": string[] (4 a 6 viñetas claras), "insumos": string[] (3 a 5 documentos/datos que el cliente debe entregar), "confidence": "alta"|"media"|"exploratoria"}
Reglas de precio: consultoría profesional realista en Perú. Informe/opinión simple ~S/900–2500; análisis o evaluación ~S/2500–6000; políticas/documentos técnicos ~S/4000–12000; expedientes técnicos ~S/7000–30000 según complejidad. Ajusta por alcance, urgencia y número de entidades/componentes mencionados. Nunca menos de S/900. Todo en español.`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model, max_tokens: 700, system,
        messages: [{ role: "user", content: `Necesidad del usuario:\n"""${need}"""\n\nDevuelve el JSON del servicio.` }]
      })
    });
    if (!r.ok) return res.status(200).json({ ok: false, fallback: true });
    const data = await r.json();
    const text = (data.content || []).map(b => b.text || "").join("");
    const parsed = extractJSON(text);
    if (!parsed || !parsed.price) return res.status(200).json({ ok: false, fallback: true });
    // saneamiento
    const out = {
      ok: true,
      name: String(parsed.name || "Servicio a medida").slice(0, 120),
      catLabel: String(parsed.catLabel || "Servicio a medida").slice(0, 40),
      catIcon: String(parsed.catIcon || "🧩").slice(0, 4),
      price: Math.max(900, Math.round(Number(parsed.price) / 50) * 50),
      days: Math.max(4, Math.round(Number(parsed.days) || 8)),
      scope: (Array.isArray(parsed.scope) ? parsed.scope : []).slice(0, 6).map(s => String(s).slice(0, 200)),
      insumos: (Array.isArray(parsed.insumos) ? parsed.insumos : []).slice(0, 5).map(s => String(s).slice(0, 160)),
      confidence: ["alta", "media", "exploratoria"].includes(parsed.confidence) ? parsed.confidence : "media"
    };
    if (!out.scope.length) out.scope = ["Entregable técnico-profesional a la medida de tu necesidad", "Revisión normativa vigente", "Validación por especialista", "Entrega con trazabilidad por hitos"];
    if (!out.insumos.length) out.insumos = ["Documentación de respaldo", "Marco normativo aplicable", "Antecedentes del caso"];
    return res.status(200).json(out);
  } catch (err) {
    return res.status(200).json({ ok: false, fallback: true });
  }
}

function safeJSON(s) { try { return JSON.parse(s); } catch (_) { return {}; } }
function extractJSON(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch (_) {}
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(text.slice(a, b + 1)); } catch (_) {} }
  return null;
}
