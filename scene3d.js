/* ===================================================================
   LASIK · Contoura · SMILE — Three.js scenes
   Scene 1: procedure stage (one eye model, animated per step / procedure)
   Scene 2: corneal layer explorer (exploded curved shells)
   =================================================================== */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- shared helpers ---------- */

function makeRenderer(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  /* Mobile: vertical swipes scroll the page, horizontal swipes rotate the model. */
  renderer.domElement.style.touchAction = "pan-y";
  return renderer;
}

function makeControls(camera, renderer, target) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(target);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.touches.ONE = THREE.TOUCH.ROTATE;
  controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
  return controls;
}

function addLights(scene) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8aa6b5, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(3, 5, 2.5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xcfeeff, 0.5);
  fill.position.set(-3, 1.5, -2);
  scene.add(fill);
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
}

function watchResize(container, camera, renderer) {
  const ro = new ResizeObserver(() => {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  ro.observe(container);
}

/* ===================================================================
   PROCEDURE STAGE
   Cornea = sphere r 0.65 centred at (0, 0.52, 0); apex at y 1.17.
   Flap cap: theta <= 0.62 → rim radius 0.378 at y 1.050.
   =================================================================== */

export function createStage(container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    42, container.clientWidth / container.clientHeight, 0.1, 50
  );
  camera.position.set(2.0, 2.4, 2.9);
  const renderer = makeRenderer(container);
  const controls = makeControls(camera, renderer, new THREE.Vector3(0, 0.85, 0));
  controls.minDistance = 1.8;
  controls.maxDistance = 7;
  controls.maxPolarAngle = 1.48;
  addLights(scene);
  watchResize(container, camera, renderer);

  const C = { y: 0.52, r: 0.65, flapTheta: 0.62 };
  const flapRimR = C.r * Math.sin(C.flapTheta);          // 0.378
  const flapRimY = C.y + C.r * Math.cos(C.flapTheta);    // 1.050
  const LENT_Y = 1.0, LENT_R = 0.34;                      // lenticule (SMILE)
  const surfY = (r) => C.y + Math.sqrt(Math.max(C.r * C.r - r * r, 0));

  /* ----- the eye ----- */
  const eye = new THREE.Group();
  eye.rotation.y = 0.9; // turn the flap hinge / incision toward the camera
  scene.add(eye);

  const sclera = new THREE.Mesh(
    new THREE.SphereGeometry(1, 48, 32, 0, TAU, 0.617, Math.PI - 0.617),
    new THREE.MeshStandardMaterial({ color: 0xf7f3ea, roughness: 0.4 })
  );
  eye.add(sclera);

  const iris = new THREE.Mesh(
    new THREE.CircleGeometry(0.58, 48),
    new THREE.MeshStandardMaterial({ color: 0x4a7a96, roughness: 0.6 })
  );
  iris.rotation.x = -Math.PI / 2;
  iris.position.y = 0.8153;
  eye.add(iris);

  const pupil = new THREE.Mesh(
    new THREE.CircleGeometry(0.21, 32),
    new THREE.MeshStandardMaterial({ color: 0x0b1014, roughness: 0.3 })
  );
  pupil.rotation.x = -Math.PI / 2;
  pupil.position.y = 0.8163;
  eye.add(pupil);

  const cornea = new THREE.Mesh(
    new THREE.SphereGeometry(C.r, 48, 24, 0, TAU, 0, 1.10),
    new THREE.MeshPhysicalMaterial({
      color: 0xcfeeff, transparent: true, opacity: 0.3,
      roughness: 0.05, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false,
    })
  );
  cornea.position.y = C.y;
  cornea.renderOrder = 3;
  eye.add(cornea);

  /* ----- flap on a hinge (LASIK / Contoura) ----- */
  const hinge = new THREE.Vector3(-flapRimR, flapRimY, 0);
  const flapPivot = new THREE.Group();
  flapPivot.position.copy(hinge);
  eye.add(flapPivot);

  const flapMat = new THREE.MeshStandardMaterial({
    color: 0xf6c9a8, roughness: 0.55, side: THREE.DoubleSide,
    transparent: true, opacity: 0.55,
  });
  const flap = new THREE.Mesh(
    new THREE.SphereGeometry(C.r, 48, 16, 0, TAU, 0, C.flapTheta), flapMat
  );
  flap.position.set(flapRimR, C.y - flapRimY, 0);
  const flapRim = new THREE.Mesh(
    new THREE.TorusGeometry(flapRimR, 0.007, 8, 64),
    new THREE.MeshStandardMaterial({ color: 0xd9a877, roughness: 0.5 })
  );
  flapRim.rotation.x = Math.PI / 2;
  flapRim.position.y = C.r * Math.cos(C.flapTheta);
  flap.add(flapRim);
  flapPivot.add(flap);

  /* exposed stromal bed (visible when the flap is open) */
  const bed = new THREE.Mesh(
    new THREE.SphereGeometry(C.r - 0.02, 48, 16, 0, TAU, 0, C.flapTheta + 0.02),
    new THREE.MeshStandardMaterial({ color: 0xeed0a8, roughness: 0.7 })
  );
  bed.position.y = C.y - 0.015;
  bed.visible = false;
  eye.add(bed);

  /* personalized-ablation overlay (Contoura) — coloured zones on the bed */
  const customZone = new THREE.Group();
  [[0x22d3ee, 0.16, 0.1, 0], [0xa78bfa, -0.14, 0.05, 0.32],
   [0xfb923c, 0.04, 0.2, 0.16], [0x34d399, -0.05, -0.12, 0.26]].forEach(([col, x, z, rr]) => {
    const patch = new THREE.Mesh(
      new THREE.CircleGeometry(0.07 + rr, 24),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false })
    );
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(x, surfY(Math.hypot(x, z)) - 0.05, z);
    customZone.add(patch);
  });
  customZone.visible = false;
  eye.add(customZone);

  /* flap cut outline (femto, LASIK/Contoura) — dashed ring with a hinge gap */
  const cutPts = [];
  for (let i = 0; i <= 60; i++) {
    const a = Math.PI * 0.12 + (TAU - Math.PI * 0.24) * (i / 60);
    cutPts.push(new THREE.Vector3(-Math.cos(a) * flapRimR, 0, Math.sin(a) * flapRimR));
  }
  const cutRing = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(cutPts),
    new THREE.LineDashedMaterial({ color: 0xef4444, dashSize: 0.045, gapSize: 0.03 })
  );
  cutRing.computeLineDistances();
  cutRing.position.y = flapRimY + 0.012;
  cutRing.visible = false;
  eye.add(cutRing);

  /* seam after repositioning (LASIK/Contoura) */
  const seam = new THREE.Mesh(
    new THREE.TorusGeometry(flapRimR, 0.008, 8, 64),
    new THREE.MeshBasicMaterial({ color: 0xb97a4e, transparent: true, opacity: 0.8 })
  );
  seam.rotation.x = Math.PI / 2;
  seam.position.y = flapRimY + 0.006;
  seam.visible = false;
  eye.add(seam);

  /* ----- SMILE: lenticule + incision ----- */
  const lenticule = new THREE.Mesh(
    new THREE.SphereGeometry(1, 40, 20),
    new THREE.MeshStandardMaterial({
      color: 0xffd9a0, emissive: 0xf59e0b, emissiveIntensity: 0.25,
      roughness: 0.4, transparent: true, opacity: 0.78,
    })
  );
  lenticule.scale.set(LENT_R, 0.05, LENT_R);
  lenticule.position.set(0, LENT_Y, 0);
  lenticule.renderOrder = 1;
  const lentRimMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.9 });
  const lentRim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 8, 48), lentRimMat);
  lentRim.rotation.x = Math.PI / 2;
  lenticule.add(lentRim);
  lenticule.visible = false;
  eye.add(lenticule);

  /* small incision arc on the cornea surface (+x side) */
  const incPts = [];
  const incR = 0.37;
  for (let i = 0; i <= 24; i++) {
    const phi = -0.36 + 0.72 * (i / 24);
    incPts.push(new THREE.Vector3(Math.cos(phi) * incR, surfY(incR) + 0.01, Math.sin(phi) * incR));
  }
  const incision = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(incPts),
    new THREE.LineBasicMaterial({ color: 0xb91c1c })
  );
  incision.visible = false;
  eye.add(incision);

  /* ----- instruments (world-space, above the eye) ----- */

  /* basic topography rings (LASIK / SMILE) */
  const topo = new THREE.Group();
  const topoColors = [0xef4444, 0xf97316, 0xeab308, 0x22c55e, 0x3b82f6];
  const topoMats = [];
  topoColors.forEach((color, i) => {
    const th = 0.14 + i * 0.14;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.665 * Math.sin(th), 0.012, 8, 64),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = C.y + 0.665 * Math.cos(th);
    topoMats.push(ring.material);
    topo.add(ring);
  });
  topo.visible = false;
  scene.add(topo);

  /* dense topography point cloud (Contoura) */
  const densePts = [];
  const denseCols = [];
  const colA = new THREE.Color(0x0ea5e9), colB = new THREE.Color(0xf97316);
  for (let i = 0; i < 1600; i++) {
    const th = Math.sqrt(Math.random()) * 0.62;
    const phi = Math.random() * TAU;
    const r = C.r * Math.sin(th);
    densePts.push(Math.cos(phi) * r, C.y + C.r * Math.cos(th) + 0.01, Math.sin(phi) * r);
    const c = colA.clone().lerp(colB, th / 0.62);
    denseCols.push(c.r, c.g, c.b);
  }
  const denseGeo = new THREE.BufferGeometry();
  denseGeo.setAttribute("position", new THREE.Float32BufferAttribute(densePts, 3));
  denseGeo.setAttribute("color", new THREE.Float32BufferAttribute(denseCols, 3));
  const denseMap = new THREE.Points(
    denseGeo,
    new THREE.PointsMaterial({ size: 0.022, vertexColors: true, transparent: true, opacity: 0.95 })
  );
  denseMap.position.y = 0; // points already in cornea space-ish; nudge below
  denseMap.visible = false;
  eye.add(denseMap);

  /* dropper + droplets */
  const drops = new THREE.Group();
  const bottleMat = new THREE.MeshStandardMaterial({ color: 0x38b6d8, roughness: 0.35 });
  const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.34, 24), bottleMat);
  bottle.position.set(0, 2.15, 0);
  const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 24), bottleMat);
  nozzle.rotation.x = Math.PI;
  nozzle.position.set(0, 1.91, 0);
  drops.add(bottle, nozzle);
  const dropMat = new THREE.MeshStandardMaterial({ color: 0x4fc3e8, roughness: 0.2 });
  const droplets = [0, 0.5].map((phase) => {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), dropMat);
    d.userData.phase = phase;
    drops.add(d);
    return d;
  });
  const ripple = new THREE.Mesh(
    new THREE.TorusGeometry(0.1, 0.008, 8, 48),
    new THREE.MeshBasicMaterial({ color: 0x38b6d8, transparent: true, opacity: 0 })
  );
  ripple.rotation.x = Math.PI / 2;
  ripple.position.y = 1.172;
  drops.add(ripple);
  drops.visible = false;
  scene.add(drops);

  /* suction ring */
  const suction = new THREE.Group();
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x8d9aab, metalness: 0.65, roughness: 0.3 });
  const sRing = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.055, 16, 64), ringMat);
  sRing.rotation.x = Math.PI / 2;
  suction.add(sRing);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 16), ringMat);
  handle.rotation.z = -1.15;
  handle.position.set(0.9, 0.13, 0);
  suction.add(handle);
  suction.visible = false;
  scene.add(suction);

  function makeLaser(color) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.22, 0.55),
      new THREE.MeshStandardMaterial({ color, roughness: 0.4 })
    );
    body.position.y = 2.16;
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.12, 0.1, 24),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 })
    );
    lens.position.y = 2.0;
    g.add(body, lens);
    return g;
  }

  /* femtosecond laser (flap cut OR lenticule cut) */
  const femto = makeLaser(0x334155);
  const femtoBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.011, 0.011, 1, 8),
    new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.9 })
  );
  const femtoSpark = new THREE.Mesh(
    new THREE.SphereGeometry(0.022, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xfda4af })
  );
  femto.add(femtoBeam, femtoSpark);
  femto.visible = false;
  scene.add(femto);

  /* excimer laser */
  const excimer = makeLaser(0x3b2a63);
  const uvBeams = [];
  for (let i = 0; i < 5; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: 0x9d6bff, transparent: true, opacity: 0.5 });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 8), mat);
    const a = (i / 5) * TAU;
    const r = i === 0 ? 0 : 0.22;
    beam.userData.target = new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
    uvBeams.push(beam);
    excimer.add(beam);
  }
  excimer.visible = false;
  scene.add(excimer);

  /* healing glow + sparkles */
  const heal = new THREE.Group();
  const glowRing = new THREE.Mesh(
    new THREE.TorusGeometry(flapRimR + 0.03, 0.02, 8, 64),
    new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.6 })
  );
  glowRing.rotation.x = Math.PI / 2;
  glowRing.position.y = flapRimY + 0.01;
  heal.add(glowRing);
  const healLight = new THREE.PointLight(0x34d399, 2.5, 4);
  healLight.position.set(0, 1.6, 0);
  heal.add(healLight);
  const sparkCount = 36;
  const sparkPos = new Float32Array(sparkCount * 3);
  for (let i = 0; i < sparkCount; i++) {
    const a = Math.random() * TAU, r = 0.15 + Math.random() * 0.45;
    sparkPos[i * 3] = Math.cos(a) * r;
    sparkPos[i * 3 + 1] = 1.15 + Math.random() * 0.8;
    sparkPos[i * 3 + 2] = Math.sin(a) * r;
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
  const sparks = new THREE.Points(
    sparkGeo,
    new THREE.PointsMaterial({ color: 0x34d399, size: 0.04, transparent: true, opacity: 0.9 })
  );
  heal.add(sparks);
  heal.visible = false;
  scene.add(heal);

  /* ----- per-step state ----- */
  const DEFAULTS = {
    fx: null, femtoMode: "flap",
    flapOpen: false, ablated: false, customAblation: false, seam: false, cut: false,
    lenticule: false, lenticuleForming: false, incision: false, extract: false,
  };
  const state = { ...DEFAULTS };
  let flapAngle = 0, suctionY = 2.2, bedSquash = 1, lentGrow = 1, extractT = 0;

  function applyStep(s) {
    Object.assign(state, DEFAULTS, s);
    topo.visible = state.fx === "topo";
    denseMap.visible = state.fx === "denseMap";
    drops.visible = state.fx === "drops";
    suction.visible = state.fx === "suction";
    femto.visible = state.fx === "femto";
    excimer.visible = state.fx === "excimer";
    heal.visible = state.fx === "heal";
    cutRing.visible = !!state.cut;
    seam.visible = !!state.seam;
    bed.visible = !!state.flapOpen;
    customZone.visible = !!state.customAblation;
    flapPivot.visible = !!(state.cut || state.flapOpen || state.seam);
    lenticule.visible = !!state.lenticule;
    incision.visible = !!state.incision;
    if (state.fx === "suction") suctionY = 2.2;
    if (state.lenticuleForming) lentGrow = 0.05;
    if (!state.lenticuleForming && state.lenticule) lentGrow = 1;
    if (state.extract) extractT = 0;
    if (!state.extract) {
      lenticule.position.set(0, LENT_Y, 0);
      lenticule.material.opacity = 0.78;
    }
  }

  /* ----- animation ----- */
  function tick(t, dt) {
    controls.update();

    const targetAngle = state.flapOpen ? 2.15 : 0;
    flapAngle = lerp(flapAngle, targetAngle, Math.min(dt * 3.2, 1));
    flapPivot.rotation.z = flapAngle;
    flapMat.opacity = lerp(flapMat.opacity, state.flapOpen ? 0.95 : 0.55, Math.min(dt * 3, 1));

    bedSquash = lerp(bedSquash, state.ablated ? 0.78 : 1, Math.min(dt * 3, 1));
    bed.scale.y = bedSquash;

    if (topo.visible) topoMats.forEach((m, i) => { m.opacity = 0.5 + 0.45 * Math.sin(t * 3 + i * 0.9); });

    if (denseMap.visible) {
      denseMap.material.opacity = 0.7 + 0.3 * Math.sin(t * 4);
      denseMap.material.size = 0.02 + 0.006 * Math.sin(t * 6);
    }

    if (drops.visible) {
      droplets.forEach((d) => {
        const p = (t * 0.62 + d.userData.phase) % 1;
        d.position.set(0, lerp(1.86, 1.18, p), 0);
        d.visible = p < 0.96;
      });
      const rp = (t * 0.62 + 0.46) % 1;
      ripple.scale.setScalar(0.4 + rp * 3.2);
      ripple.material.opacity = Math.max(0, 0.7 - rp);
    }

    if (suction.visible) {
      suctionY = lerp(suctionY, 0.85, Math.min(dt * 2.2, 1));
      suction.position.y = suctionY + 0.02 * Math.sin(t * 2);
    }

    if (femto.visible) {
      const sp = (t * 0.45) % 1;
      if (state.femtoMode === "lenticule") {
        /* trace the lenticule disc inside the intact cornea */
        const r = sp * LENT_R;
        const a = t * 5;
        const tx = Math.cos(a) * r, tz = Math.sin(a) * r, ty = LENT_Y;
        const top = 1.95;
        femtoBeam.position.set(tx, (top + ty) / 2, tz);
        femtoBeam.scale.y = top - ty;
        femtoSpark.position.set(tx, ty, tz);
        lentGrow = lerp(lentGrow, 1, Math.min(dt * 1.5, 1));
      } else {
        const r = sp * (flapRimR - 0.02);
        const a = t * 5;
        const tx = Math.cos(a) * r, tz = Math.sin(a) * r, ty = surfY(r) - 0.06;
        const top = 1.95;
        femtoBeam.position.set(tx, (top + ty) / 2, tz);
        femtoBeam.scale.y = top - ty;
        femtoSpark.position.set(tx, ty, tz);
      }
      femtoBeam.material.opacity = 0.65 + 0.3 * Math.sin(t * 30);
    }

    /* lenticule grow / pulse */
    if (state.lenticule && !state.extract) {
      const g = state.lenticuleForming ? lentGrow : 1;
      lenticule.scale.set(LENT_R * g, 0.05 * g, LENT_R * g);
      lenticule.material.emissiveIntensity = 0.2 + 0.2 * Math.sin(t * 4);
    }

    /* extraction: float the lenticule out through the incision */
    if (state.extract) {
      extractT = Math.min(extractT + dt * 0.4, 1);
      const e = extractT;
      lenticule.position.set(lerp(0, 0.5, e), lerp(LENT_Y, 1.32, e), lerp(0, 0.16, e));
      const op = lerp(0.78, 0, Math.max(0, e - 0.35) / 0.65);
      lenticule.material.opacity = op;
      lentRimMat.opacity = op * 1.15;
      lenticule.rotation.z = e * 1.2;
    } else {
      lenticule.rotation.z = 0;
      lentRimMat.opacity = 0.9;
    }

    if (excimer.visible) {
      uvBeams.forEach((b, i) => {
        const tgt = b.userData.target;
        const ty = (surfY(Math.hypot(tgt.x, tgt.z)) - 0.07) * bedSquash + C.y * (1 - bedSquash);
        const top = 1.95;
        b.position.set(tgt.x, (top + ty) / 2, tgt.z);
        b.scale.y = top - ty;
        b.material.opacity = Math.max(0.06, Math.sin(t * 6 + i * 1.3)) * 0.85;
      });
    }

    if (customZone.visible) {
      customZone.children.forEach((p, i) => { p.material.opacity = 0.25 + 0.25 * Math.sin(t * 3 + i); });
    }

    if (heal.visible) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
      glowRing.material.opacity = 0.25 + 0.5 * pulse;
      healLight.intensity = 1 + 2.2 * pulse;
      const pos = sparkGeo.attributes.position;
      for (let i = 0; i < sparkCount; i++) {
        let y = pos.getY(i) + dt * 0.22;
        if (y > 2.0) y = 1.15;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }

    if (seam.visible) {
      seam.material.opacity = state.fx === "heal" ? 0.25 + 0.35 * Math.sin(t * 1.5) : 0.85;
    }

    renderer.render(scene, camera);
  }

  return { applyStep, tick };
}

/* ===================================================================
   LAYER EXPLORER — six curved shells, exploded; click to inspect
   =================================================================== */

function makeShellCap(rOut, rIn, theta, color) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.55, side: THREE.DoubleSide });
  const top = new THREE.Mesh(new THREE.SphereGeometry(rOut, 48, 16, 0, TAU, 0, theta), mat);
  const bottom = new THREE.Mesh(new THREE.SphereGeometry(rIn, 48, 16, 0, TAU, 0, theta), mat);
  const rim = new THREE.Mesh(
    new THREE.LatheGeometry(
      [
        new THREE.Vector2(rIn * Math.sin(theta), rIn * Math.cos(theta)),
        new THREE.Vector2(rOut * Math.sin(theta), rOut * Math.cos(theta)),
      ],
      64
    ),
    mat
  );
  group.add(top, bottom, rim);
  group.userData.material = mat;
  return group;
}

export function createLayers(container, layers, onSelect) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    40, container.clientWidth / container.clientHeight, 0.1, 50
  );
  camera.position.set(2.4, 1.6, 3.4);
  const renderer = makeRenderer(container);
  const controls = makeControls(camera, renderer, new THREE.Vector3(0, 0.55, 0));
  controls.minDistance = 2;
  controls.maxDistance = 8;
  addLights(scene);
  watchResize(container, camera, renderer);

  const THETA = 0.52;
  const thick = [0.028, 0.075, 0.034, 0.3, 0.034, 0.045];
  let rOut = 1.62;
  const shells = [];
  layers.forEach((layer, i) => {
    const rIn = rOut - thick[i];
    const shell = makeShellCap(rOut, rIn, THETA, layer.color3d);
    shell.userData.index = i;
    shell.userData.restY = -i * 0.16 - 0.55;
    shell.position.y = shell.userData.restY;
    scene.add(shell);
    shells.push(shell);
    rOut = rIn;
  });

  let selected = -1;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let downXY = null;

  renderer.domElement.addEventListener("pointerdown", (e) => { downXY = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!downXY || Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]) > 6) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(shells, true);
    if (hits.length) {
      let obj = hits[0].object;
      while (obj && obj.userData.index === undefined) obj = obj.parent;
      if (obj) onSelect(obj.userData.index);
    }
  });

  function selectLayer(i) { selected = i; }

  function tick(t, dt) {
    controls.update();
    shells.forEach((shell, i) => {
      const isSel = i === selected;
      shell.position.x = lerp(shell.position.x, isSel ? 0.85 : 0, Math.min(dt * 4, 1));
      shell.position.y = lerp(shell.position.y, shell.userData.restY + (isSel ? 0.1 : 0), Math.min(dt * 4, 1));
      const mat = shell.userData.material;
      if (isSel) {
        mat.emissive.setHex(0x0ea5e9);
        mat.emissiveIntensity = 0.12 + 0.18 * (0.5 + 0.5 * Math.sin(t * 3.5));
      } else {
        mat.emissiveIntensity = 0;
      }
    });
    renderer.render(scene, camera);
  }

  return { selectLayer, tick };
}

/* ---------- single shared render loop ---------- */

export function startLoop(scenes) {
  const clock = new THREE.Clock();
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    scenes.forEach((s) => s.tick(t, dt));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
