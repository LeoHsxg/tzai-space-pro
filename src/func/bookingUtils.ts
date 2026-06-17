import { Booking } from "@/types/booking";

/**
 * 判斷單一 booking 屬於哪個 section
 */
export type BookingSection = "upcoming" | "history";

export function getBookingSection(b: Booking): BookingSection {
  const now = Date.now();
  const ended = b.endTime.toMillis() < now;

  if (b.status === "active" && !ended) return "upcoming";
  return "history";
}
