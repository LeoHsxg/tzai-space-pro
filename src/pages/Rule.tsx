import React, { useEffect, useState } from "react";
import { getRegulationsData } from "../firebase/firebase"; // ← 你設定的 firebase 檔案
import Ruleblock from "../Components/Ruleblock"; // ← 你設定的 Ruleblock 檔案

const Rule = () => {
  const [rules, setRules] = useState<string[]>([]);

  const fetchRules = async () => {
    try {
      const rules: string[] = await getRegulationsData();
      setRules(rules);
    } catch (error) {
      console.error("載入條例失敗:", error);
    }
  };

  // useEffect(() => {
  //   fetchRules();
  // }, []);

  const ruleItems = [
    "小導師室請脫鞋入內, 外層玻璃門自由開關, 但內層防火門嚴禁關閉, 違者立即取消借用及往後借用資格。",
    "使用完畢後，請將空間恢復原狀，並關閉門、窗、燈光、電扇與其他電源。",
    "同一天借用多個不相鄰時段請填寫多份表單。",
    "同一小組的人員一週最多借用三次公共空間，每次至多四小時，違反規定經發現，仁齋齋團隊有權刪除。",
    "借用的預定時間不得提前超過 30 天。",
    "為保障大家使用空間的權益，超過預約三十分鐘內未使用，則視為取消預約，並開放其他齋民直接入內使用空間。",
    "如遭遇任何爭議或對規定不清楚等問題，請聯絡現任齋長，齋長有調解與最終裁決權。",
    "仁齋齋團隊保有對本條例的修改與解釋權。",
    "當您借用或使用任何仁齋公共空間視為您已閱讀、了解並同意本條例的所有內容。",
  ];

  return (
    <div className="w-full md:mt-4">
      {/* <div className="rule pb-[5%]">
        {rules.map((text, idx) => (<div key={idx} className="content">
            {text}
          </div>))}
      </div> */}
      <div className="w-full pb-20 md:max-w-[900px] m-auto md:pb-0 ">
        <p
          className="
          -mt-1 mb-3 px-[8%] noto font-bold text-black/80 text-lg
          md:mt-0 md:pl-4 md:pr-0
        ">
          空間借用條例
        </p>
        <div
          className="
            w-full px-[5%] self-stretch flex flex-col gap-3 justify-start items-center md:px-0
            md:h-[450px] md:flex-wrap
        ">
          {ruleItems.map((text, index) => (
            <div key={index} className="w-full md:w-[calc(50%-0.5rem)]">
              <Ruleblock key={index} text={text} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Rule;
