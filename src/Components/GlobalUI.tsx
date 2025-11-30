// src/Components/GlobalUI.tsx
import React from "react";
import { Dialog, DialogTitle, DialogContent, CircularProgress } from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { useUI } from "../context/UIContext";

export const GlobalUI = () => {
  const { dialog, hideDialog, snackbar, hideSnackbar } = useUI();

  const handleDialogClose = (_event: React.SyntheticEvent | object, reason?: "backdropClick" | "escapeKeyDown") => {
    if (!dialog.content) {
      if (reason === "backdropClick" || reason === "escapeKeyDown") return;
    }
    hideDialog(); // 只呼叫沒有參數的版本
  };

  return (
    <>
      {/* Dialog */}
      <Dialog
        open={dialog.open}
        onClose={handleDialogClose}
        aria-labelledby="loading-dialog"
        fullWidth
        maxWidth="xs"
        sx={{
          "& .MuiBackdrop-root": {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
          },
        }}>
        <DialogTitle id="loading-dialog" className="font-bold font-noto">
          {dialog.title || "處理中..."}
        </DialogTitle>
        <DialogContent className="flex flex-col items-center">
          {dialog.content || (
            <div className="my-3">
              <CircularProgress />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ zIndex: 9999 }}>
        <Alert onClose={hideSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};
