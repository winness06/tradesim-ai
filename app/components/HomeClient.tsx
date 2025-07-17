'use client'

import dynamic from "next/dynamic"
import Home from "@/components/Home" // This is your actual trading logic component

// Dynamically import CandleChart if needed
const CandleChart = dynamic(() => import('@/components/CandleChart'), {
  ssr: false,
})

export default function HomeClientWrapper() {
  return <Home />
}
