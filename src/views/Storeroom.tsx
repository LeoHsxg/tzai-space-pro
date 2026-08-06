"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { useAuth } from "../hooks/useAuth";
import { useUI } from "../context/UIContext";

/* ══ 午餐晚餐亂數器 ═══════════════════════════════════════════
   三維度順序固定；均勻亂數、永不加權、不檢查組合合理性。 */

type DimKey = "style" | "protein" | "staple";

const DIMENSIONS: { key: DimKey; label: string; options: string[] }[] = [
  { key: "style", label: "風格", options: ["台式", "日式", "韓式", "美式"] },
  { key: "protein", label: "蛋白", options: ["牛", "豬", "雞", "羊鵝鴨", "素食"] },
  { key: "staple", label: "主食", options: ["麵", "飯", "速食", "小吃"] },
];

const ROLL_TICK_MS = 55; // 跑動換字間隔
const ROLL_BASE_MS = 660; // 第一槽落定時間
const ROLL_STAGGER_MS = 150; // 之後每槽再晚一點落定（拉霸感）

const pick = (pool: string[]) => pool[Math.floor(Math.random() * pool.length)];

type Slot = { value: string | null; settled: boolean };

const INITIAL_SLOTS: Record<DimKey, Slot> = {
  style: { value: null, settled: false },
  protein: { value: null, settled: false },
  staple: { value: null, settled: false },
};

/* ══ 意見箱 ═══════════════════════════════════════════════════ */

const CATEGORIES = ["Bug", "許願", "UI/UX", "其他"];
const JIA_OPTIONS = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二", "十三", "十四"].map(n => `${n}家`);
const MAX_MESSAGE_LENGTH = 1000;

const Storeroom = () => {
  const user = useAuth();
  const { showSnackbar } = useUI();

  /* ── 亂數器狀態 ── */
  const [slots, setSlots] = useState<Record<DimKey, Slot>>(INITIAL_SLOTS);
  const [excluded, setExcluded] = useState<Record<DimKey, string[]>>({ style: [], protein: [], staple: [] });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [shakeDim, setShakeDim] = useState<DimKey | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    []
  );

  const toggleChip = (dim: DimKey, option: string) => {
    const isExcluded = excluded[dim].includes(option);
    if (!isExcluded) {
      const remaining = DIMENSIONS.find(d => d.key === dim)!.options.length - excluded[dim].length;
      if (remaining <= 1) {
        // 守門：最後一個選項不能點掉，整組輕抖提示
        setShakeDim(dim);
        timersRef.current.push(setTimeout(() => setShakeDim(null), 350));
        return;
      }
    }
    setExcluded(prev => ({
      ...prev,
      [dim]: isExcluded ? prev[dim].filter(o => o !== option) : [...prev[dim], option],
    }));
  };

  const roll = () => {
    if (rolling) return;
    const pools = Object.fromEntries(DIMENSIONS.map(d => [d.key, d.options.filter(o => !excluded[d.key].includes(o))])) as Record<DimKey, string[]>;
    const finals = Object.fromEntries(DIMENSIONS.map(d => [d.key, pick(pools[d.key])])) as Record<DimKey, string>;
    setHasRolled(true);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSlots({
        style: { value: finals.style, settled: true },
        protein: { value: finals.protein, settled: true },
        staple: { value: finals.staple, settled: true },
      });
      return;
    }

    setRolling(true);
    setSlots({
      style: { value: pick(pools.style), settled: false },
      protein: { value: pick(pools.protein), settled: false },
      staple: { value: pick(pools.staple), settled: false },
    });
    intervalRef.current = setInterval(() => {
      setSlots(prev => {
        const next = { ...prev };
        DIMENSIONS.forEach(d => {
          if (!next[d.key].settled) next[d.key] = { value: pick(pools[d.key]), settled: false };
        });
        return next;
      });
    }, ROLL_TICK_MS);

    // 由左至右錯開落定
    DIMENSIONS.forEach((d, i) => {
      timersRef.current.push(
        setTimeout(() => {
          setSlots(prev => ({ ...prev, [d.key]: { value: finals[d.key], settled: true } }));
          if (i === DIMENSIONS.length - 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
            setRolling(false);
          }
        }, ROLL_BASE_MS + i * ROLL_STAGGER_MS)
      );
    });
  };

  /* ── 意見箱狀態 ── */
  const [jia, setJia] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [hint, setHint] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  // 想說的話隨內容自動長高（在欄位內捲動太反直覺）
  const autoGrow = () => {
    const el = messageRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const submit = async () => {
    if (sending || !user) return;
    const trimmed = message.trim();
    if (!trimmed) {
      setHint("先寫點想說的再送出唷");
      messageRef.current?.focus();
      return;
    }
    if (!category) {
      setHint("幫我選個類型啦");
      return;
    }
    setSending(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category, message: trimmed, jia: jia || null, name: name.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || "送出失敗，請再試一次");
      }
      setSent(true);
      setHint("");
    } catch (err) {
      showSnackbar((err as Error).message, "error");
    } finally {
      setSending(false);
    }
  };

  const writeAnother = () => {
    setMessage("");
    setCategory(null);
    setSent(false);
  };

  return (
    <div
      className="
        w-full px-[5%] pb-28
        flex flex-col gap-4
        md:max-w-lg md:mx-auto md:py-8 md:pb-8
        font-[family-name:var(--font-noto-sans-tc)]
      ">
      {/* ── 午餐晚餐亂數器 ──────────────────────────────── */}
      <section className="bg-white rounded-2xl overflow-hidden">
        <div className="px-5 pt-3.5 pb-3 flex items-center justify-between">
          <p className="font-bold text-base text-gray-600">午餐晚餐亂數器</p>
          <button
            onClick={() => setFiltersOpen(v => !v)}
            aria-expanded={filtersOpen}
            className="flex items-center gap-1 py-1 pl-2 text-xs text-gray-400 hover:text-gray-500 transition-colors">
            篩選
            <ChevronDown size={14} className={`transition-transform duration-300 ease-[cubic-bezier(0.65,0,0.35,1)] ${filtersOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
        <div className="h-px bg-gray-100" />

        {/* 篩選面板（預設收合、選項預設全開）*/}
        <div className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.65,0,0.35,1)]" style={{ gridTemplateRows: filtersOpen ? "1fr" : "0fr" }}>
          <div className="overflow-hidden min-h-0">
            <div className="px-5 py-1">
              {DIMENSIONS.map((d, i) => (
                <React.Fragment key={d.key}>
                  {i > 0 && <div className="h-px bg-gray-100" />}
                  <div className={`py-3 flex flex-col gap-2 ${shakeDim === d.key ? "animate-shake motion-reduce:animate-none" : ""}`}>
                    <p className="text-xs text-gray-400">{d.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {d.options.map(o => {
                        const off = excluded[d.key].includes(o);
                        return (
                          <button
                            key={o}
                            onClick={() => toggleChip(d.key, o)}
                            aria-pressed={!off}
                            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                              off ? "border-dashed border-gray-200 bg-gray-50 text-gray-300 line-through" : "border-gray-200 bg-white text-gray-600 active:bg-gray-50"
                            }`}>
                            {o}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div className="h-px bg-gray-100" />
          </div>
        </div>

        {/* 三格結果槽（安靜灰底，動的只有文字）*/}
        <div className="px-5 pt-4 pb-5">
          <div className="flex gap-2.5">
            {DIMENSIONS.map(d => {
              const s = slots[d.key];
              return (
                // pb-1：盒子仍是 92px，多 4px 下內距讓 justify-center 的內容往上帶 2px（CJK 視覺補償）
                <div key={d.key} className="flex-1 min-h-[92px] rounded-xl bg-gray-100 flex flex-col items-center justify-center gap-1 pb-1">
                  <span className="text-[11px] text-gray-400">{d.label}</span>
                  {s.settled ? (
                    // key 讓落定時重新掛載，pop 動畫每次都會重跑
                    <span key={`${s.value}-settled`} className="text-lg font-bold text-gray-700 animate-pop motion-reduce:animate-none">
                      {s.value}
                    </span>
                  ) : (
                    <span className="text-lg font-bold text-gray-300">{s.value ?? "?"}</span>
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={roll}
            disabled={rolling}
            className="mt-4 w-full rounded-xl bg-[#5991C4] py-3 text-base font-bold text-white transition-colors hover:bg-[#4880B0] active:translate-y-px disabled:opacity-70">
            {hasRolled ? "再抽" : "抽一波"}
          </button>
        </div>
      </section>

      {/* ── 意見箱 ─────────────────────────────────────── */}
      <section className="bg-white rounded-2xl overflow-hidden">
        <div className="px-5 pt-3.5 pb-3">
          <p className="font-bold text-base text-gray-600">意見箱</p>
        </div>
        <div className="h-px bg-gray-100" />
        <div className="px-5 pt-3.5 pb-5">
          {sent ? (
            <div className="py-8 flex flex-col items-center gap-1.5 text-center animate-fadeUp motion-reduce:animate-none">
              <p className="text-base font-bold text-gray-700">感謝你的填寫 🙌</p>
              <p className="text-sm text-gray-500">魯啦啦魯啦啦</p>
              <button onClick={writeAnother} className="mt-3 text-xs text-gray-400 hover:text-gray-500 transition-colors">
                再寫一則
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 leading-relaxed">如果遇到系統有 bug、有想要的新功能、覺得 UI/UX 有哪裡可以改進，歡迎在這裡留言。</p>
              <p className="mt-3 border-l-2 border-gray-200 pl-3 text-xs text-gray-400 leading-relaxed">
                啊如果是載物相關的問題請上齋版聯繫齋團隊，管理員僅負責系統層面的維護！
              </p>

              {!user ? (
                <div className="mt-4 rounded-xl bg-gray-100 py-6 text-center text-sm text-gray-400">請先登入，才能送出意見</div>
              ) : (
                <>
                  <p className="mt-4 text-xs text-gray-400">類型</p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {CATEGORIES.map(c => (
                      <button
                        key={c}
                        onClick={() => {
                          setCategory(c);
                          if (hint) setHint("");
                        }}
                        aria-pressed={category === c}
                        className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                          category === c ? "border-gray-700 bg-gray-700 text-white" : "border-gray-200 bg-white text-gray-500 active:bg-gray-50"
                        }`}>
                        {c}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-[8rem_1fr] gap-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs text-gray-400">載物</span>
                      {/* value 恆為受控（空值用 null），undefined 會讓元件在受控/非受控間切換 */}
                      <Select value={jia || null} onValueChange={value => setJia((value as string | null) ?? "")}>
                        {/* h-8 帶 data 選擇器，要用 data-[size=default] 才蓋得掉（同 ApplyForm desktop 的做法）*/}
                        <SelectTrigger className="w-full rounded-xl border-0 bg-gray-100 px-4 text-sm font-semibold text-gray-700 data-[size=default]:h-12 data-[placeholder]:text-black/25 focus-visible:ring-2 focus-visible:ring-[#5991C4]/25">
                          {/* 只推文字不推箭頭：CJK 在固定高度容器裡視覺偏低，箭頭本身幾何置中才對 */}
                          <SelectValue className="-translate-y-px" placeholder="幾家" />
                        </SelectTrigger>
                        <SelectContent align="start" alignItemWithTrigger={true} className="ring-0 outline-none py-2 max-h-72 shadow-[0_4px_24px_rgba(0,0,0,0.10)]">
                          {JIA_OPTIONS.map(j => (
                            <SelectItem key={j} className="text-base pt-2.5 pb-3.5 pl-4" value={j}>
                              {j}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs text-gray-400">姓名</span>
                      {/* pb-0.5：高度由 h-12 固定，多 2px 下內距把文字往上帶 1px（同 ApplyForm.css 的 CJK descent 補償）*/}
                      <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="你的名字"
                        maxLength={30}
                        className="h-12 w-full rounded-xl bg-gray-100 px-4 pb-0.5 text-sm font-semibold text-gray-700 placeholder:text-black/25 outline-none focus:ring-2 focus:ring-[#5991C4]/25"
                      />
                    </label>
                  </div>

                  <p className="mt-4 text-xs text-gray-400">想說的話</p>
                  {/* pt/pb 相加維持 24px，autoGrow 量到的 scrollHeight 不受影響 */}
                  <textarea
                    ref={messageRef}
                    value={message}
                    maxLength={MAX_MESSAGE_LENGTH}
                    onChange={e => {
                      setMessage(e.target.value);
                      autoGrow();
                      if (hint) setHint("");
                    }}
                    placeholder="想說的話⋯"
                    rows={4}
                    className="mt-1.5 w-full resize-none overflow-hidden rounded-xl bg-gray-100 px-4 pt-[11px] pb-[13px] text-sm font-semibold leading-relaxed text-gray-700 placeholder:text-black/25 outline-none focus:ring-2 focus:ring-[#5991C4]/25"
                  />

                  <div className="mt-1 flex items-center justify-between min-h-[16px]">
                    <span className="text-xs text-[#CF6C35]">{hint}</span>
                    <span className="text-xs text-gray-300">{message.length > MAX_MESSAGE_LENGTH - 100 ? `${message.length} / ${MAX_MESSAGE_LENGTH}` : ""}</span>
                  </div>

                  <button
                    onClick={submit}
                    disabled={sending}
                    className="mt-3 w-full rounded-xl bg-[#5991C4] py-3 text-base font-bold text-white transition-colors hover:bg-[#4880B0] active:translate-y-px disabled:opacity-70">
                    {sending ? "送出中⋯" : "送出"}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Storeroom;
