"use client";

import React from "react";

interface RulesListProps {
  rules: { badge: string; text: React.ReactNode }[];
  /** badge variant → Tailwind 背景色 class（沿用 Rule.tsx 的 badgeClass） */
  badgeClass: Record<string, string>;
}

/** 使用守則 — 桌面左欄（色點＋條文，列間分隔線） */
export function RulesList({ rules, badgeClass }: RulesListProps) {
  return (
    <div className="rounded-2xl bg-white px-6 py-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
      <p className="border-b border-[#F1F1F1] pb-3 text-[15px] font-bold text-[#374151]">使用守則</p>
      {rules.map((rule, i) => (
        <div key={i} className={`flex items-start gap-3 py-4 ${i < rules.length - 1 ? "border-b border-[#F1F1F1]" : "pb-1.5"}`}>
          <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${badgeClass[rule.badge] ?? "bg-gray-300"}`} />
          <p className="min-w-0 flex-1 text-[13.5px] leading-relaxed text-[#4B5563]">{rule.text}</p>
        </div>
      ))}
    </div>
  );
}
