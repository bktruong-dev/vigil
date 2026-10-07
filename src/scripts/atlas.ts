// The Incident Atlas: a dot-matrix world on a canvas, a slow radar sweep,
// and pulsing markers where stories happened. Everything user-facing that
// comes from feeds is inserted with textContent, never as HTML.

import { geoNaturalEarth1, geoPath, geoGraticule10 } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import world from 'world-atlas/countries-110m.json';
import { motion } from './chrome.ts';

type Pt = { t: string; u: string; s: string; d: string; tone: string; k: string };
type Loc = { name: string; country: string; lon: number; lat: number; items: Pt[]; risk: number; good: number };
type Filter = 'all' | 'risk' | 'good';

const COL = { risk: '#ff9b8a', good: '#8fd3a8', neutral: '#86a8ff', ink: '#e8e6e1' };
const SWEEP_MS = 9000;

const topo = world as any;
const countries = feature(topo, topo.objects.countries) as any;
countries.features = countries.features.filter((f: any) => f.id !== '010'); // no Antarctica
const borders = mesh(topo, topo.objects.countries, (a: any, b: any) => a !== b);

const safeHref = (u: string) => { try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : null; } catch { return null; } };
const coord = (lat: number, lon: number) =>
  `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}  ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;

export function mountAtlas(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas.map')!;
  const frame = canvas.parentElement!;
  const ctx = canvas.getContext('2d')!;
  const locs: Loc[] = JSON.parse(root.querySelector('.atlas-data')!.textContent || '[]');
  const panel = root.querySelector<HTMLElement>('.panel')!;
  const readout = root.querySelector<HTMLElement>('.readout')!;
  const phone = matchMedia('(max-width: 760px)').matches;

  let W = 0, H = 0, dpr = 1;
  let base: HTMLCanvasElement, bright: HTMLCanvasElement;
  let screen: { x: number; y: number; r: number; tone: keyof typeof COL; loc: Loc; phase: number }[] = [];
  let filter: Filter = 'all';
  let hover: (typeof screen)[number] | null = null;
  let selected: Loc | null = null;
  let visible = false, raf = 0, t0 = performance.now();
  let mouse: { x: number; y: number } | null = null;
  let projection = geoNaturalEarth1();

  const toneOf = (l: Loc): keyof typeof COL =>
    filter === 'good' ? 'good' : filter === 'risk' ? 'risk' : l.risk > l.good ? 'risk' : l.good > l.risk ? 'good' : l.risk ? 'risk' : 'neutral';
  const shown = (l: Loc) => filter === 'all' || (filter === 'risk' ? l.risk > 0 : l.good > 0);

  function layer() { const c = document.createElement('canvas'); c.width = W * dpr; c.height = H * dpr; return c; }

  function build() {
    const rect = frame.getBoundingClientRect();
    W = Math.round(rect.width); H = Math.round(rect.height);
    if (!W || !H) return;
    dpr = Math.min(2.5, devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);

    const padY = H * 0.16, padX = W * 0.03;
    projection = geoNaturalEarth1().fitExtent([[padX, padY * 0.9], [W - padX, H - padY * 0.75]], countries);

    // Land mask, used to place the dot matrix.
    const mask = document.createElement('canvas');
    mask.width = W; mask.height = H;
    const m = mask.getContext('2d', { willReadFrequently: true })!;
    m.fillStyle = '#fff';
    m.beginPath(); geoPath(projection, m)(countries); m.fill();
    const px = m.getImageData(0, 0, W, H).data;

    base = layer(); bright = layer();
    const b = base.getContext('2d')!, g = bright.getContext('2d')!;
    for (const c of [b, g]) c.scale(dpr, dpr);

    // Graticule and borders, hairline.
    b.strokeStyle = 'rgba(134,168,255,0.06)'; b.lineWidth = 0.6;
    b.beginPath(); geoPath(projection, b)(geoGraticule10()); b.stroke();
    b.strokeStyle = 'rgba(134,168,255,0.22)'; b.lineWidth = 0.6;
    b.beginPath(); geoPath(projection, b)(borders); b.stroke();

    // Dot matrix land.
    const step = phone ? 6 : W > 1100 ? 5 : 5.5;
    b.fillStyle = 'rgba(201,198,191,0.42)';
    g.fillStyle = 'rgba(134,168,255,0.95)';
    for (let y = step / 2; y < H; y += step) {
      for (let x = step / 2; x < W; x += step) {
        if (px[(Math.floor(y) * W + Math.floor(x)) * 4 + 3] > 0) {
          b.fillRect(x - 0.7, y - 0.7, 1.4, 1.4);
          g.fillRect(x - 0.8, y - 0.8, 1.6, 1.6);
        }
      }
    }
    place();
    draw(performance.now());
  }

  function place() {
    // Merge places that would overlap on screen (e.g. San Francisco, Berkeley,
    // Palo Alto) into one marker, so the map stays readable.
    const gap = phone ? 18 : 22;
    const clusters: { x: number; y: number; loc: Loc }[] = [];
    for (const loc of [...locs].filter(shown).sort((a, b) => b.items.length - a.items.length)) {
      const [x, y] = projection([loc.lon, loc.lat]) ?? [0, 0];
      const near = clusters.find(c => Math.hypot(c.x - x, c.y - y) < gap);
      if (near) {
        const m = near.loc;
        near.loc = { ...m, name: m.name.includes(' + ') ? m.name.replace(/\+ (\d+)/, (_, k) => `+ ${+k + 1}`) : `${m.name} + 1`,
          items: [...m.items, ...loc.items].sort((a, b) => b.d.localeCompare(a.d)), risk: m.risk + loc.risk, good: m.good + loc.good };
      } else clusters.push({ x, y, loc });
    }
    screen = clusters.map((c, i) => {
      const n = filter === 'risk' ? c.loc.risk : filter === 'good' ? c.loc.good : c.loc.items.length;
      return { x: c.x, y: c.y, r: 2 + Math.min(7, Math.sqrt(n) * 1.1), tone: toneOf(c.loc), loc: c.loc, phase: (i * 0.618) % 1 };
    });
  }

  function draw(now: number) {
    if (!W) return;
    const t = now - t0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(base, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Radar sweep: brighten the dots in a band trailing the scan line.
    const sx = ((t % SWEEP_MS) / SWEEP_MS) * (W + 200) - 100;
    if (motion.on) {
      const band = 140, strips = 10;
      for (let k = 0; k < strips; k++) {
        const x0 = sx - (band * (k + 1)) / strips;
        const w = band / strips;
        if (x0 + w < 0 || x0 > W) continue;
        ctx.globalAlpha = (1 - k / strips) * 0.85;
        ctx.drawImage(bright, x0 * dpr, 0, w * dpr, H * dpr, x0, 0, w, H);
      }
      ctx.globalAlpha = 1;
      const grad = ctx.createLinearGradient(sx - 40, 0, sx, 0);
      grad.addColorStop(0, 'rgba(134,168,255,0)'); grad.addColorStop(1, 'rgba(134,168,255,0.10)');
      ctx.fillStyle = grad; ctx.fillRect(sx - 40, 0, 40, H);
      ctx.fillStyle = 'rgba(134,168,255,0.55)'; ctx.fillRect(sx, 0, 1, H);
    }

    // Crosshair through the hovered or selected point.
    const focus = hover ?? screen.find(s => s.loc === selected) ?? null;
    if (focus) {
      ctx.strokeStyle = 'rgba(134,168,255,0.28)'; ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.moveTo(0, focus.y + 0.5); ctx.lineTo(W, focus.y + 0.5); ctx.moveTo(focus.x + 0.5, 0); ctx.lineTo(focus.x + 0.5, H); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Markers.
    for (const s of screen) {
      const c = COL[s.tone];
      if (motion.on) {
        ctx.strokeStyle = c; ctx.lineWidth = 1;
        // One slow expanding ring, only on the busier places.
        if (s.loc.items.length >= 3) {
          const p = ((t / 4200 + s.phase) % 1);
          ctx.globalAlpha = (1 - p) * 0.4;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r + p * (8 + s.r * 1.5), 0, Math.PI * 2); ctx.stroke();
        }
        // A brief flash as the sweep passes over.
        const d = sx - s.x;
        if (d > 0 && d < 60) {
          ctx.globalAlpha = (1 - d / 60) * 0.7;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r + 3 + d / 10, 0, Math.PI * 2); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      ctx.shadowColor = c; ctx.shadowBlur = 8;
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0c0d10';
      ctx.beginPath(); ctx.arc(s.x, s.y, Math.max(0.8, s.r * 0.35), 0, Math.PI * 2); ctx.fill();
    }

    // Label for the focused marker, in the HUD style.
    if (focus) {
      const label = `${focus.loc.name.toUpperCase()}  ·  ${focus.loc.items.length}`;
      ctx.font = '500 11px "IBM Plex Mono", monospace';
      const w = ctx.measureText(label).width + 16;
      let lx = focus.x + 14, ly = focus.y - 26;
      if (lx + w > W - 10) lx = focus.x - 14 - w;
      if (ly < 70) ly = focus.y + 12;
      ctx.fillStyle = 'rgba(12,13,16,0.85)'; ctx.strokeStyle = COL[focus.tone];
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(lx, ly, w, 20, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = COL.ink; ctx.fillText(label, lx + 8, ly + 14);
    }
  }

  function loop(now: number) {
    draw(now);
    raf = visible && motion.on ? requestAnimationFrame(loop) : 0;
  }
  const kick = () => { if (!raf && visible && motion.on) raf = requestAnimationFrame(loop); else if (!motion.on) draw(performance.now()); };

  function open(loc: Loc) {
    selected = loc;
    panel.hidden = false;
    panel.querySelector('.p-coord')!.textContent = `${coord(loc.lat, loc.lon)}  ·  ${loc.country}`;
    panel.querySelector('.p-name')!.textContent = loc.name;
    const list = panel.querySelector('.p-list')!;
    list.replaceChildren();
    for (const it of loc.items) {
      if (filter === 'risk' && it.tone !== 'risk') continue;
      if (filter === 'good' && it.tone !== 'good') continue;
      const href = safeHref(it.u);
      if (!href) continue;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
      const tt = document.createElement('span'); tt.className = 'pt'; tt.textContent = it.t;
      const meta = document.createElement('span'); meta.className = 'ps';
      const dot = document.createElement('i'); dot.className = `t-${it.tone}`;
      const src = document.createElement('b'); src.textContent = `${new URL(href).hostname.replace(/^www\./, '')} ↗`;
      meta.append(dot, src, document.createTextNode(`via ${it.s} · ${it.d}`));
      a.append(tt, meta); li.append(a); list.append(li);
    }
    root.querySelectorAll<HTMLButtonElement>('.spot').forEach(b => b.setAttribute('aria-pressed', String(locs[+b.dataset.i!] === loc)));
    kick(); draw(performance.now());
  }
  function close() {
    selected = null; panel.hidden = true;
    root.querySelectorAll('.spot').forEach(b => b.setAttribute('aria-pressed', 'false'));
    draw(performance.now());
  }

  function pick(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    let best: (typeof screen)[number] | null = null, bd = 16;
    for (const s of screen) { const d = Math.hypot(s.x - x, s.y - y) - s.r; if (d < bd) { bd = d; best = s; } }
    mouse = { x, y };
    return best;
  }

  canvas.addEventListener('pointermove', e => {
    const h = pick(e);
    if (h !== hover) { hover = h; canvas.style.cursor = h ? 'pointer' : 'crosshair'; }
    const ll = projection.invert?.([mouse!.x, mouse!.y]);
    readout.textContent = ll && Math.abs(ll[1]) <= 90 ? coord(ll[1], ll[0]) : '';
    if (!motion.on) draw(performance.now());
  });
  canvas.addEventListener('pointerleave', () => { hover = null; readout.textContent = ''; if (!motion.on) draw(performance.now()); });
  canvas.addEventListener('click', e => { const h = pick(e as PointerEvent); h ? open(h.loc) : close(); });
  panel.querySelector('.close')!.addEventListener('click', close);
  root.addEventListener('keydown', e => { if (e.key === 'Escape' && selected) close(); });
  root.querySelectorAll<HTMLButtonElement>('.spot').forEach(b => b.addEventListener('click', () => open(locs[+b.dataset.i!])));
  root.querySelectorAll<HTMLButtonElement>('[data-f]').forEach(b => b.addEventListener('click', () => {
    filter = b.dataset.f as Filter;
    root.querySelectorAll('[data-f]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    place();
    if (selected) shown(selected) ? open(selected) : close();
    draw(performance.now());
  }));

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }, { rootMargin: '100px' }).observe(frame);
  let rt = 0;
  new ResizeObserver(() => { clearTimeout(rt); rt = window.setTimeout(build, 120); }).observe(frame);
  addEventListener('vigil:motion', () => kick());
  document.fonts?.ready.then(() => draw(performance.now()));
  build();
}
