"use client";

import React, { useState } from "react";
import { signInWithRedirect, GoogleAuthProvider } from "firebase/auth";
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon } from "lucide-react";
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

type ToastType = "success" | "info" | "warning" | "error";

const TOAST_TYPES: ToastType[] = ["success", "info", "warning", "error"];

const TOAST_ICONS: Record<ToastType, React.ComponentType<{ className?: string }>> = {
  success: CircleCheckIcon,
  info: InfoIcon,
  warning: TriangleAlertIcon,
  error: OctagonXIcon,
};

const TOAST_MESSAGES: Record<ToastType, string> = {
  success: "預約成功。",
  info: "這是一般訊息",
  warning: "請填寫所有必填欄位",
  error: "發生錯誤！",
};

/**
 * Toast 配色候選。A 組是目前實際套用的值（見 App.css）；
 * B、C 只是這一頁的靜態預覽，選定後才寫進 App.css。
 */
const TOAST_PALETTES: {
  name: string;
  note: string;
  styles: Record<ToastType, React.CSSProperties>;
}[] = [
  {
    name: "A｜實心色塊（目前套用）",
    note: "延續原本 info 的作法，四種都是實心底＋白字。存在感最強，遠看就知道成敗。",
    styles: {
      success: { backgroundColor: "#6E9B76", color: "#ffffff" },
      info: { backgroundColor: "#5991C4", color: "#ffffff" },
      warning: { backgroundColor: "#D9A72E", color: "#ffffff" },
      error: { backgroundColor: "#B85858", color: "#ffffff" },
    },
  },
  {
    name: "B｜淺底深字",
    note: "沿用通知面板 TYPE_CONFIG 的淺底＋同色文字。最輕，不打斷閱讀。",
    styles: {
      success: { backgroundColor: "#F0F5F1", color: "#4F7A57" },
      info: { backgroundColor: "#EEF4FB", color: "#5991C4" },
      warning: { backgroundColor: "#FBF8E9", color: "#A8830F" },
      error: { backgroundColor: "#F7EDED", color: "#B85858" },
    },
  },
  {
    name: "C｜白底＋左色條",
    note: "最克制，接近 Threads 的通知樣式。顏色只當標記，不當背景。",
    styles: {
      success: { backgroundColor: "#ffffff", color: "#1F2937", borderLeft: "3px solid #6E9B76" },
      info: { backgroundColor: "#ffffff", color: "#1F2937", borderLeft: "3px solid #5991C4" },
      warning: { backgroundColor: "#ffffff", color: "#1F2937", borderLeft: "3px solid #D9A72E" },
      error: { backgroundColor: "#ffffff", color: "#1F2937", borderLeft: "3px solid #B85858" },
    },
  },
];

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
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Snackbar 測試</h2>
          <p className="text-sm text-gray-500 mb-3">實際觸發，看的是目前套用的配色（A 組）</p>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => handleTestSnackbar("success")}>成功訊息</Button>
            <Button onClick={() => handleTestSnackbar("error")}>錯誤訊息</Button>
            <Button onClick={() => handleTestSnackbar("info")}>一般訊息</Button>
            <Button onClick={() => handleTestSnackbar("warning")}>警告訊息</Button>
          </div>
        </div>

        {/* Toast 配色候選比對 */}
        <div>
          <h2 className="text-xl font-semibold mb-1">Toast 配色</h2>
          <p className="text-sm text-gray-500 mb-4">
            三組候選並排比對。選定後把該組顏色寫進 <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">App.css</code> 的{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">[data-sonner-toast]</code> 區塊即可。
          </p>
          <div className="flex flex-col gap-6">
            {TOAST_PALETTES.map(palette => (
              <div key={palette.name} className="rounded-xl bg-[#F3F3F3] p-5">
                <p className="text-sm font-bold text-gray-800">{palette.name}</p>
                <p className="mt-0.5 mb-3.5 text-xs text-gray-500">{palette.note}</p>
                <div className="flex flex-wrap gap-2.5">
                  {TOAST_TYPES.map(type => {
                    const Icon = TOAST_ICONS[type];
                    return (
                      <div
                        key={type}
                        style={palette.styles[type]}
                        className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                        <Icon className="size-4 shrink-0" />
                        {TOAST_MESSAGES[type]}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Test;
