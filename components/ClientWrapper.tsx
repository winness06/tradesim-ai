"use client"

import { useEffect } from "react"

export default function ClientWrapper({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get("ref")

    if (ref && !localStorage.getItem("referralCode")) {
      localStorage.setItem("referralCode", ref)
      console.log("Referral code saved:", ref)
    }
  }, [])

  return <>{children}</>
}
