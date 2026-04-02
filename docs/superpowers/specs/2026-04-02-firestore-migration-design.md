# Firestore 搬遷設計規格

> 日期：2026-04-02  
> 分支：`dev`  
> 狀態：已確認，待實作

---

## 背景與目標

### 問題

目前預約資料存放於 Google Calendar，透過 Cloud Functions 中間層讀寫。Firebase App Hosting 不讀取 `firebase.json` 的 hosting rewrites，導致所有 `/api/*` 請求回傳 404，系統目前無法正常運作。

### 目標

將預約資料搬遷至 Firestore，讓系統在 Firebase App Hosting 上正常運作，同時引入 Next.js API Routes 作為寫入端的後端層，提升安全性與架構清晰度。

### 不在本次範圍

- Cloud Functions 清理（Phase 2，後期待辦）
- Google Calendar 單向同步（Phase 3，後期待辦）
- 歷史資料長期對齊策略（確定切換後再規劃）
- 動到現有 Google Calendar 資料（完全不碰）

---

## 整體架構

```
讀取（Calendar.tsx）
  └─ Firebase Client SDK
       └─ onSnapshot(bookings query) → 即時更新 UI

寫入（ApplyForm.tsx）
  └─ fetch POST /api/bookings
       └─ Next.js API Route
            └─ verifyIdToken → validateData → Firestore transaction（衝突檢測 + 寫入）

刪除（MyDialog.tsx）
  └─ fetch DELETE /api/bookings/[id]
       └─ Next.js API Route
            └─ verifyIdToken → 確認本人 → 軟刪除（status: "cancelled"）

遷移（開發期反覆使用）
  └─ fetch POST /api/migrate
       └─ Next.js API Route
            └─ 呼叫 getAllEvents Cloud Function → 轉換格式 → upsert Firestore
```

**讀取走 Client SDK 的理由：** 讀取不涉及資料修改，`onSnapshot` 提供即時推送，不需要 server round-trip，也不需要 Admin SDK 權限。

**寫入走 API Route 的理由：** 衝突檢測、身份驗證、資料驗證集中在 server 端處理，前端無法繞過。

---

## Firestore 資料模型

### Collection: `bookings`

```
bookings/{docId}
├── calendarEventId: string | null  // 遷移資料填 Calendar event.id；新建預約為 null
├── room: string                    // "書房" | "橘廳" | "會議室" | "小導師室" | "貢丸室"
├── name: string                    // 申請人姓名（max 30 字）
├── email: string                   // 登入者 email
├── phone: string                   // 電話（10 碼純數字）
├── crowdSize: number               // 人數（正整數）
├── description: string             // 活動描述（max 100 字）
├── startTime: Timestamp            // 開始時間
├── endTime: Timestamp              // 結束時間
├── createdAt: Timestamp            // 建立時間
└── status: "active" | "cancelled"  // 軟刪除用
```

**docId 規則：**

- 遷移資料：使用 Google Calendar `event.id`（讓 upsert 冪等，可重複跑遷移）
- 新建預約：Firestore auto ID

### Security Rules

```firestore
match /bookings/{bookingId} {
  allow read: if true;    // 任何人可讀（Calendar 頁公開顯示）
  allow write: if false;  // 所有寫入走 API Route（Admin SDK 繞過 Rules）
}
```

寫入全部封死前端直接存取，授權邏輯集中在 API Route。

### Composite Index

```
Collection : bookings
Fields     : room (ASC), startTime (ASC), endTime (ASC)
用途       : 衝突檢測查詢
```

---

## API Routes

所有 API Routes 位於 `src/app/api/`，使用 Firebase Admin SDK。

### 身份驗證流程

前端每次呼叫 API 前取得 Firebase ID Token，放入 Authorization header：

```typescript
// 前端
const token = await user.getIdToken();
fetch("/api/bookings", {
  headers: { Authorization: `Bearer ${token}` },
});

// API Route
const token = request.headers.get("Authorization")?.replace("Bearer ", "");
const decoded = await adminAuth.verifyIdToken(token); // 驗證簽章 + 取得 email
```

ID Token 由 Firebase Auth 簽發，含使用者 uid / email，有效期 1 小時，Client SDK 自動刷新。Server 端用 Admin SDK 驗證無法偽造。

---

### `POST /api/bookings` — 建立預約

**Request**

```typescript
// Header: Authorization: Bearer <token>
// Body:
{
  name: string;
  phone: string;
  crowdSize: string;
  room: string;
  checkinTime: string; // ISO datetime
  checkoutTime: string; // ISO datetime
  eventDescription: string;
}
```

**流程**

1. 解析 request body
2. `verifyIdToken` 取得登入 email
3. 執行 `validateData()`（複用 `applyFunc.ts`）
4. Firestore transaction：
   - 查詢同房間、時間重疊的 `active` bookings
   - 有衝突 → `409 Conflict`
   - 無衝突 → 寫入新文件
5. 回傳 `201 { bookingId }`

**衝突檢測查詢條件**

```typescript
where("room", "==", room),
where("status", "==", "active"),
where("startTime", "<", endTime),   // 現有事件在新事件結束前開始
where("endTime", ">", startTime),   // 現有事件在新事件開始後結束
```

---

### `DELETE /api/bookings/[id]` — 刪除預約

**Request**

```
// Header: Authorization: Bearer <token>
// Method: DELETE /api/bookings/{bookingId}
```

**流程**

1. `verifyIdToken` 取得登入 email
2. 讀取 `bookings/{id}`
3. 確認 `decoded.email === booking.email`（本人才能刪）
4. 更新 `status: "cancelled"`（軟刪除，保留歷史）
5. 回傳 `200`

---

### `POST /api/migrate` — 遷移 Calendar 資料

**Request**

```
POST /api/migrate
（無需 body）
```

**流程**

1. 呼叫現有 `getAllEvents` Cloud Function 取回所有 Calendar 事件
2. 逐筆轉換：`Event` → `Booking` schema
3. Firestore `batch set()`，以 `calendarEventId` 為 doc ID（upsert）
4. 回傳 `{ migrated: N, skipped: M }`

**冪等性保證：** 以 Calendar `event.id` 為 Firestore doc ID，重複跑只會覆蓋更新，不產生重複文件。開發期間可隨時重新執行同步。

**舊版資料處理：** 部分舊 Calendar 事件沒有 `extendedProperties`，需從 `description` 文字解析（複用 `MyDialog.tsx` 的 `parseEventDescription` 邏輯）。

---

## 前端改動

### Calendar.tsx

| 項目       | 改動                                                                      |
| ---------- | ------------------------------------------------------------------------- |
| 資料來源   | `fetch /api/get` → `onSnapshot`                                           |
| 月份篩選   | `startTime < monthEnd AND endTime > monthStart`（時間重疊，支援跨月事件） |
| 狀態篩選   | 只顯示 `status === "active"`                                              |
| 切月份     | 更新 query 條件，不再需要手動 fetch                                       |
| 刪除後刷新 | `onSnapshot` 自動反映，移除 `handleDeleteSuccess` fetch                   |

### ApplyForm.tsx

| 項目       | 改動                                             |
| ---------- | ------------------------------------------------ |
| API 端點   | `api/add/` → `/api/bookings`                     |
| 加入 token | `user.getIdToken()` → `Authorization` header     |
| 前端驗證   | 保留 `validateData()`（快速 fail），後端再驗一次 |

### MyDialog.tsx

| 項目           | 改動                                                   |
| -------------- | ------------------------------------------------------ |
| API 端點       | `/api/delete/` → `DELETE /api/bookings/${bookingId}`   |
| 加入 token     | `user.getIdToken()` → `Authorization` header           |
| body           | 移除 `email` 欄位（改由 token 取得，不再信任前端傳入） |
| `isEventOwner` | 保留於前端（控制按鈕顯示），實際授權在後端             |

### 新增 / 修改檔案

| 檔案                                 | 說明                                       |
| ------------------------------------ | ------------------------------------------ |
| `src/types/booking.ts`               | 新增 `Booking` type                        |
| `src/firebase/admin.ts`              | Admin SDK 初始化（`adminAuth`, `adminDb`） |
| `src/app/api/bookings/route.ts`      | POST handler                               |
| `src/app/api/bookings/[id]/route.ts` | DELETE handler                             |
| `src/app/api/migrate/route.ts`       | 遷移 handler                               |
| `firestore.rules`                    | 新增 `bookings` 規則                       |
| `firestore.indexes.json`             | 新增 composite index                       |

### 暫時不動的檔案

- `src/types/event.tsx`（遷移 script 仍需要，Phase 2 清理時移除）
- `firebase.json` rewrites（Phase 2 清理）
- `functions/`（保留，`getAllEvents` 遷移時需要）

---

## 後期待辦

### Phase 2：清理（Cloud Functions 移除）

- 移除 `firebase.json` hosting rewrites
- 移除 `functions/` 目錄或停止部署
- 移除 `googleapis` 依賴
- 移除 `src/types/event.tsx`
- 移除 `/api/migrate` endpoint

### Phase 3：Google Calendar 單向同步（選做）

- Firestore trigger `onBookingCreated` → 寫入 Google Calendar
- Firestore trigger `onBookingDeleted` → 從 Google Calendar 刪除
- 保留 Google Calendar 作為唯讀檢視

### 歷史資料對齊

- 確定正式切換時間點後，規劃最後一次遷移的執行流程
- 評估是否需要保留 Calendar 資料或可以完全以 Firestore 為主

---

## 環境變數

Admin SDK 需要 Service Account 私鑰，透過環境變數注入：

```
FIREBASE_ADMIN_PROJECT_ID=tzai-space-pro
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY=...
```

Firebase App Hosting 透過 `apphosting.yaml` 的 `environmentVariables` 或 Secret Manager 注入。

