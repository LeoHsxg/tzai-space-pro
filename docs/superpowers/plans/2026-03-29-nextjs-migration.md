# Next.js Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate tzai-space-pro from React + Vite SPA to a proper Next.js App Router structure with static export targeting Firebase Hosting.

**Architecture:** All pages become Next.js App Router routes under `src/app/`. Existing page components in `src/pages/` are kept as implementations and re-exported from thin app route files. All interactive components are marked `'use client'`. Context providers are centralized in `src/components/providers.tsx`, loaded from the root layout. SVG assets move from `src/img/` to `public/img/` and are referenced as static paths.

**Tech Stack:** Next.js 15 App Router, React 18, MUI v6, Firebase v10, Tailwind CSS, TypeScript, `output: "export"` (static)

---

### Task 1: Update tsconfig.json for Next.js App Router

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1: Replace tsconfig.json content**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 2: Commit**

```bash
git add tsconfig.json
git commit -m "chore: update tsconfig.json for Next.js App Router"
```

---

### Task 2: Move SVG assets to public/img/

**Files:**
- Create: `public/img/` (copy all files from `src/img/`)

SVGs are currently imported as modules (Vite feature). Next.js doesn't support this by default — move them to `public/img/` and reference them as static URL strings instead.

- [ ] **Step 1: Copy SVGs to public/img/**

```bash
mkdir -p public/img
cp src/img/*.svg public/img/
```

- [ ] **Step 2: Verify all files copied**

```bash
ls public/img/
```

Expected: `LOGO_9x3.svg`, `add_circle_h.svg`, `add_circle_s.svg`, `calendar_month_h.svg`, `calendar_month_s.svg`, `contract_h.svg`, `contract_s.svg`, `developer_guide_h.svg`, `developer_guide_s.svg`, `info_h.svg`, `info_s.svg`, `settings_h.svg`, `settings_s.svg`

- [ ] **Step 3: Commit**

```bash
git add public/img/
git commit -m "chore: move SVG assets from src/img to public/img"
```

---

### Task 3: Update firebase.ts — migrate environment variable

**Files:**
- Modify: `src/firebase/firebase.ts`

Vite uses `import.meta.env.VITE_*`. Next.js uses `process.env.NEXT_PUBLIC_*`.

- [ ] **Step 1: Update apiKey line in firebase.ts**

Change line:
```ts
apiKey: import.meta.env.VITE_API_KEY,
```
To:
```ts
apiKey: process.env.NEXT_PUBLIC_API_KEY,
```

- [ ] **Step 2: Rename env variable in your .env.local file**

In your `.env.local` (or `.env`) file, rename:
```
VITE_API_KEY=your_key_here
```
to:
```
NEXT_PUBLIC_API_KEY=your_key_here
```

- [ ] **Step 3: Commit**

```bash
git add src/firebase/firebase.ts
git commit -m "chore: migrate firebase env var from VITE_ to NEXT_PUBLIC_"
```

---

### Task 4: Add 'use client' to context and hooks files

**Files:**
- Modify: `src/context/AuthContext.tsx`
- Modify: `src/context/UIContext.tsx`
- Modify: `src/hooks/useAuth.tsx`

All three use React hooks (`useState`, `useEffect`, `useContext`) — they must be client components.

- [ ] **Step 1: Add 'use client' as the very first line of AuthContext.tsx**

```tsx
'use client'

import React, { createContext, useEffect, useState } from "react";
// ... rest of file unchanged
```

- [ ] **Step 2: Add 'use client' as the very first line of UIContext.tsx**

```tsx
'use client'

import React, { createContext, useContext, useState } from "react";
// ... rest of file unchanged
```

- [ ] **Step 3: Add 'use client' as the very first line of useAuth.tsx**

```tsx
'use client'

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export const useAuth = () => useContext(AuthContext);
```

- [ ] **Step 4: Commit**

```bash
git add src/context/AuthContext.tsx src/context/UIContext.tsx src/hooks/useAuth.tsx
git commit -m "chore: add 'use client' to context and hooks files"
```

---

### Task 5: Create src/components/providers.tsx

**Files:**
- Create: `src/components/providers.tsx`

This file centralizes all React Context providers into one client component, which is imported by the root layout.

- [ ] **Step 1: Create the file**

```tsx
'use client'

import React from 'react'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AuthProvider } from '@/context/AuthContext'
import { UIProvider } from '@/context/UIContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UIProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          {children}
        </LocalizationProvider>
      </UIProvider>
    </AuthProvider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/providers.tsx
git commit -m "feat: add Providers client component"
```

---

### Task 6: Update NavLinks.tsx — replace react-router-dom, fix SVG imports

**Files:**
- Modify: `src/Components/NavLinks.tsx`

`Link` and `useLocation` from `react-router-dom` → `Link` from `next/link` and `usePathname` from `next/navigation`. SVG module imports → static public paths.

- [ ] **Step 1: Replace full content of NavLinks.tsx**

```tsx
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import '../styles/Footer.css'

const NavLinks = () => {
  const currentPath = usePathname()
  const [open, setOpen] = useState(false)

  const handleClick = () => setOpen(true)

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return
    setOpen(false)
  }

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
          <Link href="/">
            <div className="noto text-sm font-medium text-gray-600">日歷</div>
          </Link>
          <Link href="/apply">
            <div className="noto text-sm font-medium text-gray-600">申請</div>
          </Link>
          <Link href="/rule">
            <div className="noto text-sm font-medium text-gray-600">借用規章</div>
          </Link>
          <div className="cursor-pointer noto text-sm font-medium text-gray-600" onClick={handleClick}>
            設定
          </div>
        </div>
      </div>

      {/* Snackbar */}
      <Snackbar
        open={open}
        autoHideDuration={2000}
        onClose={handleClose}
        sx={{ bottom: '4.25rem' }}
      >
        <Alert onClose={handleClose} severity="info" sx={{ width: '100%' }} elevation={6} variant="filled">
          此功能還在施工啦啦啦 🚧
        </Alert>
      </Snackbar>
    </div>
  )
}

export default NavLinks
```

- [ ] **Step 2: Commit**

```bash
git add src/Components/NavLinks.tsx
git commit -m "feat: replace react-router-dom with next/link+usePathname in NavLinks"
```

---

### Task 7: Update ConsentCheckbox.tsx — replace react-router-dom

**Files:**
- Modify: `src/Components/ConsentCheckbox.tsx`

- [ ] **Step 1: Replace full content of ConsentCheckbox.tsx**

```tsx
'use client'

import React from 'react'
import Link from 'next/link'
import '../styles/ConsentCheckbox.css'

interface ConsentCheckboxProps {
  checked: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const ConsentCheckbox: React.FC<ConsentCheckboxProps> = ({ checked, onChange }) => {
  return (
    <div className="flex items-center gap-0.5 mt-1">
      <input type="checkbox" id="consent" checked={checked} onChange={onChange} className="hidden" />
      <label htmlFor="consent" className={`checkbox-label ${checked ? 'checked' : ''}`}>
        {checked && (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </label>
      <span className="text-black/60 text-xs font-normal font-['Inter']">
        本人已詳閱、瞭解並願意遵守
        <Link href="/rule">
          <span className="underline">空間借用條例</span>
        </Link>
      </span>
    </div>
  )
}

export default ConsentCheckbox
```

- [ ] **Step 2: Commit**

```bash
git add src/Components/ConsentCheckbox.tsx
git commit -m "feat: replace react-router-dom with next/link in ConsentCheckbox"
```

---

### Task 8: Update NavBar.tsx — fix SVG import

**Files:**
- Modify: `src/Components/NavBar.tsx`

- [ ] **Step 1: Replace full content of NavBar.tsx**

```tsx
'use client'

import React from 'react'
import SignBt from './SignBt'
import NavLinks from './NavLinks'

const NavBar = () => {
  return (
    <div className="flex w-full h-20 px-8 py-4 md:h-16 justify-between items-center z-50 md:border-solid border-b-2 border-gray-200">
      <img className="w-16 h-6" src="/img/LOGO_9x3.svg" alt="Logo" />
      <div className="flex items-center gap-4">
        <div className="hidden md:block">
          <NavLinks />
        </div>
        <SignBt />
      </div>
    </div>
  )
}

export default NavBar
```

- [ ] **Step 2: Commit**

```bash
git add src/Components/NavBar.tsx
git commit -m "feat: replace SVG module import with public path in NavBar"
```

---

### Task 9: Add 'use client' to remaining Components

**Files:**
- Modify: `src/Components/Footer.tsx`
- Modify: `src/Components/GlobalUI.tsx`
- Modify: `src/Components/MyDialog.tsx`
- Modify: `src/Components/Reserve.tsx`
- Modify: `src/Components/Ruleblock.tsx`
- Modify: `src/Components/SignBt.tsx`
- Modify: `src/Components/PopupTest.tsx`

All use MUI components or React hooks — they require `'use client'`.

- [ ] **Step 1: Add 'use client' as the very first line to each file**

`src/Components/Footer.tsx`:
```tsx
'use client'

import React from "react";
// ... rest of file unchanged
```

`src/Components/GlobalUI.tsx`:
```tsx
'use client'

// src/Components/GlobalUI.tsx
import React from "react";
// ... rest of file unchanged
```

`src/Components/MyDialog.tsx`:
```tsx
'use client'

import React, { useState } from "react";
// ... rest of file unchanged
```

`src/Components/Reserve.tsx`:
```tsx
'use client'

import React from "react";
// ... rest of file unchanged
```

`src/Components/Ruleblock.tsx`:
```tsx
'use client'

import React from "react";
// ... rest of file unchanged
```

`src/Components/SignBt.tsx`:
```tsx
'use client'

import React from "react";
// ... rest of file unchanged
```

`src/Components/PopupTest.tsx`:
```tsx
'use client'

import * as React from "react";
// ... rest of file unchanged
```

- [ ] **Step 2: Commit**

```bash
git add src/Components/Footer.tsx src/Components/GlobalUI.tsx src/Components/MyDialog.tsx src/Components/Reserve.tsx src/Components/Ruleblock.tsx src/Components/SignBt.tsx src/Components/PopupTest.tsx
git commit -m "chore: add 'use client' to all Components"
```

---

### Task 10: Add 'use client' to page components in src/pages/

**Files:**
- Modify: `src/pages/Calendar.tsx`
- Modify: `src/pages/ApplyForm.tsx`
- Modify: `src/pages/Rule.tsx`
- Modify: `src/pages/Test.tsx`

- [ ] **Step 1: Add 'use client' as first line to each file**

`src/pages/Calendar.tsx`:
```tsx
'use client'

import React, { useState } from "react";
// ... rest of file unchanged
```

`src/pages/ApplyForm.tsx`:
```tsx
'use client'

import React, { useState, useEffect } from "react";
// ... rest of file unchanged
```

`src/pages/Rule.tsx`:
```tsx
'use client'

import React, { useEffect, useState } from "react";
// ... rest of file unchanged
```

`src/pages/Test.tsx`:
```tsx
'use client'

import React from "react";
// ... rest of file unchanged
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Calendar.tsx src/pages/ApplyForm.tsx src/pages/Rule.tsx src/pages/Test.tsx
git commit -m "chore: add 'use client' to all page components"
```

---

### Task 11: Update src/app/layout.tsx

**Files:**
- Modify: `src/app/layout.tsx`

Add `Providers`, `NavBar`, `Footer`, `GlobalUI` to the layout. Update the icon path to use `public/img/`. Remove the `viewport` metadata field (deprecated in Next.js 15 — use `generateViewport` export instead or just remove it).

- [ ] **Step 1: Replace full content of src/app/layout.tsx**

```tsx
import React from 'react'
import type { Metadata } from 'next'
import Script from 'next/script'
import { Noto_Sans_TC, Roboto } from 'next/font/google'
import { Providers } from '@/components/providers'
import NavBar from '@/Components/NavBar'
import Footer from '@/Components/Footer'
import { GlobalUI } from '@/Components/GlobalUI'
import '../App.css'

const notoSans = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-tc',
})

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-roboto',
})

export const metadata: Metadata = {
  title: '載物空間借用系統',
  description: '啦啦啦',
  icons: {
    icon: '/img/LOGO_9x3.svg',
    shortcut: '/img/LOGO_9x3.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className={`${notoSans.variable} ${roboto.variable}`}>
        <Providers>
          <div className="bg-[#F3F3F3] min-h-screen flex flex-col relative">
            <GlobalUI />
            <NavBar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
        {/* Google Analytics */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-J5G385BD56" />
        <Script id="gtag-init">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-J5G385BD56');
        `}</Script>
        {/* Microsoft Clarity */}
        <Script id="clarity-init">{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, 'clarity', 'script', 'qwd03n8te1');
        `}</Script>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: update layout.tsx with Providers, NavBar, Footer, GlobalUI"
```

---

### Task 12: Create Next.js App Router page files

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/app/apply/page.tsx`
- Create: `src/app/rule/page.tsx`
- Create: `src/app/test/page.tsx`

These are thin wrappers that re-export the existing page components. The actual component logic stays in `src/pages/`.

- [ ] **Step 1: Create src/app/page.tsx (Calendar route /)**

```tsx
'use client'
import Calendar from '../pages/Calendar'
export default Calendar
```

- [ ] **Step 2: Create src/app/apply/page.tsx**

```bash
mkdir -p src/app/apply
```

```tsx
'use client'
import ApplyForm from '../../pages/ApplyForm'
export default ApplyForm
```

- [ ] **Step 3: Create src/app/rule/page.tsx**

```bash
mkdir -p src/app/rule
```

```tsx
'use client'
import Rule from '../../pages/Rule'
export default Rule
```

- [ ] **Step 4: Create src/app/test/page.tsx**

```bash
mkdir -p src/app/test
```

```tsx
'use client'
import Test from '../../pages/Test'
export default Test
```

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/apply/ src/app/rule/ src/app/test/
git commit -m "feat: create Next.js App Router pages for all routes"
```

---

### Task 13: Delete Vite files and [[...slug]] directory

**Files:**
- Delete: `src/App.tsx`
- Delete: `src/main.tsx`
- Delete: `index.html`
- Delete: `vite.config.js`
- Delete: `vite-env.d.ts`
- Delete: `src/app/[[...slug]]/` (entire folder)

- [ ] **Step 1: Remove Vite entry files**

```bash
git rm src/App.tsx src/main.tsx index.html vite.config.js vite-env.d.ts
```

- [ ] **Step 2: Remove [[...slug]] catch-all directory**

```bash
git rm -r "src/app/[[...slug]]"
```

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: remove Vite entry files and [[...slug]] catch-all route"
```

---

### Task 14: Update package.json scripts and remove Vite / react-router-dom

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update scripts section**

Replace current `scripts`:
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint .",
  "preview": "vite preview"
}
```
With:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "lint": "next lint",
  "start": "next start"
}
```

- [ ] **Step 2: Remove Vite and react-router-dom from package.json**

Remove from `devDependencies`:
- `"@vitejs/plugin-react"`
- `"vite"`

Remove from `dependencies`:
- `"react-router-dom"`

- [ ] **Step 3: Install to sync package-lock.json**

```bash
npm install
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: replace Vite with Next.js scripts, remove react-router-dom and vite"
```

---

### Task 15: Verify build

- [ ] **Step 1: Run next build**

```bash
npm run build
```

Expected: exits 0, output in `./dist/`. You should see pages listed:
```
Route (app)             Size
┌ ○ /                   ...
├ ○ /apply              ...
├ ○ /rule               ...
└ ○ /test               ...
```

If there are TypeScript or import errors, fix them before proceeding.

- [ ] **Step 2: Run dev server and smoke-test all pages**

```bash
npm run dev
```

Open `http://localhost:3000` and verify:
- `/` → Calendar page loads with date picker and event list
- `/apply` → ApplyForm loads with all form fields
- `/rule` → Rule page loads with rule blocks
- `/test` → Test page loads with Dialog/Snackbar buttons
- NavBar logo visible, navigation links work
- Mobile bottom NavLinks highlight current route
- Login/logout button works
- `npm run build` succeeds after smoke-testing

- [ ] **Step 3: Commit any fixes discovered during verification**

```bash
git add -p
git commit -m "fix: resolve issues found during Next.js migration verification"
```
