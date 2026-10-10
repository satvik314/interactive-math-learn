# Tangent: math you can touch

An interactive maths-learning site built with **Vite** and vanilla JavaScript using Canvas 2D. The theme is black and yellow. It has a landing page and three hands-on animations. Each lab comes with "Try this" challenges that check themselves.

| Lab | Concept | What you can do |
| --- | --- | --- |
| 01 · Trigonometry | Unit circle → sine & cosine waves | Drag the point round the circle or scrub along the wave, play/pause, change speed, toggle sin/cos/tan, snap to 15° |
| 02 · Geometry | Pythagorean theorem | Drag the triangle's corners to resize the squares on each side, then play/scrub the rearrangement proof (c² → a² + b²) |
| 03 · Calculus | Riemann sums → integrals | Pick a function, drag the bounds a/b, change n and the method (left/right/midpoint/trapezoid), hover strips, animate n → 100 |

Challenge progress is saved in `localStorage` and shown in the nav bar.

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # production build in dist/
npm run preview   # serve the production build
```

## Project structure

```
index.html              landing page markup (hero, how-it-works, labs, CTA)
src/main.js             mounts everything
src/style.css           black & yellow theme
src/hero.js             animated Lissajous hero
src/challenges.js       self-checking challenge tracker
src/lib/canvas.js       HiDPI canvas, visibility-aware loop, helpers
src/labs/unitCircle.js  Lab 01
src/labs/pythagoras.js  Lab 02
src/labs/riemann.js     Lab 03
```
