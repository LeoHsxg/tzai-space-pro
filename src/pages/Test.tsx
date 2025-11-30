import React from "react";
import { Button, Box, Typography } from "@mui/material";
import { useUI } from "../context/UIContext";

const Test: React.FC = () => {
  const { showDialog, hideDialog, showSnackbar } = useUI();

  // 自定義 Dialog 標題（預設為 Loading Dialog）
  const handleTestLoading = () => {
    showDialog("載入中...");
    // 3秒後自動關閉
    // setTimeout(hideDialog, 3000);
  };

  // 自定義 Dialog 標題與內容
  const handleTestCustomDialog = () => {
    showDialog(
      "自定義對話框",
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          這是一個自定義內容的對話框
        </Typography>
        <Button variant="contained" onClick={hideDialog}>
          關閉
        </Button>
      </Box>
    );
  };

  // 測試各種 Snackbar
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
      <Typography variant="h4" sx={{ mb: 4 }}>
        UI 元件測試頁面
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Dialog 測試按鈕 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Dialog 測試
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="contained" onClick={handleTestLoading}>
              測試載入中對話框
            </Button>
            <Button variant="contained" onClick={handleTestCustomDialog}>
              測試自定義對話框
            </Button>
          </Box>
        </Box>

        {/* Snackbar 測試按鈕 */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Snackbar 測試
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="contained" color="success" onClick={() => handleTestSnackbar("success")}>
              成功訊息
            </Button>
            <Button variant="contained" color="error" onClick={() => handleTestSnackbar("error")}>
              錯誤訊息
            </Button>
            <Button variant="contained" color="info" onClick={() => handleTestSnackbar("info")}>
              一般訊息
            </Button>
            <Button variant="contained" color="warning" onClick={() => handleTestSnackbar("warning")}>
              警告訊息
            </Button>
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default Test;
