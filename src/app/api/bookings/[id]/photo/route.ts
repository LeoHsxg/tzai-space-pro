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
 *  只處理 googleapis.com/v0/b/.../o/... 格式（Client SDK 預設格式）。
 *  若 URL 格式不符，回傳 null，Storage 孤兒檔可接受。
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

  if (booking.status === "cancelled") {
    return NextResponse.json({ message: "已取消的預約不可操作" }, { status: 409 });
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
