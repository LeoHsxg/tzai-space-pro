'use client'

import React from 'react'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { Toaster } from '@/Components/ui/sonner'
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
