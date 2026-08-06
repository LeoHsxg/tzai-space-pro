/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        vdOrange: "#FF6F0D",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      dropShadow: {
        md: ["0 2px 4px rgb(0 0 0 / 0.07)", "0 1px 3px rgb(0 0 0 / 0.06)"],
      },
      fontFamily: {
        // 拉丁字元／數字一律 Inter；中文 fallback 到 Noto Sans TC（next/font 載入的 webfont）
        sans: ["var(--font-inter)", "var(--font-noto-sans-tc)", '"Noto Sans TC"', "sans-serif"],
        inter: ["var(--font-inter)", "var(--font-noto-sans-tc)", '"Noto Sans TC"', "sans-serif"],
        // 日期／時間／數字用；中文 fallback 讓「4 月 27 日」這類混排也正常
        roboto: ["var(--font-roboto)", "Roboto", "var(--font-noto-sans-tc)", '"Noto Sans TC"', "sans-serif"],
        noto: ["var(--font-inter)", "var(--font-noto-sans-tc)", '"Noto Sans TC"', "sans-serif"],
      },
      keyframes: {
        spin: {
          to: { transform: "rotate(360deg)" },
        },
        // 雜物間：篩選守門的輕抖
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        // 雜物間：結果槽落定的彈跳
        pop: {
          "0%": { transform: "scale(0.9)" },
          "55%": { transform: "scale(1.06)" },
          "100%": { transform: "scale(1)" },
        },
        // 雜物間：送出成功的淡入上浮
        fadeUp: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        spin: "spin 1s linear infinite",
        shake: "shake 0.3s ease-in-out",
        pop: "pop 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        fadeUp: "fadeUp 0.3s ease-out both",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
