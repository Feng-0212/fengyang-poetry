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

### 🔍 跨藏搜索

- **全文模糊搜索**（Fuse.js）：标题/正文/注释，权重分级
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

- **数据本地化**：IndexedDB（Dexie 4），离线可用，零后端
- **导入/导出**：JSON 批量备份，TXT 单首分享
- **回收站**：30 天软删除
- **快捷键**：`⌘K` 搜索，`⌘Enter` 提交
- **TTS 朗读**：诗词语音朗读（Web Speech API）
- **PWA 准备**：可加入桌面/手机主屏

---

## 🚀 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | **Next.js 15** (App Router) |
| 渲染 | RSC + Client Components |
| 数据 | **IndexedDB** (Dexie 4) |
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
│   │   ├── settings/             # 设置
│   │   └── ...
│   ├── components/
│   │   ├── poem/                 # PoemCard, SolarTermNav, TtsButton ...
│   │   ├── seals/                # SealStamp 节气印章
│   │   ├── layout/               # Navbar, Footer, ClientShell
│   │   └── search/               # SearchModal (⌘K)
│   ├── hooks/                    # useSolarTerm, usePoem, useCollection ...
│   ├── lib/
│   │   ├── db.ts                 # Dexie 数据库
│   │   ├── solarterms.ts         # 24 节气元数据
│   │   └── utils.ts              # 工具函数
│   └── types/poem.ts             # 类型定义
├── public/                       # 静态资源
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

---

## 📜 许可证

[MIT](./LICENSE) © 2026 Feng Yang

---

> 愿你在这座墨韵阁里，遇见你心中的诗。
