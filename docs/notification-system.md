# 系統公告 & 通知功能

## 功能概述

讓管理員不需重新部署即可發布系統公告。使用者首次開啟時彈出公告 Modal；NavBar 右側的鈴鐺按鈕可查看歷史通知列表，點擊可看詳情。

---

## 架構

```
Firestore announcements/{YYYY-MM-DD}
  ↓ 取最新一筆（Admin SDK + unstable_cache, tag: 'announcement'）
layout.tsx (Server Component)
  ↓ prop: announcement
AppShell ('use client')
  ↓
  ├── AnnouncementModal  — 控制首頁公告 Modal
  └── NavBar
        └── NotificationBell  — 歷史通知列表 + 詳情 Modal

Admin: Console.tsx → POST /api/announcements
  → revalidateTag('announcement')  ← 觸發 layout SSR 快取失效
```

---

## Firestore Schema

```
announcements/{YYYY-MM-DD}: {
  title:       string,
  content:     string,        // markdown
  type:        "info" | "warning" | "danger",
  showModal:   boolean,
  publishedAt: Timestamp      // 排序依據，server timestamp
}
```

**Doc ID 設計**：管理員填入日期字串（`YYYY-MM-DD`），字典序 = 時間序，Firestore Console 自動照時間排列。同日覆蓋（`doc.set()`）視為合理，但 `publishedAt` 會更新為新的 server timestamp，確保同天重發時 fingerprint 不同，Modal 仍會重新跳出。

---

## 檔案清單

| 檔案 | 類型 | 說明 |
|------|------|------|
| `src/types/announcement.ts` | NEW | `AnnouncementData` 型別 |
| `src/app/api/announcements/route.ts` | NEW | GET / POST API Route |
| `src/firebase/admin.ts` | NEW | Firebase Admin SDK 初始化 |
| `src/lib/isAdmin.ts` | NEW | 查 Firestore `admins/{email}` |
| `src/hooks/useIsAdmin.ts` | NEW | client-side admin guard hook |
| `src/Components/AnnouncementModal.tsx` | NEW | 首頁公告 Modal |
| `src/Components/NotificationBell.tsx` | NEW | 鈴鐺按鈕 + 歷史列表 + 詳情 Modal |
| `src/Components/AppShell.tsx` | MODIFY | 加入 `announcement` prop + `<AnnouncementModal>` |
| `src/Components/NavBar.tsx` | MODIFY | 加入 `<NotificationBell>` |
| `src/app/layout.tsx` | MODIFY | async SSR + `getAnnouncement()` |
| `src/views/Console.tsx` | MODIFY | 管理員公告發布表單 |
| `firestore.rules` | MODIFY | 新增 `announcements` 讀取規則 |

---

## 各元件說明

### `AnnouncementModal`

- 接收 `announcement: AnnouncementData | null` prop（來自 SSR）
- 只在 `showModal: true` 的公告才渲染
- localStorage key：`seenAnnouncement`，值為 `{id}_{publishedAt}` fingerprint
  - 用 fingerprint 而非單純 id，確保同天重發也能重新彈出
- `useEffect` 內讀取 localStorage（避免 hydration mismatch）
- 使用 shadcn/ui `Dialog`，`showCloseButton={false}`，唯一關閉途徑為「我知道了」按鈕

### `NotificationBell`

- mount 時用 Firestore client SDK 讀 `announcements`（`orderBy publishedAt desc, limit 20`）
- localStorage key：`readNotifications`，值為已讀 id JSON 陣列
- unread badge：未讀數 > 0 時顯示紅色圓點數字
- **Dropdown 定位**：
  - 手機（`< sm`）：`fixed inset-x-3 top-16`，貼齊左右不超出畫面
  - 桌機（`sm:`）：`absolute right-0 top-full mt-2 w-80`
- **詳情 Modal**：點擊通知列表項目 → 開啟 Dialog 顯示完整 markdown 內容
- **關閉邏輯**：詳情 Modal 開著時，outside click handler 暫停（避免關 Modal 同時誤關 dropdown）
- 通知列表高度限制：`max-h-56`（約 3.5 筆）

### `GET /api/announcements`

- 不需 auth，讀最新一筆，供 Console 預填表單用

### `POST /api/announcements`

- 需 Firebase Auth token + `isAdmin(email)` 驗證
- body：`{ id, title, content, type, showModal }`
- 寫入後執行 `revalidateTag('announcement')` 讓 layout SSR 快取失效

---

## Firestore 安全規則

```js
match /announcements/{announcementId} {
  allow read: if true;   // 公告任何人可讀（NotificationBell client SDK 用）
  allow write: if false; // 寫入只走 API Route（Admin SDK 繞過此規則）
}
```

---

## 注意事項

| 項目 | 說明 |
|------|------|
| Timestamp 序列化 | 在 `unstable_cache` 內部轉 ISO string，不可讓 Firestore 物件跨 RSC boundary |
| localStorage 讀取時機 | 只在 `useEffect` 內讀取，初始 state 為 `false`，避免 hydration mismatch |
| `unstable_cache` 位置 | 定義在 module scope，不能在元件內部 |
| On-demand revalidation | POST 後 `revalidateTag('announcement')` 觸發快取失效；無定時刷新 |
| 多 instance 一致性 | App Hosting 多 instance 時只有收到 POST 的 instance 立即失效，其他下次請求才重取（月級更新頻率可接受） |
| `marked` 版本 | 使用 v14，`marked.parse()` 預設同步回傳 `string`，不需 `{ async: false }` option |

---

## 已知限制

- `seenAnnouncement` 在 localStorage 只存一筆（最後看過的公告），舊公告不會重複彈出
- `readNotifications` 陣列無上限，長期使用後 localStorage 可能累積舊 id（影響極小）
- Safari `signInWithPopup` 相容性問題（見 `firebase.ts` 既有備註，與本功能無關）
