import { Timestamp } from "firebase/firestore";

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
  photoRequired?: boolean;         // true → 此筆借用需要上傳照片（舊資料無此欄位）
  photoUrl?: string | null;        // Firebase Storage 下載 URL，上傳後寫入
};
