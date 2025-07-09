"use client"

import { SignUp } from "@clerk/nextjs"
import { useSearchParams } from "next/navigation"

export default function SignUpPage() {
  const params = useSearchParams()
  const referrer = params.get("ref")

  return (
    <main className="min-h-screen flex justify-center items-center">
      <SignUp
  path="/sign-up"
  routing="path"
  fallbackRedirectUrl={`/ref-complete?ref=${referrer || ""}`}
/>

    </main>
  )
}

