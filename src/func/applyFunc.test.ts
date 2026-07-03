import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { validateData, RequestBody } from "./applyFunc";

/** 固定「現在」為 2026-07-01 12:00,讓日期邊界測試可重現 */
const NOW = new Date("2026-07-01T12:00:00+08:00");

/** 回傳一份完全合法的申請資料,個別測試再覆寫要測的欄位 */
function validBody(overrides: Partial<RequestBody> = {}): RequestBody {
  const checkin = new Date(NOW.getTime() + 24 * 3600 * 1000); // 明天 12:00
  const checkout = new Date(checkin.getTime() + 2 * 3600 * 1000); // 借 2 小時
  return {
    name: "王小明",
    phone: "0912345678",
    crowdSize: "4",
    room: "書房",
    checkinTime: checkin.toISOString(),
    checkoutTime: checkout.toISOString(),
    email: "test@example.com",
    eventDescription: "讀書會",
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

describe("validateData", () => {
  it("合法資料應通過驗證", async () => {
    await expect(validateData(validBody())).resolves.toBeUndefined();
  });

  describe("電話", () => {
    it("含非數字字元應被拒絕", async () => {
      await expect(validateData(validBody({ phone: "09123456ab" }))).rejects.toThrow();
    });

    it("長度不足 10 應被拒絕", async () => {
      await expect(validateData(validBody({ phone: "091234567" }))).rejects.toThrow();
    });

    it("長度超過 10 應被拒絕", async () => {
      await expect(validateData(validBody({ phone: "09123456789" }))).rejects.toThrow();
    });
  });

  describe("人數", () => {
    it("0 人應被拒絕", async () => {
      await expect(validateData(validBody({ crowdSize: "0" }))).rejects.toThrow();
    });

    it("負數應被拒絕", async () => {
      await expect(validateData(validBody({ crowdSize: "-3" }))).rejects.toThrow();
    });

    it("非整數應被拒絕", async () => {
      await expect(validateData(validBody({ crowdSize: "2.5" }))).rejects.toThrow();
    });

    it("非數字應被拒絕", async () => {
      await expect(validateData(validBody({ crowdSize: "abc" }))).rejects.toThrow();
    });
  });

  describe("姓名與描述長度", () => {
    it("姓名 30 字應通過", async () => {
      await expect(validateData(validBody({ name: "a".repeat(30) }))).resolves.toBeUndefined();
    });

    it("姓名 31 字應被拒絕", async () => {
      await expect(validateData(validBody({ name: "a".repeat(31) }))).rejects.toThrow();
    });

    it("描述 100 字應通過", async () => {
      await expect(validateData(validBody({ eventDescription: "a".repeat(100) }))).resolves.toBeUndefined();
    });

    it("描述 101 字應被拒絕", async () => {
      await expect(validateData(validBody({ eventDescription: "a".repeat(101) }))).rejects.toThrow();
    });
  });

  describe("預訂時間範圍", () => {
    it("30 天後的預約應通過", async () => {
      const checkin = new Date(NOW.getTime() + 30 * 24 * 3600 * 1000);
      const checkout = new Date(checkin.getTime() + 2 * 3600 * 1000);
      await expect(
        validateData(validBody({ checkinTime: checkin.toISOString(), checkoutTime: checkout.toISOString() }))
      ).resolves.toBeUndefined();
    });

    it("超過 31 天的預約應被拒絕", async () => {
      const checkin = new Date(NOW.getTime() + 32 * 24 * 3600 * 1000);
      const checkout = new Date(checkin.getTime() + 2 * 3600 * 1000);
      await expect(
        validateData(validBody({ checkinTime: checkin.toISOString(), checkoutTime: checkout.toISOString() }))
      ).rejects.toThrow();
    });
  });

  describe("時間區間", () => {
    it("結束時間等於開始時間應被拒絕", async () => {
      const body = validBody();
      await expect(validateData({ ...body, checkoutTime: body.checkinTime })).rejects.toThrow();
    });

    it("結束時間早於開始時間應被拒絕", async () => {
      const body = validBody();
      await expect(
        validateData({ ...body, checkinTime: body.checkoutTime, checkoutTime: body.checkinTime })
      ).rejects.toThrow();
    });

    it("剛好 4 小時應通過", async () => {
      const checkin = new Date(NOW.getTime() + 24 * 3600 * 1000);
      const checkout = new Date(checkin.getTime() + 4 * 3600 * 1000);
      await expect(
        validateData(validBody({ checkinTime: checkin.toISOString(), checkoutTime: checkout.toISOString() }))
      ).resolves.toBeUndefined();
    });

    it("超過 4 小時應被拒絕", async () => {
      const checkin = new Date(NOW.getTime() + 24 * 3600 * 1000);
      const checkout = new Date(checkin.getTime() + 4 * 3600 * 1000 + 60 * 1000); // 4 小時 1 分
      await expect(
        validateData(validBody({ checkinTime: checkin.toISOString(), checkoutTime: checkout.toISOString() }))
      ).rejects.toThrow();
    });
  });
});
