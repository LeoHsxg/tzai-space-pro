# 桌面網頁版 — 實作規格

> 這份是「可直接照著做」的桌面版建置規格。高階決策與 backlog 見
> [`desktop-web-redesign.md`](./desktop-web-redesign.md)。
> 線框（可在瀏覽器開）：[`desktop-wireframe.html`](./desktop-wireframe.html)。
> 高保真參考（Figma，同檔案「桌面版 Desktop」頁）：
> <https://www.figma.com/design/A30rsogLTluLGBwtDTYtiZ>

## 範圍與原則

- 桌面版**打掉重做**，不沿用現行桌面 RWD 的數值；下方 token 為新的事實來源。
- 本輪四個畫面：**日曆首頁、申請借用、空間守則、個人檔案**（不含個人檔案的照片相關功能——照片牆／上傳已移除）。
- **只做桌面（`lg:` 以上，≥1024px）版面**；行動版維持現狀，這輪不動。用 Tailwind 的 `lg:` 前綴疊加桌面樣式，不要破壞既有手機版。
- 資料層一律沿用既有邏輯：Firestore 訂閱、`Booking` 型別、`ROOM_COLORS`、`Rule.tsx` 的 `steps`/`rules`。**不新增寫入路徑**。
- Figma 的「申請借用」畫面因額度未畫；請依本文件 §3.2 與線框自行實作，Claude Code 直接做即可。

## 1. Design Tokens（桌面版，事實來源）

### 色彩
| 用途 | 值 |
| --- | --- |
| 品牌主藍 primary | `#5991C4` |
| primary hover | `#4880B0` |
| primary 選中底（nav/chip/cell/step 圓底） | `#EAF1F8` |
| primary 選中底上的文字 | `#3E6B92` |
| 頁面底色 | `#F3F3F3` |
| 卡片／側欄 底 | `#FFFFFF` |
| 卡片內淡底（日格、次要列） | `#FAFBFC` / 面板列 `#F5F6F8` |
| 分隔線 | `#ECECEC`（側欄右界）／`#F1F1F1`（列間）／`#EEEEEE`（表頭下） |
| 文字 ink（標題） | `#1F2937` |
| 文字 次要 | `#374151` / `#4B5563` |
| 文字 muted | `#6B7280` / `#5B6572` |
| 文字 faint（label/週標/空狀態） | `#9AA0A6` / `#9CA3AF` |
| 日曆外月份字 | `#C7CDD4` |
| 邊框（按鈕/輸入/chip） | `#D9DEE4` / `#DDE1E6` |

**房間色**（沿用現行程式碼 `ROOM_COLORS`，勿改）：
書房 `#E44C4C`、橘廳 `#FF6F0D`、會議室 `#54A0F9`、小導師室 `#FFD81E`、貢丸室 `#9458E2`。

**守則點顏色**（沿用 `Rule.tsx`）：danger `#B85858`、warning `#CF6C35`、neutral `#8A9EAF`。

### 字型
- 中文：**Noto Sans TC**；數字／英文／時間：**Roboto**（沿用現行 `--font-roboto`）。
- 級距（px）：頁標題 23 bold｜卡片/區塊標題 15–16 bold｜內文 13.5–14｜caption/label 12–13｜日期數字 14｜週標 13。

### 版面
- 側欄固定寬 **240**，白底，右側 `1px #ECECEC`，全高。
- 主內容 padding 32–40。
- 卡片圓角 **16**；輸入框/按鈕圓角 8–10–11；chip/pill 圓角 999；nav item 圓角 10。
- 陰影：卡片 `0 2px 10px rgba(0,0,0,.04)`；modal `0 24px 60px rgba(0,0,0,.4)`；scrim `rgba(10,15,20,.5)`。

## 2. 共用結構

### 側欄 `<Sidebar active>`（常駐，日曆/守則/個人檔案共用）
由上到下：tzai logo → nav（`借用日曆`、`空間守則`，各含 20px 線性 icon）→ 主按鈕 `＋ 申請借用`（primary 實心，開申請 modal）→ 彈性空白 → 使用者卡（頭像＋姓名／信箱，點擊進個人檔案）→ `通知　登出` 一列。
- active 樣式：對應 nav item（或使用者卡）套 `#EAF1F8` 底 + primary 文字/icon。
- `active` 取值：`cal` | `rule` | `user`。個人檔案**不佔 nav**，靠使用者卡進入。

## 3. 各畫面規格

### 3.1 日曆首頁（`/`，active=cal）
主區＝標題列 + 雙欄。
- 標題列：左 `借用日曆`（23 bold）；右 房間色圖例（5 個「圓點＋名稱」）。
- 雙欄（`gap 24`）：**月曆卡（FILL）** + **當日詳情面板（固定 400，高度與月曆卡齊）**。
  - 月曆卡：header（`March 2026` 20 bold ＋ 右側 `今天`＋`‹ ›`）｜週標列 `日一二三四五六`｜月格 7 欄，日格 `minHeight 84`、圓角 10、底 `#FAFBFC`；日格內：數字（左上）＋房間色點（`slice(0,5)`）。選中日：底 `#EAF1F8`＋邊框 primary、數字 primary bold。
  - 當日詳情面板：header（`3 月 29 日（六）· 今日`＋`共 N 筆預約`＋篩選 chips `全部/書房/橘廳…`）｜預約列（圓點＋`HH:mm → HH:mm`＋房間名，底 `#F5F6F8`、圓角 10）｜底部虛線按鈕 `＋ 於 {日期} 申請借用`。
  - 點日曆某天 → 右欄換該天資料；房間 chip 可過濾。

### 3.2 申請借用（modal，over 日曆）※Figma 未畫，照此做
以 shadcn `Dialog` 置中，背景 scrim 變暗。寬約 640，圓角 18。
- header：`申請借用` + 關閉 X。
- 表單**雙欄**（`gap 16`）：`[姓名][手機] / [人數][借用地點▾] / [開始時間📅][結束時間📅]`，`活動簡述` 獨佔整列（較高）。欄位沿用現行 `ApplyForm` 的狀態與驗證（`validateData`、`POST /api/bookings`）。
- footer：左 同意條款 checkbox；右 `[取消][確認送出]`（送出 primary）。
- 從側欄 `＋ 申請借用` 或當日面板 `＋ 於 {日期} 申請借用` 開啟；後者自動帶入該日期。

### 3.3 空間守則（`/rule`，active=rule）
限制閱讀寬度、置於側欄右方。
- `借用流程` 卡：標題 + **橫向三步**（`steps`），每步：序號圓底（primary-soft）＋標題＋描述，步間細直線分隔。
- 雙欄：左 `使用守則` 卡（較寬，`rules` 逐條：色點＋文字，含粗體重點）＋ 右 `其他補充事項` 卡（展開，段落，信箱 primary 連結）。
- 底部置中免責聲明。
- 內容以現行 `Rule.tsx` 為準（3 條守則、無照片相關條文）。

### 3.4 個人檔案（`/profile`，active=user）
- 頭像卡：深色頭像（`#46586B`＋白字首字）＋姓名（18 bold）／信箱。
- `即將到來` 卡：區塊標題（primary 點＋標題＋計數）＋空狀態。
- `歷史紀錄` 卡：標題列（灰點＋`歷史紀錄`＋計數＋右側空間篩選 chips）＋**表格**（欄：`空間`／`借用時間`／`狀態`，狀態用 pill 靠右）＋底部 `載入更多 · 共 N 筆`。
- **無照片欄位**（照片功能已移除）。

## 4. 元件清單（建議拆分）
`Sidebar`、`RoomLegend`、`MonthCalendar`（桌面版大格）、`DayDetailPanel`、`ApplyDialog`（桌面 modal，包 `ApplyForm` 雙欄版）、`RulesFlow`、`RulesList`、`SupplementaryCard`、`ProfileHeader`、`UpcomingSection`、`HistoryTable`。盡量沿用既有資料 hook 與 `Booking` 型別。

## 5. 驗收
- 桌面（≥1024）四畫面版面與線框一致；行動版不受影響。
- 完成前跑：`npm run lint && npx tsc --noEmit && npm test`。

## 6. Claude Code（VSCode）實作 Prompt

見專案根 README 或直接使用對話中提供的版本；prompt 亦複製於下方以便查閱：

```
你在 tzai-space-pro（Next.js 15 App Router + Tailwind + shadcn/ui）。
請實作「桌面網頁版重新設計」，規格見 docs/desktop-web-implementation-spec.md，
線框見 docs/desktop-wireframe.html（可用瀏覽器打開對照）。

要求：
1. 只做桌面版（lg: ≥1024），用 Tailwind lg: 前綴疊加，不要改動或破壞既有手機版。
2. 依規格的 design tokens（色彩/字型/圓角/間距）落實，房間色與守則色沿用現行程式碼常數，勿改。
3. 導入常駐左側欄（借用日曆／空間守則 導覽＋「＋申請借用」主按鈕＋底部使用者卡→個人檔案）。
4. 日曆首頁＝月曆＋右側當日詳情面板；點日切換右欄、房間 chip 篩選。
5. 申請借用改為置中 Dialog（shadcn），沿用現行 ApplyForm 的欄位/驗證/送出，桌面做雙欄版面。
6. 空間守則：借用流程橫向三步＋守則/補充雙欄；內容以 src/views/Rule.tsx 現況為準。
7. 個人檔案：頭像卡＋即將到來＋歷史紀錄「表格」（空間/時間/狀態），無照片欄位。
8. 資料層沿用既有 Firestore 訂閱與 hook，不新增寫入路徑。
9. 先讀 .impeccable.md 遵守設計品味；完成前跑 npm run lint && npx tsc --noEmit && npm test。

先給我簡短實作計畫（拆哪些元件、動哪些檔），我確認後再開始寫。
```
