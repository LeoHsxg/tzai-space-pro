"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface SupplementaryCardProps {
  items: { text: React.ReactNode; faint?: boolean }[];
}

/** 其他補充事項 — 桌面右欄（預設展開，可收合） */
export function SupplementaryCard({ items }: SupplementaryCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-2xl bg-white px-6 py-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
      <button onClick={() => setExpanded(v => !v)} aria-expanded={expanded} className="flex w-full cursor-pointer items-center justify-between">
        <span className="text-base font-bold text-[#1F2937]">其他補充事項</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition-transform duration-300 ease-[cubic-bezier(0.65,0,0.35,1)] ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.65,0,0.35,1)]"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}>
        <div className="min-h-0 overflow-hidden">
          {/* 分隔線放在展開內容裡，與隔壁「使用守則」卡對齊；收合時不留懸空的線 */}
          <div className="mt-4 flex flex-col gap-3 border-t border-[#E8E8E8] pt-[18px]">
            {items.map((item, i) => (
              <p key={i} className={`text-sm leading-[1.85] ${item.faint ? "text-gray-300" : "text-[#4B5563]"}`}>
                {item.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
