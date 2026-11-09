// StromBlick v1.0.0: Cache only app shell. Personal meter readings are held in IndexedDB.
const CACHE = 'stromblick-shell-v1.0.0';
const SHELL = ['./','./index.html','./styles.css','./app.mjs','./calculations.mjs','./storage.mjs','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('stromblick-shell-')&&k!==CACHE)await caches.delete(k);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
   const cache=await caches.open(CACHE);const cached=await cache.match(req);
   if(cached)return cached;
   try{const response=await fetch(req);if(response.ok && new URL(req.url).pathname.startsWith(new URL(self.registration.scope).pathname))cache.put(req,response.clone());return response;}
   catch{return cached || new Response('Offline nicht verfügbar.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});}
 })());
});
