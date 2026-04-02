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
