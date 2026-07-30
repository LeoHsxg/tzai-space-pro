"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { RulesFlow } from "@/Components/desktop/RulesFlow";
import { RulesList } from "@/Components/desktop/RulesList";
import { SupplementaryCard } from "@/Components/desktop/SupplementaryCard";

const steps = [
  {
    title: "預約申請",
    desc: "最多可提前預約 30 天內時段。同一小組每週限借 3 次，每次上限 4 小時。",
  },
  {
    title: "準時到達",
    desc: "超過預約三十分鐘未使用則視為自動取消，開放其他齋民直接入內使用。",
  },
  {
    title: "環境復原",
    desc: "離開前請打掃乾淨與恢復原狀，並確認門窗、燈光、電扇及電源皆已關閉。",
  },
];

type BadgeVariant = "warning" | "danger" | "neutral";

const rules: { badge: BadgeVariant; symbol: string; text: React.ReactNode }[] = [
  {
    badge: "danger",
    symbol: "×",
    text: (
      <>
        小導師室入內請脫鞋，外層玻璃門可自由開關，但
        <strong className="font-bold text-gray-800">內層防火門任何情況下不能關閉</strong>
        ，違者立即取消本次及後續借用資格。
      </>
    ),
  },
  {
    badge: "warning",
    symbol: "!",
    text: "預約空間後若臨時無法到場，仍須負起維護空間之責任。",
  },
  {
    badge: "neutral",
    symbol: "?",
    text: "若有任何疑問或爭議，請聯絡現任齋長，齋長擁有調解與最終裁決權。",
  },
];

// Brand-aligned palette: low-saturation, warm-toned
const badgeClass: Record<BadgeVariant, string> = {
  warning: "bg-[#CF6C35]", // brand warm orange
  danger: "bg-[#B85858]", // muted warm red (matches brand's low-sat tone)
  neutral: "bg-[#8A9EAF]", // muted blue-gray
};

const supplements: { text: React.ReactNode; faint?: boolean }[] = [
  { text: "仁齋齋團隊保有對以上條例的修改與解釋權，並有權刪除任何預約以及封禁帳號的借用權限。" },
  {
    text: (
      <>
        若齋長需要取得後台管理權限，請聯繫管理員{" "}
        <a href="mailto:leosimba9487@gmail.com" className="text-[#5991C4] underline-offset-2 hover:underline">
          leosimba9487@gmail.com
        </a>
      </>
    ),
  },
  { text: "如有熱心齋民遇到系統或使用層面上的問題需要回報，也歡迎來聯繫管理員。" },
  { text: "貢丸室並不存在。", faint: true },
];

const DISCLAIMER = "借用或使用任何仁齋公共空間視為您已閱讀、了解並同意本條例的所有內容。";

const Rule = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* ══ 行動版（lg 以下，維持原版面） ══════════════════════ */}
      <div
        className="
          lg:hidden
          w-full px-[5%] pb-28
          flex flex-col gap-4
          md:max-w-lg md:mx-auto md:py-8 md:pb-8
          font-[family-name:var(--font-noto-sans-tc)]
        ">
        {/* ── Section 1: 借用流程 — timeline style ─────────────── */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="px-5 pt-4 pb-3">
            <p className="font-bold text-base text-gray-600">借用流程</p>
          </div>
          <div className="h-px bg-gray-100" />

          <div className="px-5 pt-1 pb-4">
            {steps.map((step, i) => {
              const isLast = i === steps.length - 1;
              return (
                <div key={i} className="flex gap-3">
                  {/* Timeline track: badge + vertical connector */}
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-[#5991C4] flex-shrink-0 mt-4" />
                    {!isLast && <div className="w-px flex-1 bg-gray-200 mt-2.5" />}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 min-w-0 pt-3 ${isLast ? "pb-2" : "pb-2"}`}>
                    <p className="font-bold text-sm text-gray-700 leading-snug">{step.title}</p>
                    <p className="text-sm text-gray-500 leading-relaxed mt-1">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Section 2: 空間使用守則 ──────────────────────────── */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="px-5 pt-4 pb-3">
            <p className="font-bold text-base text-gray-700">空間使用守則</p>
          </div>
          <div className="h-px bg-gray-100" />

          <div className="px-5 pb-2.5">
            {rules.map((rule, i) => (
              <React.Fragment key={i}>
                <div className="flex gap-3 items-start py-3.5">
                  <div className={`w-3 h-3 rounded-full ${badgeClass[rule.badge]} flex-shrink-0 mt-2`} />
                  <p className="text-sm text-gray-600 leading-relaxed flex-1 min-w-0">{rule.text}</p>
                </div>
                {i < rules.length - 1 && <div className="h-px bg-gray-100" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── Section 3: 其他補充事項 (collapsible) ────────────── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button onClick={() => setExpanded(v => !v)} aria-expanded={expanded} className="w-full flex items-center justify-between px-5 py-4 cursor-pointer">
            <span className="text-sm font-medium text-gray-500">其他補充事項</span>
            <ChevronDown
              size={16}
              className={`
                text-gray-400 flex-shrink-0
                transition-transform duration-300 ease-[cubic-bezier(0.65,0,0.35,1)]
                ${expanded ? "rotate-180" : ""}
              `}
            />
          </button>

          {/* Grid accordion — avoids animating height */}
          <div className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.65,0,0.35,1)]" style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}>
            <div className="overflow-hidden min-h-0">
              <div className="px-5 pb-5 flex flex-col gap-2.5">
                {supplements.map((item, i) => (
                  <p key={i} className={`text-sm leading-relaxed ${item.faint ? "text-gray-300" : "text-gray-500"}`}>
                    {item.text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer disclaimer ────────────────────────────────── */}
        <p className="text-xs text-gray-400 text-center px-2 leading-relaxed">{DISCLAIMER}</p>
      </div>

      {/* ══ 桌面版（lg 以上）═════════════════════════════════ */}
      <div className="hidden lg:flex mx-auto w-full max-w-[1200px] flex-col gap-5 px-10 py-8 font-[family-name:var(--font-noto-sans-tc)]">
        <h1 className="text-[23px] font-bold text-[#1F2937]">空間使用守則</h1>
        <RulesFlow steps={steps} />
        <div className="grid grid-cols-[1.7fr_1fr] items-start gap-5">
          <RulesList rules={rules} badgeClass={badgeClass} />
          <SupplementaryCard items={supplements} />
        </div>
        <p className="mx-auto mt-1 max-w-[56ch] text-center text-xs leading-relaxed text-[#9AA0A6]">{DISCLAIMER}</p>
      </div>
    </>
  );
};

export default Rule;
