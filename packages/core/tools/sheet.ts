// Renders start and end poses for every exercise into one HTML page for visual review.
import { writeFileSync } from 'node:fs';
import { EXERCISES, demoFrameAt, frameToSvg } from '../src';
const C = { floor: '#9aa', prop: '#8a9499', cable: '#555', band: '#2a9d5c', far: '#b9c2c6', body: '#33414f', hot: '#ff7a1a', weight: '#10181c' } as const;
const only = process.argv[3]?.split(',');
const cells = EXERCISES.filter((e) => !only || only.includes(e.id)).map((e) => {
  const a = demoFrameAt(e.id, 0, true), b = demoFrameAt(e.id, 1, false);
  if (!a || !b) return `<div class="c miss">${e.id}: NO MOTION</div>`;
  return `<div class="c"><b>${e.name}</b><div>${frameToSvg(a, C, 150)}${frameToSvg(b, C, 150)}</div></div>`;
});
writeFileSync(process.argv[2], `<html><body style="margin:0;font:11px sans-serif;background:#fff"><style>.c{display:inline-block;width:310px;border:1px solid #ddd;margin:2px;vertical-align:top}.c svg{background:#f7f7f4;margin:2px}.miss{background:#fcc}</style>${cells.join('')}</body></html>`);
