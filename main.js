/* ===================================================================
   LASIK · Contoura · SMILE — UI wiring for the 3D walkthrough
   =================================================================== */

import { createStage, createLayers, startLoop } from "./scene3d.js";

/* ---------------- Procedures & their steps ---------------- */

const PROCEDURES = {
  lasik: {
    name: "LASIK",
    full: "Laser-Assisted In Situ Keratomileusis",
    blurb: "The classic flap-based procedure. A femtosecond laser makes a thin hinged flap, an excimer laser reshapes the stroma underneath, and the flap is laid back down — no stitches.",
    steps: [
      {
        title: "Mapping & consultation", short: "Mapping", duration: "Days before",
        caption: "A topographer maps the cornea's shape and confirms candidacy",
        state: { fx: "topo" },
        body: "A corneal topographer scans the front of your eye to map its curvature and thickness. The surgeon confirms you're a good candidate — stable prescription, healthy eyes, enough corneal thickness — and programs the laser with your correction.",
        fact: "The map is unique to you, like a fingerprint of your vision.",
      },
      {
        title: "Numbing drops", short: "Numbing", duration: "~1 min",
        caption: "Anaesthetic drops numb the surface — no needles",
        state: { fx: "drops" },
        body: "Anaesthetic eye drops numb the surface completely. There are no injections and no general anaesthesia — you stay awake the whole time.",
        fact: "The cornea has more nerve endings per mm² than almost anywhere in the body.",
      },
      {
        title: "Holding the eye steady", short: "Suction", duration: "~30 sec",
        caption: "A suction ring docks onto the eye and holds it still",
        state: { fx: "suction" },
        body: "A soft holder stops you blinking and a gentle suction ring keeps the eye perfectly still for the laser. Vision dims for a few seconds — that's normal.",
        fact: "Eye-tracking lasers check eye position over 1,000 times per second.",
      },
      {
        title: "Creating the flap", short: "Flap cut", duration: "~15 sec",
        caption: "The femtosecond laser traces a thin flap, leaving a hinge",
        state: { fx: "femto", femtoMode: "flap", cut: true },
        body: "A femtosecond laser focuses ~110 µm down and forms microscopic bubbles that outline a thin circular flap, leaving an uncut 'hinge' on one side like the spine of a book.",
        fact: "A femtosecond is one quadrillionth of a second.",
      },
      {
        title: "Lifting the flap", short: "Flap lift", duration: "A few sec",
        caption: "The flap folds back on its hinge, exposing the stroma",
        state: { flapOpen: true },
        body: "The surgeon folds the flap back on its hinge, exposing the stroma — the thick middle layer that will be reshaped. Vision blurs here, which is normal.",
        fact: "The flap is only about a tenth of a millimetre thick.",
      },
      {
        title: "Reshaping the cornea", short: "Reshape", duration: "20–50 sec",
        caption: "Cool UV pulses sculpt the stroma — watch the dome flatten",
        state: { fx: "excimer", flapOpen: true, ablated: true },
        body: "A cool ultraviolet excimer laser vaporises stromal tissue with sub-micron precision — no heat. It flattens the centre for short-sightedness, steepens it for long-sightedness, or evens out astigmatism.",
        fact: "Each pulse removes ~0.25 µm of tissue.",
      },
      {
        title: "Repositioning the flap", short: "Reposition", duration: "~2 min",
        caption: "The flap floats back into place — natural suction seals it",
        state: { ablated: true, seam: true },
        body: "The flap is floated back into position. No stitches needed: the endothelium pumps fluid out, creating natural suction that holds the flap down within minutes.",
        fact: "The new, reshaped curve is now your cornea's permanent shape.",
      },
      {
        title: "Healing & recovery", short: "Healing", duration: "Hours → days",
        caption: "The epithelium seals the flap edge within hours",
        state: { fx: "heal", ablated: true, seam: true },
        body: "You rest with protective shields and lubricating drops. The epithelium seals the flap edge within hours, and most people see dramatically clearer by the next morning.",
        fact: "Many patients pass the driving vision test the very next day.",
      },
    ],
  },

  contoura: {
    name: "Contoura Vision",
    full: "Topography-Guided LASIK",
    blurb: "A premium, personalised LASIK. It captures an ultra-dense map of ~22,000 points and treats not just your prescription but the cornea's own tiny irregularities — aiming for sharper, higher-quality vision.",
    steps: [
      {
        title: "Ultra-detailed mapping", short: "Dense map", duration: "Days before",
        caption: "~22,000 points mapped — far denser than standard LASIK",
        state: { fx: "denseMap" },
        body: "Contoura captures up to ~22,000 elevation points across the cornea, charting tiny irregularities a standard map misses. This detailed map — not just your glasses prescription — drives the laser.",
        fact: "That's roughly 1,000× more data points than a basic refraction.",
      },
      {
        title: "Numbing drops", short: "Numbing", duration: "~1 min",
        caption: "Anaesthetic drops numb the surface — no needles",
        state: { fx: "drops" },
        body: "Anaesthetic eye drops numb the surface completely — no injections, no general anaesthesia.",
        fact: "You stay fully awake and comfortable throughout.",
      },
      {
        title: "Holding the eye steady", short: "Suction", duration: "~30 sec",
        caption: "A suction ring docks onto the eye and holds it still",
        state: { fx: "suction" },
        body: "A gentle suction ring holds the eye perfectly still and an eye-tracker keeps the personalised treatment precisely aligned to your map.",
        fact: "Alignment to your unique map is what makes Contoura 'topography-guided'.",
      },
      {
        title: "Creating the flap", short: "Flap cut", duration: "~15 sec",
        caption: "The femtosecond laser traces a thin flap, leaving a hinge",
        state: { fx: "femto", femtoMode: "flap", cut: true },
        body: "Like LASIK, a femtosecond laser forms a thin hinged flap in the cornea so the surgeon can reach the stroma underneath.",
        fact: "Mechanically, the flap step is the same as standard LASIK.",
      },
      {
        title: "Lifting the flap", short: "Flap lift", duration: "A few sec",
        caption: "The flap folds back on its hinge, exposing the stroma",
        state: { flapOpen: true },
        body: "The flap is folded back on its hinge to expose the stroma for the personalised ablation.",
        fact: "The flap will be replaced exactly where it came from.",
      },
      {
        title: "Personalised ablation", short: "Custom reshape", duration: "20–50 sec",
        caption: "The excimer follows your 22,000-point map — not just a prescription",
        state: { fx: "excimer", flapOpen: true, ablated: true, customAblation: true },
        body: "The excimer laser sculpts a customised pattern guided by your detailed topography, smoothing the cornea's own irregularities (higher-order aberrations) as well as correcting your refractive error.",
        fact: "Many patients report sharper night vision and less glare than with standard LASIK.",
      },
      {
        title: "Repositioning the flap", short: "Reposition", duration: "~2 min",
        caption: "The flap floats back into place — natural suction seals it",
        state: { ablated: true, seam: true },
        body: "The flap is floated back and self-seals without stitches, just as in standard LASIK.",
        fact: "The personalised reshaping is now permanent.",
      },
      {
        title: "Healing & recovery", short: "Healing", duration: "Hours → days",
        caption: "The epithelium seals the flap edge within hours",
        state: { fx: "heal", ablated: true, seam: true },
        body: "Recovery mirrors LASIK — clearer vision usually by the next morning, refined over the following days.",
        fact: "The goal of Contoura is quality of vision, not just 20/20.",
      },
    ],
  },

  smile: {
    name: "SMILE",
    full: "Small Incision Lenticule Extraction",
    blurb: "Flapless and minimally invasive. A single femtosecond laser carves a lens-shaped disc of tissue (a 'lenticule') inside an intact cornea, which the surgeon slips out through a tiny 2–4 mm incision.",
    steps: [
      {
        title: "Mapping & consultation", short: "Mapping", duration: "Days before",
        caption: "The cornea is measured to plan the lenticule",
        state: { fx: "topo" },
        body: "Your cornea is measured and your prescription confirmed. SMILE is especially suited to moderate-to-high short-sightedness with astigmatism.",
        fact: "SMILE is performed on a single laser platform, start to finish.",
      },
      {
        title: "Numbing drops", short: "Numbing", duration: "~1 min",
        caption: "Anaesthetic drops numb the surface — no needles",
        state: { fx: "drops" },
        body: "Anaesthetic eye drops numb the surface completely. No injections, no general anaesthesia.",
        fact: "The whole procedure typically takes just minutes per eye.",
      },
      {
        title: "Docking the laser", short: "Docking", duration: "~30 sec",
        caption: "A gentle contact glass docks onto the eye to hold it still",
        state: { fx: "suction" },
        body: "A soft contact glass gently docks onto the eye to hold it steady. The femtosecond laser will do everything from here — there's no second laser.",
        fact: "SMILE uses one laser only; LASIK uses two.",
      },
      {
        title: "Creating the lenticule", short: "Lenticule", duration: "~25 sec",
        caption: "The femto laser carves a lens-shaped disc inside the intact cornea",
        state: { fx: "femto", femtoMode: "lenticule", lenticule: true, lenticuleForming: true },
        body: "The femtosecond laser focuses inside the cornea and traces a thin lens-shaped piece of tissue — the lenticule. Its exact shape is your prescription. Crucially, the surface stays intact: no flap is created.",
        fact: "The lenticule's shape IS your correction, carved in one step.",
      },
      {
        title: "Removing the lenticule", short: "Extraction", duration: "~1 min",
        caption: "The lenticule slips out through a tiny 2–4 mm incision",
        state: { lenticule: true, incision: true, extract: true },
        body: "The laser also makes a small 2–4 mm incision at the edge. The surgeon gently separates and slides the lenticule out through it. Removing that tissue reshapes the cornea — correcting your vision.",
        fact: "That tiny incision replaces LASIK's ~20 mm flap edge.",
      },
      {
        title: "Healing & recovery", short: "Healing", duration: "Hours → days",
        caption: "The tiny incision seals quickly — the cornea stays strong",
        state: { fx: "heal" },
        body: "With no flap and only a tiny incision, the cornea keeps more of its structural strength and surface nerves. Vision clears over the first day or two, sometimes a touch slower than LASIK at first.",
        fact: "Fewer cut nerves means a lower risk of long-term dry eye.",
      },
    ],
  },
};

/* ---------------- Comparison data ---------------- */

const COMPARE_ROWS = [
  { key: "Flap", lasik: "Thin hinged corneal flap", contoura: "Thin hinged corneal flap", smile: "No flap — tiny incision" },
  { key: "Incision size", lasik: "~20 mm flap edge", contoura: "~20 mm flap edge", smile: "Just 2–4 mm" },
  { key: "Lasers used", lasik: "Femtosecond + excimer", contoura: "Femtosecond + excimer (guided)", smile: "Femtosecond only (one platform)" },
  { key: "Guided by", lasik: "Prescription / wavefront", contoura: "~22,000-point topography map", smile: "Manifest refraction" },
  { key: "Best for", lasik: "Most myopia, hyperopia & astigmatism", contoura: "Myopia & astigmatism wanting sharpest quality", smile: "Moderate–high myopia & astigmatism" },
  { key: "Dry-eye risk", lasik: "Moderate", contoura: "Moderate", smile: "Lower (fewer nerves cut)" },
  { key: "Corneal strength", lasik: "Flap slightly reduces it", contoura: "Flap slightly reduces it", smile: "Better preserved (no flap)" },
  { key: "Recovery", lasik: "Very fast (~1 day)", contoura: "Very fast (~1 day)", smile: "Fast; sharpening can take a few days" },
  { key: "Treats hyperopia?", lasik: "Yes", contoura: "Mainly myopia/astigmatism", smile: "Mainly myopia/astigmatism" },
];

const CHOOSE_NOTES = {
  lasik: "A proven all-rounder with the widest range of corrections and the fastest visual recovery.",
  contoura: "Choose this if you want the sharpest possible quality of vision, or have a cornea with measurable irregularities.",
  smile: "Choose this for a flapless option — great if you have dry eyes, an active/contact-sport lifestyle, or higher myopia.",
};

/* ---------------- Corneal layers ---------------- */

const LAYERS = [
  { name: "Tear film", color: "#9fdcf2", color3d: 0x9fdcf2, thickness: "~3 µm",
    desc: "A liquid coating of oil, water and mucus that lubricates the eye and creates a smooth optical surface.",
    lasik: "Temporarily disrupted — the main reason for short-term dry eyes after surgery. SMILE disturbs it least." },
  { name: "Epithelium", color: "#f6c9a8", color3d: 0xf6c9a8, thickness: "~50 µm",
    desc: "The cornea's living 'skin' — five to six cell layers that block dust and bacteria and regenerate weekly.",
    lasik: "Preserved inside the flap (LASIK/Contoura) or barely breached by SMILE's tiny incision; heals within hours." },
  { name: "Bowman's layer", color: "#e0a071", color3d: 0xe0a071, thickness: "~12 µm",
    desc: "A tough collagen sheet between epithelium and stroma. It cannot regenerate once damaged.",
    lasik: "Cut at the flap edge in LASIK/Contoura; left almost entirely intact by flapless SMILE." },
  { name: "Stroma", color: "#fbe3c9", color3d: 0xfbe3c9, thickness: "~500 µm · 90% of cornea",
    desc: "The structural core: hundreds of organised collagen sheets whose regularity makes the cornea clear.",
    lasik: "★ The layer that's reshaped. LASIK/Contoura ablate it with the excimer; SMILE removes a lenticule from within it." },
  { name: "Descemet's membrane", color: "#d98f63", color3d: 0xd98f63, thickness: "~10 µm",
    desc: "A thin, elastic basement membrane supporting the endothelium; very resistant to injury.",
    lasik: "Completely untouched in all three procedures — a safety buffer of stroma is always left intact." },
  { name: "Endothelium", color: "#c4734a", color3d: 0xc4734a, thickness: "Single cell layer · ~5 µm",
    desc: "A one-cell-thick pump lining the back of the cornea, keeping it clear. These cells never divide.",
    lasik: "Untouched by the laser — and its fluid pumps are what suction a LASIK flap back down without stitches." },
];

/* ---------------- 3D scenes ---------------- */

const $ = (id) => document.getElementById(id);

let stage = null, layers3d = null;
try {
  stage = createStage($("stage3d"));
  layers3d = createLayers($("layers3d"), LAYERS, (i) => selectLayer(i));
  startLoop([stage, layers3d]);
} catch (err) {
  console.error("WebGL unavailable:", err);
  document.querySelectorAll(".webgl-fallback").forEach((el) => (el.hidden = false));
}

/* ---------------- Procedure switcher ---------------- */

const procTabs = $("procTabs");
let activeProc = "lasik";

Object.entries(PROCEDURES).forEach(([key, proc]) => {
  const btn = document.createElement("button");
  btn.className = "proc-tab";
  btn.dataset.proc = key;
  btn.innerHTML = `<strong>${proc.name}</strong><span>${proc.full}</span>`;
  btn.addEventListener("click", () => setProcedure(key));
  procTabs.appendChild(btn);
});
const procTabBtns = Array.from(procTabs.querySelectorAll(".proc-tab"));

/* ---------------- Walkthrough UI ---------------- */

const stepsList = $("stepsList");
const progressBar = $("progressBar");
const prevBtn = $("prevBtn");
const nextBtn = $("nextBtn");
const playBtn = $("playBtn");

let steps = [];
let navButtons = [];
let current = 0;
let playTimer = null;

function setProcedure(key) {
  stopPlaying();
  activeProc = key;
  const proc = PROCEDURES[key];
  steps = proc.steps;

  procTabBtns.forEach((b) => b.classList.toggle("active", b.dataset.proc === key));
  $("procBlurb").textContent = proc.blurb;

  /* rebuild the step nav */
  stepsList.innerHTML = "";
  steps.forEach((step, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "step-btn";
    btn.setAttribute("aria-label", `Step ${i + 1}: ${step.title}`);
    btn.innerHTML = `<span class="dot">${i + 1}</span><span>${step.short}</span>`;
    btn.addEventListener("click", () => { stopPlaying(); goTo(i); });
    li.appendChild(btn);
    stepsList.appendChild(li);
  });
  navButtons = Array.from(stepsList.querySelectorAll(".step-btn"));
  goTo(0);
}

function goTo(index) {
  current = Math.max(0, Math.min(steps.length - 1, index));
  const step = steps[current];

  if (stage) stage.applyStep(step.state);
  $("stageCaption").textContent = step.caption;

  $("cardNum").textContent = current + 1;
  $("cardTitle").textContent = step.title;
  $("cardDuration").textContent = step.duration;
  $("cardBody").textContent = step.body;
  $("cardFact").textContent = step.fact;

  navButtons.forEach((b, i) => {
    b.classList.toggle("active", i === current);
    b.classList.toggle("done", i < current);
  });

  progressBar.style.width = `${((current + 1) / steps.length) * 100}%`;
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === steps.length - 1;
}

function stopPlaying() {
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
    playBtn.textContent = "▶ Play all steps";
    playBtn.classList.remove("playing");
  }
}

function startPlaying() {
  if (current === steps.length - 1) goTo(0);
  playBtn.textContent = "⏸ Stop";
  playBtn.classList.add("playing");
  playTimer = setInterval(() => {
    if (current >= steps.length - 1) { stopPlaying(); return; }
    goTo(current + 1);
  }, 5000);
}

prevBtn.addEventListener("click", () => { stopPlaying(); goTo(current - 1); });
nextBtn.addEventListener("click", () => { stopPlaying(); goTo(current + 1); });
playBtn.addEventListener("click", () => (playTimer ? stopPlaying() : startPlaying()));

document.addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea, select, button")) return;
  if (e.key === "ArrowRight") { stopPlaying(); goTo(current + 1); }
  if (e.key === "ArrowLeft") { stopPlaying(); goTo(current - 1); }
});

setProcedure("lasik");

/* ---------------- Comparison section ---------------- */

const compareGrid = $("compareGrid");
const PROC_KEYS = ["lasik", "contoura", "smile"];

/* header row */
const headRow = document.createElement("div");
headRow.className = "cmp-row cmp-head";
headRow.innerHTML =
  `<div class="cmp-cell cmp-key"></div>` +
  PROC_KEYS.map((k) => `<div class="cmp-cell"><span class="cmp-proc">${PROCEDURES[k].name}</span></div>`).join("");
compareGrid.appendChild(headRow);

COMPARE_ROWS.forEach((row) => {
  const r = document.createElement("div");
  r.className = "cmp-row";
  r.innerHTML =
    `<div class="cmp-cell cmp-key">${row.key}</div>` +
    PROC_KEYS.map((k) => `<div class="cmp-cell" data-label="${PROCEDURES[k].name}">${row[k]}</div>`).join("");
  compareGrid.appendChild(r);
});

/* "how to choose" cards */
const chooseGrid = $("chooseGrid");
PROC_KEYS.forEach((k) => {
  const card = document.createElement("div");
  card.className = "choose-card";
  card.innerHTML = `<h3>${PROCEDURES[k].name}</h3><p>${CHOOSE_NOTES[k]}</p>` +
    `<button class="link-btn" data-proc="${k}">See the steps →</button>`;
  chooseGrid.appendChild(card);
});
chooseGrid.querySelectorAll(".link-btn").forEach((b) => {
  b.addEventListener("click", () => {
    setProcedure(b.dataset.proc);
    $("procedure").scrollIntoView({ behavior: "smooth" });
  });
});

/* ---------------- Layer explorer UI ---------------- */

const chipRow = $("layerChips");
LAYERS.forEach((layer, i) => {
  const chip = document.createElement("button");
  chip.className = "layer-chip";
  chip.style.setProperty("--chip-color", layer.color);
  chip.textContent = layer.name;
  chip.addEventListener("click", () => selectLayer(i));
  chipRow.appendChild(chip);
});
const chips = Array.from(chipRow.querySelectorAll(".layer-chip"));

function selectLayer(i) {
  chips.forEach((c, j) => c.classList.toggle("selected", j === i));
  if (layers3d) layers3d.selectLayer(i);
  const layer = LAYERS[i];
  $("layerName").textContent = layer.name;
  $("layerThickness").textContent = layer.thickness;
  $("layerDesc").textContent = layer.desc;
  $("layerLasik").textContent = layer.lasik;
}
selectLayer(3); /* start on the stroma — the layer all three procedures reshape */
