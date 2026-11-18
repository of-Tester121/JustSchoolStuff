/*global UVServiceWorker,__uv$config*/
importScripts("/baremux/index.js");
importScripts("/uv/uv.bundle.js");
importScripts("/uv.config.js");
importScripts(__uv$config.sw);

const uv = new UVServiceWorker();

self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => (uv.route(event) ? await uv.fetch(event) : await fetch(event.request)))()
  );
});
