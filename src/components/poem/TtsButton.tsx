// ============================================================
// 四时墨苑 - TTS 朗读按钮
// ============================================================
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface Props {
  text: string;
  color?: string;
}

export default function TtsButton({ text, color = "#C14A3F" }: Props) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);

    // 检查是否有中文语音包
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const voices = speechSynthesis.getVoices();
      const hasChinese = voices.some(
        (v) => v.lang.startsWith("zh") || v.lang.startsWith("cmn")
      );
      setAvailable(hasChinese || voices.length > 0); // 即使没有中文，也允许尝试
    }
  }, []);

  const handleSpeak = () => {
    if (!supported) return;

    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // 清理标点符号（朗读时不需要）
    const cleanText = text
      .replace(/[，。；！？、：「」『』《》]/g, "，")
      .replace(/\n/g, "，")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "zh-CN";
    utterance.rate = 0.75; // 慢一点，更有韵味
    utterance.pitch = 0.9;
    utterance.volume = 1;

    // 尝试找中文语音
    const voices = speechSynthesis.getVoices();
    const chineseVoice = voices.find(
      (v) => v.lang === "zh-CN" || v.lang === "zh" || v.lang.startsWith("cmn")
    );
    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  };

  // 卸载时取消朗读
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  if (!supported) {
    return null; // 不支持就不显示
  }

  return (
    <motion.button
      onClick={handleSpeak}
      whileTap={{ scale: 0.95 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all border"
      style={{
        backgroundColor: isSpeaking ? `${color}15` : "transparent",
        borderColor: isSpeaking ? `${color}40` : "rgba(26,26,26,0.15)",
        color: isSpeaking ? color : "rgba(26,26,26,0.6)",
      }}
      title={available ? "点击朗读" : "未找到中文语音，仍可尝试"}
    >
      {isSpeaking ? (
        <>
          {/* 音波动画 */}
          <span className="flex items-center gap-0.5">
            <span
              className="w-0.5 h-3 rounded-full"
              style={{
                backgroundColor: color,
                animation: "tts-wave 0.8s ease-in-out infinite",
              }}
            />
            <span
              className="w-0.5 h-3 rounded-full"
              style={{
                backgroundColor: color,
                animation: "tts-wave 0.8s ease-in-out 0.2s infinite",
              }}
            />
            <span
              className="w-0.5 h-3 rounded-full"
              style={{
                backgroundColor: color,
                animation: "tts-wave 0.8s ease-in-out 0.4s infinite",
              }}
            />
          </span>
          <span>停止</span>
        </>
      ) : (
        <>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          </svg>
          <span>诵诗</span>
        </>
      )}

      <style jsx>{`
        @keyframes tts-wave {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1.2); }
        }
      `}</style>
    </motion.button>
  );
}
