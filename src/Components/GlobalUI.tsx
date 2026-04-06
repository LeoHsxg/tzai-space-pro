"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import { useUI } from "../context/UIContext";

const loadingSpinnerStyle: React.CSSProperties = {
  width: "24px",
  height: "24px",
  border: "2px solid #d1d5db",
  borderTopColor: "#f97316",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

export const GlobalUI = () => {
  const { dialog, hideDialog } = useUI();

  return (
    <Dialog
      open={dialog.open}
      onOpenChange={open => {
        if (!open && dialog.content) hideDialog();
      }}>
      <DialogContent className="max-w-xs" showCloseButton={!!dialog.content}>
        <DialogHeader>
          <DialogTitle className="font-bold font-noto">{dialog.title || "處理中..."}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center">{dialog.content || <div style={{ ...loadingSpinnerStyle, margin: "12px" }} />}</div>
      </DialogContent>
    </Dialog>
  );
};
