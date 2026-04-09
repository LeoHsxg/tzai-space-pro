import { Booking } from "@/types/booking";

/**
 * 判斷使用者是否有「待完成」的借用（endTime 已過、需上傳照片、尚未上傳）
 */
export function hasPendingPhoto(bookings: Booking[]): boolean {
  const now = Date.now();
  return bookings.some(
    (b) =>
      b.status === "active" &&
      b.photoRequired === true &&
      !b.photoUrl &&
      b.endTime.toMillis() < now
  );
}

/**
 * 判斷單一 booking 屬於哪個 section
 */
export type BookingSection = "pending" | "upcoming" | "history";

export function getBookingSection(b: Booking): BookingSection {
  const now = Date.now();
  const ended = b.endTime.toMillis() < now;

  if (b.status === "active" && b.photoRequired === true && !b.photoUrl && ended) return "pending";
  if (b.status === "active" && !ended) return "upcoming";
  return "history";
}
