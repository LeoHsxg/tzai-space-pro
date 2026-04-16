"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import "../styles/Footer.css";

const NavLinks = () => {
  const currentPath = usePathname();

  const handleClick = () => toast.info("此功能還在施工啦啦啦 🚧");

  return (
    <div className="w-full flex">
      <div className="md:hidden flex w-full h-16 px-[8%] py-3 justify-between z-[100] bg-white shadow">
        <div className="w-full flex justify-between items-center gap-[30px]">
          <img src="/img/info_h.svg" alt="Info" className="icon_h" onClick={handleClick} />
          <Link href="/wall">
            <img src={currentPath === "/wall" ? "/img/wall_art_s.svg" : "/img/wall_art_h.svg"} alt="照片牆" className={currentPath === "/wall" ? "icon_s" : "icon_h"} />
          </Link>
          <Link href="/">
            <img src={currentPath === "/" ? "/img/add_circle_s.svg" : "/img/add_circle_h.svg"} alt="Apply" className={currentPath === "/" ? "icon_s" : "icon_h"} />
          </Link>
          <Link href="/rule">
            <img src={currentPath === "/rule" ? "/img/contract_s.svg" : "/img/contract_h.svg"} alt="Rule" className={currentPath === "/rule" ? "icon_s" : "icon_h"} />
          </Link>
          <Link href="/profile">
            <img src={currentPath === "/profile" ? "/img/profile_s.svg" : "/img/profile_h.svg"} alt="Profile" className={currentPath === "/profile" ? "icon_s" : "icon_h"} />
          </Link>
        </div>
      </div>
      <div className="hidden md:flex grow w-full mx-3 h-12 z-[100]">
        <div className="w-full flex justify-between items-center gap-8">
          <Link href="/">
            <div className="noto text-sm font-medium text-gray-600">日歷</div>
          </Link>
          <Link href="/apply">
            <div className="noto text-sm font-medium text-gray-600">申請</div>
          </Link>
          <Link href="/wall">
            <div className="noto text-sm font-medium text-gray-600">照片牆</div>
          </Link>
          <Link href="/rule">
            <div className="noto text-sm font-medium text-gray-600">借用規章</div>
          </Link>
          <Link href="/profile">
            <div className="noto text-sm font-medium text-gray-600">個人檔案</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NavLinks;
