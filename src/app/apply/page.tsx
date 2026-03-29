import dynamic from 'next/dynamic'
const ApplyForm = dynamic(() => import('../../pages/ApplyForm'), { ssr: false })
export default ApplyForm
