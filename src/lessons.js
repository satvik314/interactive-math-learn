// Guided lessons. Each lab is taught in four steps: two explores, a timed
// challenge and a multiple-choice check. A step's `done(state)` is tested
// against the lab's live state every frame; `feedback(state, done)` explains
// what the learner is seeing.

import { createUnitCircle, piLabel } from './labs/unitCircle.js';
import { createPythagoras, isWhole } from './labs/pythagoras.js';
import { createRiemann, riemann, FUNCTIONS, METHOD_LABELS } from './labs/riemann.js';
import { fmt, TAU } from './lib/canvas.js';

export const COMPLETION_XP = 30;

const pct = (v) => `${(v * 100).toFixed(1)}%`;

export const LESSONS = [
  {
    id: 'trig',
    num: '01',
    unit: 'Trigonometry',
    title: 'The unit circle draws the sine wave',
    blurb: 'A point runs round a circle of radius 1. Its height is sin θ, its sideways position is cos θ, and unrolling that height over time draws a wave.',
    keyIdea: 'The radius is always 1, so by Pythagoras sin²θ + cos²θ = 1 for every angle. The point comes back round every 2π, so the wave repeats.',
    ratio: 'ratio-wide',
    create: createUnitCircle,
    doneTitle: 'You can read sin and cos off a circle now.',
    doneLine: 'Height is sin θ, sideways is cos θ, and one lap is 2π. Every trig identity you meet next is a fact about this picture.',
    steps: [
      {
        kind: 'explore', short: 'Spin the point', xp: 10,
        kicker: 'Step 1 · Explore',
        title: 'Drag the point round the circle.',
        body: 'The blue segment is the point’s height and the dark one is how far it sits to the right. Those two lengths are sin θ and cos θ. Drag the point and watch both change.',
        controls: ['angle', 'show'],
        enter: (lab) => lab.preset({ theta: Math.PI / 6, playing: false, show: { sin: true, cos: true, tan: false }, snap: false }),
        done: (s) => s.touched,
        feedback: (s, done) => (done
          ? `At θ = ${Math.round(s.deg)}° the point is <b>${fmt(s.sin, 2)}</b> up and <b>${fmt(s.cos, 2)}</b> across.${s.sin < 0 || s.cos < 0 ? ' Below or left of the centre, those numbers go negative.' : ''}`
          : ''),
      },
      {
        kind: 'explore', short: 'Unroll the wave', xp: 10,
        kicker: 'Step 2 · Explore',
        title: 'Press Play and let it do one lap.',
        body: 'While the point goes round, its height is copied across to the right, one angle at a time. That trace is the sine wave. The dark trace is the cosine wave.',
        controls: ['play', 'speed'],
        enter: (lab) => lab.preset({ theta: 0, playing: false }),
        done: (s) => s.lap >= TAU - 0.05,
        feedback: (s, done) => {
          if (done) return 'One lap is <b>2π radians</b> (360°). After that the point retraces its path, so the wave repeats forever.';
          if (s.lap > 0) return `Lap progress: <b>${Math.min(99, Math.floor((s.lap / TAU) * 100))}%</b>`;
          return '';
        },
      },
      {
        kind: 'challenge', short: 'sin = cos', xp: 15, timed: true,
        kicker: 'Step 3 · Timed challenge',
        title: 'Find an angle where sin θ = cos θ.',
        body: 'Drag until the blue and dark segments are exactly the same length. The clock is running.',
        controls: ['angle', 'show'],
        enter: (lab) => lab.preset({ theta: (2 * Math.PI) / 3, playing: false, snap: false }),
        done: (s) => !s.playing && Math.abs(s.sin - s.cos) < 0.012,
        feedback: (s, done) => (done
          ? `Found it at θ = <b>${Math.round(s.deg)}°</b> (${piLabel((s.deg * Math.PI) / 180)}). There’s a second answer half a lap away, at 225°.`
          : ''),
      },
      {
        kind: 'check', short: 'Quadrant check', xp: 5,
        kicker: 'Step 4 · Check',
        title: 'cos θ is negative and sin θ is positive. Where is the point?',
        body: 'Think about which side of the centre the point is on, and whether it’s above or below the middle line.',
        options: ['Top right', 'Top left', 'Bottom left', 'Bottom right'],
        answer: 1,
        right: 'Correct. Negative cos means left of the centre and positive sin means above it. That’s the top-left quarter, between 90° and 180°.',
        wrong: 'Not quite. Negative cos puts the point left of the centre, and positive sin puts it above. The answer is the top-left quarter.',
      },
    ],
  },
  {
    id: 'geometry',
    num: '02',
    unit: 'Geometry',
    title: 'Seeing why a² + b² = c²',
    blurb: 'Build a square on each side of a right triangle. The two small squares always add up to the big one. Then slide four triangles around to see why.',
    keyIdea: 'Both pictures on the right are the same big square holding the same four triangles. The uncovered area must match: first it’s c², then it’s a² + b².',
    ratio: 'ratio-geo',
    create: createPythagoras,
    doneTitle: 'You’ve proved Pythagoras, with pictures.',
    doneLine: 'Same square, same four triangles, so the leftover areas must be equal. That’s a real proof, and it works for every right triangle.',
    steps: [
      {
        kind: 'explore', short: 'Drag a corner', xp: 10,
        kicker: 'Step 1 · Explore',
        title: 'Drag a blue corner.',
        body: 'The blue dots are the ends of the two short sides, a and b. Drag one and watch all three squares change. Keep an eye on the sum under the picture.',
        controls: ['a', 'b'],
        enter: (lab) => lab.preset({ a: 2, b: 3, t: 0 }),
        done: (s) => s.touched,
        feedback: (s, done) => (done
          ? `a² + b² = ${fmt(s.a * s.a, 2)} + ${fmt(s.b * s.b, 2)} = <b>${fmt(s.a * s.a + s.b * s.b, 2)}</b>, and c² is <b>${fmt(s.c * s.c, 2)}</b>. The same number every time.`
          : ''),
      },
      {
        kind: 'explore', short: 'Rearrange', xp: 10,
        kicker: 'Step 2 · Explore',
        title: 'Now rearrange the triangles.',
        body: 'On the right, four copies of your triangle sit inside a square with sides a + b. Press Rearrange, or drag the proof slider, and watch the uncovered gap.',
        controls: ['rearrange', 'proof'],
        enter: (lab) => lab.preset({ t: 0 }),
        done: (s) => s.t >= 0.999,
        feedback: (s, done) => {
          if (done) return 'The big square and the four triangles never changed, so the uncovered area didn’t either. Before, it was <b>c²</b>. Now it’s <b>a² + b²</b>.';
          if (s.t > 0.02) return 'Keep going. Watch the uncovered gap split into two squares.';
          return '';
        },
      },
      {
        kind: 'challenge', short: 'Whole numbers', xp: 15, timed: true,
        kicker: 'Step 3 · Timed challenge',
        title: 'Make every side a whole number.',
        body: 'Pick whole-number legs a and b so the long side c comes out whole too. A triangle like that is called a Pythagorean triple.',
        controls: ['a', 'b'],
        enter: (lab) => lab.preset({ a: 2, b: 3, t: 0 }),
        done: (s) => isWhole(s.a) && isWhole(s.b) && isWhole(s.c),
        feedback: (s, done) => (done
          ? `<b>${Math.round(s.a)}, ${Math.round(s.b)}, ${Math.round(s.c)}</b>: ${Math.round(s.a * s.a)} + ${Math.round(s.b * s.b)} = ${Math.round(s.c * s.c)}. That’s a Pythagorean triple.`
          : ''),
      },
      {
        kind: 'check', short: 'Longest side', xp: 5,
        kicker: 'Step 4 · Check',
        title: 'A right triangle has legs 6 and 8. How long is the longest side?',
        body: 'Square both legs, add them, then take the square root.',
        options: ['10', '12', '14', '48'],
        answer: 0,
        right: 'Correct. 6² + 8² = 36 + 64 = 100, and √100 = 10. It’s the 3-4-5 triangle, doubled.',
        wrong: 'Not quite. 6² + 8² = 36 + 64 = 100, and √100 = 10.',
      },
    ],
  },
  {
    id: 'calculus',
    num: '03',
    unit: 'Calculus',
    title: 'Area under a curve, one rectangle at a time',
    blurb: 'Curved areas are hard; rectangles are easy. Chop the region into thin strips, add them up and let the strips get thinner. The limit is the integral.',
    keyIdea: '∫ f(x) dx is the limit of Σ f(xᵢ)·Δx as n → ∞. Area below the x-axis counts as negative. Hover a strip to see its signed area.',
    ratio: 'ratio-calc',
    create: createRiemann,
    doneTitle: 'You just did integration.',
    doneLine: 'Add up thin rectangles, then make them thinner forever. The number the sum settles on is the integral.',
    steps: [
      {
        kind: 'explore', short: 'More strips', xp: 10,
        kicker: 'Step 1 · Explore',
        title: 'Use more, thinner rectangles.',
        body: 'The rectangles estimate the area under y = x² from 0 to 3. The exact answer is 9. Drag the n slider up to at least 20 and watch the error shrink.',
        controls: ['n'],
        enter: (lab) => lab.preset({ fnId: 'square', method: 'left', n: 4 }),
        done: (s) => s.n >= 20,
        feedback: (s, done) => (done || s.n > 4
          ? `With n = ${s.n} the sum is <b>${fmt(s.approx, 3)}</b>, off by <b>${pct(s.rel)}</b>.${done ? ' More strips means less gap between the rectangles and the curve.' : ''}`
          : ''),
      },
      {
        kind: 'explore', short: 'Smarter heights', xp: 10,
        kicker: 'Step 2 · Explore',
        title: 'Take each height from the middle.',
        body: 'Each rectangle’s height comes from one point on the curve. Left uses the left edge. Switch to Midpoint and compare the error with the same n.',
        controls: ['method', 'n'],
        enter: (lab) => lab.preset({ fnId: 'square', method: 'left', n: 8 }),
        done: (s) => s.method === 'mid',
        feedback: (s, done) => {
          if (!done && s.method === 'left') return '';
          const left = Math.abs(riemann(FUNCTIONS[s.fnId], 'left', s.a, s.b, s.n) - s.exact) / Math.abs(s.exact);
          return `${METHOD_LABELS[s.method]} error: <b>${pct(s.rel)}</b>, against <b>${pct(left)}</b> for Left with the same ${s.n} strips.`;
        },
      },
      {
        kind: 'challenge', short: 'Zero area', xp: 15, timed: true,
        kicker: 'Step 3 · Timed challenge',
        title: 'Make the total area zero.',
        body: 'This is y = x³ − 3x. Area below the x-axis counts as negative. Drag the a and b markers until the positive and negative parts cancel out.',
        controls: ['n'],
        enter: (lab) => lab.preset({ fnId: 'cubic', method: 'mid', n: 16 }),
        done: (s) => s.fnId === 'cubic' && s.movedBounds && Math.abs(s.exact) < 0.05,
        feedback: (s, done) => (done
          ? `From ${fmt(s.a, 2)} to ${fmt(s.b, 2)} the exact area is <b>${fmt(s.exact, 3)}</b>. The red area below the axis cancels the blue area above it.`
          : ''),
      },
      {
        kind: 'check', short: 'Too big or small?', xp: 5,
        kicker: 'Step 4 · Check',
        title: 'For y = x² from 0 to 3, is the Left-rule sum too big or too small?',
        body: 'x² climbs as x grows. Where on each strip is the curve at its lowest?',
        options: ['Too small', 'Too big', 'Exactly right', 'It depends on n'],
        answer: 0,
        right: 'Correct. x² is increasing, so each strip’s left edge is its lowest point. Every rectangle sits under the curve, whatever n is.',
        wrong: 'Not quite. x² is increasing, so each left edge is the lowest point of its strip. Every rectangle sits under the curve, so the sum is too small.',
      },
    ],
  },
];

export const lessonById = (id) => LESSONS.find((l) => l.id === id);
export const maxLessonXp = (lesson) => lesson.steps.reduce((s, st) => s + st.xp, 0) + COMPLETION_XP;
