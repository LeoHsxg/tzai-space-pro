# 個人檔案頁面 + 拍照上傳機制 — 設計文件

**日期**：2026-04-06  
**狀態**：已確認，待實作

---

## 背景與目標

現有借用系統完善，但使用者離開後不收拾空間、桌椅不歸位。透過「使用後強制上傳照片」的流程，讓使用者在拍照當下被提醒恢復原狀，並讓其他人也能看到空間現狀。

**新流程**：借用 → 使用 → 拍照上傳 → 離開

---

## 範圍

### 本次實作
1. NavLinks：settings icon 改連到 `/profile`（個人檔案頁面）
2. Console 頁面移除公開入口（保留 URL 直接進入，供開發使用）
3. 新增 `/profile` 頁面，列出使用者所有借用紀錄（三個 section）
4. 照片上傳功能（Firebase Storage → 寫回 Firestore）
5. 申請頁擋住有「待完成」項目的使用者

### 不在本次範圍
- UI 視覺精修（功能優先）
- 照片牆（後續規劃）
- 同時借用筆數上限（後續規劃）

---

## 資料模型變更

### `bookings` collection — 新增欄位

```typescript
// src/types/booking.ts 新增
photoRequired?: boolean   // 上線後建立的 booking 為 true；舊資料無此欄位（視為 false）
photoUrl?: string | null  // Firebase Storage 公開下載 URL，上傳後寫入
```

**設計決策**：不使用日期截止點，改用 `photoRequired` 欄位標記。舊資料不需遷移，欄位不存在即視為不需上傳。

### `POST /api/bookings` 變更

寫入新 booking 時加入：
```json
{ "photoRequired": true }
```

---

## 新頁面：`/profile`

### 路由
- `src/app/profile/page.tsx`
- `src/views/Profile.tsx`（主要 view）

### 資料取得

使用 Firestore `onSnapshot` 即時監聽（與 Calendar.tsx 相同模式）：

```
collection: bookings
where: email == currentUser.email
orderBy: startTime desc
```

**未登入**：顯示提示並引導登入，不 redirect。

### Section 判斷邏輯（純前端，無後端）

| Section | 條件 |
|---------|------|
| **待完成** | `photoRequired === true` && `!photoUrl` && `endTime < now` |
| **即將到來** | `status === 'active'` && `endTime > now` |
| **歷史紀錄** | 有 `photoUrl`，或 `status === 'cancelled'`，或（`endTime < now` && `photoRequired !== true`） |

顯示順序：待完成 → 即將到來 → 歷史紀錄。待完成若有資料，section 以紅色標示。

### 照片上傳流程

1. 使用者點擊「待完成」卡片上的上傳按鈕
2. 開啟 file input（accept="image/*"）
3. 上傳至 Firebase Storage，路徑：`bookings/{bookingId}/{timestamp}.{ext}`
4. 取得 download URL
5. 更新 Firestore：`bookings/{bookingId}` 的 `photoUrl` 欄位
6. onSnapshot 自動觸發，該 booking 移至歷史紀錄

**Storage 規則**：登入使用者可讀，只有該 booking 的 email 對應使用者可寫（後續補規則）。

---

## 申請頁（ApplyForm）限制

在 `handleSubmit` 送出前，檢查使用者是否有「待完成」項目：

```
bookings.some(b => b.photoRequired === true && !b.photoUrl && b.endTime < now)
```

若有，顯示 toast 錯誤並阻止送出，引導使用者前往個人檔案上傳照片。

**實作方式**：將 `pendingPhoto` 判斷邏輯抽成 helper function，ApplyForm 和 Profile 共用。

---

## NavLinks 變更

- 將 `/console` 的 Link 改為 `/console` → `/profile`
- Icon 沿用現有 settings svg（可後續換成 person icon）
- Console 頁面（`/console`、`src/app/console/page.tsx`、`src/views/Console.tsx`）保留，但不再有任何 NavLinks 入口

---

## Firebase Storage 初始化

確認 `src/firebase/firebase.ts` 初始化 Storage（`getStorage`）。若尚未加入，新增初始化並 export `storage` instance。

---

## 檔案異動清單

| 動作 | 檔案 |
|------|------|
| 修改 | `src/types/booking.ts` — 加 `photoRequired`, `photoUrl` |
| 修改 | `src/app/api/bookings/route.ts` — 寫入時加 `photoRequired: true` |
| 修改 | `src/firebase/firebase.ts` — 加 Storage 初始化 |
| 修改 | `src/Components/NavLinks.tsx` — console → profile |
| 新增 | `src/app/profile/page.tsx` |
| 新增 | `src/views/Profile.tsx` |
| 新增 | `src/func/bookingUtils.ts` — `hasPendingPhoto()` helper |
| 修改 | `src/views/ApplyForm.tsx` — 送出前檢查 |

---

## 不處理的邊界情境

- 上傳失敗的 retry UI（功能優先，失敗時顯示 toast 錯誤即可）
- Storage Security Rules 詳細設定（上線前補）
- 多張照片（目前每筆 booking 只存一個 `photoUrl`）
