import React from "react";
import type { Metadata } from "next";
import Script from "next/script";
import "../App.css";
import { Noto_Sans_TC, Roboto } from "next/font/google";

// 使用 next/font 取代手動 <link>，自動最佳化與避免 FOUT
const notoSans = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-tc",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "載物空間借用系統",
  description: "啦啦啦",
  icons: {
    icon: "/LOGO_9x3.svg",
    shortcut: "/LOGO_9x3.svg",
  },
  themeColor: "#ffffff",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  //   appleWebApp: {
  //     capable: true,
  //     statusBarStyle: "black-translucent",
  //     title: "載物空間",
  //   },
  // Web App 不知道是幹嘛用的，先留著
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className={`${notoSans.variable} ${roboto.variable}`}>
        {children}
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
  );
}
