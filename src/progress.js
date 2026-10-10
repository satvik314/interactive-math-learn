// Learner progress (lesson steps, XP, daily streak), kept in localStorage.
// Storage can be unavailable (private mode, blocked site data); everything
// still works for the session, it just won't persist.

const KEY = 'tangent:progress:v2';

const localDay = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

const data = { lessons: {}, streak: { last: null, count: 0 }, ...load() };

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable */
  }
}

export function lessonProgress(id) {
  data.lessons[id] ??= { step: 0, complete: false, xp: 0, best: null };
  return data.lessons[id];
}

export function updateLesson(id, patch) {
  Object.assign(lessonProgress(id), patch);
  save();
}

export const totalXp = () => Object.values(data.lessons).reduce((sum, l) => sum + (l.xp || 0), 0);
export const lessonsComplete = () => Object.values(data.lessons).filter((l) => l.complete).length;
export const streakDays = () => data.streak.count;

/** Counts consecutive days with a visit. Call once per page load. */
export function touchStreak() {
  const today = localDay();
  if (data.streak.last === today) return;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  data.streak.count = data.streak.last === localDay(yesterday) ? data.streak.count + 1 : 1;
  data.streak.last = today;
  save();
}

export function resetProgress() {
  data.lessons = {};
  save();
}
