// ============================================================
// 诗藏家族门户页（/portal）
// 由 middleware 按 host 分流：poeagent.top 任意路径 → 本页；子域名不受影响
// 静态单文件，边缘缓存 1 天；源文件备份在 D:/poeagent-portal/index.html
// ============================================================
export const dynamic = "force-static";

const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>诗藏 · 93 万首古典诗词数据库 · AI 问答 · 墨韵阁</title>
<meta name="description" content="诗藏家族：93.3 万首古典诗词免费检索、有引必答的 AI 诗词问答、在线写诗社区墨韵阁。永久免费，无广告。">
<meta property="og:title" content="诗藏 · 古典诗词家族">
<meta property="og:description" content="93.3 万首诗词免费检索 · AI 问答有引必答 · 墨韵阁写诗社区。永久免费无广告。">
<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='12' fill='%23C14A3F'/%3E%3Ctext x='50' y='54' font-size='58' text-anchor='middle' dominant-baseline='central' fill='%23fff' font-family='KaiTi,STKaiti,serif' font-weight='700'%3E诗%3C/text%3E%3C/svg%3E">
<style>
  :root {
    --paper: #f6f1e7;
    --paper-2: #fbf8f1;
    --ink: #2f2a26;
    --ink-light: #7d746a;
    --ink-faint: rgba(47, 42, 38, 0.08);
    --cinnabar: #C14A3F;
    --cinnabar-deep: #a53a30;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    font-family: "LXGW WenKai", "霞鹜文楷", "Kaiti SC", "STKaiti", "KaiTi", "楷体", serif;
    background:
      repeating-linear-gradient(0deg, rgba(47,42,38,0.014) 0 1px, transparent 1px 3px),
      radial-gradient(ellipse 120% 90% at 50% -10%, #fdfaf4 0%, var(--paper) 60%, #efe8d9 100%);
    color: var(--ink);
    min-height: 100vh;
    line-height: 1.75;
  }
  .wrap { max-width: 1060px; margin: 0 auto; padding: 0 24px; }

  /* ---------- 顶栏 ---------- */
  header { padding: 22px 0; }
  .head-in { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .brand { display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit; }
  .seal {
    width: 44px; height: 44px; border-radius: 9px; background: var(--cinnabar);
    color: #fff; display: flex; align-items: center; justify-content: center;
    font-size: 26px; font-weight: 700; box-shadow: 0 3px 10px rgba(193,74,63,0.3);
    flex-shrink: 0;
  }
  .brand-name { font-size: 21px; letter-spacing: 2px; }
  .brand-name small { display: block; font-size: 11px; color: var(--ink-light); letter-spacing: 4px; line-height: 1.4; }
  .head-links { display: flex; gap: 20px; font-size: 14.5px; }
  .head-links a { color: var(--ink-light); text-decoration: none; transition: color .2s; }
  .head-links a:hover { color: var(--cinnabar); }
  @media (max-width: 640px) { .head-links { display: none; } }

  /* ---------- 主视觉 ---------- */
  .hero { text-align: center; padding: 52px 0 40px; }
  .hero-seal {
    width: 84px; height: 84px; border-radius: 16px; background: var(--cinnabar);
    color: #fff; font-size: 52px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 24px; box-shadow: 0 8px 28px rgba(193,74,63,0.32), inset 0 0 0 3px rgba(255,255,255,0.25);
  }
  .hero h1 { font-size: clamp(34px, 6vw, 52px); letter-spacing: 10px; text-indent: 10px; }
  .hero .sub { margin-top: 12px; font-size: clamp(15px, 2.4vw, 18px); color: var(--ink-light); letter-spacing: 3px; }
  .hero .desc { margin: 18px auto 0; max-width: 620px; font-size: 15px; color: var(--ink-light); }
  .data-band {
    margin: 34px auto 0; display: inline-flex; flex-wrap: wrap; justify-content: center;
    gap: 8px 0; border-top: 1px solid var(--ink-faint); border-bottom: 1px solid var(--ink-faint);
    padding: 14px 8px; width: 100%; max-width: 720px;
  }
  .data-band .d { flex: 1 1 25%; min-width: 140px; }
  .data-band b { display: block; font-size: 22px; color: var(--cinnabar); font-weight: 700; }
  .data-band span { font-size: 12.5px; color: var(--ink-light); letter-spacing: 2px; }

  /* ---------- 三站卡片 ---------- */
  .sites { padding: 26px 0 30px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  @media (max-width: 880px) { .sites { grid-template-columns: 1fr; } }
  .card {
    background: var(--paper-2); border: 1px solid var(--ink-faint); border-radius: 16px;
    padding: 28px 26px 24px; position: relative; overflow: hidden;
    display: flex; flex-direction: column; text-decoration: none; color: inherit;
    transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
  }
  .card::before {
    content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--cinnabar), transparent 70%); opacity: .55;
  }
  .card:hover { transform: translateY(-5px); box-shadow: 0 14px 36px rgba(47,42,38,0.12); border-color: rgba(193,74,63,0.35); }
  .card h2 { font-size: 21px; letter-spacing: 1px; margin-bottom: 4px; }
  .card .role { font-size: 12.5px; color: var(--cinnabar); letter-spacing: 3px; margin-bottom: 12px; }
  .card p.pitch { font-size: 14px; color: var(--ink-light); margin-bottom: 14px; }
  .card ul { list-style: none; font-size: 13.5px; color: var(--ink-light); margin-bottom: 20px; }
  .card ul li { padding-left: 18px; position: relative; margin: 5px 0; }
  .card ul li::before { content: "·"; position: absolute; left: 4px; color: var(--cinnabar); font-weight: 700; }
  .card .go {
    margin-top: auto; font-size: 14px; color: var(--cinnabar); letter-spacing: 1px;
    display: flex; align-items: center; gap: 6px; transition: gap .2s;
  }
  .card:hover .go { gap: 12px; }
  .card .url { font-size: 11.5px; color: var(--ink-light); opacity: .7; }

  /* ---------- 页脚 ---------- */
  footer { padding: 30px 0 44px; text-align: center; font-size: 12.5px; color: var(--ink-light); }
  footer .line { margin: 4px 0; }
  footer a { color: var(--ink-light); }
  @media (prefers-reduced-motion: reduce) {
    .card, .card .go { transition: none; }
    .card:hover { transform: none; }
  }
</style>
</head>
<body>

<header class="wrap">
  <div class="head-in">
    <a class="brand" href="/">
      <div class="seal">诗</div>
      <div class="brand-name">诗藏<small>SHI CANG</small></div>
    </a>
    <nav class="head-links">
      <a href="https://shicang.poeagent.top">诗词数据库</a>
      <a href="https://agent.poeagent.top">AI 问答</a>
      <a href="https://poetry-garden.poeagent.top">墨韵阁</a>
    </nav>
  </div>
</header>

<main>
  <section class="hero wrap">
    <div class="hero-seal">诗</div>
    <h1>诗藏</h1>
    <p class="sub">以九十三万卷为据，有引必答</p>
    <p class="desc">一个免费、无广告的古典诗词家族：从数据到问答，从阅读到创作。所有引用均出自真实词库，可点击溯源。</p>
    <div class="data-band">
      <div class="d"><b>933,258</b><span>首诗词作品</span></div>
      <div class="d"><b>40,647</b><span>位诗人</span></div>
      <div class="d"><b>39 部</b><span>诗话词话</span></div>
      <div class="d"><b>¥0</b><span>永久免费 · 无广告</span></div>
    </div>
  </section>

  <section class="sites wrap">
    <a class="card" href="https://shicang.poeagent.top">
      <h2>诗藏</h2>
      <div class="role">诗词数据库</div>
      <p class="pitch">全唐诗、全宋诗、全宋词与诗话词话的免费全文检索。</p>
      <ul>
        <li>93.3 万首作品，毫秒级搜索</li>
        <li>诗人库、诗话原文在线阅读</li>
        <li>每首诗都有独立可分享页面</li>
      </ul>
      <div class="go">进入数据库 <span>→</span></div>
      <div class="url">shicang.poeagent.top</div>
    </a>

    <a class="card" href="https://agent.poeagent.top">
      <h2>诗藏 · 问答</h2>
      <div class="role">AI 诗词助手</div>
      <p class="pitch">一位读过全部藏书的 AI 先生：先查证，后作答。</p>
      <ul>
        <li>查出处、讲背景，引用可点击溯源</li>
        <li>把你写的诗发给它：逐字标平仄、指出出律</li>
        <li>引《人间词话》等诗话点评作品</li>
      </ul>
      <div class="go">开始提问 <span>→</span></div>
      <div class="url">agent.poeagent.top</div>
    </a>

    <a class="card" href="https://poetry-garden.poeagent.top">
      <h2>墨韵阁</h2>
      <div class="role">写诗与游戏社区</div>
      <p class="pitch">在四时墨苑写下你的诗，让 AI 陪你读与写。</p>
      <ul>
        <li>在线写诗收藏，AI 赏析 · 续写 · 配图</li>
        <li>飞花令：真词库验证，瞎编会被驳回</li>
        <li>看图赋诗：上传照片，现场作诗一首</li>
      </ul>
      <div class="go">走进墨韵阁 <span>→</span></div>
      <div class="url">poetry-garden.poeagent.top</div>
    </a>
  </section>
</main>

<footer class="wrap">
  <div class="line">数据来自 <a href="https://github.com/chinese-poetry/chinese-poetry" target="_blank" rel="noopener">chinese-poetry</a> 等开源社区整理本，仅供学习欣赏</div>
  <div class="line">字体 · 霞鹜文楷 | © 2026 诗藏 · 免费无广告</div>
</footer>

</body>
</html>
`;

export async function GET() {
  return new Response(HTML, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400",
    },
  });
}
