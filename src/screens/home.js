// Home: the course map. One unit per lesson, with step nodes (done / current /
// upcoming) and a live, looping preview of that lesson's animation.

import { LESSONS, maxLessonXp } from '../lessons.js';
import { lessonProgress, lessonsComplete, resetProgress, streakDays, totalXp } from '../progress.js';
import { sidebar } from './shared.js';

function stepNode(lesson, step, i, prog) {
  const done = prog.complete || i < prog.step;
  const current = !prog.complete && i === prog.step;
  const mark = done
    ? `<span class="node node-done" aria-hidden="true">✓</span>`
    : current
      ? `<a class="node node-current" href="#/learn/${lesson.id}" aria-label="Continue: ${step.short}">GO</a>`
      : `<span class="node node-todo" aria-hidden="true">${i + 1}</span>`;
  return `<li class="step-node${done ? ' is-done' : ''}">
    ${mark}
    <span class="node-title">${step.short}</span>
    <span class="node-xp">${step.xp} XP${step.timed ? ' · timed' : ''}</span>
  </li>`;
}

function unitCard(lesson) {
  const prog = lessonProgress(lesson.id);
  const meta = prog.complete ? 'Complete' : prog.step > 0 ? `${prog.step} of ${lesson.steps.length}` : `${maxLessonXp(lesson)} XP`;
  const cta = prog.complete ? 'Replay lesson' : prog.step > 0 ? 'Continue lesson' : 'Start lesson';
  return `<section class="unit" id="unit-${lesson.id}">
    <div class="unit-head">
      <div class="unit-title"><span class="mono num">${lesson.num}</span><h2>${lesson.title}</h2></div>
      <span class="mono meta${prog.complete ? ' meta-done' : ''}">${lesson.unit} · ${meta}</span>
    </div>
    <div class="unit-body">
      <div class="unit-info">
        <p>${lesson.blurb}</p>
        <ol class="step-nodes">${lesson.steps.map((s, i) => stepNode(lesson, s, i, prog)).join('')}</ol>
        <div class="unit-actions">
          <a class="btn btn-ink" href="#/learn/${lesson.id}">${cta} →</a>
          <a class="btn btn-card" href="#/play/${lesson.id}">Free play</a>
        </div>
      </div>
      <a class="preview" href="#/learn/${lesson.id}" aria-label="${cta}: ${lesson.title}">
        <canvas class="${lesson.ratio}" data-preview="${lesson.id}" aria-hidden="true"></canvas>
        <span class="preview-tag mono">Live preview</span>
      </a>
    </div>
  </section>`;
}

function upNext() {
  const next = LESSONS.find((l) => !lessonProgress(l.id).complete);
  if (!next) {
    return `<div class="ink-card">
      <div class="ink-kicker mono">All done</div>
      <div class="ink-title">You’ve finished every lesson. Try beating your challenge times in free play.</div>
      <a class="btn btn-blue btn-sm" href="#/play/${LESSONS[0].id}">Free play</a>
    </div>`;
  }
  const prog = lessonProgress(next.id);
  const step = next.steps[prog.step];
  return `<div class="ink-card">
    <div class="ink-kicker mono">Up next · ${next.unit}</div>
    <div class="ink-title">${step.kicker.split('·')[1].trim()}: ${step.short}. ${step.timed ? 'The clock starts when you open it.' : `Worth ${step.xp} XP.`}</div>
    <a class="btn btn-blue btn-sm" href="#/learn/${next.id}">${prog.step > 0 ? 'Continue' : 'Start'}</a>
  </div>`;
}

export function renderHome(app) {
  const done = lessonsComplete();
  const pct = Math.round((done / LESSONS.length) * 100);
  const streak = streakDays();

  app.innerHTML = `<div class="map" data-screen-label="Course map">
    ${sidebar('learn')}
    <main class="map-main">
      <header class="map-hero">
        <div class="kicker">Math · Interactive course</div>
        <h1>Math you can touch.</h1>
        <p class="lede">Three short lessons. Drag the maths around, beat a timed challenge, then check you’ve really got it.</p>
        <div class="progress-row mono">
          <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${LESSONS.length}" aria-valuenow="${done}" aria-label="Lessons complete"><div style="width:${pct}%"></div></div>
          <span>${done} of ${LESSONS.length} lessons</span>
        </div>
      </header>
      <div class="units">${LESSONS.map(unitCard).join('')}</div>
    </main>
    <aside class="map-aside">
      <div class="stats">
        <div class="stat"><div class="stat-label mono">Total XP</div><div class="stat-value">${totalXp()}<span> XP</span></div></div>
        <div class="stat"><div class="stat-label mono">Streak</div><div class="stat-value">${streak}<span> ${streak === 1 ? 'day' : 'days'}</span></div></div>
      </div>
      ${upNext()}
      <div class="card how">
        <div class="card-kicker mono">How a lesson works</div>
        <ol>
          <li><span class="mono">01</span><span><b>Explore.</b> Drag something and see what changes.</span></li>
          <li><span class="mono">02</span><span><b>Explore.</b> Find the pattern behind it.</span></li>
          <li><span class="mono">03</span><span><b>Timed challenge.</b> Hit a target against the clock.</span></li>
          <li><span class="mono">04</span><span><b>Check.</b> One question to prove it stuck.</span></li>
        </ol>
      </div>
      <button class="link-btn mono" data-action="reset">Reset progress</button>
    </aside>
  </div>`;

  app.querySelector('[data-action="reset"]').addEventListener('click', () => {
    resetProgress();
    renderHome(app);
  });

  // Live previews: each lesson's lab in non-interactive, auto-playing mode.
  const labs = LESSONS.map((lesson) => lesson.create(app.querySelector(`[data-preview="${lesson.id}"]`), { preview: true }));
  return () => labs.forEach((lab) => lab.destroy());
}
