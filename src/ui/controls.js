// Renders a lab's control descriptors as bordered cards (sliders, buttons,
// chip groups) and keeps them in sync with the lab state every frame.

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function renderOne(c) {
  if (c.kind === 'range') {
    return `<label class="ctl" data-ctl="${c.id}">
      <span class="ctl-label"><span>${esc(c.label)}</span><b data-val></b></span>
      <input type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.value()}" />
    </label>`;
  }
  if (c.kind === 'button') {
    return `<div class="ctl ctl-action" data-ctl="${c.id}">
      <button type="button" class="btn ${c.primary ? 'btn-blue' : 'btn-card'}"></button>
    </div>`;
  }
  // chips (single choice) and toggles (multi choice)
  return `<div class="ctl ctl-wide" data-ctl="${c.id}">
    <span class="ctl-label"><span>${esc(c.label)}</span></span>
    <div class="chips" role="group" aria-label="${esc(c.label)}">
      ${c.options.map((o) => `<button type="button" class="chip" data-value="${esc(o.value)}" aria-pressed="false">${esc(o.label)}</button>`).join('')}
    </div>
  </div>`;
}

/**
 * @param {HTMLElement} root container
 * @param {object[]} controls lab control descriptors
 * @returns {{ setEnabled(ids: string[] | null): void, sync(): void }}
 */
export function mountControls(root, controls) {
  root.innerHTML = controls.map(renderOne).join('');
  const items = controls.map((c) => ({ c, el: root.querySelector(`[data-ctl="${c.id}"]`), cache: {} }));

  for (const { c, el } of items) {
    if (c.kind === 'range') {
      const input = el.querySelector('input');
      input.addEventListener('input', () => c.set(Number(input.value)));
    } else if (c.kind === 'button') {
      el.querySelector('button').addEventListener('click', () => c.press());
    } else {
      el.querySelectorAll('.chip').forEach((chip) =>
        chip.addEventListener('click', () => (c.kind === 'toggles' ? c.toggle(chip.dataset.value) : c.set(chip.dataset.value))),
      );
    }
  }

  const put = (cache, key, value, apply) => {
    if (cache[key] === value) return;
    cache[key] = value;
    apply(value);
  };

  return {
    setEnabled(ids) {
      for (const { c, el } of items) {
        const on = !ids || ids.includes(c.id);
        el.classList.toggle('is-locked', !on);
        el.querySelectorAll('input, button').forEach((n) => (n.disabled = !on));
      }
    },
    sync() {
      for (const { c, el, cache } of items) {
        if (c.kind === 'range') {
          const input = el.querySelector('input');
          if (document.activeElement !== input) put(cache, 'v', String(c.value()), (v) => (input.value = v));
          put(cache, 'd', c.display(), (v) => (el.querySelector('[data-val]').textContent = v));
        } else if (c.kind === 'button') {
          put(cache, 'l', c.label(), (v) => (el.querySelector('button').textContent = v));
        } else {
          el.querySelectorAll('.chip').forEach((chip) => {
            const on = c.kind === 'toggles' ? c.isOn(chip.dataset.value) : c.value() === chip.dataset.value;
            put(cache, chip.dataset.value, on, (v) => chip.setAttribute('aria-pressed', String(v)));
          });
        }
      }
    },
  };
}
