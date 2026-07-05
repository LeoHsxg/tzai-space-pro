# 教訓收件匣（lessons.md）

> 格式：`- YYYY-MM-DD｜情境｜錯誤認知｜正確做法｜證據`（見 maintenance.md 第 3 節）。
> 當下就寫；同類第 2 次出現就提案升格為正式規則。

- 2026-07-04｜重寫 CLAUDE.md 前查核｜文件宣稱 distDir './dist' 與 service_account.json 在 repo 中｜文件事實引用前先以程式碼驗證，衝突以程式碼為準｜next.config.ts 為空、git ls-files 查無該檔
- 2026-07-04｜CI 歷史回顧｜假設 CI 環境有 ESLint 相容設定與新版 Java｜環境假設要在本地實測後才寫進 CI｜commit 8af0a34、e143855
