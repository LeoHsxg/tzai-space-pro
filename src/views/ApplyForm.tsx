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

const ApplyForm: React.FC = () => {
  const user = useAuth();
  const { showSnackbar, showDialog, hideDialog } = useUI();

  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [applicantName, setApplicantName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [crowdSize, setCrowdSize] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [consent, setConsent] = useState<boolean>(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <SelectContent align="start" alignItemWithTrigger={true} className="ring-0 outline-none py-2 shadow-[0px_4px_24px_rgba(0,0,0,0.10)]">
              <SelectItem className="text-base pt-2.5 pb-3.5 pl-4" value="小導師室">
                小導師室
              </SelectItem>
              <SelectItem className="text-base pt-2.5 pb-3.5 pl-4" value="書房">
                書房
              </SelectItem>
              <SelectItem className="text-base pt-2.5 pb-3.5 pl-4" value="橘廳">
                橘廳
              </SelectItem>
              <SelectItem className="text-base pt-2.5 pb-3.5 pl-4" value="會議室">
                會議室
              </SelectItem>
              <SelectItem className="text-base pt-2.5 pb-3.5 pl-4" value="貢丸室">
                貢丸室
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full">
          <DateTimePicker className="ipt w-full" label="開始日期" value={startDate} views={["month", "day", "hours", "minutes"]} onChange={newValue => setStartDate(newValue)} />
        </div>
        <div className="flex justify-between w-full">
          <DateTimePicker className="ipt w-full" label="結束日期" value={endDate} views={["month", "day", "hours", "minutes"]} onChange={newValue => setEndDate(newValue)} />
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
