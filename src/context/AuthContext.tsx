import React, { createContext, useEffect, useState } from "react";
import { auth } from "../firebase/firebase";
import { User, onAuthStateChanged } from "firebase/auth";

export const AuthContext = createContext<User | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 這個函式在做的事，是監聽 auth 的變化，然後隨時塞給 setUser。
    // 因為這個 Context 是全局的，透過這樣的方式，
    // 你在任何地方都可以用 useContext(AuthContext) 來取得當前的使用者資訊。
    const unsub = onAuthStateChanged(auth, setUser);
    // 這邊的 unsubscribe 是一個「取消訂閱」的函式
    // 一但有登入或登出，它就會呼叫你提供的 callback 函式。
    // React 的 useEffect 本身支援「清除副作用」的機制：
    // 你在 useEffect 裡的 return () => unsubscribe()
    // 代表「當這個元件被卸載時（unmount），請記得取消監聽」。
    return () => unsub();
  }, []);

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
};
