import { Timestamp } from "firebase/firestore";

/** 五個房間（圖例／篩選顯示順序） */
export const ROOMS = ["書房", "橘廳", "會議室", "小導師室", "貢丸室"] as const;

/** 房間功能色（沿用既有值，勿改） */
export const ROOM_COLORS: Record<string, string> = {
  書房: "#E44C4C",
  橘廳: "#FF6F0D",
  會議室: "#54A0F9",
  小導師室: "#FFD81E",
  貢丸室: "#9458E2",
};

export type Booking = {
  id: string;                      // Firestore doc ID
  calendarEventId?: string | null; // 遷移資料才有（Google Calendar event.id）
  room: string;                    // "書房" | "橘廳" | "會議室" | "小導師室" | "貢丸室"
  name: string;
  email: string;
  phone: string;
  crowdSize: number;
  description: string;
  startTime: Timestamp;
  endTime: Timestamp;
  createdAt: Timestamp;
  status: "active" | "cancelled";
};
