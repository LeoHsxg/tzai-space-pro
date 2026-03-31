'use client'

import React from "react";
import { Button } from "@/Components/ui/button";
import { useUI } from "../context/UIContext";

const Test: React.FC = () => {
  const { showDialog, hideDialog, showSnackbar } = useUI();

  const handleTestLoading = () => {
    showDialog("載入中...");
  };

  const handleTestCustomDialog = () => {
    showDialog(
      "自定義對話框",
      <div className="p-2 text-center">
        <p className="mb-2">這是一個自定義內容的對話框</p>
        <Button onClick={hideDialog}>關閉</Button>
      </div>
    );
  };

  const handleTestSnackbar = (severity: "success" | "error" | "info" | "warning") => {
    const messages = {
      success: "操作成功！",
      error: "發生錯誤！",
      info: "這是一般訊息",
      warning: "警告訊息！",
    };
    showSnackbar(messages[severity], severity);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">UI 元件測試頁面</h1>

      <div className="flex flex-col gap-4">
        {/* Dialog 測試按鈕 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Dialog 測試</h2>
          <div className="flex gap-2">
            <Button onClick={handleTestLoading}>測試載入中對話框</Button>
            <Button onClick={handleTestCustomDialog}>測試自定義對話框</Button>
          </div>
        </div>

        {/* Snackbar 測試按鈕 */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Snackbar 測試</h2>
          <div className="flex gap-2">
            <Button onClick={() => handleTestSnackbar("success")}>成功訊息</Button>
            <Button onClick={() => handleTestSnackbar("error")}>錯誤訊息</Button>
            <Button onClick={() => handleTestSnackbar("info")}>一般訊息</Button>
            <Button onClick={() => handleTestSnackbar("warning")}>警告訊息</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Test;
