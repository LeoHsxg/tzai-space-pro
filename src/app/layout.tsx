import React from 'react'
import type { Metadata } from 'next'
import Script from 'next/script'
import { Noto_Sans_TC, Roboto } from 'next/font/google'
import { unstable_cache } from 'next/cache'
import { AppShell } from '@/Components/AppShell'
import { adminDb } from '@/firebase/admin'
import type { AnnouncementData } from '@/types/announcement'
import '../App.css'
import { cn } from "@/lib/utils";

const getAnnouncement = unstable_cache(
  async (): Promise<AnnouncementData | null> => {
    try {
      const snap = await adminDb
        .collection("announcements")
        .orderBy("publishedAt", "desc")
        .limit(1)
        .get();
      if (snap.empty) return null;
      const doc = snap.docs[0];
      const d = doc.data();
      return {
        id: doc.id,
        title: d.title,
        content: d.content,
        type: d.type,
        showModal: d.showModal,
        publishedAt: d.publishedAt?.toDate().toISOString() ?? "",
      };
    } catch {
      return null;
    }
  },
  ["announcement-fetch"],
  { tags: ["announcement"] }
);

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const announcement = await getAnnouncement();
  return (
    <html lang="zh-Hant" className={cn(notoSans.variable, roboto.variable)}>
      <body className={`${notoSans.variable} ${roboto.variable}`}>
        <AppShell announcement={announcement}>{children}</AppShell>
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
