import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// Only these routes require login
const isProtected = createRouteMatcher(["/app(.*)", "/referrals(.*)"])

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    await auth.protect()
  }
  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!.*\\..*|_next|favicon.ico).*)"],
}