import React from "react";
import NavLinks from "./NavLinks";
import "../styles/Footer.css";

const Footer = () => {
  return (
    <div className="flex items-center justify-center">
      {/* 手機板 footer 導航欄 */}
      <div className="md:hidden w-full fixed bottom-0 left-0">
        <NavLinks />
      </div>
      {/* 電腦版 footer 版權字樣 */}
      <div className="hidden md:block my-4 text-xs text-gray-500 text-center">© 2025 Tzai-Space. All rights reserved.</div>
    </div>
  );
};

export default Footer;
