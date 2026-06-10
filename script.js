/* ===================================================================
   LASIK, Layer by Layer — interactive walkthrough
   =================================================================== */

(function () {
  "use strict";

  /* ---------------- Procedure steps ---------------- */

  const STEPS = [
    {
      title: "Mapping & consultation",
      short: "Corneal mapping",
      duration: "Days before surgery",
      body:
        "Before anyone touches a laser, a corneal topographer scans thousands of points " +
        "across the front of your eye, building a precise 3D map of the cornea's curvature " +
        "and thickness. The surgeon uses this map to confirm you're a good candidate — a " +
        "stable prescription, healthy eyes, and enough corneal thickness to reshape safely — " +
        "and to program the laser with your exact correction.",
      fact:
        "The wavefront map is unique to you, like a fingerprint of your vision. It can detect " +
        "imperfections far subtler than a regular glasses prescription.",
      state: { fx: "fx-topo" },
    },
    {
      title: "Numbing drops",
      short: "Numbing drops",
      duration: "About 1 minute",
      body:
        "On surgery day, anaesthetic eye drops numb the surface of the eye completely — there " +
        "are no injections and no general anaesthesia. You stay awake the whole time, and many " +
        "clinics offer a mild oral sedative if you're nervous. Within a minute, the eye can't " +
        "feel touch, though you'll still see light and movement.",
      fact:
        "The cornea has more nerve endings per square millimetre than almost anywhere in the " +
        "body — which is exactly why those drops matter.",
      state: { fx: "fx-drops" },
    },
    {
      title: "Holding the eye steady",
      short: "Eye stabilised",
      duration: "About 30 seconds",
      body:
        "A soft eyelid holder keeps you from blinking (you won't feel the urge — the drops take " +
        "care of that), and a gentle suction ring docks onto the eye to hold it perfectly still " +
        "for the laser. You'll feel light pressure and your vision will dim or go dark for a few " +
        "seconds. That's expected and completely normal.",
      fact:
        "Modern eye-tracking lasers check eye position over 1,000 times per second — if you " +
        "move, the laser pauses or follows within milliseconds.",
      state: { fx: "fx-suction" },
    },
    {
      title: "Creating the flap",
      short: "Flap created",
      duration: "~15 seconds per eye",
      body:
        "A femtosecond laser fires ultra-fast pulses that pass harmlessly through the surface " +
        "and focus about 110 microns down, forming a layer of microscopic bubbles inside the " +
        "stroma. Those bubbles trace out a thin circular flap — through the epithelium, " +
        "Bowman's layer, and the top of the stroma — leaving a small uncut 'hinge' on one side, " +
        "like the spine of a book.",
      fact:
        "A femtosecond is one quadrillionth of a second. In the time light takes to cross a " +
        "human hair, this laser has already finished a pulse.",
      state: { fx: "fx-femto", show: ["flapOutline"] },
    },
    {
      title: "Lifting the flap",
      short: "Flap lifted",
      duration: "A few seconds",
      body:
        "The surgeon gently folds the flap back on its hinge, like opening a tiny book cover. " +
        "This exposes the stroma — the thick middle layer of the cornea that will actually be " +
        "reshaped. Your vision goes blurry at this point (the flap is part of your optical " +
        "surface), which is normal and temporary.",
      fact:
        "The flap is only about a tenth of a millimetre thick — yet it contains three distinct " +
        "tissue layers.",
      state: { flapOpen: true, show: ["bedGap", "bedLine", "flapTag", "hingeDot", "flapOutline"] },
    },
    {
      title: "Reshaping the cornea",
      short: "Cornea reshaped",
      duration: "20–50 seconds per eye",
      body:
        "This is the step that corrects your vision. A cool ultraviolet excimer laser vaporises " +
        "stromal tissue with sub-micron precision — no heat, no burning — following the map made " +
        "at your consultation. For short-sightedness it flattens the centre; for " +
        "long-sightedness it steepens it; for astigmatism it evens out the curvature. You just " +
        "stare at a blinking target light while the laser does the sculpting.",
      fact:
        "Each pulse removes about 0.25 microns of tissue. Correcting one dioptre of myopia " +
        "removes roughly the thickness of a red blood cell — around 12 microns.",
      state: { flapOpen: true, fx: "fx-excimer", show: ["bedGap", "divot", "bedCurve", "flapTag", "hingeDot"] },
    },
    {
      title: "Repositioning the flap",
      short: "Flap repositioned",
      duration: "About 2 minutes",
      body:
        "The surgeon floats the flap back into its original position and smooths it out like a " +
        "tiny blanket. Here's the elegant part: no stitches are needed. The endothelium — the " +
        "cornea's innermost layer — constantly pumps fluid out of the tissue, creating natural " +
        "suction that holds the flap down within minutes. The new, reshaped curve is now your " +
        "cornea's permanent shape.",
      fact:
        "The flap edge alignment is checked under the microscope; the natural 'dehydration " +
        "suction' starts sealing it almost immediately.",
      state: { show: ["seam"] },
    },
    {
      title: "Healing & recovery",
      short: "Healing",
      duration: "Hours → days",
      body:
        "You'll rest for a short while, go home with protective shields and lubricating drops, " +
        "and mostly just keep your eyes closed for a few hours. The epithelium — the fastest " +
        "healing tissue in your body — seals the flap edge within hours. Most people notice " +
        "dramatically clearer vision by the next morning, with vision continuing to sharpen " +
        "over the following days to weeks.",
      fact:
        "Many patients pass the driving vision test at their check-up the very next day. The " +
        "most common side effects — dry eyes and night-time halos — usually fade over weeks.",
      state: { fx: "fx-heal", show: ["seam"], seamFading: true },
    },
  ];

  /* All toggleable SVG elements (everything optional in any state) */
  const TOGGLEABLE = [
    "fx-topo", "fx-drops", "fx-suction", "fx-femto", "fx-excimer", "fx-heal",
    "bedGap", "bedLine", "bedCurve", "divot", "seam", "flapTag", "hingeDot", "flapOutline",
  ];

  const $ = (id) => document.getElementById(id);

  const stepsList = $("stepsList");
  const flap = $("flap");
  const seam = $("seam");
  const progressBar = $("progressBar");
  const prevBtn = $("prevBtn");
  const nextBtn = $("nextBtn");
  const playBtn = $("playBtn");

  let current = 0;
  let playTimer = null;

  /* Build step nav */
  STEPS.forEach((step, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "step-btn";
    btn.setAttribute("aria-label", `Step ${i + 1}: ${step.title}`);
    btn.innerHTML = `<span class="dot">${i + 1}</span><span>${step.short}</span>`;
    btn.addEventListener("click", () => { stopPlaying(); goTo(i); });
    li.appendChild(btn);
    stepsList.appendChild(li);
  });

  const navButtons = Array.from(stepsList.querySelectorAll(".step-btn"));

  function setVisible(id, visible) {
    const el = $(id);
    if (!el) return;
    el.classList.toggle("visible-el", visible);
    el.classList.toggle("hidden-el", !visible);
  }

  function goTo(index) {
    current = Math.max(0, Math.min(STEPS.length - 1, index));
    const step = STEPS[current];
    const state = step.state || {};
    const visible = new Set(state.show || []);
    if (state.fx) visible.add(state.fx);

    TOGGLEABLE.forEach((id) => setVisible(id, visible.has(id)));

    flap.classList.toggle("open", !!state.flapOpen);
    seam.classList.toggle("fading", !!state.seamFading);

    /* Card */
    $("cardNum").textContent = current + 1;
    $("cardTitle").textContent = step.title;
    $("cardDuration").textContent = step.duration;
    $("cardBody").textContent = step.body;
    $("cardFact").textContent = step.fact;

    /* Nav state */
    navButtons.forEach((b, i) => {
      b.classList.toggle("active", i === current);
      b.classList.toggle("done", i < current);
    });

    progressBar.style.width = `${((current + 1) / STEPS.length) * 100}%`;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === STEPS.length - 1;
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
    if (current === STEPS.length - 1) goTo(0);
    playBtn.textContent = "⏸ Stop";
    playBtn.classList.add("playing");
    playTimer = setInterval(() => {
      if (current >= STEPS.length - 1) { stopPlaying(); return; }
      goTo(current + 1);
    }, 5000);
  }

  prevBtn.addEventListener("click", () => { stopPlaying(); goTo(current - 1); });
  nextBtn.addEventListener("click", () => { stopPlaying(); goTo(current + 1); });
  playBtn.addEventListener("click", () => (playTimer ? stopPlaying() : startPlaying()));

  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea, select")) return;
    if (e.key === "ArrowRight") { stopPlaying(); goTo(current + 1); }
    if (e.key === "ArrowLeft") { stopPlaying(); goTo(current - 1); }
  });

  goTo(0);

  /* ---------------- Corneal layer explorer ---------------- */

  const LAYERS = [
    {
      name: "Tear film",
      color: "#9fdcf2",
      height: 36,
      thickness: "~3 µm",
      desc:
        "A liquid coating of oil, water, and mucus that keeps the eye lubricated and creates a " +
        "perfectly smooth optical surface. A poor tear film blurs vision before light even " +
        "reaches the cornea.",
      lasik:
        "Temporarily disrupted — this is why dry eyes are the most common (and usually " +
        "temporary) side effect after LASIK. Lubricating drops manage it while nerves recover.",
    },
    {
      name: "Epithelium",
      color: "#f6c9a8",
      height: 52,
      thickness: "~50 µm",
      desc:
        "The cornea's living 'skin' — five to six cell layers that block dust and bacteria. It " +
        "is the fastest regenerating tissue in the human body, completely renewing itself " +
        "roughly every week.",
      lasik:
        "Preserved inside the flap rather than removed (that's the key difference from PRK). " +
        "Its rapid healing seals the flap edge within hours of surgery.",
    },
    {
      name: "Bowman's layer",
      color: "#e0a071",
      height: 36,
      thickness: "~12 µm",
      desc:
        "A tough, smooth sheet of condensed collagen fibres that acts as a protective barrier " +
        "between the epithelium and stroma. Unlike the epithelium, it cannot regenerate once " +
        "damaged.",
      lasik:
        "Cut once at the flap edge during flap creation, then lies back in place with the flap. " +
        "The central portion over your line of sight is never ablated.",
    },
    {
      name: "Stroma",
      color: "#fbe3c9",
      height: 130,
      thickness: "~500 µm · 90% of the cornea",
      desc:
        "The cornea's structural core: hundreds of precisely organised collagen sheets " +
        "(lamellae) stacked like plywood. Their perfect regularity is what makes the cornea " +
        "transparent instead of white like the sclera.",
      lasik:
        "★ The star of the show. This is the layer the excimer laser sculpts to change the " +
        "cornea's curvature — and with it, your prescription. The change is permanent because " +
        "removed stroma does not grow back.",
    },
    {
      name: "Descemet's membrane",
      color: "#d98f63",
      height: 36,
      thickness: "~10 µm",
      desc:
        "A thin, elastic basement membrane that the endothelial cells rest on. It thickens " +
        "slowly throughout life and is remarkably resistant to injury and infection.",
      lasik:
        "Completely untouched. The laser works far above it — a planned safety buffer of " +
        "stroma is always left intact.",
    },
    {
      name: "Endothelium",
      color: "#c4734a",
      height: 40,
      thickness: "Single cell layer · ~5 µm",
      desc:
        "A one-cell-thick mosaic lining the back of the cornea. Its pumps constantly move " +
        "fluid out of the cornea, keeping it compact and crystal clear. These cells never " +
        "divide — you're born with your lifetime supply.",
      lasik:
        "Untouched by the laser — but its fluid pumps are what suction the flap back down at " +
        "the end of surgery, replacing the need for stitches.",
    },
  ];

  const stack = $("layerStack");

  LAYERS.forEach((layer, i) => {
    const band = document.createElement("button");
    band.className = "layer-band";
    band.style.background = layer.color;
    band.style.minHeight = layer.height + "px";
    band.setAttribute("role", "tab");
    band.innerHTML =
      `<span>${layer.name}</span><span class="band-thickness">${layer.thickness}</span>`;
    band.addEventListener("click", () => selectLayer(i));
    stack.appendChild(band);
  });

  const bands = Array.from(stack.querySelectorAll(".layer-band"));

  function selectLayer(i) {
    const layer = LAYERS[i];
    bands.forEach((b, j) => {
      b.classList.toggle("selected", j === i);
      b.setAttribute("aria-selected", j === i ? "true" : "false");
    });
    $("layerName").textContent = layer.name;
    $("layerThickness").textContent = layer.thickness;
    $("layerDesc").textContent = layer.desc;
    $("layerLasik").textContent = layer.lasik;
  }

  selectLayer(3); /* start on the stroma — the layer LASIK reshapes */
})();
