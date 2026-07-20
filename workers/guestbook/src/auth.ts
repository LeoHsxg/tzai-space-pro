// 在「非 Firebase 環境」驗證 Firebase ID token。
//
// Next.js 那邊的 API Route 有 Admin SDK，一行 verifyIdToken() 就搞定；
// Worker 上沒有 Admin SDK，但其實 Firebase ID token 就是標準的 JWT（RS256 簽章），
// 驗證它只需要三件事，全部都是公開標準，不用任何 Firebase 私鑰：
//   1. 拿 Google 公開的 JWK 公鑰集，驗簽章（證明 token 真的是 Firebase 簽發、沒被竄改）
//   2. 驗 issuer / audience（證明是簽給「我們這個專案」的 token，不是別的 Firebase 專案）
//   3. 驗過期時間 exp（jose 的 jwtVerify 內建）
//
// 這也是為什麼 Firebase Auth 可以搭配任何後端使用——它本質上就是一個 OIDC token 簽發者。

import { createRemoteJWKSet, jwtVerify } from "jose";

// Google 公開的 Firebase token 簽章公鑰（JWK 格式）。
// createRemoteJWKSet 會自動抓取並依照 HTTP cache header 快取，
// 放在 module 頂層讓同一個 Worker isolate 的多次請求共用快取。
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
}

/** 驗證失敗一律丟這個錯，讓呼叫端統一回 401 */
export class AuthError extends Error {}

export async function verifyFirebaseIdToken(
  token: string,
  projectId: string
): Promise<AuthUser> {
  let payload;
  try {
    ({ payload } = await jwtVerify(token, GOOGLE_JWKS, {
      algorithms: ["RS256"],
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    }));
  } catch {
    throw new AuthError("token 驗證失敗");
  }

  // sub 是 Firebase uid；email 是我們的身分主鍵（admins 清單、留言作者都用它）
  if (!payload.sub) throw new AuthError("token 缺少 sub");
  const email = typeof payload.email === "string" ? payload.email : null;
  if (!email) throw new AuthError("token 缺少 email");
  const name =
    typeof payload.name === "string" && payload.name.trim()
      ? payload.name
      : email.split("@")[0];

  return { uid: payload.sub, email, name };
}
