// ============================================================
// API: 诗词朗读 TTS（微软 Edge 神经网络语音）
// - 免费、无需 API Key、原生中文音色
// - 合成音频按 hash(voice+rate+text) 缓存到 Redis，同一首诗只合成一次
// - 前端在本路由失败时自动回退浏览器 speechSynthesis
// ============================================================
import { cacheGet, cacheSet, hashKey } from "@/lib/kv";
import { createRateLimiter, retryAfterHeader } from "@/lib/ratelimit";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const runtime = "nodejs";
export const maxDuration = 15;

// Vercel 数据中心 IP 会被微软 Edge TTS 封禁，运行时合成基本必超时。
// 因此：默认只服务「预生成缓存」；仅当显式开启 TTS_RUNTIME_SYNTH 才在运行时尝试合成（短超时快速失败）。
const RUNTIME_SYNTH = process.env.TTS_RUNTIME_SYNTH === "1";
const SYNTH_TIMEOUT_MS = 7000;

const CACHE_TTL = 60 * 60 * 24 * 60; // 60 天
const MAX_TEXT = 600; // 单次朗读最大字数，防滥用
const MAX_CACHE_B64 = 800 * 1024; // 超过则不缓存，直接返回

// 精选中文神经音色（适合古典诗词朗读）
const VOICES: Record<string, string> = {
  yunxi: "zh-CN-YunxiNeural", // 云希·男声·温润（默认）
  xiaoxiao: "zh-CN-XiaoxiaoNeural", // 晓晓·女声·柔和
  yunjian: "zh-CN-YunjianNeural", // 云健·男声·浑厚
  xiaoyi: "zh-CN-XiaoyiNeural", // 晓伊·女声·清亮
  yunyang: "zh-CN-YunyangNeural", // 云扬·男声·沉稳（播音腔）
};
const DEFAULT_VOICE = "yunxi";

// 每 IP 每 60 秒最多 20 次
const ttsLimiter = createRateLimiter({ limit: 20, windowMs: 60_000 });

// 转成独立的 ArrayBuffer，规避 Node Buffer 的 ArrayBufferLike 类型冲突
function toArrayBuffer(buf: Buffer): ArrayBuffer {
  const ab = new ArrayBuffer(buf.length);
  new Uint8Array(ab).set(buf);
  return ab;
}

async function synth(voiceName: string, text: string, rate: string): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text, { rate });
  const chunks: Buffer[] = [];
  return await new Promise<Buffer>((resolve, reject) => {
    const timer = setTimeout(() => {
      try { tts.close(); } catch { /* ignore */ }
      reject(new Error("TTS 合成超时"));
    }, SYNTH_TIMEOUT_MS);
    audioStream.on("data", (c: Buffer) => chunks.push(Buffer.from(c)));
    audioStream.on("end", () => {
      clearTimeout(timer);
      try { tts.close(); } catch { /* ignore */ }
      resolve(Buffer.concat(chunks));
    });
    audioStream.on("error", (e: Error) => {
      clearTimeout(timer);
      try { tts.close(); } catch { /* ignore */ }
      reject(e);
    });
  });
}

export async function POST(req: Request) {
  const rl = await ttsLimiter.check(req);
  if (!rl.success) {
    return new Response(null, {
      status: 429,
      headers: {
        "Retry-After": retryAfterHeader(rl.reset),
        "X-RateLimit-Limit": String(rl.total),
        "X-RateLimit-Remaining": String(rl.remaining),
      },
    });
  }

  let body: { text?: string; voice?: string; rate?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "请求格式错误" }, { status: 400 });
  }

  const raw = (body.text || "").trim();
  if (!raw) return Response.json({ error: "朗读内容为空" }, { status: 400 });
  const text = raw.slice(0, MAX_TEXT);

  const voiceKey = body.voice && VOICES[body.voice] ? body.voice : DEFAULT_VOICE;
  const voiceName = VOICES[voiceKey];
  // 古诗放慢，更有韵味；范围限制在 -30% ~ +20%
  let rate = body.rate || "-12%";
  if (!/^[+-]?\d{1,2}%$/.test(rate)) rate = "-12%";

  const cacheKey = `ai:tts:${hashKey(voiceName, rate, text)}`;

  // 命中缓存
  try {
    const hit = await cacheGet<string>(cacheKey);
    if (hit && hit.length > 0) {
      return new Response(toArrayBuffer(Buffer.from(hit, "base64")), {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Cache": "HIT",
        },
      });
    }
  } catch { /* 缓存不可用则跳过 */ }

  // 未命中缓存：默认直接返回 503，让前端快速回退浏览器 TTS（避免 25s 干等）
  if (!RUNTIME_SYNTH) {
    return Response.json(
      { error: "no-cache", fallback: "browser" },
      { status: 503, headers: { "X-Cache": "MISS" } }
    );
  }

  // 合成（仅在显式开启运行时合成时走到这里）
  try {
    const audio = await synth(voiceName, text, rate);
    if (!audio || audio.length === 0) {
      return Response.json({ error: "合成失败：空音频" }, { status: 502 });
    }
    const b64 = audio.toString("base64");
    if (b64.length <= MAX_CACHE_B64) {
      try { await cacheSet(cacheKey, b64, CACHE_TTL); } catch { /* ignore */ }
    }
    return new Response(toArrayBuffer(audio), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Cache": "MISS",
      },
    });
  } catch (e) {
    return Response.json(
      { error: "朗读合成失败：" + (e instanceof Error ? e.message : String(e)) },
      { status: 502 }
    );
  }
}

// 供前端获取可选音色列表
export async function GET() {
  return Response.json({
    voices: [
      { key: "yunxi", label: "云希 · 男声温润" },
      { key: "yunyang", label: "云扬 · 男声沉稳" },
      { key: "yunjian", label: "云健 · 男声浑厚" },
      { key: "xiaoxiao", label: "晓晓 · 女声柔和" },
      { key: "xiaoyi", label: "晓伊 · 女声清亮" },
    ],
    default: DEFAULT_VOICE,
  });
}
