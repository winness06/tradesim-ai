"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function RefCompletePage() {
  const params = useSearchParams()
  const referrer = params.get("ref")
  const router = useRouter()

  useEffect(() => {
    const applyReferral = async () => {
      if (!referrer) {
        router.push("/")
        return
      }

      try {
        await fetch("/api/apply-referral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referrer }),
        })
      } catch (err) {
        console.error("Referral error:", err)
      }

      router.push("/")
    }

    applyReferral()
  }, [referrer, router])

  return (
    <main className="min-h-screen flex justify-center items-center text-white">
      <p>Setting up your referral... Please wait</p>
    </main>
  )
}
