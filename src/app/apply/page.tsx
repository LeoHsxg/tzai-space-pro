'use client'
import dynamic from 'next/dynamic'
const ApplyForm = dynamic(() => import('../../views/ApplyForm'), { ssr: false })
export default ApplyForm
