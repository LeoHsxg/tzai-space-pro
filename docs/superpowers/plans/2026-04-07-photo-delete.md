# Photo Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓上傳者能在 Profile 頁面刪除自己已上傳的照片，刪除後借用自動退回「待完成」狀態。

**Architecture:** 新增 `DELETE /api/bookings/[id]/photo` API Route，後端用 Admin SDK 同時刪除 Firebase Storage 檔案並清空 Firestore `photoUrl`。前端在歷史紀錄照片展開時滑出刪除按鈕，點擊後顯示 Dialog 確認，確認後呼叫 API。

**Tech Stack:** Next.js App Router API Routes、Firebase Admin SDK（Firestore + Storage）、React state、Tailwind CSS、既有 `Dialog` 元件（`@base-ui/react`）

---

## File Map

| 路徑 | 異動 |
|------|------|
| `src/firebase/admin.ts` | 新增 `adminStorage` export |
| `src/app/api/bookings/[id]/photo/route.ts` | 新增（DELETE handler） |
| `src/views/Profile.tsx` | 新增 state、刪除按鈕 UI、確認 Dialog、handleDeletePhoto |

---

## Task 1：在 admin.ts 匯出 adminStorage

**Files:**
- Modify: `src/firebase/admin.ts`

- [ ] **Step 1: 在 admin.ts 新增 adminStorage export**

將 `src/firebase/admin.ts` 改為：

```typescript
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

if (!getApps().length) {
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
      storageBucket: "tzai-space-pro.firebasestorage.app",
    });
  } else {
    initializeApp({
      storageBucket: "tzai-space-pro.firebasestorage.app",
    });
  }
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
export const adminStorage = getStorage();
```

- [ ] **Step 2: 確認 TypeScript 沒有報錯**

```bash
npx tsc --noEmit
```

Expected: 無錯誤輸出（或只有既有的非相關警告）

- [ ] **Step 3: Commit**

```bash
git add src/firebase/admin.ts
git commit -m "feat: export adminStorage from admin.ts"
```

---

## Task 2：新增 DELETE /api/bookings/[id]/photo

**Files:**
- Create: `src/app/api/bookings/[id]/photo/route.ts`

- [ ] **Step 1: 建立檔案與 DELETE handler**

建立 `src/app/api/bookings/[id]/photo/route.ts`：

```typescript
import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth, adminStorage } from "@/firebase/admin";

async function verifyToken(request: NextRequest): Promise<{ email: string } | NextResponse> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ message: "未登入" }, { status: 401 });
  }
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.replace("Bearer ", ""));
    if (!decoded.email) {
      return NextResponse.json({ message: "帳號未綁定 Email" }, { status: 403 });
    }
    return { email: decoded.email };
  } catch {
    return NextResponse.json({ message: "Token 無效" }, { status: 401 });
  }
}

/** 從 Firebase Storage 下載 URL 解析出 Storage 內部路徑
 *  例：https://firebasestorage.googleapis.com/v0/b/tzai-space-pro.firebasestorage.app/o/bookings%2Fabc%2F123.jpg?alt=media&token=xxx
 *  → "bookings/abc/123.jpg"
 */
function parseStoragePath(photoUrl: string): string | null {
  try {
    const url = new URL(photoUrl);
    const parts = url.pathname.split("/o/");
    if (parts.length < 2) return null;
    return decodeURIComponent(parts[1]);
  } catch {
    return null;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyToken(request);
  if (auth instanceof NextResponse) return auth;
  const { email } = auth;

  const { id } = await params;
  const docRef = adminDb.collection("bookings").doc(id);
  const snap = await docRef.get();

  if (!snap.exists) {
    return NextResponse.json({ message: "找不到該預約" }, { status: 404 });
  }

  const booking = snap.data()!;

  if (booking.email !== email) {
    return NextResponse.json({ message: "無權限刪除他人照片" }, { status: 403 });
  }

  if (!booking.photoUrl) {
    return NextResponse.json({ message: "此預約尚未上傳照片" }, { status: 409 });
  }

  // 嘗試刪除 Storage 檔案（失敗不阻擋主流程）
  const storagePath = parseStoragePath(booking.photoUrl);
  if (storagePath) {
    try {
      await adminStorage.bucket().file(storagePath).delete();
    } catch {
      // Storage 孤兒檔可接受，繼續清空 Firestore
    }
  }

  // 清空 photoUrl（pending 判斷邏輯依賴 photoUrl === null，自動退回待完成）
  await docRef.update({ photoUrl: null });

  return NextResponse.json({ message: "照片已刪除" }, { status: 200 });
}
```

- [ ] **Step 2: 確認 TypeScript 無報錯**

```bash
npx tsc --noEmit
```

Expected: 無新增錯誤

- [ ] **Step 3: 用 dev server 手動測試 API 是否可存取**

```bash
npm run dev
```

在瀏覽器開 DevTools Console，以已登入的 user 執行（bookingId 換成一筆有 photoUrl 的真實 booking ID）：

```javascript
const token = await firebase.auth().currentUser.getIdToken();
const res = await fetch('/api/bookings/YOUR_BOOKING_ID/photo', {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${token}` }
});
console.log(res.status, await res.json());
```

Expected：`200 { message: "照片已刪除" }` 且 Firestore console 中該 booking 的 `photoUrl` 變為 `null`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/bookings/[id]/photo/route.ts
git commit -m "feat: add DELETE /api/bookings/[id]/photo endpoint"
```

---

## Task 3：Profile.tsx — 新增 state 與 handleDeletePhoto

**Files:**
- Modify: `src/views/Profile.tsx`

- [ ] **Step 1: 新增 import 與 state**

在 `src/views/Profile.tsx` 的 import 區塊加入 Dialog 相關元件：

```typescript
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/Components/ui/dialog";
```

在現有 state 宣告區塊（`expandedPhoto`、`loadingPhoto` 附近）新增兩個 state：

```typescript
const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);   // 正在執行刪除的 bookingId
const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null); // 打開確認 dialog 的 bookingId
```

- [ ] **Step 2: 新增 handleDeletePhoto 函式**

在 `togglePhoto` 函式之後加入：

```typescript
const handleDeletePhoto = async (bookingId: string) => {
  if (!user) return;
  setConfirmDeleteId(null);
  setDeletingPhoto(bookingId);
  try {
    const token = await user.getIdToken();
    const res = await fetch(`/api/bookings/${bookingId}/photo`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message ?? "刪除失敗");
    }
    toast.success("照片已刪除，借用退回待完成");
    setExpandedPhoto(null);
  } catch (err) {
    toast.error((err as Error).message || "刪除失敗，請再試一次");
  } finally {
    setDeletingPhoto(null);
  }
};
```

- [ ] **Step 3: 確認 TypeScript 無報錯**

```bash
npx tsc --noEmit
```

Expected: 無新增錯誤

- [ ] **Step 4: Commit**

```bash
git add src/views/Profile.tsx
git commit -m "feat: add deletingPhoto state and handleDeletePhoto in Profile"
```

---

## Task 4：Profile.tsx — 刪除按鈕 UI 與確認 Dialog

**Files:**
- Modify: `src/views/Profile.tsx`

- [ ] **Step 1: 在照片展開區塊加入刪除按鈕**

找到現有的照片展開區塊（`{b.photoUrl && expandedPhoto === b.id && (` 開始的 `<div>`），在 `</div>` 結束前加入刪除按鈕：

```tsx
{b.photoUrl && expandedPhoto === b.id && (
  <div className={`mt-3 rounded-lg overflow-hidden relative ${loadingPhoto === b.id ? "min-h-[160px]" : ""}`}>
    {loadingPhoto === b.id && (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-400 rounded-full animate-spin" />
      </div>
    )}
    <img
      src={b.photoUrl}
      alt={`${b.room} 使用後照片`}
      className="w-full object-cover rounded-lg"
      onLoad={() => setLoadingPhoto(null)}
      onError={() => setLoadingPhoto(null)}
    />
    <div className="mt-2 flex justify-end">
      <button
        onClick={() => setConfirmDeleteId(b.id)}
        disabled={deletingPhoto === b.id}
        className="text-xs text-red-400 noto hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
      >
        {deletingPhoto === b.id ? (
          <>
            <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
            刪除中…
          </>
        ) : (
          "刪除照片"
        )}
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 2: 在 return 最底部（`</div>` 結束前）加入確認 Dialog**

在 `return` 的最外層 `<div>` 結束標籤前插入：

```tsx
{/* 確認刪除照片 Dialog */}
<Dialog
  open={confirmDeleteId !== null}
  onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
>
  <DialogContent showCloseButton={false}>
    <DialogHeader>
      <DialogTitle className="noto">確定要刪除這張照片嗎？</DialogTitle>
      <DialogDescription className="noto">
        刪除後此借用將退回「待完成」狀態，需要重新上傳照片才能完成紀錄。
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <button
        onClick={() => setConfirmDeleteId(null)}
        className="px-4 py-2 rounded-lg text-sm noto text-black/50 hover:text-black/70 transition-colors"
      >
        取消
      </button>
      <button
        onClick={() => confirmDeleteId && handleDeletePhoto(confirmDeleteId)}
        className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold noto hover:bg-red-600 transition-colors"
      >
        確認刪除
      </button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

- [ ] **Step 3: 在瀏覽器手動測試完整流程**

啟動 `npm run dev`，登入後前往 Profile 頁面：

1. 在「歷史紀錄」找到一筆有照片的借用
2. 點「查看照片」→ 照片展開，下方出現「刪除照片」文字按鈕
3. 點「刪除照片」→ 確認 Dialog 出現
4. 點「取消」→ Dialog 關閉，無任何變化
5. 再次點「刪除照片」→ 點「確認刪除」
6. 預期：toast 顯示「照片已刪除，借用退回待完成」，該借用從「歷史紀錄」移到「待完成」區塊

- [ ] **Step 4: Commit**

```bash
git add src/views/Profile.tsx
git commit -m "feat: add photo delete button and confirm dialog in Profile"
```
