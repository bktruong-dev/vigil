// Shared page behaviour: motion switch, the opening quote veil, "updated … ago".

const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function store(key: string, value?: string) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch { /* storage blocked: fall back to defaults */ }
  return null;
}

// Motion on/off
export const motion = { on: !reduced && store('vigil:motion') !== 'off' };
const apply = () => {
  root.classList.toggle('no-motion', !motion.on);
  const b = document.getElementById('motion');
  if (b) { b.setAttribute('aria-pressed', String(motion.on)); b.textContent = motion.on ? 'Motion on' : 'Motion off'; }
  dispatchEvent(new CustomEvent('vigil:motion', { detail: motion.on }));
};
document.getElementById('motion')?.addEventListener('click', () => {
  motion.on = !motion.on;
  store('vigil:motion', motion.on ? 'on' : 'off');
  apply();
});
apply();

// "Updated 2h ago"
function ago(iso: string) {
  const m = Math.round((Date.now() - Date.parse(iso)) / 6e4);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)} days ago`;
}
const tick = () => document.querySelectorAll<HTMLTimeElement>('time[data-ago]').forEach(t => { t.textContent = ago(t.dateTime); });
tick();
setInterval(tick, 60_000);

// Opening quote veil, once per visit. Letters settle out of a blur.
const veil = document.getElementById('veil');
let seen = false;
try { seen = sessionStorage.getItem('vigil:veil') === '1'; sessionStorage.setItem('vigil:veil', '1'); } catch {}
if (veil && !seen && motion.on) {
  const q = document.getElementById('veil-q')!;
  const words = (q.textContent ?? '').split(' ');
  q.textContent = '';
  let n = 0;
  words.forEach((w, wi) => {
    const word = document.createElement('span');
    word.className = 'vw';
    for (const ch of w) {
      const s = document.createElement('span');
      s.className = 'vl';
      s.textContent = ch;
      s.style.animationDelay = `${(n++ * 0.018 + Math.random() * 0.25).toFixed(3)}s`;
      word.append(s);
    }
    q.append(word);
    if (wi < words.length - 1) q.append(' ');
  });
  veil.hidden = false;
  const close = () => {
    veil.classList.add('out');
    removeEventListener('keydown', close);
    setTimeout(() => { veil.hidden = true; }, 900);
  };
  veil.addEventListener('click', close);
  addEventListener('keydown', close);
  setTimeout(close, 6500);
}
