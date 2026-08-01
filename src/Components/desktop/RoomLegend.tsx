"use client";

import React from "react";
import { ROOMS, ROOM_COLORS } from "@/types/booking";

/** 房間色圖例（日曆首頁標題列右側） */
export function RoomLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {ROOMS.map(room => (
        <span key={room} className="flex items-center gap-1.5 text-xs text-[#6B7280]">
          <span className="h-[9px] w-[9px] rounded-full" style={{ backgroundColor: ROOM_COLORS[room] }} />
          {room}
        </span>
      ))}
    </div>
  );
}
