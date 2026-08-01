"use client";

import React from "react";
import type { User } from "firebase/auth";
import { avatarChar } from "./avatar";

/** 個人檔案頭像卡（桌面版） */
export function ProfileHeader({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-6 py-5">
      {user.photoURL ? (
        <img src={user.photoURL} alt="頭像" className="h-14 w-14 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#46586B] text-[22px] font-bold text-white">
          {avatarChar(user.displayName, user.email)}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-lg font-bold leading-tight text-[#1F2937]">{user.displayName || "使用者"}</p>
        <p className="mt-1.5 truncate text-[13px] leading-tight text-[#6B7280]">{user.email}</p>
      </div>
    </div>
  );
}
