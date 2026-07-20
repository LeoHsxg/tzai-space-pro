-- Migration number: 0001
-- 留言板主資料表。D1 底層是 SQLite，這裡就是純 SQL。
-- 套用方式：wrangler d1 migrations apply tzai-guestbook --remote（本地測試去掉 --remote）

CREATE TABLE messages (
  id TEXT PRIMARY KEY,              -- crypto.randomUUID() 產生
  author_email TEXT NOT NULL,       -- 從驗證過的 ID token 取得，不信任 client 傳入值
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL       -- Unix 毫秒時間戳
);

-- 列表照時間新到舊，這條索引讓 ORDER BY created_at DESC 不用全表排序
CREATE INDEX idx_messages_created_at ON messages (created_at DESC);

-- 發文頻率限制要查「這個人最近一則留言的時間」，用這條索引
CREATE INDEX idx_messages_author_created ON messages (author_email, created_at DESC);
