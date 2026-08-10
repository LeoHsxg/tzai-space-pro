'use client'

import React from 'react'
import Link from 'next/link'
import '../styles/ConsentCheckbox.css'

interface ConsentCheckboxProps {
  checked: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const ConsentCheckbox: React.FC<ConsentCheckboxProps> = ({ checked, onChange }) => {
  return (
    // 整行都是 label，點圓圈或點文字都能勾——不必先讀過條例才勾得動。
    // 「空間借用條例」仍然是連往 /rule 的連結，stopPropagation 讓它只跳轉、不順手切換勾選。
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
        本人已詳閱、瞭解並願意遵守
        <Link href="/rule" onClick={e => e.stopPropagation()} className="underline">
          空間借用條例
        </Link>
      </span>
    </label>
  )
}

export default ConsentCheckbox
