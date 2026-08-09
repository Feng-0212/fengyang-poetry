// ============================================================
// 列表连续朗读按钮（TTS 续读）
// 按列表顺序依次朗读每首诗（/api/ai/tts），播完自动下一首。
// 与 TtsButton 共用音色偏好（localStorage: poetry.tts.voice），
// 失败自动跳过，可随时停止。
// ============================================================
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { m as motion } from "framer-motion";
import type { Poem } from "@/types/poem";

interface Props {
  poems: Poem[];
  color?: string;
}

const VOICE_STORE_KEY = "poetry.tts.voice";

/** 与 TTS 路由/预生成脚本一致的朗读文本 */
function composeText(p: Poem): string {
  return `${p.title}。${p.author ? p.author + "·" : ""}${p.content}`.slice(0, 600);
}

export default function TtsSequenceButton({ poems, color = "#C14A3F" }: Props) {
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(-1); // -1 = 未开始
  const [supported, setSupported] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopRef = useRef(false);
  const voiceRef = useRef("yunxi");

  useEffect(() => {
    setSupported(typeof window !== "undefined" && typeof Audio !== "undefined");
    const saved = localStorage.getItem(VOICE_STORE_KEY);
    if (saved) voiceRef.current = saved;
  }, []);

  const stop = useCallback(() => {
    stopRef.current = true;
    audioRef.current?.pause();
    setPlaying(false);
    setIndex(-1);
  }, []);

  const playNext = useCallback(async (startIdx: number) => {
    for (let i = startIdx; i < poems.length; i++) {
      if (stopRef.current) return;
      setIndex(i);
      const text = composeText(poems[i]);
      try {
        const resp = await fetch("/api/ai/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice: voiceRef.current }),
        });
        if (!resp.ok) throw new Error(`tts ${resp.status}`);
        const blob = await resp.blob();
        if (!blob.size) throw new Error("empty audio");
        const url = URL.createObjectURL(blob);
        if (stopRef.current) { URL.revokeObjectURL(url); return; }
        await new Promise<void>((resolve) => {
          const a = new Audio(url);
          audioRef.current = a;
          a.onended = () => { URL.revokeObjectURL(url); resolve(); };
          a.onerror = () => { URL.revokeObjectURL(url); resolve(); };
          a.play().catch(() => { URL.revokeObjectURL(url); resolve(); });
        });
      } catch {
        // 单首失败跳过，继续下一首
      }
      if (stopRef.current) return;
    }
    if (!stopRef.current) {
      setPlaying(false);
      setIndex(-1);
    }
  }, [poems]);

  const toggle = useCallback(() => {
    if (playing) { stop(); return; }
    if (poems.length === 0) return;
    stopRef.current = false;
    setPlaying(true);
    playNext(0);
  }, [playing, poems.length, stop, playNext]);

  // 卸载清理
  useEffect(() => () => stop(), [stop]);

  if (!supported || poems.length === 0) return null;

  return (
    <span className="relative inline-flex items-center gap-2">
      <motion.button
        onClick={toggle}
        whileTap={{ scale: 0.95 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs transition-all border"
        style={{
          backgroundColor: playing ? `${color}15` : "transparent",
          borderColor: playing ? `${color}40` : "rgba(26,26,26,0.15)",
          color: playing ? color : "rgba(26,26,26,0.6)",
        }}
        title={playing ? "停止续读" : "从第一首开始连续朗读"}
      >
        {playing ? (
          <>
            <span className="flex items-center gap-0.5">
              <span className="w-0.5 h-3 rounded-full" style={{ backgroundColor: color, animation: "tts-wave 0.8s ease-in-out infinite" }} />
              <span className="w-0.5 h-3 rounded-full" style={{ backgroundColor: color, animation: "tts-wave 0.8s ease-in-out 0.2s infinite" }} />
              <span className="w-0.5 h-3 rounded-full" style={{ backgroundColor: color, animation: "tts-wave 0.8s ease-in-out 0.4s infinite" }} />
            </span>
            <span>停止续读</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5.5v13l11-6.5-11-6.5z" />
            </svg>
            <span>连续朗读</span>
          </>
        )}
      </motion.button>
      {playing && index >= 0 && (
        <span className="text-xs text-ink-light/70">
          {index + 1}/{poems.length} 首
        </span>
      )}
      <style jsx>{`
        @keyframes tts-wave {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1.2); }
        }
      `}</style>
    </span>
  );
}
