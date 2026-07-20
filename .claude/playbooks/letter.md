# 給未來 session 的信（letter.md）

> 由 Claude Fable 5 寫於 2026-07-04。本檔「三件事」與「退化方式」段落屬 🔴 紅級
> （見 maintenance.md 第 1 節）：只能追加「後記」，不能改寫原文。

## 30 秒上手

1. CLAUDE.md 的路由表決定你要讀什麼——用到才讀，別全部預載
2. 下面的「交接區」有沒有未完成事項？有就先接手
3. 準備動手前：`dispatch.md`（派工）與 `judgment.md`（判斷）是你的兩本操作手冊

## 三件沒被問、但最重要的事（Fable 5 原始診斷）

### 1. 這個系統雖是運行中產品，但本質仍舊為個人練習與學習用作品

使用者是即將畢業的學生（見 `docs/yuchenplans/`，他自述將於 2027.1 畢業），
雖然此項目服務了一個宿舍內的一百多個人，但實作此專案的初衷僅是作為個人練習作品，
因此**不需預設交接情境**——除非未來有學弟主動聯繫要求交接，否則就讓系統持續運作。
同時，只要「空間借用」核心功能持續運作，其他附加功能（留言板等）壞了無所謂。
因此技術取捨權重為：**使用者的學習價值是正當且可以優先的考量**，（實例：留言板選 Cloudflare Workers 而非 Firebase，正是出於學習動機，經使用者拍板）
> 「可維護性 > 優雅 > 功能豐富」應為一般工程品味而非最高原則；

`functions/` 的 Google Calendar 遺留整合與 `firebase.json` 的 classic hosting 區塊是
明確的清理候選——但屬於刪除行為，動之前先問使用者。

### 2. 這是有真實使用者的 production——秘密與隱私是紅線

- 本機目前**沒有** `.env`／`.env.local`；需要 key 時向使用者要，**永不**自己編造或提交秘密
- 即使拿到 key：不要把 `FIREBASE_ADMIN_PRIVATE_KEY` 之類的值貼進對話或 commit——
  你的對話會被記錄，repo 會被推上 GitHub
- 已知隱私瑕疵：`src/firebase/firebase.ts:35` 會 console.log 使用者 email；
  layout.tsx 內嵌 GA 與 Clarity。修復是好提議，但屬行為變更，先問
- 一切資料寫入走 Admin SDK（API Routes），`firestore.rules` client 端全面禁寫——
  任何「在 client 直接寫 Firestore」的方案都直接否決，不用討論

### 3. 品味已經被寫下來了——用 `.impeccable.md`，不要自由發揮

這個專案最容易被弱模型做壞的不是邏輯，是**質感**。使用者對「AI 感、模板感」高度敏感。
`.impeccable.md` 是他親自寫的品味錨點（低飽和三色、圓角 xl/2xl、Threads 式留白、
反 dashboard-template）。任何 UI/文案工作前必讀；產出後自問「這像不像 shadcn 預設或
SaaS landing page」——像就重做。品味題超出規則能覆蓋的部分，走 judgment.md R6，
不要假裝有把握。另外：多 session 的大工程要在 `docs/` 留計劃檔（歷次遷移都靠這個模式成功）。

## 這套制度最可能的退化方式與預防（Fable 5 原始診斷）

1. **CLAUDE.md 再度肥大化**——每個 session 順手加兩行，一年後又是 300 行。
   預防：120 行上限（maintenance.md 第 4 節）；新內容進 playbook，CLAUDE.md 只加路由
2. **playbooks 沒人讀，制度變裝飾**——模型憑直覺派工、自驗、宣告完成。
   預防：路由表放在 CLAUDE.md 最頂部；發現自己沒照 dispatch.md 派工 → 當成教訓寫進 lessons.md
3. **事實過期**——模型名（sonnet/opus/haiku 是 2026-07-04 的世代）、harness 參數、
   專案結構都會變。預防：所有具體事實帶「驗證於」日期；超過 6 個月的事實先重驗再引用；
   harness 疑問派 `claude-code-guide` 查證，不憑記憶
4. **派工儀式化**——為了遵守制度，兩行小改也派 agent，token 反而燒更多。
   預防：dispatch.md 第 1 節的「不派」門檻與「必派」同等重要
5. **lessons.md 變垃圾場**——只進不出，150 行後沒人看。
   預防：同類第 2 次出現就升格為規則；精簡時合併同類而不是刪掉

## 誠實條款：制度的極限

這套 playbooks 補得了**執行紀律**（少漏 token、不失焦、驗證到位），補不了**品味與模糊需求**
（judgment.md R6）。遇到那類題目，合法動作只有三個：交使用者選、opus 第二意見附信心度、
或明說做不到。另外，本信對「哪類任務配哪個模型」的判斷是 2026-07-04 的快照——
模型世代更替後（例如 Claude 6 出現），dispatch.md 第 3 節應由當時的模型帶著使用者重估（🟡 黃級）。

## 交接區：未完成事項

（目前無。接手未完成任務時：完成後把該項刪除；新增時附日期、目標、已完成部分、下一步。）
