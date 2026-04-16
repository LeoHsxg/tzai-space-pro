```ts
getDocs(q)
  .then(snap => {
    const docs = snap.docs //
      .map(doc => ({ id: doc.id, ...doc.data() }) as Booking)
      .filter((b): b is PhotoBooking => !!b.photoUrl && b.photoUrl.trim() !== "");
    setAllPhotos(docs);
  })
  .finally(() => setLoading(false));
```

拆開來一層一層看，getDocs(q) 回傳什麼？

Firestore 回傳的不是你期待的乾淨陣列，而是一個叫 QuerySnapshot 的包裝物件：

```
QuerySnapshot
├── docs: QueryDocumentSnapshot[]   ← 所有文件的陣列
├── size: number                    ← 幾筆
└── empty: boolean                  ← 有沒有資料
```

每個 QueryDocumentSnapshot 長這樣：

```
QueryDocumentSnapshot
├── id: "abc123"           ← 文件 ID（不在 data 裡面！）
└── data(): {              ← 要呼叫 .data() 才能拿到內容
      status: "active",
      endTime: Timestamp,
      room: "A101",
      photoUrl: "https://..."
    }
```

---

第一步：.map(doc => ({ id: doc.id, ...doc.data() }))

問題：id 和資料是分開的，要手動合併。

```ts
// 原本的樣子（Firestore 格式，不好用）
doc.id       → "abc123"
doc.data()   → { status: "active", room: "A101", photoUrl: "..." }

// map 之後合併成一個物件
{ id: "abc123", status: "active", room: "A101", photoUrl: "..." }
//  ↑ 手動加進來      ↑ ...doc.data() 展開放進來
...doc.data() 是展開運算子，意思是「把 data() 裡的所有欄位攤平放進這個物件」。
```

---

第二步：.filter((b): b is PhotoBooking => !!b.photoUrl && b.photoUrl.trim() !== "")

這行做兩件事：過濾資料 + 告訴 TypeScript 型別。

過濾邏輯：

```ts
!!b.photoUrl && // photoUrl 存在且不是 null/undefined
  b.photoUrl.trim() !== ""; // 且不是空字串（去掉空白後）
```

(b): b is PhotoBooking 是什麼？

這是 TypeScript 的 type guard，純粹是給編譯器看的：

```ts
// 沒有 type guard 的版本
.filter(b => !!b.photoUrl)
// → TypeScript 認為結果還是 Booking[]，不確定有沒有 photoUrl

// 有 type guard 的版本
.filter((b): b is PhotoBooking => !!b.photoUrl)
// → TypeScript 知道通過 filter 的每一筆都是 PhotoBooking
//   後續使用 b.photoUrl 不會報型別錯誤
```
