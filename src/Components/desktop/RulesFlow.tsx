"use client";

import React from "react";

interface RulesFlowProps {
  steps: { title: string; desc: string }[];
}

/** 借用流程 — 桌面橫向三步（步間細直線分隔） */
export function RulesFlow({ steps }: RulesFlowProps) {
  return (
    <div className="rounded-2xl bg-white px-6 py-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
      <p className="mb-4 text-base font-bold text-[#1F2937]">借用流程</p>
      <div className="grid grid-cols-3">
        {steps.map((step, i) => (
          <div key={i} className={`flex flex-col gap-2 px-5 first:pl-0 last:pr-0 ${i < steps.length - 1 ? "border-r border-[#F1F1F1]" : ""}`}>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EAF1F8] font-roboto text-[13px] font-bold text-[#5991C4]">
              {i + 1}
            </span>
            <p className="text-[15px] font-bold text-[#1F2937]">{step.title}</p>
            <p className="-mt-1 text-sm leading-[1.75] text-[#4B5563]">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
