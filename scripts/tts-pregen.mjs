// ============================================================
// 诗词朗读音频预生成 → 推送 Upstash Redis 缓存 + 输出静态文件
// Edge TTS 走本地代理合成（Vercel 数据中心 IP 被微软封禁），
// Redis 用 @upstash/redis SDK 直连，序列化格式与线上路由一致。
// 同时把音频写成 public/audio/<hash>.mp3（静态资源随站点分发，
// TTS 路由会优先读静态文件，Vercel/自建部署均可播放真人音色）。
// 用法: node scripts/tts-pregen.mjs
// ============================================================
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { Redis } from "@upstash/redis";
import { createHash } from "crypto";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ProxyAgent, setGlobalDispatcher } from "undici";

// 敏感信息一律从环境变量读取，不硬编码（避免泄入 Git）：
//   $env:UPSTASH_REDIS_REST_URL="https://..."; $env:UPSTASH_REDIS_REST_TOKEN="..."; node scripts/tts-pregen.mjs
const PROXY = process.env.TTS_PROXY || "http://127.0.0.1:7890";
const SITE = process.env.TTS_SITE || "https://poetry-garden.vercel.app";
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || "";
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";
if (!REDIS_URL || !REDIS_TOKEN) {
  console.error("缺少 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN 环境变量");
  process.exit(1);
}

const VOICE = "zh-CN-YunxiNeural"; // 默认音色 yunxi
const RATE = "-12%";               // 路由默认语速
const TTL = 60 * 60 * 24 * 60;     // 60 天
const MAX_TEXT = 600;

// 静态音频输出目录（随 Git 提交，随站点分发）
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = path.join(__dirname, "..", "public", "audio");

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

  // 优先从 Redis 直接读取诗词列表（避免本地 fetch 走代理失败），HTTP 站点作回退
  let poems = null;
  try {
    const cached = await redis.get("poems:all");
    if (Array.isArray(cached)) poems = cached;
  } catch { /* 读不到则走 HTTP */ }
  if (!poems) {
    const resp = await fetch(`${SITE}/api/poems`);
    const data = await resp.json();
    poems = data.poems || data;
  }
  console.log(`拉取到 ${poems.length} 首诗`);

  let ok = 0, skip = 0, fail = 0, refill = 0;
  for (const p of poems) {
    const composed = `${p.title}。${p.author ? p.author + "·" : ""}${p.content}`.slice(0, MAX_TEXT);
    const text = composed.trim();
    const key = `ai:tts:${hashKey(VOICE, RATE, text)}`;
    const hash = key.replace("ai:tts:", "");
    const mp3Path = path.join(AUDIO_DIR, `${hash}.mp3`);
    const mp3Exists = existsSync(mp3Path);
    try {
      const cached = await redis.get(key);
      // ① 静态文件 + Redis 缓存都齐全 → 跳过
      if (mp3Exists && cached) { skip++; console.log(`  跳过（静态+缓存齐全）《${p.title}》`); continue; }
      // ② 静态文件在、Redis 缺失 → 无需重新合成，直接回填 Redis
      if (mp3Exists && !cached) {
        const audio = readFileSync(mp3Path);
        await redis.set(key, audio.toString("base64"), { ex: TTL });
        refill++;
        console.log(`  ✓ 《${p.title}》 回填 Redis（静态已存在）`);
        continue;
      }
      // ③ 静态文件缺失 → 合成，同时写静态文件 + Redis（保证静态分发完整）
      const audio = await synth(agent, text);
      mkdirSync(AUDIO_DIR, { recursive: true });
      writeFileSync(mp3Path, audio);
      await redis.set(key, audio.toString("base64"), { ex: TTL });
      ok++;
      console.log(`  ✓ 《${p.title}》 ${audio.length} bytes  mp3=${mp3Path}`);
    } catch (e) {
      fail++;
      console.log(`  ✗ 《${p.title}》 ${e.message}`);
    }
  }
  console.log(`\n完成：成功 ${ok}，回填 ${refill}，跳过 ${skip}，失败 ${fail}`);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
