export interface RequestBody {
  name: string; // 申請人姓名
  phone: string; // 電話號碼
  crowdSize: string; // 人數
  room: string; // 使用地點
  checkinTime: string; // 開始時間 (ISO 格式)
  checkoutTime: string; // 結束時間 (ISO 格式)
  email: string; // 信箱
  eventDescription: string; // 活動描述
}

export async function validateData(event: RequestBody) {
  // 基本資料檢查：電話號碼/人數/姓名/描述的長度或格式
  if (/^\d+$/.exec(event.phone) == null) {
    throw new Error("你打得這是電話號碼嗎...");
  }
  if (event.phone.length != 10) {
    throw new Error("Phone length doesn's match!");
  }
  if (parseInt(event.crowdSize) <= 0) {
    throw new Error("人數請至少為 1, 老兄你是幽靈嗎?");
  }
  if (/^\d+$/.exec(event.crowdSize) == null) {
    throw new Error("為什麼人數不是整數啦...");
  }
  if (event.name.length > 30) {
    throw new Error("名字太長啦, Ovuvuevuevue enyetuenwuevue ugbemugbem osas");
  }
  if (event.eventDescription.length > 100) {
    throw new Error("感謝你描述那麼詳細，但是太詳細了");
  }

  // 轉成 Date 物件後再 toISOString()
  const st = new Date(event.checkinTime).getTime();
  const ed = new Date(event.checkoutTime).getTime();
  const today = new Date().getTime();

  // 限制只能預訂未來 31 天內的時間
  const diffInDays = (st - today) / (1000 * 3600 * 24);
  if (diffInDays > 31) {
    throw new Error("Not allowed to book further than one month to the future.");
  }
  // 檢查區間是否正確
  if (st >= ed) {
    throw new Error("結束時間請大於開始時間, 越活越回去齁你");
  }
  const diffInHours = (ed - st) / (1000 * 3600);
  if (diffInHours > 4) {
    throw new Error("一次最多只能借用四小時！");
  }
}
