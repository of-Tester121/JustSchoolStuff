import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

const publicPath = fileURLToPath(new URL("./public/", import.meta.url));
const epoxyPath = fileURLToPath(
  new URL("./node_modules/@mercuryworkshop/epoxy-transport/dist/", import.meta.url)
);
const libcurlPath = fileURLToPath(
  new URL("./node_modules/@mercuryworkshop/libcurl-transport/dist/", import.meta.url)
);

// Local/private network targets are blocked by default (safer for public hosting).
// For local testing only: WISP_ALLOW_LOCAL=1 node server.js
if (process.env.WISP_ALLOW_LOCAL === "1") {
  wisp.options.allow_loopback_ips = true;
  wisp.options.allow_private_ips = true;
}

const app = Fastify({
  logger: false,
  serverFactory: (handler) => {
    const server = createServer((req, res) => {
      // Needed so the proxied pages can use things like SharedArrayBuffer.
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
      handler(req, res);
    });
    server.on("upgrade", (req, socket, head) => {
      if (req.url.startsWith("/wisp/")) wisp.routeRequest(req, socket, head);
      else socket.destroy();
    });
    return server;
  },
});

await app.register(fastifyStatic, { root: publicPath, decorateReply: true });
await app.register(fastifyStatic, { root: uvPath, prefix: "/uv/", decorateReply: false });
await app.register(fastifyStatic, { root: baremuxPath, prefix: "/baremux/", decorateReply: false });
await app.register(fastifyStatic, { root: epoxyPath, prefix: "/epoxy/", decorateReply: false });
await app.register(fastifyStatic, { root: libcurlPath, prefix: "/libcurl/", decorateReply: false });

const port = Number(process.env.PORT) || 8080;
await app.listen({ port, host: "0.0.0.0" });
console.log(`Blank Launcher running on http://localhost:${port}`);
