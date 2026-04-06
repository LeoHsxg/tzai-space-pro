"use client";

import React, { useState } from "react";
import { signInWithRedirect, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { Button } from "@/Components/ui/button";
import { useUI } from "../context/UIContext";

const spinnerStyle: React.CSSProperties = {
  width: "32px",
  height: "32px",
  border: "3px solid #e5e7eb",
  borderTopColor: "#f97316",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const Test: React.FC = () => {
  const { showDialog, hideDialog, showSnackbar } = useUI();
  const [redirecting, setRedirecting] = useState(false);

  const handleRedirectLogin = async () => {
    if (redirecting) return;
    setRedirecting(true);
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  };

  const handleTestLoading = () => {
    showDialog("載入中...");
  };

  const handleTestCustomDialog = () => {
    showDialog(
      "自定義對話框",
      <div className="p-2 text-center">
        <p className="mb-2">這是一個自定義內容的對話框</p>
        <Button onClick={hideDialog}>關閉</Button>
      </div>,
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
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <h1 className="text-3xl font-bold mb-8">UI 元件測試頁面</h1>

      <div className="flex flex-col gap-4">
        {/* 加載圈圈預覽 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">加載圈圈預覽</h2>
          <div className="flex gap-8 items-center flex-wrap">
            {/* 圈圈v1 */}
            <div className="flex flex-col items-center gap-2">
              <div className="bg-[#F3F3F3] p-6 rounded-xl">
                <div style={spinnerStyle} />
              </div>
              <span className="text-xs text-gray-500">小版</span>
            </div>

            {/* 圈圈v2 */}
            <div className="flex flex-col items-center gap-2">
              <div className="bg-[#F3F3F3] p-6 rounded-xl">
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    border: "4px solid #e5e7eb",
                    borderTopColor: "#f97316",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              </div>
              <span className="text-xs text-gray-500">大版</span>
            </div>

            {/* 圈圈v3 白底 */}
            <div className="flex flex-col items-center gap-2">
              <div className="bg-white p-6 rounded-xl border border-gray-100">
                <div style={spinnerStyle} />
              </div>
              <span className="text-xs text-gray-500">白底版</span>
            </div>
          </div>
        </div>
        {/* 登入測試 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">登入測試</h2>
          <p className="text-sm text-gray-500 mb-2">使用 redirect 方式登入（Safari 相容）</p>
          <Button onClick={handleRedirectLogin} disabled={redirecting}>
            {redirecting ? "跳轉中…" : "Redirect 登入"}
          </Button>
        </div>

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
