# LASIK, Layer by Layer

An interactive 3D educational website that walks through LASIK eye surgery
step by step on a rotatable Three.js eye model, with an exploded 3D explorer
for the cornea's six layers.

Static HTML/CSS/JS with Three.js vendored in `vendor/` — serve the folder with
any static file server (e.g. `python3 -m http.server`) or deploy via GitHub
Pages. ES modules require http(s), so opening `index.html` directly from disk
won't work.
