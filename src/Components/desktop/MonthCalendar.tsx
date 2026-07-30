"use client";

import React from "react";
import dayjs, { Dayjs } from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ROOM_COLORS } from "@/types/booking";

interface MonthCalendarProps {
  /** 目前顯示的月份（任一天皆可） */
  month: Dayjs;
  value: Dayjs | null;
  onSelect: (date: Dayjs) => void;
  onMonthChange: (month: Dayjs) => void;
  onToday: () => void;
  /** "YYYY-MM-DD" → 當天有預約的房間名 */
  bookingsByDate: Map<string, string[]>;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

/**
 * 桌面版月曆——沿用行動版 BookingCalendar 的視覺語言放大：
 * 白底、懸浮數字圓圈、置中房間色點、選取＝品牌藍實心圓。
 */
export function MonthCalendar({ month, value, onSelect, onMonthChange, onToday, bookingsByDate }: MonthCalendarProps) {
  const monthStart = month.startOf("month");
  const gridStart = monthStart.subtract(monthStart.day(), "day");
  const rows = Math.ceil((monthStart.day() + month.daysInMonth()) / 7);
  const cells = Array.from({ length: rows * 7 }, (_, i) => gridStart.add(i, "day"));
  const today = dayjs();

  return (
    <div className="flex flex-col rounded-2xl bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
      {/* header */}
      <div className="flex items-center justify-between pb-5">
        <span className="font-roboto text-[19px] font-bold text-[#1F2937]">{month.format("MMMM YYYY")}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onToday}
            className="mr-1 h-8 rounded-lg border border-[#E3E7EB] px-3 text-[13px] text-[#6B7280] transition-colors hover:bg-gray-50">
            今天
          </button>
          <button
            onClick={() => onMonthChange(month.subtract(1, "month"))}
            aria-label="上個月"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onMonthChange(month.add(1, "month"))}
            aria-label="下個月"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* weekday header */}
      <div className="grid grid-cols-7 pb-2">
        {WEEKDAYS.map(w => (
          <div key={w} className="text-center text-xs font-medium text-[#9AA0A6]">
            {w}
          </div>
        ))}
      </div>

      {/* month grid */}
      <div className="grid flex-1 auto-rows-fr grid-cols-7 gap-y-1">
        {cells.map(cell => {
          const dateStr = cell.format("YYYY-MM-DD");
          const rooms = bookingsByDate.get(dateStr) ?? [];
          const inMonth = cell.isSame(month, "month");
          const isSelected = value !== null && cell.isSame(value, "day");
          const isToday = cell.isSame(today, "day");

          let circle = "flex h-8 w-8 items-center justify-center rounded-full font-roboto text-sm transition-colors";
          if (isSelected) {
            circle += " bg-[#5991C4] font-bold text-white";
          } else if (isToday) {
            circle += " border-[1.2px] border-solid border-[#9CA3AF] font-medium text-[#374151]";
          } else if (!inMonth) {
            circle += " text-[#C7CDD4]";
          } else {
            circle += " text-[#374151]";
          }

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(cell)}
              className="flex min-h-[64px] flex-col items-center gap-[5px] rounded-xl py-2 transition-colors hover:bg-[#F7F8FA]">
              <span className={circle}>{cell.date()}</span>
              <span className="flex min-h-[6px] flex-wrap items-center justify-center gap-[3px] px-1">
                {rooms.slice(0, 5).map(room => (
                  <span key={room} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ROOM_COLORS[room] ?? "#ccc" }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
