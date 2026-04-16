"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useUI } from "@/context/UIContext";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import type { AnnouncementData } from "@/types/announcement";

type FormState = Omit<AnnouncementData, "publishedAt">;

const DEFAULT_FORM: FormState = {
  id: "",
  title: "",
  content: "",
  type: "info",
  showModal: false,
};

const Console = () => {
  const user = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { showSnackbar } = useUI();

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/announcements")
      .then((res) => res.json())
      .then((data: AnnouncementData | null) => {
        if (data) {
          setForm({
            id: data.id,
            title: data.title,
            content: data.content,
            type: data.type,
            showModal: data.showModal,
          });
        }
      })
      .catch(() => showSnackbar("載入公告失敗", "error"))
      .finally(() => setLoadingData(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!user) return;
    if (!form.id.trim() || !form.title.trim() || !form.content.trim()) {
      showSnackbar("請填寫所有必填欄位", "warning");
      return;
    }
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message ?? "儲存失敗");
      showSnackbar("公告已發布", "success");
    } catch (err) {
      showSnackbar((err as Error).message || "儲存失敗", "error");
    } finally {
      setSaving(false);
    }
  };

  if (adminLoading) {
    return <div className="p-8 noto text-sm text-black/40">載入中...</div>;
  }
  if (!isAdmin) {
    return <div className="p-8 noto text-sm text-black/40">無管理員權限</div>;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-4">
      <h1 className="noto text-lg font-bold text-gray-800">公告管理</h1>

      <label className="flex flex-col gap-1">
        <span className="noto text-xs text-black/50">公告 ID（日期，如 2025-04-16）</span>
        <Input
          value={form.id}
          onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
          placeholder="YYYY-MM-DD"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="noto text-xs text-black/50">標題</span>
        <Input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="公告標題"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="noto text-xs text-black/50">內容（Markdown）</span>
        <textarea
          className="min-h-[140px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm resize-y outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 noto"
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          placeholder="公告內容..."
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="noto text-xs text-black/50">類型</span>
        <Select
          value={form.type}
          onValueChange={(v) =>
            setForm((f) => ({ ...f, type: v as AnnouncementData["type"] }))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="info">Info（藍色）</SelectItem>
            <SelectItem value="warning">Warning（黃色）</SelectItem>
            <SelectItem value="danger">Danger（紅色）</SelectItem>
          </SelectContent>
        </Select>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.showModal}
          onChange={(e) => setForm((f) => ({ ...f, showModal: e.target.checked }))}
          className="w-4 h-4 accent-blue-500"
        />
        <span className="noto text-sm text-gray-700">發布時彈出公告視窗</span>
      </label>

      <Button
        onClick={handleSave}
        disabled={saving || loadingData}
        className="noto"
      >
        {saving ? "發布中..." : "發布公告"}
      </Button>
    </div>
  );
};

export default Console;
