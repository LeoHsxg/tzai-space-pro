import React, { createContext, useContext, useState } from "react";

// src/context/UIContext.tsx
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
  // Dialog 相關
  dialog: DialogState;
  showDialog: (title?: string, content?: React.ReactNode) => void;
  hideDialog: () => void;

  // Snackbar 相關
  snackbar: SnackbarState;
  showSnackbar: (message: string, severity: "success" | "error" | "info" | "warning") => void;
  hideSnackbar: () => void;
}

const UIContext = createContext<UIContextType | null>(null);

// 使用 UIContext 通常都要 useContext 來使用，太麻煩了
// 所以為了方便使用，就把 useContext 出來的物件直接傳出去
export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
};

// 把 UIContext.Provider 打包送出去
// 回傳了其他組件會用到的一些 hook 還有包裝好的控制函式
export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  // Dialog 狀態
  // 未賦值/初始值為 Loading Dialog
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    title: "",
    content: null,
  });

  // Snackbar 狀態
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  // Dialog 控制函數
  const showDialog = (title?: string, content?: React.ReactNode) => {
    setDialog({ open: true, title, content });
  };

  const hideDialog = () => {
    setDialog(prev => ({ ...prev, open: false }));
  };

  // Snackbar 控制函數
  const showSnackbar = (message: string, severity: "success" | "error" | "info" | "warning") => {
    setSnackbar({ open: true, message, severity });
  };

  const hideSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <UIContext.Provider
      value={{
        dialog,
        showDialog,
        hideDialog,
        snackbar,
        showSnackbar,
        hideSnackbar,
      }}>
      {children}
    </UIContext.Provider>
  );
};
