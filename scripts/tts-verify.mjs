import { ProxyAgent, setGlobalDispatcher } from "undici";
setGlobalDispatcher(new ProxyAgent("http://127.0.0.1:7890"));
const SITE = "https://poetry-garden.vercel.app";

const data = await (await fetch(`${SITE}/api/poems`)).json();
const poems = (data.poems || data).slice(0, 3);
for (const p of poems) {
  const text = `${p.title}。${p.author ? p.author + "·" : ""}${p.content}`.slice(0, 600);
  const t0 = Date.now();
  try {
    const r = await fetch(`${SITE}/api/ai/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const cache = r.headers.get("x-cache");
    const ct = r.headers.get("content-type");
    const len = (await r.arrayBuffer()).byteLength;
    console.log(`《${p.title}》 status=${r.status} cache=${cache} ct=${ct} bytes=${len} ms=${Date.now() - t0}`);
  } catch (e) {
    console.log(`《${p.title}》 ERR ${e.message} ms=${Date.now() - t0}`);
  }
}
