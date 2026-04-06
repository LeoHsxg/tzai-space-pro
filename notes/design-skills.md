https://www.threads.com/@this.web/post/DWn-cO5Emej?xmt=AQF0n9hTaA55Suf1ERgUSP8QjPGpLN7gLIvWrw_DIKk8WQ

➊ UI-UX-Pro-Max

這個 Skill 內建 161 個色彩方案、57 種字型搭配、99 條 UX 最佳實踐的設計知識庫。在你動手寫 code 之前，先幫你把整個設計系統定下來。

- 新專案從零開始，不知道怎麼選色彩和風格
- 想讓所有頁面維持一致的設計規範

➋ Impeccable

專門解決 AI 設計味的 Skill，提供 20 個精準指令，針對不同設計問題各個擊破。例如：使用 /bolder 讓設計更大膽、/quieter 讓設計更沉穩、/delight 加入讓人記住的細節。

- UI 寫完了，但看起來很像 AI 做的
- 想針對特定區塊調整設計

連結：impeccable.style

➌ Web-Design-Guidelines（Vercel Labs）

這個 Skill 是由 Vercel 所推出，每次執行都會從 GitHub 拉最新規則，逐行比對你的程式碼，並輸出 file:line 格式，直接告訴你哪裡違規、怎麼不符合 WCAG。

- 網站上線前做最後合規檢查
- Code review 需要客觀依據，不想靠感覺

https://github.com/nextlevelbuilder/ui-ux-pro-max-skill  
npx skills add pbakaus/impeccable  
npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines  
npx.cmd skills add shadcn/ui --skill shadcn --global -y 2>&1

npx skills list  
npx skills list -g
