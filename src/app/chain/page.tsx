// ============================================================
// 墨韵阁 - 诗词接龙（Phase 6）
// ============================================================
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getAllPoems } from "@/lib/api";
import {
  CLASSIC_LINES,
  buildCorpusFromPoems,
  findCandidates,
  randomLine,
  lastChar,
  type ChainLine,
} from "@/lib/chain";

interface ChainNode extends ChainLine {
  byUser: boolean;
}

export default function ChainGamePage() {
  const [includeMine, setIncludeMine] = useState(true);
  const [myLines, setMyLines] = useState<ChainLine[]>([]);
  const [loadingMine, setLoadingMine] = useState(true);

  const [chain, setChain] = useState<ChainNode[]>([]);
  const [used, setUsed] = useState<Set<string>>(new Set());
  const [candidates, setCandidates] = useState<ChainLine[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  // 加载用户诗库句子
  useEffect(() => {
    getAllPoems()
      .then((poems) => setMyLines(buildCorpusFromPoems(poems)))
      .catch(() => setMyLines([]))
      .finally(() => setLoadingMine(false));
  }, []);

  const corpus = useMemo(() => {
    return includeMine ? [...CLASSIC_LINES, ...myLines] : CLASSIC_LINES;
  }, [includeMine, myLines]);

  const currentChar = chain.length > 0 ? lastChar(chain[chain.length - 1].text) : "";

  const refreshCandidates = useCallback(
    (char: string, usedSet: Set<string>) => {
      const c = findCandidates(corpus, char, usedSet, 4);
      setCandidates(c);
      if (c.length === 0) setGameOver(true);
    },
    [corpus]
  );

  const startGame = useCallback(() => {
    const start = randomLine(corpus);
    if (!start) return;
    const usedSet = new Set<string>([start.text]);
    setChain([{ ...start, byUser: false }]);
    setUsed(usedSet);
    setGameOver(false);
    setStarted(true);
    refreshCandidates(lastChar(start.text), usedSet);
  }, [corpus, refreshCandidates]);

  const pickLine = useCallback(
    (line: ChainLine) => {
      const usedSet = new Set(used);
      usedSet.add(line.text);
      setUsed(usedSet);
      setChain((prev) => [...prev, { ...line, byUser: true }]);
      refreshCandidates(lastChar(line.text), usedSet);
    },
    [used, refreshCandidates]
  );

  const resetGame = () => {
    setChain([]);
    setUsed(new Set());
    setCandidates([]);
    setGameOver(false);
    setStarted(false);
  };

  const score = chain.length;

  return (
    <div className="paper-texture min-h-screen">
      <Navbar />
      <main className="page-container relative z-10">
        <div className="max-w-2xl mx-auto px-6 py-10">
          {/* 标题 */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="font-[var(--font-mashan)] text-3xl md:text-4xl text-ink-dark mb-2">
              诗词接龙
            </h1>
            <p className="text-ink-light text-sm">
              上句末字，作下句首字 · 环环相扣，看你能接多长
            </p>
          </motion.div>

          {!started ? (
            /* 开始界面 */
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/60 rounded-2xl border border-ink/8 p-8 text-center shadow-ink"
            >
              <div className="text-5xl mb-4">🎋</div>
              <h2 className="font-[var(--font-mashan)] text-xl text-ink-dark mb-3">
                开始一局接龙
              </h2>
              <p className="text-ink-light text-sm leading-relaxed mb-6">
                系统随机抽取一句古诗作为起点，
                <br />
                你需从选项中挑选以「上句末字」开头的诗句，
                <br />
                接得越长，得分越高。
              </p>

              <label className="flex items-center justify-center gap-2 mb-6 text-sm text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMine}
                  onChange={(e) => setIncludeMine(e.target.checked)}
                  className="w-4 h-4 accent-cinnabar"
                  style={{ minHeight: "auto", minWidth: "auto" }}
                />
                加入我写的诗句
                {!loadingMine && (
                  <span className="text-ink-light/60 text-xs">
                    （{myLines.length} 句可用）
                  </span>
                )}
              </label>

              <button
                onClick={startGame}
                className="px-8 py-3 rounded-lg bg-cinnabar text-white font-medium hover:opacity-90 transition-opacity"
              >
                开始接龙
              </button>
            </motion.div>
          ) : (
            <>
              {/* 计分条 */}
              <div className="flex items-center justify-between mb-5">
                <div className="text-sm text-ink-light">
                  已接 <span className="text-cinnabar font-bold text-lg">{score}</span> 句
                </div>
                <button
                  onClick={resetGame}
                  className="text-sm text-ink-light hover:text-ink transition-colors"
                >
                  重新开始
                </button>
              </div>

              {/* 接龙链 */}
              <div className="space-y-3 mb-8">
                <AnimatePresence initial={false}>
                  {chain.map((node, i) => {
                    const lc = lastChar(node.text);
                    return (
                      <motion.div
                        key={`${node.text}-${i}`}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`rounded-xl px-5 py-3.5 border flex items-center justify-between gap-3 ${
                          node.byUser
                            ? "bg-cinnabar/5 border-cinnabar/20"
                            : "bg-white/70 border-ink/10"
                        }`}
                      >
                        <div className="min-w-0">
                          <div
                            className="text-lg text-ink-dark truncate"
                            style={{ fontFamily: "var(--font-lxgw)" }}
                          >
                            {node.text.split("").map((ch, idx) => (
                              <span
                                key={idx}
                                className={
                                  idx === node.text.length - 1
                                    ? "text-cinnabar font-bold"
                                    : ""
                                }
                              >
                                {ch}
                              </span>
                            ))}
                          </div>
                          <div className="text-xs text-ink-light/60 mt-0.5 truncate">
                            {node.source}
                          </div>
                        </div>
                        {i === 0 && (
                          <span className="text-xs text-ink-light/50 flex-shrink-0">起句</span>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* 候选 / 结束 */}
              {!gameOver ? (
                <div>
                  <div className="text-center text-sm text-ink-light mb-4">
                    请接以「
                    <span className="text-cinnabar font-bold text-xl font-[var(--font-mashan)] mx-1">
                      {currentChar}
                    </span>
                    」开头的诗句
                  </div>
                  <div className="grid gap-3">
                    {candidates.map((c) => (
                      <motion.button
                        key={c.text}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => pickLine(c)}
                        className="text-left rounded-xl px-5 py-4 bg-white/70 border border-ink/10 hover:border-cinnabar/40 hover:bg-cinnabar/5 transition-all"
                      >
                        <div
                          className="text-lg text-ink-dark"
                          style={{ fontFamily: "var(--font-lxgw)" }}
                        >
                          <span className="text-cinnabar font-bold">
                            {c.text.slice(0, 1)}
                          </span>
                          {c.text.slice(1)}
                        </div>
                        <div className="text-xs text-ink-light/60 mt-0.5">
                          {c.source}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/70 rounded-2xl border border-ink/10 p-8 text-center shadow-ink"
                >
                  <div className="text-4xl mb-3">🏵️</div>
                  <h3 className="font-[var(--font-mashan)] text-xl text-ink-dark mb-2">
                    接龙结束
                  </h3>
                  <p className="text-ink-light text-sm mb-1">
                    以「{currentChar}」开头的诗句已用尽
                  </p>
                  <p className="text-ink mb-6">
                    共接成 <span className="text-cinnabar font-bold text-2xl">{score}</span> 句
                    {score >= 8 ? " · 才思敏捷！" : score >= 5 ? " · 腹有诗书" : ""}
                  </p>
                  <button
                    onClick={startGame}
                    className="px-8 py-3 rounded-lg bg-cinnabar text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    再来一局
                  </button>
                </motion.div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
