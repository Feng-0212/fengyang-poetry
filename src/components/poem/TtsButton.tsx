// ============================================================
// 四时墨苑 - TTS 朗读按钮（升级版）
// 主音源：微软 Edge 神经网络语音（/api/ai/tts，真人级中文音色）
// 降级：浏览器 speechSynthesis（API 不可用时自动回退）
// 支持音色切换，音频结果由前端缓存（同一首诗第二次点击秒播）
// ============================================================
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  text: string;
  color?: string;
}

type VoiceOption = { key: string; label: string };

const DEFAULT_VOICES: VoiceOption[] = [
  { key: "yunxi", label: "云希 · 男声温润" },
  { key: "yunyang", label: "云扬 · 男声沉稳" },
  { key: "yunjian", label: "云健 · 男声浑厚" },
  { key: "xiaoxiao", label: "晓晓 · 女声柔和" },
  { key: "xiaoyi", label: "晓伊 · 女声清亮" },
];

const VOICE_STORE_KEY = "poetry.tts.voice";

export default function TtsButton({ text, color = "#C14A3F" }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVoices, setShowVoices] = useState(false);
  const [voice, setVoice] = useState<string>("yunxi");
  const [voices] = useState<VoiceOption[]>(DEFAULT_VOICES);
  const [supported, setSupported] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlCache = useRef<Map<string, string>>(new Map()); // voice+text -> objectURL
  const usingFallback = useRef(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(VOICE_STORE_KEY) : null;
    if (saved) setVoice(saved);
    // 只要浏览器支持 audio 或 speechSynthesis，就显示按钮
    setSupported(
      typeof window !== "undefined" &&
        (typeof Audio !== "undefined" || "speechSynthesis" in window)
    );
  }, []);

  const stopAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, []);

  // 浏览器合成降级
  const speakFallback = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setLoading(false);
      return;
    }
    usingFallback.current = true;
    const cleanText = text
      .replace(/[，。；！？、：「」『』《》]/g, "，")
      .replace(/\n/g, "，")
      .trim();
    const u = new SpeechSynthesisUtterance(cleanText);
    u.lang = "zh-CN";
    u.rate = 0.75;
    u.pitch = 0.9;
    const vs = speechSynthesis.getVoices();
    const zh = vs.find((v) => v.lang === "zh-CN" || v.lang.startsWith("zh") || v.lang.startsWith("cmn"));
    if (zh) u.voice = zh;
    u.onstart = () => { setLoading(false); setIsPlaying(true); };
    u.onend = () => setIsPlaying(false);
    u.onerror = () => { setLoading(false); setIsPlaying(false); };
    speechSynthesis.speak(u);
  }, [text]);

  const playViaApi = useCallback(async () => {
    const cacheId = `${voice}::${text}`;
    // 已缓存音频，直接播
    const cached = urlCache.current.get(cacheId);
    if (cached) {
      const a = new Audio(cached);
      audioRef.current = a;
      a.onended = () => setIsPlaying(false);
      a.onerror = () => setIsPlaying(false);
      await a.play();
      setLoading(false);
      setIsPlaying(true);
      return true;
    }

    const resp = await fetch("/api/ai/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice }),
    });
    if (!resp.ok) throw new Error(`tts ${resp.status}`);
    const blob = await resp.blob();
    if (!blob.size) throw new Error("empty audio");
    const url = URL.createObjectURL(blob);
    urlCache.current.set(cacheId, url);
    const a = new Audio(url);
    audioRef.current = a;
    a.onended = () => setIsPlaying(false);
    a.onerror = () => setIsPlaying(false);
    await a.play();
    setLoading(false);
    setIsPlaying(true);
    return true;
  }, [text, voice]);

  const handleClick = useCallback(async () => {
    if (isPlaying || loading) {
      stopAll();
      setLoading(false);
      return;
    }
    setLoading(true);
    usingFallback.current = false;
    try {
      await playViaApi();
    } catch {
      // API 失败 → 浏览器合成降级
      speakFallback();
    }
  }, [isPlaying, loading, playViaApi, speakFallback, stopAll]);

  const pickVoice = (v: string) => {
    setVoice(v);
    if (typeof window !== "undefined") localStorage.setItem(VOICE_STORE_KEY, v);
    setShowVoices(false);
    stopAll();
  };

  // 卸载清理
  useEffect(() => {
    const cache = urlCache.current;
    return () => {
      stopAll();
      cache.forEach((u) => URL.revokeObjectURL(u));
      cache.clear();
    };
  }, [stopAll]);

  if (!supported) return null;

  const active = isPlaying || loading;

  return (
    <span className="relative inline-flex items-center gap-1">
      <motion.button
        onClick={handleClick}
        whileTap={{ scale: 0.95 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all border"
        style={{
          backgroundColor: active ? `${color}15` : "transparent",
          borderColor: active ? `${color}40` : "rgba(26,26,26,0.15)",
          color: active ? color : "rgba(26,26,26,0.6)",
        }}
        title="点击朗读（真人音色）"
      >
        {loading ? (
          <>
            <span
              className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
              style={{ borderColor: `${color} transparent ${color} ${color}` }}
            />
            <span>合成中</span>
          </>
        ) : isPlaying ? (
          <>
            <span className="flex items-center gap-0.5">
              <span className="w-0.5 h-3 rounded-full" style={{ backgroundColor: color, animation: "tts-wave 0.8s ease-in-out infinite" }} />
              <span className="w-0.5 h-3 rounded-full" style={{ backgroundColor: color, animation: "tts-wave 0.8s ease-in-out 0.2s infinite" }} />
              <span className="w-0.5 h-3 rounded-full" style={{ backgroundColor: color, animation: "tts-wave 0.8s ease-in-out 0.4s infinite" }} />
            </span>
            <span>停止</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <span>诵诗</span>
          </>
        )}
      </motion.button>

      {/* 音色切换 */}
      <button
        onClick={() => setShowVoices((s) => !s)}
        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs transition-all"
        style={{ color: "rgba(26,26,26,0.4)" }}
        title="切换音色"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {showVoices && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 z-20 min-w-[9rem] rounded-xl border bg-white/95 backdrop-blur py-1 shadow-lg"
            style={{ borderColor: "rgba(26,26,26,0.12)" }}
          >
            {voices.map((v) => (
              <button
                key={v.key}
                onClick={() => pickVoice(v.key)}
                className="w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-black/5"
                style={{ color: v.key === voice ? color : "rgba(26,26,26,0.7)", fontWeight: v.key === voice ? 600 : 400 }}
              >
                {v.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes tts-wave {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1.2); }
        }
      `}</style>
    </span>
  );
}
