// ============================================================
// 诗词朗读音频预生成 → 推送 Upstash Redis 缓存
// Edge TTS 走本地代理合成（Vercel 数据中心 IP 被微软封禁），
// Redis 用 @upstash/redis SDK 直连，序列化格式与线上路由一致。
// 用法: node scripts/tts-pregen.mjs
// ============================================================
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { Redis } from "@upstash/redis";
import { createHash } from "crypto";
import { ProxyAgent, setGlobalDispatcher } from "undici";

const PROXY = "http://127.0.0.1:7890";
const SITE = "https://poetry-garden.vercel.app";
const REDIS_URL = "https://epic-sunbird-181301.upstash.io";
const REDIS_TOKEN = "gQAAAAAAAsQ1AAIgcDI2MWUyOGU1ZTk4NDE0MDJlODYxZTliMTkyYjAzYWE1Zg";

const VOICE = "zh-CN-YunxiNeural"; // 默认音色 yunxi
const RATE = "-12%";               // 路由默认语速
const TTL = 60 * 60 * 24 * 60;     // 60 天
const MAX_TEXT = 600;

// 与 src/lib/kv.ts 的 hashKey 完全一致
function hashKey(...parts) {
  return createHash("sha256").update(parts.join("\u0001")).digest("hex").slice(0, 24);
}

async function loadProxyAgent() {
  const mod = await import("https-proxy-agent");
  const H = mod.HttpsProxyAgent || mod.default;
  return new H(PROXY);
}

async function synth(agent, text) {
  const tts = new MsEdgeTTS({ agent });
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text, { rate: RATE });
  const chunks = [];
  const buf = await new Promise((res, rej) => {
    const timer = setTimeout(() => { try { tts.close(); } catch {} rej(new Error("timeout")); }, 25000);
    audioStream.on("data", (c) => chunks.push(Buffer.from(c)));
    audioStream.on("end", () => { clearTimeout(timer); res(Buffer.concat(chunks)); });
    audioStream.on("error", (e) => { clearTimeout(timer); rej(e); });
  });
  try { tts.close(); } catch {}
  return buf;
}

async function main() {
  // 让 Node 全局 fetch（拉诗列表 + Upstash SDK）走代理
  setGlobalDispatcher(new ProxyAgent(PROXY));
  const agent = await loadProxyAgent();
  const redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });

  const resp = await fetch(`${SITE}/api/poems`);
  const data = await resp.json();
  const poems = data.poems || data;
  console.log(`拉取到 ${poems.length} 首诗`);

  let ok = 0, skip = 0, fail = 0;
  for (const p of poems) {
    const composed = `${p.title}。${p.author ? p.author + "·" : ""}${p.content}`.slice(0, MAX_TEXT);
    const text = composed.trim();
    const key = `ai:tts:${hashKey(VOICE, RATE, text)}`;
    try {
      const exists = await redis.get(key);
      if (exists) { skip++; console.log(`  跳过（已缓存）《${p.title}》`); continue; }
      const audio = await synth(agent, text);
      const b64 = audio.toString("base64");
      await redis.set(key, b64, { ex: TTL });
      ok++;
      console.log(`  ✓ 《${p.title}》 ${audio.length} bytes  key=${key}`);
    } catch (e) {
      fail++;
      console.log(`  ✗ 《${p.title}》 ${e.message}`);
    }
  }
  console.log(`\n完成：成功 ${ok}，跳过 ${skip}，失败 ${fail}`);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
