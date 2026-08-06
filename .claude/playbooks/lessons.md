# 教訓收件匣（lessons.md）

> 格式：`- YYYY-MM-DD｜情境｜錯誤認知｜正確做法｜證據`（見 maintenance.md 第 3 節）。
> 當下就寫；同類第 2 次出現就提案升格為正式規則。

- 2026-07-04｜重寫 CLAUDE.md 前查核｜文件宣稱 distDir './dist' 與 service_account.json 在 repo 中｜文件事實引用前先以程式碼驗證，衝突以程式碼為準｜next.config.ts 為空、git ls-files 查無該檔
- 2026-07-04｜CI 歷史回顧｜假設 CI 環境有 ESLint 相容設定與新版 Java｜環境假設要在本地實測後才寫進 CI｜commit 8af0a34、e143855
- 2026-08-06｜切 branch 後跑 npx tsc --noEmit｜以為 .next/types 報「找不到 ../../src/app/guestbook/page.js」是程式錯誤｜那是舊 branch 的過期建置產物，rm -rf .next 再跑即可｜.next/types/validator.ts 引用已不存在的頁面，刪除後 tsc 全綠
- 2026-08-06｜跨 branch 接續工作｜沿用前一條 branch 讀到的檔案內容與 CLAUDE.md 快照做決策｜使用者切 branch 後，所有要動到或引為基準的檔案一律重讀（本例：桌面導覽從 NavLinks 變成 Sidebar、字型改 Inter 為主）｜storeroom-design vs 舊 branch 的 git diff --stat 差了 52 個檔案
