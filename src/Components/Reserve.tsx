import React from "react";
import dayjs from "dayjs";
import { Event } from "../types/event";

// 覆蓋原本的 onClick 會使上層失效
interface ReserveProps {
  onClick: (event: Event) => void;
  key: number;
  event: Event;
}

const Reserve = ({ onClick, event }: ReserveProps) => {
  const {
    start: { dateTime: startTime },
    end: { dateTime: endTime },
    summary: room,
    // colorId,
  } = event;

  const colorMap: Record<string, string> = {
    書房: "#E44C4C", // 紅色
    橘廳: "#FF6F0D", // 橘色
    會議室: "#54A0F9", // 藍色
    小導師室: "#FFD81E", // 黃色
    貢丸室: "#9458E2", // 粉色
  };

  const circleColor = colorMap[room] || "#CCCCCC"; // 預設顏色：灰色
  const st = dayjs(startTime);
  const ed = dayjs(endTime);
  const timeRange = `${st.format("HH:mm")} → ${ed.format("HH:mm")}`;

  const handleClick = () => {
    console.log("完整事件物件:", event);
    // 執行外部傳遞進來的 `onClick`, 很重要！
    onClick(event);
  };

  return (
    <div className="w-full h-12 px-2.5 justify-start items-center gap-[15px] inline-flex">
      <div className="w-4 h-4 rounded-full" style={{ aspectRatio: "1 / 1", backgroundColor: circleColor }} />
      <div className="w-full h-12 flex flex-row px-5 bg-white rounded-[10px] items-center" onClick={handleClick}>
        <div className="basis-3/5 text-black/80 text-sm font-normal font-['Inter']">{timeRange}</div>
        <div className="basis-2/5 text-black/80 text-sm font-normal font-['Inter']">{room}</div>
      </div>
      {/* <div className="bg-red-500 sm:bg-green-500 md:bg-blue-500 lg:bg-yellow-500 xl:bg-purple-500">test</div> */}
    </div>
  );
};

export default Reserve;
