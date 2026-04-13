# Rule Page Redesign

**日期：** 2026-04-14  
**檔案：** `src/views/Rule.tsx`  
**依據：** `docs/new-borrowing-regulations.md`、`.impeccable.md`

---

## 設計目標

將舊版「一條規則一個白色卡片」的扁平列表，改為分段式卡片版型，提升資訊層次與可讀性；同時對齊 `.impeccable.md` 中定義的品牌語言——低飽和暖色調、Threads 節奏感、社群溫度。

---

## 版面結構

```
┌────────────────────────────────┐
│  借用流程                       │  白色卡片
│  ─────────────────────────── │
│  ① ┐ 預約申請                  │
│    │  可預約 30 天…              │
│    │                           │
│  ② ┘ 準時到達                  │  ← 圓形之間有垂直連接線
│    │  超過三十分鐘…              │
│   ...                          │
└────────────────────────────────┘

┌────────────────────────────────┐
│  空間使用守則                   │  白色卡片
│  ─────────────────────────── │
│  🔴 × ─────────────────────  │
│  ─────────────────────────── │
│  🔴 × ─────────────────────  │
│  ─────────────────────────── │
│  🟠 ! ─────────────────────  │
│  ─────────────────────────── │
│  ⚪ ? ─────────────────────  │
└────────────────────────────────┘

┌────────────────────────────────┐
│  其他補充事項              ▼   │  可收合，預設收起
│  （展開後顯示補充條款）         │
└────────────────────────────────┘

  借用或使用任何仁齋公共空間…        footer 小字
```

---

## 設計規格

### 色票

| 用途 | 顏色 | 來源 |
|------|------|------|
| 步驟號碼徽章 | `#5991C4` | 品牌主藍 |
| `×` 禁止徽章 | `#B85858` | 低飽和暖紅 |
| `!` 警告徽章 | `#CF6C35` | 品牌暖橘 |
| `?` 聯絡徽章 | `#8A9EAF` | 霧藍灰 |
| 分隔線 | `bg-gray-100` | Tailwind（以 `h-px` div 實現，繞開 CSS reset 的 `border: 0`）|
| 卡片背景 | `bg-white` | — |
| 頁面背景 | `#F3F3F3` | 全域設定 |

### 徽章規格

| | 步驟號碼 | 守則圖示 |
|---|---|---|
| 尺寸 | `w-6 h-6`（24px）| `w-7 h-7`（28px）|
| 字型 | Roboto（`var(--font-roboto)`）| Noto Sans TC |
| 字號 | `text-[12px]` | `text-xs` |

### 字型

| 層級 | 規格 |
|------|------|
| 卡片標題 | `font-bold text-base text-gray-700` |
| 步驟標題 | `font-semibold text-sm text-gray-800` |
| 步驟說明 / 守則內文 | `text-sm` `text-gray-500` / `text-gray-600`，`leading-relaxed` |
| 補充事項 | `text-sm text-gray-500` |
| Footer | `text-xs text-gray-400` |

---

## Section 1 — Timeline 設計

步驟列表採 **timeline 連接線** 結構（參考 Threads 回覆串），讓「流程」的概念在視覺上成立。

```
flex gap-3
├── 左欄 flex-col items-center
│   ├── 圓形號碼徽章（mt-3）
│   └── w-px 垂直灰線（mt-2.5，最後一項不渲染）
└── 右欄 flex-1
    ├── 步驟標題
    └── 說明文字（mt-1）
```

不使用 divider，連接線本身即節奏。最後一個步驟無連接線，底部 `pb-2`；其餘 `pb-3`。

---

## Section 2 — 守則徽章邏輯

| 徽章 | 語意 | 使用條件 |
|------|------|---------|
| `×`（紅）| 明確禁止事項，違者取消資格 | 防火門規定、不雅照片 |
| `!`（橘）| 提醒注意，行為責任 | 臨時未到場的責任 |
| `?`（灰）| 資訊提供、聯絡指引 | 疑問與爭議處理 |

項目間以 `h-px bg-gray-100` 分隔，最後一項不加。

---

## Section 3 — 手風琴收合

預設收起。展開動畫使用 `grid-template-rows: 0fr → 1fr` transition，不 animate `height`（避免 layout reflow）。子層設 `overflow-hidden min-h-0` 確保壓縮生效。

```
<div style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
     className="grid transition-[grid-template-rows] duration-300 ease-[...]">
  <div className="overflow-hidden min-h-0">
    {/* 內容 */}
  </div>
</div>
```

ChevronDown 圖示在展開時旋轉 180°，transition 同步。

---

## 已知限制

- `grid-template-rows` transition 在 Safari 15 以下無動畫（功能正常，瞬間展開）。
- 守則 `<strong>` 粗體強調直接寫在 JSX。若日後改為 Firestore 動態資料，需評估 Markdown 解析方案。
- `h-px bg-gray-100` 繞開 CSS reset 的 `border: 0` 問題（App.css 的 unlayered reset 優先於 Tailwind `@layer base` 的 `border-style: solid`，導致 `border-t` 類別失效）。
