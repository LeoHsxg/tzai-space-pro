# Rule Page Redesign

**日期：** 2026-04-14  
**檔案：** `src/views/Rule.tsx`  
**依據內容：** `docs/new-borrowing-regulations.md`

---

## 設計目標

將舊版的「一條規則一個白色卡片」扁平列表，改為分段式卡片版型，提升資訊層次感與可讀性。版面以 wireframe 截圖為方向參考，不是逐像素還原。

---

## 版面結構

```
┌─────────────────────────────────┐
│  借用流程                        │  白色卡片，rounded-2xl
│  ① 預約申請  ─────────────────  │
│  ② 準時到達  ─────────────────  │
│  ③ 環境復原  ─────────────────  │
│  ④ 上傳照片  ─────────────────  │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  空間使用守則                    │  白色卡片
│  🟡 ! ────────────────────────  │
│  🔴 × ────────────────────────  │
│  🔴 × ────────────────────────  │
│  ⚪ ? ────────────────────────  │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  其他補充事項              ▼    │  可收合，預設收起
│  （展開後顯示補充條款）          │
└─────────────────────────────────┘

  借用或使用任何仁齋公共空間...       footer 小字
```

---

## 設計規格

### 色票

| 用途 | 顏色 | Tailwind / Hex |
|------|------|----------------|
| 步驟號碼徽章背景 | 藍色 | `bg-[#0284C7]` |
| `!` 警告徽章 | 琥珀 | `bg-[#D97706]` |
| `×` 禁止徽章 | 紅色 | `bg-[#DC2626]` |
| `?` 聯絡徽章 | 灰藍 | `bg-[#64748B]` |
| 卡片背景 | 白色 | `bg-white` |
| 頁面背景 | 淺灰 | `#f0f0f0`（全域已設定）|
| 分隔線 | 淡灰 | `border-gray-100` |

### 字型

使用專案已有的 `--font-noto-sans-tc` CSS 變數（Next.js Google Font 注入）。

| 層級 | 規格 |
|------|------|
| 卡片標題 | `font-bold text-base text-gray-800` |
| 步驟標題 | `font-semibold text-sm text-gray-800` |
| 步驟說明 / 守則內文 | `text-sm text-gray-500 / text-gray-600` |
| 補充事項 | `text-sm text-gray-500` |
| Footer 免責聲明 | `text-xs text-gray-400` |

### 間距

- 外層容器：`px-4 py-6`，桌機：`md:max-w-lg md:mx-auto md:py-8`
- 各 section 間距：`gap-4`
- 卡片內 padding：`px-5 pt-5 pb-4`
- 各項目 vertical padding：`py-3.5`
- 分隔線縮排：`ml-11`（步驟）/ `ml-10`（守則），與文字對齊，不從徽章起始

### 動畫

`其他補充事項` 的展開/收合使用 `grid-template-rows: 0fr → 1fr` transition，  
**不 animate `height`**（避免 layout thrash，符合 motion-design 指引）。

```css
/* 等效的 Tailwind inline style 寫法 */
grid-template-rows: 0fr;  /* 收起 */
grid-template-rows: 1fr;  /* 展開 */
transition: grid-template-rows 300ms cubic-bezier(0.65, 0, 0.35, 1);
```

子層需設 `overflow-hidden min-h-0` 才能讓 grid row 壓縮生效。

---

## 元件結構

```
Rule (useState: expanded)
├── Section 1 Card
│   └── steps.map → Fragment
│       ├── flex row: StepBadge + div(title, desc)
│       └── (divider, ml-11)
├── Section 2 Card
│   └── rules.map → Fragment
│       ├── flex row: IconBadge + p(text / JSX)
│       └── (divider, ml-10)
├── Section 3 Card (collapsible)
│   ├── <button> 標題列 + ChevronDown (rotates on expand)
│   └── grid accordion wrapper
│       └── 3 × <p> 補充條款（含 mailto: 連結）
└── <p> Footer disclaimer
```

---

## 移除的舊邏輯

- 移除 `getRegulationsData` import 與 `fetchRules` 函式（Firestore 遠端規則功能已停用）
- 移除 `Ruleblock` component import
- 移除舊 `ruleItems` 字串陣列

> 若日後需要重新從 Firestore 動態拉規則，需重新設計資料結構以符合新的分段格式（流程步驟 vs 守則 vs 補充）。

---

## 已知限制

- `grid-template-rows` transition 在 Safari 15 以下無動畫效果（但功能正常，只是瞬間展開）。
- 守則中的粗體強調（`<strong>`）直接寫在 JSX，若日後改為 Firestore 動態資料，需評估 Markdown 解析方案。
