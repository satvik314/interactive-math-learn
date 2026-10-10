// Lesson screen. In "learn" mode it walks through the lesson's steps with a
// segmented progress bar, live feedback and a Continue button that unlocks
// once the step is done. In "play" mode every control is unlocked.

import { COMPLETION_XP, LESSONS } from '../lessons.js';
import { lessonProgress, updateLesson } from '../progress.js';
import { mountControls } from '../ui/controls.js';
import { LOGO } from './shared.js';

export function renderLesson(app, lesson, mode) {
  const learn = mode === 'learn';
  const prog = lessonProgress(lesson.id);
  const start = learn && !prog.complete ? Math.min(prog.step, lesson.steps.length - 1) : 0;
  const session = {
    step: start,
    stepDone: false,
    earned: lesson.steps.map((s, i) => (i < start ? s.xp : 0)),
    pick: null,
    t0: 0,
    challengeTime: null, // live timer value once the timed step is solved
    bestThisRun: null, // kept after moving past the challenge, for the summary card
    finished: false,
  };

  const top = learn
    ? `<a class="icon-btn" href="#/" aria-label="Back to the course map">✕</a>
       <div class="segments" data-segments aria-hidden="true"></div>
       <div class="mono xp" data-xp></div>`
    : `<a class="icon-btn" href="#/" aria-label="Back to the course map">✕</a>
       <nav class="tabs" aria-label="Free play labs">
         ${LESSONS.map((l) => `<a class="tab mono${l.id === lesson.id ? ' is-active' : ''}" href="#/play/${l.id}">${l.unit}</a>`).join('')}
       </nav>
       <a class="brand brand-sm" href="#/">${LOGO}<span>Tangent</span></a>`;

  app.innerHTML = `<div class="lesson" data-screen-label="${learn ? 'Lesson' : 'Free play'}">
    <header class="lesson-top">${top}</header>
    <div class="lesson-grid" data-grid>
      <div class="lesson-copy" data-copy></div>
      <div class="lesson-actions" data-actions aria-live="polite"></div>
      <div class="lesson-visual">
        <div class="viz-card">
          <div class="viz-head mono"><span data-head></span><span class="timer" data-timer hidden></span></div>
          <canvas class="viz-canvas ${lesson.ratio}" aria-label="${lesson.title}: interactive diagram"></canvas>
        </div>
        <div class="control-grid" data-controls></div>
      </div>
    </div>
  </div>`;

  const $ = (s) => app.querySelector(s);
  const copy = $('[data-copy]');
  const actions = $('[data-actions]');
  const headEl = $('[data-head]');
  const timerEl = $('[data-timer]');
  let headCache = '';
  let feedbackCache = null;

  const lab = lesson.create($('.viz-canvas'), { onFrame });
  const controls = mountControls($('[data-controls]'), lab.controls);
  const step = () => lesson.steps[session.step];
  const sessionXp = () => session.earned.reduce((a, b) => a + b, 0);

  function onFrame(state) {
    controls.sync();
    const head = lab.header();
    if (head !== headCache) headEl.innerHTML = headCache = head;
    if (!learn || session.finished) return;

    const st = step();
    if (!session.stepDone && st.kind !== 'check' && st.done(state)) completeStep();

    if (st.timed) {
      const secs = session.challengeTime ?? (performance.now() - session.t0) / 1000;
      timerEl.textContent = `⏱ ${secs.toFixed(1)}s`;
    }
    if (st.feedback) setFeedback(st.feedback(state, session.stepDone), session.stepDone ? 'good' : 'info');
  }

  function setFeedback(html, tone) {
    const el = actions.querySelector('[data-feedback]');
    if (!el) return;
    const key = `${tone}|${html}`;
    if (key === feedbackCache) return;
    feedbackCache = key;
    el.hidden = !html;
    el.className = `feedback feedback-${tone}`;
    el.innerHTML = html;
  }

  function completeStep() {
    const st = step();
    session.stepDone = true;
    session.earned[session.step] = st.kind === 'check' ? (session.pick === st.answer ? st.xp : 0) : st.xp;
    if (st.timed) {
      session.challengeTime = (performance.now() - session.t0) / 1000;
      session.bestThisRun = session.challengeTime;
      timerEl.classList.add('is-done');
    }
    renderCopy();
  }

  function renderTop() {
    if (!learn) return;
    $('[data-segments]').innerHTML = lesson.steps
      .map((_, i) => `<span class="seg ${i < session.step ? 'seg-done' : i === session.step ? 'seg-now' : ''}"></span>`)
      .join('');
    $('[data-xp]').textContent = `+${sessionXp()} XP`;
  }

  function renderCopy() {
    feedbackCache = null;
    if (!learn) {
      copy.innerHTML = `
        <div class="kicker">Free play · ${lesson.unit}</div>
        <h1>${lesson.title}</h1>
        <p class="body">${lesson.blurb}</p>
        <div class="card note"><div class="card-kicker mono">Key idea</div><p>${lesson.keyIdea}</p></div>
        <div><a class="btn btn-ink" href="#/learn/${lesson.id}">Take the guided lesson →</a></div>`;
      actions.hidden = true;
      return;
    }

    const st = step();
    const mcq = st.kind === 'check'
      ? `<div class="mcq">${st.options
          .map((o, i) => {
            const state = session.pick === null ? '' : i === st.answer ? 'is-right' : i === session.pick ? 'is-wrong' : 'is-dim';
            return `<button type="button" class="mcq-opt mono ${state}" data-pick="${i}" ${session.pick !== null ? 'disabled' : ''}>${o}</button>`;
          })
          .join('')}</div>`
      : '';
    copy.innerHTML = `
      <div class="kicker">${st.kicker}</div>
      <h1>${st.title}</h1>
      <p class="body">${st.body}</p>
      ${mcq}`;
    actions.innerHTML = `
      <div class="feedback" data-feedback hidden></div>
      <div class="continue-row">
        <button type="button" class="btn btn-ink btn-lg" data-continue ${session.stepDone ? '' : 'disabled'}>
          ${session.step === lesson.steps.length - 1 ? 'Finish lesson →' : 'Continue →'}
        </button>
        ${session.stepDone ? `<span class="mono earned">+${session.earned[session.step]} XP</span>` : ''}
      </div>`;

    if (st.kind === 'check' && session.pick !== null) {
      const right = session.pick === st.answer;
      setFeedback(right ? st.right : st.wrong, right ? 'good' : 'bad');
    }
    copy.querySelectorAll('[data-pick]').forEach((b) =>
      b.addEventListener('click', () => {
        session.pick = Number(b.dataset.pick);
        completeStep();
      }),
    );
    actions.querySelector('[data-continue]').addEventListener('click', next);
    renderTop();
    if (session.stepDone) actions.querySelector('[data-continue]').focus({ preventScroll: true });
  }

  function enterStep() {
    const st = step();
    session.stepDone = false;
    session.pick = null;
    session.challengeTime = null;
    st.enter?.(lab);
    const isCheck = st.kind === 'check';
    controls.setEnabled(isCheck ? [] : st.controls);
    $('[data-controls]').hidden = isCheck;
    timerEl.hidden = !st.timed;
    timerEl.classList.remove('is-done');
    session.t0 = performance.now();
    renderCopy();
  }

  function next() {
    if (!session.stepDone) return;
    session.step += 1;
    if (session.step >= lesson.steps.length) return finish();
    if (!prog.complete) updateLesson(lesson.id, { step: Math.max(prog.step, session.step) });
    enterStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function finish() {
    session.finished = true;
    const xp = sessionXp() + COMPLETION_XP;
    const challenge = lesson.steps.findIndex((s) => s.timed);
    const time = session.bestThisRun;
    const check = lesson.steps[lesson.steps.length - 1];
    const checkRight = session.earned[lesson.steps.length - 1] > 0;
    updateLesson(lesson.id, {
      complete: true,
      step: lesson.steps.length,
      xp: Math.max(prog.xp || 0, xp),
      best: time == null ? prog.best : prog.best == null ? time : Math.min(prog.best, time),
    });
    lab.destroy();

    const nextLesson = LESSONS.find((l) => l.id !== lesson.id && !lessonProgress(l.id).complete);
    app.querySelector('[data-grid]').outerHTML = `<div class="done-wrap">
      <div class="done-card">
        <div class="kicker">Lesson complete</div>
        <h1>${lesson.doneTitle}</h1>
        <div class="done-stats">
          <div><div class="mono stat-label">XP</div><div class="stat-value">+${xp}</div></div>
          <div><div class="mono stat-label">${challenge >= 0 ? 'Challenge time' : 'Steps'}</div><div class="stat-value">${time != null ? `${time.toFixed(1)}s` : '—'}</div></div>
          <div><div class="mono stat-label">Check</div><div class="stat-value ${checkRight ? 'blue' : 'red'}">${checkRight ? '✓' : '✗'}</div></div>
        </div>
        <p>${lesson.doneLine}${checkRight ? '' : ` On the check: ${check.wrong.replace(/^Not quite\.\s*/, '')}`}</p>
        <div class="done-actions">
          ${nextLesson ? `<a class="btn btn-ink btn-lg" href="#/learn/${nextLesson.id}">Next: ${nextLesson.unit} →</a>` : `<a class="btn btn-ink btn-lg" href="#/">Back to map</a>`}
          ${nextLesson ? `<a class="btn btn-card" href="#/">Back to map</a>` : ''}
          <a class="btn btn-card" href="#/play/${lesson.id}">Free play</a>
        </div>
      </div>
    </div>`;
    $('[data-segments]').innerHTML = lesson.steps.map(() => '<span class="seg seg-done"></span>').join('');
    $('[data-xp]').textContent = `+${xp} XP`;
  }

  if (learn) {
    enterStep();
  } else {
    controls.setEnabled(null);
    renderCopy();
  }

  return () => lab.destroy();
}
