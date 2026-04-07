/**
 * 從 Firebase Storage 下載 URL 解析出 Storage 內部路徑。
 * 只處理 googleapis.com/v0/b/.../o/... 格式。
 * 若 URL 格式不符，回傳 null（Storage 孤兒檔可接受）。
 *
 * 例：https://firebasestorage.googleapis.com/v0/b/tzai-space-pro.firebasestorage.app/o/bookings%2Fabc%2F123.jpg?alt=media&token=xxx
 *  → "bookings/abc/123.jpg"
 */
export function parseStoragePath(photoUrl: string): string | null {
  try {
    const url = new URL(photoUrl);
    const parts = url.pathname.split("/o/");
    if (parts.length < 2) return null;
    return decodeURIComponent(parts[1]);
  } catch {
    return null;
  }
}
