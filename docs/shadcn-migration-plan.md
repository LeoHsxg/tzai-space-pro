# MUI → shadcn/ui 遷移計畫

## 前提

- shadcn/ui 安裝需要 CLI，**須在本機執行**
- Calendar 的 `DateCalendar` 由開發者自行重做，不在本計畫範圍內
- UIContext 本身不需要動，只替換 GlobalUI 內的 MUI render

---

## 安裝步驟（本機執行）

```bash
# 1. 初始化 shadcn（選 New York style、Tailwind、TypeScript）
npx shadcn@latest init

# 2. 安裝本計畫需要的元件
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add alert
npx shadcn@latest add sonner        # toast / snackbar 替代方案（推薦）
```

> **注意**：`output: 'export'` 不影響 shadcn，因為 shadcn 是純 client 元件。

---

## 遷移對照表

### `@mui/material` → shadcn

| MUI 元件 | shadcn 替代 | 使用檔案 | 難度 |
|----------|------------|---------|------|
| `Button` | `<Button>` from `@/components/ui/button` | ApplyForm, MyDialog, PopupTest, Test | ⭐ |
| `Dialog` 系列 | `<Dialog>`, `<DialogHeader>`, `<DialogContent>`, `<DialogFooter>` | MyDialog, GlobalUI, PopupTest | ⭐⭐ |
| `Snackbar` + `Alert` | `sonner` toast | GlobalUI, NavLinks | ⭐⭐ |
| `CircularProgress` | 自訂（Tailwind `animate-spin`）或 shadcn skeleton | GlobalUI, Calendar | ⭐ |
| `TextField` | `<Input>` | ApplyForm | ⭐ |
| `Select` + `MenuItem` | `<Select>`, `<SelectItem>` | ApplyForm | ⭐⭐ |
| `Box` | 直接用 `<div>` / Tailwind | ApplyForm, Test | ⭐ |
| `Typography` | 直接用 `<p>`, `<h1>` / Tailwind | Test | ⭐ |

### `@mui/x-date-pickers` → **暫緩**

| MUI 元件 | 狀態 |
|----------|------|
| `DateTimePicker` in ApplyForm | 暫時保留，待日後評估（候選：react-day-picker + time input） |
| `DateCalendar` in Calendar | 由開發者自行重做，不在本計畫範圍 |
| `LocalizationProvider` + `AdapterDayjs` | 隨日期元件一起處理 |

---

## 逐步執行順序（建議）

### Phase 1：替換基礎元件（影響最小）
1. `Button`：全域搜尋替換，無邏輯變動
2. `Box` → `<div>`、`Typography` → `<p>/<h2>`（Test.tsx 為主）
3. `CircularProgress` → Tailwind `animate-spin`

### Phase 2：替換 Snackbar / Toast
1. 安裝 `sonner`，在 `AppShell` 加入 `<Toaster />`
2. 替換 `GlobalUI` 的 Snackbar + Alert
3. 替換 `NavLinks` 裡的獨立 local Snackbar
4. 更新 UIContext 的 `showSnackbar` / `hideSnackbar` 改呼叫 sonner API

   > **提醒**：sonner 有自己的 API（`toast.success()`），可評估是否簡化掉 UIContext 的 snackbar 狀態，直接在 call site 呼叫 `toast()`。

### Phase 3：替換 Dialog
1. 替換 `GlobalUI` 的 loading Dialog
2. 替換 `MyDialog`
3. 替換 `PopupTest`（測試頁，優先級低）

### Phase 4：替換表單元件
1. `Input` 替換 `TextField`（ApplyForm）
2. `Select` / `SelectItem` 替換 `FormControl` + `Select` + `MenuItem`（ApplyForm）

### Phase 5：清理
- 移除 `@mui/material` 與不再需要的 `@emotion` 相依
- 若日期元件已全部替換，移除 `@mui/x-date-pickers`、`AdapterDayjs`、`LocalizationProvider`

---

## 注意事項

- **不要一次全換**：每個 Phase 換完就 build 一次確認 (`npm run build`)
- `MyDialog` 有呼叫 `useUI()` 和 `/api/delete/` 邏輯，替換時只動 UI 部分，邏輯不要動
- `NavLinks` 的 Snackbar 是 local state，替換後可考慮統一走 UIContext 或 sonner
