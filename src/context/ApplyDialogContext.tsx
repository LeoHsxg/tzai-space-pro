"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import type { Dayjs } from "dayjs";

interface ApplyDialogContextValue {
  open: boolean;
  /** 「於此日申請」帶入的日期；由側欄開啟時為 null */
  defaultDate: Dayjs | null;
  openApply: (date?: Dayjs) => void;
  closeApply: () => void;
}

const ApplyDialogContext = createContext<ApplyDialogContextValue | null>(null);

export function ApplyDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [defaultDate, setDefaultDate] = useState<Dayjs | null>(null);

  const openApply = useCallback((date?: Dayjs) => {
    setDefaultDate(date ?? null);
    setOpen(true);
  }, []);

  const closeApply = useCallback(() => setOpen(false), []);

  return <ApplyDialogContext.Provider value={{ open, defaultDate, openApply, closeApply }}>{children}</ApplyDialogContext.Provider>;
}

export function useApplyDialog() {
  const ctx = useContext(ApplyDialogContext);
  if (!ctx) throw new Error("useApplyDialog 必須在 ApplyDialogProvider 內使用");
  return ctx;
}
