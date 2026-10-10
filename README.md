# Tangent: math you can touch

An interactive maths course built with **Vite** and vanilla JavaScript using Canvas 2D. It uses a graph-paper design: cream paper, ink outlines, hard offset shadows and a single blue accent. The fonts are Bricolage Grotesque and IBM Plex Mono.

## How it works

- **Course map (`#/`)**: one unit per lesson. Each unit shows step nodes (done ✓, current GO, upcoming) and a live, looping preview of its animation. A sidebar shows total XP, the daily streak and what's up next.
- **Guided lesson (`#/learn/<id>`)**: four steps, each with a segmented progress bar and an XP counter:
  1. **Explore**: drag something and see what changes
  2. **Explore**: find the pattern behind it
  3. **Timed challenge**: hit a target against the clock
  4. **Check**: one multiple-choice question

  Continue unlocks only once the step is done. Live feedback explains what you're seeing, and a completion card sums up the lesson.
- **Free play (`#/play/<id>`)**: the same animation with every control unlocked.

| Lesson | Concept | Interaction |
| --- | --- | --- |
| 01 · Trigonometry | Unit circle → sine & cosine waves | Drag the point round the circle, play/pause, toggle sin/cos/tan, snap to 15° |
| 02 · Geometry | Pythagorean theorem | Drag the triangle's corners; play or scrub the rearrangement proof |
| 03 · Calculus | Riemann sums → integrals | Change n and the rule, drag the bounds a/b, hover strips, animate n → 100 |

Progress (steps, XP, best challenge time, streak) is saved in `localStorage`.

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # production build in dist/
npm run preview   # serve the production build
```

## Project structure

```
index.html               app shell
src/main.js              hash router
src/style.css            graph-paper design system
src/lessons.js           lesson content: steps, checks, feedback
src/progress.js          XP / steps / streak persistence
src/screens/home.js      course map
src/screens/lesson.js    guided lesson + free play
src/ui/controls.js       renders a lab's controls as cards
src/lib/canvas.js        canvas helpers and palette
src/labs/unitCircle.js   Lab 01
src/labs/pythagoras.js   Lab 02
src/labs/riemann.js      Lab 03
```
