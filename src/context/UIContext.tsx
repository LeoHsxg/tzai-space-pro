'use client'

import React, { createContext, useContext, useState } from "react";
import { toast } from "sonner";

interface DialogState {
  open: boolean;
  title?: string;
  content?: React.ReactNode;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

interface UIContextType {
  dialog: DialogState;
  showDialog: (title?: string, content?: React.ReactNode) => void;
  hideDialog: () => void;
  snackbar: SnackbarState;
  showSnackbar: (message: string, severity: "success" | "error" | "info" | "warning") => void;
  hideSnackbar: () => void;
}

const UIContext = createContext<UIContextType | null>(null);

const noopUI = {
  dialog: { open: false } as DialogState,
  showDialog: () => {},
  hideDialog: () => {},
  snackbar: { open: false, message: "", severity: "info" as const } as SnackbarState,
  showSnackbar: () => {},
  hideSnackbar: () => {},
};

export const useUI = () => useContext(UIContext) ?? noopUI;

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    title: "",
    content: null,
  });

  const [snackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  const showDialog = (title?: string, content?: React.ReactNode) => {
    setDialog({ open: true, title, content });
  };

  const hideDialog = () => {
    setDialog(prev => ({ ...prev, open: false }));
  };

  const showSnackbar = (message: string, severity: "success" | "error" | "info" | "warning") => {
    toast[severity](message);
  };

  const hideSnackbar = () => {};

  return (
    <UIContext.Provider
      value={{ dialog, showDialog, hideDialog, snackbar, showSnackbar, hideSnackbar }}>
      {children}
    </UIContext.Provider>
  );
};
