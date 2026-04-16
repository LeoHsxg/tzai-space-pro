"use client";

import React from "react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Toaster } from "@/Components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { UIProvider } from "@/context/UIContext";
import NavBar from "./NavBar";
import Footer from "./Footer";
import { GlobalUI } from "./GlobalUI";
import { AnnouncementModal } from "./AnnouncementModal";
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
          <Toaster position="top-center" richColors />
          <div className="bg-[#F3F3F3] gap-2 min-h-screen flex flex-col relative">
            <GlobalUI />
            <AnnouncementModal announcement={announcement} />
            <NavBar />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </LocalizationProvider>
      </UIProvider>
    </AuthProvider>
  );
}
