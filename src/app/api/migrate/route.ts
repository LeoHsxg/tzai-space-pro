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
