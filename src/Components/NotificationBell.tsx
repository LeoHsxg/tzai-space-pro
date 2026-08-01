"use client";

import React, { useEffect, useRef, useState } from "react";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { Bell } from "lucide-react";
import { marked } from "marked";
import { db } from "@/firebase/firebase";
import type { AnnouncementData } from "@/types/announcement";
import { Dialog, DialogContent } from "@/Components/ui/dialog";

const READ_KEY = "readNotifications";

const TYPE_CONFIG: Record<AnnouncementData["type"], { label: string; accent: string; bg: string }> = {
  info: { label: "公告", accent: "#5991C4", bg: "#EEF4FB" },
  warning: { label: "提醒", accent: "#EAC42A", bg: "#fbf8e9" },
  danger: { label: "緊急", accent: "#B85858", bg: "#F7EDED" },
};

function getReadIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveReadIds(ids: string[]) {
  localStorage.setItem(READ_KEY, JSON.stringify(ids));
}

// "2025-04-04" → "4月4日"
function formatDate(id: string) {
  const parts = id.split("-");
  if (parts.length !== 3) return id;
  return `${parseInt(parts[1])}月${parseInt(parts[2])}日`;
}

interface NotificationBellProps {
  /**
   * navbar（預設）＝頂欄鈴鐺 icon，面板向下展開；
   * sidebar＝桌面側欄底部的「鈴鐺＋通知」文字按鈕，面板向上展開
   */
  variant?: "navbar" | "sidebar";
}

export function NotificationBell({ variant = "navbar" }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AnnouncementData[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<AnnouncementData | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReadIds(getReadIds());

    getDocs(query(collection(db, "announcements"), orderBy("publishedAt", "desc"), limit(20)))
      .then(snap => {
        const docs = snap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            title: d.title,
            content: d.content,
            type: d.type,
            showModal: d.showModal,
            publishedAt: d.publishedAt?.toDate().toISOString() ?? "",
          } satisfies AnnouncementData;
        });
        setItems(docs);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (selected) return;
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, selected]);

  const unreadCount = items.filter(i => !readIds.includes(i.id)).length;

  const markRead = (id: string) => {
    const next = Array.from(new Set([...readIds, id]));
    setReadIds(next);
    saveReadIds(next);
  };

  const markAllRead = () => {
    const next = items.map(i => i.id);
    setReadIds(next);
    saveReadIds(next);
  };

  const handleItemClick = (item: AnnouncementData) => {
    markRead(item.id);
    setSelected(item);
  };

  const handleDetailClose = () => setSelected(null);

  return (
    <>
      <div ref={ref} className="relative">
        {/* Trigger */}
        {variant === "sidebar" ? (
          <button
            onClick={() => setOpen(v => !v)}
            aria-label="通知"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-[#6B7280] transition-colors hover:bg-gray-50 hover:text-[#374151]">
            <Bell className="h-4 w-4" />
            通知
          </button>
        ) : (
          <button
            onClick={() => setOpen(v => !v)}
            aria-label="通知"
            className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-black/5 transition-colors translate-y-0.5">
            <img src="/img/notifications.svg" className="w-7 h-7" alt="" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        )}

        {/* Dropdown panel */}
        {open && (
          <div
            className={`${
              variant === "sidebar"
                ? "absolute left-0 bottom-full mb-2 w-80"
                : "fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80"
            } bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.10)] border border-gray-100 z-50 overflow-hidden`}>
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="noto text-sm font-bold text-gray-800">系統通知</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="noto text-xs text-[#5991C4] hover:text-[#4880B0] transition-colors">
                  全部已讀
                </button>
              )}
            </div>
            <div className="h-px bg-gray-100" />

            {items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="noto text-sm text-gray-400">暫無通知</p>
              </div>
            ) : (
              <ul className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                {items.map(item => {
                  const isRead = readIds.includes(item.id);
                  const { accent } = TYPE_CONFIG[item.type];
                  return (
                    <li key={item.id} onClick={() => handleItemClick(item)} className={`flex cursor-pointer transition-colors hover:bg-gray-50 ${isRead ? "" : "bg-blue-50/30"}`}>
                      {/* Type color strip */}
                      <div className="w-0.5 shrink-0 self-stretch" style={{ backgroundColor: isRead ? "transparent" : accent }} />

                      {/* Item content */}
                      <div className="flex-1 px-4 py-3 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`noto text-sm leading-snug flex-1 min-w-0 ${isRead ? "text-gray-500 font-normal" : "text-gray-800 font-medium"}`}>{item.title}</p>
                          {!isRead && <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: accent }} />}
                        </div>
                        <p className="roboto text-xs text-gray-400 mt-1">{formatDate(item.id)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Dialog
        open={!!selected}
        onOpenChange={o => {
          if (!o) handleDetailClose();
        }}>
        {selected && (
          <DialogContent showCloseButton={false} className="p-0 overflow-hidden gap-0">
            {/* Type accent strip */}
            <div className="h-1 w-full shrink-0" style={{ backgroundColor: TYPE_CONFIG[selected.type].accent }} />

            {/* Header */}
            <div className="px-4 pt-3 pb-2.5">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="noto inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: TYPE_CONFIG[selected.type].bg,
                    color: TYPE_CONFIG[selected.type].accent,
                  }}>
                  {TYPE_CONFIG[selected.type].label}
                </span>
                <span className="roboto text-xs text-gray-400">{formatDate(selected.id)}</span>
              </div>
              <h2 className="noto text-[15px] font-bold text-gray-900 leading-snug">{selected.title}</h2>
            </div>

            <div className="h-px bg-gray-100 mx-4" />

            {/* Content */}
            <div className="px-4 pt-3 pb-4">
              <div
                className="noto text-sm text-gray-500 leading-relaxed prose prose-sm max-w-none
                  prose-p:my-1 prose-ul:my-1 prose-li:my-0"
                dangerouslySetInnerHTML={{
                  __html: marked.parse(selected.content) as string,
                }}
              />
            </div>

            {/* Action */}
            <div className="px-4 pb-4">
              <button onClick={handleDetailClose} className="noto w-full py-2.5 rounded-xl bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                關閉
              </button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

