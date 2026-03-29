'use client'
import dynamic from 'next/dynamic'
const Rule = dynamic(() => import('../../views/Rule'), { ssr: false })
export default Rule
