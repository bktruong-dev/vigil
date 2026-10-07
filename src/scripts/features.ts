// Reader features: save for later, share / copy link, "new since your last
// visit" markers, cards rising into view, and a search palette (press "/").
// Everything stays in this browser (localStorage); nothing is sent anywhere.
// Feed text is only ever inserted with textContent.

import { motion, lastVisit } from './chrome.ts';

const root = document.documentElement;
type Saved = { id: string; href: string; title: string; src: string; site: string; img: string; date: string; tone: string; savedAt: number };

const safe = (u: string) => { try { const x = new URL(u, location.href); return x.protocol === 'https:' || x.origin === location.origin ? x.href : ''; } catch { return ''; } };
const read = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || '') ?? d; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } };

// ---------- Toast ----------
const toast = document.createElement('div');
toast.className = 'toast';
toast.setAttribute('role', 'status');
toast.setAttribute('aria-live', 'polite');
document.body.append(toast);
let toastT = 0;
export function say(msg: string) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastT);
  toastT = window.setTimeout(() => toast.classList.remove('show'), 2200);
}

// ---------- Saved stories ----------
export const saved = {
  all: (): Saved[] => read<Saved[]>('vigil:saved', []),
  has: (id: string) => saved.all().some(s => s.id === id),
  set(list: Saved[]) { write('vigil:saved', list); updateCount(); dispatchEvent(new CustomEvent('vigil:saved')); },
};
function updateCount() {
  const n = saved.all().length;
  document.querySelectorAll<HTMLElement>('[data-saved-count]').forEach(el => { el.textContent = n ? String(n) : ''; el.hidden = !n; });
}
function syncButtons() {
  const ids = new Set(saved.all().map(s => s.id));
  document.querySelectorAll<HTMLElement>('.story').forEach(card => {
    const b = card.querySelector('.save');
    if (b) b.setAttribute('aria-pressed', String(ids.has(card.dataset.id!)));
  });
}

// ---------- Play videos in place (YouTube's privacy-enhanced player, loaded only on click) ----------
document.addEventListener('click', e => {
  const play = (e.target as HTMLElement).closest<HTMLButtonElement>('.play[data-yt]');
  if (!play) return;
  e.preventDefault();
  const id = play.dataset.yt!;
  if (!/^[\w-]{11}$/.test(id)) return;
  const media = play.closest('.media');
  if (!media) return;
  const f = document.createElement('iframe');
  f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
  f.title = play.getAttribute('aria-label')?.replace(/^Play /, '').replace(/ here$/, '') ?? 'Video';
  f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  f.allowFullscreen = true;
  f.referrerPolicy = 'strict-origin-when-cross-origin';
  media.append(f);
  play.remove();
});

document.addEventListener('click', async e => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.act');
  if (!btn) return;
  e.preventDefault();
  const card = btn.closest<HTMLElement>('.story');
  if (!card) return;
  const d = card.dataset;
  if (btn.classList.contains('save')) {
    const list = saved.all();
    const i = list.findIndex(s => s.id === d.id);
    if (i >= 0) { list.splice(i, 1); say('Removed from Saved'); }
    else { list.unshift({ id: d.id!, href: d.href!, title: d.title!, src: d.src!, site: d.site!, img: d.img || '', date: d.date!, tone: d.tone!, savedAt: Date.now() }); say('Saved for later'); }
    saved.set(list.slice(0, 300));
    syncButtons();
  } else if (btn.classList.contains('share')) {
    const url = safe(d.href!);
    if (!url) return;
    const touch = matchMedia('(pointer: coarse)').matches;
    try {
      if (touch && navigator.share) await navigator.share({ title: d.title, url });
      else { await navigator.clipboard.writeText(url); say('Link copied'); }
    } catch { /* share sheet closed */ }
  }
});

// ---------- New since your last visit ----------
if (lastVisit) {
  let n = 0;
  document.querySelectorAll<HTMLElement>('.story').forEach(card => {
    if (Date.parse(card.dataset.date || '') > lastVisit) { card.classList.add('is-new'); n++; }
  });
  if (n && location.pathname === '/') setTimeout(() => say(`${n} new on this page since your last visit`), 1600);
}

// ---------- Cards rise into view ----------
const navType = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type;
const replay = navType === 'navigate' && !location.hash;
if (motion.on && replay && 'IntersectionObserver' in window) {
  root.classList.add('reveal-on');
  const io = new IntersectionObserver(entries => {
    let k = 0;
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const el = en.target as HTMLElement;
      el.style.transitionDelay = `${Math.min(k++, 6) * 60}ms`;
      el.classList.add('in');
      io.unobserve(el);
    }
  }, { rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.rv').forEach(el => {
    // Already on screen at load: show at once, no flash.
    if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); else io.observe(el);
  });
  // Belt and braces: also reveal on scroll, and never leave anything hidden for long.
  let ticking = false;
  const sweep = () => {
    ticking = false;
    document.querySelectorAll<HTMLElement>('.rv:not(.in)').forEach(el => { if (el.getBoundingClientRect().top < innerHeight * 1.05) el.classList.add('in'); });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(sweep); } }, { passive: true });
  setTimeout(() => document.querySelectorAll('.rv:not(.in)').forEach(el => { if (el.getBoundingClientRect().top < innerHeight * 2) el.classList.add('in'); }), 1500);
  // Filters can unhide cards that were never observed.
  new MutationObserver(() => document.querySelectorAll('.rv:not(.in)').forEach(el => el.classList.add('in')))
    .observe(document.getElementById('stream') ?? document.createElement('div'), { subtree: true, attributes: true, attributeFilter: ['hidden'] });
}

// ---------- Search palette ----------
type S = { id: string; t: string; u: string; s: string; h: string; k: string; tone: string; d: string; tp: string; x: string };
const pal = document.getElementById('search') as HTMLElement | null;
const input = document.getElementById('search-q') as HTMLInputElement | null;
const out = document.getElementById('search-results') as HTMLOListElement | null;
const meta = document.getElementById('search-meta');
let index: S[] | null = null, sel = 0, results: S[] = [], lastFocus: Element | null = null;

async function loadIndex() {
  if (index) return index;
  try { index = await (await fetch('/search-index.json')).json(); } catch { index = []; }
  return index!;
}
function rank(q: string) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length || !index) return [];
  const now = Date.now();
  return index.map(it => {
    const t = it.t.toLowerCase(), rest = `${it.s} ${it.h} ${it.tp} ${it.x}`.toLowerCase();
    let sc = 0;
    for (const w of words) {
      if (t.includes(w)) sc += t.startsWith(w) || t.includes(' ' + w) ? 4 : 3;
      else if (rest.includes(w)) sc += 1;
      else return null;
    }
    sc += Math.max(0, 1.5 - (now - Date.parse(it.d)) / 864e5 / 10);
    return { it, sc };
  }).filter(Boolean).sort((a, b) => b!.sc - a!.sc).slice(0, 24).map(r => r!.it);
}
function render() {
  if (!out || !input) return;
  out.replaceChildren();
  results = rank(input.value);
  if (meta) meta.textContent = input.value.trim() ? `${results.length === 24 ? '24+' : results.length} results` : 'Type to search every story, paper and video';
  results.forEach((r, i) => {
    const href = safe(r.u);
    if (!href) return;
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.id = `sr-${i}`; a.setAttribute('role', 'option');
    if (i === sel) a.setAttribute('aria-selected', 'true');
    const dot = document.createElement('i'); dot.className = `t-${r.tone}`;
    const tt = document.createElement('span'); tt.className = 'st'; tt.textContent = r.t;
    const mm = document.createElement('span'); mm.className = 'sm';
    mm.textContent = `${r.k} · ${r.s} · ${new Date(r.d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${r.h} ↗`;
    a.append(dot, tt, mm); li.append(a); out.append(li);
  });
  input.setAttribute('aria-activedescendant', results.length ? `sr-${sel}` : '');
}
export async function openSearch() {
  if (!pal || !input) return;
  lastFocus = document.activeElement;
  pal.hidden = false;
  requestAnimationFrame(() => pal.classList.add('open'));
  input.focus(); input.select();
  await loadIndex();
  sel = 0; render();
}
function closeSearch() {
  if (!pal || pal.hidden) return;
  pal.classList.remove('open');
  setTimeout(() => { pal.hidden = true; }, motion.on ? 220 : 0);
  (lastFocus as HTMLElement | null)?.focus?.();
}
document.querySelectorAll('[data-open-search]').forEach(b => b.addEventListener('click', openSearch));
pal?.addEventListener('click', e => { if (e.target === pal) closeSearch(); });
input?.addEventListener('input', () => { sel = 0; render(); });
input?.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') { sel = Math.min(results.length - 1, sel + 1); render(); document.getElementById(`sr-${sel}`)?.scrollIntoView({ block: 'nearest' }); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); render(); document.getElementById(`sr-${sel}`)?.scrollIntoView({ block: 'nearest' }); e.preventDefault(); }
  else if (e.key === 'Enter') { (document.getElementById(`sr-${sel}`) as HTMLAnchorElement | null)?.click(); e.preventDefault(); }
});

// ---------- Keyboard shortcuts ----------
addEventListener('keydown', e => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement).tagName) || (e.target as HTMLElement).isContentEditable;
  if (e.key === 'Escape') { closeSearch(); return; }
  if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === '/' || e.key === 's') { e.preventDefault(); openSearch(); }
  else if (e.key === 't') document.getElementById('theme')?.click();
  else if (e.key === 'b') document.getElementById('open-brief')?.click();
});

syncButtons();
updateCount();
