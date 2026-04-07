# Admin 系統規劃

> 撰寫日期：2026-04-07
> 目前狀態：**尚未實作任何 admin 機制**

---

## 現況說明

目前程式碼中的「admin」只有 Firebase Admin SDK（server-side 特權 SDK），
與「使用者是否具有管理員身份」完全無關。

所有登入使用者權限完全相同，僅靠 `booking.email === 使用者 email` 區分操作範圍。

---

## 決策：Admin 識別方式

**採用 Firestore `admins` collection**（方式二）

- 在 Firebase Console 直接新增/移除管理員，不需改 code 或重新部署
- 適合交接給下一任齋長管理
- 之後若要升級為 Firebase Custom Claims 也易於遷移

### Collection 結構

```
admins/
  {email}:
    addedAt: Timestamp
```

範例文件 ID：`leosi@gmail.com`

---

## 待實作功能清單

### A. Admin 基礎架構

- [ ] 建立 Firestore `admins` collection（手動在 Firebase Console 新增初始管理員）
- [ ] 建立 `src/lib/isAdmin.ts`：server-side helper，查 `admins` collection 確認 email 是否為管理員
- [ ] 建立 `src/hooks/useIsAdmin.ts`：client-side hook，讓前端 component 知道當前使用者是否為管理員（查 Firestore）
- [ ] 更新 Firestore rules：`admins` collection 只有 Admin SDK 可寫，使用者只能讀自己的文件（或完全不開放讀，全靠 server 判斷）

---

### B. Calendar 刪除按鈕權限控制

**需求：**
- 一般使用者：只能刪除**尚未開始**的自己的事件，已開始的事件不顯示刪除按鈕
- 管理員：可以刪除**任何**事件（不限時間、不限誰的）

**目前狀況：**
Calendar 的刪除按鈕邏輯尚待確認（目前刪除走 Cloud Function `deleteEventFromCalendar`，
會驗證 email 是否為建立者）

**待做：**
- [ ] Calendar UI：判斷 `event.startTime < now` 且非管理員 → 隱藏刪除按鈕
- [ ] Cloud Function `deleteEventFromCalendar`：加入管理員可繞過 email 驗證的邏輯
      （或改走 Next.js API Route，統一用 Admin SDK 驗證）
- [ ] 連帶刪除照片：刪除 Calendar 事件時，若對應 Firestore booking 有 `photoUrl`，
      一併刪除 Storage 檔案並清空 `photoUrl`（目前刪除不會做這件事）

---

### C. Admin 刪除他人照片（Profile 頁面或獨立 Admin 頁面）

**需求（已討論，延後）：**
- 管理員能刪除任何人上傳的照片
- 刪除後該借用退回「待完成」狀態

**目前狀況：**
`DELETE /api/bookings/[id]/photo` 已實作，但只允許本人刪除（email 比對）。
開放管理員刪除只需在 API Route 多一個 isAdmin 判斷。

**入口 UI 待決定：**
- 方案一：Profile 頁面讓管理員看到所有人的借用（範圍大）
- 方案二：獨立 `/admin` 頁面（乾淨，但要多做一個頁面）
- **建議等 Calendar 刪除功能整合後一起規劃**

---

### D. 其他 Admin 相關功能（未來）

- [ ] 管理員設定頁面（新增/移除其他管理員）
- [ ] 身份驗證強化：要求學校帳號登入（限制 Google 帳號 domain）
      → 每年齋長交接時加 admin 即可，不需改系統

---

## 實作順序建議

1. **A（基礎架構）** → 先建好 isAdmin helper，後續所有功能都依賴它
2. **B（Calendar 刪除）** → 最急，因為現在任何人都可刪任何事件（Cloud Function 驗證可能不夠嚴格）
3. **C（Admin 刪除照片）** → 等 B 做完後自然可以一起完善
4. **D** → 系統穩定後再補

---

## 相關檔案

| 檔案 | 說明 |
|------|------|
| `src/firebase/admin.ts` | Firebase Admin SDK 初始化（已有 adminDb/adminAuth/adminStorage） |
| `src/app/api/bookings/[id]/photo/route.ts` | 照片刪除 API，未來加 isAdmin 判斷 |
| `src/app/api/bookings/[id]/route.ts` | 借用刪除 API（目前軟刪除） |
| `functions/index.js` | Cloud Functions（deleteEventFromCalendar 在此） |
| `functions/src/handleEvent.js` | deleteEvent 邏輯（有 email 驗證） |
| `src/views/Calendar.tsx` | Calendar UI（刪除按鈕在此） |
