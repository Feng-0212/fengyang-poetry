# 墨韵阁 · FengYang's Poetry

> 一座随节气流转的诗意书院，藏诗词、藏时光、藏心意。
> **多用户公开书院**：登录即可开苑，公开作品全站可见，私密作品仅自己可见。

墨韵阁是一个面向中国古诗词与现代诗的 **多用户收藏与创作网站**，以「藏」为组织单位，每一藏各有主题、专属色调与印章。它从一座「随时间生长的园林」演化而来 —— 立春读诗，霜降吟词，山川入梦，月落成诗。2026-08 起开放注册，成为一座「公开书院」：游客可浏览，登录者可创作、收藏、以诗会友。

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

每藏独立印章、专属色调、布局可选。登录后可创建自己的藏，作品默认公开、可切换私密。

### 👥 账号与社区

- **邮箱+密码注册/登录**（scrypt 哈希，Bearer 会话 30 天）
- **公开 / 私密可见性**：默认公开，私密仅本人可见（他人访问返回 404）
- **真实收藏**：登录后收藏他人作品，`favoritedBy` 去重计数，全站收藏 Top10 榜单
- **用户主页** `/u/[id]`：聚合某位墨客的公开作品，@作者 可点击直达
- **节气同题创作**：节气诗库一键「同题创作」，预设节气直达写诗页
- **管理员继承**：`ADMIN_EMAIL` 邮箱注册时自动继承历史数据

### 🤖 AI 能力

- **AI 赏析**：生成诗词深度赏析（支持自定义 API Key）
- **AI 配图**：两步生图（提示词生成 → 生图），下载后 sharp 压缩为 WebP 自包含存储，不裂图
- **AI 标签**：智能识别主题、情感、意象标签（全库 / 指定诗词批量）
- **AI 续写**：给已有诗句续写完整，保持句式韵脚
- **AI 仿写**：按主题/风格（如"王维山水田园"）创作新诗
- **AI 语义搜索**：理解自然语言查询，推荐相关诗词
- **Redis 缓存**：赏析结果缓存 30 天；个人 API Key / Base URL / 模型可选

### 🔍 搜索增强

- **全文模糊搜索**（Fuse.js）：标题/正文/注释，权重分级
- **拼音搜索**：输入 `jingyesi` 匹配「静夜思」，支持全拼和首字母
- **AI 语义搜索**：输入「思乡的诗」「关于月亮」，AI 理解意图推荐
- **多维度筛选**：6 藏 × 4 季组合筛选；三种分组（按藏/按季/平铺）
- **实时高亮** + **快捷键 ⌘K** + **历史记录** + **URL 同步**（`/search?q=月`）

### 📅 展示与体验

- **诗词日历**：月历视图按创作日期浏览，节气标记、点选查当日诗
- **列表连续朗读**：一键顺序朗读全列表（真人 TTS 音色，播完自动下一首）
- **数据统计**：热力图 + 词云 + 季节分布 + 节气分布 + 收藏 Top10 + 最长连续写作
- **分享公开页** `/share/[id]`：无鉴权只读展示（微信/群内直接打开），含 OG 元信息
- **经典诗词导入**：一键导入 12 首公版唐诗宋词（按标题查重）
- **批量打标签**：全库多选 → 批量添加标签；回收站批量恢复/删除
- **三种布局**：经典 / 列表 / 画廊；**诗词接龙**、**分享卡片**（Canvas 壁纸）
- **暗色模式 / 字号调节 / 导出诗集**（Markdown / TXT / PDF）

### ⚙️ 工程能力

- **数据存储**：Upstash Redis（生产）+ IndexedDB（离线降级）；客户端短 TTL 缓存 + 请求去重
- **鉴权安全**：写操作全部需登录 + 归属校验（仅本人可改/删，防篡改归属字段）；密码 scrypt 哈希
- **数据备份**：每日自动备份，支持异地推送（可选）；快照历史回溯；手动导入导出
- **限流保护**：AI 接口基于 Redis 滑动窗口限流，429 + Retry-After
- **性能**：next/image 图片优化、SearchModal/低频页按需加载、字体非阻塞加载、骨架屏
- **无障碍**：弹窗 role/aria、键盘导航、aria-label
- **TTS 朗读**：真人级中文神经网络音色（预生成静态 mp3 + Redis 缓存 + 浏览器降级，5 音色）
- **PWA**：可加入主屏，离线可用；回收站 30 天软删除

---

## 🚀 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | **Next.js 15** (App Router) |
| 渲染 | RSC + Client Components |
| 数据 | **Upstash Redis**（生产）+ IndexedDB (Dexie 4，离线降级) |
| 鉴权 | 自建邮箱+密码（crypto.scrypt）+ Bearer Token 会话 |
| 样式 | Tailwind CSS 3 + CSS 变量 |
| 动效 | Framer Motion 11 |
| 搜索 | Fuse.js 7（模糊匹配）+ AI 语义 |
| 图像 | sharp（AI 配图 WebP 压缩） |
| 类型 | TypeScript 5.7 |
| 包管理 | npm |

---

## 🏗️ 模块化架构

项目按职责清晰分层，模块之间单向依赖：

```
页面层   src/app/**（RSC + Client 页面）
   ↓
组件层   src/components/**（Navbar / PoemCard / AiPanel / CommentSection / FollowButton ...）
   ↓
API 层   src/app/api/**（REST 路由：鉴权 / 业务 / AI / 备份）
   ↓
服务层   src/lib/**（业务逻辑与数据访问）
   │   ├── store.ts     统一数据访问层（诗词/藏/评论读写，Redis + 内存回退）
   │   ├── user.ts      账号/会话/可见性/关注/管理员继承
   │   ├── ai.ts        客户端 AI 能力（赏析/配图/标签/续写/仿写）
   │   ├── kv.ts        Redis 封装（生产）+ 内存回退（本地）
   │   ├── ratelimit.ts 限流 · solarterms.ts 节气元数据 · tags.ts 标签池 ...
   └── types/poem.ts    共享类型（Poem/Collection/User/Comment）
```

- **数据层收敛**：所有 API 路由经 `lib/store.ts` 读写数据，不再各自重复连接 Redis（消除 ~300 行重复代码）
- **鉴权统一**：写操作一律 `requireUser`（Bearer Token），读接口 `optionalUser` 按可见性过滤
- **客户端收敛**：页面经 `lib/api.ts` 统一调用（自动携带 Token + 短 TTL 缓存去重），AI 能力经 `lib/ai.ts`
- **按需加载**：SearchModal / ShareCard / AiPanel 动态导入，低频页 `prefetch={false}`

---

## 📦 快速开始

```bash
git clone https://github.com/Feng-0212/fengyang-poetry.git
cd fengyang-poetry

# 配置环境变量（复制 .env.example 为 .env，见下表）
cp .env.example .env

npm install
npm run dev        # 开发：http://localhost:3000
npm run build      # 生产构建
npm start          # 生产运行
```

**首次访问**会触发 Next.js 按需编译，约 15-20 秒，之后秒开。

### 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash Redis 凭据（本地开发无 Redis 时自动内存回退） |
| `AI_API_KEY` / `AI_BASE_URL` / `AI_TEXT_MODEL` | ✅ | AI 文本模型（OpenAI 兼容） |
| `AI_IMAGE_MODEL` | 可选 | 图像模型名，留空复用文本配置 |
| `ADMIN_EMAIL` | 建议 | 管理员邮箱（逗号分隔多个）。**用该邮箱注册时自动继承历史数据**，上线前务必配置 |
| `NEXT_PUBLIC_SITE_URL` | 建议 | 正式域名（影响 OG 元信息） |
| `CRON_SECRET` | 建议 | 每日备份接口鉴权（配合 Vercel Cron） |
| `BACKUP_REMOTE_URL` / `BACKUP_REMOTE_TOKEN` | 可选 | 异地备份推送端点 |
| `POEM_PASSWORD` | 废弃 | 旧版写操作密码，已迁移到账号体系，无需配置 |

---

## 📁 目录结构

```
fengyang-poetry/
├── src/
│   ├── app/
│   │   ├── page.tsx                # 墨韵阁主页（藏卡片网格）
│   │   ├── login/page.tsx          # 登录 / 注册
│   │   ├── u/[userId]/page.tsx     # 用户主页（公开作品聚合）
│   │   ├── share/[id]/page.tsx     # 分享公开页（无鉴权只读）
│   │   ├── search/page.tsx         # 跨藏搜索页
│   │   ├── poem/[id]/              # 诗词详情 + 编辑 + 收藏
│   │   ├── yuan/
│   │   │   ├── [slug]/             # 通用藏主页
│   │   │   └── sishi-moyuan/       # 四时墨苑（节气/日历/季节/收藏/回收站）
│   │   ├── api/
│   │   │   ├── auth/               # register / login / me / logout
│   │   │   ├── ai/                 # annotate / image / tags / search / tts / write
│   │   │   ├── poems/ poem/ collection/  # CRUD + favorite + batch-tags
│   │   │   └── backup/             # 每日备份 + 历史
│   │   ├── settings/  stats/  tags/  trash/  chain/  seasons/  write/
│   ├── components/
│   │   ├── poem/                   # PoemCard, TtsButton, TtsSequenceButton ...
│   │   ├── auth/                   # PasswordGate（登录态 Provider）
│   │   ├── layout/  search/  seals/  settings/  share/  user/  comment/
│   ├── hooks/                      # useSolarTerm, usePoem, useCollection ...
│   ├── lib/
│   │   ├── store.ts                # 统一数据访问层（诗词/藏/评论读写，Redis + 内存回退）
│   │   ├── user.ts                 # 用户/会话/可见性/关注/管理员继承（服务端）
│   │   ├── auth.ts                 # 客户端会话工具（token）
│   │   ├── api.ts                  # 客户端 API 封装（Bearer 自动携带 + 缓存）
│   │   ├── kv.ts  db.ts  ai.ts  ratelimit.ts  ...
│   └── types/poem.ts               # 类型定义（Poem/Collection/User/Comment）
├── scripts/                        # 维护脚本（TTS 预生成 / 回退图生成）
├── public/                         # 静态资源 + PWA + 静态音频 + 回退图池
├── docs/                           # 交付记录 / 改动汇总 / 修复记录 / 部署清单 / PRD
├── vercel.json                     # Vercel Cron 每日备份
└── package.json
```

---

## 🎯 路线图

- [x] Phase 1-7：骨架/节气/搜索/动效/多藏架构/PWA/接龙/分享卡片/AI 赏析配图
- [x] 2026-07 优化：数据统计 + 拼音语义搜索 + 暗色模式 + 导出诗集 + 限流 + 备份快照 + 真人 TTS + CI/CD
- [x] 2026-08-07 缺陷修复：15 项（节气表/热力图/回退图池/密码安全/标签池统一/回收站清理等）
- [x] 2026-08-09 遗留风险：密码强制 503 / AI 配图自包含 / TTS 静态音频 / 异地备份 / 体积优化（235→196KB）
- [x] P1 功能：经典诗词导入 · 诗词日历 · 连续朗读 · 分享公开页 · 统计增强 · 批量打标签
- [x] P1 性能体验：next/image · 字体非阻塞 · API 缓存去重 · 路由分包 · 骨架屏 · 无障碍
- [x] P0 收尾：AI 配图 sharp 压缩根治（1.4MB 原图 → 207KB WebP 自包含）
- [x] **P2-17 多用户公开化**：邮箱+密码登录 · 数据归属 · 公开-私密可见性 · ADMIN_EMAIL 继承
- [x] **P2-18 AI 续写/仿写**
- [x] **P2-19 社区化**：真实收藏 · 节气同题创作 · 用户主页
- [ ] P2-20 App 打包（建议不做，PWA 已覆盖）

---

## 📜 许可证

[MIT](./LICENSE) © 2026 Feng Yang

---

> 愿你在这座墨韵阁里，遇见你心中的诗。
