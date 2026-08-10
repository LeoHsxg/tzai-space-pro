"use client";

import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";
import { Booking } from "../types/booking";
import { getBookingSection } from "../func/bookingUtils";
import MyDialog from "../Components/MyDialog";
import dayjs from "dayjs";
import { ProfileHeader } from "@/Components/desktop/ProfileHeader";
import { UpcomingSection } from "@/Components/desktop/UpcomingSection";
import { HistoryTable } from "@/Components/desktop/HistoryTable";
import { PageEyebrow } from "@/Components/desktop/PageEyebrow";

const SECTION_COLORS = {
  upcoming: "#4d8dc8", // 即將到來
  history: "#9ca3af", // 歷史紀錄
};

const Profile: React.FC = () => {
  const user = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  // 點歷史紀錄任一筆開啟詳情，複用日曆頁那顆 MyDialog
  const [detail, setDetail] = useState<Booking | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    const q = query(collection(db, "bookings"), where("email", "==", user.email));
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Booking);
      data.sort((a, b) => b.startTime.toMillis() - a.startTime.toMillis());
      setBookings(data);
    });
    return () => unsub();
  }, [user?.email]);

  const upcoming = bookings.filter(b => getBookingSection(b) === "upcoming");
  const history = bookings.filter(b => getBookingSection(b) === "history");

  const formatTime = (b: Booking) => `${dayjs(b.startTime.toDate()).format("MM/DD HH:mm")} – ${dayjs(b.endTime.toDate()).format("HH:mm")}`;

  if (!user) {
    return (
      <>
        <div className="lg:hidden w-full pb-20 md:pb-0 px-[8%] md:max-w-[900px] md:m-auto flex items-center justify-center min-h-[40vh]">
          <p className="noto text-sm text-black/50">請先登入以查看個人檔案</p>
        </div>
        <div className="hidden lg:flex min-h-[50vh] items-center justify-center font-[family-name:var(--font-noto-sans-tc)]">
          <p className="text-sm text-[#9AA0A6]">請先登入以查看個人檔案</p>
        </div>
      </>
    );
  }

  return (
    <>
    {/* ══ 行動版（lg 以下，維持原版面） ══════════════════════ */}
    <div className="lg:hidden w-full pb-20 md:pb-0 md:mt-4">
      <div className="w-full md:max-w-[900px] m-auto">
        {/* Profile Header: floating avatar + name/email card */}
        <div className="mx-[5%] md:mx-4 mb-3 flex items-center gap-3">
          {/* Avatar — standalone, outside card */}
          <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 bg-gray-200">
            {user.photoURL ? (
              <img src={user.photoURL} alt="頭像" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <span className="text-gray-500 text-xl font-bold noto">{(user.displayName || user.email || "U")[0].toUpperCase()}</span>
              </div>
            )}
          </div>
          {/* Name + Email card — no shadow */}
          <div className="flex-1 bg-white rounded-2xl px-6 py-3 border border-gray-100 min-w-0">
            <p className="noto font-bold text-black/60 text-base truncate">{user.displayName || "使用者"}</p>
            <p className="noto text-sm text-black/40 truncate -mt-1">{user.email}</p>
          </div>
        </div>

        <div className="flex flex-col gap-6 px-[5%] md:px-4">
          {/* 即將到來 */}
          <section>
            <div className="flex items-center gap-2 mb-2 pl-1">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SECTION_COLORS.upcoming }} />
              <span className="noto text-sm font-semibold shrink-0" style={{ color: SECTION_COLORS.upcoming }}>
                即將到來
              </span>
              <span className="font-roboto font-bold text-sm shrink-0" style={{ color: SECTION_COLORS.upcoming }}>
                {upcoming.length}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            {upcoming.length === 0 ? (
              <p className="noto text-xs text-black/30 pl-[2px]">目前沒有即將到來的借用</p>
            ) : (
              <div className="flex flex-col gap-2">
                {upcoming.map(b => (
                  <div key={b.id} className="bg-white rounded-xl p-4 border border-blue-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="noto font-semibold text-sm text-black/80">{b.room}</p>
                        <p className="noto text-xs text-black/40">{formatTime(b)}</p>
                        <p className="noto text-xs text-black/30 mt-1">{b.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 歷史紀錄 */}
          <section>
            <div className="flex items-center gap-2 mb-2 pl-1">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SECTION_COLORS.history }} />
              <span className="noto text-sm font-semibold text-black/40 shrink-0">歷史紀錄</span>
              <span className="font-roboto font-bold text-sm text-black/40 shrink-0">{history.length}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            {history.length === 0 ? (
              <p className="noto text-xs text-black/30 pl-[2px]">尚無歷史紀錄</p>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setDetail(b)}
                    className="w-full text-left bg-white rounded-xl p-4 border border-gray-100 transition-colors active:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="noto font-semibold text-sm text-black/60">{b.room}</p>
                        <p className="noto text-xs text-black/30">{formatTime(b)}</p>
                      </div>
                      {b.status === "cancelled" && <span className="text-xs text-black/30 noto">已取消</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>

    {/* ══ 桌面版（lg 以上）═════════════════════════════════ */}
    <div className="hidden lg:flex mx-auto w-full max-w-[1280px] flex-col px-10 py-9">
      <PageEyebrow>個人檔案</PageEyebrow>
      <div className="flex flex-col gap-4">
        <ProfileHeader user={user} />
        <UpcomingSection bookings={upcoming} />
        <HistoryTable bookings={history} onRowClick={setDetail} />
      </div>
    </div>

    {/* 歷史紀錄詳情（行動版與桌面版共用） */}
    <MyDialog open={!!detail} onClose={() => setDetail(null)} booking={detail} />
    </>
  );
};

export default Profile;
