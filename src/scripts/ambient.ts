// The living background: math glyphs drifting slowly up the margins, joined
// by faint construction lines when they pass near each other, like notes in a
// working notebook. The mouse gently pushes them aside ("chaos, then calm").
// Glyphs fade out behind the reading column so the news stays front and centre.
// Off when Motion is off; one static frame instead.

import { motion } from './chrome.ts';

const GLYPHS = ['∑', '∂', 'φ', '∞', 'λ', '∇', 'π', '≈', '∫', 'θ', 'Δ', 'ψ', 'ε', '⊕', '√', 'Ω', 'μ', '∴', '≠', 'σ', 'κ', '⟨ψ⟩', 'P(x)', 'f(t)', 'e^iπ', 'Σx²', '∀x', 'A→B', '0.618', '137.5°'];

const canvas = document.createElement('canvas');
canvas.className = 'ambient';
canvas.setAttribute('aria-hidden', 'true');
document.body.prepend(canvas);
const ctx = canvas.getContext('2d')!;

type P = { x: number; y: number; vx: number; vy: number; ox: number; g: string; s: number; ph: number; a: number };
let W = 0, H = 0, dpr = 1, parts: P[] = [], col = { ink: '#1b1a17', acc: '#2c52c4' };
let mouse = { x: -9999, y: -9999 };
let raf = 0, last = performance.now();

function colours() {
  const cs = getComputedStyle(document.documentElement);
  col = { ink: cs.getPropertyValue('--ink').trim() || col.ink, acc: cs.getPropertyValue('--acc').trim() || col.acc };
}

function resize() {
  dpr = Math.min(2, devicePixelRatio || 1);
  W = innerWidth; H = innerHeight;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  const n = W < 760 ? 14 : W < 1200 ? 30 : 46;
  parts = Array.from({ length: n }, (_, i) => {
    // Bias placement toward the side margins.
    const side = i % 2 ? 1 : 0;
    const gutter = Math.max(60, (W - 1320) / 2 + 80);
    const x = Math.random() < 0.7 ? (side ? W - Math.random() * gutter : Math.random() * gutter) : Math.random() * W;
    return { x, y: Math.random() * H, vx: 0, vy: 0, ox: x, g: GLYPHS[(Math.random() * GLYPHS.length) | 0], s: 14 + Math.random() * 18, ph: Math.random() * 6.28, a: 0.5 + Math.random() * 0.5 };
  });
}

// How visible a glyph is at x: full in the margins, faint over the text column.
function fade(x: number) {
  const half = Math.min(1320, W) / 2 - 40, d = Math.abs(x - W / 2);
  if (W < 760) return 0.45;
  return d > half ? 1 : 0.18 + 0.82 * Math.pow(d / half, 3);
}

function frame(now: number) {
  const dt = Math.min(50, now - last) / 16.7; last = now;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const ink = document.documentElement.dataset.theme === 'ink';
  const base = ink ? 0.11 : 0.09;

  for (const p of parts) {
    if (motion.on) {
      p.ph += 0.004 * dt;
      // drift up with a gentle sway; spring back toward the home column
      p.vy += (-0.18 - p.vy) * 0.02 * dt;
      p.vx += ((p.ox + Math.sin(p.ph) * 18 - p.x) * 0.0008) * dt;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < 140 * 140) { const d = Math.sqrt(d2) || 1, f = (1 - d / 140) * 0.9; p.vx += (dx / d) * f * dt; p.vy += (dy / d) * f * dt; }
      p.vx *= 0.94; p.vy *= 0.985;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y < -40) { p.y = H + 30; p.x = p.ox; }
    }
  }

  // Construction lines between nearby glyphs.
  ctx.lineWidth = 0.7;
  for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
    const a = parts[i], b = parts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
    if (d < 150) {
      ctx.globalAlpha = (1 - d / 150) * base * 1.4 * Math.min(fade(a.x), fade(b.x));
      ctx.strokeStyle = col.acc;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  }
  // The glyphs.
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const p of parts) {
    ctx.globalAlpha = base * 2.2 * p.a * fade(p.x);
    ctx.fillStyle = col.ink;
    ctx.font = `italic ${p.s}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillText(p.g, p.x, p.y);
  }
  ctx.globalAlpha = 1;
  raf = motion.on && !document.hidden ? requestAnimationFrame(frame) : 0;
}

const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
addEventListener('pointermove', e => { mouse = { x: e.clientX, y: e.clientY }; }, { passive: true });
addEventListener('pointerleave', () => { mouse = { x: -9999, y: -9999 }; });
addEventListener('resize', () => { resize(); if (!motion.on) frame(performance.now()); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && motion.on) start(); });
addEventListener('vigil:motion', () => { if (motion.on) start(); else frame(performance.now()); });
new MutationObserver(() => { colours(); if (!motion.on) frame(performance.now()); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

colours();
resize();
document.fonts?.ready.then(() => { if (!motion.on) frame(performance.now()); });
motion.on ? start() : frame(performance.now());
