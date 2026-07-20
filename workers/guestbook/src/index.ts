// 留言板 API——Cloudflare Worker 入口。
//
// Worker 的核心概念：export 一個物件，裡面有 fetch(request, env)。
// 每個進來的 HTTP request 都會呼叫這個函式，回傳一個 Response。
// env 裡是 wrangler.toml 宣告的綁定（D1 資料庫、環境變數）。
//
// 路由表（全部需要登入，Authorization: Bearer <Firebase ID token>）：
//   GET    /messages       留言列表（新到舊，最多 100 則）
//   POST   /messages       新增留言 { body: string }
//   DELETE /messages/:id   刪除留言（本人或管理員）

import { verifyFirebaseIdToken, AuthError, type AuthUser } from "./auth";

export interface Env {
  DB: D1Database;
  FIREBASE_PROJECT_ID: string;
  ADMIN_EMAILS: string;
  ALLOWED_ORIGINS: string;
}

interface MessageRow {
  id: string;
  author_email: string;
  author_name: string;
  body: string;
  created_at: number;
}

const MAX_BODY_LENGTH = 500;
// 同一人兩次留言至少間隔 30 秒，擋手滑連點與洗版
const POST_COOLDOWN_MS = 30_000;

/** 帶狀態碼的錯誤：handler 裡直接 throw，最外層統一轉成 JSON response */
class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const cors = corsHeaders(request.headers.get("Origin"), env);

    // CORS preflight：瀏覽器在跨網域請求前會先發 OPTIONS 問「可以嗎」，
    // 這裡回允許的方法與 header，瀏覽器才會放行真正的請求
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      const idMatch = url.pathname.match(/^\/messages\/([0-9a-f-]+)$/);

      if (url.pathname === "/messages" && request.method === "GET") {
        await requireUser(request, env);
        return json(await listMessages(env), 200, cors);
      }
      if (url.pathname === "/messages" && request.method === "POST") {
        const user = await requireUser(request, env);
        return json(await createMessage(request, env, user), 201, cors);
      }
      if (idMatch && request.method === "DELETE") {
        const user = await requireUser(request, env);
        await deleteMessage(env, user, idMatch[1]);
        return json({ ok: true }, 200, cors);
      }

      throw new HttpError(404, "Not found");
    } catch (err) {
      if (err instanceof HttpError) {
        return json({ message: err.message }, err.status, cors);
      }
      console.error("未預期的錯誤：", err);
      return json({ message: "伺服器錯誤" }, 500, cors);
    }
  },
} satisfies ExportedHandler<Env>;

// ── 各路由的實作 ─────────────────────────────────────────────

async function listMessages(env: Env): Promise<{ messages: MessageRow[] }> {
  const { results } = await env.DB.prepare(
    `SELECT id, author_email, author_name, body, created_at
     FROM messages ORDER BY created_at DESC LIMIT 100`
  ).all<MessageRow>();
  return { messages: results };
}

async function createMessage(
  request: Request,
  env: Env,
  user: AuthUser
): Promise<MessageRow> {
  let body: string;
  try {
    const data = (await request.json()) as { body?: unknown };
    body = typeof data.body === "string" ? data.body.trim() : "";
  } catch {
    throw new HttpError(400, "請求格式錯誤");
  }
  if (!body) throw new HttpError(400, "留言不能是空的");
  if (body.length > MAX_BODY_LENGTH) {
    throw new HttpError(400, `留言最多 ${MAX_BODY_LENGTH} 字`);
  }

  // 頻率限制：查這個人最近一則留言的時間。
  // D1 的寫法：prepare（帶 ? 佔位符防 SQL injection）→ bind → first/all/run
  const last = await env.DB.prepare(
    `SELECT created_at FROM messages
     WHERE author_email = ? ORDER BY created_at DESC LIMIT 1`
  )
    .bind(user.email)
    .first<{ created_at: number }>();

  const now = Date.now();
  if (last && now - last.created_at < POST_COOLDOWN_MS) {
    throw new HttpError(429, "留言太頻繁了，休息一下再送出");
  }

  const message: MessageRow = {
    id: crypto.randomUUID(),
    author_email: user.email,
    author_name: user.name,
    body,
    created_at: now,
  };
  await env.DB.prepare(
    `INSERT INTO messages (id, author_email, author_name, body, created_at)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(
      message.id,
      message.author_email,
      message.author_name,
      message.body,
      message.created_at
    )
    .run();

  return message;
}

async function deleteMessage(
  env: Env,
  user: AuthUser,
  id: string
): Promise<void> {
  const row = await env.DB.prepare(
    `SELECT author_email FROM messages WHERE id = ?`
  )
    .bind(id)
    .first<{ author_email: string }>();

  if (!row) throw new HttpError(404, "找不到這則留言");
  if (row.author_email !== user.email && !isAdmin(user.email, env)) {
    throw new HttpError(403, "只能刪除自己的留言");
  }

  await env.DB.prepare(`DELETE FROM messages WHERE id = ?`).bind(id).run();
}

// ── 輔助函式 ────────────────────────────────────────────────

/** 從 Authorization header 取出並驗證 ID token，失敗回 401 */
async function requireUser(request: Request, env: Env): Promise<AuthUser> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new HttpError(401, "未登入");
  }
  try {
    return await verifyFirebaseIdToken(
      authHeader.slice("Bearer ".length),
      env.FIREBASE_PROJECT_ID
    );
  } catch (err) {
    if (err instanceof AuthError) throw new HttpError(401, "Token 無效");
    throw err;
  }
}

function isAdmin(email: string, env: Env): boolean {
  // 管理員清單放 wrangler.toml 的 vars（跟主站的 Firestore admins collection 是
  // 兩份資料，改的時候要記得同步；留言板規模小，先用最簡單的做法）
  return env.ADMIN_EMAILS.split(",").map((s) => s.trim()).includes(email);
}

/** 只允許 ALLOWED_ORIGINS 清單內的來源跨網域呼叫 */
function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());
  if (!origin || !allowed.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(
  data: unknown,
  status: number,
  headers: Record<string, string>
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}
