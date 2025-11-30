/**
 * 主要功能：
 * 1. 讀取 service_account.json (Service Account 憑證)
 * 2. 透過 JWT 建立 Google Calendar API 的授權。
 * 3. 提供一個 HTTP Cloud Function (addEventToCalendar)，對外接受 POST 請求。
 * 4. 在請求中包含要預訂或取消的資訊，就會去新增/刪除 Google Calendar 事件。
 */
const { google } = require("googleapis");
// 讀取 Service Account JSON 檔案 (裡面需要包含 client_email / private_key 等欄位)
const serviceAccount = require("./service_account.json");
const calendar = google.calendar("v3");
const TIME_ZONE = "Asia/Taipei";

const CALENDAR_ID = "oa27fmn21hoqd0hvdpg1bqlv1k@group.calendar.google.com";

/**
 * 這個函式負責回傳一個 JWT 物件，用來透過 Service Account 連線到 Google API
 * @returns {google.auth.JWT}
 */
function getServiceAccountAuth() {
  return new google.auth.JWT(
    serviceAccount.client_email, // 來自 service_account.json
    null, // keyFile 或 key 的路徑, 這裡用 null 因為我們直接用 private_key
    serviceAccount.private_key, // 私鑰，用於 JWT 簽署
    ["https://www.googleapis.com/auth/calendar"] // 我們要使用 calendar 的 scope
  );
}

/**
 * addEvent: 處理核心的「新增事件(預訂)」或「刪除事件(取消)」邏輯
 * @param {Object} event - 從後端傳來的資料
 * @param {google.auth.JWT} auth - 透過 getServiceAccountAuth() 取得的 JWT，用於呼叫 Calendar API
 * @returns {Promise<Object>} - 回傳一個物件，內含 message 欄位
 */
async function addEvent(event) {
  // 先看一下 event 內容，方便除錯
  console.log("Received event data:", event);

  let auth = getServiceAccountAuth();

  // 轉成 Date 物件後再 toISOString()
  const st = new Date(event.checkinTime);
  const ed = new Date(event.checkoutTime);

  // 組合要寫進 Google Calendar "description" 的內容
  // 這段不能拿掉！要不然在 google calendar 就啥都看不到了！
  const desc = [
    `Booked by: ${event.name}`,
    `Contact: ${event.email}`,
    `Phone: ${event.phone}`,
    `Crowd Size: ${event.crowdSize}`,
    `Event Description: ${event.eventDescription}`,
    `Booked at: ${new Date().toISOString()}`, // 紀錄系統現在操作時間
  ].join("\n");

  // 為了查詢是否衝突，我們將要查詢 st 前 2 天, ed 後 2 天 的事件
  const st1 = new Date(st);
  st1.setDate(st1.getDate() - 2);
  const ed1 = new Date(ed);
  ed1.setDate(ed1.getDate() + 2);

  // 呼叫 calendar.events.list 查詢，看看在 [st1, ed1] 之間有什麼事件
  const eventListResp = await calendar.events.list({
    auth,
    calendarId: "oa27fmn21hoqd0hvdpg1bqlv1k@group.calendar.google.com", // 這個換成你實際的 Calendar ID
    timeMin: st1.toISOString(),
    timeMax: ed1.toISOString(),
    maxResults: 2000,
  });
  const events = eventListResp.data.items || [];

  // 交集判斷: 時段 [a, b) 和 [c, d) 是否有重疊
  function intersect(a, b, c, d) {
    return Math.max(+a, +c) < Math.min(+b, +d);
  }

  // 逐一檢查已經存在的事件
  for (const _event of events) {
    // 解析 _event 的開始、結束和摘要(房間名稱)
    const s = new Date(_event.start.dateTime);
    const e = new Date(_event.end.dateTime);
    const r = _event.summary; // e.g. "書房" / "橘廳" / ...

    // 如果房間名字跟我們允許的四種以外，顯示錯誤(理論上應該不會發生)
    if (!["書房", "橘廳", "會議室", "小導師室", "貢丸室"].includes(r)) {
      throw new Error("Something wrong: " + r + ", please notify the admin");
    }

    // 若房間一樣，且時間區間相交，就拋錯
    if (r === event.room && intersect(st, ed, s, e)) {
      throw new Error("Conflicts with: " + _event.htmlLink);
    }
  }

  // 如果走到這裡，表示要預訂，且沒有衝突
  // 直接呼叫 calendar.events.insert 新增事件
  await calendar.events.insert({
    auth,
    calendarId: CALENDAR_ID,
    resource: {
      summary: event.room, // 顯示哪個房間
      description: desc, // 寫入我們組合好的描述
      colorId: ["書房", "橘廳", "會議室", "小導師室", "貢丸室"].findIndex(s => s === event.room) + 1,
      start: {
        dateTime: st,
        timeZone: TIME_ZONE,
      },
      end: {
        dateTime: ed,
        timeZone: TIME_ZONE,
      },
      extendedProperties: {
        shared: {
          phone: event.phone,
          crowdSize: event.crowdSize,
          name: event.name,
          email: event.email,
          eventDescription: event.eventDescription,
        },
      },
    },
  });

  // 新增成功後回傳一個訊息 => 沒有用到
  return {
    message:
      "預約成功\n" +
      "Please check the calendar since this system is still in beta phase " +
      "and might make some mistakes (in case of unexpected conflict, " +
      "whichever with an earlier create time is effective).",
  };
}

/**
 * 刪除事件函式
 * @param {Object} params
 * @param {string} params.email     用戶請求時帶入的 email
 * @param {string} params.eventId   要刪除的事件 ID
 */
async function deleteEvent({ email, eventId }) {
  const auth = getServiceAccountAuth();

  // 1. 先拿到原事件，確認 extendedProperties.shared.email
  let getResp;
  try {
    getResp = await calendar.events.get({
      auth,
      calendarId: CALENDAR_ID,
      eventId,
      fields: "extendedProperties/shared",
    });
  } catch (err) {
    if (err.code === 404) {
      throw new Error(`找不到事件: ${eventId}`);
    }
    throw new Error(`取得事件失敗：${err.message}`);
  }

  const ownerEmail = getResp.data.extendedProperties?.shared?.email;
  if (!ownerEmail) {
    throw new Error("此為舊版網站建立之事件，請聯繫管理員協助刪除");
  }
  if (ownerEmail !== email) {
    throw new Error("只能刪除自己建立的事件，話說你是怎麼繞過來的");
  }

  // 2. 呼叫 delete 刪除事件
  await calendar.events.delete({
    auth,
    calendarId: CALENDAR_ID,
    eventId,
  });

  return { message: "刪除成功" };
}

async function listAllEvents() {
  const auth = getServiceAccountAuth(); // 來自 service account 的 JWT :contentReference[oaicite:0]{index=0}
  let events = [];
  let nextPageToken = null;

  do {
    const resp = await calendar.events.list({
      auth,
      calendarId: CALENDAR_ID,
      singleEvents: true, // 拆開重複事件
      orderBy: "startTime", // 依開始時間排序
      timeMin: new Date(0).toISOString(), // 從 1970 年開始，確保拿到所有過去／未來事件
      maxResults: 2500, // 單頁最多 2500 筆
      pageToken: nextPageToken, // 分頁用
      fields: "items(id,start,end,summary,description,extendedProperties(shared))",
    });
    const items = resp.data.items || [];
    events = events.concat(items);
    nextPageToken = resp.data.nextPageToken;
  } while (nextPageToken);

  return events;
}

module.exports = { addEvent, deleteEvent, listAllEvents };
