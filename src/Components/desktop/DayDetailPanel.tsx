"use client";

import React, { useEffect, useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { Booking, ROOMS, ROOM_COLORS } from "@/types/booking";

interface DayDetailPanelProps {
  date: Dayjs;
  /** 從前一天跨入選定日的預約 */
  spanning: Booking[];
  /** 選定日當天開始的預約 */
  today: Booking[];
  /** 選定日超出資料訂閱視窗（−4 ～ +1 個月）時顯示說明 */
  outOfWindow?: boolean;
  onBookingClick: (booking: Booking) => void;
  onApply: (date: Dayjs) => void;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function BookingRow({ booking, onClick }: { booking: Booking; onClick: () => void }) {
  const st = dayjs(booking.startTime.toDate());
  const ed = dayjs(booking.endTime.toDate());
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl bg-[#F5F6F8] px-4 pl-[18px] py-[15px] text-left transition-colors hover:bg-[#EEF1F4]">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: ROOM_COLORS[booking.room] ?? "#ccc" }} />
      <span className="font-roboto text-sm tabular-nums text-[#1F2937]">
        {st.format("HH:mm")} → {ed.format("HH:mm")}
      </span>
      <span className="ml-auto text-[13px] text-[#6B7280]">{booking.room}</span>
    </button>
  );
}

/** 桌面版右側當日詳情面板（日期標題＋房間篩選＋預約清單＋於此日申請） */
export function DayDetailPanel({ date, spanning, today, outOfWindow = false, onBookingClick, onApply }: DayDetailPanelProps) {
  const [roomFilter, setRoomFilter] = useState<string | null>(null);
  const dateKey = date.format("YYYY-MM-DD");

  // 換日時重設篩選，避免留著已不存在的房間 chip
  useEffect(() => {
    setRoomFilter(null);
  }, [dateKey]);

  const dayRooms = useMemo(() => {
    const present = new Set([...spanning, ...today].map(b => b.room));
    return ROOMS.filter(r => present.has(r));
  }, [spanning, today]);

  const filteredSpanning = roomFilter ? spanning.filter(b => b.room === roomFilter) : spanning;
  const filteredToday = roomFilter ? today.filter(b => b.room === roomFilter) : today;
  const total = spanning.length + today.length;
  const isToday = date.isSame(dayjs(), "day");

  const chipClass = (active: boolean) =>
    `flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
      active ? "border-transparent bg-[#EAF1F8] font-medium text-[#3E6B92]" : "border-[#E3E7EB] text-[#6B7280] hover:bg-gray-50"
    }`;

  const isEmpty = filteredSpanning.length === 0 && filteredToday.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
      {/* header */}
      <div className="flex flex-col px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <span className="font-roboto text-base font-bold text-[#1F2937]">
            {date.format("M 月 D 日")}（{WEEKDAYS[date.day()]}）
          </span>
          {/* 用實體圓點取代「·」字元——字元會坐在基線上、看起來偏低且過細 */}
          {isToday && (
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#5991C4]">
              <span className="h-1 w-1 rounded-full bg-current" />
              今日
            </span>
          )}
        </div>
        <span className="font-roboto pt-1 text-xs text-[#9AA0A6]">共 {total} 筆預約</span>
        {dayRooms.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2.5">
            <button onClick={() => setRoomFilter(null)} className={chipClass(roomFilter === null)}>
              全部
            </button>
            {dayRooms.map(room => (
              <button key={room} onClick={() => setRoomFilter(roomFilter === room ? null : room)} className={chipClass(roomFilter === room)}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ROOM_COLORS[room] }} />
                {room}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="h-px bg-[#F1F1F1]" />

      {/* booking list */}
      {isEmpty ? (
        <div className="flex flex-1 items-center justify-center px-8 py-6">
          {outOfWindow ? (
            <p className="text-center text-xs leading-relaxed text-[#9AA0A6]">
              因為一次加載太多資料會讓管管的錢包很有負荷，而管管又很懶得寫動態加載，所以只加載最近半年的資料，造成不便敬請見諒，如有需求請再聯繫管管。
            </p>
          ) : (
            <p className="text-[13px] text-[#9AA0A6]">這天還沒有預約</p>
          )}
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4">
          {filteredSpanning.map(b => (
            <BookingRow key={b.id} booking={b} onClick={() => onBookingClick(b)} />
          ))}
          {filteredSpanning.length > 0 && filteredToday.length > 0 && (
            <div className="mx-1 my-1 border-t-2 border-dashed border-gray-400/30" />
          )}
          {filteredToday.map(b => (
            <BookingRow key={b.id} booking={b} onClick={() => onBookingClick(b)} />
          ))}
        </div>
      )}

      {/* apply on this day */}
      <div className="border-t border-[#F1F1F1] p-4">
        <button
          onClick={() => onApply(date)}
          className="w-full rounded-xl border-[1.5px] border-dashed border-[#5991C4] py-3 text-sm font-semibold text-[#5991C4] transition-colors hover:bg-[#EAF1F8]/60">
          ＋ 於 {date.format("M/D")} 申請借用
        </button>
      </div>
    </div>
  );
}
