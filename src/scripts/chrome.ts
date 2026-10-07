// Shared page behaviour: motion switch, the opening quote veil, the
// first-open briefing, the sticky section bar, image fallbacks, "… ago".
// Feed text is only ever inserted with textContent.

import { pattern, W, H } from '../lib/patterns';

const root = document.documentElement;
root.classList.add('js');

// Images fade in when ready; cached ones show at once.
const markLoaded = (img: HTMLImageElement) => img.classList.add('ld');
document.querySelectorAll<HTMLImageElement>('.media img').forEach(img => { if (img.complete && img.naturalWidth) markLoaded(img); else img.addEventListener('load', () => markLoaded(img), { once: true }); });
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n instanceof HTMLImageElement && n.closest('.media')) n.complete ? markLoaded(n) : n.addEventListener('load', () => markLoaded(n), { once: true }); }))).observe(document.body, { childList: true, subtree: true });

// Coming back with the Back button (page restored from memory): close any overlay left open.
addEventListener('pageshow', e => {
  if (!e.persisted) return;
  document.querySelectorAll<HTMLElement>('#veil, #briefing, #search').forEach(el => { el.hidden = true; el.classList.remove('out', 'open'); });
});
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function store(key: string, value?: string) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch { /* storage blocked: fall back to defaults */ }
  return null;
}

// ---------- Motion on/off ----------
export const motion = { on: !reduced && store('vigil:motion') !== 'off' };
const applyMotion = () => {
  root.classList.toggle('no-motion', !motion.on);
  const b = document.getElementById('motion');
  if (b) { b.setAttribute('aria-pressed', String(motion.on)); b.textContent = motion.on ? 'Motion on' : 'Motion off'; }
  dispatchEvent(new CustomEvent('vigil:motion', { detail: motion.on }));
};
document.getElementById('motion')?.addEventListener('click', () => {
  motion.on = !motion.on;
  store('vigil:motion', motion.on ? 'on' : 'off');
  applyMotion();
});
applyMotion();

// ---------- Paper / ink theme ----------
const themeBtn = document.getElementById('theme');
const applyTheme = (t: string) => {
  root.setAttribute('data-theme', t);
  root.style.backgroundColor = t === 'ink' ? '#0c0d10' : '#f3efe4';
  root.style.colorScheme = t === 'ink' ? 'dark' : 'light';
  if (themeBtn) { themeBtn.textContent = t === 'ink' ? '◐ Paper' : '◑ Ink'; themeBtn.title = t === 'ink' ? 'Switch to paper' : 'Switch to ink'; }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'ink' ? '#0c0d10' : '#f3efe4');
};
applyTheme(root.getAttribute('data-theme') || 'paper');
themeBtn?.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'ink' ? 'paper' : 'ink';
  store('vigil:theme', next);
  applyTheme(next);
});

// Small pattern art for the briefing (same generator as the cards).
export function patternSvg(id: string) {
  const NS = 'http://www.w3.org/2000/svg';
  const p = pattern(id);
  const box = document.createElement('span');
  box.className = `pat pc${p.color}`;
  box.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'spin');
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('class', p.dots ? 'curve dots' : 'curve'); path.setAttribute('d', p.d); path.setAttribute('pathLength', '1');
  g.append(path); svg.append(g); box.append(svg);
  return box;
}

// ---------- "Updated 2h ago" ----------
function ago(ms: number) {
  const m = Math.round(ms / 6e4);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)} days ago`;
}
const tick = () => document.querySelectorAll<HTMLTimeElement>('time[data-ago]').forEach(t => { t.textContent = ago(Date.now() - Date.parse(t.dateTime)); });
tick();
setInterval(tick, 60_000);

// ---------- Broken images fall back to the cover art underneath ----------
document.addEventListener('error', e => {
  const img = e.target as HTMLElement;
  if (!(img instanceof HTMLImageElement)) return;
  // Not every YouTube video has an HD thumbnail; fall back to the standard one.
  if (img.src.includes('/maxresdefault.')) { img.src = img.src.replace('/maxresdefault.', '/hqdefault.'); return; }
  img.closest('.media, .bimg')?.classList.add('broken');
}, true);
document.querySelectorAll<HTMLImageElement>('.media img').forEach(img => {
  if (img.complete && img.naturalWidth === 0 && img.src) img.closest('.media')?.classList.add('broken');
});

// ---------- Sticky section bar shows the small logo once the masthead scrolls away ----------
const nav = document.querySelector('.secnav');
const mast = document.querySelector('.masthead');
if (nav && mast) new IntersectionObserver(([e]) => nav.classList.toggle('stuck', !e.isIntersecting)).observe(mast);

// ---------- First-open briefing ----------
type B = { id: string; t: string; u: string; h: string; s: string; p: string; pc: string; d: string; img: string; tone: string; k: string };
const panel = document.getElementById('briefing');
const data: { generated: string; items: B[] } = JSON.parse(document.getElementById('brief-data')?.textContent || '{"items":[]}');
const safe = (u: string) => { try { const x = new URL(u); return x.protocol === 'https:' ? x.href : ''; } catch { return ''; } };

const now = new Date();
const hour = now.getHours();
const slot = hour >= 5 && hour < 12 ? 'Morning' : hour >= 12 && hour < 18 ? 'Afternoon' : 'Evening';
const dayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${slot}`;
// "Last visit" = when your previous reading session ended. A gap of 30+ minutes
// starts a new session, so moving between pages doesn't reset it.
const seenAt = Number(store('vigil:last') || 0);
if (seenAt && Date.now() - seenAt > 30 * 6e4) store('vigil:prev', String(seenAt));
export const lastVisit = Number(store('vigil:prev') || 0);
store('vigil:last', String(Date.now()));

function fillBriefing() {
  const since = lastVisit && Date.now() - lastVisit > 30 * 6e4 ? lastVisit : 0;
  const gen = Date.parse(data.generated);
  const fresh = data.items.filter(i => Date.parse(i.d) > (since || gen - 864e5 * 2));
  const list = (fresh.length >= 3 ? fresh : data.items).slice(0, 6);
  const greeting = { Morning: 'Good morning.', Afternoon: 'Good afternoon.', Evening: 'Good evening.' }[slot];
  document.getElementById('brief-slot')!.textContent = `The ${slot} Edition · ${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`;
  document.getElementById('brief-title')!.textContent = greeting;
  document.getElementById('brief-sub')!.textContent = since && fresh.length
    ? `Since your last visit ${ago(Date.now() - since)}: ${fresh.length} new ${fresh.length === 1 ? 'story' : 'stories'}. Here is what matters most.`
    : since
      ? `Nothing new since your last visit ${ago(Date.now() - since)}. Here is what still matters most.`
      : 'Here is what matters in AI safety right now: the most important stories from the last two days.';
  const ol = document.getElementById('brief-list')!;
  ol.replaceChildren();
  list.forEach((it, n) => {
    const href = safe(it.u);
    if (!href) return;
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
    const num = document.createElement('span'); num.className = 'bn'; num.textContent = String(n + 1).padStart(2, '0');
    const fig = document.createElement('span'); fig.className = 'bimg';
    fig.append(patternSvg(it.id));
    const src = safe(it.img);
    if (src) { const img = document.createElement('img'); img.src = src; img.alt = ''; img.referrerPolicy = 'no-referrer'; img.decoding = 'async'; fig.append(img); }
    const txt = document.createElement('span');
    const t = document.createElement('span'); t.className = 'bt'; t.textContent = it.t;
    const m = document.createElement('span'); m.className = 'bm';
    const dot = document.createElement('i'); dot.className = `t-${it.tone}`;
    const host = document.createElement('b'); host.textContent = `${it.h} ↗`;
    const per = document.createElement('span'); per.className = `persp pc-${it.pc}`; per.textContent = it.p;
    m.append(dot, document.createTextNode(it.s), per, host);
    txt.append(t, m);
    a.append(num, fig, txt); li.append(a); ol.append(li);
  });
}

let lastFocus: Element | null = null;
function openBriefing() {
  if (!panel) return;
  fillBriefing();
  lastFocus = document.activeElement;
  panel.classList.remove('out');
  panel.hidden = false;
  store('vigil:edition', dayKey);
  (document.getElementById('brief-close') as HTMLButtonElement).focus();
}
function closeBriefing() {
  if (!panel || panel.hidden) return;
  panel.classList.add('out');
  setTimeout(() => { panel.hidden = true; }, motion.on ? 450 : 0);
  (lastFocus as HTMLElement | null)?.focus?.();
}
document.getElementById('open-brief')?.addEventListener('click', openBriefing);
document.getElementById('brief-close')?.addEventListener('click', closeBriefing);
document.getElementById('brief-go')?.addEventListener('click', closeBriefing);
panel?.addEventListener('click', e => { if (e.target === panel) closeBriefing(); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeBriefing(); });

// Automated browsers (link previews, test tools) skip the quote and the briefing.
const automated = navigator.webdriver === true;
const wantBriefing = !automated && store('vigil:edition') !== dayKey;

// ---------- Opening quote veil, once per visit; letters settle out of a blur ----------
const veil = document.getElementById('veil');
let seen = false;
try { seen = sessionStorage.getItem('vigil:veil') === '1'; sessionStorage.setItem('vigil:veil', '1'); } catch {}
if (veil && !seen && !automated) {
  const q = document.getElementById('veil-q')!;
  if (motion.on) {
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
  }
  veil.hidden = false;
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    veil.classList.add('out');
    removeEventListener('keydown', close);
    setTimeout(() => { veil.hidden = true; if (wantBriefing) openBriefing(); }, motion.on ? 700 : 0);
  };
  veil.addEventListener('click', close);
  addEventListener('keydown', close);
  setTimeout(close, motion.on ? 6500 : 3500);
} else if (wantBriefing) {
  setTimeout(openBriefing, 400);
}

// ---------- Section bar: scroll sideways when it doesn't fit ----------
// Mouse wheel, drag, or the ‹ › buttons; the current page scrolls into view.
const navBox = document.querySelector<HTMLElement>('.navscroll');
const navList = navBox?.querySelector<HTMLElement>('ul');
if (navBox && navList) {
  const edges = () => {
    const max = navList.scrollWidth - navList.clientWidth;
    navBox.classList.toggle('l', navList.scrollLeft > 4);
    navBox.classList.toggle('r', navList.scrollLeft < max - 4);
  };
  navList.addEventListener('scroll', edges, { passive: true });
  addEventListener('resize', edges);
  // Shift + wheel (or a trackpad's sideways swipe) scrolls the bar; a normal wheel scrolls the page.
  navList.addEventListener('wheel', e => {
    if (!e.shiftKey || navList.scrollWidth <= navList.clientWidth) return;
    e.preventDefault();
    navList.scrollLeft += e.deltaY;
  }, { passive: false });
  navBox.querySelector('.prev')?.addEventListener('click', () => navList.scrollBy({ left: -navList.clientWidth * 0.6 }));
  navBox.querySelector('.next')?.addEventListener('click', () => navList.scrollBy({ left: navList.clientWidth * 0.6 }));
  // Drag to scroll (mouse); taps on links still work.
  let down = false, startX = 0, startL = 0, moved = false;
  navList.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; startX = e.clientX; startL = navList.scrollLeft; });
  addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - startX; if (Math.abs(dx) > 4) moved = true; navList.scrollLeft = startL - dx; });
  addEventListener('pointerup', () => { down = false; });
  navList.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; } }, true);
  // Keep the current page's link visible, and re-check when the bar sticks.
  const cur = navList.querySelector<HTMLElement>('[aria-current="page"]');
  if (cur) {
    const x = cur.getBoundingClientRect().left - navList.getBoundingClientRect().left + navList.scrollLeft;
    navList.style.scrollBehavior = 'auto';
    navList.scrollLeft = x - navList.clientWidth / 2 + cur.offsetWidth / 2;
    navList.style.scrollBehavior = '';
  }
  new ResizeObserver(edges).observe(navList);
  edges();
}
