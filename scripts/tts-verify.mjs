import { ProxyAgent, setGlobalDispatcher } from "undici";
setGlobalDispatcher(new ProxyAgent("http://127.0.0.1:7890"));
const SITE = "https://poetry-garden.vercel.app";

// 1) 已缓存诗词 → 期望 HIT 秒返回
const data = await (await fetch(`${SITE}/api/poems`)).json();
const poems = (data.poems || data).slice(0, 2);
for (const p of poems) {
  const text = `${p.title}。${p.author ? p.author + "·" : ""}${p.content}`.slice(0, 600);
  const t0 = Date.now();
  const r = await fetch(`${SITE}/api/ai/tts`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const len = (await r.arrayBuffer()).byteLength;
  console.log(`[缓存] 《${p.title}》 status=${r.status} cache=${r.headers.get("x-cache")} bytes=${len} ms=${Date.now() - t0}`);
}

// 2) 未缓存文本 → 期望 503 快速失败（前端回退浏览器 TTS）
{
  const t0 = Date.now();
  const r = await fetch(`${SITE}/api/ai/tts`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "这是一段从未缓存过的测试文本" + Date.now() }),
  });
  let msg = "";
  try { msg = JSON.stringify(await r.json()); } catch {}
  console.log(`[未缓存] status=${r.status} ms=${Date.now() - t0} body=${msg}`);
}
