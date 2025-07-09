import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { clerkClient } from "@clerk/clerk-sdk-node"

const isProtected = createRouteMatcher(["/((?!sign-in|sign-up|api|_next|favicon.ico).*)"])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()   // ✅ Await required to unpack userId

  if (userId && isProtected(req)) {
    const user = await clerkClient.users.getUser(userId)
    const meta = user.privateMetadata || {}

    if (!meta.referredBy) {
      const refCode = req.nextUrl.searchParams.get("ref") || req.cookies.get("referralCode")?.value

      if (refCode) {
        console.log(`Setting referral for user ${userId}: ${refCode}`)

        await clerkClient.users.updateUserMetadata(userId, {
          privateMetadata: { ...meta, referredBy: refCode },
        })
      }
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!.*\\..*|_next|favicon.ico).*)"],
}
