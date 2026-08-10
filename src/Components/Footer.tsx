"use client";

import React from "react";
import NavLinks from "./NavLinks";
import "../styles/Footer.css";

const Footer = () => {
  return (
    <div className="flex items-center justify-center">
      {/* 手機板 footer 導航欄。
          舊版安卓有實體返回／主頁列時，視窗底部與螢幕底部之間會留一條 safe area，
          白色若只畫到 NavLinks 的高度，那條縫就會露出頁面的 #F3F3F3 底色。
          底色鋪在外層並補上 safe-area 內距，白色才會一路蓋到最底。
          （需搭配 layout.tsx 的 viewportFit: "cover"，否則 env() 會恆為 0） */}
      <div className="md:hidden w-full fixed bottom-0 left-0 bg-white pb-[env(safe-area-inset-bottom)]">
        <NavLinks />
      </div>
      {/* 電腦版 footer 版權字樣（lg 起改用側欄版面，不顯示） */}
      <div className="hidden md:block lg:hidden my-4 text-xs text-gray-500 text-center">© 2025 Tzai-Space. All rights reserved.</div>
    </div>
  );
};

export default Footer;
