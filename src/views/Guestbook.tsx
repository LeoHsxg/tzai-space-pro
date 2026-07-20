"use client";

import React, { useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";

import { useAuth } from "../hooks/useAuth";
import { useIsAdmin } from "../hooks/useIsAdmin";
import { useUI } from "../context/UIContext";

// 留言板後端不在 Firebase，而是獨立部署的 Cloudflare Worker（workers/guestbook/）。
// 沒設定這個環境變數時頁面會顯示施工中，不會壞掉。
const API_URL = process.env.NEXT_PUBLIC_GUESTBOOK_API_URL;

interface GuestbookMessage {
  id: string;
  author_email: string;
  author_name: string;
  body: string;
  created_at: number;
}

const MAX_BODY_LENGTH = 500;

function formatTime(ms: number): string {
  const t = dayjs(ms);
  if (t.isSame(dayjs(), "day")) return t.format("HH:mm");
  if (t.isSame(dayjs(), "year")) return t.format("M/D HH:mm");
  return t.format("YYYY/M/D");
}

const Guestbook = () => {
  const user = useAuth();
  const { isAdmin } = useIsAdmin();
  const { showSnackbar } = useUI();

  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  // 刪除採兩段式確認：第一下變成「確定刪除？」，再點一下才真的刪
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!API_URL || !user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { messages: GuestbookMessage[] };
      setMessages(data.messages);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchMessages();
  }, [user, fetchMessages]);

  const handleSubmit = async () => {
    const trimmed = body.trim();
    if (!trimmed || !user || !API_URL || posting) return;
    setPosting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || "留言失敗，再試一次");
      }
      const created = (await res.json()) as GuestbookMessage;
      setMessages((prev) => [created, ...prev]);
      setBody("");
    } catch (err) {
      showSnackbar((err as Error).message, "error");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !API_URL) return;
    setConfirmDeleteId(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/messages/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || "刪除失敗");
      }
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      showSnackbar((err as Error).message, "error");
    }
  };

  return (
    <div
      className="
        w-full px-[5%] pb-28
        flex flex-col gap-4
        md:max-w-lg md:mx-auto md:py-8 md:pb-8
        font-[family-name:var(--font-noto-sans-tc)]
      ">
      {!API_URL ? (
        <div className="bg-white rounded-2xl px-5 py-10 text-center">
          <p className="text-sm text-gray-400">留言板還在施工中，再等等 🚧</p>
        </div>
      ) : !user ? (
        <div className="bg-white rounded-2xl px-5 py-10 text-center">
          <p className="text-sm text-gray-500">請先登入，才看得到大家的留言</p>
        </div>
      ) : (
        <>
          {/* ── 發文區 ──────────────────────────────────── */}
          <div className="bg-white rounded-2xl px-5 pt-4 pb-3">
            <textarea
              value={body}
              maxLength={MAX_BODY_LENGTH}
              onChange={(e) => setBody(e.target.value)}
              placeholder="留句話給仁齋的大家⋯"
              rows={3}
              className="
                w-full resize-none text-sm text-gray-700 leading-relaxed
                placeholder:text-gray-400 outline-none bg-transparent
              "
            />
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-gray-300">
                {body.length > MAX_BODY_LENGTH - 100 ? `${body.length} / ${MAX_BODY_LENGTH}` : ""}
              </span>
              <button
                onClick={handleSubmit}
                disabled={!body.trim() || posting}
                className="
                  text-sm font-medium text-white bg-[#5991C4] hover:bg-[#4880B0]
                  rounded-xl px-4 py-1.5 transition-colors
                  disabled:bg-gray-200 disabled:text-gray-400
                ">
                {posting ? "送出中⋯" : "送出"}
              </button>
            </div>
          </div>

          {/* ── 留言列表 ────────────────────────────────── */}
          <div className="bg-white rounded-2xl overflow-hidden">
            {loading ? (
              <p className="text-sm text-gray-400 text-center py-10">載入中⋯</p>
            ) : loadError ? (
              <div className="text-center py-10">
                <p className="text-sm text-gray-400">留言載入失敗</p>
                <button onClick={fetchMessages} className="text-sm text-[#5991C4] mt-2 hover:underline underline-offset-2">
                  再試一次
                </button>
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">還沒有任何留言，搶個頭香吧</p>
            ) : (
              messages.map((m, i) => {
                const canDelete = m.author_email === user.email || isAdmin;
                return (
                  <React.Fragment key={m.id}>
                    {i > 0 && <div className="h-px bg-gray-100 mx-5" />}
                    <div className="px-5 py-4">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-bold text-sm text-gray-700 truncate">{m.author_name}</p>
                        <span className="text-xs text-gray-300 flex-shrink-0">{formatTime(m.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed mt-1 whitespace-pre-wrap break-words">{m.body}</p>
                      {canDelete && (
                        <div className="flex justify-end mt-1">
                          {confirmDeleteId === m.id ? (
                            <button onClick={() => handleDelete(m.id)} className="text-xs text-[#B85858] py-1 pl-2">
                              確定刪除？
                            </button>
                          ) : (
                            <button onClick={() => setConfirmDeleteId(m.id)} className="text-xs text-gray-300 hover:text-gray-400 py-1 pl-2">
                              刪除
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Guestbook;
