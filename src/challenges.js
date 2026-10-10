// Self-checking "Try this" challenges. Each lab registers a list of tests that
// run against its live state; completions are remembered in localStorage.

const STORAGE_KEY = 'tangent:challenges:v1';
const registered = new Set();
const listeners = new Set();
const done = new Set(load());

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...done]));
  } catch {
    /* storage unavailable: progress just won't persist */
  }
}

function notify() {
  const count = [...registered].filter((id) => done.has(id)).length;
  listeners.forEach((fn) => fn(count, registered.size));
}

export function onProgress(fn) {
  listeners.add(fn);
  queueMicrotask(notify);
}

export function resetProgress() {
  done.clear();
  save();
  document.querySelectorAll('.challenge.is-done').forEach((li) => li.classList.remove('is-done', 'just-done'));
  notify();
}

export function createChallenges(listEl, labId, defs) {
  const items = defs.map((def) => {
    const id = `${labId}:${def.id}`;
    registered.add(id);
    const li = document.createElement('li');
    li.className = 'challenge';
    li.dataset.id = id;
    li.innerHTML = `<span class="tick" aria-hidden="true"></span><span class="challenge-text"></span>`;
    li.querySelector('.challenge-text').innerHTML = def.text;
    listEl.appendChild(li);
    return { ...def, uid: id, li };
  });

  const sync = () => items.forEach((it) => it.li.classList.toggle('is-done', done.has(it.uid)));
  listeners.add(sync);
  sync();
  notify();

  return {
    check(state) {
      for (const it of items) {
        if (done.has(it.uid)) continue;
        let passed = false;
        try {
          passed = it.test(state);
        } catch {
          passed = false;
        }
        if (passed) {
          done.add(it.uid);
          it.li.classList.add('is-done', 'just-done');
          setTimeout(() => it.li.classList.remove('just-done'), 1200);
          save();
          notify();
        }
      }
    },
  };
}
