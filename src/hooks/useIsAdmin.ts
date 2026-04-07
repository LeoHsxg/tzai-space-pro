"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useAuth } from "@/hooks/useAuth";

/**
 * 查 Firestore admins/{email}，回傳當前使用者是否為管理員。
 * 未登入時 isAdmin = false。
 */
export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const user = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    let isMounted = true;

    getDoc(doc(db, "admins", user.email))
      .then((snap) => {
        if (isMounted) {
          setIsAdmin(snap.exists());
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsAdmin(false);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user?.email]);

  return { isAdmin, loading };
}
