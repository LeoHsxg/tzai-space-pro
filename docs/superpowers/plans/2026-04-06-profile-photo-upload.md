# 個人檔案 + 拍照上傳 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增「個人檔案」頁面，列出使用者借用紀錄（待完成/即將到來/歷史紀錄），並強制使用者在借用結束後上傳照片，有待完成項目時不能新增預約。

**Architecture:** 前端用 Firestore `onSnapshot` 即時訂閱該使用者的所有 booking，依 `photoRequired`、`photoUrl`、`endTime` 在客戶端分成三個 section。照片直接從瀏覽器上傳至 Firebase Storage，取得 URL 後呼叫 PATCH API 寫回 Firestore（一致沿用現有 Admin SDK 寫入模式）。申請頁在送出前做一次性 Firestore 查詢，如有待完成項目則擋住。

**Tech Stack:** Next.js 15 App Router · TypeScript · Firebase Firestore (client SDK onSnapshot + Admin SDK for writes) · Firebase Storage (client SDK upload) · Tailwind CSS · lucide-react · sonner toast

---

## 檔案異動總覽

| 動作 | 路徑 |
|------|------|
| 修改 | `src/types/booking.ts` |
| 修改 | `src/firebase/firebase.ts` |
| 修改 | `src/app/api/bookings/route.ts` |
| 修改 | `src/app/api/bookings/[id]/route.ts` |
| 新增 | `src/func/bookingUtils.ts` |
| 修改 | `src/Components/NavLinks.tsx` |
| 新增 | `src/app/profile/page.tsx` |
| 新增 | `src/views/Profile.tsx` |
| 修改 | `src/views/ApplyForm.tsx` |
| 新增 | `storage.rules` |
| 修改 | `firebase.json` |

---

## Task 1: 擴充 Booking 型別

**Files:**
- Modify: `src/types/booking.ts`

- [ ] **Step 1: 更新型別定義**

將 `src/types/booking.ts` 改為：

```typescript
import { Timestamp } from "firebase/firestore";

export type Booking = {
  id: string;
  calendarEventId?: string | null;
  room: string;
  name: string;
  email: string;
  phone: string;
  crowdSize: number;
  description: string;
  startTime: Timestamp;
  endTime: Timestamp;
  createdAt: Timestamp;
  status: "active" | "cancelled";
  photoRequired?: boolean;   // true → 此筆借用需要上傳照片（舊資料無此欄位）
  photoUrl?: string | null;  // Firebase Storage 下載 URL，上傳後寫入
};
```

- [ ] **Step 2: 確認 TypeScript 不報錯**

```bash
npm run lint
```

Expected: 無新增錯誤（舊程式碼對新 optional field 不影響）。

- [ ] **Step 3: Commit**

```bash
git add src/types/booking.ts
git commit -m "feat: add photoRequired and photoUrl fields to Booking type"
```

---

## Task 2: 初始化 Firebase Storage

**Files:**
- Modify: `src/firebase/firebase.ts`

- [ ] **Step 1: 加入 Storage 初始化**

將 `src/firebase/firebase.ts` 的 import 行改為：

```typescript
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";
```

在 `export const db = getFirestore(app);` 下方新增：

```typescript
export const storage = getStorage(app);
```

- [ ] **Step 2: 確認 firebase/storage 套件存在**

```bash
node -e "require('firebase/storage'); console.log('ok')"
```

Expected: 印出 `ok`（firebase SDK 已含 storage，無需另外安裝）。

- [ ] **Step 3: Commit**

```bash
git add src/firebase/firebase.ts
git commit -m "feat: initialize and export Firebase Storage instance"
```

---

## Task 3: 新增 Firebase Storage Rules

**Files:**
- Create: `storage.rules`
- Modify: `firebase.json`

- [ ] **Step 1: 建立 storage.rules**

建立 `storage.rules`：

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // bookings/{bookingId}/ 下的任何檔案
    match /bookings/{bookingId}/{allPaths=**} {
      allow read: if true;                        // 公開讀（方便顯示照片）
      allow write: if request.auth != null;       // 登入才能上傳
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

- [ ] **Step 2: 將 storage 加入 firebase.json**

在 `firebase.json` 的 `"firestore": {...}` 區塊後面加上（與 firestore 同層）：

```json
"storage": {
  "rules": "storage.rules"
},
```

- [ ] **Step 3: Commit**

```bash
git add storage.rules firebase.json
git commit -m "feat: add Firebase Storage rules and register in firebase.json"
```

---

## Task 4: POST /api/bookings 寫入 photoRequired

**Files:**
- Modify: `src/app/api/bookings/route.ts`

- [ ] **Step 1: 在 transaction.set 中加入新欄位**

找到 `transaction.set(newRef, { ... })` 區塊，在現有欄位最後加入：

```typescript
photoRequired: true,
photoUrl: null,
```

完整的 `transaction.set` 呼叫應該是：

```typescript
transaction.set(newRef, {
  calendarEventId: null,
  room,
  name,
  email,
  phone,
  crowdSize: parseInt(crowdSize),
  description: eventDescription,
  startTime,
  endTime,
  createdAt: Timestamp.now(),
  status: "active",
  photoRequired: true,
  photoUrl: null,
});
```

- [ ] **Step 2: 驗證**

啟動 `npm run dev`，送出一筆預約，到 Firebase Console → Firestore → `bookings` collection，確認最新文件有 `photoRequired: true` 和 `photoUrl: null` 欄位。

- [ ] **Step 3: Commit**

```bash
git add src/app/api/bookings/route.ts
git commit -m "feat: set photoRequired=true and photoUrl=null on new bookings"
```

---

## Task 5: 新增 PATCH /api/bookings/[id] 更新 photoUrl

**Files:**
- Modify: `src/app/api/bookings/[id]/route.ts`

- [ ] **Step 1: 在現有 DELETE handler 後面新增 PATCH handler**

在 `src/app/api/bookings/[id]/route.ts` 末尾（`DELETE` function 之後）加入：

```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. 驗證 ID Token
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ message: "未登入" }, { status: 401 });
  }
  let email: string;
  try {
    const token = authHeader.replace("Bearer ", "");
    const decoded = await adminAuth.verifyIdToken(token);
    email = decoded.email!;
  } catch {
    return NextResponse.json({ message: "Token 無效" }, { status: 401 });
  }

  // 2. 取得預約資料
  const { id } = await params;
  const docRef = adminDb.collection("bookings").doc(id);
  const snap = await docRef.get();

  if (!snap.exists) {
    return NextResponse.json({ message: "找不到該預約" }, { status: 404 });
  }

  const booking = snap.data()!;

  // 3. 確認本人才能更新
  if (booking.email !== email) {
    return NextResponse.json({ message: "無權限修改他人預約" }, { status: 403 });
  }

  // 4. 只允許更新 photoUrl
  const { photoUrl } = await request.json();
  if (typeof photoUrl !== "string" || !photoUrl.startsWith("https://")) {
    return NextResponse.json({ message: "無效的 photoUrl" }, { status: 400 });
  }

  await docRef.update({ photoUrl });

  return NextResponse.json({ message: "更新成功" }, { status: 200 });
}
```

- [ ] **Step 2: 確認 lint 通過**

```bash
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/bookings/[id]/route.ts
git commit -m "feat: add PATCH /api/bookings/[id] to update photoUrl"
```

---

## Task 6: 建立 bookingUtils helper

**Files:**
- Create: `src/func/bookingUtils.ts`

- [ ] **Step 1: 建立 helper 函式**

建立 `src/func/bookingUtils.ts`：

```typescript
import { Booking } from "@/types/booking";

/**
 * 判斷使用者是否有「待完成」的借用（endTime 已過、需上傳照片、尚未上傳）
 */
export function hasPendingPhoto(bookings: Booking[]): boolean {
  const now = Date.now();
  return bookings.some(
    (b) =>
      b.photoRequired === true &&
      !b.photoUrl &&
      b.endTime.toMillis() < now
  );
}

/**
 * 判斷單一 booking 屬於哪個 section
 */
export type BookingSection = "pending" | "upcoming" | "history";

export function getBookingSection(b: Booking): BookingSection {
  const now = Date.now();
  const ended = b.endTime.toMillis() < now;

  if (b.photoRequired === true && !b.photoUrl && ended) return "pending";
  if (b.status === "active" && !ended) return "upcoming";
  return "history";
}
```

- [ ] **Step 2: 確認 lint 通過**

```bash
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add src/func/bookingUtils.ts
git commit -m "feat: add bookingUtils helper (hasPendingPhoto, getBookingSection)"
```

---

## Task 7: 更新 NavLinks（console → profile）

**Files:**
- Modify: `src/Components/NavLinks.tsx`

- [ ] **Step 1: 將 console link 改為 profile**

在 `src/Components/NavLinks.tsx` 中，找到所有 `/console` 的 `Link`，改為 `/profile`。

Mobile（md:hidden）區塊：

```tsx
<Link href="/profile">
  <img
    src={currentPath === '/profile' ? '/img/settings_h.svg' : '/img/settings_h.svg'}
    alt="Profile"
    className={currentPath === '/profile' ? 'icon_s' : 'icon_h'}
  />
</Link>
```

Desktop（hidden md:flex）區塊：

```tsx
<Link href="/profile">
  <div className="noto text-sm font-medium text-gray-600">個人檔案</div>
</Link>
```

- [ ] **Step 2: 手動驗證**

`npm run dev`，確認底部 nav 最右側點擊後前往 `/profile`（此時會 404，Task 8 完成後才正常）。Console 的入口已移除，但 `/console` 直接輸入 URL 仍可進入。

- [ ] **Step 3: Commit**

```bash
git add src/Components/NavLinks.tsx
git commit -m "feat: update NavLinks to link to /profile instead of /console"
```

---

## Task 8: 建立 Profile 頁面

**Files:**
- Create: `src/app/profile/page.tsx`
- Create: `src/views/Profile.tsx`

- [ ] **Step 1: 建立 page.tsx（沿用現有模式）**

建立 `src/app/profile/page.tsx`：

```typescript
import Profile from '../../views/Profile'
export default Profile
```

- [ ] **Step 2: 建立 Profile.tsx**

建立 `src/views/Profile.tsx`：

```tsx
'use client'

import React, { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";
import { Booking } from "../types/booking";
import { getBookingSection } from "../func/bookingUtils";
import { toast } from "sonner";
import dayjs from "dayjs";

const Profile: React.FC = () => {
  const user = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [uploading, setUploading] = useState<string | null>(null); // bookingId being uploaded
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    const q = query(
      collection(db, "bookings"),
      where("email", "==", user.email)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Booking));
      // 依 startTime 降冪排序（最新在前）
      data.sort((a, b) => b.startTime.toMillis() - a.startTime.toMillis());
      setBookings(data);
    });
    return () => unsub();
  }, [user?.email]);

  const pending = bookings.filter((b) => getBookingSection(b) === "pending");
  const upcoming = bookings.filter((b) => getBookingSection(b) === "upcoming");
  const history = bookings.filter((b) => getBookingSection(b) === "history");

  const handleUploadClick = (bookingId: string) => {
    uploadTargetRef.current = bookingId;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const bookingId = uploadTargetRef.current;
    if (!file || !bookingId || !user) return;

    // Reset file input for re-use
    e.target.value = "";

    setUploading(bookingId);
    try {
      // 1. Upload to Firebase Storage
      const ext = file.name.split(".").pop() ?? "jpg";
      const storageRef = ref(storage, `bookings/${bookingId}/${Date.now()}.${ext}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      // 2. PATCH Firestore via API route
      const token = await user.getIdToken();
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ photoUrl: downloadUrl }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "更新失敗");
      }
      toast.success("照片上傳成功！");
    } catch (err) {
      toast.error((err as Error).message || "上傳失敗，請再試一次");
    } finally {
      setUploading(null);
      uploadTargetRef.current = null;
    }
  };

  const formatTime = (b: Booking) =>
    `${dayjs(b.startTime.toDate()).format("MM/DD HH:mm")} – ${dayjs(b.endTime.toDate()).format("HH:mm")}`;

  if (!user) {
    return (
      <div className="w-full pb-20 md:pb-0 px-[8%] md:max-w-[900px] md:m-auto flex items-center justify-center min-h-[40vh]">
        <p className="noto text-sm text-black/50">請先登入以查看個人檔案</p>
      </div>
    );
  }

  return (
    <div className="w-full pb-20 md:pb-0 md:mt-4">
      <div className="w-full md:max-w-[900px] m-auto">
        <p className="-mt-1 mb-1 px-[8%] noto font-bold text-black/80 text-lg md:mt-0 md:pl-4 md:pr-0">
          個人檔案
        </p>
        <p className="mb-4 px-[8%] noto text-xs text-black/40 md:pl-4 md:pr-0">{user.email}</p>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col gap-6 px-[8%] md:px-4">
          {/* 待完成 */}
          <section>
            <h2 className="noto text-sm font-semibold text-red-500 mb-2">
              待完成 {pending.length > 0 && `(${pending.length})`}
            </h2>
            {pending.length === 0 ? (
              <p className="noto text-xs text-black/30">目前沒有待完成項目</p>
            ) : (
              <div className="flex flex-col gap-2">
                {pending.map((b) => (
                  <div key={b.id} className="bg-white rounded-xl p-4 flex flex-col gap-2 border border-red-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="noto font-semibold text-sm text-black/80">{b.room}</p>
                        <p className="noto text-xs text-black/40">{formatTime(b)}</p>
                      </div>
                      <button
                        onClick={() => handleUploadClick(b.id)}
                        disabled={uploading === b.id}
                        className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold noto hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploading === b.id ? "上傳中…" : "上傳照片"}
                      </button>
                    </div>
                    <p className="noto text-xs text-red-400">請上傳使用後的空間照片以完成借用紀錄</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 即將到來 */}
          <section>
            <h2 className="noto text-sm font-semibold text-blue-500 mb-2">
              即將到來 {upcoming.length > 0 && `(${upcoming.length})`}
            </h2>
            {upcoming.length === 0 ? (
              <p className="noto text-xs text-black/30">目前沒有即將到來的借用</p>
            ) : (
              <div className="flex flex-col gap-2">
                {upcoming.map((b) => (
                  <div key={b.id} className="bg-white rounded-xl p-4 border border-blue-50">
                    <p className="noto font-semibold text-sm text-black/80">{b.room}</p>
                    <p className="noto text-xs text-black/40">{formatTime(b)}</p>
                    <p className="noto text-xs text-black/30 mt-1">{b.description}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 歷史紀錄 */}
          <section>
            <h2 className="noto text-sm font-semibold text-black/40 mb-2">歷史紀錄</h2>
            {history.length === 0 ? (
              <p className="noto text-xs text-black/30">尚無歷史紀錄</p>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map((b) => (
                  <div key={b.id} className="bg-white rounded-xl p-4 border border-gray-100 opacity-70">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="noto font-semibold text-sm text-black/60">{b.room}</p>
                        <p className="noto text-xs text-black/30">{formatTime(b)}</p>
                      </div>
                      {b.status === "cancelled" && (
                        <span className="text-xs text-black/30 noto">已取消</span>
                      )}
                      {b.photoUrl && (
                        <a
                          href={b.photoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 noto underline"
                        >
                          查看照片
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
```

- [ ] **Step 3: 手動驗證**

`npm run dev`，以 Google 登入後前往 `/profile`：
- 確認頁面正確顯示三個 section
- 確認 onSnapshot 取得的是該使用者的 booking
- 如果 Firestore Console 報 index 錯誤，點擊錯誤訊息中的連結自動建立複合索引

- [ ] **Step 4: 測試照片上傳**

在 `/profile` 的「待完成」項目中點擊「上傳照片」，選一張圖片：
- Firebase Console → Storage → `bookings/{id}/` 確認圖片存在
- Firebase Console → Firestore → `bookings/{id}` 確認 `photoUrl` 已更新
- 該 booking 應自動移至「歷史紀錄」section（onSnapshot 觸發）

- [ ] **Step 5: Commit**

```bash
git add src/app/profile/page.tsx src/views/Profile.tsx
git commit -m "feat: add Profile page with pending/upcoming/history sections and photo upload"
```

---

## Task 9: ApplyForm 新增待完成檢查

**Files:**
- Modify: `src/views/ApplyForm.tsx`

- [ ] **Step 1: 在 ApplyForm 加入 import**

在 `src/views/ApplyForm.tsx` 的 import 區塊新增：

```typescript
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { Booking } from "../types/booking";
```

- [ ] **Step 2: 在 handleSubmit 開頭加入待完成檢查**

在 `handleSubmit` 的 `if (!applicantName || ...)` 驗證之後、`showDialog("處理中...")` 之前，插入：

```typescript
// 檢查是否有待完成（未上傳照片）的借用
if (user) {
  const pendingSnap = await getDocs(
    query(
      collection(db, "bookings"),
      where("email", "==", user.email),
      where("photoRequired", "==", true),
      where("photoUrl", "==", null)
    )
  );
  const now = Date.now();
  const hasPending = pendingSnap.docs.some(
    (doc) => (doc.data() as Booking).endTime.toMillis() < now
  );
  if (hasPending) {
    showSnackbar("你有借用尚未上傳照片，請先至個人檔案完成上傳", "warning");
    return;
  }
}
```

- [ ] **Step 3: 手動驗證**

在 Firestore Console 手動把一筆 booking 的 `photoRequired` 改成 `true`、`photoUrl` 改成 `null`、`endTime` 改成過去時間。
到申請頁送出預約，應看到「你有借用尚未上傳照片…」的 toast 且無法送出。
把 photoUrl 填上任意 URL 後，再試一次，應能正常送出。

- [ ] **Step 4: Commit**

```bash
git add src/views/ApplyForm.tsx
git commit -m "feat: block new booking submission when user has pending photo uploads"
```

---

## 後續手動步驟（部署前）

- [ ] 部署 Storage Rules：`firebase deploy --only storage`
- [ ] 確認 Firebase Console → Storage Rules 已更新
- [ ] 若開發時遇到 Firestore 缺少複合索引的錯誤，點連結建立索引後執行 `firebase deploy --only firestore:indexes`
