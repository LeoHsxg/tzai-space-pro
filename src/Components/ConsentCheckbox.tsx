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
    <div className="flex items-center gap-0.5 mt-1">
      <input type="checkbox" id="consent" checked={checked} onChange={onChange} className="hidden" />
      <label htmlFor="consent" className={`checkbox-label ${checked ? 'checked' : ''}`}>
        {checked && (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </label>
      <span className="text-black/60 text-xs font-normal font-inter">
        {/* 文字本身也是 label，點哪裡都能勾；條例連結另開分頁，不會把填到一半的表單弄丟 */}
        <label htmlFor="consent" className="cursor-pointer">
          本人已詳閱、瞭解並願意遵守
        </label>
        <Link href="/rule" target="_blank" rel="noopener noreferrer" className="underline">
          空間借用條例
        </Link>
      </span>
    </div>
  )
}

export default ConsentCheckbox
