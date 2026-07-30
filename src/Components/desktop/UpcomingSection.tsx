"use client";

import React from "react";
import dayjs from "dayjs";
import { Booking, ROOM_COLORS } from "@/types/booking";

/** 即將到來 — 已核准、尚未開始的借用（桌面版） */
export function UpcomingSection({ bookings }: { bookings: Booking[] }) {
  return (
    <div className="rounded-2xl bg-white px-6 py-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-2">
        <span className="h-[9px] w-[9px] rounded-full bg-[#5991C4]" />
        <span className="text-sm font-semibold text-[#374151]">即將到來</span>
        <span className="font-inter text-[13px] font-bold text-[#5991C4]">{bookings.length}</span>
      </div>
      {bookings.length === 0 ? (
        <p className="pt-3 text-[13px] text-[#9AA0A6]">目前沒有即將到來的借用 — 已核准、尚未開始的借用會出現在這。</p>
      ) : (
        <div className="flex flex-col gap-2 pt-3.5">
          {bookings.map(b => (
            <div key={b.id} className="flex items-center gap-3 rounded-xl bg-[#F5F6F8] px-4 py-3">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: ROOM_COLORS[b.room] ?? "#ccc" }} />
              <span className="text-sm font-semibold text-[#374151]">{b.room}</span>
              <span className="font-inter text-[13px] tabular-nums text-[#6B7280]">
                {dayjs(b.startTime.toDate()).format("MM/DD HH:mm")} – {dayjs(b.endTime.toDate()).format("HH:mm")}
              </span>
              {b.description && <span className="ml-auto min-w-0 truncate pl-4 text-[13px] text-[#9AA0A6]">{b.description}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
