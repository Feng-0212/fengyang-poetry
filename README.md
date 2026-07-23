# 墨韵阁 · FengYang's Poetry

> 一座随节气流转的私人藏书楼，藏诗词、藏时光、藏心意。
**6 藏并行，各抱地势，墨韵悠长。**

墨韵阁是一个面向中国古诗词与现代诗的私人收藏网站，以「藏」为组织单位，每一藏各有主题、专属色调与印章。它从一座「随时间生长的园林」演化而来 —— 立春读诗，霜降吟词，山川入梦，月落成诗。

> 原文：「四时墨苑」（节令二十四），重构为多藏架构（墨韵阁），收录 6 个预置藏 + 任意自建藏。

---

## ✨ 核心特色

### 🏛️ 多藏架构

不是单一图书馆，而是 **6 馆并行**的墨韵阁。

| 藏 | 图标 | 主题 | 主色 |
|---|---|---|---|
| 四时墨苑 | 🌸 | 节令二十四 | 朱砂红 |
| 月下山河 | 🏔️ | 山川风物 | 青绿 |
| 关山词 | ⚔️ | 边塞雄风 | 赭石 |
| 烟雨阁 | 🌧️ | 离思愁绪 | 靛蓝 |
| 童心斋 | 🪁 | 童趣启蒙 | 蜜橘 |
| 新诗林 | 🌲 | 现代诗钞 | 松绿 |

每藏独立印章、专属色调、布局可选。点击「创建新藏」可自建专属藏。

### 🔍 搜索增强

- **全文模糊搜索**（Fuse.js）：标题/正文/注释，权重分级
- **拼音搜索**：输入 `jingyesi` 匹配「静夜思」，支持全拼和首字母
- **AI 语义搜索**：输入「思乡的诗」「关于月亮」，AI 理解意图推荐
- **多维度筛选**：6 藏 × 4 季组合筛选
- **三种分组**：按藏 / 按季 / 平铺
- **实时高亮**：查询词黄色标记
- **快捷键 ⌘K**：随时唤起快速搜索
- **历史记录**：最近 5 次搜索
- **URL 同步**：`/search?q=月` 可分享

### 🎨 设计语言

- **水墨基底**：宣纸纹理、墨色三层、留白哲学
- **古籍韵味**：霞鹜文楷 + 雁书方正 + 印章朱砂
- **节气流转**：24 节气自动识别，色随季变
- **动效克制**：卷轴展开、墨迹晕染、毛笔逐字、节气动效（雪 · 雨 · 花 · 瓣）
- **响应式**：桌面/平板/手机三端通吃

### ⚙️ 工程能力

- **数据存储**：Upstash Redis（生产）+ IndexedDB（离线降级）
- **数据备份**：每日自动备份到 Redis，支持手动导出 JSON、快照历史回溯
- **限流保护**：AI 接口基于 Redis 滑动窗口限流（每 IP 20 次/分钟），返回 429 + Retry-After
- **标签体系**：自由标签 + AI 智能打标签（18 个预定义标签池）
- **数据统计**：写作热力图 + 标签词云 + 季节分布 + 趋势图
- **导入/导出**：JSON 批量备份，TXT 单首分享
- **回收站**：30 天软删除
- **快捷键**：`⌘K` 搜索，`⌘Enter` 提交
- **TTS 朗读**：真人级中文神经网络音色（微软 Edge TTS 预生成 + Redis 缓存，浏览器 Web Speech 降级，5 种音色可切换）
- **PWA**：可加入桌面/手机主屏，离线可用

### 🤖 AI 能力

- **AI 赏析**：生成诗词深度赏析（支持自定义 API Key）
- **AI 配图**：两步生图（文本模型生成提示词 → 图像模型生成封面）
- **AI 标签**：智能识别主题、情感、意象标签
- **AI 语义搜索**：理解自然语言查询，推荐相关诗词
- **Redis 缓存**：AI 赏析结果缓存 30 天，避免重复计算
- **个人 API Key**：支持用户自定义 AI API Key、Base URL、模型选择

### 🎨 布局与展示

- **三种布局**：经典 / 列表 / 画廊，自由切换
- **诗词接龙**：随机起句 → 选句接龙 → 计分评语（52 句经典名句库）
- **分享卡片**：Canvas 生成诗词壁纸（含印章、节气、背景）
- **作者朝代**：支持填写作者和朝代，缺省显示「佚名」
- **收藏计数**：实时显示收藏数，支持收藏/取消收藏

---

## 🚀 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | **Next.js 15** (App Router) |
| 渲染 | RSC + Client Components |
| 数据 | **Upstash Redis**（生产）+ IndexedDB (Dexie 4，离线降级) |
| 样式 | Tailwind CSS 3 + CSS 变量 |
| 动效 | Framer Motion 11 |
| 搜索 | Fuse.js 7（模糊匹配） |
| 字体 | 霞鹜文楷 LXGW WenKai + 鸿雷板书简 + 系统衬线 |
| 类型 | TypeScript 5.7 |
| 包管理 | npm |

---

## 📦 快速开始

```bash
# 克隆
git clone https://github.com/Feng-0212/fengyang-poetry.git
cd fengyang-poetry

# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 打开 http://localhost:3000

# 生产构建
npm run build
npm start
```

**首次访问**会触发 Next.js 按需编译（359 modules），约 15-20 秒。之后秒开。

---

## 📁 目录结构

```
poetry-garden/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # 墨韵阁主页（藏卡片网格）
│   │   ├── search/page.tsx       # 跨藏搜索页
│   │   ├── poem/[id]/            # 诗词详情 + 编辑
│   │   ├── yuan/
│   │   │   ├── [slug]/page.tsx   # 通用藏主页
│   │   │   ├── new/page.tsx      # 创建新藏
│   │   │   └── sishi-moyuan/     # 四时墨苑完整版（节气+季节）
│   │   ├── settings/             # 设置（AI/外观/备份/批量标签）
│   │   └── ...
│   ├── components/
│   │   ├── poem/                 # PoemCard, SolarTermNav, TtsButton ...
│   │   ├── seals/                # SealStamp 节气印章
│   │   ├── layout/               # Navbar, Footer, ClientShell
│   │   └── search/               # SearchModal (⌘K)
│   ├── hooks/                    # useSolarTerm, usePoem, useCollection ...
│   ├── lib/
│   │   ├── db.ts                 # Dexie（IndexedDB 离线降级）
│   │   ├── api.ts                # 客户端数据访问（云端 API 封装）
│   │   ├── kv.ts                 # Upstash Redis 封装 + 内存回退
│   │   ├── ratelimit.ts          # 基于 Redis 的 IP 限流
│   │   ├── ai.ts                 # 客户端 AI 工具库（赏析/配图/自定义 Key）
│   │   ├── export.ts             # 导出诗集（Markdown/TXT/PDF）
│   │   ├── chain.ts              # 诗词接龙名句库与规则
│   │   ├── pinyin.ts             # 拼音搜索（按需加载）
│   │   ├── solarterms.ts         # 24 节气元数据
│   │   └── utils.ts              # 工具函数
│   └── types/poem.ts             # 类型定义
├── scripts/                      # 维护脚本（TTS 预生成/校验/编码扫描）
├── public/                       # 静态资源 + PWA（manifest / SW / 回退图池）
├── .github/workflows/deploy.yml  # GitHub Actions 自动部署
├── vercel.json                   # Vercel 配置（Cron 每日备份）
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🎯 路线图

- [x] Phase 1：项目骨架 + 24 节气系统
- [x] Phase 2：搜索 + 导入/导出 + 快捷键
- [x] Phase 3：动效增强（卷轴/毛笔/印章/朗读）
- [x] Phase 4：多藏架构（墨韵阁）+ 跨藏搜索
- [x] Phase 5：PWA 离线 + 移动端优化
- [x] Phase 6：诗词接龙 / 朋友圈分享卡片
- [x] Phase 7：AI 赏析 + AI 配图（支持自定义 API Key）
- [x] P0 优化：AI 配图稳定性（重试/备选/回退图池）+ 移动端性能 + 错误边界
- [x] P1 功能：数据统计可视化 + 搜索增强（拼音 + 语义搜索）
- [x] P2 体验：暗色模式 + 字号调节 + 数据导出诗集（Markdown / TXT / 打印 PDF）
- [x] 安全加固：AI 接口限流 + 备份快照历史 + AI 批量打标签
- [x] 朗读升级：真人级中文 TTS（预生成 + Redis 缓存 + 浏览器降级）
- [x] CI/CD：GitHub Actions 自动部署到 Vercel

---

## 📜 许可证

[MIT](./LICENSE) © 2026 Feng Yang

---

> 愿你在这座墨韵阁里，遇见你心中的诗。
