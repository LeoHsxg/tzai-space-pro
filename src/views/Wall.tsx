"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { collection, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { Booking } from "../types/booking";
import dayjs from "dayjs";

const ROOMS = ["全部", "書房", "橘廳", "會議室", "小導師室", "貢丸室"] as const;
type RoomFilter = (typeof ROOMS)[number];

const ROOM_COLORS: Record<string, { text: string; bg: string }> = {
  書房: { text: "#E44C4C", bg: "#FDE8E8" },
  橘廳: { text: "#FF6F0D", bg: "#FFF0E6" },
  會議室: { text: "#54A0F9", bg: "#E8F4FE" },
  小導師室: { text: "#b8960c", bg: "#FFFBDD" },
  貢丸室: { text: "#9458E2", bg: "#F3ECFD" },
};

type PhotoBooking = Booking & { photoUrl: string };

const formatTime = (date: Date) => {
  const d = dayjs(date);
  const isToday = d.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD");
  return isToday ? `今天 ${d.format("HH:mm")}` : d.format("MM/DD HH:mm");
};

const Wall: React.FC = () => {
  const [allPhotos, setAllPhotos] = useState<PhotoBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState<RoomFilter>("全部");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLoading(true);

    const oneMonthAgo = Timestamp.fromDate(dayjs().subtract(1, "month").toDate());
    const now = Timestamp.fromDate(new Date());

    const q = query(
      collection(db, "bookings"), //
      where("status", "==", "active"),
      where("endTime", ">=", oneMonthAgo),
      where("endTime", "<=", now),
      orderBy("endTime", "desc"),
    );

    getDocs(q)
      .then(snap => {
        const docs = snap.docs //
          .map(doc => ({ id: doc.id, ...doc.data() }) as Booking)
          .filter((b): b is PhotoBooking => !!b.photoUrl && b.photoUrl.trim() !== "");
        setAllPhotos(docs);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!expandedId) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpandedId(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [expandedId]);

  const photos = activeRoom === "全部" ? allPhotos : allPhotos.filter(b => b.room === activeRoom);

  const expandedBooking = allPhotos.find(b => b.id === expandedId);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[40vh]">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-[#5991C4] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full pb-28 md:pb-8">
      <div className="w-full md:max-w-[900px] md:mx-auto">
        {/* 房間篩選 chips */}
        <div className="flex gap-2 pb-4 px-[5%] md:px-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {ROOMS.map(room => (
            <button
              key={room}
              onClick={() => setActiveRoom(room)}
              className={`noto text-sm font-medium px-4 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                activeRoom === room ? "bg-[#5991C4] text-white" : "bg-white text-black/50 hover:text-black/70"
              }`}>
              {room}
            </button>
          ))}
        </div>

        {/* 照片列表 */}
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-40">
            <img src="/img/wall_art_h.svg" alt="照片牆" className="w-14 h-14" />
            <p className="noto text-sm text-black/50">{activeRoom === "全部" ? "近一個月還沒有照片" : `${activeRoom} 近一個月沒有照片`}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-[5%] md:px-4">
            {photos.map(b => {
              const color = ROOM_COLORS[b.room] ?? { text: "#9ca3af", bg: "#f3f4f6" };
              return (
                <div key={b.id} className="bg-white rounded-2xl overflow-hidden">
                  {/* 照片區 */}
                  <div className="relative aspect-video bg-gray-100 overflow-hidden cursor-pointer" onClick={() => setExpandedId(b.id)}>
                    <img src={b.photoUrl} alt={`${b.room} 使用後照片`} className="w-full h-full object-cover" loading="lazy" />
                    <span className="absolute top-3 left-3 noto text-xs font-semibold px-3 py-1 rounded-full" style={{ color: color.text, backgroundColor: color.bg }}>
                      {b.room}
                    </span>
                  </div>

                  {/* 文字區 */}
                  <div className="px-4 pt-3 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="noto text-sm font-semibold text-black/70">{b.name}</span>
                      <span className="font-roboto text-xs text-black/30">{formatTime(b.endTime.toDate())}</span>
                    </div>
                    {b.description && <p className="noto text-sm text-black/40 line-clamp-2">{b.description}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox（點照片區展開全螢幕） */}
      {mounted &&
        expandedBooking &&
        createPortal(
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4" onClick={() => setExpandedId(null)}>
            <div className="relative max-w-[90vw] max-h-[85vh] rounded-2xl overflow-hidden bg-black" onClick={e => e.stopPropagation()}>
              <img src={expandedBooking.photoUrl} alt={`${expandedBooking.room} 使用後照片`} className="max-w-full max-h-[85vh] object-contain" />
              <div className="absolute bottom-0 inset-x-0 px-4 py-3 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-between">
                <span
                  className="noto text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    color: (ROOM_COLORS[expandedBooking.room] ?? { text: "#fff" }).text,
                    backgroundColor: (ROOM_COLORS[expandedBooking.room] ?? { bg: "#333" }).bg,
                  }}>
                  {expandedBooking.room}
                </span>
                <span className="font-roboto text-xs text-white/60">{dayjs(expandedBooking.endTime.toDate()).format("YYYY/MM/DD HH:mm")}</span>
              </div>
              <button
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white text-sm flex items-center justify-center hover:bg-black/60 transition-colors"
                onClick={() => setExpandedId(null)}>
                ✕
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default Wall;

