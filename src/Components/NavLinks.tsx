// components/NavLinks.tsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

import Calendar_btn_h from "../img/calendar_month_h.svg";
import Circle_btn_h from "../img/add_circle_h.svg";
import Contract_h from "../img/contract_h.svg";
import Info_btn_h from "../img/info_h.svg";
import Settings_h from "../img/settings_h.svg";
import Calendar_btn_s from "../img/calendar_month_s.svg";
import Circle_btn_s from "../img/add_circle_s.svg";
import Contract_s from "../img/contract_s.svg";
import Info_btn_s from "../img/info_s.svg";
import Settings_s from "../img/settings_s.svg";
import "../styles/Footer.css";

const NavLinks = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  return (
    <div className="w-full flex">
      {/* 手機板導航欄 */}
      <div className="md:hidden flex w-full h-16 px-[8%] py-3 justify-between z-[100] bg-white shadow">
        <div className="w-full flex justify-between items-center gap-[30px]">
          <img src={Info_btn_h} alt="Contract" className="icon_h" onClick={handleClick} />
          <Link to="/">
            <img
              src={`${currentPath === "/" ? Calendar_btn_s : Calendar_btn_h}`}
              alt="Calendar_month"
              className={`${currentPath === "/" ? "icon_s" : "icon_h"}`}
            />
          </Link>
          <Link to="/apply">
            <img
              src={`${currentPath === "/apply" ? Circle_btn_s : Circle_btn_h}`}
              alt="Add_circle"
              className={`${currentPath === "/apply" ? "icon_s" : "icon_h"}`}
            />
          </Link>
          <Link to="/rule">
            <img
              src={`${currentPath === "/rule" ? Contract_s : Contract_h}`}
              alt="Rule"
              className={`${currentPath === "/rule" ? "icon_s" : "icon_h"}`}
            />
          </Link>
          <img src={Settings_h} alt="Settings" className="icon_h" onClick={handleClick} />
        </div>
      </div>

      {/* 電腦版導航欄 */}
      <div className="hidden md:flex grow w-full mx-3 h-12 z-[100]">
        <div className="w-full flex justify-between items-center gap-8">
          <Link to="/">
            <div className="noto text-sm font-medium text-gray-600">日歷</div>
          </Link>
          <Link to="/apply">
            <div className="noto text-sm font-medium text-gray-600">申請</div>
          </Link>
          <Link to="/rule">
            <div className="noto text-sm font-medium text-gray-600">借用規章</div>
          </Link>
          <div className="cursor-pointer noto text-sm font-medium text-gray-600" onClick={handleClick}>
            設定
          </div>
        </div>
      </div>

      {/* 暫時共用的 Snackbar */}
      <Snackbar
        open={open}
        autoHideDuration={2000}
        onClose={handleClose}
        sx={{
          bottom: "4.25rem", // 往上 4rem
        }}>
        <Alert onClose={handleClose} severity="info" sx={{ width: "100%" }} elevation={6} variant="filled">
          此功能還在施工啦啦啦 🚧
        </Alert>
      </Snackbar>
    </div>
  );
};

export default NavLinks;
