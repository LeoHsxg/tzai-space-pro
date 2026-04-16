"use client";

import React, { useEffect, useState } from "react";
import { marked } from "marked";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import type { AnnouncementData } from "@/types/announcement";

const BANNER_COLORS = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  danger: "bg-red-50 border-red-200 text-red-800",
};

interface Props {
  announcement: AnnouncementData | null;
}

export function AnnouncementModal({ announcement }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    if (!announcement) return;

    if (announcement.showModal) {
      if (localStorage.getItem("seenAnnouncement") !== announcement.id) {
        setModalOpen(true);
      }
    }

    if (sessionStorage.getItem("dismissedBanner") !== announcement.id) {
      setBannerVisible(true);
    }
  }, [announcement?.id, announcement?.showModal]);

  if (!announcement) return null;

  const handleModalClose = () => {
    localStorage.setItem("seenAnnouncement", announcement.id);
    setModalOpen(false);
  };

  const handleBannerDismiss = () => {
    sessionStorage.setItem("dismissedBanner", announcement.id);
    setBannerVisible(false);
  };

  const bannerColor = BANNER_COLORS[announcement.type];

  return (
    <>
      {bannerVisible && (
        <div
          className={`w-full border-b px-4 py-2 flex items-center gap-2 text-sm noto ${bannerColor}`}
        >
          <span className="font-semibold shrink-0">公告</span>
          <span className="truncate">{announcement.title}</span>
          <button
            onClick={handleBannerDismiss}
            aria-label="關閉公告"
            className="ml-auto shrink-0 opacity-60 hover:opacity-100 text-base leading-none"
          >
            ✕
          </button>
        </div>
      )}

      {announcement.showModal && (
        <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) handleModalClose(); }}>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle className="noto">{announcement.title}</DialogTitle>
              <DialogDescription className="noto">
                <div
                  className="prose prose-sm max-w-none whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(announcement.content, { async: false }) as string,
                  }}
                />
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleModalClose} className="noto w-full sm:w-auto">
                我知道了
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
