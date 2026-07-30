import React from "react";

/**
 * 桌面版頁面標題——小型 eyebrow。
 * 語意上是 h1（螢幕閱讀器與 SEO 需要），視覺上刻意收斂：
 * 小字、寬字距、淡灰，讓內容卡片仍是視覺主角。
 */
export function PageEyebrow({ children }: { children: React.ReactNode }) {
  return <h1 className="pb-3 pl-0.5 text-xs font-medium tracking-[0.16em] text-[#9AA0A6]">{children}</h1>;
}
