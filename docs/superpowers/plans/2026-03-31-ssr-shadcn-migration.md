# SSR + shadcn/ui Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove `output: 'export'` to enable SSR on Firebase App Hosting, and replace MUI components with shadcn/ui (except date pickers).

**Architecture:** Remove the static export constraint from `next.config.ts` and all `dynamic({ ssr: false })` wrappers from page files. Add `apphosting.yaml` for Firebase App Hosting. Install shadcn/ui and replace MUI components phase by phase — starting with primitives (Button, CircularProgress), then toast (Snackbar → sonner), then dialogs, then form inputs. Date pickers (`DateTimePicker`, `DateCalendar`) are explicitly out of scope and stay on MUI.

**Tech Stack:** Next.js 15 App Router, React 18, Firebase App Hosting, shadcn/ui (New York), sonner, Tailwind CSS, TypeScript

---

## File Map

| File | Action | Reason |
|------|--------|--------|
| `next.config.ts` | Modify | Remove `output: 'export'` |
| `src/app/page.tsx` | Modify | Remove `dynamic({ ssr: false })` |
| `src/app/apply/page.tsx` | Modify | Remove `dynamic({ ssr: false })` |
| `src/app/rule/page.tsx` | Modify | Remove `dynamic({ ssr: false })` |
| `apphosting.yaml` | Create | Firebase App Hosting config |
| `src/Components/AppShell.tsx` | Modify | Add `<Toaster />` for sonner |
| `src/context/UIContext.tsx` | Modify | Route `showSnackbar` through sonner |
| `src/Components/GlobalUI.tsx` | Modify | Remove Snackbar, replace MUI Dialog with shadcn, replace CircularProgress |
| `src/Components/NavLinks.tsx` | Modify | Remove local Snackbar state, use sonner |
| `src/Components/MyDialog.tsx` | Modify | Replace MUI Dialog + Button with shadcn |
| `src/views/Calendar.tsx` | Modify | Replace CircularProgress with Tailwind spinner |
| `src/views/ApplyForm.tsx` | Modify | Replace Button, Box, TextField, Select with shadcn |

---

### Task 1: Remove `output: 'export'` and clean up page files

**Files:**
- Modify: `next.config.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/apply/page.tsx`
- Modify: `src/app/rule/page.tsx`

- [ ] **Step 1: Update next.config.ts**

Replace full content:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: "./dist",
};

export default nextConfig;
```

- [ ] **Step 2: Update src/app/page.tsx**

Replace full content:

```tsx
import Calendar from '../views/Calendar'
export default Calendar
```

- [ ] **Step 3: Update src/app/apply/page.tsx**

Replace full content:

```tsx
import ApplyForm from '../../views/ApplyForm'
export default ApplyForm
```

- [ ] **Step 4: Update src/app/rule/page.tsx**

Replace full content:

```tsx
import Rule from '../../views/Rule'
export default Rule
```

- [ ] **Step 5: Verify build succeeds**

```bash
npm run build
```

Expected: exits 0, output in `./dist/`. You should see:
```
Route (app)                Size
┌ ○ /                      ...
├ ○ /apply                 ...
├ ○ /rule                  ...
└ ○ /test                  ...
```

- [ ] **Step 6: Commit**

```bash
git add next.config.ts src/app/page.tsx src/app/apply/page.tsx src/app/rule/page.tsx
git commit -m "feat: remove output:export to enable SSR"
```

---

### Task 2: Add Firebase App Hosting config

**Files:**
- Create: `apphosting.yaml`

- [ ] **Step 1: Create apphosting.yaml at the repo root**

```yaml
runConfig:
  minInstances: 0
```

- [ ] **Step 2: Commit**

```bash
git add apphosting.yaml
git commit -m "chore: add Firebase App Hosting config"
```

---

### Task 3: Initialize shadcn/ui and install components

**Files:**
- Creates: `components.json` (shadcn config)
- Creates: `src/components/ui/button.tsx`, `dialog.tsx`, `input.tsx`, `select.tsx`
- Modifies: `tailwind.config.js`, `src/App.css` (shadcn adds CSS variables)

- [ ] **Step 1: Run shadcn init**

```bash
npx shadcn@latest init
```

When prompted, select:
- Style: **New York**
- Base color: **Zinc**
- CSS variables: **Yes**

- [ ] **Step 2: Install required components**

```bash
npx shadcn@latest add button dialog input select sonner
```

This generates files under `src/components/ui/`.

- [ ] **Step 3: Verify the build still passes**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add components.json src/components/ui/ tailwind.config.js src/App.css
git commit -m "chore: initialize shadcn/ui with button, dialog, input, select, sonner"
```

---

### Task 4: Replace CircularProgress with Tailwind spinner

**Files:**
- Modify: `src/Components/GlobalUI.tsx`
- Modify: `src/views/Calendar.tsx`

- [ ] **Step 1: Update GlobalUI.tsx — replace CircularProgress**

Replace full content (Snackbar and Dialog stay MUI for now — those come in later tasks):

```tsx
'use client'

import React from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { useUI } from "../context/UIContext";

export const GlobalUI = () => {
  const { dialog, hideDialog, snackbar, hideSnackbar } = useUI();

  const handleDialogClose = (_event: React.SyntheticEvent | object, reason?: "backdropClick" | "escapeKeyDown") => {
    if (!dialog.content) {
      if (reason === "backdropClick" || reason === "escapeKeyDown") return;
    }
    hideDialog();
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
            <div className="my-3 w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
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
```

- [ ] **Step 2: Update Calendar.tsx — replace CircularProgress**

Find the loading spinner block (line ~124) and replace only the `<CircularProgress />` with a Tailwind spinner. The rest of the file is unchanged:

```tsx
{loading ? (
  <div className="flex justify-center items-center w-full h-full">
    <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
  </div>
) : (
```

Remove `CircularProgress` from the import at the top of Calendar.tsx:

```tsx
// Before:
import { CircularProgress } from "@mui/material";

// After: delete this line entirely
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/Components/GlobalUI.tsx src/views/Calendar.tsx
git commit -m "feat: replace CircularProgress with Tailwind animate-spin"
```

---

### Task 5: Replace Snackbar with sonner

**Files:**
- Modify: `src/context/UIContext.tsx`
- Modify: `src/Components/AppShell.tsx`
- Modify: `src/Components/GlobalUI.tsx`
- Modify: `src/Components/NavLinks.tsx`

- [ ] **Step 1: Update UIContext.tsx — route showSnackbar through sonner**

Replace full content:

```tsx
'use client'

import React, { createContext, useContext, useState } from "react";
import { toast } from "sonner";

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
  dialog: DialogState;
  showDialog: (title?: string, content?: React.ReactNode) => void;
  hideDialog: () => void;
  snackbar: SnackbarState;
  showSnackbar: (message: string, severity: "success" | "error" | "info" | "warning") => void;
  hideSnackbar: () => void;
}

const UIContext = createContext<UIContextType | null>(null);

const noopUI = {
  dialog: { open: false } as DialogState,
  showDialog: () => {},
  hideDialog: () => {},
  snackbar: { open: false, message: "", severity: "info" as const } as SnackbarState,
  showSnackbar: () => {},
  hideSnackbar: () => {},
};

export const useUI = () => useContext(UIContext) ?? noopUI;

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    title: "",
    content: null,
  });

  // snackbar state kept for interface compatibility; rendering is handled by sonner
  const [snackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  const showDialog = (title?: string, content?: React.ReactNode) => {
    setDialog({ open: true, title, content });
  };

  const hideDialog = () => {
    setDialog(prev => ({ ...prev, open: false }));
  };

  const showSnackbar = (message: string, severity: "success" | "error" | "info" | "warning") => {
    toast[severity](message);
  };

  const hideSnackbar = () => {};

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
```

- [ ] **Step 2: Update AppShell.tsx — add Toaster**

Replace full content:

```tsx
'use client'

import React from 'react'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthContext'
import { UIProvider } from '@/context/UIContext'
import NavBar from './NavBar'
import Footer from './Footer'
import { GlobalUI } from './GlobalUI'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UIProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Toaster position="top-center" richColors />
          <div className="bg-[#F3F3F3] min-h-screen flex flex-col relative">
            <GlobalUI />
            <NavBar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </LocalizationProvider>
      </UIProvider>
    </AuthProvider>
  )
}
```

- [ ] **Step 3: Update GlobalUI.tsx — remove Snackbar/Alert**

Replace full content:

```tsx
'use client'

import React from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { useUI } from "../context/UIContext";

export const GlobalUI = () => {
  const { dialog, hideDialog } = useUI();

  const handleDialogClose = (_event: React.SyntheticEvent | object, reason?: "backdropClick" | "escapeKeyDown") => {
    if (!dialog.content) {
      if (reason === "backdropClick" || reason === "escapeKeyDown") return;
    }
    hideDialog();
  };

  return (
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
          <div className="my-3 w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
        )}
      </DialogContent>
    </Dialog>
  );
};
```

- [ ] **Step 4: Update NavLinks.tsx — remove local Snackbar, use sonner directly**

Replace full content:

```tsx
'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'
import '../styles/Footer.css'

const NavLinks = () => {
  const currentPath = usePathname()

  const handleClick = () => toast.info('此功能還在施工啦啦啦 🚧')

  return (
    <div className="w-full flex">
      {/* 手機板導航欄 */}
      <div className="md:hidden flex w-full h-16 px-[8%] py-3 justify-between z-[100] bg-white shadow">
        <div className="w-full flex justify-between items-center gap-[30px]">
          <img src="/img/info_h.svg" alt="Info" className="icon_h" onClick={handleClick} />
          <Link href="/">
            <img
              src={currentPath === '/' ? '/img/calendar_month_s.svg' : '/img/calendar_month_h.svg'}
              alt="Calendar"
              className={currentPath === '/' ? 'icon_s' : 'icon_h'}
            />
          </Link>
          <Link href="/apply">
            <img
              src={currentPath === '/apply' ? '/img/add_circle_s.svg' : '/img/add_circle_h.svg'}
              alt="Apply"
              className={currentPath === '/apply' ? 'icon_s' : 'icon_h'}
            />
          </Link>
          <Link href="/rule">
            <img
              src={currentPath === '/rule' ? '/img/contract_s.svg' : '/img/contract_h.svg'}
              alt="Rule"
              className={currentPath === '/rule' ? 'icon_s' : 'icon_h'}
            />
          </Link>
          <img src="/img/settings_h.svg" alt="Settings" className="icon_h" onClick={handleClick} />
        </div>
      </div>

      {/* 電腦版導航欄 */}
      <div className="hidden md:flex grow w-full mx-3 h-12 z-[100]">
        <div className="w-full flex justify-between items-center gap-8">
          <Link href="/"><div className="noto text-sm font-medium text-gray-600">日歷</div></Link>
          <Link href="/apply"><div className="noto text-sm font-medium text-gray-600">申請</div></Link>
          <Link href="/rule"><div className="noto text-sm font-medium text-gray-600">借用規章</div></Link>
          <div className="cursor-pointer noto text-sm font-medium text-gray-600" onClick={handleClick}>設定</div>
        </div>
      </div>
    </div>
  )
}

export default NavLinks
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: exits 0. No MUI Snackbar/Alert imports should remain (except in files not yet migrated).

- [ ] **Step 6: Commit**

```bash
git add src/context/UIContext.tsx src/Components/AppShell.tsx src/Components/GlobalUI.tsx src/Components/NavLinks.tsx
git commit -m "feat: replace MUI Snackbar with sonner toast"
```

---

### Task 6: Replace MUI Dialog with shadcn Dialog

**Files:**
- Modify: `src/Components/GlobalUI.tsx`
- Modify: `src/Components/MyDialog.tsx`

- [ ] **Step 1: Update GlobalUI.tsx — replace MUI Dialog with shadcn Dialog**

Replace full content:

```tsx
'use client'

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUI } from "../context/UIContext";

export const GlobalUI = () => {
  const { dialog, hideDialog } = useUI();

  return (
    <Dialog
      open={dialog.open}
      onOpenChange={(open) => {
        // Only allow close when there is dialog content (not a loading state)
        if (!open && dialog.content) hideDialog();
      }}
    >
      <DialogContent
        className="max-w-xs"
        onInteractOutside={(e) => { if (!dialog.content) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (!dialog.content) e.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle className="font-bold font-noto">
            {dialog.title || "處理中..."}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center">
          {dialog.content || (
            <div className="my-3 w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

- [ ] **Step 2: Update MyDialog.tsx — replace MUI Dialog + Button with shadcn**

Replace full content:

```tsx
'use client'

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: exits 0. No more MUI Dialog imports should remain.

- [ ] **Step 4: Commit**

```bash
git add src/Components/GlobalUI.tsx src/Components/MyDialog.tsx
git commit -m "feat: replace MUI Dialog with shadcn Dialog"
```

---

### Task 7: Replace ApplyForm MUI components with shadcn

**Files:**
- Modify: `src/views/ApplyForm.tsx`

- [ ] **Step 1: Replace full content of ApplyForm.tsx**

```tsx
'use client'

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";

import { useAuth } from "../hooks/useAuth";
import { validateData } from "../func/applyFunc";
import { useUI } from "../context/UIContext";
import ConsentCheckbox from "../Components/ConsentCheckbox";
import "../styles/ApplyForm.css";

const FUNCTION_URL = "api/add/";

const ApplyForm: React.FC = () => {
  const user = useAuth();
  const { showSnackbar, showDialog, hideDialog } = useUI();

  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [applicantName, setApplicantName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [crowdSize, setCrowdSize] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [consent, setConsent] = useState<boolean>(false);

  const handleConsentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConsent(event.target.checked);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!applicantName || !phone || !crowdSize || !location || !startDate || !endDate || !description || !consent) {
      showSnackbar("請填寫所有必填欄位，並同意隱私權政策", "warning");
      return;
    }
    showDialog("處理中...");
    try {
      if (!user) throw new Error("請先進行登入！");
      const requestBody = {
        name: applicantName,
        phone: phone,
        crowdSize: crowdSize,
        room: location,
        checkinTime: startDate.toISOString(),
        checkoutTime: endDate.toISOString(),
        email: user.email ?? "test@gmail.com",
        eventDescription: description,
      };
      console.log("Request Body:", requestBody);
      await validateData(requestBody);
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Unknown error");
      }
      showSnackbar("預約成功。", "success");
    } catch (err: unknown) {
      showSnackbar((err as Error).message || "請求失敗，請稍後再試。", "error");
    } finally {
      hideDialog();
    }
  };

  useEffect(() => {
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) && !/Chromium/.test(navigator.userAgent);
    if (isSafari) {
      showSnackbar("Safari 可能會有 Cookie 與跨站追蹤阻擋的問題，建議使用 Chrome", "info");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mt-[5px] md:my-5 px-[5%] pb-20 md:pb-0 max-w-[640px] mx-auto">
      <form onSubmit={handleSubmit} className="gap-5 flex flex-col justify-center items-center">
        <div className="w-full">
          <Input
            className="ipt bg-white"
            placeholder="申請人姓名"
            onChange={e => setApplicantName(e.target.value)}
          />
        </div>
        <div className="flex justify-between w-full">
          <Input className="ipt w-full" placeholder="手機號碼" onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="w-full justify-between flex gap-4">
          <Input className="ipt w-24 shrink-0" placeholder="人數" onChange={e => setCrowdSize(e.target.value)} />
          <Select onValueChange={(value) => setLocation(value)}>
            <SelectTrigger className="ipt flex-1">
              <SelectValue placeholder="借用地點" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="小導師室">小導師室</SelectItem>
              <SelectItem value="書房">書房</SelectItem>
              <SelectItem value="橘廳">橘廳</SelectItem>
              <SelectItem value="會議室">會議室</SelectItem>
              <SelectItem value="貢丸室">貢丸室</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full">
          <DateTimePicker
            className="ipt w-full"
            label="開始日期"
            value={startDate}
            views={["month", "day", "hours", "minutes"]}
            onChange={newValue => setStartDate(newValue)}
          />
        </div>
        <div className="flex justify-between w-full">
          <DateTimePicker
            className="ipt w-full"
            label="結束日期"
            value={endDate}
            views={["month", "day", "hours", "minutes"]}
            onChange={newValue => setEndDate(newValue)}
          />
        </div>
        <div className="w-full">
          <Input
            className="ipt"
            placeholder="活動簡述（請認真寫！）"
            onChange={e => setDescription(e.target.value)}
          />
        </div>
      </form>
      <div className="mt-2 flex flex-col justify-center items-center gap-0.5">
        <div className="px-2 noto font-normal text-gray-400 text-xs text-center leading-relaxed">
          *建議使用 Chrome 等原生瀏覽器，Safari 可能會阻擋，臉書與 Line 瀏覽器則無法使用
        </div>
        <ConsentCheckbox checked={consent} onChange={handleConsentChange} />
        <Button className="myBtn w-full" type="submit" size="lg" onClick={handleSubmit}>
          確認送出
        </Button>
      </div>
    </div>
  );
};

export default ApplyForm;
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/views/ApplyForm.tsx
git commit -m "feat: replace MUI form components with shadcn in ApplyForm"
```

---

### Task 8: Remove MUI packages and verify

**Files:**
- Modify: `package.json` (via npm uninstall)

- [ ] **Step 1: Audit remaining MUI material imports**

```bash
grep -r "@mui/material" src/ --include="*.tsx" --include="*.ts"
```

Expected: no results (only `@mui/x-date-pickers` usage should remain, which is intentional).

If any results show up, fix them before continuing.

- [ ] **Step 2: Uninstall @mui/material only**

`@emotion/react` and `@emotion/styled` must stay — they are peer dependencies of `@mui/x-date-pickers` which is still in use.

```bash
npm uninstall @mui/material @mui/styled-engine-sc
```

- [ ] **Step 3: Verify build still passes**

```bash
npm run build
```

Expected: exits 0.

- [ ] **Step 4: Smoke test in dev mode**

```bash
npm run dev
```

Open `http://localhost:3000` and verify:
- `/` → Calendar loads, month navigation works, event list shows spinner while loading
- `/apply` → ApplyForm renders with all fields, Submit triggers toast on missing fields
- `/rule` → Rule page loads
- NavBar logo visible, nav links work
- Mobile bottom nav highlights current route
- Login/logout button works
- Clicking "資訊" or "設定" icons shows a sonner toast (施工中)
- Clicking an event on Calendar opens MyDialog with event details
- `showDialog("處理中...")` during form submit shows loading dialog that cannot be dismissed by backdrop click

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove @mui/material (Emotion kept for x-date-pickers)"
```
