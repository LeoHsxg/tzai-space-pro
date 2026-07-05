# 診斷報告：本環境三大失效模式

> 撰於 2026-07-04（Claude Fable 5 評估）。這份文件解釋整套 playbooks 為什麼存在。
> 所有規則都能回溯到這三條失效模式；如果某條規則看起來莫名其妙，先回來讀這裡。
> 依據：本 repo 的 git 歷史、CI 修復紀錄、CLAUDE.md 與程式碼的漂移程度、harness 環境實測。

## 失效模式一（最漏 token）：原始輸出直接倒進主對話

**症狀**：整檔 Read 大檔案、把 build/test log 全文貼進對話、大範圍 `git diff` 不加參數、
重複 Read 已讀過的檔案、Read 到 `node_modules/`、`.next/`、`dist/`。
主對話一膨脹就觸發 context 壓縮，壓縮後又忘記細節而重新探索——**二次浪費**。

**本 repo 的具體地雷**：
- `docs/`（30+ 份歷史計劃書）、`notes/`、`project-docs/`（含 PDF/PPTX）——動輒數百行的背景資料
- Next.js build log 一次數百行；`npm run test:rules` 會啟動 emulator，log 更長
- WebFetch 大頁面：本 harness 會把超大結果自動存檔，但一般指令輸出不會

**修法（可執行，制度化於 dispatch.md）**：
1. Read 大檔（>400 行）前先 Grep 定位，再用 `offset`/`limit` 讀目標區段
2. 「不知道在哪、要掃多檔」的搜尋 → 派 `Explore` agent，主對話只收結論
3. 長指令輸出導檔再取重點：`npm run build > /tmp/build.log 2>&1; tail -30 /tmp/build.log`
   （用 Bash tool；輸出檔放 scratchpad 或 /tmp，不放 repo）
4. 禁 Read 區：`dist/`、`.next/`、`node_modules/`、`functions/node_modules/`、`.git/`、`*.jsonl` transcript
5. 獨立的多個工具呼叫放同一個訊息平行執行（少一輪往返 = 少一次完整 context 重讀）

## 失效模式二（最易失焦）：任務狀態只存在於對話記憶

**症狀**：長任務中途 context 被壓縮後——忘記驗收條件、重做已完成的步驟、
默默改變先前已做的決定、或改去做別的事。多步任務做到一半岔出去修不相關的小問題。

**本 repo 的證據**：`docs/superpowers/` 裡的大型遷移（Next.js 遷移、Firestore 遷移、SSR 遷移）
都是跨多 session 的工程，全靠外部計劃檔案才能接續——這個模式有效，要延續。

**修法（制度化於 judgment.md「完成的定義」與 maintenance.md）**：
1. 任何 ≥3 步的任務，開工前先用 TodoWrite 建清單，**驗收條件寫在 todo 內文**
2. 跨 session 的任務，狀態寫進檔案（`letter.md` 的交接區或 `docs/` 計劃檔）；
   檔案是唯一事實來源，對話記憶不是
3. 被壓縮後的第一個動作：重讀 todo 清單與交接檔，**不要**重新探索 repo
4. 發現自己在做原任務以外的事 → 停，記進 todo 的 pending，回到原任務

## 失效模式三（最易出錯）：環境假設錯誤 ＋ 自我驗證

**症狀 A — Windows shell 假設**：用 Unix 直覺寫 PowerShell 5.1（`&&`、`head`、`echo >` 寫檔）。
PowerShell 5.1 沒有 `&&`；`Out-File`/重導向預設 UTF-16 LE，**會把中文檔案毀成亂碼**。

**症狀 B — 文件當事實**：CLAUDE.md（2026-07-04 重寫前）宣稱 `distDir: './dist'`、
`service_account.json 存在於 repo`——兩者查核後都已不成立。文件會過期，程式碼不會說謊。

**症狀 C — 自我驗證**：改完就宣告完成，沒跑 lint/build/test；或只重讀自己的 diff 當作驗證。
**證據**：git 歷史兩次 CI 翻車修復（`8af0a34` ESLint 相容性、`e143855` Java 21）都是環境假設沒實測的成本。

**修法（制度化於 judgment.md R2/R5 與 dispatch.md「驗證不自驗」）**：
1. 建立或修改**內容檔**（程式碼、文件、任何含中文的檔案）一律用 Read/Write/Edit 工具，
   永不用 shell 重導向產生。例外：用 **Bash tool** 把指令輸出導到暫存 log
   （如失效模式一的 `> /tmp/build.log`）是建議做法——但僅限 Bash tool，
   PowerShell 的 `>` 預設 UTF-16 連 log 都會出亂碼
2. POSIX 語法用 Bash tool；PowerShell 只在需要 Windows 特性（registry、服務）時用
3. 引用任何「文件說的事實」前，先到程式碼裡驗證（Grep 一次很便宜）；衝突時以程式碼為準
4. 宣告完成前必跑：`npm run lint && npx tsc --noEmit && npm test`（在 Bash tool）；
   改到 UI 流程加跑 `/verify`；改到 firestore.rules 加跑 `npm run test:rules`（需 Java 21+）
5. 驗收派 fresh-context agent（`verifier`），寫的人不驗收自己

## 次要風險（不到前三名，但要知道）

- `firebase deploy` 打的是 production（真實使用者、真實預約資料）→ 一律先問使用者
- `firebase.json` 的 hosting 區塊（`public: dist` + predeploy）與空的 `next.config.ts` 不一致：
  classic hosting deploy 視為不可用，正式部署走 App Hosting（`apphosting.yaml`）
- `.claude/settings.local.json` 殘留舊機器路徑（`c:/Users/leosi/...`）與已移除的 firebase MCP plugin 權限——無害但別當作現況
- 根目錄有雜物檔（`README - 複製.md`、`Untitled-1.txt`）——不是規範，別引用
