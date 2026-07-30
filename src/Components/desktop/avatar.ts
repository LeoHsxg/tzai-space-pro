/** 頭像顯示字：中文名取末字（陳宇→宇），否則取首字母大寫 */
export function avatarChar(name?: string | null, email?: string | null): string {
  const src = name?.trim() || email || "?";
  return /[一-鿿]/.test(src) ? src[src.length - 1] : src[0].toUpperCase();
}
