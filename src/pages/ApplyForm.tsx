import React, { useState, useEffect } from "react";
import { Button, Box, MenuItem, FormControl, Select } from "@mui/material";
import InputLabel from "@mui/material/InputLabel";
import TextField from "@mui/material/TextField";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";

import { useAuth } from "../hooks/useAuth";
import { validateData } from "../func/applyFunc";
import { useUI } from "../context/UIContext";
import ConsentCheckbox from "../Components/ConsentCheckbox";
import "../styles/ApplyForm.css";

const FUNCTION_URL = "api/add/";

const ApplyForm: React.FC = () => {
  const user = useAuth(); // 從 context 拿使用者
  const { showSnackbar, showDialog, hideDialog } = useUI(); // 使用 useUI 來管理 Snackbar

  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs());
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [applicantName, setApplicantName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [crowdSize, setCrowdSize] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [consent, setConsent] = useState<boolean>(false);

  // 處理同意勾選狀態（假設 ConsentCheckbox 支援 checked 與 onChange）
  const handleConsentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConsent(event.target.checked);
  };

  // 表單提交核心程式
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // 基本欄位驗證，確認必填欄位皆有填寫
    if (!applicantName || !phone || !crowdSize || !location || !startDate || !endDate || !description || !consent) {
      showSnackbar("請填寫所有必填欄位，並同意隱私權政策", "warning");
      return;
    }

    showDialog("處理中...");

    try {
      if (!user) {
        throw new Error("請先進行登入！");
      }

      const requestBody = {
        name: applicantName,
        phone: phone,
        crowdSize: crowdSize,
        room: location,
        checkinTime: startDate.toISOString(),
        checkoutTime: endDate.toISOString(),
        email: user.email ?? "test@gmail.com",
        eventDescription: description,
      };
      console.log("Request Body:", requestBody);

      // 基本資料檢查：電話號碼/人數/姓名/描述的長度或格式
      await validateData(requestBody);

      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Unknown error");
      }

      showSnackbar("預約成功。", "success");
      // setSnackbarMessage(result.message);
    } catch (err: unknown) {
      showSnackbar((err as Error).message || "請求失敗，請稍後再試。", "error");
    } finally {
      hideDialog();
    }
  };

  useEffect(() => {
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) && !/Chromium/.test(navigator.userAgent);
    if (isSafari) {
      showSnackbar("Safari 可能會有 Cookie 與跨站追蹤阻擋的問題，建議使用 Chrome", "info");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mt-[5px] md:my-5 px-[5%] pb-20 md:pb-0 max-w-[640px] mx-auto">
      <Box component="form" onSubmit={handleSubmit} className="gap-5 flex flex-col justify-center items-center">
        <div className="w-full">
          <TextField
            className="ipt"
            placeholder="申請人姓名"
            variant="outlined"
            sx={{ bgcolor: "white" }}
            fullWidth
            onChange={e => setApplicantName(e.target.value)}
          />
        </div>
        <div className="flex justify-between w-full">
          <TextField className="ipt" fullWidth placeholder="手機號碼" variant="outlined" onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="w-full justify-between flex gap-4">
          <TextField className="ipt" placeholder="人數" variant="outlined" onChange={e => setCrowdSize(e.target.value)} />
          <FormControl className="ipt" fullWidth>
            <InputLabel>借用地點</InputLabel>
            <Select labelId="demo-simple-select-label" placeholder="借用地點" onChange={e => setLocation(e.target.value as string)}>
              <MenuItem value={"小導師室"}>小導師室</MenuItem>
              <MenuItem value={"書房"}>書房</MenuItem>
              <MenuItem value={"橘廳"}>橘廳</MenuItem>
              <MenuItem value={"會議室"}>會議室</MenuItem>
              <MenuItem value={"貢丸室"}>貢丸室</MenuItem>
            </Select>
          </FormControl>
        </div>
        <div className="w-full">
          <DateTimePicker
            className="ipt w-full"
            label="開始日期"
            value={startDate}
            views={["month", "day", "hours", "minutes"]}
            onChange={newValue => setStartDate(newValue)}
          />
        </div>
        <div className="flex justify-between w-full">
          <DateTimePicker
            className="ipt w-full"
            label="結束日期"
            value={endDate}
            views={["month", "day", "hours", "minutes"]}
            onChange={newValue => setEndDate(newValue)}
          />
        </div>
        <div className="w-full">
          <TextField
            className="ipt"
            placeholder="活動簡述（請認真寫！）"
            variant="outlined"
            fullWidth
            onChange={e => setDescription(e.target.value)}
          />
        </div>
      </Box>
      <div className="mt-2 flex flex-col justify-center items-center gap-0.5">
        <div className="px-2 noto font-normal text-gray-400 text-xs text-center leading-relaxed">
          *建議使用 Chrome 等原生瀏覽器，Safari 可能會阻擋，臉書與 Line 瀏覽器則無法使用
        </div>
        {/* <div className="px-2 noto font-normal text-gray-400 text-xs text-center">*已知臉書瀏覽器無法使用</div> */}
        <ConsentCheckbox checked={consent} onChange={handleConsentChange} />
        <Button className="myBtn" type="submit" variant="contained" fullWidth size="large" onClick={handleSubmit}>
          確認送出
        </Button>
      </div>
    </div>
  );
};

export default ApplyForm;
