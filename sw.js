const C='roamlift-1794220853155';
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['/roamlift/','/roamlift/manifest.webmanifest'])).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||!r.url.startsWith(self.location.origin))return;
 const hashed=/\/_expo\/|\/assets\//.test(r.url);
 e.respondWith(caches.open(C).then(async c=>{
  if(hashed){const hit=await c.match(r);if(hit)return hit;const res=await fetch(r);if(res.ok)c.put(r,res.clone());return res;}
  try{const res=await fetch(r);if(res.ok)c.put(r,res.clone());return res;}catch(err){return (await c.match(r))||(await c.match('/roamlift/'));}
 }));});
