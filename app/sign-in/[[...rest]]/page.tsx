"use client"

import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <main className="min-h-screen flex justify-center items-center bg-gray-900 text-white">
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </main>
  )
}
