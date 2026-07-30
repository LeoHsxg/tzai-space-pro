"use client";

import React from "react";
import { Dialog, DialogContent } from "@/Components/ui/dialog";
import { Booking, ROOM_COLORS as ROOM_COLOR } from "../types/booking";
import { useAuth } from "../hooks/useAuth";
import { useUI } from "../context/UIContext";
import { useIsAdmin } from "../hooks/useIsAdmin";
import dayjs from "dayjs";

interface MyDialogProps {
  open: boolean;
  onClose: () => void;
  booking: Booking | null;
}

interface InfoRowProps {
  label: string;
  children: React.ReactNode;
  align?: "center" | "start";
}

function InfoRow({ label, children, align = "center" }: InfoRowProps) {
  return (
    <div className={`flex gap-3 ${align === "start" ? "items-start" : "items-center"}`}>
      <span className="noto text-xs text-gray-400 w-8 shrink-0 leading-5">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

const MyDialog: React.FC<MyDialogProps> = ({ open, onClose, booking }) => {
  const user = useAuth();
  const { showSnackbar, showDialog, hideDialog } = useUI();
  const { isAdmin } = useIsAdmin();

  const handleDelete = async () => {
    if (!booking || !user) return;
    try {
      onClose();
      showDialog("刪除預約中...");
      const token = await user.getIdToken();
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      hideDialog();
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "刪除失敗");
      showSnackbar("刪除成功", "success");
    } catch (error) {
      hideDialog();
      showSnackbar(error instanceof Error ? error.message : "刪除失敗", "error");
    }
  };

  const isEventOwner = user?.email === booking?.email;
  const eventStarted = booking ? dayjs(booking.startTime.toDate()).isBefore(dayjs()) : false;
  const canDelete = isAdmin || (isEventOwner && !eventStarted);
  const roomColor = booking ? (ROOM_COLOR[booking.room] ?? "#CCCCCC") : "#CCCCCC";

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) onClose();
      }}>
      <DialogContent showCloseButton={false} className="p-0 overflow-hidden gap-0">
        {!booking ? (
          <div className="p-5 noto text-sm text-gray-400">載入失敗</div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: roomColor }} />
                <h2 className="noto text-base font-bold text-gray-900">{booking.room}</h2>
              </div>
              <p className="roboto text-xs text-gray-400 pl-[18px]">{dayjs(booking.startTime.toDate()).format("YYYY年M月D日")}</p>
            </div>

            <div className="h-px bg-gray-100 mx-4" />

            {/* Info */}
            <div className="px-5 py-3 flex flex-col gap-2.5">
              <InfoRow label="時間">
                <span className="roboto text-sm text-gray-800">
                  {dayjs(booking.startTime.toDate()).format("HH:mm")}
                  <span className="text-gray-300 mx-1.5">—</span>
                  {dayjs(booking.endTime.toDate()).format("HH:mm")}
                </span>
              </InfoRow>
              <InfoRow label="姓名">
                <span className="noto text-sm text-gray-800">{booking.name}</span>
              </InfoRow>
              <InfoRow label="人數">
                <span className="roboto text-sm text-gray-800">{booking.crowdSize} 人</span>
              </InfoRow>
              {booking.description && (
                <InfoRow label="簡述" align="start">
                  <span className="noto text-sm text-gray-700 leading-relaxed">{booking.description}</span>
                </InfoRow>
              )}
              <InfoRow label="信箱">
                <span className="roboto text-xs text-gray-400 truncate block">{booking.email}</span>
              </InfoRow>
            </div>

            {/* Actions */}
            <div className="px-5 pb-4 pt-1 flex flex-col gap-1.5">
              <button
                onClick={onClose}
                className="noto w-full py-2.5 rounded-xl bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 active:bg-gray-200 transition-colors">
                關閉
              </button>
              {canDelete && (
                <button onClick={handleDelete} className="noto w-full py-1 text-sm text-red-400 hover:text-red-500 active:text-red-500 transition-colors">
                  取消預約
                </button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MyDialog;

