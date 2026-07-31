"use client";

import React from "react";
import { X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/Components/ui/dialog";
import { useApplyDialog } from "@/context/ApplyDialogContext";
import ApplyForm from "@/views/ApplyForm";

/** 桌面版申請借用 Dialog（置中、雙欄表單，蓋在變暗的頁面上） */
export function ApplyDialog() {
  const { open, defaultDate, closeApply } = useApplyDialog();

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) closeApply();
      }}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-[#0A0F14]/50 supports-backdrop-filter:backdrop-blur-none"
        className="hidden w-[640px] max-w-[calc(100vw-4rem)] gap-0 rounded-[18px] bg-white p-0 shadow-[0_24px_60px_rgba(0,0,0,0.4)] sm:max-w-[640px] lg:block">
        <div className="flex items-center justify-between border-b border-[#E8E8E8] px-6 py-4 pb-3.5">
          <DialogTitle className="font-sans text-[17px] font-bold text-[#1F2937]">申請借用</DialogTitle>
          <DialogClose
            aria-label="關閉"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#ECECEC] text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600">
            <X className="h-4 w-4" />
          </DialogClose>
        </div>
        {/* key 讓每次開啟都重掛表單，欄位與帶入日期不殘留上一次的狀態 */}
        <ApplyForm
          key={`${open}-${defaultDate ? defaultDate.format("YYYY-MM-DD") : "none"}`}
          variant="desktop"
          defaultDate={defaultDate}
          onSubmitted={closeApply}
          onCancel={closeApply}
        />
      </DialogContent>
    </Dialog>
  );
}
