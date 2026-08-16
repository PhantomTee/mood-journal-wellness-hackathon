import { dayKey } from './storage.js';
import { STONES } from './gems.js';

const W = 560, H = 200;
const PAD = { top: 16, right: 16, bottom: 26, left: 34 };
const MOOD_COLORS = STONES.map(s => s.a);
const GRID_COLOR = 'rgba(201,166,107,0.16)';
const LINE_COLOR = '#c9a66b';
const LABEL_COLOR = '#c9c0b4';

function lastNDays(n) {
  const days = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

export function renderChart(svgEl, entries) {
  const days = lastNDays(14);
  const byDay = new Map();

  for (const e of entries) {
    const k = dayKey(e.dateISO);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k).push(e.mood);
  }

  const points = days.map(d => {
    const k = dayKey(d);
    const moods = byDay.get(k);
    const avg = moods ? moods.reduce((a, b) => a + b, 0) / moods.length : null;
    return { date: d, avg };
  });

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const stepX = innerW / (days.length - 1);
  const yFor = v => PAD.top + innerH - ((v - 1) / 4) * innerH;
  const xFor = i => PAD.left + i * stepX;

  let svg = '';

  for (let m = 1; m <= 5; m++) {
    const y = yFor(m);
    svg += `<line x1="${PAD.left}" y1="${y}" x2="${W - PAD.right}" y2="${y}" stroke="${GRID_COLOR}" stroke-width="1"/>`;
  }

  const known = points.filter(p => p.avg !== null);
  if (known.length > 1) {
    let path = '';
    points.forEach((p, i) => {
      if (p.avg === null) return;
      const cmd = path === '' ? 'M' : 'L';
      path += `${cmd}${xFor(i).toFixed(1)},${yFor(p.avg).toFixed(1)} `;
    });
    svg += `<path d="${path}" fill="none" stroke="${LINE_COLOR}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  points.forEach((p, i) => {
    if (p.avg === null) return;
    const x = xFor(i), y = yFor(p.avg);
    const color = MOOD_COLORS[Math.round(p.avg) - 1] || LINE_COLOR;
    svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="${color}" stroke="#17141b" stroke-width="1.5"/>`;
  });

  points.forEach((p, i) => {
    if (i % 2 !== 0) return;
    const x = xFor(i);
    const label = p.date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    svg += `<text x="${x.toFixed(1)}" y="${H - 6}" font-size="8.5" font-family="'Space Mono', monospace" fill="${LABEL_COLOR}" text-anchor="middle">${label}</text>`;
  });

  svgEl.innerHTML = svg;
  return known.length > 0;
}
