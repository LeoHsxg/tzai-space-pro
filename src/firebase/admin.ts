import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

if (!getApps().length) {
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    // 本地開發：使用 .env.local 的 Service Account
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
      storageBucket: "tzai-space-pro.firebasestorage.app",
    });
  } else {
    // Firebase App Hosting：使用 Application Default Credentials（無需額外設定）
    initializeApp({
      storageBucket: "tzai-space-pro.firebasestorage.app",
    });
  }
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
export const adminStorage = getStorage();
