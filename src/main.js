import './style.css';
import { lessonById } from './lessons.js';
import { touchStreak } from './progress.js';
import { renderHome } from './screens/home.js';
import { renderLesson } from './screens/lesson.js';

// Hash routes:  #/  (course map) · #/learn/<lesson>  · #/play/<lesson>
const app = document.getElementById('app');
let cleanup = () => {};

function route() {
  cleanup();
  const [view, id] = location.hash.replace(/^#\/?/, '').split('/');
  const lesson = lessonById(id);
  if ((view === 'learn' || view === 'play') && lesson) {
    document.title = `${lesson.unit}: ${view === 'learn' ? 'Lesson' : 'Free play'} · Tangent`;
    cleanup = renderLesson(app, lesson, view);
  } else {
    document.title = 'Tangent: math you can touch';
    cleanup = renderHome(app);
  }
  window.scrollTo(0, 0);
}

touchStreak();
window.addEventListener('hashchange', route);
route();
