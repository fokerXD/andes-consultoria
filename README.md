# Andes Consultoría Inteligente — Plataforma web

Prototipo navegable y desplegable de la firma de consultoría al sector público, con servicios
productizados con IA, cotizador automático, pago con **Culqi** y **trazabilidad por hitos**.

## Estructura
```
index.html      Sitio (landing, cotizador IA, servicios, proceso, trazabilidad, próximamente)
styles.css      Sistema de diseño (identidad andina institucional, responsive, accesible)
app.js          Cotizador IA + clásico, buscador, checkout Culqi, archivos, trazabilidad
office3d.js     Oficina 3D (Three.js): funcionarios que se desplazan y coordinan (sección Control)
api/order.js    Función serverless: cargo en Culqi + comprobante por correo
api/generate.js Función serverless: genera un servicio a medida desde texto (IA, opcional)
package.json    Config (módulos ESM)
```

## Cotizador con IA (texto libre → servicio + costo)
El usuario describe su necesidad y se genera un servicio a medida (nombre, alcance,
insumos, plazo y costo) que entra al mismo flujo de pago y trazabilidad.
- **Siempre funciona** con un motor heurístico local (sin dependencias): clasifica la
  necesidad, estima complejidad y calcula precio/plazo. Genera cotización para *cualquier*
  texto, incluso uno sin relación.
- **Versión IA (opcional):** si defines `ANTHROPIC_API_KEY` (y opcional `ANTHROPIC_MODEL`)
  en Vercel, `/api/generate` usa Claude para una propuesta más rica; si falla o no hay
  llave, cae automáticamente al motor local.

## Servicios incluidos
1. Expediente Técnico / Documento Equivalente (Invierte.pe, todos los sectores)
2. Formulación de Políticas Públicas
3. Análisis Regulatorio (AIR, opinión legal, benchmarking)
4. Servicios de Gestión Financiera (ejecución presupuestal, multilateral, BI)
5. Evaluación a Comités de Selección (admisión, técnica, combinada)

Cada servicio define sus **insumos**, **dimensiona** el trabajo y calcula un **precio** en soles.

## Trazabilidad: sala de operaciones animada
En la sección **Trazabilidad** (prueba con el código `ACI-DEMO`) se muestra una simulación
gráfica y animada: los documentos que entrega la entidad ingresando al sistema, un **equipo
de agentes especializados** (IA, legal, técnico, financiero y auditor de calidad) trabajando
y validando en vivo, la **línea de tiempo por hitos**, una **cuenta regresiva de días** con
fecha estimada de entrega, y un control para **acelerar la entrega pagando un adicional**
(Estándar / Prioritario / Express). La velocidad también puede elegirse en el checkout.

## Modo demo vs. producción
- **Sin llaves** (por defecto): el pago se **simula** y el correo se omite. El flujo completo es navegable.
- **Con llaves**: pago real con Culqi y envío de comprobante por correo.

### Activar Culqi (llaves de prueba)
1. En el `<head>` de `index.html`, define tu **llave pública**:
   ```html
   <script>window.ACI_CONFIG = { culqiPublicKey: "pk_test_xxxxxxxx" };</script>
   ```
2. En **Vercel → Settings → Environment Variables**, agrega:
   - `CULQI_SECRET_KEY` = `sk_test_xxxxxxxx`
   - (opcional) `RESEND_API_KEY` = `re_xxxxxxxx` y `FROM_EMAIL` para el envío de correos.
3. Vuelve a desplegar. Tarjeta de prueba Culqi: `4111 1111 1111 1111`, cualquier fecha futura, CVV `123`.

## Despliegue
Proyecto estático + funciones serverless. Vercel detecta `index.html` y la carpeta `api/`
automáticamente. No requiere build.
