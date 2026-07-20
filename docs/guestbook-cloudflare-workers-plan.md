# 留言板 × Cloudflare Workers 計劃檔

> 建立於 2026-07-20。目的：留言板功能上線＋使用者親手學 Cloudflare Workers。
> 程式碼已全部寫完（見下方檔案地圖），**剩下的部署步驟刻意留給使用者親手操作**——那是學習的主體。

## 決策紀錄（2026-07-20 使用者拍板）

| 議題 | 決定 |
| --- | --- |
| 後端方案 | Cloudflare Workers + D1（出於學習動機；NAS 因維運成本出局，Firebase 因「想學新東西」出局） |
| 分工 | Claude 寫完全部程式碼；使用者負責讀懂＋親手跑部署流程 |
| 留言身分 | 必須登入（沿用站上 Firebase Auth；Worker 用 JWKS 驗 ID token）。讀留言也要登入——避免 email 從公開端點外洩 |
| 功能範圍 | 極簡版＋刪除自己的留言；管理員（ADMIN_EMAILS）可刪任何人的 |
| 程式碼位置 | 本 repo `workers/guestbook/` 子目錄，獨立 package.json / tsconfig，root 工具鏈不掃它 |

## 架構

```
瀏覽器 /guestbook 頁（Next.js on Firebase App Hosting）
  │  fetch + Authorization: Bearer <Firebase ID token>（跨網域，CORS）
  ▼
Cloudflare Worker「tzai-guestbook」（workers/guestbook/src/index.ts）
  │  1. CORS 檢查（ALLOWED_ORIGINS）
  │  2. 驗 token：jose + Google JWKS 公鑰，驗簽章/issuer/audience/exp（src/auth.ts）
  │  3. 業務邏輯：500 字上限、同人 30 秒冷卻、刪除權限檢查
  ▼
D1 資料庫（SQLite）─ messages 表（migrations/0001_create_messages.sql）
```

- API：`GET /messages`（最新 100 則）、`POST /messages`、`DELETE /messages/:id`，皆須登入
- 管理員清單放 wrangler.toml 的 `ADMIN_EMAILS`（與 Firestore `admins` collection 是兩份資料，改動要記得同步）
- 前端在 `NEXT_PUBLIC_GUESTBOOK_API_URL` 未設定時顯示「施工中」卡片，不會壞

## 檔案地圖

- `workers/guestbook/wrangler.toml` — Worker 設定：名稱、D1 綁定、環境變數
- `workers/guestbook/src/index.ts` — 路由、CORS、驗證、D1 查詢（註解即教材）
- `workers/guestbook/src/auth.ts` — Firebase ID token 驗證（本次最有學習價值的一檔）
- `workers/guestbook/migrations/0001_create_messages.sql` — 資料表 schema
- `src/views/Guestbook.tsx` + `src/app/guestbook/page.tsx` — 前端頁面
- `src/Components/NavLinks.tsx` — 桌面版導覽已加「留言板」；**手機版入口未加**（見未決事項）

## 前提事實（2026-07-20 使用者補充）

正式站網域 `tzai-space.com`（含 www）的 DNS 已託管在使用者的 Cloudflare 帳號上。
這帶來三件事：
- 不用另外註冊帳號，Worker **要部署在同一個帳號**（自訂網域才綁得起來）
- `ALLOWED_ORIGINS` 已預先填好 apex + www + localhost（wrangler.toml）
- Worker 可綁 `guestbook.tzai-space.com` 自訂子網域（見步驟 6b）。注意：
  即使綁了自訂子網域，對 `www.tzai-space.com` 來說**仍是不同 origin**（origin 比對
  是整個 scheme+host+port），所以 CORS 這套還是必要的，不會白學
- 主站的 www/apex DNS 紀錄推測是 DNS-only（灰雲，指向 Firebase App Hosting，
  由 Firebase 管憑證）——**不要**順手把它切成 Proxied（橘雲），可能弄壞 App Hosting 的憑證更新

## 使用者的部署步驟（照順序做）

1. **用現有的 Cloudflare 帳號**（就是管 tzai-space.com DNS 的那個）
2. **登入 wrangler**（wrangler 已在 devDependencies，不用全域安裝）：
   ```bash
   cd workers/guestbook
   npx wrangler login          # 開瀏覽器做 OAuth
   ```
3. **建立 D1 資料庫**：
   ```bash
   npx wrangler d1 create tzai-guestbook
   ```
   把輸出的 `database_id` 貼進 `wrangler.toml` 取代 `REPLACE_WITH_YOUR_D1_DATABASE_ID`
4. **本地先玩一輪**（強烈建議，這步學最多）：
   ```bash
   npx wrangler d1 migrations apply tzai-guestbook --local   # 在本地 SQLite 建表
   npx wrangler dev                                          # 本地起 Worker（預設 :8787）
   ```
   另開終端在專案根目錄建 `.env.local`，加入
   `NEXT_PUBLIC_GUESTBOOK_API_URL=http://localhost:8787`，跑 `npm run dev`，
   開 http://localhost:3000/guestbook 登入後實際留言測試
5. **建正式資料表**：
   ```bash
   npx wrangler d1 migrations apply tzai-guestbook --remote
   ```
6. **部署 Worker**：
   ```bash
   npx wrangler deploy
   ```
   記下輸出的網址（形如 `https://tzai-guestbook.<你的subdomain>.workers.dev`）
   
   **6b.（建議）綁自訂子網域**：把 `wrangler.toml` 裡 `routes` 那段的註解拿掉
   （`guestbook.tzai-space.com`），再 `npx wrangler deploy` 一次——wrangler 會自動
   建 DNS 紀錄與 TLS 憑證。之後 API 網址就用 `https://guestbook.tzai-space.com`
7. **CORS 已預先設定**：`ALLOWED_ORIGINS` 已含 apex + www + localhost，不用再改；
   若未來網域有變，改這個值後重新 deploy 即可
8. **接上正式站**：在 `apphosting.yaml` 加環境變數
   `NEXT_PUBLIC_GUESTBOOK_API_URL=<步驟 6 或 6b 的網址>`，推上 main 讓 App Hosting 重新 build
9. **驗收**：正式站登入 → /guestbook 留言、刪留言；用另一個帳號驗證刪不了別人的留言

## 學習清單（配合上面步驟讀）

1. **Workers 基本模型**：`fetch(request, env)`、isolate 與冷啟動、bindings 概念
   → https://developers.cloudflare.com/workers/ 的 How Workers works
2. **wrangler 工作流**：`dev` / `deploy` / `--local` 與 `--remote` 的差別、wrangler.toml 每個欄位
3. **D1 / SQLite**：prepared statement（`?` 佔位符為什麼能防 SQL injection）、索引為什麼讓 ORDER BY 變快、migration 的概念
4. **JWT / OIDC（本次的重頭戲）**：讀 `src/auth.ts` 前先搞懂——JWT 三段結構、RS256 非對稱簽章（為什麼驗證只需要公鑰）、JWKS 是什麼、iss/aud/exp 各擋掉哪種攻擊。可拿自己的 ID token 去 jwt.io 解開看 payload
5. **CORS**：same-origin policy、preflight（OPTIONS）什麼時候發、`Access-Control-Allow-*` 各自的意思——用 DevTools Network 面板實際觀察 /guestbook 頁的請求
6. **對照練習**：比較 `workers/guestbook/src/index.ts` 與 `src/app/api/bookings/route.ts`——同樣是「驗 token → 驗資料 → 寫 DB」，兩個平台的差異在哪

## 未決事項

- **手機版導覽入口**：手機 NavBar 是四顆手工設計的 svg icon，沒有現成的留言板 icon；
  這是品味題，等使用者在 Figma 出圖後再加（目前手機要打網址 /guestbook 進入）
- D1 免費額度（5GB、每日讀寫額度）對本站規模綽綽有餘；備份策略（`wrangler d1 export`）之後再說

## 進度

- 2026-07-20：全部程式碼完成並通過驗證（worker tsc、`wrangler deploy --dry-run`、
  root lint / tsc / vitest 22 綠）。等使用者執行部署步驟 1–9。
