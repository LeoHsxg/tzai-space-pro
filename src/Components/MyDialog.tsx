'use client'

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
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
  const user = useAuth();
  const { showSnackbar, showDialog, hideDialog } = useUI();
  const [data, setData] = useState<Event | null>(null);

  const parseEventDescription = (desc: string) => {
    const eventData = { name: "", email: "", phone: "", crowdSize: "", eventDescription: "" };
    if (!desc) {
      console.warn("警告：事件描述為空");
      return eventData;
    }
    const lines = desc.split("\n");
    for (const line of lines) {
      const parts = line.split(":");
      if (parts.length < 2) continue;
      const key = parts[0].trim();
      const value = parts.slice(1).join(":").trim();
      if (key === "Booked by") eventData.name = value;
      else if (key === "Crowd Size") eventData.crowdSize = value;
      else if (key === "Phone") eventData.phone = value;
      else if (key === "Contact") eventData.email = value;
      else if (key === "Event Description") eventData.eventDescription = value;
    }
    return eventData;
  };

  React.useEffect(() => {
    const tmpData: Event = {
      id: event.id || "",
      start: event.start || { dateTime: "" },
      end: event.end || { dateTime: "" },
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

  const handleDelete = async () => {
    try {
      onClose();
      showDialog("刪除事件中...");
      const response = await fetch("/api/delete/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          email: data?.extendedProperties.shared.email,
        }),
      });
      hideDialog();
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "刪除失敗");
      showSnackbar("刪除成功", "success");
      if (onDeleteSuccess) onDeleteSuccess();
    } catch (error) {
      hideDialog();
      showSnackbar(error instanceof Error ? error.message : "刪除失敗", "error");
    }
  };

  const isEventOwner = user?.email === data?.extendedProperties.shared.email;

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-bold text-black/80">{event.summary}</DialogTitle>
        </DialogHeader>
        {!event ? (
          <div>加載不出資料欸？</div>
        ) : (
          <div className="space-y-0.5 text-sm text-muted-foreground">
            <div><span className="font-bold text-foreground">姓名</span>&nbsp;{data?.extendedProperties.shared.name}</div>
            <div><span className="font-bold text-foreground">郵件</span>&nbsp;{data?.extendedProperties.shared.email}</div>
            <div><span className="font-bold text-foreground">人數</span>&nbsp;{data?.extendedProperties.shared.crowdSize}</div>
            <div><span className="font-bold text-foreground">起始</span>&nbsp;{data?.start.dateTime}</div>
            <div><span className="font-bold text-foreground">結束</span>&nbsp;{data?.end.dateTime}</div>
            <div><span className="font-bold text-foreground">簡述</span>&nbsp;{data?.extendedProperties.shared.eventDescription}</div>
          </div>
        )}
        <DialogFooter>
          {isEventOwner && (
            <Button variant="destructive" onClick={handleDelete}>刪除事件</Button>
          )}
          <Button variant="outline" onClick={onClose}>關閉</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MyDialog;
