"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { Boxes, CalendarDays, FileText, LogOut, Plus } from "lucide-react";
import { auth, signInWithGoogle } from "@/firebase/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useApplyDialog } from "@/context/ApplyDialogContext";
import { NotificationBell } from "@/Components/NotificationBell";
import { avatarChar } from "./avatar";

const NAV_ITEMS = [
  { href: "/", label: "借用日曆", Icon: CalendarDays },
  { href: "/rule", label: "空間守則", Icon: FileText },
  { href: "/storeroom", label: "雜物間", Icon: Boxes },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuth();
  const { openApply } = useApplyDialog();

  const onProfile = pathname === "/profile";

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col border-r border-[#ECECEC] bg-white px-4 pt-6 pb-5">
      <Link href="/" className="px-3">
        <img src="/img/LOGO_9x3.svg" alt="tzai" className="h-6 w-auto" />
      </Link>

      <nav className="mt-8 flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-[10px] px-3 py-3 text-sm transition-colors ${
                active ? "bg-[#EAF1F8] font-semibold text-[#3E6B92]" : "text-[#5B6572] hover:bg-gray-50"
              }`}>
              <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-[#5991C4]" : "text-[#8B97A3]"}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* pr-2：加號比文字視覺輕，幾何置中會偏右，右側留白把內容往左推 4px */}
      <button
        onClick={() => openApply()}
        className="mt-5 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-[#5991C4] pr-2 text-sm font-semibold text-white transition-colors hover:bg-[#4880B0]">
        <Plus className="h-4 w-4" />
        申請借用
      </button>

      <div className="mt-auto flex flex-col gap-3">
        {user ? (
          <Link
            href="/profile"
            className={`flex items-center gap-2.5 rounded-xl border p-2.5 transition-colors ${
              onProfile ? "border-[#5991C4] bg-[#EAF1F8]" : "border-[#ECECEC] hover:bg-gray-50"
            }`}>
            {user.photoURL ? (
              <img src={user.photoURL} alt="頭像" className="h-8 w-8 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#46586B] text-[13px] font-bold text-white">
                {avatarChar(user.displayName, user.email)}
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold leading-tight text-[#1F2937]">{user.displayName || "使用者"}</span>
              <span className="block truncate text-[11px] leading-tight text-[#9AA0A6]">{user.email}</span>
            </span>
          </Link>
        ) : (
          <button
            onClick={() => signInWithGoogle().catch(err => console.error("登入失敗：", err))}
            className="flex items-center justify-center rounded-xl border border-[#D9DEE4] px-3 py-2.5 text-sm text-[#5B6572] transition-colors hover:bg-gray-50">
            使用 Google 登入
          </button>
        )}

        <div className="flex items-center justify-between">
          <NotificationBell variant="sidebar" />
          {user && (
            <button
              onClick={() => signOut(auth).catch(err => console.error("登出失敗：", err))}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] text-[#9AA0A6] transition-colors hover:bg-gray-50 hover:text-[#5B6572]">
              <LogOut className="h-[15px] w-[15px]" />
              登出
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
