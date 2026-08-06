# 雜物間（/storeroom）計劃檔

> 2026-08-06 由 Claude Fable 5 與使用者共同定案。設計 brief 原文與線框（zawujian-wireframe.html）
> 在使用者手上；本檔記錄拍板後的規格，實作以本檔為準。
> 基準 branch：`storeroom-design`（= main @ 60cee3d，含 PR #16 桌面版改版；
> 舊 branch 的留言板功能不在此線上，brief 內提及留言板處以本線現況為準）。

## 定位

宿舍的「人味角落」，一頁兩張白卡：① 午餐晚餐亂數器 ② 意見箱。
不放頁面大標題；視覺一律依 `.impeccable.md`（三色、白卡 rounded-2xl、Threads 節奏、反模板）。

## 已拍板的決定（2026-08-06）

1. **結果槽維持安靜灰底**：原提案「顏色是抽出來的」（落定時亮起藍/橘/黃淡底）實作後
   使用者目視否決（2026-08-06）——淡色底在整體畫面上反而突兀，文字跑動＋落定彈跳已足夠。
   三格全程 `bg-gray-100`，只有文字有動畫。
2. **匿名功能整個移除**：意見箱沒有匿名勾選框；欄位只剩 載物幾家、姓名、類型、想說的話。
   後端一律記錄登入者 email。
3. **路由 `/storeroom`**；手機導覽列最左（原 ℹ️ 施工中 toast 那格）接到本頁，icon 暫用
   `info_h/info_s.svg`（使用者之後自訂，慣例是抓 Google Material icon 回來自己調色）。
   導覽入口共三處：NavLinks 手機塊（Footer 掛載）、NavLinks 桌面塊（md–lg 平板）、
   `Components/desktop/Sidebar.tsx` 的 NAV_ITEMS（lg+，lucide icon 暫用 Boxes）。

## 功能規格

### 亂數器

- 三維度固定順序：風格（台式/日式/韓式/美式）、蛋白（牛/豬/雞/羊鵝鴨/素食）、主食（麵/飯/速食/小吃）
- 均勻亂數、永不加權、不檢查組合合理性；輸出是三顆獨立標籤，不拼句子
- 篩選面板預設收合、選項預設全開；排除態＝虛線框＋刪除線＋變淡；
  某維度只剩最後一個選項時不可排除（整組輕抖提示）
- 主按鈕「抽一波」→ 抽過後「再抽」；抽時三槽快速跑動，由左至右錯開落定（slot machine 感）；
  `prefers-reduced-motion` 時不跑動直接顯示結果
- 純 client 功能，不需登入、不碰後端

### 意見箱

- 文案一字不改：
  - 內文：`如果遇到系統有 bug、有想要的新功能、覺得 UI/UX 有哪裡可以改進，歡迎在這裡留言。`
  - 附註（左細線 note）：`啊如果是載物相關的問題請上齋版聯繫齋團隊，管理員僅負責系統層面的維護！`
- 欄位：載物幾家（下拉，一家～十四家，選填）、姓名（選填）、類型（單選 chip：Bug/許願/UI/UX/其他）、
  想說的話（必填，上限 1000 字）
- 防呆：想說的話空白、類型未選 → 擋下＋溫暖提示；未登入 → 表單區顯示請先登入
- 成功 → 卡片內容換成暖確認（「收到了，謝謝你花時間 🙌」＋「我會看到的」）＋安靜的「再寫一則」連結
- 錯誤 → showSnackbar

### 資料與 API

- `POST /api/feedback`（Admin SDK，寫法沿用 `/api/announcements` 的 verifyToken）
- Firestore collection `feedback`：`{ category, message, jia|null, name|null, email, createdAt }`
- **不需動 `firestore.rules`**：末尾 default-deny 已涵蓋 `feedback`（client 禁讀寫），
  Admin SDK 繞過 rules；管理員先在 Firebase console 讀，本階段不做通知

## 檔案清單

| 檔案 | 動作 |
| --- | --- |
| `src/app/storeroom/page.tsx` | 新增（re-export view，沿用 rule 模式） |
| `src/views/Storeroom.tsx` | 新增（頁面主體，'use client'） |
| `tailwind.config.js` | 補 shake / pop / fadeUp keyframes（config 是本專案 keyframes 的慣例位置） |
| `src/Components/NavLinks.tsx` | 修改（手機 ℹ️ → Link；平板塊補入口；移除施工中 toast） |
| `src/Components/desktop/Sidebar.tsx` | 修改（NAV_ITEMS 補雜物間） |
| `src/app/api/feedback/route.ts` | 新增（POST only） |
| `CLAUDE.md` | API Routes 清單補 `/api/feedback` |

## 驗收

- `npm run lint && npx tsc --noEmit && npm test` 全過
- verifier agent 獨立複驗＋read-back
- 自審：像不像 shadcn 預設 / SaaS landing？像就重做
- 視覺實測需要 `.env.local`（本機沒有）——由使用者跑 dev 看效果，顏色時刻可再調

## 狀態

- [x] 設計方向拍板（2026-08-06）
- [x] 實作（commit 5ee5b15 頁面與導覽、543ddf5 API）
- [x] 驗證與 verifier 驗收（2026-08-06，lint/tsc/test 全過；verifier 10/10 PASS，
      401 分支 curl 實測，400 分支與成功寫入為避免污染 production 僅程式碼審閱）
- [x] 使用者本機目視確認與多輪微調（2026-08-06）：結果槽改回灰底、欄位順序改為
      類型在前、載物下拉改用 `ui/select`、textarea 隨內容長高、placeholder 統一
      `black/25`、CJK 視覺置中補償（欄位 1px、結果槽 2px）
- [ ] 手機導覽 icon 由使用者自訂替換（現為 `info_h/info_s.svg` 佔位；
      建議 Material Symbols 的 `home_storage`，outline 存 `storeroom_h.svg`、
      filled 存 `storeroom_s.svg`，改 `NavLinks.tsx` 的路徑即可）

## 順帶修掉的既有 bug（同一 PR）

手機版申請抽屜（`Calendar.tsx` 的 `z-[9999]`／遮罩 `z-[9998]`，portal 到 body）
會蓋住同樣 portal 到 body 的彈出層：`ui/select` 定位層原為 `z-50`、MUI 浮層預設 1300，
導致日期與地點選單被蓋住且點擊被遮罩吃掉。兩者拉到 `z-10000`；MUI 同時指定
`popper`（指標裝置）與 `dialog`（觸控裝置）兩種 slot。桌面版不受影響——它的 dialog
只有 `z-50`，且早已用 `popper.container` 把浮層塞進 dialog 內部。
