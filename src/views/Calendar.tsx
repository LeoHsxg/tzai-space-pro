"use client";

import React, { useState, useEffect, useMemo } from "react";
import dayjs, { Dayjs } from "dayjs";
import { collection, onSnapshot, query, where, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { Booking } from "../types/booking";
import Reserve from "../Components/Reserve";
import MyDialog from "../Components/MyDialog";
import { BookingCalendar } from "../Components/BookingCalendar";
import "../styles/Calendar.css";

const loadingSpinnerStyle: React.CSSProperties = {
  width: "32px",
  height: "32px",
  border: "3px solid #e5e7eb",
  borderTopColor: "#f97316",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const Calendar: React.FC = () => {
  const [value, setValue] = useState<Dayjs | null>(null);

  useEffect(() => {
    setValue(dayjs());
  }, []);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [filteredAmount, setFilteredAmount] = useState<number>(0);
  const [spanningBookings, setSpanningBookings] = useState<Booking[]>([]);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [open, setOpen] = useState(false);

  // Subscribe to active bookings within ±4 months window
  useEffect(() => {
    const start = Timestamp.fromDate(dayjs().subtract(4, "month").startOf("month").toDate());
    const end = Timestamp.fromDate(dayjs().add(1, "month").endOf("month").toDate());
    const q = query(collection(db, "bookings"), where("status", "==", "active"), where("startTime", ">=", start), where("startTime", "<=", end), orderBy("startTime"));
    const unsubscribe = onSnapshot(q, snap => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Booking);
      setBookings(data);
      setLoadingBookings(false);
    });
    return () => unsubscribe();
  }, []);

  // Derive bookingsByDate map for dot indicators
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, string[]>();
    bookings.forEach(b => {
      const start = dayjs(b.startTime.toDate());
      const end = dayjs(b.endTime.toDate());
      let cursor = start.startOf("day");
      while (cursor.isBefore(end, "day") || cursor.isSame(end, "day")) {
        const key = cursor.format("YYYY-MM-DD");
        const existing = map.get(key) ?? [];
        if (!existing.includes(b.room)) {
          map.set(key, [...existing, b.room]);
        }
        cursor = cursor.add(1, "day");
      }
    });
    return map;
  }, [bookings]);

  const windowStart = dayjs().subtract(4, "month").startOf("month");
  const windowEnd = dayjs().add(1, "month").endOf("month");
  const isOutOfWindow = value !== null && (value.isBefore(windowStart, "day") || value.isAfter(windowEnd, "day"));

  // Filter bookings for selected date
  useEffect(() => {
    if (!value) return;
    const selectedDate = value.format("YYYY-MM-DD");

    const dailyBookings = bookings.filter(b => {
      const sd = dayjs(b.startTime.toDate()).format("YYYY-MM-DD");
      const ed = dayjs(b.endTime.toDate()).format("YYYY-MM-DD");
      return sd <= selectedDate && selectedDate <= ed;
    });

    const spanning = dailyBookings.filter(b => dayjs(b.startTime.toDate()).isBefore(selectedDate));
    const today = dailyBookings.filter(b => dayjs(b.startTime.toDate()).isSame(selectedDate, "day"));

    setFilteredAmount(dailyBookings.length);
    setSpanningBookings(spanning);
    setTodayBookings(today);
  }, [value, bookings]);

  return (
    <div className="flex flex-col pb-16 md:flex-row md:gap-8 md:max-w-[900px] md:mx-auto md:px-8 md:pb-0">
      {/* 行事曆 */}
      <div className="px-[5%] md:pt-5 md:px-0 md:flex md:justify-end">
        <div style={{ minWidth: "320px" }}>
          <BookingCalendar value={value} onChange={setValue} bookingsByDate={bookingsByDate} />
        </div>
      </div>

      {/* 預約詳情 — 不改動 */}
      <div className="w-full py-4 px-[5%] flex flex-col items-center inline-flex md:pt-5 md:pb-0 md:px-0 md:grow">
        <div className="self-stretch px-2.5 justify-between items-center inline-flex">
          <div className="font">今日預約共 {filteredAmount} 筆</div>
          <a
            href="https://calendar.google.com/calendar/u/0/embed?src=oa27fmn21hoqd0hvdpg1bqlv1k@group.calendar.google.com&ctz=Asia/Taipei"
            target="_blank"
            rel="noopener noreferrer"
            className="font underline">
            預約詳情
          </a>
        </div>

        <div className="self-stretch py-2.5 flex-col justify-start items-center gap-3.5 flex">
          {loadingBookings && <div style={{ ...loadingSpinnerStyle, marginTop: "24px" }} />}
          {isOutOfWindow && (
            <p className="text-xs text-gray-400 text-center px-4 pt-2">
              因為一次加載太多資料會讓管管的錢包很有負荷，而管管又很懶得寫動態加載，所以只加載最近半年的資料，造成不便敬請見諒，如有需求請再聯繫管管。
            </p>
          )}
          {spanningBookings.map((b, index) => (
            <Reserve
              onClick={() => {
                setSelectedBooking(b);
                setOpen(true);
              }}
              key={index}
              booking={b}
            />
          ))}

          {spanningBookings.length > 0 && todayBookings.length > 0 && (
            <div className="w-full px-1">
              <div className="w-full border-t-2 border-dashed border-gray-400/40" />
            </div>
          )}

          {todayBookings.map((b, index) => (
            <Reserve
              onClick={() => {
                setSelectedBooking(b);
                setOpen(true);
              }}
              key={spanningBookings.length + index}
              booking={b}
            />
          ))}

          <MyDialog open={open} onClose={() => setOpen(false)} booking={selectedBooking} />
        </div>
      </div>
    </div>
  );
};

export default Calendar;
