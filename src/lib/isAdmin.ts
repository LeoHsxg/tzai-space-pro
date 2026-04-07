import { adminDb } from "@/firebase/admin";

/**
 * 查 Firestore admins/{email}，確認是否為管理員。
 * @param email - 已由 Firebase Auth 驗證過的 email
 * @returns Promise<boolean>
 */
export async function isAdmin(email: string): Promise<boolean> {
  const snap = await adminDb.collection("admins").doc(email).get();
  return snap.exists;
}
