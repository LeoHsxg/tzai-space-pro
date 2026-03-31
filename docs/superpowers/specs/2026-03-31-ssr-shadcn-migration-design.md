# SSR + shadcn/ui 遷移設計文件

**日期：** 2026-03-31
**專案：** tzai-space-pro（載物空間借用系統）
**目標：** 移除靜態輸出限制、啟用 SSR、部署至 Firebase App Hosting；同步將 MUI 元件替換為 shadcn/ui

---

## 背景與決策

- 目前 `output: 'export'` 限制了 API Routes 與 SSR 能力，所有 API 必須繞路至外部 Cloud Functions
- 部署目標改為 **Firebase App Hosting**（官方 SSR 支援，基於 Cloud Run）
- UI 套件從 MUI 遷移至 shadcn/ui，減少 bundle size 並統一樣式系統
- Calendar 的 `DateCalendar` 與 ApplyForm 的 `DateTimePicker` 不在本次範圍，`@mui/x-date-pickers` 暫時保留

---

## Part 1：SSR 架構調整

### 1. next.config.ts

移除 `output: 'export'`，保留 `distDir: './dist'`：

```ts
const nextConfig: NextConfig = {
  distDir: './dist',
}
```

### 2. Page 檔案重構

三個 page 目前都使用 `dynamic(..., { ssr: false })` 繞過 SSR。移除後直接 import view 元件（view 元件本身標有 `'use client'`，Next.js 會正確處理）：

```tsx
// src/app/apply/page.tsx
import ApplyForm from '../../views/ApplyForm'
export default ApplyForm

// src/app/rule/page.tsx
import Rule from '../../views/Rule'
export default Rule

// src/app/page.tsx
import Calendar from '../views/Calendar'
export default Calendar
```

### 3. Firebase App Hosting 設定

新增 `apphosting.yaml`（最小設定）：

```yaml
runConfig:
  minInstances: 0
```

Region、環境變數等透過 Firebase Console 設定，不寫入 repo。

### 4. AppShell 不做結構性拆解

`AppShell` 目前包含 Providers + 版型，整棵 tree 都是 client component。這對本專案是合理的（所有頁面都需要 Firebase Auth），不在本次範圍內強制改動。

---

## Part 2：shadcn/ui 替換

### 安裝（本機執行）

```bash
npx shadcn@latest init   # 選 New York style、Tailwind、TypeScript
npx shadcn@latest add button dialog input select sonner
```

### 替換對照表

| 檔案 | 移除 | 替換為 |
|------|------|--------|
| `GlobalUI.tsx` | `Dialog`, `DialogTitle`, `DialogContent`, `CircularProgress` | shadcn `Dialog` 系列、Tailwind `animate-spin` |
| `GlobalUI.tsx` | `Snackbar`, `Alert` | `sonner` toast |
| `NavLinks.tsx` | `Snackbar`, `Alert` (local state) | `sonner` toast |
| `ApplyForm.tsx` | `Button`, `Box`, `TextField`, `Select`, `MenuItem`, `FormControl`, `InputLabel` | shadcn `Button`, `Input`, `Select` 系列；`Box` → `<div>` |
| `MyDialog.tsx` | MUI `Dialog` 系列 | shadcn `Dialog` 系列 |

### 不動的項目

- `DateTimePicker`（ApplyForm）— 待日後評估替代方案
- `DateCalendar`（Calendar）— 由開發者自行重做
- `LocalizationProvider` + `AdapterDayjs` — 隨 date pickers 一起處理

### UIContext Snackbar 調整

`showSnackbar` / `hideSnackbar` 內部改成呼叫 sonner API（`toast.success()` 等），對外 interface 不變，所有 call site 無需修改。

`AppShell` 加入 `<Toaster />` 一次掛載。

### 清理

換完後移除：
- `@mui/material`
- `@emotion/react`
- `@emotion/styled`
- `@mui/styled-engine-sc`

保留：
- `@mui/x-date-pickers`（date pickers 未替換前繼續需要）

---

## 執行順序

1. 移除 `output: 'export'`，驗證 `npm run build` 正常
2. 移除三個 page 的 `dynamic({ ssr: false })`，再次驗證 build
3. 新增 `apphosting.yaml`
4. 初始化 shadcn，安裝元件
5. Phase 1：替換 `Button`、`Box → div`、`CircularProgress → animate-spin`
6. Phase 2：替換 Snackbar → sonner（GlobalUI + NavLinks + UIContext）
7. Phase 3：替換 Dialog（GlobalUI + MyDialog）
8. Phase 4：替換表單元件（ApplyForm 的 TextField + Select）
9. 移除 MUI / Emotion 相依套件
10. 驗證完整 build 與功能測試

---

## 不在本次範圍

- Server Components 轉換（Rule、NavBar 等）
- DateTimePicker 替換
- Calendar 重做
- Firebase App Hosting 實際 deploy 設定（透過 Console 操作）
