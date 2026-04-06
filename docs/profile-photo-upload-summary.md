# 個人檔案 + 拍照上傳功能 — 開發摘要

**完成日期**：2026-04-07  
**Branch**：`feature/profile-photo-upload` → merged into `dev`

---

## 背景

使用者借用空間後不收拾、桌椅不歸位。透過強制上傳照片的流程，讓使用者在拍照當下被提醒恢復原狀。

**新流程**：借用 → 使用 → 拍照上傳 → 離開

---

## 本次變動

### 新頁面：`/profile`（個人檔案）

導覽列最右側的齒輪圖示改為連到 `/profile`（原本是 `/console`）。

頁面列出使用者所有借用紀錄，分三個 section：

| Section      | 顯示條件                    |
| ------------ | --------------------------- |
| **待完成**   | 借用時間已過 + 尚未上傳照片 |
| **即將到來** | 借用時間未到 + 狀態 active  |
| **歷史紀錄** | 已上傳照片，或已取消        |

### 照片上傳流程

1. 使用者在「待完成」卡片點「上傳照片」
2. 選擇圖片（限 image/\*、最大 5MB）
3. 直接從瀏覽器上傳至 Firebase Storage（路徑：`bookings/{bookingId}/{timestamp}.ext`）
4. 取得下載 URL，呼叫 `PATCH /api/bookings/{id}` 寫回 Firestore
5. onSnapshot 自動觸發，該筆移至「歷史紀錄」

### 借用限制

申請頁送出前會檢查：若有「待完成」的借用，則擋住送出並提示前往個人檔案上傳照片。

### 舊資料相容

新欄位 `photoRequired`（布林）只有新建的借用才會設為 `true`。舊資料沒有此欄位，自動視為不需上傳，不受影響。

---

## 異動檔案

| 類型 | 路徑                                                               |
| ---- | ------------------------------------------------------------------ |
| 新增 | `src/views/Profile.tsx`                                            |
| 新增 | `src/app/profile/page.tsx`                                         |
| 新增 | `src/func/bookingUtils.ts`                                         |
| 新增 | `storage.rules`                                                    |
| 修改 | `src/types/booking.ts` — 新增 `photoRequired`, `photoUrl`          |
| 修改 | `src/app/api/bookings/route.ts` — 新建時寫入 `photoRequired: true` |
| 修改 | `src/app/api/bookings/[id]/route.ts` — 新增 PATCH endpoint         |
| 修改 | `src/firebase/firebase.ts` — 初始化 Firebase Storage               |
| 修改 | `src/Components/NavLinks.tsx` — 改連到 `/profile`                  |
| 修改 | `src/views/ApplyForm.tsx` — 送出前檢查待完成                       |
| 修改 | `firebase.json` — 加入 Storage rules 設定與 emulator port          |

---

## 部署注意

```bash
# Storage rules 需要單獨 deploy 才會生效
firebase deploy --only storage
```

首次使用 `/profile` 若 Firestore 回報缺少複合索引（`email` + `startTime`），點錯誤訊息中的連結即可自動建立，建完後執行：

```bash
firebase deploy --only firestore:indexes
```

