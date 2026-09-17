// ============================================================
// 墨韵阁 - 飞花令（原诗词接龙改版）
// 玩法：定一字为令，轮流吟出含令字之句；
//       由诗藏词库即时验证真伪并给出出处，整局不得重复
// ============================================================
"use client";

import { useCallback, useMemo, useState } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  FLOWER_CHARS,
  normalizeLine,
  precheck,
  randomFlowerChar,
  type FlowerHit,
  type VerifyReason,
} from "@/lib/chain";

interface PlayedLine {
  text: string; // 规范化后的句子
  hit: FlowerHit | null; // 诗藏出处
  by: 0 | 1; // 吟诵者
}

const REASON_TEXT: Record<VerifyReason, string> = {
  empty: "请先写下诗句",
  too_short: "句子太短了，至少三个字",
  too_long: "一次吟一句就好（不超过四十字）",
  char_missing: "此句不含令字，飞花令须句句含令字",
  duplicate: "此句方才已有人吟过，须另觅新句",
  not_found: "诗库中查无此句——须为真实诗句（个别名句或因版本用字差异而未收录）",
  upstream_error: "诗库服务出错，请稍后再试",
  upstream_unreachable: "诗库暂时无法连接，请稍后再试",
};

/** 高亮句中令字 */
function CharText({ text, char, className = "" }: { text: string; char: string; className?: string }) {
  const parts = text.split(char);
  return (
    <span style={{ fontFamily: "var(--font-lxgw)" }} className={className}>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && <span className="text-cinnabar font-bold">{char}</span>}
        </span>
      ))}
    </span>
  );
}

export default function FeihuaLingPage() {
  const [phase, setPhase] = useState<"setup" | "playing" | "over">("setup");
  const [flowerChar, setFlowerChar] = useState("");
  const [customChar, setCustomChar] = useState("");
  const [players, setPlayers] = useState<1 | 2>(2);

  const [lines, setLines] = useState<PlayedLine[]>([]);
  const [used, setUsed] = useState<Set<string>>(new Set());
  const [turn, setTurn] = useState<0 | 1>(0);
  const [input, setInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<{ reason: VerifyReason; at: number } | null>(null);

  const playerName = (i: 0 | 1) => (players === 1 ? "你" : i === 0 ? "甲" : "乙");

  const scores = useMemo(() => {
    const s: [number, number] = [0, 0];
    for (const l of lines) s[l.by]++;
    return s;
  }, [lines]);

  const startGame = useCallback(
    (char: string) => {
      if (!char) return;
      setFlowerChar(char);
      setLines([]);
      setUsed(new Set());
      setTurn(0);
      setInput("");
      setError(null);
      setPhase("playing");
    },
    []
  );

  const showError = useCallback((reason: VerifyReason) => {
    setError({ reason, at: Date.now() });
  }, []);

  const submit = useCallback(async () => {
    if (checking) return;
    const line = normalizeLine(input);

    const pre = precheck(line, flowerChar);
    if (pre) {
      showError(pre);
      return;
    }
    if (used.has(line)) {
      showError("duplicate");
      return;
    }

    setChecking(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/shicang/verify?q=${encodeURIComponent(line)}&char=${encodeURIComponent(flowerChar)}`
      );
      const data = await res.json();
      if (!data.ok || !data.matched) {
        const reason: VerifyReason = data.reason || "not_found";
        showError(reason === "char_missing" ? "char_missing" : reason);
        return;
      }
      const hit: FlowerHit = data.hits[0];
      setLines((prev) => [...prev, { text: line, hit, by: turn }]);
      setUsed((prev) => new Set(prev).add(line));
      setInput("");
      if (players === 2) setTurn((t) => (t === 0 ? 1 : 0));
    } catch {
      showError("upstream_unreachable");
    } finally {
      setChecking(false);
    }
  }, [checking, input, flowerChar, used, turn, players, showError]);

  /* ---------- 开局设置 ---------- */
  if (phase === "setup") {
    const picked = customChar.trim() || flowerChar;
    return (
      <div className="paper-texture min-h-screen">
        <Navbar />
        <main className="page-container relative z-10">
          <div className="max-w-2xl mx-auto px-6 py-10">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <h1 className="font-[var(--font-mashan)] text-3xl md:text-4xl text-ink-dark mb-2">
                飞花令
              </h1>
              <p className="text-ink-light text-sm">
                定一字为令 · 轮流吟句，句句含令字 · 诗藏词库即时验证真伪
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/60 rounded-2xl border border-ink/8 p-8 shadow-ink"
            >
              <h2 className="font-[var(--font-mashan)] text-xl text-ink-dark mb-3 text-center">
                一、择一字为令
              </h2>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {FLOWER_CHARS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setFlowerChar(c);
                      setCustomChar("");
                    }}
                    className={`w-11 h-11 rounded-lg border text-xl transition-all ${
                      picked === c
                        ? "bg-cinnabar text-white border-cinnabar shadow-md scale-105"
                        : "bg-white/70 border-ink/10 text-ink-dark hover:border-cinnabar/40 hover:bg-cinnabar/5"
                    }`}
                    style={{ fontFamily: "var(--font-lxgw)" }}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 mb-8">
                <span className="text-sm text-ink-light">自定义：</span>
                <input
                  value={customChar}
                  onChange={(e) => {
                    const v = [...e.target.value.trim()].slice(0, 1).join("");
                    setCustomChar(v);
                    if (v) setFlowerChar("");
                  }}
                  placeholder="任意一字"
                  className="w-24 px-3 py-1.5 rounded-lg border border-ink/15 bg-white/80 text-center text-lg text-ink-dark focus:outline-none focus:border-cinnabar/50"
                  style={{ fontFamily: "var(--font-lxgw)" }}
                />
                <button
                  onClick={() => {
                    setFlowerChar(randomFlowerChar(picked ? [picked] : []));
                    setCustomChar("");
                  }}
                  className="text-sm px-3 py-1.5 rounded-lg border border-ink/15 text-ink-light hover:text-ink hover:border-ink/30 transition-colors"
                >
                  🎲 随机
                </button>
              </div>

              <h2 className="font-[var(--font-mashan)] text-xl text-ink-dark mb-3 text-center">
                二、择对局方式
              </h2>
              <div className="flex justify-center gap-3 mb-8">
                {([2, 1] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPlayers(n)}
                    className={`px-5 py-2 rounded-lg border text-sm transition-all ${
                      players === n
                        ? "bg-cinnabar/10 border-cinnabar/40 text-ink-dark"
                        : "bg-white/70 border-ink/10 text-ink-light hover:border-ink/25"
                    }`}
                  >
                    {n === 2 ? "双人轮流（甲乙对令）" : "单人连击（自娱）"}
                  </button>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={() => startGame(picked)}
                  disabled={!picked}
                  className="px-8 py-3 rounded-lg bg-cinnabar text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  开令
                </button>
                <p className="text-xs text-ink-light/60 mt-4 leading-relaxed">
                  吟句须为真实诗句，由
                  <a
                    href="https://shicang.poeagent.top"
                    target="_blank"
                    rel="noopener"
                    className="text-cinnabar/80 hover:text-cinnabar mx-0.5"
                  >
                    诗藏
                  </a>
                  词库验证出处；整局不得重复，接不上者为负。
                </p>
              </div>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ---------- 终局结算 ---------- */
  if (phase === "over") {
    const [s0, s1] = scores;
    const verdict =
      players === 1
        ? s0 >= 10
          ? "出口成章，令人拜服！"
          : s0 >= 5
            ? "腹有诗书气自华"
            : "初试啼声，再接再厉"
        : s0 === s1
          ? "旗鼓相当，不分伯仲"
          : `${playerName(s0 > s1 ? 0 : 1)}令压全场，胜！`;
    return (
      <div className="paper-texture min-h-screen">
        <Navbar />
        <main className="page-container relative z-10">
          <div className="max-w-2xl mx-auto px-6 py-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/70 rounded-2xl border border-ink/10 p-8 text-center shadow-ink"
            >
              <div className="text-4xl mb-3">🏮</div>
              <h3 className="font-[var(--font-mashan)] text-xl text-ink-dark mb-2">
                「{flowerChar}」字令 · 终局
              </h3>
              <p className="text-ink mb-2">
                {players === 2 && (
                  <span className="mr-3">
                    甲 <span className="text-cinnabar font-bold text-xl">{s0}</span> 句 · 乙{" "}
                    <span className="text-cinnabar font-bold text-xl">{s1}</span> 句
                  </span>
                )}
                {players === 1 && (
                  <span>
                    共吟得 <span className="text-cinnabar font-bold text-2xl">{s0}</span> 句
                  </span>
                )}
              </p>
              <p className="text-ink-light text-sm mb-6">{verdict}</p>
              <div className="max-h-64 overflow-y-auto text-left mb-6 rounded-xl border border-ink/8 bg-white/50 p-3">
                {lines.map((l, i) => (
                  <div key={i} className="text-sm text-ink-dark py-1 border-b border-ink/5 last:border-0">
                    <span className="text-ink-light/60 text-xs mr-2">{i + 1}</span>
                    <CharText text={l.text} char={flowerChar} />
                    {l.hit && (
                      <span className="text-ink-light/50 text-xs ml-2">
                        {l.hit.title} · {l.hit.poet}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setPhase("setup")}
                className="px-8 py-3 rounded-lg bg-cinnabar text-white font-medium hover:opacity-90 transition-opacity"
              >
                再开一令
              </button>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ---------- 对局中 ---------- */
  const cur = error ? REASON_TEXT[error.reason] : null;
  return (
    <div className="paper-texture min-h-screen">
      <Navbar />
      <main className="page-container relative z-10">
        <div className="max-w-2xl mx-auto px-6 py-10">
          {/* 计分条 */}
          <div className="flex items-center justify-between mb-5">
            <div className="text-sm text-ink-light">
              {players === 2 ? (
                <>
                  甲 <span className={`font-bold text-lg ${turn === 0 ? "text-cinnabar" : "text-ink/40"}`}>{scores[0]}</span>
                  <span className="mx-2 text-ink/30">对</span>
                  乙 <span className={`font-bold text-lg ${turn === 1 ? "text-cinnabar" : "text-ink/40"}`}>{scores[1]}</span>
                </>
              ) : (
                <>
                  已吟 <span className="text-cinnabar font-bold text-lg">{scores[0]}</span> 句
                </>
              )}
            </div>
            <button
              onClick={() => setPhase("over")}
              className="text-sm text-ink-light hover:text-ink transition-colors"
            >
              结束并结算
            </button>
          </div>

          {/* 令字牌 */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <div className="inline-flex items-center gap-3 bg-white/70 rounded-2xl border border-ink/10 px-8 py-4 shadow-ink">
              <span
                className="text-xs text-ink-light/60 tracking-widest"
                style={{ writingMode: "vertical-rl" }}
              >
                令
              </span>
              <span
                className="text-5xl text-cinnabar font-bold"
                style={{ fontFamily: "var(--font-mashan)" }}
              >
                {flowerChar}
              </span>
              <div className="text-left text-xs text-ink-light/70 leading-relaxed">
                {players === 2 ? (
                  <>
                    轮到
                    <span className="text-cinnabar font-bold text-sm mx-0.5">{playerName(turn)}</span>
                    吟句
                    <br />
                    句中须含「{flowerChar}」字
                  </>
                ) : (
                  <>
                    第 {scores[0] + 1} 手
                    <br />
                    句中须含「{flowerChar}」字
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* 已吟句列表 */}
          <div className="space-y-3 mb-6 max-h-96 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {lines.map((node, i) => (
                <motion.div
                  key={`${node.text}-${i}`}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`rounded-xl px-5 py-3.5 border flex items-center justify-between gap-3 ${
                    node.by === 0 ? "bg-white/70 border-ink/10" : "bg-cinnabar/5 border-cinnabar/20"
                  }`}
                >
                  <div className="min-w-0">
                    <CharText text={node.text} char={flowerChar} className="text-lg text-ink-dark" />
                    {node.hit && (
                      <div className="text-xs text-ink-light/60 mt-0.5 truncate">
                        <a
                          href={node.hit.url}
                          target="_blank"
                          rel="noopener"
                          className="hover:text-cinnabar transition-colors"
                          title="在诗藏中查看原文"
                        >
                          《{node.hit.title}》 · {node.hit.poet}
                          {node.hit.dynasty ? `（${node.hit.dynasty}）` : ""} ↗
                        </a>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-ink-light/50 flex-shrink-0">
                    {players === 2 ? playerName(node.by) : `第 ${i + 1} 手`}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* 输入区 */}
          <div className="bg-white/60 rounded-2xl border border-ink/8 p-5 shadow-ink">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) submit();
                }}
                placeholder={`吟一句含「${flowerChar}」的诗句，如：${
                  flowerChar === "花" ? "花间一壶酒" : "春眠不觉晓".includes(flowerChar) ? "春眠不觉晓" : "____" + flowerChar + "____"
                }`}
                disabled={checking}
                maxLength={60}
                className="flex-1 px-4 py-3 rounded-lg border border-ink/15 bg-white/80 text-lg text-ink-dark focus:outline-none focus:border-cinnabar/50 disabled:opacity-60"
                style={{ fontFamily: "var(--font-lxgw)" }}
              />
              <button
                onClick={submit}
                disabled={checking}
                className="px-6 py-3 rounded-lg bg-cinnabar text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-60 whitespace-nowrap"
              >
                {checking ? "验证中…" : "吟诵"}
              </button>
            </div>
            <AnimatePresence mode="wait">
              {cur && (
                <motion.p
                  key={error!.at}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-cinnabar/90 mt-3 mb-0"
                >
                  {cur}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
