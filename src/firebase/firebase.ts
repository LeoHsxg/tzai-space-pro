// firebase.tsx / firebase.js (檔名隨你，React/TS 或 JS 都可以)
// 此檔為 Firebase App 初始化 & 提供 Google Sign-In 函式

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "tzai-space.firebaseapp.com",
  projectId: "tzai-space",
  storageBucket: "tzai-space.appspot.com",
  messagingSenderId: "154014267141",
  appId: "1:154014267141:web:90d61c6b08f0d957e6696c",
  measurementId: "G-5P7DHECJHN",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// 這個函式用來做 Google 登入
// Safari 似乎要求用 redirect? 感覺怪怪的
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();

  // 觸發彈窗
  const result = await signInWithPopup(auth, provider);
  // 取得使用者及其資料
  const user = result.user;
  const email = user.email;
  const uid = user.uid;
  const displayName = user.displayName;

  console.log("使用者的 Email: ", email);
  // console.log("使用者的 UID: ", uid);
  // console.log("使用者的顯示名稱: ", displayName);

  return { email, uid, displayName };
}

// 取得 "current" 子集合的 "items" 資料
export async function getRegulationsData() {
  const docRef = doc(db, "regulations", "current"); // collection: rules, doc: current
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    // data 是 object, data 裡面的 items 是 array 沒錯，但要從 data 中取得資料需要用 Object.values(data) 來取得
    const data = docSnap.data();
    console.log("成功取得資料：", data);
    const values: string[] = Object.values(data);
    // const keys = Object.keys(data);
    // const entries = Object.entries(data);
    return values;
  } else {
    console.log("找不到條例文件！");
    throw new Error("找不到條例文件！");
  }
}
