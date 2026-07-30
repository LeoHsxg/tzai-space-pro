"use client";

import React from "react";
import dayjs, { Dayjs } from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar } from "@/Components/ui/calendar";
import type { DayButtonProps } from "react-day-picker";
import { cn } from "@/lib/utils";
import { ROOM_COLORS } from "@/types/booking";

interface BookingCalendarProps {
  value: Dayjs | null;
  onChange: (date: Dayjs) => void;
  /** "YYYY-MM-DD" → array of room names with bookings on that day */
  bookingsByDate: Map<string, string[]>;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ value, onChange, bookingsByDate }) => {
  const selected = value ? value.toDate() : undefined;
  const [month, setMonth] = React.useState<Date>(() => value?.toDate() ?? new Date());

  React.useEffect(() => {
    if (value) setMonth(value.toDate());
  }, [value]);

  return (
    <Calendar
      mode="single"
      selected={selected}
      month={month}
      onMonthChange={setMonth}
      onSelect={date => date && onChange(dayjs(date))}
      weekStartsOn={0}
      showOutsideDays
      style={{ fontFamily: "var(--font-inter), Inter, 'Roboto', 'Helvetica', 'Arial', sans-serif" }}
      className="w-full bg-white rounded-[14px] p-5"
      classNames={{
        // lift nav above month_caption
        nav: "absolute inset-x-0 top-0 flex w-full items-center justify-between z-10",
        // caption row: pointer-events-none so nav buttons underneath are clickable
        month_caption: "flex h-7 w-full items-center justify-center pointer-events-none",
        // caption / month title
        caption_label: "text-sm font-medium text-[#111827]",
        // weekday headers
        weekday: "text-[11px] font-medium text-[#9ca3af] flex-1 text-center",
        // rows: remove default mt-2 gap between header and first week
        week: "flex w-full",
        // day cell wrapper
        day: "relative w-full p-0 text-center",
        today: "bg-transparent",
      }}
      components={{
        Nav: () => (
          <div className="absolute inset-x-0 top-0 flex w-full items-center justify-between z-10">
            <button
              type="button"
              onClick={() => setMonth(prev => dayjs(prev).subtract(1, "month").toDate())}
              className="relative z-10 pointer-events-auto w-7 h-7 flex items-center justify-center rounded-md bg-transparent border-0 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] transition-colors cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMonth(prev => dayjs(prev).add(1, "month").toDate())}
              className="relative z-10 pointer-events-auto w-7 h-7 flex items-center justify-center rounded-md bg-transparent border-0 text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] transition-colors cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ),
        DayButton: ({ day, modifiers, ...props }: DayButtonProps) => {
          const ref = React.useRef<HTMLButtonElement>(null);
          React.useEffect(() => {
            if (modifiers.focused) ref.current?.focus();
          }, [modifiers.focused]);

          const dateStr = dayjs(day.date).format("YYYY-MM-DD");
          const rooms = bookingsByDate.get(dateStr) ?? [];

          const isSelected = !!modifiers.selected;
          const isToday = !!modifiers.today;
          const isOutside = !!modifiers.outside;

          let circleClass = "w-7 h-7 flex items-center justify-center rounded-full text-[12px]";

          if (isSelected) {
            circleClass += " bg-[#5991C4] text-white font-bold";
          } else if (isToday) {
            circleClass += " border-[1.2px] border-[#9ca3af] border-solid font-medium text-[#374151]";
          } else if (isOutside) {
            circleClass += " text-[#d1d5db]";
          } else {
            circleClass += " text-[#374151]";
          }

          return (
            <button
              {...props}
              ref={ref}
              className={cn(
                "flex flex-col items-center w-full py-1 pb-1.5 rounded-md hover:bg-[#f9fafb] transition-colors cursor-pointer border-0 bg-transparent",
                props.className,
              )}>
              <span className={circleClass}>{day.date.getDate()}</span>
              <div className="flex gap-[2px] mt-[3px] min-h-[6px] items-center">
                {rooms.slice(0, 5).map((room, i) => (
                  <span key={i} className="w-[5px] h-[5px] rounded-full flex-shrink-0 inline-block" style={{ backgroundColor: ROOM_COLORS[room] ?? "#ccc" }} />
                ))}
              </div>
            </button>
          );
        },
      }}
    />
  );
};

