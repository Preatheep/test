# Laser Eye Surgery, in 3D — LASIK · Contoura · SMILE

An interactive, mobile-friendly 3D guide that walks through three laser eye
surgeries step by step on a rotatable Three.js eye model, compares them side by
side, and helps visitors understand which might suit them.

- **Procedure switcher** — LASIK, Contoura Vision (topography-guided LASIK), and
  SMILE, each with its own animated steps (flap creation & excimer ablation,
  a dense ~22,000-point map with personalized ablation, or a flapless lenticule
  carved and extracted through a tiny incision).
- **Comparison table** that reflows into stacked cards on mobile, plus
  "which might suit you?" cards.
- **3D corneal layer explorer** — click a layer to pull it out of the stack.

## Running it

Static HTML/CSS/JS with Three.js vendored in `vendor/` — no build step. ES
modules require http(s), so serve the folder rather than opening the file
directly:

```
python3 -m http.server
```

Then open http://localhost:8000. It also deploys as-is to GitHub Pages.

On touch devices, swipe horizontally to rotate the model and vertically to
scroll the page; pinch to zoom.
