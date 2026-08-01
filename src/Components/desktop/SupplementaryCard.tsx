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
        {/* 刻意比「使用守則」弱一級：補充內容不該跟主守則搶視線（與行動版一致） */}
        <span className="text-[15px] font-medium text-[#6B7280]">其他補充事項</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition-transform duration-300 ease-[cubic-bezier(0.65,0,0.35,1)] ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.65,0,0.35,1)]"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}>
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-2.5 pt-4">
            {items.map((item, i) => (
              <p key={i} className={`text-[13.5px] leading-[1.6] ${item.faint ? "text-gray-300" : "text-[#6B7280]"}`}>
                {item.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
