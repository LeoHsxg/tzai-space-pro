# CLAUDE.md — tzai-space-pro

## 專案概述

**載物空間借用系統** — 空間預約與借用管理平台。
技術棧：Next.js (App Router) + Firebase (Auth / Firestore) + MUI + Tailwind CSS + TypeScript

---

## 重要架構說明

### Static Export（目前限制）
`next.config.ts` 設定 `output: 'export'`，代表：
- **不支援 SSR / Server Components / API Routes**
- 整個專案為 SPA，全部在 client 端渲染
- 若要啟用 SSR，需移除 `output: 'export'` 設定

### App Router 結構
```
src/
├── app/                  # Next.js App Router 頁面
│   ├── layout.tsx        # 根 layout（無 'use client'，但包含 AppShell）
│   ├── page.tsx          # 首頁 → 動態載入 Calendar view
│   ├── apply/page.tsx    # 申請頁
│   ├── rule/page.tsx     # 規則頁
│   └── test/page.tsx     # 測試頁
├── views/                # 各頁面對應的主要 view 元件
│   ├── Calendar.tsx
│   ├── ApplyForm.tsx
│   └── Rule.tsx
├── Components/           # 共用 UI 元件
│   ├── AppShell.tsx      # 'use client' — 包含 Provider 與整體版型
│   ├── NavBar.tsx
│   ├── Footer.tsx
│   └── GlobalUI.tsx
├── context/              # React Context
│   ├── AuthContext.tsx   # 登入狀態
│   └── UIContext.tsx     # UI 狀態（dialog 等）
├── hooks/
│   └── useAuth.tsx       # useContext(AuthContext) 的封裝
├── firebase/
│   └── firebase.ts       # Firebase 初始化、Google 登入、Firestore 讀取
├── func/
│   └── applyFunc.ts      # 借用申請相關邏輯
└── types/
    └── event.tsx          # 型別定義
```

---

## 開發指令

```bash
npm run dev      # 啟動開發伺服器 (localhost:3000)
npm run build    # 靜態匯出至 ./dist
npm run lint     # ESLint 檢查
npm run start    # 啟動 production server
```

---

## Firebase 設定

- **Project ID**: `tzai-space-pro`
- **Auth**: Google Sign-In（`signInWithPopup`）
- **Firestore**: 主要 collection — `regulations`（借用規則）
- **Functions**: `functions/handleEvent.js`
- API Key 等敏感設定存放於 `.env.local`（`NEXT_PUBLIC_API_KEY`）

---

## 已知問題與待辦

- `AppShell` 標記為 `'use client'`，導致整棵 component tree 都是 client 端渲染
- `app/page.tsx` 使用 `dynamic(..., { ssr: false })`，明確關閉 SSR
- 若未來移除 `output: 'export'`，需重新評估哪些元件可改為 Server Component

---

## 編碼規範

- 語言：TypeScript，React functional components
- 樣式：Tailwind CSS 為主，部分頁面有獨立 CSS 檔（`src/styles/`）
- UI 元件庫：MUI v6（含 `@mui/x-date-pickers`）
- 日期處理：`dayjs`
- 路徑別名：`@/` 對應 `src/`
