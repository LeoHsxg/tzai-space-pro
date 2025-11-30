import React from "react";
import { signInWithGoogle, auth } from "../firebase/firebase";
import { signInWithRedirect, GoogleAuthProvider, signOut } from "firebase/auth";
import { useAuth } from "../hooks/useAuth"; // 假設這是你的 auth hook

const SignBt: React.FC = () => {
  const user = useAuth(); // 拿到目前登入的使用者

  const handleToggle = async () => {
    try {
      if (!user) {
        await signInWithGoogle();
        // const provider = new GoogleAuthProvider();
        // await signInWithRedirect(auth, provider);
        console.log("登入成功！");
      } else {
        await signOut(auth);
        console.log("登出成功！");
      }
    } catch (error) {
      console.error("登入或登出失敗：", error);
    }
  };

  return (
    // 動態根據 isLogin 狀態變換按鈕的外觀
    // 因為底部和文字是重疊的，所以才要用 relative-absolute 的方式...嗎？明明就可以直接疊起來www
    // border 必須是 width, style, color 按照順序擺一起才會生效！
    // ...
    // 參考 upsplash, 按鈕要再大一點，然後描邊和淡背景
    // 未登入的設計才要更為顯眼
    <div
      onClick={handleToggle}
      className={`w-16 h-8 rounded-full flex items-center justify-center hover:cursor-pointer ${
        user ? "border-2 border-solid border-gray-200" : "border-2 border-solid border-gray-200 bg-black/3"
      } relative`}>
      <div className={`noto text-xs ${user ? "font-semibold text-gray-300" : "font-extrabold text-orange-500"}`}>{user ? "登出" : "登入"}</div>
    </div>
  );
};

export default SignBt;
