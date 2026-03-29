'use client'
import dynamic from 'next/dynamic'
const Rule = dynamic(() => import('../../pages/Rule'), { ssr: false })
export default Rule
