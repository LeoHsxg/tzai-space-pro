import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import { readFileSync } from "fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs } from "firebase/firestore";

/**
 * Firestore security rules 整合測試。
 * 驗證 firestore.rules 的核心不變量:
 *   1. 所有 client 寫入一律被拒(寫入只走 Admin SDK / API Route)
 *   2. bookings / regulations / announcements 公開可讀
 *   3. admins/{email} 只有本人可讀
 *   4. 未定義的 collection 讀寫全拒
 */

let testEnv: RulesTestEnvironment;

const ALICE = "alice@example.com";
const BOB = "bob@example.com";

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-tzai-space-rules",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  // 以繞過 rules 的身分預先塞入測試資料(模擬 Admin SDK 寫入的既有資料)
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "bookings/b1"), { room: "書房", name: "測試", status: "active" });
    await setDoc(doc(db, "regulations/current"), { 0: "規則一", 1: "規則二" });
    await setDoc(doc(db, "announcements/a1"), { title: "公告" });
    await setDoc(doc(db, "admins", ALICE), { role: "admin" });
    await setDoc(doc(db, "secrets/s1"), { key: "value" });
  });
});

/** 未登入的 client */
const anon = () => testEnv.unauthenticatedContext().firestore();
/** 以指定 email 登入的 client */
const authedAs = (email: string) =>
  testEnv.authenticatedContext(email.replace(/[@.]/g, "-"), { email }).firestore();

describe("bookings", () => {
  it("未登入可讀(Calendar 公開顯示)", async () => {
    await assertSucceeds(getDoc(doc(anon(), "bookings/b1")));
    await assertSucceeds(getDocs(collection(anon(), "bookings")));
  });

  it("未登入不可寫", async () => {
    await assertFails(setDoc(doc(anon(), "bookings/new"), { room: "橘廳" }));
  });

  it("已登入也不可寫(寫入只走 API Route)", async () => {
    const db = authedAs(ALICE);
    await assertFails(setDoc(doc(db, "bookings/new"), { room: "橘廳" }));
    await assertFails(updateDoc(doc(db, "bookings/b1"), { status: "cancelled" }));
    await assertFails(deleteDoc(doc(db, "bookings/b1")));
  });
});

describe("regulations/current", () => {
  it("未登入可讀", async () => {
    await assertSucceeds(getDoc(doc(anon(), "regulations/current")));
  });

  it("已登入也不可寫", async () => {
    await assertFails(setDoc(doc(authedAs(ALICE), "regulations/current"), { 0: "改規則" }));
  });
});

describe("announcements", () => {
  it("未登入可讀(通知鈴鐺查詢)", async () => {
    await assertSucceeds(getDoc(doc(anon(), "announcements/a1")));
    await assertSucceeds(getDocs(collection(anon(), "announcements")));
  });

  it("已登入也不可寫", async () => {
    await assertFails(setDoc(doc(authedAs(ALICE), "announcements/new"), { title: "假公告" }));
    await assertFails(deleteDoc(doc(authedAs(ALICE), "announcements/a1")));
  });
});

describe("admins/{email}", () => {
  it("本人可讀自己的 admin 文件", async () => {
    await assertSucceeds(getDoc(doc(authedAs(ALICE), "admins", ALICE)));
  });

  it("不可讀別人的 admin 文件", async () => {
    await assertFails(getDoc(doc(authedAs(BOB), "admins", ALICE)));
  });

  it("未登入不可讀", async () => {
    await assertFails(getDoc(doc(anon(), "admins", ALICE)));
  });

  it("本人也不可寫(寫入只允許 Admin SDK)", async () => {
    await assertFails(setDoc(doc(authedAs(ALICE), "admins", ALICE), { role: "admin" }));
    await assertFails(deleteDoc(doc(authedAs(ALICE), "admins", ALICE)));
  });
});

describe("未定義的 collection", () => {
  it("讀寫一律拒絕(即使已登入)", async () => {
    await assertFails(getDoc(doc(authedAs(ALICE), "secrets/s1")));
    await assertFails(setDoc(doc(authedAs(ALICE), "secrets/s2"), { key: "x" }));
  });
});
