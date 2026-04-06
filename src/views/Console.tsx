'use client'

import React, { useState } from "react";
import { signInWithRedirect, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase/firebase";

const Console = () => {
  const [redirecting, setRedirecting] = useState(false);

  const handleRedirectLogin = async () => {
    if (redirecting) return;
    setRedirecting(true);
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  };

  return (
    <div className="w-full md:mt-4">
      <div className="w-full pb-20 md:max-w-[900px] m-auto md:pb-0">
        <p className="-mt-1 mb-3 px-[8%] noto font-bold text-black/80 text-lg md:mt-0 md:pl-4 md:pr-0">
          開發者工具
        </p>
        <div className="w-full px-[8%] md:px-4 flex flex-col gap-4">
          <div className="bg-white rounded-xl p-4 flex flex-col gap-2">
            <p className="noto font-semibold text-sm text-black/70">登入測試</p>
            <p className="noto text-xs text-black/40">使用 redirect 方式登入（Safari 相容）</p>
            <button
              onClick={handleRedirectLogin}
              disabled={redirecting}
              className="mt-2 w-fit px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold noto hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {redirecting ? "跳轉中…" : "Redirect 登入"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Console;
