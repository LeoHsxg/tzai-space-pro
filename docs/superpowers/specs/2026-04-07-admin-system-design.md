# Admin 系統設計文件

> 日期：2026-04-07  
> 狀態：已確認，待實作

---

## 範圍

實作 A（Admin 基礎架構）與 B（Calendar 刪除權限 + Storage 清理）。  
不涉及 Google Calendar API（專案將全面轉為 Firestore 管理）。

---

## A. Admin 基礎架構

### Firestore Collection

```
admins/
  {email}:          // 文件 ID 為 email
    addedAt: Timestamp
```

初始管理員在 Firebase Console 手動新增。

### `src/lib/isAdmin.ts`（server-side helper）

```ts
// 參數：email: string
// 查 adminDb.collection("admins").doc(email).get()
// 回傳 Promise<boolean>
```

用於 API Routes 內部驗證，不對外暴露。

### `src/hooks/useIsAdmin.ts`（client-side hook）

```ts
// 依賴 useAuth() 取得 user.email
// 用 getDoc 查 Firestore db.collection("admins").doc(email)
// 回傳 { isAdmin: boolean, loading: boolean }
// user 未登入時 isAdmin = false
```

### Firestore Rules

`admins` collection：
- 讀：只有 `request.auth.token.email == email`（自己查自己）
- 寫：禁止所有 client（只有 Admin SDK 可寫）

---

## B. 刪除權限 + Storage 清理

### `DELETE /api/bookings/[id]`

修改邏輯：

1. 驗 Bearer token，取得 email
2. 讀取 booking doc
3. 若 `booking.email !== email`：呼叫 `isAdmin(email)` 確認是否管理員，否則回 403
4. 軟刪除：`status: "cancelled"`
5. 若 `booking.photoUrl` 存在：呼叫 `parseStoragePath` 並刪除 Storage 檔案（失敗不阻擋主流程）

`parseStoragePath` 邏輯直接從 `photo/route.ts` 重用（抽到 `src/lib/storageUtils.ts`）。

### `MyDialog.tsx`

新增 `useIsAdmin()` hook，刪除按鈕顯示條件：

| 條件 | 顯示刪除按鈕 |
|------|-------------|
| `isAdmin === true` | 是（無限制） |
| `isEventOwner && startTime > now` | 是 |
| 其他 | 否 |

---

## 不在範圍內

- C（Admin 刪除他人照片）：等 B 完成後一起規劃
- D（管理員設定頁）：未來
- Google Calendar 刪除邏輯：廢棄
- `deleteEventFromCalendar` Cloud Function 安全漏洞：不修（功能廢棄後自然失效）
