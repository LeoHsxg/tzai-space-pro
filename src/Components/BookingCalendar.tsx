"use client";

import React from "react";
import dayjs, { Dayjs } from "dayjs";
import { Calendar } from "@/Components/ui/calendar";
import type { DayButtonProps } from "react-day-picker";

const ROOM_COLORS: Record<string, string> = {
  書房:    "#E44C4C",
  橘廳:    "#FF6F0D",
  會議室:  "#54A0F9",
  小導師室:"#FFD81E",
  貢丸室:  "#9458E2",
};

interface BookingCalendarProps {
  value: Dayjs | null;
  onChange: (date: Dayjs) => void;
  /** "YYYY-MM-DD" → array of room names with bookings on that day */
  bookingsByDate: Map<string, string[]>;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  value,
  onChange,
  bookingsByDate,
}) => {
  const selected = value ? value.toDate() : undefined;

  return (
    <Calendar
      mode="single"
      selected={selected}
      onSelect={(date) => date && onChange(dayjs(date))}
      weekStartsOn={0}
      showOutsideDays
      style={{ fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif" }}
      className="w-full bg-white rounded-[14px] p-5"
      classNames={{
        // remove all shadows/borders from nav buttons
        button_previous: "size-7 border-0 shadow-none bg-transparent hover:bg-[#f3f4f6] text-[#6b7280] hover:text-[#111827] transition-colors rounded-md flex items-center justify-center",
        button_next:     "size-7 border-0 shadow-none bg-transparent hover:bg-[#f3f4f6] text-[#6b7280] hover:text-[#111827] transition-colors rounded-md flex items-center justify-center",
        // caption / month title
        caption_label: "text-sm font-medium text-[#111827]",
        // weekday headers
        weekday: "text-[11px] font-medium text-[#9ca3af] flex-1 text-center",
        // day cell wrapper — give it auto height for dots
        day: "relative w-full p-0 text-center",
      }}
      components={{
        DayButton: ({ day, modifiers, ...props }: DayButtonProps) => {
          const dateStr = dayjs(day.date).format("YYYY-MM-DD");
          const rooms = bookingsByDate.get(dateStr) ?? [];

          const isSelected = !!modifiers.selected;
          const isToday    = !!modifiers.today;
          const isOutside  = !!modifiers.outside;

          let circleClass = "w-7 h-7 flex items-center justify-center rounded-full text-[12px]";

          if (isSelected) {
            circleClass += " bg-[#f97316] text-white font-bold";
          } else if (isToday) {
            circleClass += " border border-[#9ca3af] font-medium text-[#374151]";
          } else if (isOutside) {
            circleClass += " text-[#d1d5db]";
          } else {
            circleClass += " text-[#374151]";
          }

          return (
            <button
              {...props}
              className="flex flex-col items-center w-full py-1 pb-1.5 rounded-md hover:bg-[#f9fafb] transition-colors cursor-pointer border-0 bg-transparent"
            >
              <span className={circleClass}>
                {day.date.getDate()}
              </span>
              <div className="flex gap-[2px] mt-[3px] min-h-[6px] items-center">
                {rooms.slice(0, 5).map((room, i) => (
                  <span
                    key={i}
                    className="w-[5px] h-[5px] rounded-full flex-shrink-0 inline-block"
                    style={{ backgroundColor: ROOM_COLORS[room] ?? "#ccc" }}
                  />
                ))}
              </div>
            </button>
          );
        },
      }}
    />
  );
};
