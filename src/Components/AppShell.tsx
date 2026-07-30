"use client";

import React from "react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Toaster } from "@/Components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { UIProvider } from "@/context/UIContext";
import { ApplyDialogProvider } from "@/context/ApplyDialogContext";
import NavBar from "./NavBar";
import Footer from "./Footer";
import { GlobalUI } from "./GlobalUI";
import { AnnouncementModal } from "./AnnouncementModal";
import { Sidebar } from "./desktop/Sidebar";
import { ApplyDialog } from "./desktop/ApplyDialog";
import type { AnnouncementData } from "@/types/announcement";

interface AppShellProps {
  children: React.ReactNode;
  announcement: AnnouncementData | null;
}

export function AppShell({ children, announcement }: AppShellProps) {
  return (
    <AuthProvider>
      <UIProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <ApplyDialogProvider>
            <Toaster position="top-center" richColors />
            <div className="bg-[#F3F3F3] gap-2 min-h-screen flex flex-col relative">
              <GlobalUI />
              <AnnouncementModal announcement={announcement} />
              <NavBar />
              {/* 桌面版常駐側欄（lg 以上），主內容讓出 240px */}
              <Sidebar />
              <main className="flex-grow lg:pl-60">{children}</main>
              <Footer />
              {/* 桌面版申請借用 Dialog（側欄按鈕／當日面板共用） */}
              <ApplyDialog />
            </div>
          </ApplyDialogProvider>
        </LocalizationProvider>
      </UIProvider>
    </AuthProvider>
  );
}
