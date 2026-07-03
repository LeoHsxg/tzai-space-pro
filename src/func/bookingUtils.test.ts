import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Timestamp } from "firebase/firestore";
import { Booking } from "@/types/booking";
import { getBookingSection } from "./bookingUtils";

const NOW = new Date("2026-07-01T12:00:00+08:00");
const HOUR = 3600 * 1000;

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "test-id",
    room: "書房",
    name: "王小明",
    email: "test@example.com",
    phone: "0912345678",
    crowdSize: 4,
    description: "讀書會",
    startTime: Timestamp.fromMillis(NOW.getTime() + 1 * HOUR),
    endTime: Timestamp.fromMillis(NOW.getTime() + 3 * HOUR),
    createdAt: Timestamp.fromMillis(NOW.getTime() - 24 * HOUR),
    status: "active",
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getBookingSection", () => {
  it("active 且尚未結束 → upcoming", () => {
    expect(getBookingSection(makeBooking())).toBe("upcoming");
  });

  it("active 但已結束 → history", () => {
    const b = makeBooking({
      startTime: Timestamp.fromMillis(NOW.getTime() - 3 * HOUR),
      endTime: Timestamp.fromMillis(NOW.getTime() - 1 * HOUR),
    });
    expect(getBookingSection(b)).toBe("history");
  });

  it("cancelled 且尚未結束 → history", () => {
    expect(getBookingSection(makeBooking({ status: "cancelled" }))).toBe("history");
  });

  it("cancelled 且已結束 → history", () => {
    const b = makeBooking({
      status: "cancelled",
      startTime: Timestamp.fromMillis(NOW.getTime() - 3 * HOUR),
      endTime: Timestamp.fromMillis(NOW.getTime() - 1 * HOUR),
    });
    expect(getBookingSection(b)).toBe("history");
  });
});
