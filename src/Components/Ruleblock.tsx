import React from "react";

interface RuleblockProps {
  text: string;
}

const Ruleblock = ({ text }: RuleblockProps) => {
  return (
    <div className="w-full min-h-15 pt-2.5 pb-3 px-5 bg-white rounded-xl flex items-center">
      <div className="noto font-normal leading-normal text-sm text-black/80">{text}</div>
    </div>
  );
};

export default Ruleblock;
