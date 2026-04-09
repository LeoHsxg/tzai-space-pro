"use client";

import React from "react";
import dayjs from "dayjs";
import { Booking } from "../types/booking";

interface ReserveProps {
  onClick: (booking: Booking) => void;
  key: number;
  booking: Booking;
}

const Reserve = ({ onClick, booking }: ReserveProps) => {
  const room = booking.room;
  const st = dayjs(booking.startTime.toDate());
  const ed = dayjs(booking.endTime.toDate());
  const timeRange = `${st.format("HH:mm")} → ${ed.format("HH:mm")}`;

  const colorMap: Record<string, string> = {
    書房: "#E44C4C",
    橘廳: "#FF6F0D",
    會議室: "#54A0F9",
    小導師室: "#FFD81E",
    貢丸室: "#9458E2",
  };

  const circleColor = colorMap[room] || "#CCCCCC";

  return (
    <div className="w-full h-12 pl-1 justify-start items-center gap-[15px] inline-flex">
      <div className="w-4 h-4 rounded-full" style={{ aspectRatio: "1 / 1", backgroundColor: circleColor }} />
      <div className="w-full h-12 flex flex-row px-5 bg-white rounded-[10px] items-center" onClick={() => onClick(booking)}>
        <div className="basis-3/5 text-black/80 text-sm font-normal font-['Inter']">{timeRange}</div>
        <div className="basis-2/5 text-black/80 text-sm font-normal font-['Inter']">{room}</div>
      </div>
    </div>
  );
};

export default Reserve;
