/* ============================================================
   Oficina 3D (Three.js) — interior corporativo futurista.
   Superficies blancas/metálicas, interfaces holográficas, luz
   neón cian/azul, mesa circular central con holograma, agentes
   con acciones (tipeo, planos, tech, focus group). Arranque
   inmediato; respeta prefers-reduced-motion; fallback sin WebGL.
   ============================================================ */
(function () {
  "use strict";

  const C_CYAN = 0x34E5C4, C_BLUE = 0x4DA3FF, C_VIOLET = 0x8B7BFF, C_AMBER = 0xF6B73C;

  const AGENTS3D = [
    { role: "Agente de Datos & IA", color: 0x8B7BFF, skin: 0xE8B894, hair: 0x2b2b2b, action: "type", at: [-7.4, -3.8] },
    { role: "Agente Legal", color: 0x3B82F6, skin: 0xD9A06B, hair: 0x4a3526, action: "type", at: [-7.4, 3.8] },
    { role: "Agente Financiero", color: 0x34E5C4, skin: 0xEcC39B, hair: 0x1f1a16, action: "type", at: [7.4, 3.8] },
    { role: "Agente de Tecnología", color: 0x2BD4F5, skin: 0xC98A5e, hair: 0x111111, action: "tech", at: [7.4, -3.8] },
    { role: "Ingeniería Civil (planos)", color: 0xF6B73C, skin: 0xE8B894, hair: 0x3a2a20, action: "draw", at: [-6.4, 5.4] },
    { role: "Analista Social (focus groups)", color: 0xE0588E, skin: 0xEab896, hair: 0x241a14, action: "focus", at: [6.6, 5.0] },
    { role: "Auditor de Calidad", color: 0x4ADE80, skin: 0xE8B894, hair: 0x2b2b2b, action: "roam", at: [-2.6, -2.4] },
    { role: "Coordinación", color: 0xF59E0B, skin: 0xD9A06B, hair: 0x1f1a16, action: "roam", at: [2.6, -2.4] }
  ];

  function ready(fn) { if (document.readyState !== "loading") fn(); else document.addEventListener("DOMContentLoaded", fn); }
  ready(function () {
    const host = document.getElementById("office3d"); if (!host) return;
    renderLegend(AGENTS3D);
    if (!window.THREE || !webglOK()) { fallback(host); return; }
    try { build3D(host, AGENTS3D); } catch (e) { console.warn("Oficina 3D: respaldo —", e); fallback(host); }
  });
  function webglOK() { try { const c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl"))); } catch (_) { return false; } }
  function hex(n) { return "#" + n.toString(16).padStart(6, "0"); }
  function renderLegend(agents) {
    const el = document.getElementById("officeLegend"); if (!el) return;
    el.innerHTML = agents.map(a => `<span class="ol-item"><i style="background:${hex(a.color)}"></i>${a.role}</span>`).join("");
  }
  function fallback(host) {
    host.classList.add("office3d-fallback");
    host.innerHTML = `<div class="o-fb"><div class="o-fb-emojis">🧑‍💼 👷 🧑‍💻 👩‍🔬 🛡️</div><p>Tu equipo trabajando en la oficina</p><small>La vista 3D se activa en un navegador con WebGL.</small></div>`;
  }

  function build3D(host, agents) {
    const THREE = window.THREE;
    let w = host.clientWidth || 520, h = host.clientHeight || 400;
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    host.appendChild(renderer.domElement);

    const D = 10.5; let aspect = w / h;
    const camera = new THREE.OrthographicCamera(-D * aspect, D * aspect, D, -D, 0.1, 140);
    camera.position.set(13, 16.5, 14); camera.lookAt(0, 0.6, 0);

    // Iluminación corporativa + neón
    scene.add(new THREE.HemisphereLight(0xffffff, 0xaebacb, 1.05));
    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(9, 17, 6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 5;
    const sc = key.shadow.camera; sc.left = -15; sc.right = 15; sc.top = 13; sc.bottom = -13; sc.near = 1; sc.far = 48; scene.add(key);
    const pC = new THREE.PointLight(C_CYAN, 1.5, 22, 2); pC.position.set(0, 6, 0); scene.add(pC);
    const pB = new THREE.PointLight(C_BLUE, 1.1, 20, 2); pB.position.set(-8, 5, 6); scene.add(pB);
    const pV = new THREE.PointLight(C_VIOLET, 0.8, 18, 2); pV.position.set(8, 5, -6); scene.add(pV);

    // Materiales
    const matFloor = new THREE.MeshStandardMaterial({ color: 0xDFE6F0, roughness: 0.45, metalness: 0.35 });
    const matMetal = new THREE.MeshStandardMaterial({ color: 0xF2F5FA, roughness: 0.35, metalness: 0.55 });
    const matMetalDark = new THREE.MeshStandardMaterial({ color: 0xaeb9cc, roughness: 0.4, metalness: 0.6 });
    const glass = new THREE.MeshStandardMaterial({ color: 0xbfe6ff, roughness: 0.08, metalness: 0.25, transparent: true, opacity: 0.32 });
    const holoCyan = () => new THREE.MeshBasicMaterial({ color: C_CYAN, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const holoBlue = () => new THREE.MeshBasicMaterial({ color: C_BLUE, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const neon = (c) => new THREE.MeshBasicMaterial({ color: c });

    // Piso limpio + anillos de neón
    const floor = new THREE.Mesh(new THREE.BoxGeometry(22, 0.4, 15), matFloor);
    floor.position.y = -0.2; floor.receiveShadow = true; scene.add(floor);
    [3.6, 4.3].forEach((r, i) => {
      const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.07, 80), neon(i ? C_BLUE : C_CYAN));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; scene.add(ring);
    });
    addWalls(THREE, scene, matMetal);

    // Mesa circular central + holograma
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.5, 40), matMetalDark); base.position.y = .25; base.castShadow = true; scene.add(base);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.12, 56), matMetal); top.position.y = .56; top.castShadow = true; top.receiveShadow = true; scene.add(top);
    const glowRing = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.04, 12, 64), neon(C_CYAN)); glowRing.rotation.x = Math.PI / 2; glowRing.position.y = .62; scene.add(glowRing);
    // Holograma giratorio sobre la mesa
    const holo = new THREE.Group(); holo.position.set(0, 1.7, 0);
    const ico = new THREE.Mesh(new THREE.IcosahedronGeometry(0.72, 1), new THREE.MeshBasicMaterial({ color: C_CYAN, wireframe: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
    holo.add(ico);
    const t1 = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.02, 8, 60), holoCyan()); t1.rotation.x = Math.PI / 2; holo.add(t1);
    const t2 = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.018, 8, 60), holoBlue()); t2.rotation.x = Math.PI / 2.4; t2.rotation.z = .5; holo.add(t2);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.3, 1.0, 32, 1, true), new THREE.MeshBasicMaterial({ color: C_CYAN, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = -1.05; holo.add(beam);
    scene.add(holo);

    // Estaciones, zonas
    agents.forEach(a => { if (a.action === "type") addWorkstation(THREE, scene, a.at[0], a.at[1], false, { matMetal, matMetalDark, holoCyan, holoBlue, neon }); if (a.action === "tech") addWorkstation(THREE, scene, a.at[0], a.at[1], true, { matMetal, matMetalDark, holoCyan, holoBlue, neon }); });
    addDraftingTable(THREE, scene, -6.4, 6.4, { matMetal, matMetalDark, holoBlue, neon });
    addFocusGroup(THREE, scene, 6.6, 6.2, { matMetal, glass, holoCyan, neon });
    addPillar(THREE, scene, -10, -6.4); addPillar(THREE, scene, 10, 6.4);

    // Personajes
    const seats = agents.map((_, i) => { const a = (i / agents.length) * Math.PI * 2 - Math.PI / 2; return new THREE.Vector3(Math.cos(a) * 2.8, 0, Math.sin(a) * 2.8); });
    const chars = agents.map((a, i) => {
      const g = makeOfficial(THREE, a.color, a); scene.add(g);
      const home = new THREE.Vector3(a.at[0] * (a.action === "type" || a.action === "tech" ? 0.82 : 0.92), 0, a.at[1] - (a.action === "draw" || a.action === "focus" ? 1.0 : 0));
      const look = (a.action === "draw" || a.action === "focus") ? new THREE.Vector3(a.at[0], 0, a.at[1] + 2) : new THREE.Vector3(a.at[0] * 1.4, 0, a.at[1]);
      g.position.copy(home); g.lookAt(look.x, 0, look.z);
      return { g, a, home, look, seat: seats[i], target: home.clone(), phase: Math.random() * 6, idle: Math.random() * 6, wait: 0, atTable: false };
    });

    const clock = new THREE.Clock(); let raf = null, running = false;
    function tick() {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      holo.rotation.y += dt * 0.5; ico.rotation.y -= dt * 0.8; ico.rotation.x += dt * 0.3;
      chars.forEach(c => {
        const p = c.g.position, t = c.target, ud = c.g.userData;
        const dx = t.x - p.x, dz = t.z - p.z, dist = Math.hypot(dx, dz);
        if (dist > 0.07) {
          const step = Math.min(2.4 * dt, dist); p.x += dx / dist * step; p.z += dz / dist * step;
          c.g.rotation.y = Math.atan2(dx, dz); c.phase += dt * 11;
          const s = Math.sin(c.phase) * 0.5;
          ud.legs[0].rotation.x = s; ud.legs[1].rotation.x = -s;
          ud.arms[0].rotation.x = -s * .8; ud.arms[0].rotation.z = 0; ud.arms[1].rotation.x = s * .8; ud.arms[1].rotation.z = 0;
          p.y = Math.abs(Math.sin(c.phase)) * .04;
        } else {
          ud.legs[0].rotation.x *= .8; ud.legs[1].rotation.x *= .8; p.y *= .8; c.idle += dt;
          if (c.a.action === "roam") {
            c.wait += dt;
            if (c.wait > 1.6) { c.wait = 0; c.atTable = !c.atTable; c.target = (c.atTable ? c.seat : c.home).clone(); }
            if (c.atTable) c.g.lookAt(0, 0, 0); else c.g.lookAt(c.look.x, 0, c.look.z);
            ud.arms[0].rotation.x *= .85; ud.arms[1].rotation.x *= .85;
          } else if (c.a.action === "type" || c.a.action === "tech") {
            const k = Math.sin(c.idle * 9);
            ud.arms[0].rotation.x = -1.05 + k * .12; ud.arms[1].rotation.x = -1.05 - k * .12;
            ud.arms[0].rotation.z = .18; ud.arms[1].rotation.z = -.18;
          } else if (c.a.action === "draw") {
            ud.arms[0].rotation.x = -1.25; ud.arms[0].rotation.z = .25 + Math.sin(c.idle * 3) * .35;
            ud.arms[1].rotation.x = -.6; ud.arms[1].rotation.z = -.2;
          } else if (c.a.action === "focus") {
            ud.arms[0].rotation.x = -.2 + Math.sin(c.idle * 2.4) * .5;
            ud.arms[1].rotation.x = -.2 + Math.sin(c.idle * 2.4 + Math.PI) * .5;
          }
        }
      });
      renderer.render(scene, camera);
    }
    function start() { if (!running) { running = true; clock.getDelta(); tick(); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }
    function resize() { w = host.clientWidth || w; h = host.clientHeight || h; aspect = w / h; camera.left = -D * aspect; camera.right = D * aspect; camera.top = D; camera.bottom = -D; camera.updateProjectionMatrix(); renderer.setSize(w, h); }
    window.addEventListener("resize", resize);

    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { renderer.render(scene, camera); return; }
    start();
    if ("IntersectionObserver" in window) new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? start() : stop()), { threshold: 0 }).observe(host);
  }

  function addWalls(THREE, scene, matMetal) {
    const h = 0.62, t = 0.28;
    let w = new THREE.Mesh(new THREE.BoxGeometry(22, h, t), matMetal); w.position.set(0, h / 2, -7.5); w.receiveShadow = true; scene.add(w);
    w = w.clone(); w.position.z = 7.5; scene.add(w);
    let s = new THREE.Mesh(new THREE.BoxGeometry(t, h, 15), matMetal); s.position.set(-11, h / 2, 0); s.receiveShadow = true; scene.add(s);
    s = s.clone(); s.position.x = 11; scene.add(s);
    // tira de neón superior
    const stripMat = new THREE.MeshBasicMaterial({ color: 0x34E5C4 });
    let n = new THREE.Mesh(new THREE.BoxGeometry(22, 0.04, 0.06), stripMat); n.position.set(0, h, -7.42); scene.add(n);
    n = n.clone(); n.position.z = 7.42; scene.add(n);
  }

  function addWorkstation(THREE, scene, x, z, tech, M) {
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 1.05), M.matMetal); top.position.set(x, 0.74, z); top.castShadow = true; top.receiveShadow = true; scene.add(top);
    const ped = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.74, 0.7), M.matMetalDark); ped.position.set(x, 0.37, z); ped.castShadow = true; scene.add(ped);
    const toward = x < 0 ? 1 : -1;
    // soporte + PANTALLA HOLOGRÁFICA grande
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 0.5, 12), M.matMetalDark); stand.position.set(x - toward * 0.35, 1.0, z); scene.add(stand);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.7, 1.08), M.matMetalDark); frame.position.set(x - toward * 0.4, 1.34, z); scene.add(frame);
    const holo = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.62), M.holoCyan());
    holo.position.set(x - toward * 0.355, 1.34, z); holo.rotation.y = toward > 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(holo);
    // líneas de datos en el holograma
    for (let i = 0; i < 3; i++) {
      const ln = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.02), M.neon(tech ? 0x2BD4F5 : 0x34E5C4));
      ln.position.set(x - toward * 0.35, 1.45 - i * 0.14, z); ln.rotation.y = holo.rotation.y; scene.add(ln);
    }
    const kb = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 0.5), M.matMetalDark); kb.position.set(x + toward * 0.55, 0.8, z); scene.add(kb);
    addChair(THREE, scene, x + toward * 1.0, z, toward > 0 ? -Math.PI / 2 : Math.PI / 2);
    if (tech) addServerRack(THREE, scene, x + (x < 0 ? -1.3 : 1.3), z - 1.4, M);
  }

  function addServerRack(THREE, scene, x, z, M) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.7, 0.7), M.matMetal); body.position.set(x, 0.85, z); body.castShadow = true; scene.add(body);
    for (let i = 0; i < 6; i++) {
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.02), M.neon(i % 2 ? 0x34E5C4 : 0x4DA3FF));
      led.position.set(x, 0.35 + i * 0.24, z + 0.36); scene.add(led);
    }
  }

  function addDraftingTable(THREE, scene, x, z, M) {
    [[-0.8, 0], [0.8, 0]].forEach(o => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), M.matMetalDark); l.position.set(x + o[0], 0.4, z + o[1]); l.castShadow = true; scene.add(l); });
    const board = new THREE.Group(); board.position.set(x, 0.95, z); board.rotation.x = -0.5;
    const surf = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 1.3), M.matMetal); surf.castShadow = true; board.add(surf);
    const blue = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 1.18), M.holoBlue()); blue.rotation.x = -Math.PI / 2; blue.position.y = 0.04; board.add(blue);
    for (let i = -2; i <= 2; i++) {
      const ln = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.012), M.neon(0x9fd0ff)); ln.rotation.x = -Math.PI / 2; ln.position.set(0, 0.05, i * 0.22); board.add(ln);
      const lv = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 1.05), M.neon(0x9fd0ff)); lv.rotation.x = -Math.PI / 2; lv.position.set(i * 0.34, 0.05, 0); board.add(lv);
    }
    scene.add(board);
  }

  function addFocusGroup(THREE, scene, x, z, M) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.85, 0.42, 36), M.glass); t.position.set(x, 0.3, z); t.castShadow = true; t.receiveShadow = true; scene.add(t);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.025, 8, 40), M.neon(0x34E5C4)); ring.rotation.x = Math.PI / 2; ring.position.set(x, 0.52, z); scene.add(ring);
    const cols = [0xcbd5e1, 0xa7b6d6, 0xE0588E, 0xF6B73C, 0x8B7BFF];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2, px = x + Math.cos(a) * 1.7, pz = z + Math.sin(a) * 1.7;
      const g = new THREE.Group(); g.position.set(px, 0, pz);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.5, 14), new THREE.MeshStandardMaterial({ color: cols[i], roughness: .9 })); body.position.y = 0.45; body.castShadow = true; g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 18), new THREE.MeshStandardMaterial({ color: 0xE8B894, roughness: .75 })); head.position.y = 0.82; g.add(head);
      g.lookAt(x, 0, z); scene.add(g);
      addChair(THREE, scene, px + (px - x) * 0.18, pz + (pz - z) * 0.18, Math.atan2(x - px, z - pz));
    }
    // panel holográfico de insights
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), M.holoCyan()); panel.position.set(x + 2.4, 1.1, z); panel.rotation.y = Math.PI / 2; scene.add(panel);
    for (let i = 0; i < 6; i++) {
      const note = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.26), M.neon([0xF6B73C, 0x34E5C4, 0xE0588E][i % 3]));
      note.position.set(x + 2.38, 0.78 + (i % 3) * 0.32, z - 0.42 + Math.floor(i / 3) * 0.84); note.rotation.y = Math.PI / 2; scene.add(note);
    }
  }

  function addChair(THREE, scene, x, z, rotY) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xc2ccdb, roughness: .5, metalness: .3 });
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY || 0;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), mat); seat.position.y = 0.5; seat.castShadow = true; g.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.1), mat); back.position.set(0, 0.78, -0.2); back.castShadow = true; g.add(back);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.45, 10), mat); post.position.y = 0.25; g.add(post);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.05, 16), mat); base.position.y = 0.03; g.add(base);
    scene.add(g);
  }

  // Pilar de datos holográfico (reemplaza la planta)
  function addPillar(THREE, scene, x, z) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.6, 18), new THREE.MeshStandardMaterial({ color: 0xF2F5FA, roughness: .35, metalness: .5 }));
    col.position.set(x, 0.8, z); col.castShadow = true; scene.add(col);
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), new THREE.MeshBasicMaterial({ color: 0x34E5C4, wireframe: true, transparent: true, opacity: .6, blending: THREE.AdditiveBlending, depthWrite: false }));
    orb.position.set(x, 1.9, z); scene.add(orb);
  }

  function makeOfficial(THREE, color, v) {
    const g = new THREE.Group();
    const suit = new THREE.MeshStandardMaterial({ color, roughness: .7, metalness: .15 });
    const suitDark = new THREE.MeshStandardMaterial({ color: mix(color, 0x000000, .25), roughness: .8 });
    const trouser = new THREE.MeshStandardMaterial({ color: 0x2a3346, roughness: .85 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x161a22, roughness: .5 });
    const skinM = new THREE.MeshStandardMaterial({ color: v.skin, roughness: .75 });
    const white = new THREE.MeshStandardMaterial({ color: 0xF6F8FB, roughness: .8 });
    const tieMat = new THREE.MeshStandardMaterial({ color: mix(color, 0xffffff, .25), roughness: .6 });
    const legLen = .5, torsoH = .72, torsoY = legLen + torsoH / 2, shoulderY = legLen + torsoH;
    function leg(x) { const grp = new THREE.Group(); grp.position.set(x, legLen, 0); const m = new THREE.Mesh(new THREE.BoxGeometry(.17, legLen, .2), trouser); m.position.y = -legLen / 2; m.castShadow = true; grp.add(m); const sh = new THREE.Mesh(new THREE.BoxGeometry(.19, .1, .32), shoeMat); sh.position.set(0, -legLen + .04, .07); sh.castShadow = true; grp.add(sh); return grp; }
    const legL = leg(-.11), legR = leg(.11); g.add(legL, legR);
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(.3, .38, torsoH, 22), suit); torso.position.y = torsoY; torso.castShadow = true; g.add(torso);
    const shoulders = new THREE.Mesh(new THREE.BoxGeometry(.66, .22, .34), suit); shoulders.position.y = shoulderY - .05; shoulders.castShadow = true; g.add(shoulders);
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(.2, .52, .05), white); shirt.position.set(0, torsoY + .06, .33); g.add(shirt);
    const tie = new THREE.Mesh(new THREE.BoxGeometry(.06, .4, .04), tieMat); tie.position.set(0, torsoY + .03, .36); g.add(tie);
    const badge = new THREE.Mesh(new THREE.BoxGeometry(.17, .13, .03), white); badge.position.set(0, torsoY - .04, .36); g.add(badge);
    function arm(x) { const grp = new THREE.Group(); grp.position.set(x, shoulderY - .02, 0); const upper = new THREE.Mesh(new THREE.BoxGeometry(.14, .52, .17), suit); upper.position.y = -.26; upper.castShadow = true; grp.add(upper); const hand = new THREE.Mesh(new THREE.SphereGeometry(.08, 14, 14), skinM); hand.position.y = -.54; grp.add(hand); return grp; }
    const armL = arm(-.37), armR = arm(.37); g.add(armL, armR);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(.1, .12, .13, 14), skinM); neck.position.y = shoulderY + .05; g.add(neck);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.25, 32, 32), skinM); head.position.y = shoulderY + .3; head.castShadow = true; g.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(.265, 32, 24, 0, Math.PI * 2, 0, Math.PI * .62), new THREE.MeshStandardMaterial({ color: v.hair, roughness: 1 })); hair.position.y = shoulderY + .34; g.add(hair);
    g.userData = { legs: [legL, legR], arms: [armL, armR] };
    return g;
  }
  function mix(a, b, t) { const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255, br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255; return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t); }
})();
