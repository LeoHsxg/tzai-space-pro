import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    // 本地開發：使用 .env.local 的 Service Account
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    // Firebase App Hosting：使用 Application Default Credentials（無需額外設定）
    initializeApp();
  }
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
