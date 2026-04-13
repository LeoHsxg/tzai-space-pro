"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import dayjs, { Dayjs } from "dayjs";
import { collection, onSnapshot, query, where, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { Booking } from "../types/booking";
import Reserve from "../Components/Reserve";
import MyDialog from "../Components/MyDialog";
import { BookingCalendar } from "../Components/BookingCalendar";
import ApplyForm from "./ApplyForm";
import { Plus, X } from "lucide-react";
import "../styles/Calendar.css";

const loadingSpinnerStyle: React.CSSProperties = {
  width: "32px",
  height: "32px",
  border: "3px solid #e5e7eb",
  borderTopColor: "#5991C4",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const Calendar: React.FC = () => {
  const [value, setValue] = useState<Dayjs | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartY = useRef(0);

  useEffect(() => {
    setValue(dayjs());
    setMounted(true);
  }, []);

  // Lock body scroll when bottom sheet is open
  useEffect(() => {
    document.body.style.overflow = applyOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [applyOpen]);

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

  // Drag-to-dismiss handlers
  const handleDragStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  };
  const handleDragMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0) setDragOffset(delta);
  };
  const handleDragEnd = () => {
    if (dragOffset > 80) {
      setApplyOpen(false);
    }
    setDragOffset(0);
  };

  const sheetStyle: React.CSSProperties = {
    height: "91vh",
    transform: applyOpen ? `translateY(${dragOffset}px)` : "translateY(100%)",
    transition: dragOffset > 0 ? "none" : "transform 0.3s ease-out",
  };

  const overlay = (
    <>
      {/* Backdrop — rendered in document.body portal to clear all z-index stacking contexts */}
      <div
        className={`fixed inset-0 bg-black/40 z-[9998] md:hidden transition-opacity duration-300 ${applyOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setApplyOpen(false)}
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] md:hidden bg-[#F3F3F3] rounded-t-2xl shadow-2xl" style={sheetStyle}>
        {/* Drag handle — touch target */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}>
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <span className="noto font-bold text-lg ml-3 mt-1 text-black/60">申請借用</span>
          <button
            onClick={() => setApplyOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full text-black/40 hover:text-black/70 hover:bg-black/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Scrollable form */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(92vh - 68px)" }}>
          <ApplyForm />
        </div>
      </div>
    </>
  );

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

      {/* FAB — mobile only, above footer */}
      <button
        onClick={() => setApplyOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-[110] w-16 h-16 rounded-full bg-[#5796DF] text-white flex items-center justify-center hover:bg-[#4a88d4] active:scale-95 transition-all">
        <Plus className="w-7 h-7" />
      </button>

      {/* Portal: backdrop + sheet rendered directly on document.body */}
      {mounted && createPortal(overlay, document.body)}
    </div>
  );
};

export default Calendar;
