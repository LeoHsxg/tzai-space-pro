import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/firebase/admin";
import { isAdmin } from "@/lib/isAdmin";

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

  // 已取消的預約不可再刪除
  if (booking.status === "cancelled") {
    return NextResponse.json({ message: "預約已取消" }, { status: 409 });
  }

  // 非本人 → 確認是否為管理員
  if (booking.email !== email && !(await isAdmin(email))) {
    return NextResponse.json({ message: "無權限刪除他人預約" }, { status: 403 });
  }

  // 軟刪除（保留歷史紀錄）
  await docRef.update({ status: "cancelled" });

  return NextResponse.json({ message: "刪除成功" }, { status: 200 });
}
