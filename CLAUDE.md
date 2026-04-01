# CLAUDE.md — tzai-space-pro

## 專案概述

**載物空間借用系統** — 空間預約與借用管理平台。
技術棧：Next.js (App Router) + Firebase (Auth / Firestore / Hosting / Functions) + MUI + shadcn/ui + Tailwind CSS + TypeScript

---

## 開發指令

```bash
npm run dev      # 啟動開發伺服器 (localhost:3000)
npm run build    # 建置至 ./dist (distDir 設定)
npm run lint     # ESLint 檢查
```

### Firebase

```bash
firebase emulators:start          # 啟動本地模擬器（Functions:5001, Firestore:8080, Hosting:5000）
firebase deploy                   # 部署全部（Hosting + Functions + Firestore rules）
firebase deploy --only hosting    # 只部署前端
firebase deploy --only functions  # 只部署 Cloud Functions
```

---

## 架構說明

### Hosting & SSR

`next.config.ts` 已**移除** `output: 'export'`，改用 Firebase App Hosting（`apphosting.yaml`）。
- SSR / Server Components / API Routes **現在可用**
- `distDir: './dist'` 仍保留（建置輸出目錄）
- `firebase.json` 的 `hosting.predeploy` 會在部署前自動執行 `npm run build`

### API 路由（Firebase Hosting Rewrites → Cloud Functions）

前端不使用 Next.js API Routes，API 呼叫透過 Firebase Hosting rewrites 轉發至 Cloud Functions：

| 路徑 | Cloud Function |
|------|----------------|
| `/api/add/**` | `addEventToCalendar` |
| `/api/getAll/**` | `getAllEvents` |
| `/api/get` | `getEventsForMonth` |
| `/api/delete/**` | `deleteEventFromCalendar` |

Cloud Functions 原始碼位於 `functions/` (Node.js 22)。

### App Router 結構

```
src/
├── app/
│   ├── layout.tsx        # 根 layout — 載入字型、Analytics、包 AppShell
│   ├── page.tsx          # 首頁 → 直接 re-export Calendar view
│   ├── apply/page.tsx    # 申請頁
│   ├── rule/page.tsx     # 規則頁
│   └── test/page.tsx     # 測試頁
├── views/                # 各頁面主要 view
│   ├── Calendar.tsx
│   ├── ApplyForm.tsx
│   ├── Rule.tsx
│   └── Test.tsx
├── Components/
│   ├── AppShell.tsx      # 'use client' — 整合所有 Provider + 版型骨架
│   ├── providers.tsx     # 'use client' — Provider 組合（AppShell 的替代，目前並行存在）
│   ├── NavBar.tsx
│   ├── NavLinks.tsx
│   ├── Footer.tsx
│   ├── GlobalUI.tsx      # 全域 Dialog（shadcn/ui），由 UIContext 驅動
│   ├── MyDialog.tsx
│   ├── ConsentCheckbox.tsx
│   ├── Reserve.tsx
│   ├── Ruleblock.tsx
│   ├── SignBt.tsx
│   ├── PopupTest.tsx
│   └── ui/               # shadcn/ui 元件（button, dialog, input, select, sonner）
├── context/
│   ├── AuthContext.tsx   # Google 登入狀態
│   └── UIContext.tsx     # Dialog / Snackbar 狀態（toast 透過 sonner）
├── hooks/
│   └── useAuth.tsx       # useContext(AuthContext) 封裝
├── firebase/
│   └── firebase.ts       # Firebase 初始化、signInWithGoogle、getRegulationsData
├── func/
│   └── applyFunc.ts      # RequestBody 介面 + validateData 驗證邏輯
├── lib/
│   └── utils.ts          # shadcn/ui 的 cn() 工具函式
├── types/
│   └── event.tsx         # Event 型別（對應 Google Calendar 事件格式）
├── styles/               # 各元件獨立 CSS 檔
│   ├── ApplyForm.css
│   ├── Calendar.css
│   ├── ConsentCheckbox.css
│   └── Footer.css
└── declarations.d.ts     # 全域型別宣告
```

---

## Firebase 設定

- **Project ID**: `tzai-space-pro`
- **Auth**: Google Sign-In（`signInWithPopup`）
- **Firestore**: `regulations/current` 文件存放借用規則（Object.values 取陣列）
- **Functions**: `functions/index.js` (Node.js 22 runtime)
- **環境變數**: `.env.local`，必要的 key：`NEXT_PUBLIC_API_KEY`

### Firestore Collections

| Collection | 說明 |
|------------|------|
| `regulations` | 借用規則；`current` 文件，欄位值為規則陣列 |

---

## UI 元件庫

| 用途 | 套件 |
|------|------|
| 日期選擇器 | `@mui/x-date-pickers` + `@emotion/react` |
| shadcn/ui 元件 | `src/Components/ui/`（Dialog、Button、Input、Select、Sonner） |
| Toast 通知 | `sonner`（透過 `UIContext.showSnackbar` 或直接 `toast.*`） |
| 圖示 | `lucide-react` |
| Markdown 渲染 | `marked` |
| 日期處理 | `dayjs` |
| 路徑別名 | `@/` → `src/` |

---

## 編碼規範

- 語言：TypeScript，React functional components
- 樣式：Tailwind CSS 為主；各元件可有獨立 CSS 檔（`src/styles/`）
- `cn()` 來自 `@/lib/utils`，用於合併 Tailwind class
- 所有互動元件需標記 `'use client'`

---

## 已知狀況

- `AppShell` 與 `providers.tsx` 功能重疊（均包含 AuthProvider + UIProvider + LocalizationProvider）
- `GlobalUI` 使用 shadcn/ui Dialog，不再使用 MUI Dialog
- `UIContext.showSnackbar` 實際上呼叫 `sonner` 的 `toast`，`snackbar` state 本身已無實際作用
- `firebase.ts` 的 `signInWithGoogle` 仍有 `console.log` 輸出 email（非 PII log，但需注意）
- Safari 的 `signInWithPopup` 可能有相容性問題（見 `firebase.ts` 註解）
- `layout.tsx` 內嵌 Google Analytics（G-J5G385BD56）與 Microsoft Clarity（qwd03n8te1）

---

## 申請驗證規則（applyFunc.ts）

- 電話：純數字、長度 10
- 人數：正整數
- 姓名：最長 30 字
- 活動描述：最長 100 字
- 預訂時間：只能預訂未來 31 天內
- 使用時長：最多 4 小時
