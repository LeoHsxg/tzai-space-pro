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
        photoRequired: true,
        photoUrl: null,
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
