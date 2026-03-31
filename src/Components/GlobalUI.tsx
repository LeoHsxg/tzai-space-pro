'use client'

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { useUI } from "../context/UIContext";

export const GlobalUI = () => {
  const { dialog, hideDialog } = useUI();

  return (
    <Dialog
      open={dialog.open}
      onOpenChange={(open) => {
        if (!open && dialog.content) hideDialog();
      }}
    >
      <DialogContent className="max-w-xs" showCloseButton={!!dialog.content}>
        <DialogHeader>
          <DialogTitle className="font-bold font-noto">
            {dialog.title || "處理中..."}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center">
          {dialog.content || (
            <div className="my-3 w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
