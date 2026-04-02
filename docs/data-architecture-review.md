# 資料架構檢討與搬遷規劃

> 日期：2026-04-02
> 分支：`claude/review-data-architecture-MxZd2`

---

## 現狀分析

### 目前架構

```
前端 (Next.js App Router)
  ↓ fetch /api/get, /api/add, /api/delete
firebase.json hosting rewrites
  ↓ 轉發至 Cloud Functions
Cloud Functions (functions/)
  ↓ googleapis SDK + Service Account
Google Calendar API（主要資料儲存）
```

- **寫入**：ApplyForm → POST `/api/add/` → Cloud Function → `calendar.events.insert()`
- **讀取**：Calendar → GET `/api/get?year=&month=` → Cloud Function → `calendar.events.list()`
- **刪除**：MyDialog → POST `/api/delete/` → Cloud Function → `calendar.events.delete()`
- **Firestore** 只用於存放借用規則（`regulations/current`），不存預約資料

### 資料結構

#### 前端送出的 RequestBody

```typescript
{
  name: string,          // 申請人姓名（max 30 字）
  phone: string,         // 電話（10 碼純數字）
  crowdSize: string,     // 人數（正整數）
  room: string,          // "書房" | "橘廳" | "會議室" | "小導師室" | "貢丸室"
  checkinTime: string,   // ISO datetime
  checkoutTime: string,  // ISO datetime
  email: string,         // 登入者 email
  eventDescription: string // 活動描述（max 100 字）
}
```

#### 存入 Google Calendar 的結構

| 欄位 | 內容 |
|------|------|
| `summary` | room name |
| `description` | 格式化文字（給 Google Calendar UI 看） |
| `colorId` | 1~5 對應房間 |
| `start/end.dateTime` | 時間區間 |
| `extendedProperties.shared` | `{ name, phone, crowdSize, email, eventDescription }` |

#### 讀取回來的 Event 型別 (`src/types/event.tsx`)

```typescript
type Event = {
  id: string;
  start: { dateTime: string };
  end: { dateTime: string };
  summary: string;       // room name
  colorId?: string;
  description: string;   // legacy 文字格式
  extendedProperties: {
    shared: {
      name: string;
      crowdSize: string;
      phone: string;
      email: string;
      eventDescription: string;
    };
  };
};
```

---

## 問題 1：為何需要 Cloud Function 當中間層？

1. **寫入/刪除需要 Service Account 私鑰**做 JWT 認證，不能暴露在前端
2. **讀取用 API Key** 理論上前端可直接呼叫，但 Google Calendar API **不支援瀏覽器 CORS**，所以仍需 server-side proxy
3. 結論：在使用 Google Calendar 作為資料來源的前提下，Cloud Function 中間層是必要的

---

## 問題 2：為何現在本地和線上都吃不到資料？

### 根因：Firebase App Hosting 不讀 `firebase.json` 的 hosting rewrites

- `next.config.ts` 移除了 `output: 'export'`，改用 Firebase App Hosting（`apphosting.yaml`）
- `firebase.json` 的 rewrites（`/api/add/**` → Cloud Function）只在 **傳統 Firebase Hosting** 生效
- Firebase App Hosting 是獨立的 SSR 服務，所有請求直接交給 Next.js server
- Next.js 收到 `/api/get` 會去找 `src/app/api/get/route.ts`，但不存在 → 404 或回傳 HTML
- `npm run dev` 同理，是 Next.js dev server，不走 `firebase.json` rewrite

### 解決方案

| 方案 | 做法 | 優缺點 |
|------|------|--------|
| **A. Next.js API Routes** | 建 `src/app/api/get/route.ts` 等，搬入 Cloud Function 邏輯 | 相容 App Hosting，但 service account key 要用環境變數 |
| **B. 前端打 Cloud Functions 完整 URL** | `fetch('https://us-central1-tzai-space-pro.cloudfunctions.net/...')` | 最快，但有 CORS 問題 |
| **C. 搬遷至 Firestore（推薦）** | 前端直接用 Firebase Client SDK 讀寫 Firestore | 根本解決，不再需要中間層 |

---

## 問題 3：搬遷至 Firestore 評估

### 對照比較

| 面向 | Google Calendar (現狀) | Firestore (搬遷後) |
|------|----------------------|-------------------|
| 衝突檢測 | 手動 list + 比對，邏輯複雜 | Firestore transaction 原子操作，更可靠 |
| 查詢能力 | 只能按時間範圍 list | 可按 room、email、時間任意組合 |
| 資料一致性 | extendedProperties 有限制、舊事件缺欄位 | schema 完全自定義 |
| 即時更新 | 需 polling（切月份才 fetch） | `onSnapshot` 即時推送 |
| 成本 | Calendar API 免費額度高 | Firestore 免費 50K reads/day，綽綽有餘 |
| 前端直接存取 | 不行（CORS + Service Account） | 可以，搭配 Security Rules |
| Google Calendar 可視性 | 直接在 Calendar app 看 | 失去，需另做同步 |
| 維護成本 | googleapis + Service Account + Functions | 只需 Firebase SDK |
| App Hosting 相容 | 需 Cloud Functions + rewrite（已壞） | 完美相容 |

### 建議的 Firestore 資料模型

```
Collection: bookings
Document: {autoId}
├── room: string          // "書房" | "橘廳" | "會議室" | "小導師室" | "貢丸室"
├── name: string          // 申請人姓名
├── email: string         // 登入者 email
├── phone: string         // 電話
├── crowdSize: number     // 人數
├── description: string   // 活動描述
├── startTime: Timestamp  // 開始時間
├── endTime: Timestamp    // 結束時間
├── createdAt: Timestamp  // 建立時間
├── status: string        // "active" | "cancelled"
```

### Security Rules

```firestore
match /bookings/{bookingId} {
  allow read: if true;
  allow create: if request.auth != null;
  allow update: if false;
  allow delete: if request.auth != null
                && request.auth.token.email == resource.data.email;
}
```

### Composite Index

```
Collection: bookings
Fields: room (ASC), startTime (ASC), endTime (ASC)
用途: 衝突檢測查詢
```

---

## 搬遷實作計畫

### Phase 1：Firestore 讀寫（取代 Cloud Functions）

1. 建立 `bookings` collection + security rules + index
2. 新增 `src/firebase/bookings.ts`：封裝 Firestore CRUD
   - `createBooking(data)` — 含衝突檢測 transaction
   - `getBookingsForMonth(year, month)` — query by startTime range
   - `deleteBooking(bookingId, userEmail)` — 驗證後刪除
3. 修改 `Calendar.tsx`：用 `onSnapshot` 取代 `fetch /api/get`
4. 修改 `ApplyForm.tsx`：直接呼叫 `createBooking()` 取代 `fetch /api/add`
5. 修改 `MyDialog.tsx`：直接呼叫 `deleteBooking()` 取代 `fetch /api/delete`
6. 更新 `Event` type 為新的 `Booking` type

### Phase 2：清理

7. 移除 `firebase.json` 中的 hosting rewrites
8. 移除 `functions/` 目錄（或保留但不再部署）
9. 移除 `googleapis` 相關依賴

### Phase 3（選做）：Google Calendar 單向同步

10. 新增 Cloud Function：`onBookingCreated` trigger → 寫入 Google Calendar
11. 新增 Cloud Function：`onBookingDeleted` trigger → 從 Google Calendar 刪除
12. 保留 Google Calendar 作為唯讀檢視

### 歷史資料遷移

- 使用 `getAllEvents` Cloud Function 匯出所有現有事件
- 寫一次性 script 將資料轉換格式後寫入 Firestore `bookings` collection
- 注意處理舊版事件（沒有 `extendedProperties` 的，需從 `description` 解析）

---

## 結論

**強烈建議搬遷至 Firestore**，理由：

1. 直接解決目前資料吃不到的問題
2. 架構大幅簡化（移除 Cloud Functions 中間層）
3. 前端可即時更新，UX 更好
4. 衝突檢測更可靠
5. 完美相容 Firebase App Hosting
