# Blank Launcher

Type a site (or a search), hit Launch, and it opens in an `about:blank` tab through a
real web proxy (Ultraviolet + Wisp). This is what makes sites like IXL work, since they
block plain iframes.

## Run it locally
    npm install
    npm start          # http://localhost:8080

## Deploy (needs a Node host, NOT GitHub Pages)
HTTPS is required for service workers, and every host below gives you it for free.

**Render.com**
1. Push this folder to a GitHub repo.
2. New > Web Service > pick the repo.
3. Build command: `npm install`   Start command: `npm start`
4. Deploy. Your URL is the launcher.

Railway, Fly.io, Koyeb, or any VPS with Node 20+ work the same way.
(`PORT` is read from the environment automatically.)

## Using it
- Allow popups for your site once, or the about:blank tab gets blocked.
- If a site misbehaves, switch Connection to "Libcurl (backup)".
- Sites with heavy bot protection or very complex JS (some logins, Google sign-in,
  Discord, etc.) may not work through any proxy of this type.

## Notes
- Private and loopback addresses are blocked on the server by default.
- Don't pin newer `epoxy-transport` / `libcurl-transport` majors: they are not
  compatible with bare-mux 2.x and break every request.
