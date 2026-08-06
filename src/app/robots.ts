import type { MetadataRoute } from "next";

// 只開放不需登入的兩頁給搜尋引擎；其餘頁面都要登入，被收錄也只會是空殼或登入畫面。
// 注意：robots.txt 只是對「守規矩的爬蟲」的請求，不具任何存取控制效果，
// 真正的權限把關在各頁的 auth 判斷與 firestore.rules。
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/rule"],
      disallow: ["/api/", "/apply", "/console", "/profile", "/storeroom", "/test"],
    },
  };
}
