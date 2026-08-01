"use client";

import React from "react";
import dayjs, { Dayjs } from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ROOM_COLORS } from "@/types/booking";
import { RoomLegend } from "./RoomLegend";

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

/** 桌面版大格月曆（灰底日格＋房間色點，底部附房間色圖例） */
export function MonthCalendar({ month, value, onSelect, onMonthChange, onToday, bookingsByDate }: MonthCalendarProps) {
  const monthStart = month.startOf("month");
  const gridStart = monthStart.subtract(monthStart.day(), "day");
  const rows = Math.ceil((monthStart.day() + month.daysInMonth()) / 7);
  const cells = Array.from({ length: rows * 7 }, (_, i) => gridStart.add(i, "day"));
  const today = dayjs();

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
      {/* header */}
      <div className="flex items-center justify-between">
        {/* pl-1：日格內的日期數字有 p-2 內縮，標題補一點左距做光學對齊 */}
        <span className="font-roboto pl-1 text-xl font-bold text-[#1F2937]">{month.format("MMMM YYYY")}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onToday}
            className="h-8 rounded-lg border border-[#D9DEE4] px-3 text-[13px] text-[#6B7280] transition-colors hover:bg-gray-50">
            今天
          </button>
          <button
            onClick={() => onMonthChange(month.subtract(1, "month"))}
            aria-label="上個月"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D9DEE4] text-[#6B7280] transition-colors hover:bg-gray-50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onMonthChange(month.add(1, "month"))}
            aria-label="下個月"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D9DEE4] text-[#6B7280] transition-colors hover:bg-gray-50">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* weekday header */}
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map(w => (
          <div key={w} className="pb-0.5 text-center text-[13px] text-[#9AA0A6]">
            {w}
          </div>
        ))}
      </div>

      {/* month grid */}
      <div className="-mt-2 grid grid-cols-7 gap-1.5">
        {cells.map(cell => {
          const dateStr = cell.format("YYYY-MM-DD");
          const rooms = bookingsByDate.get(dateStr) ?? [];
          const inMonth = cell.isSame(month, "month");
          const isSelected = value !== null && cell.isSame(value, "day");
          const isToday = cell.isSame(today, "day");

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(cell)}
              className={`flex min-h-[84px] flex-col gap-1.5 rounded-[10px] p-2 text-left transition-colors ${
                isSelected ? "bg-[#EAF1F8] ring-[1.5px] ring-inset ring-[#5991C4]" : "bg-[#F6F8FA] hover:bg-[#EEF2F5]"
              }`}>
              <span
                className={`font-roboto text-sm leading-none ${
                  isSelected
                    ? "font-bold text-[#5991C4]"
                    : isToday
                      ? "font-semibold text-[#5991C4]"
                      : inMonth
                        ? "text-[#1F2937]"
                        : "text-[#C7CDD4]"
                }`}>
                {cell.date()}
              </span>
              <span className="flex flex-wrap gap-[3px]">
                {rooms.slice(0, 5).map(room => (
                  <span key={room} className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: ROOM_COLORS[room] ?? "#ccc" }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {/* room legend */}
      <div className="border-t border-[#E8E8E8] pt-3.5 pl-0.5">
        <RoomLegend />
      </div>
    </div>
  );
}
