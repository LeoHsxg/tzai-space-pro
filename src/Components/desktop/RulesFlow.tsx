"use client";

import React from "react";

interface RulesFlowProps {
  steps: { title: string; desc: string }[];
}

/** 借用流程 — 桌面橫向三步（步間細直線分隔） */
export function RulesFlow({ steps }: RulesFlowProps) {
  return (
    <div className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-6 py-5">
      <p className="pb-5 text-base font-bold text-[#1F2937]">借用流程</p>
      <div className="grid grid-cols-3">
        {steps.map((step, i) => (
          <div key={i} className={`flex flex-col px-6 first:pl-0 last:pr-0 ${i < steps.length - 1 ? "border-r border-[#E8E8E8]" : ""}`}>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EAF1F8] font-roboto text-[13px] font-bold text-[#5991C4]">
              {i + 1}
            </span>
            {/* 序號與「標題＋描述」是兩個群組，組間 14px、組內 6px 才有層次 */}
            <p className="mt-3.5 text-[15px] font-bold text-[#1F2937]">{step.title}</p>
            <p className="mt-1.5 text-sm leading-[1.6] text-[#4B5563]">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
