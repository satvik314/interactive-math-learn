import { LESSONS } from '../lessons.js';

export const LOGO = `<span class="logo" aria-hidden="true"><i></i></span>`;

/** Left rail used on the course map. */
export function sidebar(active) {
  return `<aside class="side">
    <a class="brand" href="#/">${LOGO}<span>Tangent</span></a>
    <nav class="side-nav" aria-label="Main">
      <a href="#/" class="${active === 'learn' ? 'is-active' : ''}">Learn</a>
      <a href="#/play/${LESSONS[0].id}" class="${active === 'play' ? 'is-active' : ''}">Free play</a>
    </nav>
    <div class="side-foot mono">${LESSONS.length} lessons · ~12 min<br />No sign-up needed</div>
  </aside>`;
}
