# Firestore Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate booking data from Google Calendar to Firestore, replacing Cloud Functions middleware with Next.js API Routes + Firebase Client SDK.

**Architecture:** Reads use Firebase Client SDK `onSnapshot` for real-time updates. Writes and deletes go through Next.js API Routes with Admin SDK, protected by Firebase ID Token verification. A `/api/migrate` endpoint performs idempotent upsert from Google Calendar to Firestore for repeated dev use.

**Tech Stack:** Next.js 15 App Router, firebase-admin v12, firebase/firestore Client SDK, TypeScript, Firestore Security Rules

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/firebase/admin.ts` | CREATE | Admin SDK init — `adminDb`, `adminAuth` exports |
| `src/types/booking.ts` | CREATE | `Booking` type for client-side use |
| `src/app/api/bookings/route.ts` | CREATE | `POST /api/bookings` — conflict detection + write |
| `src/app/api/bookings/[id]/route.ts` | CREATE | `DELETE /api/bookings/[id]` — auth + soft delete |
| `src/app/api/migrate/route.ts` | CREATE | `POST /api/migrate` — idempotent Calendar → Firestore |
| `firestore.rules` | MODIFY | Add `bookings` read=true / write=false rules |
| `firestore.indexes.json` | MODIFY | Add composite indexes for queries |
| `src/Components/Reserve.tsx` | MODIFY | Accept `Booking` instead of `Event` |
| `src/Components/MyDialog.tsx` | MODIFY | Accept `Booking`, use token auth for delete |
| `src/views/Calendar.tsx` | MODIFY | Replace `fetch` with `onSnapshot`, use `Booking` |
| `src/views/ApplyForm.tsx` | MODIFY | Add ID Token to `/api/bookings` call |

---

### Task 1: 安裝 firebase-admin + Admin SDK 初始化

**Files:**
- Create: `src/firebase/admin.ts`
- Modify: `.env.local`
- Modify: `package.json` (npm install)

- [ ] **Step 1: 安裝 firebase-admin**

```bash
npm install firebase-admin
```

Expected: `firebase-admin` 加入 `package.json` dependencies

- [ ] **Step 2: 取得 Service Account 金鑰（本地開發用）**

1. 前往 Firebase Console → 選 `tzai-space-pro` 專案
2. 左側齒輪 → 專案設定 → **服務帳戶** 頁籤
3. 點擊「**產生新私密金鑰**」→ 下載 JSON（勿 commit 此 JSON）

- [ ] **Step 3: 加入環境變數至 `.env.local`**

從下載的 JSON 取出三個欄位，附加到 `.env.local`：

```
FIREBASE_ADMIN_PROJECT_ID=tzai-space-pro
FIREBASE_ADMIN_CLIENT_EMAIL=<JSON 中的 client_email>
FIREBASE_ADMIN_PRIVATE_KEY="<JSON 中的 private_key 完整字串，包含 -----BEGIN/END----->"
```

> ⚠️ `FIREBASE_ADMIN_PRIVATE_KEY` 必須用雙引號包住，內部的 `\n` 保持原樣不要展開為換行

- [ ] **Step 4: 建立 `src/firebase/admin.ts`**

```typescript
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    // 本地開發：使用 .env.local 的 Service Account
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    // Firebase App Hosting：使用 Application Default Credentials（無需額外設定）
    initializeApp();
  }
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
```

- [ ] **Step 5: TypeScript 型別檢查**

```bash
npx tsc --noEmit
```

Expected: 無錯誤。若出現 `Cannot find module 'firebase-admin/app'`，執行 `npm install` 後重試。

- [ ] **Step 6: Commit**

```bash
git add src/firebase/admin.ts package.json package-lock.json
git commit -m "feat: add Firebase Admin SDK initialization"
```

> `.env.local` 不加入 git（已在 `.gitignore`）

---

### Task 2: Booking type

**Files:**
- Create: `src/types/booking.ts`

- [ ] **Step 1: 建立 `src/types/booking.ts`**

```typescript
import { Timestamp } from "firebase/firestore";

export type Booking = {
  id: string;                      // Firestore doc ID
  calendarEventId?: string | null; // 遷移資料才有（Google Calendar event.id）
  room: string;                    // "書房" | "橘廳" | "會議室" | "小導師室" | "貢丸室"
  name: string;
  email: string;
  phone: string;
  crowdSize: number;
  description: string;
  startTime: Timestamp;
  endTime: Timestamp;
  createdAt: Timestamp;
  status: "active" | "cancelled";
};
```

- [ ] **Step 2: 型別檢查**

```bash
npx tsc --noEmit
```

Expected: 無錯誤

- [ ] **Step 3: Commit**

```bash
git add src/types/booking.ts
git commit -m "feat: add Booking type for Firestore"
```

---

### Task 3: Firestore Security Rules + Composite Indexes

**Files:**
- Modify: `firestore.rules`
- Modify: `firestore.indexes.json`

- [ ] **Step 1: 更新 `firestore.rules`**

```
service cloud.firestore {
  match /databases/{database}/documents {

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

- [ ] **Step 2: 更新 `firestore.indexes.json`**

```json
{
  "indexes": [
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "startTime", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "room", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "startTime", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

第一個 index 供 Calendar 的 `onSnapshot` 查詢使用（`where status == active, orderBy startTime`）。
第二個 index 供衝突檢測查詢使用（`where room == X, where status == active, where startTime < Y`）。

- [ ] **Step 3: 部署 Firestore rules + indexes**

```bash
firebase deploy --only firestore
```

Expected:
```
✔  firestore: released rules firestore.rules to cloud.firestore
✔  firestore: deployed indexes in firestore.indexes.json
```

- [ ] **Step 4: Commit**

```bash
git add firestore.rules firestore.indexes.json
git commit -m "feat: add Firestore bookings security rules and composite indexes"
```

---

### Task 4: POST /api/bookings route

**Files:**
- Create: `src/app/api/bookings/route.ts`

- [ ] **Step 1: 建立目錄並新增 `src/app/api/bookings/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/firebase/admin";
import { validateData } from "@/func/applyFunc";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
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

  // 2. 解析 body
  const body = await request.json();
  const { name, phone, crowdSize, room, checkinTime, checkoutTime, eventDescription } = body;

  // 3. 驗證資料（複用 applyFunc.ts，email 從 token 取得）
  try {
    await validateData({
      name,
      phone,
      crowdSize,
      room,
      checkinTime,
      checkoutTime,
      email,
      eventDescription,
    });
  } catch (err) {
    return NextResponse.json({ message: (err as Error).message }, { status: 400 });
  }

  const startTime = Timestamp.fromDate(new Date(checkinTime));
  const endTime = Timestamp.fromDate(new Date(checkoutTime));

  // 4. Transaction：衝突檢測 + 寫入
  try {
    const bookingsRef = adminDb.collection("bookings");
    let bookingId = "";

    await adminDb.runTransaction(async (transaction) => {
      // 查詢同房間、active、且在新預約結束前開始的事件
      const conflictSnap = await transaction.get(
        bookingsRef
          .where("room", "==", room)
          .where("status", "==", "active")
          .where("startTime", "<", endTime)
      );

      // 過濾出真正重疊的（現有事件的 endTime > 新預約的 startTime）
      const hasConflict = conflictSnap.docs.some(
        (doc) => (doc.data().endTime as Timestamp).toMillis() > startTime.toMillis()
      );

      if (hasConflict) {
        throw new Error("CONFLICT");
      }

      const newRef = bookingsRef.doc();
      bookingId = newRef.id;
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
      });
    });

    return NextResponse.json({ bookingId }, { status: 201 });
  } catch (err) {
    if ((err as Error).message === "CONFLICT") {
      return NextResponse.json(
        { message: "該時段已有預約，請選擇其他時間" },
        { status: 409 }
      );
    }
    console.error("建立預約失敗:", err);
    return NextResponse.json({ message: "伺服器錯誤" }, { status: 500 });
  }
}
```

- [ ] **Step 2: 啟動 dev server**

```bash
npm run dev
```

Expected: `Ready on http://localhost:3000` 且無啟動錯誤

- [ ] **Step 3: 測試無 token 回傳 401**

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}'
```

Expected: `{"message":"未登入"}` with HTTP 401

- [ ] **Step 4: 取得 ID Token 並測試建立預約**

在瀏覽器開啟 http://localhost:3000，用 Google 登入後，開啟 DevTools Console 執行：

```javascript
copy(await firebase.auth().currentUser.getIdToken())
```

取得 token 後（已複製到剪貼簿），執行：

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <貼上_TOKEN>" \
  -d '{
    "name": "測試者",
    "phone": "0912345678",
    "crowdSize": "3",
    "room": "書房",
    "checkinTime": "2026-04-10T09:00:00.000Z",
    "checkoutTime": "2026-04-10T11:00:00.000Z",
    "eventDescription": "測試用預約"
  }'
```

Expected: `{"bookingId":"<auto-id>"}` with HTTP 201

- [ ] **Step 5: 測試衝突回傳 409**

用相同時段再送一次相同 curl 指令（第 4 步）。

Expected: `{"message":"該時段已有預約，請選擇其他時間"}` with HTTP 409

- [ ] **Step 6: Commit**

```bash
git add src/app/api/bookings/route.ts
git commit -m "feat: add POST /api/bookings with conflict detection and token auth"
```

---

### Task 5: DELETE /api/bookings/[id] route

**Files:**
- Create: `src/app/api/bookings/[id]/route.ts`

- [ ] **Step 1: 建立 `src/app/api/bookings/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/firebase/admin";

export async function DELETE(
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

  // 3. 確認本人才能刪除
  if (booking.email !== email) {
    return NextResponse.json({ message: "無權限刪除他人預約" }, { status: 403 });
  }

  // 4. 軟刪除（保留歷史紀錄）
  await docRef.update({ status: "cancelled" });

  return NextResponse.json({ message: "刪除成功" }, { status: 200 });
}
```

- [ ] **Step 2: 測試刪除（使用 Task 4 建立的 bookingId）**

```bash
curl -X DELETE http://localhost:3000/api/bookings/<TASK4_BOOKING_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

Expected: `{"message":"刪除成功"}` with HTTP 200

- [ ] **Step 3: 確認軟刪除（資料仍在但 status 變更）**

前往 Firebase Console → Firestore → `bookings` → 找到剛才刪除的文件，確認 `status` 欄位值為 `"cancelled"`（文件未被真正刪除）。

- [ ] **Step 4: Commit**

```bash
git add src/app/api/bookings/[id]/route.ts
git commit -m "feat: add DELETE /api/bookings/[id] with token auth and soft delete"
```

---

### Task 6: POST /api/migrate route + 執行遷移

**Files:**
- Create: `src/app/api/migrate/route.ts`

- [ ] **Step 1: 建立 `src/app/api/migrate/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { adminDb } from "@/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

// 解析舊版 Calendar description 文字格式（沒有 extendedProperties 的舊事件）
function parseCalendarDescription(desc: string) {
  const result = { name: "", email: "", phone: "", crowdSize: "", eventDescription: "" };
  if (!desc) return result;
  for (const line of desc.split("\n")) {
    const parts = line.split(":");
    if (parts.length < 2) continue;
    const key = parts[0].trim();
    const value = parts.slice(1).join(":").trim();
    if (key === "Booked by") result.name = value;
    else if (key === "Contact") result.email = value;
    else if (key === "Phone") result.phone = value;
    else if (key === "Crowd Size") result.crowdSize = value;
    else if (key === "Event Description") result.eventDescription = value;
  }
  return result;
}

export async function POST() {
  try {
    // 1. 從已部署的 Cloud Function 取得所有 Calendar 事件
    const resp = await fetch(
      "https://us-central1-tzai-space-pro.cloudfunctions.net/getAllEvents"
    );
    if (!resp.ok) {
      return NextResponse.json(
        { message: `Cloud Function 呼叫失敗: ${resp.status}` },
        { status: 502 }
      );
    }
    const { events } = await resp.json();

    // 2. 批次 upsert（每批最多 400 筆，Firestore batch 上限 500）
    const bookingsRef = adminDb.collection("bookings");
    const BATCH_SIZE = 400;
    let migrated = 0;
    let skipped = 0;

    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      const chunk = events.slice(i, i + BATCH_SIZE);

      for (const event of chunk) {
        if (!event.start?.dateTime || !event.end?.dateTime) {
          skipped++;
          continue;
        }

        // 優先用 extendedProperties（新格式），否則從 description 解析（舊格式）
        const shared = event.extendedProperties?.shared;
        const data = shared?.name ? shared : parseCalendarDescription(event.description || "");

        // 以 Google Calendar event.id 為 doc ID，實現冪等 upsert
        const docRef = bookingsRef.doc(event.id);
        batch.set(docRef, {
          calendarEventId: event.id,
          room: event.summary || "",
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          crowdSize: parseInt(data.crowdSize) || 0,
          description: data.eventDescription || "",
          startTime: Timestamp.fromDate(new Date(event.start.dateTime)),
          endTime: Timestamp.fromDate(new Date(event.end.dateTime)),
          createdAt: Timestamp.now(),
          status: "active",
        });
        migrated++;
      }

      await batch.commit();
    }

    return NextResponse.json({ migrated, skipped }, { status: 200 });
  } catch (err) {
    console.error("Migration error:", err);
    return NextResponse.json({ message: (err as Error).message }, { status: 500 });
  }
}
```

- [ ] **Step 2: 執行第一次遷移**

```bash
curl -X POST http://localhost:3000/api/migrate
```

Expected: `{"migrated":N,"skipped":M}` — N 為 Calendar 事件數量

- [ ] **Step 3: 驗證 Firestore 有資料**

前往 Firebase Console → Firestore Database → `bookings` collection，確認資料已寫入，格式正確（`room`、`startTime`、`status: "active"` 等欄位存在）。

- [ ] **Step 4: 測試冪等性（重複執行不產生重複資料）**

```bash
curl -X POST http://localhost:3000/api/migrate
```

再次前往 Firebase Console 確認 `bookings` 文件數量與第一次相同。

- [ ] **Step 5: Commit**

```bash
git add src/app/api/migrate/route.ts
git commit -m "feat: add POST /api/migrate for idempotent Calendar-to-Firestore sync"
```

---

### Task 7: 更新 Reserve.tsx + MyDialog.tsx 使用 Booking type

**Files:**
- Modify: `src/Components/Reserve.tsx`
- Modify: `src/Components/MyDialog.tsx`

- [ ] **Step 1: 完整替換 `src/Components/Reserve.tsx`**

```typescript
'use client'

import React from "react";
import dayjs from "dayjs";
import { Booking } from "../types/booking";

interface ReserveProps {
  onClick: (booking: Booking) => void;
  key: number;
  booking: Booking;
}

const Reserve = ({ onClick, booking }: ReserveProps) => {
  const room = booking.room;
  const st = dayjs(booking.startTime.toDate());
  const ed = dayjs(booking.endTime.toDate());
  const timeRange = `${st.format("HH:mm")} → ${ed.format("HH:mm")}`;

  const colorMap: Record<string, string> = {
    書房: "#E44C4C",
    橘廳: "#FF6F0D",
    會議室: "#54A0F9",
    小導師室: "#FFD81E",
    貢丸室: "#9458E2",
  };

  const circleColor = colorMap[room] || "#CCCCCC";

  return (
    <div className="w-full h-12 px-2.5 justify-start items-center gap-[15px] inline-flex">
      <div
        className="w-4 h-4 rounded-full"
        style={{ aspectRatio: "1 / 1", backgroundColor: circleColor }}
      />
      <div
        className="w-full h-12 flex flex-row px-5 bg-white rounded-[10px] items-center"
        onClick={() => onClick(booking)}
      >
        <div className="basis-3/5 text-black/80 text-sm font-normal font-['Inter']">
          {timeRange}
        </div>
        <div className="basis-2/5 text-black/80 text-sm font-normal font-['Inter']">
          {room}
        </div>
      </div>
    </div>
  );
};

export default Reserve;
```

- [ ] **Step 2: 完整替換 `src/Components/MyDialog.tsx`**

```typescript
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
import dayjs from "dayjs";

interface MyDialogProps {
  open: boolean;
  onClose: () => void;
  booking: Booking | null;
}

const MyDialog: React.FC<MyDialogProps> = ({ open, onClose, booking }) => {
  const user = useAuth();
  const { showSnackbar, showDialog, hideDialog } = useUI();

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
          {isEventOwner && (
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

- [ ] **Step 3: 型別檢查（Calendar.tsx 可能有殘留錯誤，下個 Task 修）**

```bash
npx tsc --noEmit
```

Expected: 只有 Calendar.tsx 相關錯誤（因為還沒更新），無其他錯誤

- [ ] **Step 4: Commit**

```bash
git add src/Components/Reserve.tsx src/Components/MyDialog.tsx
git commit -m "feat: update Reserve and MyDialog to use Booking type with token auth"
```

---

### Task 8: 更新 Calendar.tsx 使用 onSnapshot

**Files:**
- Modify: `src/views/Calendar.tsx`

- [ ] **Step 1: 完整替換 `src/views/Calendar.tsx`**

```typescript
'use client'

import React, { useState, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";
import { DateCalendar } from "@mui/x-date-pickers";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { Booking } from "../types/booking";
import Reserve from "../Components/Reserve";
import MyDialog from "../Components/MyDialog";
import "../styles/Calendar.css";

const Calendar: React.FC = () => {
  const [value, setValue] = useState<Dayjs | null>(dayjs());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredAmount, setFilteredAmount] = useState<number>(0);
  const [spanningBookings, setSpanningBookings] = useState<Booking[]>([]);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [open, setOpen] = useState(false);

  // 訂閱所有 active 預約（onSnapshot 即時更新，有人新增/刪除時自動反映）
  useEffect(() => {
    const q = query(
      collection(db, "bookings"),
      where("status", "==", "active"),
      orderBy("startTime")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(data);
    });
    return () => unsubscribe();
  }, []);

  // 當選擇日期或 bookings 更新時，篩選當天的預約
  useEffect(() => {
    if (!value) return;
    const selectedDate = value.format("YYYY-MM-DD");

    // 時間重疊判斷：事件橫跨選擇日期（包含跨天事件）
    const dailyBookings = bookings.filter((b) => {
      const sd = dayjs(b.startTime.toDate()).format("YYYY-MM-DD");
      const ed = dayjs(b.endTime.toDate()).format("YYYY-MM-DD");
      return sd <= selectedDate && selectedDate <= ed;
    });

    // 橫跨事件：開始時間早於今天
    const spanning = dailyBookings.filter((b) =>
      dayjs(b.startTime.toDate()).isBefore(selectedDate)
    );
    // 今天開始的事件
    const today = dailyBookings.filter((b) =>
      dayjs(b.startTime.toDate()).isSame(selectedDate, "day")
    );

    setFilteredAmount(dailyBookings.length);
    setSpanningBookings(spanning);
    setTodayBookings(today);
  }, [value, bookings]);

  return (
    <div className="flex flex-col pb-16 md:flex-row md:gap-8 md:max-w-[900px] md:mx-auto md:px-8 md:pb-0">
      {/* 行事曆 */}
      <div className="px-[7.5%] md:pt-5 md:px-0 md:flex md:justify-end">
        <DateCalendar
          sx={{ minWidth: { xs: "100%", md: "320px" }, margin: { md: 0 } }}
          className="w-full bg-white rounded-xl"
          value={value}
          onChange={(newValue) => setValue(newValue)}
        />
      </div>

      {/* 預約詳情 */}
      <div className="w-full py-4 px-[5%] flex flex-col items-center inline-flex md:pt-5 md:pb-0 md:px-0 md:grow">
        <div className="self-stretch px-2.5 justify-between items-center inline-flex">
          <div className="font">今日預約共 {filteredAmount} 筆</div>
          <a
            href="https://calendar.google.com/calendar/u/0/embed?src=oa27fmn21hoqd0hvdpg1bqlv1k@group.calendar.google.com&ctz=Asia/Taipei"
            target="_blank"
            rel="noopener noreferrer"
            className="font underline"
          >
            預約詳情
          </a>
        </div>

        <div className="self-stretch py-2.5 flex-col justify-start items-center gap-3.5 flex">
          {spanningBookings.map((b, index) => (
            <Reserve
              onClick={() => { setSelectedBooking(b); setOpen(true); }}
              key={index}
              booking={b}
            />
          ))}

          {spanningBookings.length > 0 && todayBookings.length > 0 && (
            <div className="w-full px-2">
              <div className="w-full border-t-2 border-dashed border-gray-400/40" />
            </div>
          )}

          {todayBookings.map((b, index) => (
            <Reserve
              onClick={() => { setSelectedBooking(b); setOpen(true); }}
              key={spanningBookings.length + index}
              booking={b}
            />
          ))}

          <MyDialog
            open={open}
            onClose={() => setOpen(false)}
            booking={selectedBooking}
          />
        </div>
      </div>
    </div>
  );
};

export default Calendar;
```

- [ ] **Step 2: 型別檢查**

```bash
npx tsc --noEmit
```

Expected: 無錯誤

- [ ] **Step 3: 本地功能驗證**

```bash
npm run dev
```

開啟 http://localhost:3000，確認：
- Calendar 頁面顯示預約資料（從 Firestore 讀取）
- 點擊預約卡片，MyDialog 正確顯示 `姓名 / 郵件 / 人數 / 時間 / 簡述`
- 登入後點擊自己的預約，「刪除預約」按鈕出現
- 執行刪除後，Calendar 頁面預約立即消失（onSnapshot 自動更新，無需重整）

- [ ] **Step 4: Commit**

```bash
git add src/views/Calendar.tsx
git commit -m "feat: replace Calendar fetch with Firestore onSnapshot real-time updates"
```

---

### Task 9: 更新 ApplyForm.tsx 加入 Token 驗證

**Files:**
- Modify: `src/views/ApplyForm.tsx`

- [ ] **Step 1: 移除 `FUNCTION_URL` 常數，更新 `handleSubmit`**

找到並刪除這行：
```typescript
const FUNCTION_URL = "api/add/";
```

將 `handleSubmit` 函式中 `await validateData(requestBody)` 之後的 `fetch` 段落替換為：

```typescript
const token = await user.getIdToken();
const requestBody = {
  name: applicantName,
  phone: phone,
  crowdSize: crowdSize,
  room: location,
  checkinTime: startDate.toISOString(),
  checkoutTime: endDate.toISOString(),
  eventDescription: description,
};
await validateData({ ...requestBody, email: user.email ?? "" });
const response = await fetch("/api/bookings", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(requestBody),
});
if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.message || "Unknown error");
}
```

完整的 `handleSubmit` 函式結果：

```typescript
const handleSubmit = async (event: React.FormEvent) => {
  event.preventDefault();
  if (!applicantName || !phone || !crowdSize || !location || !startDate || !endDate || !description || !consent) {
    showSnackbar("請填寫所有必填欄位，並同意隱私權政策", "warning");
    return;
  }
  showDialog("處理中...");
  try {
    if (!user) throw new Error("請先進行登入！");
    const token = await user.getIdToken();
    const requestBody = {
      name: applicantName,
      phone: phone,
      crowdSize: crowdSize,
      room: location,
      checkinTime: startDate.toISOString(),
      checkoutTime: endDate.toISOString(),
      eventDescription: description,
    };
    await validateData({ ...requestBody, email: user.email ?? "" });
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Unknown error");
    }
    showSnackbar("預約成功。", "success");
  } catch (err: unknown) {
    showSnackbar((err as Error).message || "請求失敗，請稍後再試。", "error");
  } finally {
    hideDialog();
  }
};
```

- [ ] **Step 2: 型別檢查**

```bash
npx tsc --noEmit
```

Expected: 無錯誤

- [ ] **Step 3: 端對端測試——建立預約並在 Calendar 確認即時更新**

1. 開啟兩個瀏覽器分頁：http://localhost:3000（Calendar）和 http://localhost:3000/apply（申請表單）
2. 登入後填寫表單，選擇未來日期，送出
3. 確認申請頁出現「預約成功」toast
4. 切換到 Calendar 分頁，確認新預約即時出現（無需重整）

- [ ] **Step 4: Commit**

```bash
git add src/views/ApplyForm.tsx
git commit -m "feat: update ApplyForm to use token auth and /api/bookings endpoint"
```

---

### Task 10: Build 驗證 + Push

- [ ] **Step 1: 完整 build**

```bash
npm run build
```

Expected: Build 成功，無 TypeScript 錯誤，無 ESLint 錯誤

- [ ] **Step 2: 若有 lint 錯誤個別修正**

```bash
npm run lint
```

常見問題：`no-console` 規則（可移除 debug console.log）、unused imports

- [ ] **Step 3: 再次執行遷移確認資料是最新的**

```bash
# 確認 dev server 仍在運行
curl -X POST http://localhost:3000/api/migrate
```

- [ ] **Step 4: Push dev branch**

```bash
git push origin dev
```

---

## 後期待辦（不在本次實作範圍）

### Phase 2：清理 Cloud Functions

- 移除 `firebase.json` hosting rewrites
- 停止部署 `functions/`（或刪除目錄）
- 移除 `googleapis`、`gapi`、`gapi-script` 依賴
- 移除 `src/types/event.tsx`
- 移除 `/api/migrate` endpoint

### Phase 3：Google Calendar 單向同步（選做）

- Firestore trigger `onBookingCreated` → 寫入 Google Calendar
- Firestore trigger `onBookingDeleted` → 從 Google Calendar 刪除

### 歷史資料對齊

- 確定正式切換時間點後，執行最後一次 `/api/migrate` 同步
- 決定舊 Calendar 資料是否保留
