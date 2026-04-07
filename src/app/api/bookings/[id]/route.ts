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
