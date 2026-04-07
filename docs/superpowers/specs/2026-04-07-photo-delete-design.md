# Photo Delete Design

**Date:** 2026-04-07  
**Scope:** 上傳者刪除自己的照片（Profile 頁面）

---

## 背景

借用系統支援使用者上傳空間使用後照片。需要讓上傳者能刪除自己的照片（手滑、隱私問題等），刪除後借用退回「待完成」狀態，需重新上傳，避免以刪除逃避回報的漏洞。

管理員刪除入口延後，待日曆事件刪除功能整合時一起設計。

---

## 範圍

- 上傳者可刪除自己已上傳的照片
- 刪除後：Firebase Storage 檔案移除 + Firestore `photoUrl` 清空 → 借用自動退回「待完成」
- UI：歷史紀錄照片展開後，圖片下方滑出刪除按鈕 → 確認 AlertDialog → 執行刪除

**不在範圍：**

- 管理員刪除他人照片
- Admin 角色系統建置

---

## 後端設計

### 新增 API Route

**路徑：** `src/app/api/bookings/[id]/photo/route.ts`  
**方法：** `DELETE`

**流程：**

1. 驗證 Bearer token → 取得 email
2. 讀 Firestore booking：確認存在、`booking.email === email`、`photoUrl` 不為 null
3. 從 `photoUrl` 解析 Storage 路徑，用 Admin SDK `getStorage().bucket().file(path).delete()` 刪除檔案
4. 清空 Firestore `photoUrl: null`（`status` 不動，pending 判斷邏輯本來就靠 `photoUrl === null`）

**Storage 刪除失敗策略：** 仍清空 `photoUrl`（Storage 孤兒檔不影響使用者體驗，可接受）

**錯誤碼：**

| 情況                | HTTP |
| ------------------- | ---- |
| 未登入 / token 無效 | 401  |
| 非本人借用          | 403  |
| 找不到借用          | 404  |
| photoUrl 已是 null  | 409  |
| 伺服器錯誤          | 500  |

---

## 前端設計

### UI 結構（Profile.tsx 歷史紀錄區塊）

照片展開後，圖片下方新增滑入的「刪除照片」按鈕：

```
┌─────────────────────────────────┐
│ 橘廳            查看照片 ▴      │
│                                 │
│  [  照片圖片  ]                 │
│                                 │
│  [ 刪除照片 ]  ← 紅色，滑入    │
└─────────────────────────────────┘
```

### 確認 Dialog（shadcn/ui AlertDialog）

```
╔══════════════════════════════╗
║  確定要刪除這張照片嗎？       ║
║                              ║
║  刪除後此借用將退回「待完     ║
║  成」狀態，需要重新上傳照片。 ║
║                              ║
║  [取消]        [確認刪除]    ║
╚══════════════════════════════╝
```

### State 變更

新增 `deletingPhoto: string | null`（正在刪除中的 bookingId，顯示 loading 狀態）

### 刪除流程

1. 使用者點「確認刪除」
2. 設 `deletingPhoto = bookingId`，關閉 dialog
3. 呼叫 `DELETE /api/bookings/{id}/photo`（帶 Bearer token）
4. 成功：Firestore realtime listener 自動更新 → 借用從「歷史紀錄」移到「待完成」；收起展開狀態
5. 失敗：`toast.error(message)`
6. 清除 `deletingPhoto`

---

## 檔案異動清單

| 檔案                                       | 異動                                                                  |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `src/app/api/bookings/[id]/photo/route.ts` | 新增（DELETE handler）                                                |
| `src/views/Profile.tsx`                    | 新增 deletingPhoto state、刪除按鈕 UI、AlertDialog、handleDeletePhoto |
| `src/Components/ui/dialog.tsx`             | 既有元件，直接使用（專案用 `@base-ui/react`，不加 alert-dialog）      |

