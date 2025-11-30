import React from "react";
import { Link } from "react-router-dom";
import "../styles/ConsentCheckbox.css";

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ConsentCheckbox: React.FC<ConsentCheckboxProps> = ({ checked, onChange }) => {
  return (
    <div className="flex items-center gap-0.5 mt-1">
      <input type="checkbox" id="consent" checked={checked} onChange={onChange} className="hidden" />
      <label htmlFor="consent" className={`checkbox-label ${checked ? "checked" : ""}`}>
        {checked && (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </label>
      <span className="text-black/60 text-xs font-normal font-['Inter']">
        本人已詳閱、瞭解並願意遵守
        <Link to="/rule">
          <span className="underline">空間借用條例</span>
        </Link>
      </span>
    </div>
  );
};

export default ConsentCheckbox;
