'use client'

import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { Booking } from "../types/booking";

const BookingsContext = createContext<Booking[]>([]);

export const BookingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "bookings"),
      where("status", "==", "active"),
      orderBy("startTime")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(data);
    });
    return () => unsubscribe();
  }, []);

  return <BookingsContext.Provider value={bookings}>{children}</BookingsContext.Provider>;
};

export const useBookings = () => useContext(BookingsContext);
