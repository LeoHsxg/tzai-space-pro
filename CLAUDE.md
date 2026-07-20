# CLAUDE.md

載物空間借用系統——大學宿舍（仁齋）空間預約平台。**這是 production，有真實使用者與真實資料。**
技術棧：Next.js 15 App Router + Firebase（Auth / Firestore / App Hosting / Functions）+ TypeScript + Tailwind + shadcn/ui + Vitest。

## 路由表：何時讀哪份檔（用到才讀，不要預載）

| 情境 | 先讀 |
| --- | --- |
| 新 session 接到第一個非瑣碎任務 | `.claude/playbooks/letter.md` |
| 規劃「自己做 vs 派 subagent」、選 model | `.claude/playbooks/dispatch.md` |
| 要寫派工 prompt | `.claude/playbooks/prompts.md` |
| 卡住重試中／宣告完成前／想問使用者前／考慮升級模型 | `.claude/playbooks/judgment.md` |
| 要修改本檔或 playbooks、踩坑後想記教訓 | `.claude/playbooks/maintenance.md` |
| 動到 UI、視覺、文案 | `.impeccable.md`（設計品味準則，**必讀**） |
| 想懂這套制度的由來 | `.claude/playbooks/diagnosis.md` |

## 指令（驗證於 2026-07-04）

```bash
npm run dev          # localhost:3000
npm run build        # 輸出 .next/（next.config.ts 為空設定，沒有自訂 distDir）
npm run lint
npm test             # Vitest 單元測試
npm run test:rules   # Firestore rules 測試；需本機 Java 21+，會自動起 emulator
npx tsc --noEmit     # typecheck（CI 有跑，本地也要跑）
firebase emulators:start   # Functions:5001, Firestore:8080, Hosting:5000, Database:9000
```

程式碼變更宣告完成前的最低驗證（用 Bash tool 跑）：
`npm run lint && npx tsc --noEmit && npm test`。CI（`.github/workflows/ci.yml`）跑同一套加 rules 測試與 build。

## 高風險操作：先問使用者（判準見 judgment.md R3）

- `firebase deploy`（任何形式）——直接打 production
- 修改 `firestore.rules`（尤其放寬權限）、觸發 `/api/migrate` 資料遷移
- `git push`、修改 CI workflow、新增執行期依賴

## 架構速覽

- 頁面：`src/app/*/page.tsx` → 主要內容在 `src/views/*.tsx`；共用元件在 `src/Components/`
- **寫入一律走 API Route + Admin SDK**（`src/firebase/admin.ts`）；client 只讀。
  API Routes：`/api/bookings`、`/api/bookings/[id]`、`/api/announcements`、`/api/migrate`
- 權限的唯一事實來源是 `firestore.rules`。Collections：`bookings`（主資料）、
  `regulations/current`、`announcements`、`admins/{email}`（doc 存在＝管理員，`src/lib/isAdmin.ts`）
- Booking 型別與五個房間名單：`src/types/booking.ts`；申請驗證規則：`src/func/applyFunc.ts`
  （以程式碼為準，本檔不複製內容）
- `src/views/Calendar.tsx` 的 Firestore listener 訂閱「當月 −4 ～ +1 個月」的 active bookings
- `functions/`（Node 22）是遺留的 Google Calendar 整合；`firebase.json` 的 `/api/add|getAll|get|delete` rewrites 指向它
- `workers/guestbook/` 是留言板 API（Cloudflare Workers + D1，獨立於 Firebase；有自己的 package.json 與 tsconfig，root 工具鏈不掃它）；規劃與部署見 `docs/guestbook-cloudflare-workers-plan.md`
- 路徑別名 `@/` → `src/`；`cn()` 在 `src/lib/utils.ts`；互動元件要標 `'use client'`

## 環境注意（Windows，血淚教訓見 diagnosis.md）

- 建立/修改內容檔（程式碼、文件）一律用 Read/Write/Edit 工具，**禁止 shell 重導向產生**
  （PowerShell 5.1 預設 UTF-16，會毀掉中文）。例外：用 Bash tool 把指令輸出導到暫存 log
  （`npm run build > /tmp/build.log 2>&1`）再擷取重點，是建議做法
- POSIX 語法（`&&`、`head`、`grep`）只在 Bash tool 有效；PowerShell 5.1 **沒有** `&&`
- 不要 Read/Grep：`dist/`、`.next/`、`node_modules/`、`functions/node_modules/`、`.git/`

## 環境變數（驗證於 2026-07-04）

- Client：`NEXT_PUBLIC_API_KEY`（`src/firebase/firebase.ts`）、`NEXT_PUBLIC_GUESTBOOK_API_URL`（留言板 Worker 網址，未設定時留言板頁顯示施工中）
- 本地跑 API Route 需要：`FIREBASE_ADMIN_PROJECT_ID` / `FIREBASE_ADMIN_CLIENT_EMAIL` / `FIREBASE_ADMIN_PRIVATE_KEY`
  （`src/firebase/admin.ts`；App Hosting 上改用 ADC，不需設定）
- 目前本機**沒有** `.env` / `.env.local`——需要時先問使用者拿 key，不要自己造假值（CI 的 placeholder 只夠過 build）

## 已知狀況（驗證於 2026-07-04）

- `firebase.json` hosting 區塊（`public: dist` + predeploy build）與空的 `next.config.ts` 不一致；
  classic `firebase deploy --only hosting` 視為不可用，正式部署走 App Hosting（`apphosting.yaml`）
- `src/firebase/firebase.ts:35` 仍 console.log 使用者 email
- `AppShell.tsx` 與 `providers.tsx` 功能重疊（都包 Provider）
- `src/app/layout.tsx` 內嵌 GA（G-J5G385BD56）與 Microsoft Clarity（qwd03n8te1）
- `docs/` 是歷史計劃與使用者速記（`docs/yuchenplans/` 是使用者本人的筆記），屬背景資料非現行規範；
  `.github/copilot-instructions.md` 與 `.impeccable.md` 內容相同（改動時兩份要同步）
- **文件與程式碼衝突時，以程式碼為準**，並依 maintenance.md 更新文件
