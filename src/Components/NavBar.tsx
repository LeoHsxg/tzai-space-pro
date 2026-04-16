"use client";

import React, { useState, useEffect } from "react";
import SignBt from "./SignBt";
import NavLinks from "./NavLinks";
import { NotificationBell } from "./NotificationBell";

const NavBar = () => {
  const [sticking, setSticking] = useState(false);

  useEffect(() => {
    const onScroll = () => setSticking(window.scrollY > 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`flex w-full h-18 px-8 py-4 md:h-16 justify-between items-center sticky top-0 z-50 bg-[#F3F3F3] md:border-solid border-b-2 border-gray-200 transition-shadow duration-200 ${
        sticking ? "shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)]" : ""
      }`}>
      <img className="w-16 h-6" src="/img/LOGO_9x3.svg" alt="Logo" />
      <div className="flex items-center gap-4">
        <div className="hidden md:block">
          <NavLinks />
        </div>
        <NotificationBell />
        <SignBt />
      </div>
    </div>
  );
};

export default NavBar;
