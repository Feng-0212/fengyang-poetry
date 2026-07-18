import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 基础色板
        rice: "#F5F0E8",          // 古宣纸色
        ink: {
          dark: "#1A1A1A",         // 焦墨
          DEFAULT: "#4A4A4A",      // 浓墨
          light: "#8A8A8A",        // 淡墨
        },
        cinnabar: "#C14A3F",       // 朱砂色
        gold: "#B8860B",           // 古金色
        // 春季节气
        spring: {
          lichun: "#8B9A6B",
          yushui: "#7A9BB5",
          jingzhe: "#6B8B6B",
          chunfen: "#A8C090",
          qingming: "#C4B87A",
          guyu: "#7A9A6B",
        },
        // 夏季节气
        summer: {
          lixia: "#7AAB8A",
          xiaoman: "#9AB87A",
          mangzhong: "#C4A04A",
          xiazhi: "#5A8A7A",
          xiaoshu: "#B8784A",
          dashu: "#C8604A",
        },
        // 秋季节气
        autumn: {
          liqiu: "#A89060",
          chushu: "#A8A070",
          bailu: "#9AADB8",
          qiufen: "#B87A50",
          hanlu: "#8A6858",
          shuangjiang: "#8A7A8A",
        },
        // 冬季节气
        winter: {
          lidong: "#7A8A9A",
          xiaoxue: "#A8B0B8",
          daxue: "#B8C4CC",
          dongzhi: "#6878A8",
          xiaohan: "#687888",
          dahan: "#587888",
        },
      },
      fontFamily: {
        ink: ["var(--font-lxgw)", "Noto Serif SC", "STKaiti", "KaiTi", "serif"],
        title: ["var(--font-mashan)", "Noto Serif SC", "serif"],
      },
      backgroundImage: {
        "rice-paper": "url('/textures/paper.svg')",
        "ink-brush": "url('/textures/ink-brush.svg')",
      },
      animation: {
        "ink-spread": "inkSpread 0.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards",
        "scroll-unroll": "scrollUnroll 1s ease-out forwards",
        "seal-stamp": "sealStamp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "brush-write": "brushWrite 0.2s ease-out forwards",
        "float-slow": "floatSlow 6s ease-in-out infinite",
        "snow-fall": "snowFall 10s linear infinite",
        "leaf-fall": "leafFall 8s linear infinite",
        "firefly": "firefly 3s ease-in-out infinite",
        "petal-fall": "petalFall 12s linear infinite",
      },
      keyframes: {
        inkSpread: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        scrollUnroll: {
          "0%": { clipPath: "inset(0 50% 0 50%)" },
          "100%": { clipPath: "inset(0 0% 0 0%)" },
        },
        sealStamp: {
          "0%": { transform: "translateY(-20px) scale(1.2)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        brushWrite: {
          "0%": { opacity: "0", transform: "translateX(-4px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        snowFall: {
          "0%": { transform: "translateY(-10vh) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(110vh) rotate(360deg)", opacity: "0.3" },
        },
        leafFall: {
          "0%": { transform: "translateY(-10vh) rotate(0deg) translateX(0)", opacity: "1" },
          "100%": { transform: "translateY(110vh) rotate(720deg) translateX(100px)", opacity: "0" },
        },
        firefly: {
          "0%, 100%": { opacity: "0.2", transform: "translate(0, 0)" },
          "50%": { opacity: "1", transform: "translate(10px, -10px)" },
        },
        petalFall: {
          "0%": { transform: "translateY(-10vh) translateX(0) rotate(0deg)", opacity: "0.8" },
          "100%": { transform: "translateY(110vh) translateX(50px) rotate(360deg)", opacity: "0" },
        },
      },
      boxShadow: {
        ink: "0 4px 20px rgba(26, 26, 26, 0.15)",
        "ink-heavy": "0 8px 40px rgba(26, 26, 26, 0.25)",
        seal: "0 0 0 2px #C14A3F, 0 4px 12px rgba(193, 74, 63, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
