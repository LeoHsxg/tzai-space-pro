# 模型調度守則（dispatch.md）

> 讀者：主對話的模型（任何等級）。目的：主對話保持乾淨、便宜、聚焦；粗重工作進 subagent 的 context。
> 派工 prompt 模板在 `prompts.md`；何時升級／何時算完成的判準在 `judgment.md`。

## 0. 授權聲明

使用者已於 2026-07-04 明確、長期授權：**符合本檔第 1 節門檻的派工，視同「使用者要求使用 subagent」**。
harness 預設的「不要主動 spawn agent」以此授權為準予以覆蓋。但第 1 節的「不派」門檻同樣具約束力——
把雞毛蒜皮也派出去燒 token，跟自己下場掃 repo 一樣是違規。

## 1. 指揮官不下場：派與不派的門檻

主對話的職責是：拆解、派工、整合、對使用者報告。以下情況**必派**：

| 情況 | 門檻 | 派給 |
| --- | --- | --- |
| 探索性搜尋 | 不確定位置、或預計要看 >3 個檔案 | `Explore` |
| 大量閱讀 | 單檔 >400 行且只需要結論（審查、摘要、找模式） | `Explore` 或 `general-purpose` |
| 網頁研究 | 要看 >1 個頁面 | `general-purpose`；重大題目用 `/deep-research` skill |
| 批次機械修改 | 同一 pattern 改 >5 個檔案 | `general-purpose`（先自己改 1 個檔證明 pattern，再派） |
| 驗收 | 任何要宣告「完成」的非瑣碎變更 | `verifier`（見第 5 節） |
| 高風險判斷 | 設計取捨、安全疑慮、難纏 bug | `second-opinion` |
| harness 問題 | 「Claude Code 能不能…」「這個設定怎麼改」 | `claude-code-guide` |

**不派（自己做）**：已知確切位置的讀寫、≤3 個檔案的小改動、預估 ≤2 個工具呼叫能完成的事、
跟使用者的問答。派工有固定成本（agent 冷啟動、重新讀 repo 背景）——小事派工是淨虧損。

**主對話收 subagent 回報後**：只把結論寫進給使用者的訊息。使用者看不到 subagent 的輸出，
重要內容必須由你轉述。

## 2. 派工三件套（缺一件 = 可預期的失敗）

每個派工 prompt 必含：
1. **目標與動機**——要什麼、為什麼要（動機讓 agent 在邊界情況做對取捨）
2. **驗收條件**——可客觀檢查的清單（能跑指令就寫指令；「做好做滿」不是驗收條件）
3. **回報格式**——結論先行、`file:line` 引用、長度上限、長產物落檔回傳路徑

模板直接抄 `prompts.md`，不要即興發揮。

## 3. 模型與 effort（驗證於 2026-07-04，過期先重驗再引用）

**Agent tool 的 `model` 參數接受**：`haiku`｜`sonnet`｜`opus`｜`fable`。
`fable` 是最高階模型（Mythos 級）、昂貴且未來環境未必開放——**不要主動指定**，
只有使用者明確要求時才用。
不指定 = 繼承主對話模型。**Agent tool 沒有 effort 參數**——不要幻覺出一個。
effort 是 session 層級設定（`~/.claude/settings.json` 的 `effortLevel`），由使用者控制。

| 任務型態 | agent type | model |
| --- | --- | --- |
| 找檔案／找定義／掃使用處 | `Explore` | 不指定 |
| 一般實作、修 bug、寫測試 | `general-purpose` | `sonnet` |
| 批次套用**已驗證**的 pattern | `general-purpose` | `haiku` |
| 設計取捨、第二意見、對抗審查 | `second-opinion`（或 `general-purpose`） | `opus` |
| 驗收 | `verifier` | 定義檔內建 `sonnet` |
| 大任務規劃 | `Plan` | `opus`；中小任務 `sonnet` |
| Claude Code / API 問題 | `claude-code-guide` | 不指定 |

其他可用機制：`run_in_background: true`（不急的工作）；`SendMessage` 可延續既有 agent 的 context
（追問時用它，不要重派新 agent 重講一遍背景）；`isolation: "worktree"` 只在**多個 agent 平行改檔**時用。
`Workflow` tool 只有使用者明說（例如「ultracode」「跑 workflow」）才能用。

## 4. 升降級路徑

- **haiku 同一子任務錯 1 次** → 改派 `sonnet`，prompt 附上 haiku 的錯誤輸出
- **sonnet 同一子任務連錯 2 次** → 改派 `opus`，prompt 附完整失敗軌跡：
  做了什麼、錯誤訊息全文、已排除的假設。沒有軌跡的升級等於重新猜一次
- **opus 也失敗** → 停手。向使用者報告軌跡 + 2 條候選方向，讓使用者選
- **同一方法最多重試 2 輪**；重試前必須改變至少一個變因（換輸入、換做法、加資訊），
  原樣重跑不算重試，算浪費
- **降級**：opus/sonnet 解出的 pattern（一種修法、一個 codemod）→ 寫成逐步指令後
  派 `haiku`/`sonnet` 批次套用，完成後抽查約 20% 的檔案驗證

## 5. 驗證不自驗

原則：**寫的人不驗收自己的產出**。驗收一律派 fresh-context 的 `verifier` agent
（它沒有你的對話偏見，這是刻意設計）。

- **文件／規則檔** → `verifier` 做 read-back：「照這份文件執行，你會卡在哪？」
- **程式碼** → 機器證據優先：`npm run lint && npx tsc --noEmit && npm test`；
  改 `firestore.rules` 跑 `npm run test:rules`。改 UI 流程時，`/verify` skill 由
  **實作者（主對話或實作 agent）在交付前自跑**——`verifier` 沒有 Skill 工具，跑不了它；
  `verifier` 負責複驗 lint/tsc/test 與 read-back。模型的「看起來沒問題」不是證據
- **高風險判斷** → `second-opinion`（opus）獨立分析；或生成 2–3 個獨立方案再派評審選優
- 驗收者回報格式固定：每條驗收條件 `PASS`/`FAIL` + 證據（`file:line` 或指令輸出）＋總判定

## 6. 回報合約（給 subagent 的規格，模板已內建）

- 結論先行，全文 ≤30 行；引用一律 `file:line`
- 長產物（報告、diff、掃描清單）寫到檔案，回傳路徑；不要貼全文
- 必須包含：「沒查到／不確定的部分」清單——空著不寫視同回報不完整
- 找不到 = 明說找不到＋列出已試過的方法。**禁止**編造來滿足格式
