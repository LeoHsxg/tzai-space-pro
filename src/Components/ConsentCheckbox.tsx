'use client'

import React, { useId } from 'react'
import Link from 'next/link'
import '../styles/ConsentCheckbox.css'

interface ConsentCheckboxProps {
  checked: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const ConsentCheckbox: React.FC<ConsentCheckboxProps> = ({ checked, onChange }) => {
  // 每個實例要有自己的 id。手機版申請抽屜（Calendar.tsx）是用 CSS 藏的、永遠掛在 DOM 上，
  // 桌面版 Dialog 開啟時會有第二份 ApplyForm；若 id 寫死，label 會綁到 document 裡
  // 第一個同名 input——也就是藏起來的那個手機版——桌面版就永遠點不動。
  const id = useId()

  return (
    // 整行都是 label，點圓圈或點文字都能勾，不必先讀過條例。
    // 「空間借用條例」仍連往 /rule，stopPropagation 讓它只跳轉、不順手切換勾選。
    <label htmlFor={id} className="flex items-center gap-0.5 mt-1 cursor-pointer">
      <input type="checkbox" id={id} checked={checked} onChange={onChange} className="hidden" />
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
