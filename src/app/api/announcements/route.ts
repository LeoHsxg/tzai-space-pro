import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { adminDb, adminAuth } from "@/firebase/admin";
import { isAdmin } from "@/lib/isAdmin";
import { FieldValue } from "firebase-admin/firestore";
import type { AnnouncementData } from "@/types/announcement";

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

export async function GET() {
  try {
    const snap = await adminDb
      .collection("announcements")
      .orderBy("publishedAt", "desc")
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json(null, { status: 200 });
    }

    const doc = snap.docs[0];
    const d = doc.data();
    const announcement: AnnouncementData = {
      id: doc.id,
      title: d.title,
      content: d.content,
      type: d.type,
      showModal: d.showModal,
      publishedAt: d.publishedAt?.toDate().toISOString() ?? new Date().toISOString(),
    };
    return NextResponse.json(announcement, { status: 200 });
  } catch (err) {
    console.error("GET /api/announcements 失敗:", err);
    return NextResponse.json({ message: "伺服器錯誤" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyToken(request);
  if (auth instanceof NextResponse) return auth;
  const { email } = auth;

  if (!(await isAdmin(email))) {
    return NextResponse.json({ message: "無管理員權限" }, { status: 403 });
  }

  const body = await request.json();
  const { id, title, content, type, showModal } = body;

  if (!id || !title || !content || !type) {
    return NextResponse.json({ message: "缺少必要欄位" }, { status: 400 });
  }

  try {
    await adminDb.collection("announcements").doc(id).set({
      title,
      content,
      type,
      showModal: !!showModal,
      publishedAt: FieldValue.serverTimestamp(),
    });

    revalidateTag("announcement");

    return NextResponse.json({ message: "公告已發布" }, { status: 200 });
  } catch (err) {
    console.error("POST /api/announcements 失敗:", err);
    return NextResponse.json({ message: "伺服器錯誤" }, { status: 500 });
  }
}
