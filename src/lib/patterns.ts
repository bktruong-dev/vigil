// Ten notebook patterns for stories without an image. Each story's id picks a
// pattern, its parameters and one of eight colours, so every card is different
// but stays the same between visits. Output is an SVG path in a 320×180 box.

export const W = 320, H = 180;
const cx = W / 2, cy = H / 2;

export const PATTERN_NAMES = [
  'Golden spiral', 'Lissajous', 'Rose', 'Orbits', 'Spirograph',
  'Phyllotaxis', 'Harmonograph', 'Lorenz', 'Waves', 'Epicycloid',
];

export function seedOf(id: string) {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

// Small deterministic random generator.
function rng(seed: number) {
  let s = seed || 1;
  return () => { s = Math.imul(s ^ (s >>> 15), 2246822519) ^ Math.imul(s ^ (s >>> 13), 3266489917); return ((s >>> 0) % 10000) / 10000; };
}

const f = (n: number) => String(Math.round(n));
const line = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`).join('');

export function pattern(id: string) {
  const seed = seedOf(id);
  const r = rng(seed);
  const kind = seed % 10;
  const color = Math.floor(r() * 8);
  const pts: [number, number][] = [];
  let d = '';

  switch (kind) {
    case 0: { // golden spiral
      const b = Math.log((1 + Math.sqrt(5)) / 2) / (Math.PI / 2), rot = r() * 6.28;
      for (let t = -6 * Math.PI; t <= 0.7; t += 0.08) { const q = 62 * Math.exp(b * t); pts.push([cx + q * Math.cos(t + rot), cy + q * Math.sin(t + rot)]); }
      d = line(pts); break;
    }
    case 1: { // Lissajous
      const a = 1 + Math.floor(r() * 4), bb = a + 1 + Math.floor(r() * 3), ph = r() * Math.PI;
      for (let t = 0; t <= 6.30; t += 0.05) pts.push([cx + 118 * Math.sin(a * t + ph), cy + 64 * Math.sin(bb * t)]);
      d = line(pts); break;
    }
    case 2: { // rose curve
      const k = [2, 3, 4, 5, 7][Math.floor(r() * 5)], R = 72;
      for (let t = 0; t <= Math.PI * 2 + 0.01; t += 0.04) { const q = R * Math.cos(k * t); pts.push([cx + q * Math.cos(t), cy + q * Math.sin(t)]); }
      d = line(pts); break;
    }
    case 3: { // orbits with planets
      const n = 3 + Math.floor(r() * 3);
      for (let i = 1; i <= n; i++) {
        const R = 14 + i * (68 / n), a = r() * 6.28;
        d += `M${f(cx + R)} ${cy}A${f(R)} ${f(R)} 0 1 0 ${f(cx - R)} ${cy}A${f(R)} ${f(R)} 0 1 0 ${f(cx + R)} ${cy}`;
        const px = cx + R * Math.cos(a), py = cy + R * Math.sin(a);
        d += `M${f(px + 3)} ${f(py)}A3 3 0 1 0 ${f(px - 3)} ${f(py)}A3 3 0 1 0 ${f(px + 3)} ${f(py)}`;
      }
      break;
    }
    case 4: { // spirograph (hypotrochoid)
      const R = 70, rr = 18 + Math.floor(r() * 30), dd = 20 + r() * 40;
      for (let t = 0; t <= Math.PI * 2 * rr / gcd(R, rr) + 0.01; t += 0.07)
        pts.push([cx + (R - rr) * Math.cos(t) + dd * Math.cos(((R - rr) / rr) * t), cy + (R - rr) * Math.sin(t) - dd * Math.sin(((R - rr) / rr) * t)]);
      d = line(pts.map(([x, y]) => [cx + (x - cx) * 0.85, cy + (y - cy) * 0.85])); break;
    }
    case 5: { // phyllotaxis
      const ang = 137.508 * Math.PI / 180, n = 90;
      for (let i = 1; i < n; i++) {
        const q = 7.6 * Math.sqrt(i), a = i * ang, x = cx + q * Math.cos(a), y = cy + q * Math.sin(a), s = 0.8 + i / n * 1.6;
        d += `M${f(x + s)} ${f(y)}A${f(s)} ${f(s)} 0 1 0 ${f(x - s)} ${f(y)}A${f(s)} ${f(s)} 0 1 0 ${f(x + s)} ${f(y)}`;
      }
      break;
    }
    case 6: { // harmonograph
      const f1 = 2 + r() * 0.04, f2 = 3 + r() * 0.04, p1 = r() * 3, p2 = r() * 3, dmp = 0.012;
      for (let t = 0; t <= 60; t += 0.15) { const e = Math.exp(-dmp * t); pts.push([cx + 110 * e * Math.sin(f1 * t + p1), cy + 66 * e * Math.sin(f2 * t + p2)]); }
      d = line(pts); break;
    }
    case 7: { // Lorenz attractor, x–z projection
      let x = 0.1 + r() * 0.1, y = 0, z = 0;
      for (let i = 0; i < 1800; i++) {
        const dt = 0.008, dx = 10 * (y - x), dy = x * (28 - z) - y, dz = x * y - (8 / 3) * z;
        x += dx * dt; y += dy * dt; z += dz * dt;
        if (i > 100 && i % 5 === 0) pts.push([cx + x * 4.2, H - 10 - z * 3]);
      }
      d = line(pts); break;
    }
    case 8: { // interfering waves
      const n = 5 + Math.floor(r() * 4), k1 = 0.02 + r() * 0.03, k2 = 0.05 + r() * 0.04, ph = r() * 6;
      for (let j = 0; j < n; j++) {
        const base = 30 + j * (120 / (n - 1)), seg: [number, number][] = [];
        for (let x = 0; x <= W; x += 8) seg.push([x, base + 12 * Math.sin(k1 * x + ph + j * 0.5) * Math.sin(k2 * x + j)]);
        d += line(seg);
      }
      break;
    }
    default: { // epicycloid
      const k = 3 + Math.floor(r() * 6), R = 64 / (k + 1) * 1.0;
      for (let t = 0; t <= Math.PI * 2 + 0.01; t += 0.035)
        pts.push([cx + R * (k + 1) * Math.cos(t) - R * Math.cos((k + 1) * t), cy + R * (k + 1) * Math.sin(t) - R * Math.sin((k + 1) * t)]);
      d = line(pts.map(([x, y]) => [cx + (x - cx) * 0.95, cy + (y - cy) * 0.95]));
    }
  }
  return { d, color, kind, name: PATTERN_NAMES[kind], fig: (seed % 89) + 1 };
}

function gcd(a: number, b: number): number { return b ? gcd(b, a % b) : a; }
