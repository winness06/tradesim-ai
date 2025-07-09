import { Suspense } from "react"
import RefCompleteClient from "./RefCompleteClient"

export default function RefCompletePage() {
  return (
    <Suspense fallback={<div className="text-white text-center p-8">Loading referral setup...</div>}>
      <RefCompleteClient />
    </Suspense>
  )
}
