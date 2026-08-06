import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

// 與 src/views/Storeroom.tsx 的選項一致
const CATEGORIES = ["Bug", "許願", "UI/UX", "其他"];
const JIA_OPTIONS = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二", "十三", "十四"].map(n => `${n}家`);
const MAX_MESSAGE_LENGTH = 1000;
const MAX_NAME_LENGTH = 30;

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

export async function POST(request: NextRequest) {
  const auth = await verifyToken(request);
  if (auth instanceof NextResponse) return auth;
  const { email } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "格式不正確" }, { status: 400 });
  }
  const { category, message, jia, name } = body as {
    category?: unknown;
    message?: unknown;
    jia?: unknown;
    name?: unknown;
  };

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ message: "想說的話不能是空的" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ message: "想說的話太長了" }, { status: 400 });
  }
  if (typeof category !== "string" || !CATEGORIES.includes(category)) {
    return NextResponse.json({ message: "類型不正確" }, { status: 400 });
  }
  if (jia != null && (typeof jia !== "string" || !JIA_OPTIONS.includes(jia))) {
    return NextResponse.json({ message: "家別不正確" }, { status: 400 });
  }
  if (name != null && (typeof name !== "string" || name.length > MAX_NAME_LENGTH)) {
    return NextResponse.json({ message: "姓名格式不正確" }, { status: 400 });
  }

  try {
    await adminDb.collection("feedback").add({
      category,
      message: message.trim(),
      jia: jia ?? null,
      name: typeof name === "string" && name.trim() ? name.trim() : null,
      email, // UI 不揭露，僅供管理員在 console 端追蹤
      createdAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ message: "已收到" }, { status: 200 });
  } catch (err) {
    console.error("POST /api/feedback 失敗:", err);
    return NextResponse.json({ message: "伺服器錯誤" }, { status: 500 });
  }
}
