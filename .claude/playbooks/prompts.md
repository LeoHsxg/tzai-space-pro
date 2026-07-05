# 派工 prompt 模板（prompts.md）

> 用法：選對應模板 → 填【】→ 作為 Agent tool 的 prompt 送出。不要即興刪掉「驗收條件」
> 或「回報格式」段——缺了它們的派工是可預期的失敗（見 dispatch.md 第 2 節）。
> model 選擇見 dispatch.md 第 3 節的表。

---

## 1. 搜尋（agent type: `Explore`，model 不指定）

```text
背景：【一句話：為什麼要找，找到之後要拿來做什麼】
找出：【明確標的。例：所有寫入 bookings collection 的程式碼路徑】
範圍：src/ 與 functions/；排除 dist/、.next/、node_modules/、docs/
搜尋廣度：【medium｜very thorough——不確定就 medium】
回報格式：
- 每個命中一行：「path:line — 一句話說明它在做什麼」
- 最後列「可能相關但不確定」區（可空）
- 找不到就明說找不到，並列出你試過的關鍵字與路徑
- 不要貼大段程式碼
```

## 2. 實作（agent type: `general-purpose`，model: `sonnet`）

```text
目標：【要做什麼】
動機：【為什麼——讓你在邊界情況知道怎麼取捨】
現況：【相關檔案與行號。例：驗證邏輯在 src/func/applyFunc.ts，由 src/app/api/bookings/route.ts 呼叫】
限制：
- 不動這些：【檔案／行為清單】
- 遵守 CLAUDE.md 的環境注意（檔案用工具讀寫、不碰 dist/.next/node_modules）
- 【若涉及 UI：先讀 .impeccable.md，遵守其設計原則】
驗收條件（完成前逐條自查）：
- 【條件1，可客觀檢查。例：npm run lint && npx tsc --noEmit && npm test 全過】
- 【條件2。例：POST /api/bookings 對超過 4 小時的申請回 400】
- git diff 只含本任務需要的變更
回報格式：≤20 行——改了哪些檔（file:line）、跑過哪些驗證與結果、
遺留風險或未處理的邊界情況（沒有也要寫「無」）。
```

## 3. 重構／批次修改（agent type: `general-purpose`；pattern 已驗證用 `haiku`，否則 `sonnet`）

```text
目標：把以下 pattern 套用到指定檔案。
Pattern 說明：【規則描述】
已驗證範例（我改好的第 1 個檔，照這個樣子做）：
【貼上該檔的變更前/後對照或 diff】
目標檔案清單：【明確列出，不要寫「所有相關檔案」】
規則：
- 與範例情況不同、你不確定怎麼套的檔案 → 跳過並記下來，不要猜
- 不改動 pattern 以外的任何東西（包括順手修 lint、調整格式）
驗收條件：npm run lint && npx tsc --noEmit && npm test 全過
回報格式：已改清單（file:line）／跳過清單＋各自原因／驗證指令輸出的關鍵行。
```

## 4. 研究（agent type: `general-purpose`，model: `sonnet`；重大題目改用 /deep-research skill）

```text
問題：【要回答什麼】
我已知：【已確認的事實，避免重查】
這個答案要支撐的決策：【例：要不要把日期處理從 dayjs 換成 date-fns】
來源要求：
- 官方文件優先；每個關鍵結論附 URL 與內容日期
- 關鍵結論需 ≥2 個獨立來源；只有一個來源要標「單一來源」
- 查不到就標「查不到」，禁止用訓練記憶充當查證結果
回報格式：≤30 行，結論先行（直接回答問題），然後才是依據；
長篇比較表寫到【scratchpad 路徑】並回傳檔案路徑。
```

## 5. 審查／驗收（agent type: `verifier`，model 已內建；設計層面的審查改派 `second-opinion`）

```text
受審物：【diff 範圍、檔案清單、或「HEAD 相對於 main 的變更」】
任務背景：【一句話：這個變更要達成什麼】
驗收條件（逐條核對）：
- 【條件1，例：npm test 全過】
- 【條件2，例：src/types/booking.ts 未被修改】
- 【條件3，例：照 .claude/playbooks/dispatch.md 操作不會遇到不存在的工具或參數】
可用驗證指令：npm run lint / npx tsc --noEmit / npm test / npm run test:rules（僅在動到 rules 時）
回報格式：每條驗收條件一行 PASS/FAIL + 證據（file:line 或指令輸出）；
最後一行 VERDICT: PASS 或 VERDICT: FAIL。你的任務是找碴，預設懷疑。
```

---

## 通用附則（適用所有模板）

- 每個 prompt 開頭可以加一句：「你的最終訊息會直接被程式讀取，只回格式要求的內容。」
- 派工後收到回報，若回報缺「未查到／遺留風險」段 → 用 `SendMessage` 追討，不要自己腦補
- 同一個 agent 的後續追問用 `SendMessage`（保留它的 context），不要重派新 agent
