/*global BareMux,__uv$config*/
const $ = (id) => document.getElementById(id);
const store = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

function setStatus(text, kind) {
  $("statusText").textContent = text;
  $("status").className = kind || "";
}

async function registerSW() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers need HTTPS (or localhost).");
  }
  const reg = await navigator.serviceWorker.register("/sw.js", { scope: __uv$config.prefix });
  const sw = reg.installing || reg.waiting || reg.active;
  if (sw && sw.state !== "activated") {
    await new Promise((resolve) => {
      sw.addEventListener("statechange", () => sw.state === "activated" && resolve());
    });
  }
}

async function applyTransport() {
  const t = $("transport").value;
  if (t === "libcurl") {
    await connection.setTransport("/libcurl/index.mjs", [{ websocket: wispUrl }]);
  } else {
    await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
  }
  store.set("transport", t);
}

function toTarget(input) {
  const v = input.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[^\s]+\.[^\s]{2,}$/.test(v) && !v.includes(" ")) return "https://" + v;
  return "https://duckduckgo.com/?q=" + encodeURIComponent(v);
}

function proxiedUrl(target) {
  return location.origin + __uv$config.prefix + __uv$config.encodeUrl(target);
}

function disguise() {
  const v = $("disguise").value;
  if (!v) return null;
  if (v === "custom") {
    const t = $("customTitle").value.trim();
    return t ? { title: t, icon: null } : null;
  }
  const [title, domain] = v.split("|");
  return { title, icon: "https://www.google.com/s2/favicons?domain=" + domain + "&sz=64" };
}

function launch() {
  const target = toTarget($("url").value);
  if (!target) return;
  const src = proxiedUrl(target);

  if (!$("cloak").checked) {
    location.href = src;
    return;
  }

  const w = window.open("about:blank", "_blank");
  if (!w) {
    setStatus("Popup blocked. Allow popups for this site, then try again.", "bad");
    return;
  }
  const doc = w.document;
  const d = disguise();
  doc.title = d ? d.title : "about:blank";
  if (d && d.icon) {
    const link = doc.createElement("link");
    link.rel = "icon";
    link.href = d.icon;
    doc.head.appendChild(link);
  }
  doc.body.style.cssText = "margin:0;height:100vh;overflow:hidden;background:#fff";
  const frame = doc.createElement("iframe");
  frame.src = src;
  frame.setAttribute("allow", "fullscreen; autoplay; clipboard-write; microphone; camera");
  frame.style.cssText = "border:0;position:fixed;inset:0;width:100%;height:100%";
  doc.body.appendChild(frame);

  if ($("redir").checked) location.replace("https://www.google.com");
}

// Wire up UI
$("go").addEventListener("click", launch);
$("url").addEventListener("keydown", (e) => e.key === "Enter" && !$("go").disabled && launch());
$("chips").addEventListener("click", (e) => {
  const c = e.target.closest(".chip");
  if (c) { $("url").value = c.dataset.url; if (!$("go").disabled) launch(); }
});
$("disguise").addEventListener("change", () => {
  $("customRow").hidden = $("disguise").value !== "custom";
  store.set("disguise", $("disguise").value);
});
$("customTitle").addEventListener("input", () => store.set("customTitle", $("customTitle").value));
for (const id of ["cloak", "redir"]) {
  $(id).checked = store.get(id, $(id).checked ? "1" : "0") === "1";
  $(id).addEventListener("change", () => store.set(id, $(id).checked ? "1" : "0"));
}
$("disguise").value = store.get("disguise", "");
$("customRow").hidden = $("disguise").value !== "custom";
$("customTitle").value = store.get("customTitle", "");
$("transport").value = store.get("transport", "epoxy");
$("transport").addEventListener("change", async () => {
  setStatus("Switching connection…");
  try { await applyTransport(); setStatus("Proxy ready", "ok"); }
  catch (e) { setStatus("Connection failed: " + e.message, "bad"); }
});

// Boot
(async () => {
  try {
    await registerSW();
    await applyTransport();
    setStatus("Proxy ready", "ok");
    $("go").disabled = false;
  } catch (e) {
    console.error(e);
    setStatus(e.message || "Proxy failed to start", "bad");
  }
})();
