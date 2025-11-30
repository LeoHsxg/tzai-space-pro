// useAuth.ts
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext"; // 路徑根據你實際放的位置來改

// export hook
// 只要是用 use 開頭的函式就是所謂的 hook
// useContext 是從某個 Context 裡面把「全局共享資料」拿出來用。
export const useAuth = () => useContext(AuthContext);
