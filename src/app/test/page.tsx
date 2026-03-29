'use client'
import dynamic from 'next/dynamic'
const Test = dynamic(() => import('../../pages/Test'), { ssr: false })
export default Test
