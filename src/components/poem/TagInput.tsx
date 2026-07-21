// ============================================================
// 标签输入组件 — 回车/逗号添加，点击 × 移除，支持常用标签快捷添加
// ============================================================
"use client";

import { useState } from "react";

const SUGGESTED = [
  "思乡",
  "山水",
  "豪放",
  "婉约",
  "田园",
  "边塞",
  "咏物",
  "送别",
  "怀古",
  "闺怨",
  "禅意",
  "爱情",
];

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
  accentColor?: string;
  max?: number;
}

export default function TagInput({
  value,
  onChange,
  accentColor = "#C14A3F",
  max = 8,
}: Props) {
  const [input, setInput] = useState("");

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/[,，\s]+/g, "");
    if (!tag) return;
    if (value.includes(tag)) return;
    if (value.length >= max) return;
    onChange([...value, tag]);
    setInput("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === "，") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const remaining = SUGGESTED.filter((s) => !value.includes(s));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 min-h-[42px] px-3 py-2 rounded-lg bg-white border border-ink/10 focus-within:border-cinnabar/40 transition-colors">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full"
            style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:opacity-60 leading-none"
              aria-label={`移除标签 ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(input)}
          placeholder={value.length === 0 ? "输入标签，回车添加" : ""}
          className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-sm text-ink-dark placeholder:text-ink-light/30"
          style={{ fontFamily: "var(--font-lxgw)" }}
        />
      </div>
      {remaining.length > 0 && value.length < max && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {remaining.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="text-xs px-2 py-0.5 rounded-full border border-ink/10 text-ink-light hover:border-cinnabar/30 hover:text-cinnabar transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
