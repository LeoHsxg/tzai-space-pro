import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import { Event } from "../types/event";
import { useAuth } from "../hooks/useAuth";
import { useUI } from "../context/UIContext";

interface MyDialogProps {
  open: boolean;
  onClose: () => void;
  event: Event;
  onDeleteSuccess?: () => void;
}

const MyDialog: React.FC<MyDialogProps> = ({ open, onClose, event, onDeleteSuccess }) => {
  const user = useAuth(); // 從 context 拿使用者
  const { showSnackbar, showDialog, hideDialog } = useUI(); // 使用 useUI 來管理 Snackbar
  const [data, setData] = useState<Event | null>(null); // 選中的事件

  const parseEventDescription = (desc: string) => {
    const eventData = {
      name: "",
      email: "",
      phone: "",
      crowdSize: "",
      eventDescription: "",
    };

    if (!desc) {
      console.warn("警告：事件描述為空");
      return eventData;
    }

    // 先把字串分割成多行
    const lines = desc.split("\n");

    for (const line of lines) {
      const parts = line.split(":"); // 以 ":" 分割 Key 和 Value
      if (parts.length < 2) continue; // 確保有 ":" 才處理

      const key = parts[0].trim(); // 取出 Key
      const value = parts.slice(1).join(":").trim(); // 取出 Value（避免值內部也有 ":"）

      // 比對 Key 並填入 eventData
      if (key === "Booked by") eventData.name = value;
      else if (key === "Crowd Size") eventData.crowdSize = value;
      else if (key === "Phone") eventData.phone = value;
      else if (key === "Contact") eventData.email = value;
      else if (key === "Event Description") eventData.eventDescription = value;
      else continue; // 若不是我們要的 Key，就跳過
    }

    return eventData;
  };

  React.useEffect(() => {
    const tmpData: Event = {
      id: event.id || "",
      start: event.start || { dateTime: "" }, // 確保 start 一定有值
      end: event.end || { dateTime: "" }, // 確保 end 一定有值
      summary: event.summary || "",
      description: event.description || "",
      extendedProperties: {
        shared: {
          name: event.extendedProperties?.shared?.name || "",
          crowdSize: event.extendedProperties?.shared?.crowdSize || "",
          phone: event.extendedProperties?.shared?.phone || "",
          email: event.extendedProperties?.shared?.email || "",
          eventDescription: event.extendedProperties?.shared?.eventDescription || "",
        },
      },
    };

    if (!tmpData.extendedProperties.shared.name && tmpData.description) {
      console.log("舊版資料格式");
      const oldData = parseEventDescription(tmpData.description);
      tmpData.extendedProperties = {
        shared: {
          name: oldData.name,
          crowdSize: oldData.crowdSize,
          phone: oldData.phone,
          email: oldData.email,
          eventDescription: oldData.eventDescription,
        },
      };
    }
    setData(tmpData);
  }, [event]);

  // 這個函式沒有被使用到，而且 hideDialog 應該是用在 GlobalUI 裡面
  // 我們這邊用 onClose 就好，所以可以移除這個函式

  const handleDelete = async () => {
    try {
      onClose();
      showDialog("刪除事件中...");

      const response = await fetch("/api/delete/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: event.id,
          email: data?.extendedProperties.shared.email,
        }),
      });

      hideDialog();
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "刪除失敗");
      }

      showSnackbar("刪除成功", "success");

      // 關閉對話框並通知父組件更新
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (error) {
      hideDialog();
      showSnackbar(error instanceof Error ? error.message : "刪除失敗", "error");
    }
  };

  // 檢查當前用戶是否為事件擁有者
  const isEventOwner = user?.email === data?.extendedProperties.shared.email;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        <span className="font-bold text-black/80">{event.summary}</span>
      </DialogTitle>
      {!event ? (
        <div>加載不出資料欸？</div>
      ) : (
        <DialogContent>
          <DialogContentText className="space-y-0.5">
            <div>
              <span className="font-bold">姓名</span> &nbsp;{data?.extendedProperties.shared.name}
            </div>
            <div>
              <span className="font-bold">郵件</span> &nbsp;{data?.extendedProperties.shared.email}
            </div>
            <div>
              <span className="font-bold">人數</span> &nbsp;{data?.extendedProperties.shared.crowdSize}
            </div>
            <div>
              <span className="font-bold">起始</span> &nbsp;{data?.start.dateTime}
            </div>
            <div>
              <span className="font-bold">結束</span> &nbsp;{data?.end.dateTime}
            </div>
            <div>
              <span className="font-bold">簡述</span> &nbsp;{data?.extendedProperties.shared.eventDescription}
            </div>
          </DialogContentText>
        </DialogContent>
      )}
      <DialogActions>
        {isEventOwner && (
          <Button onClick={handleDelete} color="error">
            刪除事件
          </Button>
        )}
        <Button onClick={onClose}>關閉</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MyDialog;
