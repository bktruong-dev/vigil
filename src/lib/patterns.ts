// Ten notebook patterns for stories without an image. Each story's id picks a
// pattern, its parameters and one of eight colours, so every card is different
// but stays the same between visits.
//
// Every pattern is drawn inside a circle of radius R in a square box and shown
// with "meet" scaling, so the whole figure is always visible and never
// stretched, whatever the shape of the card.

export const W = 200, H = 200;
const C = 100, R = 82;

export const PATTERN_NAMES = [
  'Golden spiral', 'Lissajous', 'Rose', 'Orbits', 'Spirograph',
  'Phyllotaxis', 'Harmonograph', 'Lorenz', 'Spiral of circles', 'Epicycloid',
];

export function seedOf(id: string) {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed || 1;
  return () => { s = Math.imul(s ^ (s >>> 15), 2246822519) ^ Math.imul(s ^ (s >>> 13), 3266489917); return ((s >>> 0) % 10000) / 10000; };
}

const f = (n: number) => (Math.round(n * 10) / 10).toString();
const line = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`).join('');
const circle = (x: number, y: number, r: number) => `M${f(x + r)} ${f(y)}A${f(r)} ${f(r)} 0 1 0 ${f(x - r)} ${f(y)}A${f(r)} ${f(r)} 0 1 0 ${f(x + r)} ${f(y)}`;

// Scale any set of points so it fills (but never leaves) the circle of radius R.
function fit(pts: [number, number][]): [number, number][] {
  let mx = 0;
  for (const [x, y] of pts) mx = Math.max(mx, Math.hypot(x, y));
  const k = mx ? R / mx : 1;
  return pts.map(([x, y]) => [C + x * k, C + y * k]);
}

export interface Pattern { d: string; dots: boolean; color: number; kind: number; name: string; fig: number }

export function pattern(id: string): Pattern {
  const seed = seedOf(id);
  const r = rng(seed);
  const kind = seed % 10;
  const color = Math.floor(r() * 8);
  let d = '', dots = false;
  const p: [number, number][] = [];

  switch (kind) {
    case 0: { // golden spiral
      const b = Math.log((1 + Math.sqrt(5)) / 2) / (Math.PI / 2), rot = r() * 6.28;
      for (let t = -6 * Math.PI; t <= 0.01; t += 0.07) { const q = Math.exp(b * t); p.push([q * Math.cos(t + rot), q * Math.sin(t + rot)]); }
      d = line(fit(p)); break;
    }
    case 1: { // Lissajous
      const a = 1 + Math.floor(r() * 4), bb = a + 1 + Math.floor(r() * 3), ph = Math.PI / (2 + Math.floor(r() * 4));
      for (let t = 0; t <= Math.PI * 2 + 0.001; t += 0.02) p.push([Math.sin(a * t + ph), Math.sin(bb * t)]);
      d = line(fit(p)); break;
    }
    case 2: { // rose curve r = cos(k θ)
      const k = [2, 3, 4, 5, 6, 7][Math.floor(r() * 6)];
      const end = k % 2 ? Math.PI : Math.PI * 2;
      for (let t = 0; t <= end + 0.001; t += 0.015) { const q = Math.cos(k * t); p.push([q * Math.cos(t), q * Math.sin(t)]); }
      d = line(fit(p)); break;
    }
    case 3: { // orbits with planets
      const n = 3 + Math.floor(r() * 3);
      for (let i = 1; i <= n; i++) {
        const rr = R * (i / n), a = r() * 6.28;
        d += circle(C, C, rr);
        d += circle(C + rr * Math.cos(a), C + rr * Math.sin(a), 3.2);
      }
      d += circle(C, C, 5);
      break;
    }
    case 4: { // spirograph (hypotrochoid)
      const Rr = 5, rr = [2, 3, 3, 4][Math.floor(r() * 4)] / (1 + Math.floor(r() * 2)), dd = 0.6 + r() * 1.6;
      const turns = rr * 2 * Math.PI * 4;
      for (let t = 0; t <= turns; t += 0.04) p.push([(Rr - rr) * Math.cos(t) + dd * Math.cos(((Rr - rr) / rr) * t), (Rr - rr) * Math.sin(t) - dd * Math.sin(((Rr - rr) / rr) * t)]);
      d = line(fit(p)); break;
    }
    case 5: { // phyllotaxis: florets at the golden angle, drawn as round dots
      dots = true;
      const ang = 137.508 * Math.PI / 180, n = 160, rot = r() * 6.28;
      for (let i = 1; i <= n; i++) {
        const q = Math.sqrt(i / n), a = i * ang + rot;
        const x = C + R * q * Math.cos(a), y = C + R * q * Math.sin(a);
        d += `M${f(x)} ${f(y)}h0`;
      }
      break;
    }
    case 6: { // harmonograph: two damped pendulums
      const f1 = 2 + (r() - 0.5) * 0.04, f2 = 3 + (r() - 0.5) * 0.04, p1 = r() * 3, p2 = r() * 3, dmp = 0.02;
      for (let t = 0; t <= 80; t += 0.05) { const e = Math.exp(-dmp * t); p.push([e * Math.sin(f1 * t + p1), e * Math.sin(f2 * t + p2)]); }
      d = line(fit(p)); break;
    }
    case 7: { // Lorenz attractor, x–z projection, centred
      let x = 0.1 + r() * 0.1, y = 0, z = 0;
      for (let i = 0; i < 2400; i++) {
        const dt = 0.008, dx = 10 * (y - x), dy = x * (28 - z) - y, dz = x * y - (8 / 3) * z;
        x += dx * dt; y += dy * dt; z += dz * dt;
        if (i > 150 && i % 3 === 0) p.push([x, -(z - 25)]);
      }
      d = line(fit(p)); break;
    }
    case 8: { // circles along a golden spiral, shrinking inward
      const b = Math.log((1 + Math.sqrt(5)) / 2) / (Math.PI / 2), rot = r() * 6.28;
      for (let t = -5 * Math.PI; t <= 0; t += 0.55) {
        const q = R * 0.82 * Math.exp(b * t);
        d += circle(C + q * Math.cos(t + rot), C + q * Math.sin(t + rot), Math.max(1.2, q * 0.16));
      }
      break;
    }
    default: { // epicycloid
      const k = 3 + Math.floor(r() * 6);
      for (let t = 0; t <= Math.PI * 2 + 0.001; t += 0.012) p.push([(k + 1) * Math.cos(t) - Math.cos((k + 1) * t), (k + 1) * Math.sin(t) - Math.sin((k + 1) * t)]);
      d = line(fit(p));
    }
  }
  return { d, dots, color, kind, name: PATTERN_NAMES[kind], fig: (seed % 89) + 1 };
}
