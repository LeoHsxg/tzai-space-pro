# Next.js 遷移設計文件

**日期：** 2026-03-29
**專案：** tzai-space-pro（載物空間借用系統）
**目標：** 將 React + Vite 專案重構為完整的 Next.js App Router 架構

---

## 背景與約束

- **部署目標：** Firebase Hosting（維持靜態輸出）
- **渲染模式：** `output: "export"`（純靜態，無 SSR）
- **UI 套件：** 維持現有 MUI + Emotion（後續再替換）
- **未來方向：** 結構穩定後再逐步轉 Server Components、替換 UI 套件

---

## 現況

| 項目 | 狀態 |
|------|------|
| `src/app/layout.tsx` | 已完成（字體、metadata、Script） |
| `src/app/[[...slug]]/` | 臨時 SPA 包裝，需移除 |
| `src/App.tsx` | Vite 進入點，需移除 |
| `src/main.tsx` | Vite 進入點，需移除 |
| `index.html` | Vite HTML 模板，需移除 |
| `vite.config.js` | Vite 設定，需移除 |
| 路由 | 由 `react-router-dom` 管理，需移除 |

---

## 目標目錄結構

```
tzai-space-pro/
├── next.config.ts          （保留，output: "export"）
├── tailwind.config.js      （保留）
├── postcss.config.js       （保留）
├── tsconfig.json           （調整 baseUrl / paths）
├── public/                 （靜態資源）
│
└── src/
    ├── app/
    │   ├── layout.tsx              （補上 Providers wrapper）
    │   ├── page.tsx                （首頁 → Calendar）
    │   ├── apply/
    │   │   └── page.tsx            （→ ApplyForm）
    │   ├── rule/
    │   │   └── page.tsx            （→ Rule）
    │   └── test/
    │       └── page.tsx            （→ Test）
    │
    ├── components/                 （原 Components/，統一小寫）
    │   ├── providers.tsx           （新增：集中所有 Context Provider）
    │   ├── NavBar.tsx
    │   ├── Footer.tsx
    │   ├── GlobalUI.tsx
    │   └── ...
    │
    ├── context/                    （不動）
    ├── firebase/                   （不動）
    ├── hooks/                      （不動）
    ├── types/                      （不動）
    └── styles/                     （App.css 移至此）
```

---

## 關鍵技術處理

### 1. MUI + Emotion Cache

MUI 使用 Emotion 做 CSS-in-JS，需在 client 端初始化。

**解法：** 新增 `src/components/providers.tsx`，標記 `'use client'`：

```tsx
'use client'
import { AuthProvider } from '@/context/AuthContext'
import { UIProvider } from '@/context/UIContext'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UIProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          {children}
        </LocalizationProvider>
      </UIProvider>
    </AuthProvider>
  )
}
```

`layout.tsx` 引入 `<Providers>` 並保持 Server Component。

### 2. `'use client'` 指令

以下所有檔案需加上 `'use client'`：
- 所有 `app/*/page.tsx`
- 所有 `components/*.tsx`（有互動邏輯者）
- 所有 `context/*.tsx`

理由：使用了 `useState`、`useEffect`、Firebase SDK、MUI 元件。

### 3. 路由導航替換

移除 `react-router-dom`，替換為 Next.js 原生導航：

| 替換前 | 替換後 |
|--------|--------|
| `import { Link } from 'react-router-dom'` | `import Link from 'next/link'` |
| `<Link to="/apply">` | `<Link href="/apply">` |
| `useNavigate()` | `useRouter()` from `next/navigation` |
| `useLocation()` | `usePathname()` from `next/navigation` |

### 4. `tsconfig.json` 調整

新增 path alias 以使用 `@/` 前綴：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 要刪除的檔案

- `src/App.tsx`
- `src/main.tsx`
- `index.html`
- `vite.config.js`
- `src/app/[[...slug]]/`（整個資料夾）

---

## 要保留的設定

- `next.config.ts`（output: "export", distDir: "./dist"）
- `firebase.json`
- `firestore.rules`
- `tailwind.config.js`
- `postcss.config.js`

---

## 不在此次範圍

- UI 套件替換（MUI → 其他）
- Server Components 轉換
- Firebase Functions 調整
