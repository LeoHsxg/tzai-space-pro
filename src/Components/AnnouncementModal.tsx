"use client";

import React, { useEffect, useState } from "react";
import { marked } from "marked";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import type { AnnouncementData } from "@/types/announcement";

interface Props {
  announcement: AnnouncementData | null;
}

// 用 id + publishedAt 組成 fingerprint，確保同天覆蓋發布時也能重新跳出
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

  const handleModalClose = () => {
    localStorage.setItem("seenAnnouncement", getFingerprint(announcement));
    setModalOpen(false);
  };

  return (
    <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) handleModalClose(); }}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="noto">{announcement.title}</DialogTitle>
        </DialogHeader>
        <div
          className="prose prose-sm max-w-none whitespace-pre-wrap noto text-sm text-muted-foreground"
          dangerouslySetInnerHTML={{
            __html: marked.parse(announcement.content) as string,
          }}
        />
        <DialogFooter>
          <Button onClick={handleModalClose} className="noto w-full sm:w-auto">
            我知道了
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
