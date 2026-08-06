"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";

import { useAuth } from "../hooks/useAuth";
import { validateData } from "../func/applyFunc";
import { useUI } from "../context/UIContext";
import ConsentCheckbox from "../Components/ConsentCheckbox";
import "../styles/ApplyForm.css";

const ROOM_OPTIONS = ["小導師室", "書房", "橘廳", "會議室", "貢丸室"];

interface ApplyFormProps {
  /** desktop＝桌面 Dialog 雙欄版；預設 mobile 維持既有版面 */
  variant?: "mobile" | "desktop";
  /** 「於此日申請」帶入的日期（時間取當下，結束＋1 小時） */
  defaultDate?: Dayjs | null;
  /** 送出成功後回呼（桌面版用來關閉 Dialog） */
  onSubmitted?: () => void;
  /** 桌面版取消按鈕 */
  onCancel?: () => void;
}

const ApplyForm: React.FC<ApplyFormProps> = ({ variant = "mobile", defaultDate = null, onSubmitted, onCancel }) => {
  const user = useAuth();
  const { showSnackbar, showDialog, hideDialog } = useUI();

  const [startDate, setStartDate] = useState<Dayjs | null>(() => {
    if (!defaultDate) return dayjs();
    const now = dayjs();
    return defaultDate.hour(now.hour()).minute(now.minute()).second(0);
  });
  const [endDate, setEndDate] = useState<Dayjs | null>(() => {
    if (!defaultDate) return dayjs();
    const now = dayjs();
    return defaultDate.hour(now.hour()).minute(now.minute()).second(0).add(1, "hour");
  });
  const [applicantName, setApplicantName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [crowdSize, setCrowdSize] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [consent, setConsent] = useState<boolean>(false);

  // MUI picker 的 popper 要釘在 dialog 內，否則 base-ui Dialog 會把它當 outside click 關掉
  const [popperContainer, setPopperContainer] = useState<HTMLElement | null>(null);

  const handleConsentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConsent(event.target.checked);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!applicantName || !phone || !crowdSize || !location || !startDate || !endDate || !description || !consent) {
      showSnackbar("請填寫所有必填欄位，並同意隱私權政策", "warning");
      return;
    }
    showDialog("處理中...");
    try {
      if (!user) throw new Error("請先進行登入！");
      const token = await user.getIdToken();
      const requestBody = {
        name: applicantName,
        phone: phone,
        crowdSize: crowdSize,
        room: location,
        checkinTime: startDate.toISOString(),
        checkoutTime: endDate.toISOString(),
        eventDescription: description,
      };
      await validateData({ ...requestBody, email: user.email ?? "" });
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Unknown error");
      }
      showSnackbar("預約成功。", "success");
      onSubmitted?.();
    } catch (err: unknown) {
      showSnackbar((err as Error).message || "請求失敗，請稍後再試。", "error");
    } finally {
      hideDialog();
    }
  };

  useEffect(() => {
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) && !/Chromium/.test(navigator.userAgent);
    if (isSafari) {
      // showSnackbar("Safari 可能會有 Cookie 與跨站追蹤阻擋的問題，建議使用 Chrome", "info");
    }
  }, []);

  const roomSelectItems = ROOM_OPTIONS.map(room => (
    <SelectItem key={room} className="text-base pt-2.5 pb-3.5 pl-4" value={room}>
      {room}
    </SelectItem>
  ));

  if (variant === "desktop") {
    const label = "mb-1.5 block text-xs text-[#9AA0A6]";
    const textInput =
      "h-11 rounded-[10px] border-[#D9DEE4] bg-white px-3.5 text-sm font-medium text-gray-700 placeholder:text-gray-300 focus-visible:border-[#5991C4] focus-visible:ring-0";
    const pickerSlotProps = { popper: { container: popperContainer } };

    return (
      <div ref={setPopperContainer} className="px-6 pt-5 pb-5">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-4 gap-y-3.5">
          <div>
            <span className={label}>申請人姓名</span>
            <Input className={textInput} placeholder="王小明" value={applicantName} onChange={e => setApplicantName(e.target.value)} />
          </div>
          <div>
            <span className={label}>手機號碼</span>
            <Input className={textInput} placeholder="09xx-xxx-xxx" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div>
            <span className={label}>人數</span>
            <Input className={textInput} placeholder="4" value={crowdSize} onChange={e => setCrowdSize(e.target.value)} />
          </div>
          <div>
            <span className={label}>借用地點</span>
            {/* value 恆為受控（空值用 null），undefined 會讓元件在受控/非受控間切換而觸發 React 警告 */}
            <Select value={location || null} onValueChange={value => setLocation((value as string | null) ?? "")}>
              {/* 要用 data-[size=default] 覆寫，基礎樣式的 h-8 帶 data 選擇器，純 h-11 蓋不掉 */}
              <SelectTrigger className="w-full rounded-[10px] border border-[#D9DEE4] bg-white px-3.5 text-sm font-medium text-gray-700 data-[size=default]:h-11">
                <SelectValue placeholder="選擇空間" />
              </SelectTrigger>
              <SelectContent align="start" alignItemWithTrigger={true} className="ring-0 outline-none py-2 shadow-[0_4px_24px_rgba(0,0,0,0.10)]">
                {roomSelectItems}
              </SelectContent>
            </Select>
          </div>
          <div>
            <span className={label}>開始時間</span>
            <DateTimePicker
              className="dipt w-full"
              value={startDate}
              views={["month", "day", "hours", "minutes"]}
              onChange={newValue => setStartDate(newValue)}
              slotProps={pickerSlotProps}
            />
          </div>
          <div>
            <span className={label}>結束時間</span>
            <DateTimePicker
              className="dipt w-full"
              value={endDate}
              views={["month", "day", "hours", "minutes"]}
              onChange={newValue => setEndDate(newValue)}
              slotProps={pickerSlotProps}
            />
          </div>
          <div className="col-span-2">
            <span className={label}>活動簡述</span>
            <Input className={textInput} placeholder="活動簡述（請認真寫！）" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="col-span-2 -mx-6 mt-2.5 flex items-center justify-between gap-4 border-t border-[#E8E8E8] px-6 pt-4">
            <ConsentCheckbox checked={consent} onChange={handleConsentChange} />
            <div className="flex shrink-0 items-center gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-[9px] border border-[#D9DEE4] px-5 py-2 text-sm text-[#5B6572] transition-colors hover:bg-gray-50">
                取消
              </button>
              <button type="submit" className="rounded-[9px] bg-[#5991C4] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#4880B0]">
                確認送出
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="mt-[5px] md:my-5 px-[5%] pb-20 md:pb-0 max-w-[640px] mx-auto">
      <form onSubmit={handleSubmit} className="gap-5 flex flex-col justify-center items-center">
        <div className="w-full">
          <Input className="ipt bg-white" placeholder="申請人姓名" onChange={e => setApplicantName(e.target.value)} />
        </div>
        <div className="flex justify-between w-full">
          <Input className="ipt w-full" placeholder="手機號碼" onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="w-full justify-between flex gap-4">
          <Input className="ipt w-32 shrink-0" placeholder="人數" onChange={e => setCrowdSize(e.target.value)} />
          <Select onValueChange={value => setLocation(value as string)}>
            <SelectTrigger className="ipt flex-1 border-0 pl-4">
              <SelectValue placeholder="借用地點" />
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={true} className="ring-0 outline-none py-2 shadow-[0_4px_24px_rgba(0,0,0,0.10)]">
              {roomSelectItems}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full">
          <DateTimePicker className="ipt w-full" label="開始日期" value={startDate} views={["month", "day", "hours", "minutes"]} onChange={newValue => setStartDate(newValue)}
            slotProps={{ textField: { sx: { "& .MuiPickersOutlinedInput-notchedOutline": { border: "none" } } } }} />
        </div>
        <div className="flex justify-between w-full">
          <DateTimePicker className="ipt w-full" label="結束日期" value={endDate} views={["month", "day", "hours", "minutes"]} onChange={newValue => setEndDate(newValue)}
            slotProps={{ textField: { sx: { "& .MuiPickersOutlinedInput-notchedOutline": { border: "none" } } } }} />
        </div>
        <div className="w-full">
          <Input className="ipt" placeholder="活動簡述（請認真寫！）" onChange={e => setDescription(e.target.value)} />
        </div>
      </form>
      <div className="mt-2 flex flex-col justify-center items-center gap-0.5">
        <div className="px-2 noto font-normal text-gray-400 text-xs text-center leading-relaxed">
          *使用 Safari 可能會無法登入，臉書與 Line 瀏覽器則無法使用，建議使用 Chrome 等原生瀏覽器
        </div>
        <ConsentCheckbox checked={consent} onChange={handleConsentChange} />
        <Button className="myBtn w-full" type="submit" size="lg" onClick={handleSubmit}>
          確認送出
        </Button>
      </div>
    </div>
  );
};

export default ApplyForm;
