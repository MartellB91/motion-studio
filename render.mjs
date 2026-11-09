#!/usr/bin/env node
// Usage:
//   node render.mjs videos/hello.html              -> out/hello.mp4
//   node render.mjs hello --stills 3               -> out/hello-still-1.png ... (no video)
//   options: --fps 30  --out <dir>
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve, basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? dflt : args[i + 1];
};
const positional = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!positional) {
  console.error('Usage: node render.mjs <video.html | name> [--stills N] [--fps 30] [--out out]');
  process.exit(1);
}

let file = positional;
if (!existsSync(file)) file = join('videos', file.endsWith('.html') ? file : `${file}.html`);
file = resolve(file);
if (!existsSync(file)) { console.error(`Not found: ${file}`); process.exit(1); }

const name = basename(file, '.html');
const fps = Number(flag('fps', 30));
const stills = flag('stills') ? Number(flag('stills')) : 0;
const outDir = resolve(flag('out', 'out'));
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ args: ['--font-render-hinting=none'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
page.on('pageerror', e => { console.error('Page error:', e.message); process.exit(1); });
await page.goto(pathToFileURL(file).href);
await page.waitForFunction(() => typeof window.render === 'function' && window.DURATION && window.SIZE);
await page.evaluate(() => document.fonts.ready);

const { duration, size } = await page.evaluate(() => ({ duration: window.DURATION, size: window.SIZE }));
const [W, H] = size;
await page.setViewportSize({ width: W, height: H });
await page.addStyleTag({
  content: `html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}
            #stage{width:${W}px;height:${H}px}`,
});

const draw = async t => {
  await page.evaluate(async t => { await window.render(t); }, t);
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
};
const shot = () => page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H } });

if (stills > 0) {
  for (let k = 0; k < stills; k++) {
    const t = duration * (k + 0.5) / stills;
    await draw(t);
    const path = join(outDir, `${name}-still-${k + 1}.png`);
    await page.screenshot({ type: 'png', path, clip: { x: 0, y: 0, width: W, height: H } });
    console.log(`still ${k + 1}/${stills}  t=${t.toFixed(2)}s  -> ${path}`);
  }
  await browser.close();
  process.exit(0);
}

const frames = Math.round(duration * fps);
const outPath = join(outDir, `${name}.mp4`);
const ff = spawn('ffmpeg', [
  '-y', '-hide_banner', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', 'pipe:0',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'medium',
  '-movflags', '+faststart', outPath,
], { stdio: ['pipe', 'inherit', 'inherit'] });
const ffDone = new Promise((res, rej) => {
  ff.on('exit', code => code === 0 ? res() : rej(new Error(`ffmpeg exited ${code}`)));
  ff.on('error', rej);
});
ff.stdin.on('error', () => {});

for (let i = 0; i < frames; i++) {
  await draw(i / fps);
  const buf = await shot();
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % 10 === 0 || i === frames - 1) process.stdout.write(`\rframe ${i + 1}/${frames}`);
}
ff.stdin.end();
await ffDone;
await browser.close();
console.log(`\n${W}x${H} @ ${fps}fps, ${frames} frames -> ${outPath}`);
