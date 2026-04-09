# Custom Booking Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the MUI `DateCalendar` in `src/views/Calendar.tsx` with a fully custom calendar component built on shadcn/ui Calendar (react-day-picker), showing colored booking-indicator dots per day.

**Architecture:** A new `BookingCalendar` component wraps the shadcn `Calendar` with custom `classNames` and a `DayContent` override that renders colored dots. `Calendar.tsx` derives a `bookingsByDate` map from the existing `bookings` state and passes it down. The booking-list panel in `Calendar.tsx` is untouched.

**Tech Stack:** shadcn/ui Calendar (react-day-picker v8), dayjs, Tailwind CSS, TypeScript, lucide-react (already installed)

---

## File Map

| Status | Path | Responsibility |
|--------|------|----------------|
| **Create** | `src/Components/BookingCalendar.tsx` | Custom calendar UI — styling, dots, nav icons |
| **Modify** | `src/views/Calendar.tsx` | Swap `<DateCalendar>` → `<BookingCalendar>`; derive `bookingsByDate` |
| **Auto-created** | `src/Components/ui/calendar.tsx` | Shadcn base Calendar (created by CLI, not hand-edited) |

---

## Design Spec (reference while implementing)

| Token | Value |
|-------|-------|
| Font | `'Roboto', 'Helvetica', 'Arial', sans-serif` |
| Date font size | `12px` |
| Day cell circle | `28×28px` |
| Today state | `1.5px solid #9ca3af` outline, no fill |
| Selected state | `#f97316` fill, no shadow, no border |
| Today + Selected | orange fill wins |
| Other-month dates | `#d1d5db` |
| Calendar card | white bg, no box-shadow |
| Dots size | `5px` circle, `2px` gap |
| Nav buttons | no border, no bg; hover `#f3f4f6` |
| Week start | Sunday (`weekStartsOn={0}`) |

Room color map (matches `Reserve.tsx`):

```typescript
const ROOM_COLORS: Record<string, string> = {
  書房:    "#E44C4C",
  橘廳:    "#FF6F0D",
  會議室:  "#54A0F9",
  小導師室:"#FFD81E",
  貢丸室:  "#9458E2",
};
```

---

## Task 1 — Install shadcn Calendar

**Files:**
- Create: `src/Components/ui/calendar.tsx` (via CLI)

- [ ] **Step 1: Run shadcn add**

```bash
npx shadcn@latest add calendar
```

Expected output: `✔ Done. calendar installed.` and file created at `src/Components/ui/calendar.tsx`.

- [ ] **Step 2: Verify the file exists**

```bash
ls src/Components/ui/calendar.tsx
```

Expected: file listed with no error.

- [ ] **Step 3: Start dev server and verify no build error**

```bash
npm run dev
```

Open `http://localhost:3000`. Expected: page loads without console errors.

- [ ] **Step 4: Commit**

```bash
git add src/Components/ui/calendar.tsx
git commit -m "chore: add shadcn calendar component"
```

---

## Task 2 — Create `BookingCalendar` component

**Files:**
- Create: `src/Components/BookingCalendar.tsx`

- [ ] **Step 1: Create the file**

`src/Components/BookingCalendar.tsx`:

```typescript
"use client";

import React from "react";
import dayjs, { Dayjs } from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar } from "@/Components/ui/calendar";

const ROOM_COLORS: Record<string, string> = {
  書房:    "#E44C4C",
  橘廳:    "#FF6F0D",
  會議室:  "#54A0F9",
  小導師室:"#FFD81E",
  貢丸室:  "#9458E2",
};

interface BookingCalendarProps {
  value: Dayjs | null;
  onChange: (date: Dayjs) => void;
  /** date string "YYYY-MM-DD" → array of room names with bookings */
  bookingsByDate: Map<string, string[]>;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  value,
  onChange,
  bookingsByDate,
}) => {
  const selected = value ? value.toDate() : undefined;

  return (
    <Calendar
      mode="single"
      selected={selected}
      onSelect={(date) => date && onChange(dayjs(date))}
      weekStartsOn={0}
      showOutsideDays
      className="w-full bg-white rounded-[14px] p-5 font-[Roboto,Helvetica,Arial,sans-serif]"
      classNames={{
        months:          "flex flex-col",
        month:           "space-y-3",
        caption:         "flex justify-between items-center mb-4",
        caption_label:   "text-sm font-medium text-[#111827]",
        nav:             "flex gap-1",
        nav_button:
          "h-7 w-7 border-0 bg-transparent rounded-md flex items-center justify-center text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] transition-colors",
        nav_button_previous: "",
        nav_button_next:     "",
        table:           "w-full border-collapse",
        head_row:        "grid grid-cols-7 mb-2",
        head_cell:       "text-[#9ca3af] text-[11px] font-medium text-center",
        row:             "grid grid-cols-7 gap-0.5",
        cell:            "flex justify-center",
        day:
          "h-auto w-7 p-0 flex flex-col items-center rounded-md cursor-pointer hover:bg-[#f9fafb] transition-colors py-1 pb-1.5 text-[#374151] aria-selected:bg-transparent",
        day_selected:    "!bg-transparent",
        day_today:       "!bg-transparent",
        day_outside:     "text-[#d1d5db]",
        day_disabled:    "text-[#d1d5db] cursor-not-allowed",
        day_hidden:      "invisible",
      }}
      components={{
        IconLeft:  () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
        DayContent: ({ date }) => {
          const dateStr = dayjs(date).format("YYYY-MM-DD");
          const rooms = bookingsByDate.get(dateStr) ?? [];
          const isToday    = dayjs(date).isSame(dayjs(), "day");
          const isSelected = value ? dayjs(date).isSame(value, "day") : false;

          const circleClass = isSelected
            ? "bg-[#f97316] text-white font-bold"
            : isToday
            ? "border border-[#9ca3af] font-medium"
            : "";

          return (
            <div className="flex flex-col items-center">
              <span
                className={`w-7 h-7 flex items-center justify-center rounded-full text-[12px] ${circleClass}`}
              >
                {date.getDate()}
              </span>
              <div className="flex gap-[2px] mt-[3px] min-h-[6px] items-center">
                {rooms.slice(0, 5).map((room, i) => (
                  <span
                    key={i}
                    className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                    style={{ backgroundColor: ROOM_COLORS[room] ?? "#ccc" }}
                  />
                ))}
              </div>
            </div>
          );
        },
      }}
    />
  );
};
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npm run build 2>&1 | grep -E "error|Error"
```

Expected: no output (no errors). If there are type errors from react-day-picker's `DayContentProps`, add `import type { DayContentProps } from "react-day-picker";` and type the prop as `(props: DayContentProps) => JSX.Element`.

- [ ] **Step 3: Commit**

```bash
git add src/Components/BookingCalendar.tsx
git commit -m "feat: add BookingCalendar component with colored dots"
```

---

## Task 3 — Wire `BookingCalendar` into `Calendar.tsx`

**Files:**
- Modify: `src/views/Calendar.tsx`

- [ ] **Step 1: Derive `bookingsByDate` and swap the calendar widget**

Replace the contents of `src/views/Calendar.tsx` with:

```typescript
"use client";

import React, { useState, useEffect, useMemo } from "react";
import dayjs, { Dayjs } from "dayjs";
import { collection, onSnapshot, query, where, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { Booking } from "../types/booking";
import Reserve from "../Components/Reserve";
import MyDialog from "../Components/MyDialog";
import { BookingCalendar } from "../Components/BookingCalendar";

const loadingSpinnerStyle: React.CSSProperties = {
  width: "32px",
  height: "32px",
  border: "3px solid #e5e7eb",
  borderTopColor: "#f97316",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const Calendar: React.FC = () => {
  const [value, setValue] = useState<Dayjs | null>(null);

  useEffect(() => {
    setValue(dayjs());
  }, []);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [filteredAmount, setFilteredAmount] = useState<number>(0);
  const [spanningBookings, setSpanningBookings] = useState<Booking[]>([]);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [open, setOpen] = useState(false);

  // Subscribe to active bookings within ±4 months window
  useEffect(() => {
    const start = Timestamp.fromDate(dayjs().subtract(4, "month").startOf("month").toDate());
    const end   = Timestamp.fromDate(dayjs().add(1, "month").endOf("month").toDate());
    const q = query(
      collection(db, "bookings"),
      where("status", "==", "active"),
      where("startTime", ">=", start),
      where("startTime", "<=", end),
      orderBy("startTime"),
    );
    const unsubscribe = onSnapshot(q, snap => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Booking);
      setBookings(data);
      setLoadingBookings(false);
    });
    return () => unsubscribe();
  }, []);

  // Derive bookingsByDate map for dot indicators
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, string[]>();
    bookings.forEach(b => {
      const start = dayjs(b.startTime.toDate());
      const end   = dayjs(b.endTime.toDate());
      let cursor  = start.startOf("day");
      // walk each day the booking spans
      while (cursor.isBefore(end, "day") || cursor.isSame(end, "day")) {
        const key = cursor.format("YYYY-MM-DD");
        const existing = map.get(key) ?? [];
        // only push room once per booking per day (avoid duplicates for same room)
        if (!existing.includes(b.room)) {
          map.set(key, [...existing, b.room]);
        }
        cursor = cursor.add(1, "day");
      }
    });
    return map;
  }, [bookings]);

  const windowStart  = dayjs().subtract(4, "month").startOf("month");
  const windowEnd    = dayjs().add(1, "month").endOf("month");
  const isOutOfWindow =
    value !== null &&
    (value.isBefore(windowStart, "day") || value.isAfter(windowEnd, "day"));

  // Filter bookings for selected date
  useEffect(() => {
    if (!value) return;
    const selectedDate = value.format("YYYY-MM-DD");

    const dailyBookings = bookings.filter(b => {
      const sd = dayjs(b.startTime.toDate()).format("YYYY-MM-DD");
      const ed = dayjs(b.endTime.toDate()).format("YYYY-MM-DD");
      return sd <= selectedDate && selectedDate <= ed;
    });

    const spanning = dailyBookings.filter(b =>
      dayjs(b.startTime.toDate()).isBefore(selectedDate),
    );
    const today = dailyBookings.filter(b =>
      dayjs(b.startTime.toDate()).isSame(selectedDate, "day"),
    );

    setFilteredAmount(dailyBookings.length);
    setSpanningBookings(spanning);
    setTodayBookings(today);
  }, [value, bookings]);

  return (
    <div className="flex flex-col pb-16 md:flex-row md:gap-8 md:max-w-[900px] md:mx-auto md:px-8 md:pb-0">
      {/* 行事曆 */}
      <div className="px-[7.5%] md:pt-5 md:px-0 md:flex md:justify-end">
        <div style={{ minWidth: "320px" }}>
          <BookingCalendar
            value={value}
            onChange={setValue}
            bookingsByDate={bookingsByDate}
          />
        </div>
      </div>

      {/* 預約詳情 — 不改動 */}
      <div className="w-full py-4 px-[5%] flex flex-col items-center inline-flex md:pt-5 md:pb-0 md:px-0 md:grow">
        <div className="self-stretch px-2.5 justify-between items-center inline-flex">
          <div className="font">今日預約共 {filteredAmount} 筆</div>
          <a
            href="https://calendar.google.com/calendar/u/0/embed?src=oa27fmn21hoqd0hvdpg1bqlv1k@group.calendar.google.com&ctz=Asia/Taipei"
            target="_blank"
            rel="noopener noreferrer"
            className="font underline">
            預約詳情
          </a>
        </div>

        <div className="self-stretch py-2.5 flex-col justify-start items-center gap-3.5 flex">
          {loadingBookings && <div style={{ ...loadingSpinnerStyle, marginTop: "24px" }} />}
          {isOutOfWindow && (
            <p className="text-xs text-gray-400 text-center px-4 pt-2">
              因為一次加載太多資料會讓管管的錢包很有負荷，而管管又很懶得寫動態加載，所以只加載最近半年的資料，造成不便敬請見諒，如有需求請再聯繫管管。
            </p>
          )}
          {spanningBookings.map((b, index) => (
            <Reserve
              onClick={() => { setSelectedBooking(b); setOpen(true); }}
              key={index}
              booking={b}
            />
          ))}

          {spanningBookings.length > 0 && todayBookings.length > 0 && (
            <div className="w-full px-2">
              <div className="w-full border-t-2 border-dashed border-gray-400/40" />
            </div>
          )}

          {todayBookings.map((b, index) => (
            <Reserve
              onClick={() => { setSelectedBooking(b); setOpen(true); }}
              key={spanningBookings.length + index}
              booking={b}
            />
          ))}

          <MyDialog open={open} onClose={() => setOpen(false)} booking={selectedBooking} />
        </div>
      </div>
    </div>
  );
};

export default Calendar;
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:3000`. Check:
- [ ] Calendar renders (white card, no shadow)
- [ ] Clicking a date selects it (orange fill, no shadow)
- [ ] Today has grey outline circle
- [ ] Dates with bookings show colored dots
- [ ] `<` `>` arrows have no border/box
- [ ] Booking list panel still works (click a booking opens dialog)

- [ ] **Step 3: Commit**

```bash
git add src/views/Calendar.tsx
git commit -m "feat: replace MUI DateCalendar with custom BookingCalendar"
```

---

## Task 4 — Clean up MUI import

**Files:**
- Modify: `src/views/Calendar.tsx` (already done in Task 3 — verify only)
- Modify: `src/styles/Calendar.css` (check if any MUI-specific overrides can be removed)

- [ ] **Step 1: Confirm MUI DateCalendar is no longer imported anywhere**

```bash
grep -r "DateCalendar\|@mui/x-date-pickers" src/
```

Expected: no output.

- [ ] **Step 2: Check Calendar.css for MUI remnants**

```bash
cat src/styles/Calendar.css
```

The file only contains `.font { ... }`. No MUI-specific selectors — nothing to remove.

- [ ] **Step 3: Verify build still passes**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ Compiled successfully` (or similar success output).

- [ ] **Step 4: Final commit**

```bash
git add -p
git commit -m "chore: remove MUI DateCalendar dependency from Calendar view"
```

---

## Known Edge Cases

| Case | Handled by |
|------|-----------|
| Spanning bookings (multi-day) | `bookingsByDate` walks day-by-day so each spanned day gets a dot |
| Same room booked twice on same day | `!existing.includes(b.room)` deduplicates dots per room per day |
| More than 5 rooms on one day | `.slice(0, 5)` — max 5 dots (one per room) |
| `value` is null on first render | `selected={undefined}` (safe for react-day-picker) |
| Out-of-window dates | Existing `isOutOfWindow` message in booking panel is untouched |
