import './style.css';
import { mountHero } from './hero.js';
import { mountUnitCircle } from './labs/unitCircle.js';
import { mountPythagoras } from './labs/pythagoras.js';
import { mountRiemann } from './labs/riemann.js';
import { onProgress, resetProgress } from './challenges.js';

mountHero(document.querySelector('.hero-canvas'));
mountUnitCircle(document.getElementById('trig'));
mountPythagoras(document.getElementById('geometry'));
mountRiemann(document.getElementById('calculus'));

const progressCount = document.querySelector('[data-progress]');
const progressBar = document.querySelector('.progress-bar span');
onProgress((done, total) => {
  progressCount.textContent = `${done}/${total}`;
  progressBar.style.width = `${total ? (done / total) * 100 : 0}%`;
  document.querySelectorAll('[data-total-challenges]').forEach((el) => (el.textContent = String(total)));
});

document.querySelector('[data-action="reset-progress"]').addEventListener('click', resetProgress);

// Highlight the nav link for the lab currently in view.
const links = new Map([...document.querySelectorAll('.nav-links a')].map((a) => [a.getAttribute('href').slice(1), a]));
const navObserver = new IntersectionObserver(
  (entries) => entries.forEach((e) => links.get(e.target.id)?.classList.toggle('is-active', e.isIntersecting)),
  { rootMargin: '-45% 0px -50% 0px' },
);
document.querySelectorAll('.lab').forEach((el) => navObserver.observe(el));
