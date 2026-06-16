/* ============================================================
   Oficina 3D (Three.js) — funcionarios públicos que se desplazan
   y coordinan en una oficina abierta vista desde arriba.
   Look moderno: materiales MeshStandard, sombras suaves,
   personajes definidos (hombros, brazos, zapatos, fotocheck),
   sillas, monitores encendidos y plantas.
   Si no hay THREE o WebGL, muestra un respaldo elegante.
   ============================================================ */
(function () {
  "use strict";

  const AGENTS3D = [
    { role: "Agente Legal", color: 0x3B82F6, skin: 0xE8B894, hair: 0x2b2b2b },
    { role: "Agente Técnico", color: 0xF6B73C, skin: 0xD9A06B, hair: 0x4a3526 },
    { role: "Agente Financiero", color: 0x34E5C4, skin: 0xEcC39B, hair: 0x1f1a16 },
    { role: "Agente de Datos & IA", color: 0x8B7BFF, skin: 0xC98A5e, hair: 0x111111 },
    { role: "Auditor de Calidad", color: 0x22C39A, skin: 0xEab896, hair: 0x6b4a2f }
  ];

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    const host = document.getElementById("office3d");
    if (!host) return;
    renderLegend(AGENTS3D);
    if (!window.THREE || !webglOK()) { fallback(host); return; }
    try { build3D(host, AGENTS3D); }
    catch (e) { console.warn("Oficina 3D: usando respaldo —", e); fallback(host); }
  });

  function webglOK() {
    try {
      const c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (_) { return false; }
  }
  function hex(n) { return "#" + n.toString(16).padStart(6, "0"); }

  function renderLegend(agents) {
    const el = document.getElementById("officeLegend");
    if (!el) return;
    el.innerHTML = agents.map(a =>
      `<span class="ol-item"><i style="background:${hex(a.color)}"></i>${a.role}</span>`).join("");
  }
  function fallback(host) {
    host.classList.add("office3d-fallback");
    host.innerHTML = `<div class="o-fb">
      <div class="o-fb-emojis">🧑‍💼 👩‍💼 🧑‍💼 👩‍💼 🛡️</div>
      <p>Tu equipo coordinando en la oficina</p>
      <small>La vista 3D se activa en un navegador con WebGL.</small></div>`;
  }

  /* ---------- Construcción de la escena ---------- */
  function build3D(host, agents) {
    const THREE = window.THREE;
    let W = host.clientWidth || 520, H = host.clientHeight || 400;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    host.appendChild(renderer.domElement);

    const D = 8.2;
    let aspect = W / H;
    const camera = new THREE.OrthographicCamera(-D * aspect, D * aspect, D, -D, 0.1, 100);
    camera.position.set(10, 13.5, 11);
    camera.lookAt(0, 0.5, 0);

    // Iluminación moderna
    scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x0a0f1e, 0.8));
    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(8, 15, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 4;
    const sc = key.shadow.camera;
    sc.left = -12; sc.right = 12; sc.top = 10; sc.bottom = -10; sc.near = 1; sc.far = 40;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xcfe0ef, 0.25);
    fill.position.set(-7, 6, -5); scene.add(fill);

    // Piso
    const floor = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 13),
      new THREE.MeshStandardMaterial({ color: 0x111B30, roughness: 0.95 }));
    floor.position.y = -0.2; floor.receiveShadow = true; scene.add(floor);
    const rug = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 0.06, 56),
      new THREE.MeshStandardMaterial({ color: 0x16223C, roughness: 1 }));
    rug.position.y = 0.04; rug.receiveShadow = true; scene.add(rug);

    addWalls(THREE, scene);

    // Mesa de coordinación
    const table = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.55, 0.5, 56),
      new THREE.MeshStandardMaterial({ color: 0x16508A, roughness: 0.6 }));
    table.position.y = 0.46; table.castShadow = true; table.receiveShadow = true; scene.add(table);
    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.1, 56),
      new THREE.MeshStandardMaterial({ color: 0x0E2A47, roughness: 0.45 }));
    tableTop.position.y = 0.73; tableTop.castShadow = true; scene.add(tableTop);

    // Escritorios + sillas + plantas
    const deskPos = [[-6.2, -3.6], [-6.2, 3.6], [6.2, -3.6], [6.2, 3.6], [0, -5.3]];
    deskPos.forEach(p => addWorkstation(THREE, scene, p[0], p[1]));
    addPlant(THREE, scene, -8, 5.4);
    addPlant(THREE, scene, 8, -5.4);

    const homes = [
      new THREE.Vector3(-4.9, 0, -3.6), new THREE.Vector3(-4.9, 0, 3.6),
      new THREE.Vector3(4.9, 0, -3.6), new THREE.Vector3(4.9, 0, 3.6),
      new THREE.Vector3(0, 0, -3.95)
    ];
    const seats = agents.map((_, i) => {
      const a = (i / agents.length) * Math.PI * 2 - Math.PI / 2;
      return new THREE.Vector3(Math.cos(a) * 2.7, 0, Math.sin(a) * 2.7);
    });

    const chars = agents.map((a, i) => {
      const g = makeOfficial(THREE, a.color, a);
      g.position.copy(homes[i]);
      scene.add(g);
      return { g, home: homes[i], seat: seats[i], target: homes[i].clone(), phase: Math.random() * 6, idle: Math.random() * 6 };
    });

    let meeting = false, tMode = 0;
    function assignTargets(m) { chars.forEach(c => { c.target = (m ? c.seat : c.home).clone(); }); }

    const clock = new THREE.Clock();
    let raf = null, running = false;

    function tick() {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      tMode += dt;
      if (tMode > 7.5) { tMode = 0; meeting = !meeting; assignTargets(meeting); }

      chars.forEach(c => {
        const p = c.g.position, t = c.target;
        const dx = t.x - p.x, dz = t.z - p.z, dist = Math.hypot(dx, dz);
        const ud = c.g.userData;
        if (dist > 0.06) {                       // caminando
          const step = Math.min(2.3 * dt, dist);
          p.x += dx / dist * step; p.z += dz / dist * step;
          c.g.rotation.y = Math.atan2(dx, dz);
          c.phase += dt * 11;
          const s = Math.sin(c.phase) * 0.5;
          ud.legs[0].rotation.x = s; ud.legs[1].rotation.x = -s;
          ud.arms[0].rotation.x = -s * 0.8; ud.arms[1].rotation.x = s * 0.8;
          p.y = Math.abs(Math.sin(c.phase)) * 0.04;
        } else {                                 // en sitio
          ud.legs[0].rotation.x *= 0.8; ud.legs[1].rotation.x *= 0.8; p.y *= 0.8;
          if (meeting) {
            c.g.lookAt(0, p.y, 0);
            ud.arms[0].rotation.x *= 0.85; ud.arms[1].rotation.x *= 0.85;
          } else {                               // "trabajando": leve gesto de brazos
            c.idle += dt * 4;
            const w = Math.sin(c.idle) * 0.12 - 0.25;
            ud.arms[0].rotation.x = w; ud.arms[1].rotation.x = w * 0.9;
          }
        }
      });
      renderer.render(scene, camera);
    }
    function start() { if (!running) { running = true; clock.getDelta(); tick(); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

    function resize() {
      W = host.clientWidth || W; H = host.clientHeight || H;
      aspect = W / H;
      camera.left = -D * aspect; camera.right = D * aspect; camera.top = D; camera.bottom = -D;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    }
    window.addEventListener("resize", resize);

    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { assignTargets(true); renderer.render(scene, camera); return; } // estático si se prefiere

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? start() : stop()), { threshold: 0.1 }).observe(host);
    }
    assignTargets(false);
    start();
  }

  function addWalls(THREE, scene) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x243352, roughness: 1 });
    const h = 0.6, t = 0.3;
    let w = new THREE.Mesh(new THREE.BoxGeometry(18, h, t), mat); w.position.set(0, h / 2, -6.5); w.receiveShadow = true; scene.add(w);
    w = w.clone(); w.position.z = 6.5; scene.add(w);
    let s = new THREE.Mesh(new THREE.BoxGeometry(t, h, 13), mat); s.position.set(-9, h / 2, 0); s.receiveShadow = true; scene.add(s);
    s = s.clone(); s.position.x = 9; scene.add(s);
  }

  function addWorkstation(THREE, scene, x, z) {
    const woodTop = new THREE.MeshStandardMaterial({ color: 0xC07F4A, roughness: 0.7 });
    const woodLeg = new THREE.MeshStandardMaterial({ color: 0x6b4a33, roughness: 0.8 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.95), woodTop);
    top.position.set(x, 0.72, z); top.castShadow = true; top.receiveShadow = true; scene.add(top);
    [[-0.75, -0.38], [0.75, -0.38], [-0.75, 0.38], [0.75, 0.38]].forEach(o => {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.72, 0.1), woodLeg);
      l.position.set(x + o[0], 0.36, z + o[1]); l.castShadow = true; scene.add(l);
    });
    const towardCenter = x === 0 ? (z < 0 ? 1 : -1) : (x < 0 ? 1 : -1);
    const ax = x === 0 ? 0 : towardCenter, az = x === 0 ? towardCenter : 0;
    // Monitor (pantalla encendida) orientado hacia el escritorio
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.18, 10),
      new THREE.MeshStandardMaterial({ color: 0x222831 }));
    stand.position.set(x - ax * 0.28, 0.87, z - az * 0.28); scene.add(stand);
    const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.4, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x1b2230, roughness: 0.5 }));
    monitor.position.set(x - ax * 0.3, 1.16, z - az * 0.3);
    monitor.rotation.y = (x === 0) ? 0 : Math.PI / 2;
    monitor.castShadow = true; scene.add(monitor);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.32),
      new THREE.MeshBasicMaterial({ color: 0x5fd0b4 }));
    screen.position.set(x - ax * 0.27, 1.16, z - az * 0.27);
    screen.rotation.y = (x === 0) ? (towardCenter > 0 ? 0 : Math.PI) : (towardCenter > 0 ? Math.PI / 2 : -Math.PI / 2);
    scene.add(screen);
    // Silla (lado hacia el centro)
    addChair(THREE, scene, x + ax * 0.85, z + az * 0.85, Math.atan2(-ax, -az));
  }

  function addChair(THREE, scene, x, z, rotY) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x33414f, roughness: 0.7 });
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), mat); seat.position.y = 0.5; seat.castShadow = true; g.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.1), mat); back.position.set(0, 0.78, -0.2); back.castShadow = true; g.add(back);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.45, 10), mat); post.position.y = 0.25; g.add(post);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.05, 16), mat); base.position.y = 0.03; g.add(base);
    scene.add(g);
  }

  function addPlant(THREE, scene, x, z) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.34, 14),
      new THREE.MeshStandardMaterial({ color: 0xB9743F, roughness: 0.8 }));
    pot.position.set(x, 0.17, z); pot.castShadow = true; scene.add(pot);
    const foliage = new THREE.Mesh(new THREE.IcosahedronGeometry(0.36, 0),
      new THREE.MeshStandardMaterial({ color: 0x2F8F5B, roughness: 1, flatShading: true }));
    foliage.position.set(x, 0.62, z); foliage.castShadow = true; scene.add(foliage);
  }

  // Funcionario definido: piernas con zapatos, torso entallado, hombros,
  // brazos articulados, camisa + corbata + solapas, fotocheck con cordón, cuello, cabeza, cabello.
  function makeOfficial(THREE, color, v) {
    const g = new THREE.Group();
    const suit = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05 });
    const suitDark = new THREE.MeshStandardMaterial({ color: mix(color, 0x000000, 0.25), roughness: 0.85 });
    const trouser = new THREE.MeshStandardMaterial({ color: 0x2A2F3A, roughness: 0.9 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x15181f, roughness: 0.5 });
    const skinM = new THREE.MeshStandardMaterial({ color: v.skin, roughness: 0.75 });
    const white = new THREE.MeshStandardMaterial({ color: 0xF6F8FB, roughness: 0.8 });
    const tieMat = new THREE.MeshStandardMaterial({ color: 0xB23A2E, roughness: 0.7 });

    const legLen = 0.5, torsoH = 0.72, torsoY = legLen + torsoH / 2, shoulderY = legLen + torsoH;

    function leg(x) {
      const grp = new THREE.Group(); grp.position.set(x, legLen, 0);
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.17, legLen, 0.2), trouser);
      m.position.y = -legLen / 2; m.castShadow = true; grp.add(m);
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.1, 0.32), shoeMat);
      shoe.position.set(0, -legLen + 0.04, 0.07); shoe.castShadow = true; grp.add(shoe);
      return grp;
    }
    const legL = leg(-0.11), legR = leg(0.11); g.add(legL, legR);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, torsoH, 22), suit);
    torso.position.y = torsoY; torso.castShadow = true; g.add(torso);
    const shoulders = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.22, 0.34), suit);
    shoulders.position.y = shoulderY - 0.05; shoulders.castShadow = true; g.add(shoulders);

    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.52, 0.05), white);
    shirt.position.set(0, torsoY + 0.06, 0.33); g.add(shirt);
    const lapL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.04), suitDark);
    lapL.position.set(-0.1, torsoY + 0.12, 0.345); lapL.rotation.z = 0.18; g.add(lapL);
    const lapR = lapL.clone(); lapR.position.x = 0.1; lapR.rotation.z = -0.18; g.add(lapR);
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.04), tieMat);
    tie.position.set(0, torsoY + 0.03, 0.36); g.add(tie);

    // Fotocheck con cordón
    const cordL = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.34, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x0E2A47 }));
    cordL.position.set(-0.1, torsoY + 0.2, 0.34); cordL.rotation.z = -0.25; g.add(cordL);
    const cordR = cordL.clone(); cordR.position.x = 0.1; cordR.rotation.z = 0.25; g.add(cordR);
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.13, 0.03), white);
    badge.position.set(0, torsoY - 0.04, 0.36); g.add(badge);
    const badgeLine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.032),
      new THREE.MeshStandardMaterial({ color: color }));
    badgeLine.position.set(0, torsoY - 0.02, 0.377); g.add(badgeLine);

    function arm(x) {
      const grp = new THREE.Group(); grp.position.set(x, shoulderY - 0.02, 0);
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.52, 0.17), suit);
      upper.position.y = -0.26; upper.castShadow = true; grp.add(upper);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 14), skinM);
      hand.position.y = -0.54; grp.add(hand);
      return grp;
    }
    const armL = arm(-0.37), armR = arm(0.37); g.add(armL, armR);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.13, 14), skinM);
    neck.position.y = shoulderY + 0.05; g.add(neck);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 32, 32), skinM);
    head.position.y = shoulderY + 0.3; head.castShadow = true; g.add(head);
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.265, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.62),
      new THREE.MeshStandardMaterial({ color: v.hair, roughness: 1 }));
    hair.position.y = shoulderY + 0.34; g.add(hair);

    g.userData = { legs: [legL, legR], arms: [armL, armR] };
    return g;
  }

  function mix(a, b, t) {
    const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
    const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
    const r = Math.round(ar + (br - ar) * t), gg = Math.round(ag + (bg - ag) * t), bbb = Math.round(ab + (bb - ab) * t);
    return (r << 16) | (gg << 8) | bbb;
  }
})();
