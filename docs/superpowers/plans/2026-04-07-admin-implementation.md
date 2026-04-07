# Admin System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 admin 識別機制，讓管理員可刪除任何 booking，並在刪除時自動清理 Storage 照片。

**Architecture:** 以 Firestore `admins/{email}` collection 識別管理員；server-side 透過 `isAdmin()` helper 驗證；client-side 透過 `useIsAdmin()` hook 控制 UI 顯示。Storage 路徑解析邏輯抽成共用 `storageUtils.ts`，供刪除 booking 與刪除照片兩個 API 共用。

**Tech Stack:** Next.js App Router API Routes, Firebase Admin SDK (Firestore + Storage), Firebase client SDK (Firestore), React hooks, TypeScript

---

## File Map

| 動作 | 路徑 | 說明 |
|------|------|------|
| Create | `src/lib/isAdmin.ts` | Server-side admin 驗證 helper |
| Create | `src/lib/storageUtils.ts` | Storage URL 解析（從 photo/route.ts 抽出） |
| Create | `src/hooks/useIsAdmin.ts` | Client-side admin 狀態 hook |
| Modify | `src/app/api/bookings/[id]/route.ts` | DELETE 加 admin bypass + storage cleanup |
| Modify | `src/app/api/bookings/[id]/photo/route.ts` | 改用 storageUtils |
| Modify | `src/Components/MyDialog.tsx` | 加 useIsAdmin，調整刪除按鈕顯示條件 |
| Modify | `firestore.rules` | 加 admins collection rules |

---

## Task 1: 抽出共用 Storage 工具

**Files:**
- Create: `src/lib/storageUtils.ts`
- Modify: `src/app/api/bookings/[id]/photo/route.ts`

- [ ] **Step 1: 建立 `src/lib/storageUtils.ts`**

```ts
/**
 * 從 Firebase Storage 下載 URL 解析出 Storage 內部路徑。
 * 只處理 googleapis.com/v0/b/.../o/... 格式。
 * 若 URL 格式不符，回傳 null（Storage 孤兒檔可接受）。
 *
 * 例：https://firebasestorage.googleapis.com/v0/b/tzai-space-pro.firebasestorage.app/o/bookings%2Fabc%2F123.jpg?alt=media&token=xxx
 *  → "bookings/abc/123.jpg"
 */
export function parseStoragePath(photoUrl: string): string | null {
  try {
    const url = new URL(photoUrl);
    const parts = url.pathname.split("/o/");
    if (parts.length < 2) return null;
    return decodeURIComponent(parts[1]);
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: 更新 `src/app/api/bookings/[id]/photo/route.ts`**

移除檔案中第 26-35 行的 `parseStoragePath` 函式定義，並在頂部 imports 區加入：

```ts
import { parseStoragePath } from "@/lib/storageUtils";
```

（函式邏輯完全相同，只是改為從共用模組 import。）

- [ ] **Step 3: 確認 build 通過**

```bash
npm run build
```

Expected: 無 TypeScript 錯誤，build 成功。

- [ ] **Step 4: Commit**

```bash
git add src/lib/storageUtils.ts src/app/api/bookings/[id]/photo/route.ts
git commit -m "refactor: extract parseStoragePath to lib/storageUtils"
```

---

## Task 2: Server-side isAdmin helper

**Files:**
- Create: `src/lib/isAdmin.ts`

- [ ] **Step 1: 建立 `src/lib/isAdmin.ts`**

```ts
import { adminDb } from "@/firebase/admin";

/**
 * 查 Firestore admins/{email}，確認是否為管理員。
 * @param email - 已由 Firebase Auth 驗證過的 email
 * @returns Promise<boolean>
 */
export async function isAdmin(email: string): Promise<boolean> {
  const snap = await adminDb.collection("admins").doc(email).get();
  return snap.exists;
}
```

- [ ] **Step 2: 確認 build 通過**

```bash
npm run build
```

Expected: 無錯誤。

- [ ] **Step 3: Commit**

```bash
git add src/lib/isAdmin.ts
git commit -m "feat: add server-side isAdmin helper"
```

---

## Task 3: Client-side useIsAdmin hook

**Files:**
- Create: `src/hooks/useIsAdmin.ts`

- [ ] **Step 1: 建立 `src/hooks/useIsAdmin.ts`**

```ts
"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/hooks/useAuth";

/**
 * 查 Firestore admins/{email}，回傳當前使用者是否為管理員。
 * 未登入時 isAdmin = false。
 */
export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const user = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    getDoc(doc(db, "admins", user.email)).then((snap) => {
      setIsAdmin(snap.exists());
      setLoading(false);
    });
  }, [user?.email]);

  return { isAdmin, loading };
}
```

- [ ] **Step 2: 確認 build 通過**

```bash
npm run build
```

Expected: 無錯誤。

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useIsAdmin.ts
git commit -m "feat: add client-side useIsAdmin hook"
```

---

## Task 4: Firestore rules — 加入 admins collection

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: 更新 `firestore.rules`**

完整替換為：

```
service cloud.firestore {
  match /databases/{database}/documents {

    match /admins/{email} {
      // 只有本人可讀自己是否為管理員（client SDK 查詢用）
      // 寫入只允許 Admin SDK（server-side），client 一律禁止
      allow read: if request.auth != null && request.auth.token.email == email;
      allow write: if false;
    }

    match /regulations/current {
      allow read: if true;
      allow write: if false;
    }

    match /bookings/{bookingId} {
      allow read: if true;    // 任何人可讀（Calendar 頁公開顯示）
      allow write: if false;  // 所有寫入走 API Route（Admin SDK 繞過此規則）
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add firestore.rules
git commit -m "feat: add admins collection read rules to firestore.rules"
```

---

## Task 5: 更新 DELETE /api/bookings/[id]（admin bypass + storage cleanup）

**Files:**
- Modify: `src/app/api/bookings/[id]/route.ts`

目前 DELETE handler 只做 Firestore 軟刪除，且僅允許本人刪除，也不清理 Storage。

- [ ] **Step 1: 更新 `src/app/api/bookings/[id]/route.ts`**

將整個檔案改為（保留原本 `PATCH` function 不變，只改 imports 和 `DELETE`）：

```ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth, adminStorage } from "@/firebase/admin";
import { isAdmin } from "@/lib/isAdmin";
import { parseStoragePath } from "@/lib/storageUtils";

/** Verify Bearer token, return email or a NextResponse error */
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

  // 非本人 → 確認是否為管理員
  if (booking.email !== email && !(await isAdmin(email))) {
    return NextResponse.json({ message: "無權限刪除他人預約" }, { status: 403 });
  }

  // 若有照片，先清理 Storage（失敗不阻擋主流程）
  if (booking.photoUrl) {
    const storagePath = parseStoragePath(booking.photoUrl);
    if (storagePath) {
      try {
        await adminStorage.bucket().file(storagePath).delete();
      } catch {
        // Storage 孤兒檔可接受，繼續軟刪除
      }
    }
  }

  // 軟刪除（保留歷史紀錄）
  await docRef.update({ status: "cancelled" });

  return NextResponse.json({ message: "刪除成功" }, { status: 200 });
}

const FIREBASE_STORAGE_HOST = "firebasestorage.googleapis.com";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyToken(request);
  if (auth instanceof NextResponse) return auth;
  const { email } = auth;

  const { id } = await params;
  const docRef = adminDb.collection("bookings").doc(id);

  // 解析並驗證 photoUrl（在 transaction 前）
  const { photoUrl } = await request.json();
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(photoUrl);
  } catch {
    return NextResponse.json({ message: "無效的 photoUrl" }, { status: 400 });
  }
  if (parsedUrl.protocol !== "https:" || !parsedUrl.hostname.endsWith(FIREBASE_STORAGE_HOST)) {
    return NextResponse.json({ message: "photoUrl 必須來自 Firebase Storage" }, { status: 400 });
  }

  // 原子操作：確認所有權、狀態、尚未上傳，再寫入
  try {
    await adminDb.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) throw new Error("NOT_FOUND");

      const booking = snap.data()!;
      if (booking.email !== email) throw new Error("FORBIDDEN");
      if (booking.status === "cancelled") throw new Error("CANCELLED");
      if (booking.photoUrl) throw new Error("ALREADY_UPLOADED");

      transaction.update(docRef, { photoUrl });
    });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === "NOT_FOUND") return NextResponse.json({ message: "找不到該預約" }, { status: 404 });
    if (msg === "FORBIDDEN") return NextResponse.json({ message: "無權限修改他人預約" }, { status: 403 });
    if (msg === "CANCELLED") return NextResponse.json({ message: "已取消的預約無法上傳照片" }, { status: 409 });
    if (msg === "ALREADY_UPLOADED") return NextResponse.json({ message: "照片已上傳，不可覆蓋" }, { status: 409 });
    return NextResponse.json({ message: "伺服器錯誤" }, { status: 500 });
  }

  return NextResponse.json({ message: "更新成功", photoUrl }, { status: 200 });
}
```

- [ ] **Step 2: 確認 build 通過**

```bash
npm run build
```

Expected: 無錯誤。

- [ ] **Step 3: Commit**

```bash
git add src/app/api/bookings/[id]/route.ts
git commit -m "feat: admin bypass + storage cleanup on booking delete"
```

---

## Task 6: 更新 MyDialog.tsx（admin 刪除按鈕）

**Files:**
- Modify: `src/Components/MyDialog.tsx`

- [ ] **Step 1: 更新 `src/Components/MyDialog.tsx`**

完整替換為：

```tsx
'use client'

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Booking } from "../types/booking";
import { useAuth } from "../hooks/useAuth";
import { useUI } from "../context/UIContext";
import { useIsAdmin } from "../hooks/useIsAdmin";
import dayjs from "dayjs";

interface MyDialogProps {
  open: boolean;
  onClose: () => void;
  booking: Booking | null;
}

const MyDialog: React.FC<MyDialogProps> = ({ open, onClose, booking }) => {
  const user = useAuth();
  const { showSnackbar, showDialog, hideDialog } = useUI();
  const { isAdmin } = useIsAdmin();

  const handleDelete = async () => {
    if (!booking || !user) return;
    try {
      onClose();
      showDialog("刪除預約中...");
      const token = await user.getIdToken();
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      hideDialog();
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "刪除失敗");
      showSnackbar("刪除成功", "success");
    } catch (error) {
      hideDialog();
      showSnackbar(error instanceof Error ? error.message : "刪除失敗", "error");
    }
  };

  const isEventOwner = user?.email === booking?.email;
  const eventStarted = booking ? dayjs(booking.startTime.toDate()).isBefore(dayjs()) : false;
  const canDelete = isAdmin || (isEventOwner && !eventStarted);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-bold text-black/80">{booking?.room}</DialogTitle>
        </DialogHeader>
        {!booking ? (
          <div>加載不出資料欸？</div>
        ) : (
          <div className="space-y-0.5 text-sm text-muted-foreground">
            <div>
              <span className="font-bold text-foreground">姓名</span>&nbsp;{booking.name}
            </div>
            <div>
              <span className="font-bold text-foreground">郵件</span>&nbsp;{booking.email}
            </div>
            <div>
              <span className="font-bold text-foreground">人數</span>&nbsp;{booking.crowdSize}
            </div>
            <div>
              <span className="font-bold text-foreground">起始</span>&nbsp;
              {dayjs(booking.startTime.toDate()).format("YYYY-MM-DD HH:mm")}
            </div>
            <div>
              <span className="font-bold text-foreground">結束</span>&nbsp;
              {dayjs(booking.endTime.toDate()).format("YYYY-MM-DD HH:mm")}
            </div>
            <div>
              <span className="font-bold text-foreground">簡述</span>&nbsp;{booking.description}
            </div>
          </div>
        )}
        <DialogFooter>
          {canDelete && (
            <Button variant="destructive" onClick={handleDelete}>
              刪除預約
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            關閉
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MyDialog;
```

- [ ] **Step 2: 確認 build 通過**

```bash
npm run build
```

Expected: 無錯誤。

- [ ] **Step 3: 手動驗證（dev server）**

```bash
npm run dev
```

驗證：
- 一般使用者：只有自己**尚未開始**的 booking 才出現刪除按鈕
- 一般使用者：已開始的 booking 無刪除按鈕
- Admin 帳號（Firestore Console 手動新增 `admins/{email}`）：任意 booking 都有刪除按鈕

- [ ] **Step 4: Commit**

```bash
git add src/Components/MyDialog.tsx
git commit -m "feat: show delete button to admin for any booking"
```

---

## Task 7: 部署 Firestore Rules + 建立初始管理員

- [ ] **Step 1: 部署 rules**

```bash
firebase deploy --only firestore:rules
```

Expected: `Deploy complete!`

- [ ] **Step 2: 在 Firebase Console 手動建立初始管理員**

Firestore Console → `admins` collection → 新增文件：
- Document ID: `{管理員 email}`
- 欄位: `addedAt` (Timestamp)

- [ ] **Step 3: 驗證 admin 功能生效**

用 admin 帳號登入，確認 MyDialog 對任意 booking 顯示刪除按鈕。

---

## 完成後驗收清單

- [ ] `admins/{email}` 只有本人能讀（其他帳號讀被 Firestore rules 拒）
- [ ] Admin 可刪除任意 booking（他人的、已開始的）
- [ ] 一般使用者刪除自己**尚未開始**的 booking → 成功
- [ ] 一般使用者點已開始的 booking → 無刪除按鈕
- [ ] 一般使用者用 API 嘗試刪他人 booking → 403
- [ ] 刪除有 `photoUrl` 的 booking → Storage 檔案一併刪除
- [ ] `npm run build` 無錯誤
