'use client'
import dynamic from 'next/dynamic'
const Calendar = dynamic(() => import('../views/Calendar'), { ssr: false })
export default Calendar
