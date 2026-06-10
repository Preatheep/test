/* ===================================================================
   LASIK, Layer by Layer — Three.js scenes
   Scene 1: the procedure stage (eye + instruments, animated per step)
   Scene 2: the corneal layer explorer (exploded curved shells)
   =================================================================== */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const TAU = Math.PI * 2;

/* ---------- shared helpers ---------- */

function makeRenderer(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  return renderer;
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

const lerp = (a, b, t) => a + (b - a) * t;

/* ===================================================================
   PROCEDURE STAGE
   Eye radius 1, cornea = sphere r 0.65 centred at (0, 0.52, 0).
   Limbus ring: r 0.579 at y 0.815. Flap = cornea cap, theta <= 0.62.
   =================================================================== */

export function createStage(container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    42, container.clientWidth / container.clientHeight, 0.1, 50
  );
  camera.position.set(2.0, 2.4, 2.9);
  const renderer = makeRenderer(container);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.85, 0);
  controls.enableDamping = true;
  controls.minDistance = 1.8;
  controls.maxDistance = 7;
  controls.maxPolarAngle = 1.48;
  addLights(scene);
  watchResize(container, camera, renderer);

  const C = { y: 0.52, r: 0.65, flapTheta: 0.62 };
  const flapRimR = C.r * Math.sin(C.flapTheta);          // 0.378
  const flapRimY = C.y + C.r * Math.cos(C.flapTheta);    // 1.050

  /* ----- the eye ----- */
  const eye = new THREE.Group();
  eye.rotation.y = 0.9; // turn the flap hinge toward the camera
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
      roughness: 0.05, clearcoat: 1, side: THREE.DoubleSide,
    })
  );
  cornea.position.y = C.y;
  eye.add(cornea);

  /* ----- flap on a hinge ----- */
  const hinge = new THREE.Vector3(-flapRimR, flapRimY, 0);
  const flapPivot = new THREE.Group();
  flapPivot.position.copy(hinge);
  eye.add(flapPivot);

  const flapMat = new THREE.MeshStandardMaterial({
    color: 0xf6c9a8, roughness: 0.55, side: THREE.DoubleSide,
    transparent: true, opacity: 0.55,
  });
  const flap = new THREE.Mesh(
    new THREE.SphereGeometry(C.r, 48, 16, 0, TAU, 0, C.flapTheta),
    flapMat
  );
  flap.position.set(flapRimR, C.y - flapRimY, 0); // sphere centre, relative to hinge
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

  /* flap cut outline (step 4) — dashed ring with a hinge gap */
  const cutPts = [];
  for (let i = 0; i <= 60; i++) {
    const a = Math.PI * 0.12 + (TAU - Math.PI * 0.24) * (i / 60); // gap at -X
    cutPts.push(new THREE.Vector3(-Math.cos(a) * flapRimR, 0, Math.sin(a) * flapRimR));
  }
  const cutRing = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(cutPts),
    new THREE.LineDashedMaterial({ color: 0xef4444, dashSize: 0.045, gapSize: 0.03, linewidth: 2 })
  );
  cutRing.computeLineDistances();
  cutRing.position.y = flapRimY + 0.012;
  cutRing.visible = false;
  eye.add(cutRing); // keep the hinge gap aligned with the eye's rotation

  /* seam after repositioning (steps 7–8) */
  const seam = new THREE.Mesh(
    new THREE.TorusGeometry(flapRimR, 0.008, 8, 64),
    new THREE.MeshBasicMaterial({ color: 0xb97a4e, transparent: true, opacity: 0.8 })
  );
  seam.rotation.x = Math.PI / 2;
  seam.position.y = flapRimY + 0.006;
  seam.visible = false;
  eye.add(seam);

  /* ----- instruments ----- */

  /* topography rings + scan disc (step 1) */
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
  const scanDisc = new THREE.Mesh(
    new THREE.CircleGeometry(0.62, 48),
    new THREE.MeshBasicMaterial({
      color: 0x22d3ee, transparent: true, opacity: 0.16,
      side: THREE.DoubleSide, depthWrite: false,
    })
  );
  scanDisc.rotation.x = -Math.PI / 2;
  topo.add(scanDisc);
  topo.visible = false;
  scene.add(topo);

  /* dropper + droplets (step 2) */
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

  /* suction ring (step 3) */
  const suction = new THREE.Group();
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x8d9aab, metalness: 0.65, roughness: 0.3 });
  const sRing = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.055, 16, 64), ringMat);
  sRing.rotation.x = Math.PI / 2;
  suction.add(sRing);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 16), ringMat);
  handle.rotation.z = -1.15; // lean outward, meeting the ring's edge
  handle.position.set(0.9, 0.13, 0);
  suction.add(handle);
  suction.visible = false;
  scene.add(suction);

  /* laser housing (shared by femto + excimer) */
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

  /* femtosecond laser (step 4) */
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

  /* excimer laser (step 6) */
  const excimer = makeLaser(0x3b2a63);
  const uvMats = [];
  const uvBeams = [];
  for (let i = 0; i < 5; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: 0x9d6bff, transparent: true, opacity: 0.5 });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 8), mat);
    const a = (i / 5) * TAU;
    const r = i === 0 ? 0 : 0.22;
    beam.userData.target = new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
    uvMats.push(mat);
    uvBeams.push(beam);
    excimer.add(beam);
  }
  excimer.visible = false;
  scene.add(excimer);

  /* healing glow + sparkles (step 8) */
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
  const state = {
    fx: null,            // 'topo' | 'drops' | 'suction' | 'femto' | 'excimer' | 'heal'
    flapOpen: false,
    ablated: false,
    seam: false,
    cut: false,
  };
  let flapAngle = 0;          // current pivot rotation
  let suctionY = 2.2;         // suction ring entry animation
  let bedSquash = 1;          // 1 = original dome, <1 = flattened by ablation

  function applyStep(s) {
    Object.assign(state, { fx: null, flapOpen: false, ablated: false, seam: false, cut: false }, s);
    topo.visible = state.fx === "topo";
    drops.visible = state.fx === "drops";
    suction.visible = state.fx === "suction";
    femto.visible = state.fx === "femto";
    excimer.visible = state.fx === "excimer";
    heal.visible = state.fx === "heal";
    cutRing.visible = !!state.cut;
    seam.visible = !!state.seam;
    bed.visible = !!state.flapOpen;
    /* the flap only becomes a distinct piece of tissue once it's been cut */
    flapPivot.visible = !!(state.cut || state.flapOpen || state.seam);
    if (state.fx === "suction") suctionY = 2.2; // re-run the descent
  }

  /* ----- animation ----- */
  const surfY = (r) => C.y + Math.sqrt(Math.max(C.r * C.r - r * r, 0)); // cornea surface height

  function tick(t, dt) {
    controls.update();

    /* flap open/close */
    const targetAngle = state.flapOpen ? 2.15 : 0;
    flapAngle = lerp(flapAngle, targetAngle, Math.min(dt * 3.2, 1));
    flapPivot.rotation.z = flapAngle;
    flapMat.opacity = lerp(flapMat.opacity, state.flapOpen ? 0.95 : 0.55, Math.min(dt * 3, 1));

    /* ablation squash */
    bedSquash = lerp(bedSquash, state.ablated ? 0.78 : 1, Math.min(dt * 3, 1));
    bed.scale.y = bedSquash;

    if (topo.visible) {
      topoMats.forEach((m, i) => { m.opacity = 0.5 + 0.45 * Math.sin(t * 3 + i * 0.9); });
      scanDisc.position.y = 0.86 + 0.16 * (1 + Math.sin(t * 1.4)) / 2 + 0.16;
    }

    if (drops.visible) {
      droplets.forEach((d) => {
        const p = ((t * 0.62 + d.userData.phase) % 1);
        d.position.set(0, lerp(1.86, 1.18, p), 0);
        d.visible = p < 0.96;
      });
      const rp = ((t * 0.62 + 0.46) % 1);
      ripple.scale.setScalar(0.4 + rp * 3.2);
      ripple.material.opacity = Math.max(0, 0.7 - rp);
    }

    if (suction.visible) {
      suctionY = lerp(suctionY, 0.85, Math.min(dt * 2.2, 1));
      suction.position.y = suctionY + 0.02 * Math.sin(t * 2);
    }

    if (femto.visible) {
      /* beam tip traces a spiral over the flap zone */
      const sp = (t * 0.45) % 1;
      const r = sp * (flapRimR - 0.02);
      const a = t * 5;
      const tx = Math.cos(a) * r, tz = Math.sin(a) * r;
      const ty = surfY(r) - 0.06;
      const top = 1.95;
      femtoBeam.position.set(tx, (top + ty) / 2, tz);
      femtoBeam.scale.y = top - ty;
      femtoSpark.position.set(tx, ty, tz);
      femtoBeam.material.opacity = 0.65 + 0.3 * Math.sin(t * 30);
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
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.55, 0);
  controls.enableDamping = true;
  controls.minDistance = 2;
  controls.maxDistance = 8;
  addLights(scene);
  watchResize(container, camera, renderer);

  const THETA = 0.52;
  /* thickness of each shell, outermost (tear film) first — exaggerated for visibility */
  const thick = [0.028, 0.075, 0.034, 0.3, 0.034, 0.045];
  let rOut = 1.62;
  const shells = [];
  layers.forEach((layer, i) => {
    const rIn = rOut - thick[i];
    const shell = makeShellCap(rOut, rIn, THETA, layer.color3d);
    shell.userData.index = i;
    shell.userData.baseColor = new THREE.Color(layer.color3d);
    /* exploded resting position: lower layers slide down, leaving gaps */
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
    /* ignore drags (orbiting) */
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

  function selectLayer(i) {
    selected = i;
  }

  function tick(t, dt) {
    controls.update();
    shells.forEach((shell, i) => {
      const isSel = i === selected;
      const targetX = isSel ? 0.85 : 0;
      shell.position.x = lerp(shell.position.x, targetX, Math.min(dt * 4, 1));
      shell.position.y = lerp(
        shell.position.y,
        shell.userData.restY + (isSel ? 0.1 : 0),
        Math.min(dt * 4, 1)
      );
      const mat = shell.userData.material;
      if (isSel) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 3.5);
        mat.emissive.setHex(0x0ea5e9);
        mat.emissiveIntensity = 0.12 + 0.18 * pulse;
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
