// Builds an installable web app (Add to Home Screen) for static hosting such as GitHub Pages.
// Usage: node scripts/build-pwa.mjs /roamlift-app [outDir]
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const base = (process.argv[2] ?? '/roamlift-app').replace(/\/$/, '');
const out = process.argv[3] ?? 'dist-pwa';
execSync(`npx expo export --platform web --output-dir ${out} --clear`, { stdio: 'inherit', env: { ...process.env, EXPO_BASE_URL: base, CI: '1' } });

for (const n of [180, 192, 512]) copyFileSync(`assets/brand/icon-${n}.png`, join(out, `icon-${n}.png`));

writeFileSync(join(out, 'manifest.webmanifest'), JSON.stringify({
  name: 'Roamlift', short_name: 'Roamlift', description: 'Snap any gym, get a workout plan.',
  start_url: `${base}/`, scope: `${base}/`, display: 'standalone', orientation: 'portrait',
  background_color: '#10181C', theme_color: '#10181C',
  icons: [
    { src: `${base}/icon-192.png`, sizes: '192x192', type: 'image/png' },
    { src: `${base}/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
}, null, 2));

// Cache-first for hashed bundles, network-first for pages, so updates arrive and the gym works offline.
const version = Date.now();
writeFileSync(join(out, 'sw.js'), `const C='roamlift-${version}';
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['${base}/','${base}/manifest.webmanifest'])).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||!r.url.startsWith(self.location.origin))return;
 const hashed=/\\/_expo\\/|\\/assets\\//.test(r.url);
 e.respondWith(caches.open(C).then(async c=>{
  if(hashed){const hit=await c.match(r);if(hit)return hit;const res=await fetch(r);if(res.ok)c.put(r,res.clone());return res;}
  try{const res=await fetch(r);if(res.ok)c.put(r,res.clone());return res;}catch(err){return (await c.match(r))||(await c.match('${base}/'));}
 }));});
`);

const head = `
    <link rel="manifest" href="${base}/manifest.webmanifest" />
    <link rel="apple-touch-icon" href="${base}/icon-180.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="Roamlift" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="theme-color" content="#10181C" />
    <script>if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('${base}/sw.js',{scope:'${base}/'}).catch(()=>{}));</script>
  </head>`;
const indexPath = join(out, 'index.html');
let html = readFileSync(indexPath, 'utf8').replace('</head>', head).replace('width=device-width, initial-scale=1, shrink-to-fit=no', 'width=device-width, initial-scale=1, viewport-fit=cover');
writeFileSync(indexPath, html);
copyFileSync(indexPath, join(out, '404.html')); // GitHub Pages serves this for deep links like /session/A
writeFileSync(join(out, '.nojekyll'), ''); // otherwise Pages drops the _expo folder
if (!existsSync(join(out, 'index.html'))) throw new Error('build failed');
console.log(`PWA ready in ${out} for ${base}/`);
