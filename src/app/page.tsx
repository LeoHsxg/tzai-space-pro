import dynamic from 'next/dynamic'
const Calendar = dynamic(() => import('../pages/Calendar'), { ssr: false })
export default Calendar
