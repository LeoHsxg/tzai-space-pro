"use client";

import React from "react";

interface RulesListProps {
  rules: { badge: string; text: React.ReactNode }[];
  /** badge variant → Tailwind 背景色 class（沿用 Rule.tsx 的 badgeClass） */
  badgeClass: Record<string, string>;
}

/** 使用守則 — 桌面左欄（色點＋條文，標題下與列間皆有分隔線） */
export function RulesList({ rules, badgeClass }: RulesListProps) {
  return (
    <div className="rounded-2xl bg-white px-6 py-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
      <p className="pb-4 text-base font-bold text-[#1F2937]">使用守則</p>
      <div className="border-t border-[#E8E8E8]">
        {rules.map((rule, i) => (
          <div key={i} className={`flex items-start gap-3.5 py-[18px] ${i < rules.length - 1 ? "border-b border-[#E8E8E8]" : "pb-1"}`}>
            <span className={`mt-[7px] h-3 w-3 shrink-0 rounded-full ${badgeClass[rule.badge] ?? "bg-gray-300"}`} />
            <p className="min-w-0 flex-1 text-sm leading-[1.85] text-[#374151]">{rule.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
