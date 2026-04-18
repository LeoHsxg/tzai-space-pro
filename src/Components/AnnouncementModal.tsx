"use client";

import React, { useEffect, useState } from "react";
import { marked } from "marked";
import {
  Dialog,
  DialogContent,
} from "@/Components/ui/dialog";
import type { AnnouncementData } from "@/types/announcement";

const TYPE_CONFIG: Record<
  AnnouncementData["type"],
  { label: string; accent: string; bg: string }
> = {
  info:    { label: "公告", accent: "#5991C4", bg: "#EEF4FB" },
  warning: { label: "注意", accent: "#C4883A", bg: "#FBF4E8" },
  danger:  { label: "警示", accent: "#B85858", bg: "#F7EDED" },
};

interface Props {
  announcement: AnnouncementData | null;
}

function getFingerprint(a: AnnouncementData) {
  return `${a.id}_${a.publishedAt}`;
}

export function AnnouncementModal({ announcement }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!announcement?.showModal) return;
    if (localStorage.getItem("seenAnnouncement") !== getFingerprint(announcement)) {
      setModalOpen(true);
    }
  }, [announcement?.id, announcement?.publishedAt, announcement?.showModal]);

  if (!announcement?.showModal) return null;

  const handleClose = () => {
    localStorage.setItem("seenAnnouncement", getFingerprint(announcement));
    setModalOpen(false);
  };

  const { label, accent, bg } = TYPE_CONFIG[announcement.type];

  return (
    <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent showCloseButton={false} className="p-0 overflow-hidden gap-0">
        {/* Colored top accent strip */}
        <div className="h-1 w-full shrink-0" style={{ backgroundColor: accent }} />

        {/* Header */}
        <div className="px-5 pt-4 pb-3">
          <span
            className="noto inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-3"
            style={{ backgroundColor: bg, color: accent }}
          >
            {label}
          </span>
          <h2 className="noto text-[15px] font-bold text-gray-900 leading-snug">
            {announcement.title}
          </h2>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-5" />

        {/* Content */}
        <div className="px-5 py-4">
          <div
            className="noto text-sm text-gray-500 leading-relaxed prose prose-sm max-w-none
              prose-p:my-1 prose-ul:my-1 prose-li:my-0"
            dangerouslySetInnerHTML={{ __html: marked.parse(announcement.content) as string }}
          />
        </div>

        {/* Action */}
        <div className="px-5 pb-5">
          <button
            onClick={handleClose}
            className="noto w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
            style={{ backgroundColor: accent }}
          >
            我知道了
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
