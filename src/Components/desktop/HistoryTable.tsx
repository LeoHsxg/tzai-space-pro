"use client";

import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Booking, ROOMS, ROOM_COLORS } from "@/types/booking";

const PAGE_SIZE = 10;
const PAGE_STEP = 20;

interface HistoryTableProps {
  bookings: Booking[];
  /** 點整列開啟詳情；未傳則整列不可點 */
  onRowClick?: (booking: Booking) => void;
}

/** 歷史紀錄 — 桌面表格（空間／借用時間／狀態），可依空間篩選、載入更多 */
export function HistoryTable({ bookings, onRowClick }: HistoryTableProps) {
  const [roomFilter, setRoomFilter] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const presentRooms = useMemo(() => {
    const present = new Set(bookings.map(b => b.room));
    return ROOMS.filter(r => present.has(r));
  }, [bookings]);

  const filtered = roomFilter ? bookings.filter(b => b.room === roomFilter) : bookings;
  const shown = filtered.slice(0, visibleCount);

  const selectRoom = (room: string | null) => {
    setRoomFilter(room);
    setVisibleCount(PAGE_SIZE);
  };

  const chipClass = (active: boolean) =>
    `flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
      active ? "border-transparent bg-[#EAF1F8] font-medium text-[#3E6B92]" : "border-[#E3E7EB] text-[#6B7280] hover:bg-gray-50"
    }`;

  return (
    <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-6 py-5">
      <div className="flex items-center gap-2">
        <span className="h-[9px] w-[9px] rounded-full bg-[#9CA3AF]" />
        <span className="text-sm font-semibold text-[#374151]">歷史紀錄</span>
        <span className="font-roboto text-[13px] font-bold text-[#9CA3AF]">{bookings.length}</span>
        {presentRooms.length > 1 && (
          <div className="ml-auto flex flex-wrap gap-1.5">
            <button onClick={() => selectRoom(null)} className={chipClass(roomFilter === null)}>
              全部空間
            </button>
            {presentRooms.map(room => (
              <button key={room} onClick={() => selectRoom(roomFilter === room ? null : room)} className={chipClass(roomFilter === room)}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ROOM_COLORS[room] }} />
                {room}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="pt-3 text-[13px] text-[#9AA0A6]">尚無歷史紀錄</p>
      ) : (
        <>
          <table className="mt-4 w-full">
            <thead>
              <tr>
                <th className="w-[28%] border-b border-[#EEEEEE] pb-2.5 text-left text-xs font-medium text-[#9AA0A6]">空間</th>
                <th className="border-b border-[#EEEEEE] pb-2.5 text-left text-xs font-medium text-[#9AA0A6]">借用時間</th>
                <th className="border-b border-[#EEEEEE] pb-2.5 text-right text-xs font-medium text-[#9AA0A6]">狀態</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(b => (
                <tr
                  key={b.id}
                  onClick={onRowClick ? () => onRowClick(b) : undefined}
                  className={`border-b border-[#F5F5F5] last:border-0 ${
                    onRowClick ? "cursor-pointer transition-colors hover:bg-[#FAFBFC]" : ""
                  }`}>
                  <td className="py-3.5 text-sm font-semibold text-[#374151]">{b.room}</td>
                  <td className="py-3.5 font-roboto text-sm tabular-nums text-[#6B7280]">
                    {dayjs(b.startTime.toDate()).format("MM/DD HH:mm")} – {dayjs(b.endTime.toDate()).format("HH:mm")}
                  </td>
                  <td className="py-3.5 text-right">
                    <span className="inline-block rounded-full border border-[#D9DEE4] px-2.5 py-0.5 text-xs text-[#9AA0A6]">
                      {b.status === "cancelled" ? "已取消" : "已完成"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > visibleCount && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setVisibleCount(c => c + PAGE_STEP)}
                className="rounded-lg border border-[#D9DEE4] px-4 py-2 text-[13px] text-[#6B7280] transition-colors hover:bg-gray-50">
                載入更多 · 共 {filtered.length} 筆
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
