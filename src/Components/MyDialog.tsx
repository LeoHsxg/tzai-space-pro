'use client'

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Booking } from "../types/booking";
import { useAuth } from "../hooks/useAuth";
import { useUI } from "../context/UIContext";
import dayjs from "dayjs";

interface MyDialogProps {
  open: boolean;
  onClose: () => void;
  booking: Booking | null;
}

const MyDialog: React.FC<MyDialogProps> = ({ open, onClose, booking }) => {
  const user = useAuth();
  const { showSnackbar, showDialog, hideDialog } = useUI();

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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-bold text-black/80">{booking?.room}</DialogTitle>
        </DialogHeader>
        {!booking ? (
          <div>加載不出資料欸？</div>
        ) : (
          <div className="space-y-0.5 text-sm text-muted-foreground">
            <div>
              <span className="font-bold text-foreground">姓名</span>&nbsp;{booking.name}
            </div>
            <div>
              <span className="font-bold text-foreground">郵件</span>&nbsp;{booking.email}
            </div>
            <div>
              <span className="font-bold text-foreground">人數</span>&nbsp;{booking.crowdSize}
            </div>
            <div>
              <span className="font-bold text-foreground">起始</span>&nbsp;
              {dayjs(booking.startTime.toDate()).format("YYYY-MM-DD HH:mm")}
            </div>
            <div>
              <span className="font-bold text-foreground">結束</span>&nbsp;
              {dayjs(booking.endTime.toDate()).format("YYYY-MM-DD HH:mm")}
            </div>
            <div>
              <span className="font-bold text-foreground">簡述</span>&nbsp;{booking.description}
            </div>
          </div>
        )}
        <DialogFooter>
          {isEventOwner && (
            <Button variant="destructive" onClick={handleDelete}>
              刪除預約
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            關閉
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MyDialog;
