'use client'

import React from 'react'
import '../styles/ConsentCheckbox.css'

interface ConsentCheckboxProps {
  checked: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const ConsentCheckbox: React.FC<ConsentCheckboxProps> = ({ checked, onChange }) => {
  return (
    // 整行都是 label，點哪裡都能勾。這裡刻意不放連往 /rule 的連結——
    // 條例在底部導航與側欄都到得了，塞在這裡只會讓人點到就跳走、表單重置。
    <label htmlFor="consent" className="flex items-center gap-0.5 mt-1 cursor-pointer">
      <input type="checkbox" id="consent" checked={checked} onChange={onChange} className="hidden" />
      <span className={`checkbox-label ${checked ? 'checked' : ''}`}>
        {checked && (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <span className="text-black/60 text-xs font-normal font-inter">
        本人已詳閱、瞭解並願意遵守空間借用條例
      </span>
    </label>
  )
}

export default ConsentCheckbox
