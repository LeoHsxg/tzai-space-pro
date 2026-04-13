"use client";

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/Components/ui/dialog";

const SECTION_COLORS = {
  pending: "#d94040", // 待完成 — 略深於文字色以補圓點的視覺落差
  upcoming: "#4a88d4", // 即將到來
  history: "#9ca3af", // 歷史紀錄
};

const Profile: React.FC = () => {
  const user = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null); // bookingId with expanded photo
  const [loadingPhoto, setLoadingPhoto] = useState<string | null>(null); // bookingId with loading photo
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null); // 正在執行刪除的 bookingId
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null); // 打開確認 dialog 的 bookingId
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);

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

  const pending = bookings.filter(b => getBookingSection(b) === "pending");
  const upcoming = bookings.filter(b => getBookingSection(b) === "upcoming");
  const history = bookings.filter(b => getBookingSection(b) === "history");

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

  const handleDeletePhoto = async (bookingId: string) => {
    if (!user) return;
    setConfirmDeleteId(null);
    setDeletingPhoto(bookingId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/bookings/${bookingId}/photo`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "刪除失敗");
      }
      toast.success("照片已刪除，借用退回待完成");
      setExpandedPhoto(null);
    } catch (err) {
      toast.error((err as Error).message || "刪除失敗，請再試一次");
    } finally {
      setDeletingPhoto(null);
    }
  };

  const formatTime = (b: Booking) => `${dayjs(b.startTime.toDate()).format("MM/DD HH:mm")} – ${dayjs(b.endTime.toDate()).format("HH:mm")}`;

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

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        <div className="flex flex-col gap-6 px-[5%] md:px-4">
          {/* 待完成 */}
          <section>
            <div className="flex items-center gap-2 mb-2 pl-1">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SECTION_COLORS.pending }} />
              <span className="noto text-sm font-semibold shrink-0" style={{ color: SECTION_COLORS.pending }}>
                待完成
              </span>
              <span className="font-roboto font-bold text-sm shrink-0" style={{ color: SECTION_COLORS.pending }}>
                {pending.length}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            {pending.length === 0 ? (
              <p className="noto text-xs text-black/30 pl-[2px]">目前沒有待完成項目</p>
            ) : (
              <div className="flex flex-col gap-2">
                {pending.map(b => (
                  <div key={b.id} className="bg-white rounded-xl p-4 flex flex-col gap-2 border border-red-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="noto font-semibold text-sm text-black/80">{b.room}</p>
                        <p className="noto text-xs text-black/40">{formatTime(b)}</p>
                      </div>
                      <button
                        onClick={() => handleUploadClick(b.id)}
                        disabled={uploading === b.id}
                        className="px-3 py-1.5 rounded-lg bg-[#e44c4c] text-white text-xs font-semibold noto hover:bg-[#c83c3c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {uploading === b.id ? "上傳中…" : "上傳照片"}
                      </button>
                    </div>
                    <p className="noto text-xs text-[#e44c4c]/60">請上傳使用後的空間照片以完成借用紀錄</p>
                  </div>
                ))}
              </div>
            )}
          </section>

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
                {upcoming.map(b => {
                  const started = dayjs(b.startTime.toDate()).isBefore(dayjs());
                  const needsUpload = b.photoRequired && !b.photoUrl && started;
                  return (
                    <div key={b.id} className="bg-white rounded-xl p-4 border border-blue-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="noto font-semibold text-sm text-black/80">{b.room}</p>
                          <p className="noto text-xs text-black/40">{formatTime(b)}</p>
                          <p className="noto text-xs text-black/30 mt-1">{b.description}</p>
                        </div>
                        {needsUpload && (
                          <button
                            onClick={() => handleUploadClick(b.id)}
                            disabled={uploading === b.id}
                            className="px-3 py-1.5 rounded-lg bg-[#5796DF] text-white text-xs font-semibold noto hover:bg-[#3A7BC8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2 shrink-0">
                            {uploading === b.id ? "上傳中…" : "上傳照片"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                  <div key={b.id} className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="noto font-semibold text-sm text-black/60">{b.room}</p>
                        <p className="noto text-xs text-black/30">{formatTime(b)}</p>
                      </div>
                      {b.status === "cancelled" ? (
                        <span className="text-xs text-black/30 noto">已取消</span>
                      ) : b.photoUrl ? (
                        <button onClick={() => togglePhoto(b.id)} className="text-xs text-[#5796DF] noto flex items-center gap-1 hover:text-[#3A7BC8] transition-colors">
                          查看照片
                          <span className={`transition-transform duration-200 inline-block ${expandedPhoto === b.id ? "rotate-180" : ""}`}>▾</span>
                        </button>
                      ) : null}
                    </div>

                    {/* 展開照片（lazy load：只有展開時才設 src） */}
                    {b.photoUrl && expandedPhoto === b.id && (
                      <div className="mt-3 overflow-hidden relative">
                        {loadingPhoto === b.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
                            <div className="w-5 h-5 border-2 border-gray-300 border-t-[#4a88d4] rounded-full animate-spin" />
                          </div>
                        )}
                        <div className="relative aspect-video bg-gray-100 rounded overflow-hidden">
                          <img
                            src={b.photoUrl}
                            alt={`${b.room} 使用後照片`}
                            className="w-full h-full object-cover"
                            onLoad={() => setLoadingPhoto(null)}
                            onError={() => setLoadingPhoto(null)}
                          />
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <a href={b.photoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-black/30 noto hover:text-black/50 transition-colors">
                            開啟原圖
                          </a>
                          <button
                            onClick={() => setConfirmDeleteId(b.id)}
                            disabled={deletingPhoto === b.id}
                            className="text-xs text-[#e44c4c] noto hover:text-[#c83c3c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                            {deletingPhoto === b.id ? (
                              <>
                                <div className="w-3 h-3 border border-[#e44c4c] border-t-transparent rounded-full animate-spin" />
                                刪除中…
                              </>
                            ) : (
                              "刪除照片"
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* 確認刪除照片 Dialog */}
      <Dialog
        open={confirmDeleteId !== null}
        onOpenChange={open => {
          if (!open) setConfirmDeleteId(null);
        }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="noto">確定要刪除這張照片嗎？</DialogTitle>
            <DialogDescription className="noto">刪除後此借用將退回「待完成」狀態，需要重新上傳照片才能完成紀錄。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 rounded-lg text-sm noto text-black/50 hover:text-black/70 transition-colors">
              取消
            </button>
            <button
              onClick={() => confirmDeleteId && handleDeletePhoto(confirmDeleteId)}
              className="px-4 py-2 rounded-lg bg-[#e44c4c] text-white text-sm font-semibold noto hover:bg-[#c83c3c] transition-colors">
              確認刪除
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
