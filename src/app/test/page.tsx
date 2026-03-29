'use client'
import dynamic from 'next/dynamic'
const Test = dynamic(() => import('../../views/Test'), { ssr: false })
export default Test
