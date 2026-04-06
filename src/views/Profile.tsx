'use client'

import React, { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";
import { db, storage } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";
import { Booking } from "../types/booking";
import { getBookingSection } from "../func/bookingUtils";
import { toast } from "sonner";
import dayjs from "dayjs";

const Profile: React.FC = () => {
  const user = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null); // bookingId with expanded photo
  const [loadingPhoto, setLoadingPhoto] = useState<string | null>(null);   // bookingId with loading photo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    const q = query(
      collection(db, "bookings"),
      where("email", "==", user.email)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Booking));
      data.sort((a, b) => b.startTime.toMillis() - a.startTime.toMillis());
      setBookings(data);
    });
    return () => unsub();
  }, [user?.email]);

  const pending = bookings.filter((b) => getBookingSection(b) === "pending");
  const upcoming = bookings.filter((b) => getBookingSection(b) === "upcoming");
  const history = bookings.filter((b) => getBookingSection(b) === "history");

  const handleUploadClick = (bookingId: string) => {
    uploadTargetRef.current = bookingId;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const bookingId = uploadTargetRef.current;
    if (!file || !bookingId || !user) {
      uploadTargetRef.current = null;
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("請上傳圖片檔案");
      uploadTargetRef.current = null;
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("圖片大小不可超過 20MB");
      uploadTargetRef.current = null;
      return;
    }

    e.target.value = "";
    setUploading(bookingId);
    try {
      // 1. 前端壓縮（最大 1MB，長邊 1600px）
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });

      // 2. 上傳至 Firebase Storage
      const ext = file.name.split(".").pop() ?? "jpg";
      const storageRef = ref(storage, `bookings/${bookingId}/${Date.now()}.${ext}`);
      await uploadBytes(storageRef, compressed);
      const downloadUrl = await getDownloadURL(storageRef);

      // 3. PATCH Firestore via API route
      const token = await user.getIdToken();
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ photoUrl: downloadUrl }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "更新失敗");
      }
      toast.success("照片上傳成功！");
    } catch (err) {
      toast.error((err as Error).message || "上傳失敗，請再試一次");
    } finally {
      setUploading(null);
      uploadTargetRef.current = null;
    }
  };

  const togglePhoto = (bookingId: string) => {
    if (expandedPhoto === bookingId) {
      setExpandedPhoto(null);
    } else {
      setExpandedPhoto(bookingId);
      setLoadingPhoto(bookingId);
    }
  };

  const formatTime = (b: Booking) =>
    `${dayjs(b.startTime.toDate()).format("MM/DD HH:mm")} – ${dayjs(b.endTime.toDate()).format("HH:mm")}`;

  if (!user) {
    return (
      <div className="w-full pb-20 md:pb-0 px-[8%] md:max-w-[900px] md:m-auto flex items-center justify-center min-h-[40vh]">
        <p className="noto text-sm text-black/50">請先登入以查看個人檔案</p>
      </div>
    );
  }

  return (
    <div className="w-full pb-20 md:pb-0 md:mt-4">
      <div className="w-full md:max-w-[900px] m-auto">
        <p className="-mt-1 mb-1 px-[8%] noto font-bold text-black/80 text-lg md:mt-0 md:pl-4 md:pr-0">
          個人檔案
        </p>
        <p className="mb-4 px-[8%] noto text-xs text-black/40 md:pl-4 md:pr-0">{user.email}</p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col gap-6 px-[8%] md:px-4">
          {/* 待完成 */}
          <section>
            <h2 className="noto text-sm font-semibold text-red-500 mb-2">
              待完成 {pending.length > 0 && `(${pending.length})`}
            </h2>
            {pending.length === 0 ? (
              <p className="noto text-xs text-black/30">目前沒有待完成項目</p>
            ) : (
              <div className="flex flex-col gap-2">
                {pending.map((b) => (
                  <div key={b.id} className="bg-white rounded-xl p-4 flex flex-col gap-2 border border-red-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="noto font-semibold text-sm text-black/80">{b.room}</p>
                        <p className="noto text-xs text-black/40">{formatTime(b)}</p>
                      </div>
                      <button
                        onClick={() => handleUploadClick(b.id)}
                        disabled={uploading === b.id}
                        className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold noto hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploading === b.id ? "上傳中…" : "上傳照片"}
                      </button>
                    </div>
                    <p className="noto text-xs text-red-400">請上傳使用後的空間照片以完成借用紀錄</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 即將到來 */}
          <section>
            <h2 className="noto text-sm font-semibold text-blue-500 mb-2">
              即將到來 {upcoming.length > 0 && `(${upcoming.length})`}
            </h2>
            {upcoming.length === 0 ? (
              <p className="noto text-xs text-black/30">目前沒有即將到來的借用</p>
            ) : (
              <div className="flex flex-col gap-2">
                {upcoming.map((b) => (
                  <div key={b.id} className="bg-white rounded-xl p-4 border border-blue-50">
                    <p className="noto font-semibold text-sm text-black/80">{b.room}</p>
                    <p className="noto text-xs text-black/40">{formatTime(b)}</p>
                    <p className="noto text-xs text-black/30 mt-1">{b.description}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 歷史紀錄 */}
          <section>
            <h2 className="noto text-sm font-semibold text-black/40 mb-2">歷史紀錄</h2>
            {history.length === 0 ? (
              <p className="noto text-xs text-black/30">尚無歷史紀錄</p>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map((b) => (
                  <div key={b.id} className="bg-white rounded-xl p-4 border border-gray-100 opacity-70">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="noto font-semibold text-sm text-black/60">{b.room}</p>
                        <p className="noto text-xs text-black/30">{formatTime(b)}</p>
                      </div>
                      {b.status === "cancelled" ? (
                        <span className="text-xs text-black/30 noto">已取消</span>
                      ) : b.photoUrl ? (
                        <button
                          onClick={() => togglePhoto(b.id)}
                          className="text-xs text-blue-400 noto flex items-center gap-1 hover:text-blue-500 transition-colors"
                        >
                          查看照片
                          <span className={`transition-transform duration-200 inline-block ${expandedPhoto === b.id ? "rotate-180" : ""}`}>
                            ▾
                          </span>
                        </button>
                      ) : null}
                    </div>

                    {/* 展開照片（lazy load：只有展開時才設 src） */}
                    {b.photoUrl && expandedPhoto === b.id && (
                      <div className="mt-3 rounded-lg overflow-hidden relative">
                        {loadingPhoto === b.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-400 rounded-full animate-spin" />
                          </div>
                        )}
                        <img
                          src={b.photoUrl}
                          alt={`${b.room} 使用後照片`}
                          className="w-full object-cover rounded-lg"
                          onLoad={() => setLoadingPhoto(null)}
                          onError={() => setLoadingPhoto(null)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
