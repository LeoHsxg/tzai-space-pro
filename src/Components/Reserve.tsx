"use client";

import React from "react";
import dayjs from "dayjs";
import { Booking, ROOM_COLORS } from "../types/booking";

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

  const circleColor = ROOM_COLORS[room] || "#CCCCCC";

  return (
    <div className="w-full h-12 pl-1 justify-start items-center gap-[15px] inline-flex">
      <div className="w-4 h-4 rounded-full" style={{ aspectRatio: "1 / 1", backgroundColor: circleColor }} />
      <div className="w-full h-12 flex flex-row px-5 bg-white rounded-[10px] items-center" onClick={() => onClick(booking)}>
        <div className="basis-1/2 text-black/80 text-sm font-normal font-['Inter']">{timeRange}</div>
        <div className="basis-1/2 text-black/80 text-sm font-normal font-['Inter']">{room}</div>
      </div>
    </div>
  );
};

export default Reserve;
