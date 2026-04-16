"use client";

import React, { useEffect, useRef, useState } from "react";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { Bell } from "lucide-react";
import { db } from "@/firebase/firebase";
import type { AnnouncementData } from "@/types/announcement";

const READ_KEY = "readNotifications";

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

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AnnouncementData[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReadIds(getReadIds());

    getDocs(query(collection(db, "announcements"), orderBy("publishedAt", "desc"), limit(20)))
      .then((snap) => {
        const docs = snap.docs.map((doc) => {
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
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unreadCount = items.filter((i) => !readIds.includes(i.id)).length;

  const markRead = (id: string) => {
    const next = Array.from(new Set([...readIds, id]));
    setReadIds(next);
    saveReadIds(next);
  };

  const markAllRead = () => {
    const next = items.map((i) => i.id);
    setReadIds(next);
    saveReadIds(next);
  };

  const typeLabel = {
    info: "資訊",
    warning: "注意",
    danger: "重要",
  };

  const typeBadge = {
    info: "bg-blue-100 text-blue-700",
    warning: "bg-yellow-100 text-yellow-700",
    danger: "bg-red-100 text-red-700",
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="通知"
        className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-black/5 transition-colors"
      >
        <Bell className="w-4 h-4 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="noto text-sm font-semibold text-gray-800">系統通知</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="noto text-xs text-blue-600 hover:text-blue-800"
              >
                全部已讀
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-6 text-center noto text-sm text-gray-400">暫無通知</div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {items.map((item) => {
                const isRead = readIds.includes(item.id);
                return (
                  <li
                    key={item.id}
                    onClick={() => markRead(item.id)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isRead ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      {!isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      )}
                      <span
                        className={`noto text-[10px] font-semibold px-1.5 py-0.5 rounded ${typeBadge[item.type]}`}
                      >
                        {typeLabel[item.type]}
                      </span>
                      <span className="noto text-xs text-gray-400 ml-auto shrink-0">
                        {item.id}
                      </span>
                    </div>
                    <p className="noto text-sm text-gray-800 font-medium leading-snug">
                      {item.title}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
